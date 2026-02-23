
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * Real Estate Staging Strategy
 */
export const planRealEstateRenovation = async (
  userRequest: string,
  roomType: string,
  style: string
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
      VAI TRÒ: KIẾN TRÚC SƯ NỘI THẤT CHỦ TRÌ (SENIOR INTERIOR ARCHITECT).
      
      INPUT:
      - Yêu cầu cải tạo: "${userRequest}"
      - Loại không gian: "${roomType}"
      - Phong cách/Vật liệu mong muốn: "${style}" (VD: Japandi, Golden Hour Lighting, Wood Floor...)
      
      NHIỆM VỤ: Phân tích hiện trạng và đề xuất phương án cải tạo/staging (Virtual Staging) đạt chuẩn ArchViz.
      
      HƯỚNG DẪN TƯ DUY:
      1. Phân tích Ánh sáng (Lighting): Dựa trên input, xác định nguồn sáng chính (Nắng, Đèn ấm) để tạo không khí (Mood).
      2. Phân tích Vật liệu (Materials): Đề xuất vật liệu cụ thể (Gỗ sồi, Đá Marble, Vải nhung) để tăng tính hiện thực.
      3. Bố cục (Layout): Đảm bảo luồng giao thông hợp lý.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Photorealistic ArchViz Prompt. Must specify: Camera Angle (Straight on/45 deg), Lighting (e.g. Golden Hour, diffuse softbox), Materials (e.g. Herringbone Oak floor), Furniture pieces, and Color Palette...",
        "structuredBrief": "Markdown Content describing: 1. Design Concept (Mood & Vibe), 2. Key Furniture Selection (Item list), 3. Lighting Strategy (Day/Night), 4. Material Board (Sàn, Tường, Trần)..."
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
 * Generate Fit-out Specs (Vật tư hoàn thiện)
 */
export const generateFitOutSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KỸ SƯ DỰ TOÁN NỘI THẤT (QS/QC).
      NHIỆM VỤ: Lập bảng tiêu chuẩn hoàn thiện (Fit-out Specifications) chi tiết cho: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT CHUYÊN NGÀNH):
      
      1. **HOÀN THIỆN SÀN, TƯỜNG, TRẦN (FINISHES):**
         - Sàn: (VD: Gỗ kỹ thuật Engineered Wood, Gạch Vietceramics 600x1200).
         - Tường: (VD: Sơn hiệu ứng bê tông, Giấy dán tường Nhật Bản).
         - Trần: (VD: Thạch cao khung chìm Vĩnh Tường, Khe đèn Shadowline).
      
      2. **ĐỒ LIỀN TƯỜNG (BUILT-IN FIT-OUT):**
         - Tủ bếp/quần áo: (Cánh Acrylic An Cường không đường line, Phụ kiện Hafele/Blum).
      
      3. **ĐỒ RỜI (LOOSE FURNITURE):**
         - Sofa: (Vải bọc Acacia/Cỏ May, Mút K43).
         - Bàn trà/Ăn: (Chân kim loại sơn tĩnh điện, mặt đá Vicostone).
      
      4. **ĐIỆN & CHIẾU SÁNG (M&E):**
         - Nhiệt độ màu: 3000K (Vàng ấm) cho phòng ngủ, 4000K (Trung tính) cho bếp.
         - Chỉ số hoàn màu (CRI): >90.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập bảng tiêu chuẩn hoàn thiện.";
  });
};
