
import { GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { optimizeImagePayload } from "../../lib/utils";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

/**
 * VISION ANALYSIS: Identify the main subject in an image.
 * Uses Gemini 3 Flash for high speed and low latency.
 */
export const identifyVisualSubject = async (imageContent: string): Promise<string> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST;
    
    // SMART PRE-OPTIMIZATION: Vision Profile (1024px)
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const prompt = `
      [SYSTEM ROLE: VISUAL TAGGER]
      TASK: Identify the MAIN SUBJECT in this image immediately.
      
      INSTRUCTIONS:
      - Ignore background, lighting, or style. Focus ONLY on the core object/character.
      - Return a concise Vietnamese phrase.
      - Examples: "Tô phở bò tái", "Người mẫu nam mặc vest", "Chai nước hoa vỏ thủy tinh".
      
      OUTPUT: Single phrase only. No intro.
    `;

    try {
      const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { 
          parts: [
            { text: prompt }, 
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
          ] 
        }
      }), 2, 1000, model,
      [] // Empty array for no fallbacks
      ); 
      
      return response.text?.trim() || "Đối tượng trong ảnh";
    } catch (e: any) {
      console.warn("Context identification failed", e);
      if (e.message && e.message.includes('403')) throw e;
      return "Đối tượng trong ảnh";
    }
  });
};

/**
 * VISION OCR & INTENT ANALYSIS: Extract instructions/requests from screenshots or notes.
 * [UPGRADE]: Now analyzes design intent even without explicit text (e.g. arrows, circles).
 */
export const extractIntentionFromImage = async (imageContent: string): Promise<string | null> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST;
    
    // Vision Profile
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const prompt = `
      [SYSTEM ROLE: VISUAL REQUEST PARSER & DESIGN ANALYST]
      TASK: Analyze the image to understand the USER'S INTENT.
      
      SCENARIOS:
      1. SCREENSHOT/TEXT: If it contains chat logs, emails, or notes -> Extract the core request.
      2. ANNOTATION: If it has hand-drawn arrows, circles, or cross-outs -> Interpret what they mean (e.g., "Remove this object", "Move this here").
      3. UI MOCKUP: If it's a wireframe -> Describe the layout intent.
      4. REFERENCE: If it's a style reference -> Extract key style keywords (e.g., "Minimalist", "Cyberpunk").
      
      OUTPUT JSON:
      {
        "hasIntent": boolean,
        "intentType": "INSTRUCTION" | "CORRECTION" | "STYLE_REF" | "CONTENT" | "UNKNOWN",
        "extractedText": "The extracted request or interpretation in Vietnamese",
        "confidence": number (0-1)
      }
    `;

    try {
      const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { 
          parts: [
            { text: prompt }, 
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
          ] 
        },
        config: {
          responseMimeType: "application/json"
        }
      }), 2, 1000, model,
      [] // Empty array for no fallbacks
      ); 
      
      const data = JSON.parse(cleanJson(response.text || "{}"));
      if (data.hasIntent && data.extractedText && data.confidence > 0.6) {
          return `[VISUAL INTENT: ${data.intentType}] ${data.extractedText}`;
      }
      return null;
    } catch (e: any) {
      console.warn("Intent extraction failed", e);
      if (e.message && e.message.includes('403')) throw e;
      return null;
    }
  });
};

/**
 * CONTEXT ENRICHMENT: Analyze chat history to understand implicit context.
 */
export const enrichContextFromHistory = async (
  currentInput: string,
  history: any[]
): Promise<string> => {
  if (!history || history.length === 0) return currentInput;

  // Only look at the last 3 turns to keep it relevant and fast
  const recentHistory = history.slice(-3).map(msg => `${msg.role}: ${msg.text}`).join('\n');

  const ai = getAI();
  const model = MODELS.TEXT_FAST;

  const prompt = `
    [SYSTEM ROLE: CONTEXT RESOLVER]
    TASK: Rewrite the CURRENT INPUT to be fully self-contained based on HISTORY.
    
    HISTORY:
    ${recentHistory}
    
    CURRENT INPUT: "${currentInput}"
    
    RULES:
    1. Resolve pronouns (it, that, him, her) to specific objects/subjects from history.
    2. If input is "Make it blue", and history was about a "Red Car", rewrite to "Make the Red Car blue".
    3. Keep it concise. Return ONLY the rewritten input.
    4. If no context is needed, return CURRENT INPUT as is.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] }
    }), 1, 1000, model,
    [] // Empty array for no fallbacks
    );

    return response.text?.trim() || currentInput;
  } catch (e: any) {
    if (e.message && e.message.includes('403')) throw e;
    return currentInput;
  }
};

/**
 * PROMPT ENRICHMENT: Construct a storyboard-aware prompt.
 * Combines the user's action with the identified subject and sequence context.
 */
export const buildStoryboardPrompt = (
  action: string,
  subjectIdentity: string,
  prevAction: string | null
): string => {
  const sequenceContext = prevAction 
    ? `(STATE TRANSITION: This visual follows the previous event: "${prevAction}")` 
    : `(INITIAL STATE: Start of the sequence)`;

  return `
    [MODE: STORYBOARD_SEQUENCE]
    ---------------------------------------------------
    1. SUBJECT IDENTITY (CHARACTER REF): ${subjectIdentity || 'Main Subject'}
       * Keep the subject's key features (face, clothes, product type) consistent.
    
    2. CURRENT ACTION (THE CHANGE): ${action}
       * Apply this specific movement/change to the subject.
    
    3. NARRATIVE CONTEXT: ${sequenceContext}
       * Ensure logical continuity from the previous state.
    ---------------------------------------------------
    INSTRUCTION: Render the SUBJECT performing the ACTION. Prioritize semantic accuracy over pixel-perfect structure match.
  `;
};
