
import { GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { MODELS } from "../../config/models";

/**
 * SOP / Workflow Management Strategy
 */
export const planSOPProject = async (
  userRequest: string
): Promise<{
  visualPrompt: string;
  structuredBrief?: string;
}> => {
  return executeManagedTask('STRATEGY_PLANNING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: CHUYÊN GIA TỐI ƯU HÓA QUY TRÌNH (SOP SPECIALIST).
      NHIỆM VỤ: Phân tích và thiết kế quy trình vận hành tiêu chuẩn cho: "${userRequest}".
      
      YÊU CẦU ĐẦU RA (JSON):
      {
        "visualPrompt": "A professional infographic flowchart design showing step-by-step process, clean icons, connecting lines, corporate style...",
        "structuredBrief": "Markdown Content describing: 1. Process Overview, 2. Step-by-Step Breakdown, 3. Critical Control Points, 4. KPI/Metrics..."
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

    const data = JSON.parse(response.text || "{}");
    return {
      visualPrompt: data.visualPrompt,
      structuredBrief: data.structuredBrief
    };
  });
};

/**
 * Generate SOP Specs (Handbooks, Checklists)
 */
export const generateSOPSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: CHUYÊN GIA SOẠN THẢO VĂN BẢN QUẢN TRỊ (TECHNICAL WRITER).
      NHIỆM VỤ: Lập bộ tài liệu quy trình vận hành (SOP) cho: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      1. **QUY TRÌNH CHI TIẾT:** Các bước thực hiện cụ thể.
      2. **CHECKLIST KIỂM TRA:** Danh sách các đầu việc cần kiểm tra để đảm bảo chất lượng.
      3. **PHÂN CÔNG TRÁCH NHIỆM (RACI):** Ai làm, ai chịu trách nhiệm, ai được tham vấn, ai được thông báo.
      4. **BIỂU MẪU ĐI KÈM:** Danh sách các biểu mẫu, giấy tờ cần thiết.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      2,
      1000,
      model,
      [() => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })]
    );

    return response.text || "Đã lập hồ sơ quy trình SOP.";
  });
};
