
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";

/**
 * Multimedia / Video Production Strategy
 */
export const planMultimediaShoot = async (
  userRequest: string,
  aspectRatio: string,
  visualStyle: string
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
      VAI TRÒ: ĐẠO DIỄN HÌNH ẢNH (DOP / ART DIRECTOR).
      
      INPUT:
      - Ý tưởng kịch bản: "${userRequest}"
      - Tỷ lệ khung hình: "${aspectRatio}"
      - Phong cách hình ảnh: "${visualStyle}"
      
      NHIỆM VỤ: Phác thảo Key Visual hoặc Storyboard Frame quan trọng nhất.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Cinematic Prompt describing the scene. Focus on Lighting (Rim light, Key light), Lens (Focal length), Color Grading (Teal & Orange), and Action...",
        "structuredBrief": "Markdown Content describing: 1. Scene Context, 2. Mood & Atmosphere, 3. Technical Camera Specs..."
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
 * Generate Shooting Script / Shot List
 */
export const generateShootingScript = async (
  sceneContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: TRỢ LÝ ĐẠO DIỄN (1ST AD).
      NHIỆM VỤ: Lập Shot List (Danh sách cảnh quay) chi tiết cho cảnh: "${sceneContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      
      1. **SHOT 1 (ESTABLISHING SHOT):**
         - Cỡ cảnh: Toàn cảnh (Wide).
         - Mô tả hành động.
      
      2. **SHOT 2 (MEDIUM SHOT):**
         - Cỡ cảnh: Trung cảnh.
         - Tiêu điểm.
      
      3. **SHOT 3 (CLOSE-UP):**
         - Cỡ cảnh: Cận cảnh.
         - Chi tiết cảm xúc.
      
      4. **GHI CHÚ KỸ THUẬT:**
         - Ánh sáng (Giờ vàng, Blue hour?).
         - Đạo cụ cần thiết.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      3,
      2000,
      model,
      () => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })
    );

    return response.text || "Đã lập Shot List.";
  });
};
