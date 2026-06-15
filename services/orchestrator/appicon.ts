
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

export const planAppIconDesign = async (
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
      VAI TRÒ: APP ICON DESIGNER (UI/UX SPECIALIST).
      INPUT:
      - Yêu cầu: "${userRequest}"
      - Phong cách: "${style}"
      
      NHIỆM VỤ: Thiết kế icon ứng dụng tối ưu về nhận diện và thẩm mỹ.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "App icon design prompt including Symbolism, Color Palette, Surface Treatment, and Background...",
        "structuredBrief": "Markdown Content describing: 1. Icon Concept, 2. Visual Hierarchy, 3. Style Guidelines..."
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
