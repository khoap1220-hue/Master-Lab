
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

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
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;

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
        responseMimeType: "application/json"
    };

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config
      }),
      2,
      1000,
      model,
      [() => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] },
        config
      })]
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
 * Generate Style Specs (Artistic DNA, Palette)
 */
export const generateStyleSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: GIÁM ĐỐC NGHỆ THUẬT (ART DIRECTOR).
      NHIỆM VỤ: Lập hồ sơ đặc tả phong cách nghệ thuật cho: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      1. **ARTISTIC DNA:** Phân tích các yếu tố cốt lõi tạo nên phong cách.
      2. **COLOR PALETTE:** Bảng màu chi tiết (Hex codes) và ý nghĩa.
      3. **TEXTURE & BRUSHWORK:** Các đặc điểm về chất liệu, nét vẽ, bề mặt.
      4. **LIGHTING & ATMOSPHERE:** Cách xử lý ánh sáng và bầu không khí.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      2,
      1000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập hồ sơ đặc tả phong cách.";
  });
};
