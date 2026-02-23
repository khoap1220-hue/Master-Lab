
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * Print Design Strategy
 */
export const planPrintDesign = async (
  userRequest: string,
  format: string,
  finishingTech: string[]
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
      VAI TRÒ: CHUYÊN GIA THIẾT KẾ IN ẤN (GRAPHIC DESIGNER).
      
      INPUT:
      - Nội dung/Chủ đề: "${userRequest}"
      - Quy cách (Format): "${format}"
      - Kỹ thuật gia công: "${finishingTech.join(', ')}"
      
      NHIỆM VỤ: Lên layout và định hướng chất liệu cho ấn phẩm.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed prompt for generating the print layout. Focus on Composition, Typography hierarchy, Paper texture simulation...",
        "structuredBrief": "Markdown Content describing: 1. Layout Grid (Cột/Hàng), 2. Visual Hierarchy, 3. Paper Stock Suggestion (Loại giấy), 4. Print Tech Specs..."
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
 * Generate Pre-press Specs (Checklist in ấn)
 */
export const generatePrintSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3-flash-preview"; 
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KỸ THUẬT VIÊN CHế BẢN (PRE-PRESS TECHNICIAN).
      NHIỆM VỤ: Lập phiếu yêu cầu in ấn (Print Order Spec) cho: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      
      1. **THÔNG SỐ FILE (FILE SPECS):**
         - Kích thước thành phẩm (Final Size).
         - Tràn lề (Bleed): (Thường là 2mm hoặc 3mm mỗi cạnh).
         - Hệ màu: CMYK (bắt buộc cho in Offset/KTS).
         - Độ phân giải: 300 DPI.
      
      2. **CHẤT LIỆU GIẤY (PAPER STOCK):**
         - Loại giấy: (VD: Couche, Fort, Kraft, Mỹ thuật Econo...).
         - Định lượng (GSM): (VD: C300 cho bìa, C150 cho ruột).
      
      3. **GIA CÔNG SAU IN (FINISHING):**
         - Cán màng: (Bóng/Mờ).
         - Kỹ thuật đặc biệt: (Ép kim, Phủ UV, Dập nổi, Bế hình).
         - Đóng cuốn: (Ghim lồng, Keo gáy, Lò xo).
      
      4. **LƯU Ý KIỂM TRA (QUALITY CONTROL):**
         - Kiểm tra lỗi chính tả (Typos).
         - Kiểm tra font chữ (Convert outline).
         - Kiểm tra vùng an toàn (Safety Margin).
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập thông số in ấn.";
  });
};
