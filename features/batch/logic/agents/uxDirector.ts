
import { GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { cleanJson } from "../../../../services/orchestrator/utils";
import { UXUI_DESIGN_PROTOCOL } from "../../../../services/prompts";
import { MODELS } from "../../../../config/models";

/**
 * AI UX DIRECTOR AGENT (Pro-First)
 * Role: Analyzes app concept and maps out User Journey.
 */
export const runUXDirector = async (
    context: string, 
    platform: string,
    screenCount: number,
    brandVibe: string = ""
): Promise<{ screens: Array<{ name: string, description: string, uiElements: string[], layout?: string, colorPalette?: string, typography?: string }> }> => {
    const ai = getAI();
    const primaryModel = MODELS.TEXT_PRIMARY; 
    const fallbackModel = MODELS.TEXT_FAST;

    const prompt = `
        [SYSTEM ROLE: SENIOR PRODUCT MANAGER & UX ARCHITECT]
        INPUT: App Concept "${context}" on Platform "${platform}".
        BRAND: "${brandVibe}"
        
        TASK: Define exactly ${screenCount} CRITICAL screens that form a CONNECTED USER FLOW (Journey).
        
        LOGIC RULES:
        1. SEQUENTIAL: Screens must follow a logical order (e.g., Login -> Dashboard -> Detail).
        2. DIVERSITY: Don't just list 3 dashboards. Show different states.
        3. DESCRIPTION: Must be detailed enough for a UI Designer to visualize.
        
        ${UXUI_DESIGN_PROTOCOL}

        OUTPUT JSON: 
        { 
            "screens": [ 
                { 
                    "name": "1. Login", 
                    "description": "Clean minimal login with social auth...", 
                    "uiElements": ["Input field", "Button"],
                    "layout": "Centered card on split background",
                    "colorPalette": "Primary brand color for CTA, neutral backgrounds",
                    "typography": "Large sans-serif headings, legible body text"
                } 
            ] 
        }
    `;

    const config = {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }, 
        responseMimeType: "application/json"
    };

    try {
        const response = await callWithRetry<GenerateContentResponse>(
            () => ai.models.generateContent({ model: primaryModel, contents: { parts: [{ text: prompt }] }, config }), 
            2, 1000, 'UX-Director-Pro',
            [() => ai.models.generateContent({ model: fallbackModel, contents: { parts: [{ text: prompt }] }, config })]
        );
        return JSON.parse(cleanJson(response.text || "{\"screens\": []}"));
    } catch (e) {
        return { screens: [] };
    }
};
