
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

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
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: CHUYÊN GIA THIẾT KẾ IN ẤN (GRAPHIC DESIGNER).
      
      INPUT:
      - Nội dung/Chủ đề: "${userRequest}"
      - Quy cách (Format): "${format}"
      - Kỹ thuật gia công: "${finishingTech.join(', ')}"
      
      NHIỆM VỤ: Lên layout và định hướng chất liệu cho ấn phẩm.
      
      YÊU CẦU CHI TIẾT:
      1. BỐ CỤC (Layout): Đề xuất lưới (grid system) phù hợp với Format.
      2. PHÂN CẤP THÔNG TIN (Visual Hierarchy): Xác định rõ điểm nhìn đầu tiên (Focal point).
      3. CHẤT LIỆU & GIA CÔNG: Tư vấn loại giấy và hiệu ứng gia công (ép kim, dập nổi) để tăng giá trị.
      4. VISUAL PROMPT: Viết prompt tiếng Anh cực kỳ chi tiết để render mockup 3D của ấn phẩm này, bao gồm cả ánh sáng studio và texture giấy.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed English prompt for generating a photorealistic 3D mockup of the print layout. Focus on Composition, Typography hierarchy, Paper texture simulation, and Studio lighting...",
        "structuredBrief": "Markdown Content describing: 1. Layout Grid (Cột/Hàng), 2. Visual Hierarchy, 3. Paper Stock Suggestion (Loại giấy), 4. Print Tech Specs..."
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
 * Generate Pre-press Specs (Checklist in ấn)
 */
export const generatePrintSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST; 
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: KỸ THUẬT VIÊN CHẾ BẢN (PRE-PRESS TECHNICIAN) & CHUYÊN GIA QUẢN LÝ CHẤT LƯỢNG IN ẤN.
      NHIỆM VỤ: Lập phiếu yêu cầu in ấn (Print Order Spec) cực kỳ chi tiết và chuyên nghiệp cho: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      
      1. **THÔNG SỐ FILE (FILE SPECS):**
         - Kích thước thành phẩm (Final Size) & Kích thước trải (Flat Size) nếu có gấp.
         - Tràn lề (Bleed): (Thường là 2mm hoặc 3mm mỗi cạnh).
         - Hệ màu: CMYK (bắt buộc cho in Offset/KTS). Cảnh báo nếu có màu pha (Pantone).
         - Độ phân giải: 300 DPI (hoặc cao hơn cho line art).
      
      2. **CHẤT LIỆU GIẤY (PAPER STOCK):**
         - Loại giấy: Đề xuất cụ thể (VD: Couche Matt, Fort trắng, Kraft Nhật, Mỹ thuật Econo...). Giải thích ngắn gọn lý do chọn loại giấy này.
         - Định lượng (GSM): (VD: C300 cho bìa, C150 cho ruột).
         - Hướng sớ giấy (Grain direction): (Tùy chọn, quan trọng cho sách/hộp).
      
      3. **GIA CÔNG SAU IN (FINISHING):**
         - Cán màng: (Bóng/Mờ/Soft-touch).
         - Kỹ thuật đặc biệt: (Ép kim - ghi rõ màu kim, Phủ UV định vị, Dập nổi/Chìm, Bế hình - Die cut).
         - Đóng cuốn/Gấp: (Ghim lồng, Keo gáy PUR, Lò xo, Gấp ziczac, Gấp cửa sổ).
      
      4. **LƯU Ý KIỂM TRA (QUALITY CONTROL PRE-FLIGHT):**
         - Kiểm tra lỗi chính tả (Typos).
         - Kiểm tra font chữ (Convert outline/Create outlines).
         - Kiểm tra vùng an toàn (Safety Margin - text cách mép cắt ít nhất 3-5mm).
         - Kiểm tra Overprint cho text đen (K=100).
         - Cảnh báo bồi giấy (nếu định lượng quá dày).
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      [() => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })]
    );

    return response.text || "Đã lập thông số in ấn.";
  });
};
