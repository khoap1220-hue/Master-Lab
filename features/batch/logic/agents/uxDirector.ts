
import { Type, GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { cleanJson } from "../../../../services/orchestrator/utils";

/**
 * AI UX DIRECTOR AGENT (Pro-First)
 * Role: Analyzes app concept and maps out User Journey.
 */
export const runUXDirector = async (
    context: string, 
    platform: string,
    screenCount: number,
    brandVibe: string = ""
): Promise<{ screens: Array<{ name: string, description: string, uiElements: string[] }> }> => {
    const ai = getAI();
    const primaryModel = "gemini-3.1-pro-preview"; 
    const fallbackModel = "gemini-3-flash-preview";

    const prompt = `
        [SYSTEM ROLE: SENIOR PRODUCT MANAGER & UX ARCHITECT]
        INPUT: App Concept "${context}" on Platform "${platform}".
        BRAND: "${brandVibe}"
        
        TASK: Define exactly ${screenCount} CRITICAL screens that form a CONNECTED USER FLOW (Journey).
        
        LOGIC RULES:
        1. SEQUENTIAL: Screens must follow a logical order (e.g., Login -> Dashboard -> Detail).
        2. DIVERSITY: Don't just list 3 dashboards. Show different states.
        3. DESCRIPTION: Must be detailed enough for a UI Designer to visualize.
        
        OUTPUT JSON: 
        { "screens": [ { "name": "1. Login", "description": "Clean minimal login with social auth...", "uiElements": ["Input field", "Button"] } ] }
    `;

    const config = {
        thinkingConfig: { thinkingBudget: 4096 }, 
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                screens: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            uiElements: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["name", "description"]
                    }
                }
            }
        }
    } as any;

    try {
        const response = await callWithRetry<GenerateContentResponse>(
            () => ai.models.generateContent({ model: primaryModel, contents: { parts: [{ text: prompt }] }, config }), 
            2, 2000, 'UX-Director-Pro',
            () => ai.models.generateContent({ model: fallbackModel, contents: { parts: [{ text: prompt }] }, config })
        );
        return JSON.parse(cleanJson(response.text || "{\"screens\": []}"));
    } catch (e) {
        return { screens: [] };
    }
};
