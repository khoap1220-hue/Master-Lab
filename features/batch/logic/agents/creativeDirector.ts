
import { GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { optimizeImagePayload } from "../../../../lib/utils";
import { cleanJson } from "../../../../services/orchestrator/utils";
import { MODELS } from "../../../../config/models";

const PRODUCT_PHOTOGRAPHY_PROTOCOL = `
  *** PRODUCT PHOTOGRAPHY PROTOCOL (NHIẾP ẢNH SẢN PHẨM) ***
  
  1. LIGHTING & SHADOWS:
     - The product MUST cast realistic shadows on the surface it sits on (Contact shadows + Cast shadows).
     - Match the lighting direction of the background with the lighting on the product.
     - Use "Studio Lighting", "Softbox", or "Natural Window Light" to define the mood.

  2. SCALE & PERSPECTIVE:
     - The product must look like it physically belongs in the scene.
     - Pay attention to the focal length (e.g., "Shot on 85mm lens" for portraits/products, "Macro lens" for details).
     - Add subtle Depth of Field (Bokeh) to separate the product from the background.

  3. MATERIAL ACCURACY:
     - Glass/Liquids must refract light and show caustics.
     - Metals must reflect the surrounding environment.
     - Matte surfaces should have soft, diffused highlights.
`;

/**
 * AI CREATIVE DIRECTOR AGENT (Pro-First)
 * Role: Analyzes product image to determine optimal Studio Settings.
 */
export const runCreativeDirector = async (imageUrl: string): Promise<{ category: string, scene: string, lighting: string, camera: string }> => {
    const ai = getAI();
    const primaryModel = MODELS.TEXT_PRIMARY; 
    const fallbackModel = MODELS.TEXT_FAST;
    
    const optImage = await optimizeImagePayload(imageUrl, 'vision');

    const prompt = `
        [SYSTEM ROLE: SENIOR ART DIRECTOR]
        TASK: Analyze the product image and design an ADVERTISING PHOTOSHOOT.
        
        ${PRODUCT_PHOTOGRAPHY_PROTOCOL}

        OUTPUT JSON: { "category": "...", "scene": "...", "lighting": "...", "camera": "..." }
    `;

    const config = {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json"
    };

    try {
        const response = await callWithRetry<GenerateContentResponse>(
            () => ai.models.generateContent({
                model: primaryModel,
                contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                config
            }), 
            2, 1000, 'Creative-Director-Pro',
            [() => ai.models.generateContent({
                model: fallbackModel,
                contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                config
            })]
        );
        return JSON.parse(cleanJson(response.text || "{}"));
    } catch (e) {
        return { category: "Product", scene: "Studio", lighting: "Soft", camera: "Macro" };
    }
};
