
import { GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../../lib/gemini";
import { optimizeImagePayload } from "../../../lib/utils";
import { executeManagedTask } from "../../../lib/tieredExecutor";

// AGENT 4: GLYPH DESIGNER (REPAIRMAN)
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
      [SYSTEM ROLE: AGENT 4 - GLYPH DESIGNER]
      
      NHIỆM VỤ: Vẽ bổ sung ${missingChars.length} ký tự còn thiếu để hoàn thiện bộ font.
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
