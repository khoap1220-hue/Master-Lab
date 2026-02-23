
import { GenerateContentResponse, Type } from "@google/genai";
import { getAI, callWithRetry } from "../../../lib/gemini";
import { optimizeImagePayload } from "../../../lib/utils";
import { executeManagedTask } from "../../../lib/tieredExecutor";
import { cleanJson } from "../../../services/orchestrator/utils";

// Sub-task: Audit (Sentinel) - Checks if all characters exist
export const auditSpecimen = async (
  specimenUrl: string,
  targetCharset: string
): Promise<{ missingChars: string[], status: 'perfect' | 'incomplete', coverage: number }> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const optSpecimen = await optimizeImagePayload(specimenUrl, 'vision');

    const prompt = `
      [SYSTEM ROLE: AGENT 5 - SENTINEL AUDITOR]
      NHIỆM VỤ: Kiểm tra độ phủ của bảng chữ cái trong ảnh Specimen.
      BỘ CHỮ CẦN ĐỦ: ${targetCharset}
      
      YÊU CẦU:
      1. Liệt kê các ký tự hoàn toàn KHÔNG có trong ảnh.
      2. Liệt kê các ký tự bị dính nhau (overlap) hoặc bị mất nét (broken).
      
      OUTPUT JSON:
      {
        "missingChars": ["A", "b", "5"...],
        "status": "incomplete",
        "coverage": 95
      }
    `;

    const config = { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          missingChars: { type: Type.ARRAY, items: { type: Type.STRING } },
          status: { type: Type.STRING },
          coverage: { type: Type.NUMBER }
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

// Sub-task: Repair (Designer) - Draws missing characters
export const runGlyphRepair = async (
  referenceUrl: string,
  missingChars: string[]
): Promise<string> => {
  return executeManagedTask('IMAGE_GEN_4K', async () => {
    const ai = getAI();
    const model = "gemini-3-pro-image-preview";
    const backupModel = "gemini-2.5-flash-image";
    
    const optRef = await optimizeImagePayload(referenceUrl, 'generation');

    const prompt = `
      [SYSTEM ROLE: AGENT 2 - GLYPH DESIGNER]
      
      NHIỆM VỤ: Vẽ bổ sung ${missingChars.length} ký tự còn thiếu.
      KÝ TỰ CẦN VẼ: ${missingChars.join(', ')}
      
      QUY TRÌNH SUY LUẬN DNA:
      1. Nhìn kỹ "Reference Image" để giải mã DNA chữ viết.
      2. "BỊA" (Hallucinate) các ký tự thiếu sao cho trông như cùng một bộ font.
      3. TRÌNH BÀY: Vẽ trên nền TRẮNG TINH (#FFFFFF), mực ĐEN ĐẬM. Xếp thành lưới GRID cực kỳ thoáng.
      4. KHÔNG VẼ LẠI CHỮ CŨ: Chỉ tập trung vẽ đúng danh sách ký tự thiếu.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optRef.split(',')[1] } }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      }),
      3, 2000, model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optRef.split(',')[1] } }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      })
    );

    let image = "";
    response.candidates?.[0]?.content?.parts?.forEach(p => { if(p.inlineData) image = `data:image/png;base64,${p.inlineData.data}`; });
    return image;
  });
};
