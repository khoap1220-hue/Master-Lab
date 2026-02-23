
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * Logo Design Strategy Planning
 * Analyzes Brand DNA -> Suggests Visual Concepts based on Shape Psychology
 */
export const planLogoDesign = async (
  userRequest: string,
  logotype: string,
  styleInjectors: string[]
): Promise<{
  visualPrompt: string;
  structuredBrief?: string;
  sources: GroundingSource[];
  trendsSummary?: string;
}> => {
  return executeManagedTask('STRATEGY_PLANNING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KIẾN TRÚC SƯ NHẬN DIỆN THƯƠNG HIỆU (BRAND IDENTITY ARCHITECT).
      
      INPUT:
      - Yêu cầu/Tên Brand: "${userRequest}"
      - Loại Logo (Logotype): "${logotype}"
      - Phong cách mong muốn: "${styleInjectors.join(', ')}"
      
      NHIỆM VỤ: Phân tích và đề xuất concept logo dựa trên Tâm lý học Hình học (Shape Psychology).
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed prompt for generating the logo. Must specify: FLAT VECTOR, NO MOCKUP, WHITE BACKGROUND, CENTERED...",
        "structuredBrief": "Markdown Content describing: 1. Core Concept (Metaphor), 2. Shape Psychology (Why circle/square?), 3. Color Theory, 4. Typography Choice...",
        "trendsSummary": "Short note on current logo trends relevant to this industry."
      }
    `;

    const config = {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: { type: Type.STRING },
            structuredBrief: { type: Type.STRING },
            trendsSummary: { type: Type.STRING }
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
      trendsSummary: data.trendsSummary,
      sources: []
    };
  });
};

/**
 * Generate Logo Usage Guidelines (Safety Zone, Colors, Typography)
 */
export const generateLogoSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: GIÁM ĐỐC SÁNG TẠO (CREATIVE DIRECTOR).
      NHIỆM VỤ: Lập quy chuẩn sử dụng Logo (Brand Guidelines Mini) cho thiết kế: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      
      1. **CẤU TRÚC HÌNH HỌC (GRID SYSTEM):**
         - Tỷ lệ đồ họa/chữ.
         - Quy tắc lưới (nếu áp dụng).
      
      2. **VÙNG AN TOÀN (CLEARSPACE):**
         - Quy định khoảng cách tối thiểu xung quanh logo (thường tính bằng x - chiều cao chữ).
         - Kích thước tối thiểu cho in ấn và kỹ thuật số.
      
      3. **BẢNG MÀU CHUẨN (COLOR PALETTE):**
         - Màu chính (Primary): Mã Hex, CMYK, RGB.
         - Màu phụ (Secondary/Accent).
      
      4. **TYPOGRAPHY (PHÔNG CHỮ):**
         - Font tiêu đề.
         - Font nội dung.
      
      5. **ĐIỀU CẤM KỴ (DOs & DON'Ts):**
         - Không làm méo logo.
         - Không đổi màu tùy tiện.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập quy chuẩn logo.";
  });
};
