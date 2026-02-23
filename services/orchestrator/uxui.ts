
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * MULTI-DISCIPLINARY PRODUCT DESIGN AGENT
 * 5 Layers: Core UX -> Biz/Ops -> Legal/Compliance -> Tech -> Brand
 */
export const planProductUX = async (
  userRequest: string,
  systemType: string,
  userRole: string
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
      [VAI TRÒ: SENIOR PRODUCT DESIGNER & SYSTEM ARCHITECT]
      [TƯ DUY ĐA LỚP: BUSINESS - OPERATIONS - LEGAL (VN) - TECH - UX]
      
      INPUT:
      - Bài toán: "${userRequest}"
      - Loại hệ thống: "${systemType}" (VD: ERP, LMS, CRM, POS)
      - Vai trò người dùng (Persona): "${userRole}" (VD: Kế toán, Giáo viên, Bếp trưởng)
      
      NHIỆM VỤ: Thiết kế giải pháp UX/UI cho sản phẩm vận hành thật (Real-world Product), không phải Dribbble Shot.
      
      HƯỚNG DẪN TƯ DUY 5 LỚP (BẮT BUỘC):
      
      1. **BUSINESS & OPERATION LAYER (Vận hành):**
         - KPI của màn hình này là gì? (Tốc độ xử lý, giảm sai sót, hay ra quyết định?)
         - Workflow thực tế của ${userRole} diễn ra thế nào? (VD: Tay dính dầu mỡ thì nút phải to, Kế toán cần nhập liệu bằng bàn phím nhanh).
      
      2. **LEGAL & COMPLIANCE LAYER (Pháp lý VN):**
         - Có yêu cầu gì đặc thù tại Việt Nam không? 
         - VD: Giáo dục cần sổ điểm/học bạ chuẩn Bộ GDĐT. Kế toán cần Xuất hóa đơn điện tử, Chữ ký số. Y tế cần bảo mật bệnh án.
         - Log hệ thống (Audit Trail) để truy vết ai sửa/xóa?
      
      3. **TECH FEASIBILITY LAYER (Kỹ thuật):**
         - Dữ liệu quan hệ thế nào? (1-n, n-n).
         - Phân quyền (RBAC): User này thấy được nút nào, bị ẩn nút nào?
         - Các trạng thái (States): Loading, Error, Empty, No Permission.
      
      4. **CORE UX/UI LAYER:**
         - Information Architecture: Sắp xếp thông tin theo độ ưu tiên.
         - Flow: Các bước thực hiện.
      
      5. **AESTHETIC & BRAND:**
         - Tin cậy, Chuyên nghiệp, Rõ ràng (Clarity > Fancy).
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed prompt for UI Generation. Specify: Dashboard Layout (Sidebar/Topnav), Data Density (High/Low), Key Components (Data Grid, Charts, Forms), Color Logic (Status colors), and specific UI elements for the identified features...",
        "structuredBrief": "Markdown Content describing: \n# 1. Logic Vận Hành & KPI \n# 2. Rủi Ro & Pháp Lý (VN Context) \n# 3. Luồng Nghiệp Vụ (User Flow) \n# 4. Yêu Cầu Kỹ Thuật (Data/Permission) \n# 5. Checklist UI/UX (Components)..."
      }
    `;

    const config = {
        thinkingConfig: { thinkingBudget: 32768 }, // Deep thinking for Product Logic
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
      3000,
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
