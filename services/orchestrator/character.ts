
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

export const planCharacterDesign = async (
  userRequest: string,
  genre: string
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
      VAI TRÒ: CONCEPT ARTIST (CHARACTER DESIGNER).
      INPUT:
      - Yêu cầu: "${userRequest}"
      - Thể loại: "${genre}"
      
      NHIỆM VỤ: Thiết kế nhân vật chi tiết về ngoại hình, trang phục, và tính cách.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed character design prompt including Anatomy, Costume, Accessories, Pose, and Lighting...",
        "structuredBrief": "Markdown Content describing: 1. Character Backstory, 2. Visual Identity, 3. Key Features..."
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
