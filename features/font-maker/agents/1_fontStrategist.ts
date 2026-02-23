
import { Type, GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../../lib/gemini";
import { optimizeImagePayload } from "../../../lib/utils";
import { cleanJson } from "../../../services/orchestrator/utils";
import { executeManagedTask } from "../../../lib/tieredExecutor";

export interface FontStrategy {
  classification: string;
  strokeStyle: string;
  usageScope: string;
  gridConfig: string;
  emotionalVibe: string;
  visualDescription: string; // CRITICAL: Text description of the stroke style
}

export const runFontStrategist = async (imageContent: string): Promise<FontStrategy> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview";
    const backupModel = "gemini-3-flash-preview";
    
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const prompt = `
      [VAI TRÒ: AGENT 1 - FONT STRATEGIST]
      NHIỆM VỤ: Phân tích mẫu chữ viết tay/thô đầu vào (Seed Characters).
      
      YÊU CẦU QUAN TRỌNG:
      - Phân tích kỹ nét bút (Stroke): Độ dày, độ nghiêng, độ xước (texture).
      - Tạo ra trường "visualDescription" bằng TIẾNG ANH mô tả cực kỳ chi tiết phong cách này để họa sĩ khác có thể vẽ lại mà không cần nhìn ảnh gốc.
      
      OUTPUT JSON:
      {
        "classification": "Serif / Sans-serif / Script / Display / Handwritten",
        "strokeStyle": "Monoline / Brush / Variable Width / Grunge / Calligraphic",
        "usageScope": "Logo Only / Headline / Body Text / Decorative",
        "gridConfig": "Condensed / Regular / Extended / Loose",
        "emotionalVibe": "Vui vẻ / Nghiêm túc / Cổ điển / Hiện đại / Phá cách",
        "visualDescription": "A bold, handwritten brush font with dry ink texture, slight right slant, and variable stroke width..."
      }
    `;

    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { type: Type.STRING },
          strokeStyle: { type: Type.STRING },
          usageScope: { type: Type.STRING },
          gridConfig: { type: Type.STRING },
          emotionalVibe: { type: Type.STRING },
          visualDescription: { type: Type.STRING }
        },
        required: ["classification", "strokeStyle", "visualDescription"]
      }
    };

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
        config
      }),
      3, 1000, model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
        config
      })
    );

    return JSON.parse(cleanJson(response.text || "{}"));
  });
};
