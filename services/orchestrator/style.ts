
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * Style Transfer Analysis
 */
export const planStyleTransfer = async (
  userRequest: string,
  mode: string
): Promise<{
  visualPrompt: string;
  structuredBrief?: string;
  sources: GroundingSource[];
}> => {
  return executeManagedTask('ANALYSIS_DEEP', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: CHUYÊN GIA PHÂN TÍCH PHONG CÁCH NGHỆ THUẬT (ART HISTORIAN / STYLE CRITIC).
      
      INPUT:
      - Yêu cầu chuyển đổi: "${userRequest}"
      - Chế độ: "${mode}" (VD: Giữ cấu trúc, Tự do)
      
      NHIỆM VỤ: Phân tích "DNA Phong cách" mục tiêu và viết Prompt để áp dụng nó lên ảnh gốc.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Instruction to Apply Style [Style Name]. Key Elements: [Brushwork, Palette, Lighting]. Maintain structure of original image...",
        "structuredBrief": "Markdown Content describing: 1. Target Style DNA, 2. Key Artistic Techniques to mimic, 3. Transformation Strategy..."
      }
    `;

    const config = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: { type: Type.STRING },
            structuredBrief: { type: Type.STRING }
          },
          required: ["visualPrompt", "structuredBrief"]
        }
    } as any;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config
      }),
      3,
      2000,
      model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] },
        config
      })
    );

    const data = JSON.parse(cleanJson(response.text || "{}"));

    return {
      visualPrompt: data.visualPrompt,
      structuredBrief: data.structuredBrief,
      sources: []
    };
  });
};
