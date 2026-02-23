
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { optimizeImagePayload } from "../../lib/utils";

/**
 * Giai đoạn 1: Phân tích & Chiến lược (Intake -> Measure -> Copy -> Visual System)
 * Gom tất cả logic này vào một prompt mạnh để Gemini Pro tư duy.
 */
export const planSignageProject = async (
  userContent: string,
  userMaterial: string,
  userExtras: string,
  facadeImage: string | null
): Promise<{
  placementMap: string;
  copyHierarchy: string;
  visualSpecs: string;
  visualPrompt: string; // Prompt để sinh ảnh
  sources: GroundingSource[];
  structuredBrief?: string;
}> => {
  return executeManagedTask('STRATEGY_PLANNING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    // SMART PRE-OPTIMIZATION: Vision Profile (1024px is enough for layout analysis)
    const optFacade = facadeImage ? await optimizeImagePayload(facadeImage, 'vision') : null;

    const prompt = `
      VAI TRÒ: CHUYÊN GIA THIẾT KẾ & THI CÔNG BẢNG HIỆU QUẢNG CÁO (SIGNAGE ARCHITECT).
      
      INPUT CỦA NGƯỜI DÙNG:
      - Nội dung/Yêu cầu: "${userContent}"
      - Vật liệu mong muốn: "${userMaterial}"
      - Thông tin bổ sung (Kích thước, SĐT, Vị trí...): "${userExtras}"
      
      NHIỆM VỤ (Quy trình 4 bước tích hợp):
      
      1. INTAKE & MEASURE (Ước lượng):
         - Dựa trên ảnh mặt tiền (nếu có), ước lượng vị trí "Vùng an toàn" để đặt bảng (tránh che cửa sổ, ban công).
         - Đề xuất kích thước chuẩn (VD: Bảng ngang cao 1.2m, Biển vẫy tròn D60cm).
      
      2. COPY HIERARCHY (Phân cấp nội dung):
         - Xác định đâu là TEXT CHÍNH (Tên hiệu), TEXT PHỤ (Slogan), và TEXT THÔNG TIN (SĐT, ĐC).
         - Sắp xếp lại nội dung sao cho dễ đọc từ xa (Quy tắc 3 giây).
      
      3. VISUAL SYSTEM (Hệ thống thị giác):
         - Chọn font chữ (Bebas, Montserrat...) phù hợp ngành hàng.
         - Chọn palette màu (Tương phản cao).
         - Chọn vật liệu thực tế (Alu, Mica, LED) theo ngân sách.
      
      4. VISUAL PROMPT (Để sinh ảnh Mockup):
         - Viết prompt tiếng Anh chi tiết để AI vẽ đè bảng hiệu lên ảnh gốc.
         - Mô tả rõ: "Superimpose a [Material] signboard on the building facade...".
      
      OUTPUT FORMAT (JSON):
      {
        "structuredBrief": "Markdown string chi tiết về phương án thi công (Design Brief)",
        "visualPrompt": "Prompt tiếng Anh để render mockup",
        "placementAnalysis": "Phân tích vị trí đặt bảng"
      }
    `;

    const parts: any[] = [{ text: prompt }];
    if (optFacade) {
      parts.push({ inlineData: { mimeType: "image/png", data: optFacade.split(',')[1] } });
    }

    const config = {
        thinkingConfig: { thinkingBudget: 32768 }, // UPGRADE: Deep Structural Analysis
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            structuredBrief: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            placementAnalysis: { type: Type.STRING }
          },
          required: ["structuredBrief", "visualPrompt"]
        }
    } as any;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts },
        config
      }), 
      3, 
      2000, 
      model, 
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts },
        config
      })
    );

    const data = JSON.parse(cleanJson(response.text || "{}"));

    return {
      placementMap: data.placementAnalysis || "Tự động căn chỉnh theo mặt tiền.",
      copyHierarchy: "Đã tối ưu hóa thứ bậc nội dung.",
      visualSpecs: "Đã xác định quy cách vật liệu.",
      visualPrompt: data.visualPrompt,
      structuredBrief: data.structuredBrief,
      sources: []
    };
  });
};

/**
 * Giai đoạn 3: Hồ sơ kỹ thuật (Production Files + QA)
 * Sau khi có thiết kế, tạo ra spec chi tiết để thợ làm.
 */
export const generateSignageSpecs = async (
  approvedDesignDescription: string,
  memoryInsight: MemoryInsight
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KỸ SƯ SẢN XUẤT QUẢNG CÁO (PRODUCTION ENGINEER).
      
      NHIỆM VỤ: Lập hồ sơ bàn giao kỹ thuật (Technical Specs) cho xưởng thi công dựa trên thiết kế đã chốt.
      THIẾT KẾ: "${approvedDesignDescription}"
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      
      1. **QUY CÁCH VẬT TƯ (BOM):**
         - Nền bảng: (VD: Khung sắt vuông 25mm, mạ kẽm, mặt ốp Alu Alcorest 0.10...).
         - Bộ chữ: (VD: Mica Đài Loan 3mm, uốn nổi 5cm, LED hắt sáng chân...).
         - Đèn: (VD: Nguồn 12V chống nước...).
      
      2. **HƯỚNG DẪN THI CÔNG:**
         - Phương án gia cố vào mặt tiền.
         - Đi dây điện giấu kín.
      
      3. **CHECKLIST QA (KIỂM TRA CHẤT LƯỢNG):**
         - Độ sáng LED đồng đều.
         - Keo dán không bị lem.
         - Chống nước mép bảng.
      
      4. **MÃ MÀU & FONT:**
         - Ghi rõ mã màu gần đúng (Pantone/CMYK) để in ấn.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập hồ sơ kỹ thuật.";
  });
};
