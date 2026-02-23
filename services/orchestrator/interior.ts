
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * Interior / Floor Plan Strategy
 */
export const planInteriorProject = async (
  userRequest: string,
  viewMode: string
): Promise<{
  visualPrompt: string;
  structuredBrief?: string;
  sources: GroundingSource[];
}> => {
  return executeManagedTask('STRATEGY_PLANNING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KIẾN TRÚC SƯ CHỦ TRÌ (LEAD ARCHITECT).
      
      INPUT:
      - Yêu cầu: "${userRequest}"
      - Chế độ hiển thị: "${viewMode}" (VD: 2D Tech, 3D Cutaway)
      
      NHIỆM VỤ: Phân tích công năng và thẩm mỹ không gian.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "High-fidelity architectural prompt describing Layout, Zoning, Lighting, Materials and View Angle...",
        "structuredBrief": "Markdown Content describing: 1. Zoning Logic, 2. Flow of Movement, 3. Key Furniture Pieces..."
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

/**
 * Generate Interior Specs (BOQ, Finishes)
 */
export const generateInteriorSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KIẾN TRÚC SƯ TRIỂN KHAI (TECHNICAL ARCHITECT).
      NHIỆM VỤ: Lập bảng chỉ dẫn kỹ thuật thi công nội thất cho: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      1. **BẢNG MÃ VẬT LIỆU (FINISHES SCHEDULE):** Sàn, Tường, Trần.
      2. **ĐỒ NỘI THẤT (FURNITURE LIST):** Kích thước, Vật liệu.
      3. **HỆ THỐNG CƠ ĐIỆN (M&E NOTES):** Ổ cắm, Đèn.
      4. **LƯU Ý THI CÔNG:** Chống thấm, Mối nối.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập hồ sơ kỹ thuật nội thất.";
  });
};
