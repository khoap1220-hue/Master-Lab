
import { GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { calculateThinkingBudget } from "../../lib/utils";
import { loadMemoryFromLocal } from "../memoryService";
import { cleanJson } from "./utils";
import { UXUI_DESIGN_PROTOCOL, SMART_INFERENCE_PROTOCOL, LANGUAGE_PROTOCOL, PROMPT_ENGINEERING_PROTOCOL } from "../prompts";
import { MODELS } from "../../config/models";

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
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;
    const memory = loadMemoryFromLocal();

    const thinkingLevel = calculateThinkingBudget(memory?.semanticKB?.thinkingPreference || 'BALANCED');

    const prompt = `
      [VAI TRÒ: SENIOR PRODUCT DESIGNER & SYSTEM ARCHITECT]
      [TƯ DUY ĐA LỚP: BUSINESS - OPERATIONS - LEGAL (VN) - TECH - UX]
      
      INPUT:
      - Bài toán: "${userRequest}"
      - Loại hệ thống: "${systemType}" (VD: ERP, LMS, CRM, POS)
      - Vai trò người dùng (Persona): "${userRole}" (VD: Kế toán, Giáo viên, Bếp trưởng)
      
      NHIỆM VỤ: Thiết kế giải pháp UX/UI cho sản phẩm vận hành thật (Real-world Product), không phải Dribbble Shot.

      ${SMART_INFERENCE_PROTOCOL}
      ${LANGUAGE_PROTOCOL}
      ${PROMPT_ENGINEERING_PROTOCOL}
      
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
      
      ${UXUI_DESIGN_PROTOCOL}

      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed prompt for UI Generation. Specify: Dashboard Layout (Sidebar/Topnav), Data Density (High/Low), Key Components (Data Grid, Charts, Forms), Color Logic (Status colors), and specific UI elements for the identified features...",
        "structuredBrief": "Markdown Content describing: \n# 1. Logic Vận Hành & KPI \n# 2. Rủi Ro & Pháp Lý (VN Context) \n# 3. Luồng Nghiệp Vụ (User Flow) \n# 4. Yêu Cầu Kỹ Thuật (Data/Permission) \n# 5. Checklist UI/UX (Components)..."
      }
    `;

    const config = {
        ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
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
        config: { responseMimeType: "application/json" } // No thinking for backup
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
 * Generate UX/UI Specs (User Flow, Component List)
 */
export const generateUXUISpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: CHUYÊN GIA PHÂN TÍCH UX/UI (UX ANALYST).
      NHIỆM VỤ: Lập hồ sơ đặc tả trải nghiệm người dùng cho: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      1. **USER FLOW:** Các bước người dùng tương tác chính.
      2. **COMPONENT LIST:** Danh sách các thành phần UI cần thiết (Button, Input, Card...).
      3. **INTERACTION DESIGN:** Các hiệu ứng, chuyển cảnh, phản hồi.
      4. **ACCESSIBILITY (A11Y):** Các tiêu chuẩn về độ tương phản, kích thước chữ, hỗ trợ đọc màn hình.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      2,
      1000,
      model,
      [() => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })]
    );

    return response.text || "Đã lập hồ sơ đặc tả UX/UI.";
  });
};
