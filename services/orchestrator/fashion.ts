
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * Fashion Strategy Planning
 */
export const planFashionCollection = async (
  userRequest: string,
  categoryType: string
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
      VAI TRÒ: GIÁM ĐỐC SÁNG TẠO THỜI TRANG (CREATIVE DIRECTOR).
      
      INPUT:
      - Ý tưởng: "${userRequest}"
      - Phân loại: "${categoryType}" (VD: Haute Couture, Streetwear)
      
      NHIỆM VỤ: Phác thảo ý tưởng bộ sưu tập (Collection) và định hướng hình ảnh.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed prompt for Fashion Photography (Model, Pose, Lighting, Fabric Texture)...",
        "structuredBrief": "Markdown Content describing: 1. Mood & Inspiration, 2. Key Silhouettes, 3. Color Palette & Fabric...",
        "trendsSummary": "Short note on current runway trends related to this request."
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
 * Generate Fashion Tech Pack (Specs)
 */
export const generateTechPack = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KỸ THUẬT VIÊN MAY MẶC (GARMENT TECHNOLOGIST).
      NHIỆM VỤ: Lập hồ sơ kỹ thuật (Tech Pack) cho mẫu thiết kế: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      
      1. **BẢNG THÔNG SỐ (MEASUREMENT SPEC):**
         - Form dáng: (VD: Oversized, Slim Fit).
         - Thông số cơ bản (Size M): Dài áo, Rộng vai, Vòng ngực.
      
      2. **ĐỊNH MỨC NGUYÊN PHỤ LIỆU (BOM):**
         - Vải chính: (VD: Cotton 100% 2 chiều, định lượng 250gsm).
         - Vải phối/Lót: (nếu có).
         - Phụ liệu: (Chỉ may, Nút, Dây kéo YKK...).
      
      3. **QUY CÁCH MAY (SEWING GUIDE):**
         - Loại đường may: (VD: Vắt sổ 4 chỉ, May móc xích...).
         - Mật độ chỉ: (VD: 4 mũi/cm).
         - Xử lý lai/gấu áo.
      
      4. **GHI CHÚ IN/THÊU (ARTWORK):**
         - Kỹ thuật: (VD: In lụa plastisol, Thêu vi tính).
         - Vị trí đặt hình.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập hồ sơ Tech Pack.";
  });
};
