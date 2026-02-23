
import { GenerateContentResponse, Type } from "@google/genai";
import { getAI, callWithRetry } from "../../../lib/gemini";
import { optimizeImagePayload } from "../../../lib/utils";
import { executeManagedTask } from "../../../lib/tieredExecutor";
import { cleanJson } from "../../../services/orchestrator/utils";

// AGENT 3: SENTINEL AUDITOR (GATEKEEPER)
export const runSentinelAudit = async (
  specimenUrl: string,
  targetCharset: string
): Promise<{ missingChars: string[], status: 'perfect' | 'incomplete', coverage: number, report: string }> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const optSpecimen = await optimizeImagePayload(specimenUrl, 'vision');

    const prompt = `
      [SYSTEM ROLE: AGENT 3 - SENTINEL AUDITOR]
      NHIỆM VỤ: Kiểm định chất lượng "Lô hàng" (Specimen Image) trước khi cho phép nhập kho (Vectorize).
      
      DANH SÁCH KIỂM KÊ (BỘ CHỮ CẦN ĐỦ): ${targetCharset}
      
      YÊU CẦU KIỂM TRA:
      1. ĐẾM SỐ LƯỢNG: Có bao nhiêu ký tự đã xuất hiện rõ ràng?
      2. TÍNH TOÁN ĐỘ PHỦ (% Coverage): (Số ký tự tìm thấy / Tổng số ký tự yêu cầu) * 100.
      3. LIỆT KÊ LỖI: Các ký tự bị thiếu, bị dính (overlap), hoặc bị vỡ nét (broken).
      
      OUTPUT JSON:
      {
        "missingChars": ["A", "b", "5"...],
        "status": "perfect" | "incomplete",
        "coverage": 95,
        "report": "Báo cáo ngắn gọn: Đạt 95%. Thiếu chữ 'X' và số '9'."
      }
    `;

    const config = { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          missingChars: { type: Type.ARRAY, items: { type: Type.STRING } },
          status: { type: Type.STRING },
          coverage: { type: Type.NUMBER },
          report: { type: Type.STRING }
        }
      }
    };

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optSpecimen.split(',')[1] } }] },
        config
      }), 3, 2000, model
    );

    return JSON.parse(cleanJson(response.text || "{}"));
  });
};
