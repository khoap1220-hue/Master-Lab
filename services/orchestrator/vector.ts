
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

export const planVectorArt = async (
  userRequest: string,
  style: string
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
      VAI TRÒ: VECTOR ILLUSTRATOR (GRAPHIC DESIGNER).
      INPUT:
      - Yêu cầu: "${userRequest}"
      - Phong cách: "${style}"
      
      NHIỆM VỤ: Thiết kế minh họa vector sắc nét, hiện đại.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Vector art prompt including Line work, Color Palette, Shapes, and Composition...",
        "structuredBrief": "Markdown Content describing: 1. Illustration Concept, 2. Visual Elements, 3. Color Strategy..."
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
