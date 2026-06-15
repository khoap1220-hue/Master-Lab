
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

export const planCinematicVideo = async (
  userRequest: string,
  aspectRatio: string
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
      VAI TRÒ: FILM DIRECTOR (CINEMATOGRAPHER).
      INPUT:
      - Yêu cầu: "${userRequest}"
      - Tỷ lệ khung hình: "${aspectRatio}"
      
      NHIỆM VỤ: Thiết kế cảnh quay điện ảnh về góc máy, ánh sáng và chuyển động.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Cinematic video prompt including Camera angle, Lighting setup, Color grading, and Atmosphere...",
        "structuredBrief": "Markdown Content describing: 1. Scene Mood, 2. Cinematography Plan, 3. Visual Style..."
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
