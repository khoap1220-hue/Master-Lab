
import { GoogleGenAI } from "@google/genai";
import { getCurrentKey, rotateKey, getKeyPool } from "./keyManager";
import { incrementQuota, checkQuotaAvailable } from "./quotaManager";

let cachedAI: GoogleGenAI | null = null;
let cachedKey: string | null = null;

export const getAI = () => {
  // Prioritize API_KEY (paid/user-selected) then GEMINI_API_KEY (free/env)
  const apiKey = getCurrentKey();

  if (!apiKey) {
    console.error("[Gemini] API Key is missing! Checked API_KEY and GEMINI_API_KEY.");
    throw new Error("Connection Failed: API Key is missing. Please ensure GEMINI_API_KEY is set in your environment or select a key.");
  }

  // Return cached instance if key hasn't changed
  if (cachedAI && cachedKey === apiKey) {
    return cachedAI;
  }

  const ai = new GoogleGenAI({ apiKey });
  cachedKey = apiKey;

  // Global 503/429 Fallback Interceptor
  const originalGenerateContent = ai.models.generateContent.bind(ai.models);
  
  const wrappedGenerateContent = async (req: any, rotationCount = 0, tenacityCount = 0): Promise<any> => {
      try {
          const res = await originalGenerateContent(req);
          incrementQuota(req.model);
          return res;
      } catch (error: any) {
          const status = error.status || error.response?.status;
          const message = (error.message || "").toLowerCase();
          const is503 = status === 503 || message.includes('503') || message.includes('unavailable') || message.includes('overloaded') || message.includes('high demand');
          const is429 = status === 429 || message.includes('429') || message.includes('quota') || message.includes('exhausted');
          const is500 = status === 500 || message.includes('500') || message.includes('internal');
          
          const isOverloaded = is503 || is429 || is500;
          
          // API Key Rotation Logic for 429
          const poolSize = getKeyPool().length;
          if (is429 && rotationCount < poolSize) {
              const rotated = rotateKey();
              if (rotated) {
                  console.warn(`[KeyManager] Encountered 429. Rotated API Key (${rotationCount + 1}/${poolSize}). Retrying...`);
                  // Reset cache so next getAI() gets new key
                  cachedAI = null;
                  cachedKey = null;
                  
                  const nextAI = getAI();
                  await new Promise(r => setTimeout(r, 1000)); 
                  return await (nextAI.models.generateContent as any)(req, rotationCount + 1, tenacityCount);
              }
          }

          // Tenacity Logic (Exponential Backoff & Fallback)
          if (isOverloaded) {
              if (tenacityCount < 3) {
                  const delay = Math.pow(2, tenacityCount) * 1000; // 1s, 2s, 4s
                  console.warn(`[Tenacity] Lỗi ${status || '503'}/Quá tải. Thử lại lần ${tenacityCount + 1}/3 sau ${delay}ms...`);
                  await new Promise(r => setTimeout(r, delay));
                  return await wrappedGenerateContent(req, rotationCount, tenacityCount + 1);
              } else {
                  console.warn(`[Tenacity] Đã thử 3 lần vẫn lỗi. Tự động Fallback theo Hierarchy...`);
                  
                  const isPro = !!(process.env.API_KEY || localStorage.getItem('has_user_api_key') === 'true');
                  let fallbackModel = req.model;
                  
                  // Model Hierarchy Logic
                  if (isPro) {
                      // Pro Image Hierarchy: Banana -> Pro Image -> 2.5 Flash Image
                      if (req.model === 'gemini-3.1-flash-image') fallbackModel = 'gemini-3-pro-image';
                      else if (req.model === 'gemini-3-pro-image') fallbackModel = 'gemini-2.5-flash-image';
                      // Pro Research Hierarchy: 3.1 Pro -> Lite -> 3.5 Flash
                      else if (req.model === 'gemini-3.1-pro-preview') fallbackModel = 'gemini-3.1-flash-lite';
                      else if (req.model === 'gemini-3.1-flash-lite') fallbackModel = 'gemini-3.5-flash';
                  } else {
                      // Free Research Hierarchy: Gemma 31B -> 26B -> Lite -> 3.5 Flash
                      if (req.model === 'gemma-4-31b-it') fallbackModel = 'gemma-4-26b-it';
                      else if (req.model === 'gemma-4-26b-it') fallbackModel = 'gemini-3.1-flash-lite';
                      else if (req.model === 'gemini-3.1-flash-lite') fallbackModel = 'gemini-3.5-flash';
                  }
                  
                  // Handle Gemma restrictions (disable tools)
                  const nextReq = { ...req };
                  if (fallbackModel.startsWith('gemma')) {
                      if (nextReq.tools) delete nextReq.tools;
                  }
                  
                  // Use Free Key if current key is failing and we are falling back to a free-tier model
                  const freeKey = process.env.GEMINI_API_KEY || getKeyPool()[0];
                  
                  if (fallbackModel !== req.model || (freeKey && freeKey !== cachedKey)) {
                      console.info(`[Fallback] Switching from ${req.model} to ${fallbackModel}`);
                      const nextAI = new GoogleGenAI({ apiKey: (isPro ? cachedKey! : freeKey) || freeKey || cachedKey! });
                      return await nextAI.models.generateContent({ ...nextReq, model: fallbackModel });
                  }
              }
          }
          throw error;
      }
  };

  ai.models.generateContent = wrappedGenerateContent as any;

  // Wrap generateVideos for quota tracking
  if (ai.models.generateVideos) {
    const originalGenerateVideos = ai.models.generateVideos.bind(ai.models);
    ai.models.generateVideos = async (req: any) => {
      const res = await originalGenerateVideos(req);
      incrementQuota(req.model);
      return res;
    };
  }

  cachedAI = ai;
  return ai;
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
    const refusalText = res?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    if (refusalText) {
        console.warn(`[Neural Validator] Model returned text instead of image (${refusalText.length} chars): ${refusalText.slice(0, 200)}...`);
        // If it's a known refusal pattern, we can be more specific
        if (refusalText.toLowerCase().includes("cannot") || refusalText.toLowerCase().includes("sorry") || refusalText.toLowerCase().includes("unable")) {
             return false;
        }
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
  expectImage = false,
  onSuccess?: (model: string) => void
): Promise<T> {

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const execute = async (fn: AsyncOperation<T>, attemptsRemaining: number, fallbackList: AsyncOperation<T>[], currentModelName: string): Promise<T> => {
    const attempt = retries - attemptsRemaining;

    // Check quota before execution
    if (!checkQuotaAvailable(currentModelName)) {
        console.warn(`[QuotaManager] Hạn mức cho model ${currentModelName} đã hết.`);
        if (fallbackList.length > 0) {
            const [nextFn, ...remaining] = fallbackList;
            console.warn(`[${currentModelName}] Switching to Fallback due to quota limit...`);
            let fallbackModelName = `${currentModelName}-Fallback`;
            if (currentModelName === 'gemini-3.1-flash-image') fallbackModelName = 'gemini-3-pro-image';
            else if (currentModelName === 'gemini-3-pro-image') fallbackModelName = 'gemini-2.5-flash-image';
            else if (currentModelName === 'gemini-3.1-pro-preview') fallbackModelName = 'gemini-3.1-flash-lite';
            else if (currentModelName === 'gemma-4-31b-it') fallbackModelName = 'gemma-4-26b-it';
            
            return callWithRetry(nextFn, 2, 1000, fallbackModelName, remaining, timeoutMs, expectImage, onSuccess);
        } else {
            throw new Error(`Bạn đã hết hạn mức sử dụng cho mô hình ${currentModelName} hôm nay. Vui lòng thử lại vào ngày mai hoặc dùng mô hình khác.`);
        }
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: ${Math.round(timeoutMs/1000)}s`)), timeoutMs)
      );

      const response = await Promise.race([fn(), timeoutPromise]);

      if (expectImage && !validateResponseContent(response, true)) {
          const resText = (response as any)?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
          throw new Error(`Neural Refusal: Model [${currentModelName}] returned text instead of imagery. Content: ${resText.slice(0, 100)}...`);
      }

      if (onSuccess) onSuccess(currentModelName);
      return response as T;

    } catch (error: any) {
      const status = error.status || error.response?.status;
      const message = (error.message || "").toLowerCase();
      
      // ERROR CLASSIFICATION
      const is403 = status === 403 || message.includes('403') || message.includes('permission') || message.includes('not authorized');
      const is503 = status === 503 || message.includes('503') || message.includes('unavailable') || message.includes('overloaded') || message.includes('high demand');
      const isThrottled = status === 429 || message.includes('429') || message.includes('quota') || message.includes('exhausted');
      const isNetwork = message.includes('fetch') || message.includes('network') || message.includes('econnreset');
      
      if (is503 || isThrottled) reportModelSickness(currentModelName);

      // Handle 403 by attempting rotation if pool exists
      if (is403) {
          const poolSize = getKeyPool().length;
          if (poolSize > 1) {
              const rotated = rotateKey();
              if (rotated) {
                  console.warn(`[KeyManager] Encountered 403. Rotated API Key. Retrying...`);
                  // Reset cache
                  cachedAI = null;
                  cachedKey = null;
                  await wait(2000);
                  return execute(fn, attemptsRemaining, fallbackList, currentModelName);
              }
          }
          if (currentModelName.toLowerCase().includes('veo') || currentModelName.toLowerCase().includes('video')) {
              throw new Error(`Permission Denied (403): Mô hình tạo video Veo yêu cầu một API Key từ một Project đã kích hoạt thanh toán (Paid Project). Vui lòng chọn API Key phù hợp hoặc chuyển sang tính năng tạo ảnh.`);
          }
          throw error;
      }

      // Tenacity is handled by wrappedGenerateContent, so callWithRetry only handles network errors
      const shouldRetry = isNetwork;

      if (attemptsRemaining > 0 && shouldRetry) {
        const cap = 30000;
        let delay = Math.min(cap, baseDelay * Math.pow(2, attempt) + Math.random() * (baseDelay / 2));
        
        console.warn(`[${currentModelName}] Retry (${attempt + 1}/${retries}) due to ${status || 'Error'}. Waiting ${Math.round(delay)}ms...`);
        await wait(delay);
        return execute(fn, attemptsRemaining - 1, fallbackList, currentModelName);
      }

      if (fallbackList.length > 0) {
          const [nextFn, ...remaining] = fallbackList;
          console.warn(`[${currentModelName}] Switching to Fallback...`);
          let fallbackModelName = `${currentModelName}-Fallback`;
          if (currentModelName === 'gemini-3.1-flash-image') fallbackModelName = 'gemini-3-pro-image';
          else if (currentModelName === 'gemini-3-pro-image') fallbackModelName = 'gemini-2.5-flash-image';
          else if (currentModelName === 'gemini-3.1-pro-preview') fallbackModelName = 'gemini-3.1-flash-lite';
          else if (currentModelName === 'gemma-4-31b-it') fallbackModelName = 'gemma-4-26b-it';
          
          return callWithRetry(nextFn, 2, 1000, fallbackModelName, remaining, timeoutMs, expectImage, onSuccess);
      }

      if (is503) {
          throw new Error(`Hệ thống AI đang quá tải (503 High Demand). Vui lòng đợi vài phút và thử lại.`);
      }

      if (isThrottled) {
          throw new Error(`Bạn đã hết hạn mức sử dụng (429 Quota Exceeded). Vui lòng kiểm tra lại gói dịch vụ hoặc đợi đến khi hạn mức được làm mới.`);
      }

      throw error;
    }
  };

  const fallbacks = fallbackFns ? (Array.isArray(fallbackFns) ? fallbackFns : [fallbackFns]) : [];
  return execute(primaryFn, retries, fallbacks, modelName);
}
