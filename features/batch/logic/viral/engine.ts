
import { Type, GenerateContentResponse } from "@google/genai";
import { ViralStoryPlan, ViralScore } from "../../../../types";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { cleanJson } from "../../../../services/orchestrator/utils";
import { executeManagedTask } from "../../../../lib/tieredExecutor";
import { optimizeImagePayload } from "../../../../lib/utils";
import { loadMemoryFromLocal } from "../../../../services/memoryService";
import { LANGUAGE_PROTOCOL } from "../../../../services/prompts";

/**
 * ENGINE: OMNICHANNEL VIRAL STRATEGIST (v5.6 - Pro-First Edition)
 * Prioritizes gemini-3.1-pro-preview for deep creativity, fallbacks to gemini-3-flash-preview.
 */
export const runViralEngine = async (
    baseStory: string,
    brandDNA: string,
    platform: string,
    duration: string,
    imageUrl?: string
): Promise<{ plan: ViralStoryPlan, score: ViralScore }> => {
    
    return executeManagedTask('STRATEGY_PLANNING', async () => {
        const ai = getAI();
        // PRIORITY: PRO -> FLASH
        const primaryModel = "gemini-3.1-pro-preview"; 
        const fallbackModel = "gemini-3-flash-preview";

        const optImage = imageUrl ? await optimizeImagePayload(imageUrl, 'vision') : null;
        
        const prompt = `
            [SYSTEM: OMNICHANNEL CONTENT FACTORY v5.6]
            [ROLE]: Creative Director specializing in Viral Growth.
            
            INPUT: "${baseStory}"
            BRAND DNA: "${brandDNA}"
            PLATFORM: ${platform} (${duration})
            ${optImage ? "- VISUAL: Attached product image." : ""}

            TASK:
            1. ANALYZE: Extract Hook & Tone from input.
            2. GENERATE: 2 Scripts, 1 Post, 3 Quotes.
            3. OUTPUT: Valid JSON ONLY.

            ${LANGUAGE_PROTOCOL}

            --- JSON SCHEMA ---
            {
                "plan": {
                    "hookVariants": [
                        { "id": "H1", "title": "Variant Name", "pattern": "POV/ASMR", "script": "Audio...", "visual_prompt": "Visual..." }
                    ],
                    "socialPosts": [
                        { "platform": "Social", "content": "Text...", "hashtags": ["#tag"] }
                    ],
                    "instagramQuotes": [
                        { "text": "Quote...", "style": "Design Style" }
                    ],
                    "shots": [
                        { "shot_id": "S2", "role": "Body", "duration": 8, "visual_prompt": "...", "audio_script": "...", "viral_tech": "Tech" },
                        { "shot_id": "S3", "role": "Ending", "duration": 4, "visual_prompt": "...", "audio_script": "...", "viral_tech": "CTA" }
                    ]
                },
                "score": { "hookStrength": 80, "retentionLogic": 80, "sharePotential": 80, "totalScore": 80, "notes": "AI Feedback." }
            }
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                plan: {
                    type: Type.OBJECT,
                    properties: {
                        hookVariants: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    pattern: { type: Type.STRING },
                                    script: { type: Type.STRING },
                                    visual_prompt: { type: Type.STRING }
                                }
                            }
                        },
                        socialPosts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    platform: { type: Type.STRING },
                                    content: { type: Type.STRING },
                                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        },
                        instagramQuotes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    text: { type: Type.STRING },
                                    style: { type: Type.STRING }
                                }
                            }
                        },
                        shots: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    shot_id: { type: Type.STRING },
                                    role: { type: Type.STRING },
                                    duration: { type: Type.NUMBER },
                                    visual_prompt: { type: Type.STRING },
                                    audio_script: { type: Type.STRING },
                                    viral_tech: { type: Type.STRING }
                                }
                            }
                        }
                    }
                },
                score: {
                    type: Type.OBJECT,
                    properties: {
                        hookStrength: { type: Type.NUMBER },
                        retentionLogic: { type: Type.NUMBER },
                        sharePotential: { type: Type.NUMBER },
                        totalScore: { type: Type.NUMBER },
                        notes: { type: Type.STRING }
                    }
                }
            }
        };

        const parts: any[] = [{ text: prompt }];
        if (optImage) {
            parts.push({ inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } });
        }

        try {
            const response = await callWithRetry<GenerateContentResponse>(
                () => ai.models.generateContent({
                    model: primaryModel,
                    contents: { parts },
                    config: {
                        thinkingConfig: { thinkingBudget: 4096 }, // Add thinking for Pro
                        responseMimeType: "application/json",
                        responseSchema: responseSchema as any
                    }
                }), 
                2, 2000, 'Viral-Engine-Pro',
                [
                  () => ai.models.generateContent({
                      model: fallbackModel,
                      contents: { parts },
                      config: {
                          responseMimeType: "application/json",
                          responseSchema: responseSchema as any
                      }
                  }),
                  () => ai.models.generateContent({ // Final emergency fallback
                      model: "gemini-3-flash-preview",
                      contents: { parts },
                      config: {
                          responseMimeType: "application/json",
                          responseSchema: responseSchema as any
                      }
                  })
                ]
            );

            const parsed = JSON.parse(cleanJson(response.text || "{}"));
            return parsed;
        } catch (e) {
            console.error("Viral Engine failed both models:", e);
            throw e;
        }
    });
};
