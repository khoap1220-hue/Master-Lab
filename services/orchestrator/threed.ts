
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

export const plan3DRender = async (
  userRequest: string,
  renderType: string
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
      VAI TRÒ: 3D ARTIST (RENDER SPECIALIST).
      INPUT:
      - Yêu cầu: "${userRequest}"
      - Loại Render: "${renderType}"
      
      NHIỆM VỤ: Thiết kế cảnh render 3D siêu thực về ánh sáng, vật liệu và bố cục.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "3D rendering prompt including Lighting setup, Material properties, Camera settings, and Environment...",
        "structuredBrief": "Markdown Content describing: 1. Scene Composition, 2. Lighting Strategy, 3. Material Details..."
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
