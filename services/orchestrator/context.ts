
import { GenerateContentResponse, Type } from "@google/genai";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { optimizeImagePayload } from "../../lib/utils";
import { cleanJson } from "./utils";

/**
 * VISION ANALYSIS: Identify the main subject in an image.
 * Uses Gemini 3 Flash for high speed and low latency.
 */
export const identifyVisualSubject = async (imageContent: string): Promise<string> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    
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
      }), 2, 1000, model); 
      
      return response.text?.trim() || "Đối tượng trong ảnh";
    } catch (e) {
      console.warn("Context identification failed", e);
      return "Đối tượng trong ảnh";
    }
  });
};

/**
 * VISION OCR: Extract instructions/requests from screenshots or notes.
 */
export const extractIntentionFromImage = async (imageContent: string): Promise<string | null> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    
    // Vision Profile
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const prompt = `
      [SYSTEM ROLE: VISUAL REQUEST PARSER]
      TASK: Analyze the image. Is this a SCREENSHOT containing text instructions, a FEEDBACK NOTE, or a DOCUMENT?
      
      LOGIC:
      1. IF the image contains legible text instructions (e.g., chat screenshot, email, sticky note with "Change this color"):
         -> EXTRACT the core request/instruction into clear Vietnamese text.
         -> Ignore UI elements (time, battery, unrelated menu).
      2. IF the image is just a photo/art/product without specific instructions:
         -> Return NULL.
      
      OUTPUT JSON:
      {
        "isInstruction": boolean,
        "extractedText": "The extracted request in Vietnamese (or null)"
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
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    isInstruction: { type: Type.BOOLEAN },
                    extractedText: { type: Type.STRING }
                }
            }
        }
      }), 2, 1500, model); 
      
      const data = JSON.parse(cleanJson(response.text || "{}"));
      if (data.isInstruction && data.extractedText) {
          return data.extractedText;
      }
      return null;
    } catch (e) {
      console.warn("Intent extraction failed", e);
      return null;
    }
  });
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
