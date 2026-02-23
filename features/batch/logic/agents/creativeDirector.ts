
import { Type, GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { optimizeImagePayload } from "../../../../lib/utils";
import { cleanJson } from "../../../../services/orchestrator/utils";

/**
 * AI CREATIVE DIRECTOR AGENT (Pro-First)
 * Role: Analyzes product image to determine optimal Studio Settings.
 */
export const runCreativeDirector = async (imageUrl: string): Promise<{ category: string, scene: string, lighting: string, camera: string }> => {
    const ai = getAI();
    const primaryModel = "gemini-3.1-pro-preview"; 
    const fallbackModel = "gemini-3-flash-preview";
    
    const optImage = await optimizeImagePayload(imageUrl, 'vision');

    const prompt = `
        [SYSTEM ROLE: SENIOR ART DIRECTOR]
        TASK: Analyze the product image and design an ADVERTISING PHOTOSHOOT.
        OUTPUT JSON: { "category": "...", "scene": "...", "lighting": "...", "camera": "..." }
    `;

    const config = {
        thinkingConfig: { thinkingBudget: 4096 },
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                scene: { type: Type.STRING },
                lighting: { type: Type.STRING },
                camera: { type: Type.STRING }
            },
            required: ["category", "scene", "lighting"]
        }
    } as any;

    try {
        const response = await callWithRetry<GenerateContentResponse>(
            () => ai.models.generateContent({
                model: primaryModel,
                contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                config
            }), 
            2, 2000, 'Creative-Director-Pro',
            () => ai.models.generateContent({
                model: fallbackModel,
                contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                config
            })
        );
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        return { category: "Product", scene: "Studio", lighting: "Soft", camera: "Macro" };
    }
};
