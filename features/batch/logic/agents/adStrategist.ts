
import { Type, GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { cleanJson } from "../../../../services/orchestrator/utils";
import { executeManagedTask } from "../../../../lib/tieredExecutor";
import { LANGUAGE_PROTOCOL } from "../../../../services/prompts";

/**
 * AD STRATEGIST AGENT
 * Role: Generates a batch of distinct ad concepts based on Brand DNA.
 */
export const generateCampaignBatch = async (
    context: string,
    brandVibe: string,
    count: number = 10
): Promise<string[]> => {
    return executeManagedTask('COPYWRITING_FAST', async () => {
        const ai = getAI();
        const model = "gemini-3-flash-preview";
        const backupModel = "gemini-3-flash-preview";

        const prompt = `
            [SYSTEM ROLE: SENIOR MARKETING DIRECTOR]
            TASK: Brainstorm exactly ${count} DISTINCT Ad Campaign concepts.
            
            INPUT CONTEXT: "${context || 'General Brand Promotion'}"
            BRAND VIBE: "${brandVibe || 'Professional & Modern'}"
            
            ${LANGUAGE_PROTOCOL}

            LANGUAGE RULES:
            - **HEADLINE**: Must be in the **SAME LANGUAGE as the INPUT CONTEXT**. Short, punchy, impactful.
            - **VISUAL DESCRIPTION**: Keep in **ENGLISH** for better AI Image Generation.
            
            REQUIREMENT:
            - Vary the ANGLES: 
              1. Emotional/Lifestyle
              2. Hard Sell/Benefit
              3. Social Proof/Testimonial
              4. Seasonal/Trending
              5. Minimalist/Aesthetic
              6. FOMO/Urgency
            - Vary the FORMATS: 1:1 (Square), 9:16 (Story), 16:9 (Banner), 4:5 (Portrait).
            
            OUTPUT FORMAT:
            Return a JSON Array of strings. Each string MUST follow this format strictly:
            "Headline (User Language) | Visual Context Description (English) | Aspect Ratio"
            
            EXAMPLE OUTPUT:
            [
              "Giảm Giá Sốc 50% | Beach sunny vibe with product on sand | 4:5",
              "Trusted by Experts | Professional studio shot with seal of approval | 1:1"
            ]
        `;

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        };

        const response = await callWithRetry<GenerateContentResponse>(
            () => ai.models.generateContent({
                model,
                contents: { parts: [{ text: prompt }] },
                config: config as any
            }),
            3,
            2000,
            model,
            () => ai.models.generateContent({ // Fallback
                model: backupModel,
                contents: { parts: [{ text: prompt }] },
                config: config as any
            })
        );

        return JSON.parse(cleanJson(response.text || "[]"));
    });
};
