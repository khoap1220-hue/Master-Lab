
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const getAI = () => {
  // Prioritize API_KEY (paid/user-selected) then GEMINI_API_KEY (free/env)
  // We do NOT cache the instance to ensure we always use the latest key if it changes (e.g. via UI selection)
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Gemini] API Key is missing! Checked API_KEY and GEMINI_API_KEY.");
    throw new Error("Connection Failed: API Key is missing. Please ensure GEMINI_API_KEY is set in your environment or select a key.");
  }

  return new GoogleGenAI({ apiKey });
};

type AsyncOperation<T> = () => Promise<T>;

// --- CIRCUIT BREAKER ---
const modelHealthRegistry = new Map<string, number>(); 
const COOLDOWN_PERIOD = 60000; 

const reportModelSickness = (modelName: string) => {
  console.warn(`[Circuit Breaker] 🔴 Model ${modelName} overloaded.`);
  modelHealthRegistry.set(modelName, Date.now() + COOLDOWN_PERIOD);
};

const isModelHealthy = (modelName: string): boolean => {
  const cooldownUntil = modelHealthRegistry.get(modelName);
  return !cooldownUntil || Date.now() > cooldownUntil;
};

/**
 * [V8.1 OPTIMIZATION] Deep Response Validator
 */
const validateResponseContent = (res: any, expectImage: boolean): boolean => {
    if (!expectImage) return true;
    if (res?.generatedImages?.[0]?.image?.imageBytes) return true;
    const hasImagePart = res?.candidates?.[0]?.content?.parts?.some((p: any) => p.inlineData);
    if (hasImagePart) return true;
    const refusalText = res?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("");
    if (refusalText && refusalText.length > 50) {
        console.warn(`[Neural Validator] Detect Text Refusal: ${refusalText.slice(0, 50)}...`);
        return false;
    }
    return false;
};

export async function callWithRetry<T>(
  primaryFn: AsyncOperation<T>, 
  retries = 3, 
  baseDelay = 2000, 
  modelName: string = "Primary",
  fallbackFns: AsyncOperation<T>[] | AsyncOperation<T> | undefined = undefined, 
  timeoutMs: number = 600000,
  expectImage = false 
): Promise<T> {

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const execute = async (fn: AsyncOperation<T>, attemptsRemaining: number, fallbackList: AsyncOperation<T>[]): Promise<T> => {
    const attempt = retries - attemptsRemaining;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: ${Math.round(timeoutMs/1000)}s`)), timeoutMs)
      );

      const response = await Promise.race([fn(), timeoutPromise]);

      if (expectImage && !validateResponseContent(response, true)) {
          throw new Error("Neural Refusal: Model returned text instead of imagery.");
      }

      return response as T;

    } catch (error: any) {
      const status = error.status || error.response?.status;
      const message = (error.message || "").toLowerCase();
      
      // ERROR CLASSIFICATION
      const is403 = status === 403 || message.includes('403') || message.includes('permission') || message.includes('not authorized');
      const is503 = status === 503 || message.includes('503') || message.includes('unavailable') || message.includes('overloaded');
      const isThrottled = status === 429 || message.includes('429') || message.includes('quota') || message.includes('exhausted');
      const isNetwork = message.includes('fetch') || message.includes('network') || message.includes('econnreset');
      
      if (is503 || isThrottled) reportModelSickness(modelName);

      // DO NOT RETRY 403 - It requires user action (changing API key)
      if (is403) {
          throw new Error(`Permission Denied (403): Vui lòng chọn API Key từ một Project đã bật thanh toán (Paid Project).`);
      }

      const shouldRetry = is503 || isThrottled || isNetwork;

      if (attemptsRemaining > 0 && shouldRetry) {
        const cap = 20000;
        const delay = Math.min(cap, baseDelay * Math.pow(2, attempt) + Math.random() * (baseDelay / 2));
        console.warn(`[${modelName}] Retry (${attempt + 1}/${retries}) due to ${status || 'Error'}. Waiting ${Math.round(delay)}ms...`);
        await wait(delay);
        return execute(fn, attemptsRemaining - 1, fallbackList);
      }

      if (fallbackList.length > 0) {
          const [nextFn, ...remaining] = fallbackList;
          console.warn(`[${modelName}] Switching to Fallback...`);
          return callWithRetry(nextFn, 3, 2000, `${modelName}-Fallback`, remaining, timeoutMs, expectImage);
      }

      throw error;
    }
  };

  const fallbacks = fallbackFns ? (Array.isArray(fallbackFns) ? fallbackFns : [fallbackFns]) : [];
  return execute(primaryFn, retries, fallbacks);
}
