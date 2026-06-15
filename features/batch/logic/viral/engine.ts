
import { GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { ViralStoryPlan, ViralScore } from "../../../../types";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { cleanJson } from "../../../../services/orchestrator/utils";
import { executeManagedTask } from "../../../../lib/tieredExecutor";
import { optimizeImagePayload } from "../../../../lib/utils";

import { LANGUAGE_PROTOCOL, VIRAL_STORY_PROTOCOL, SAFE_VISUAL_PROTOCOL } from "../../../../services/prompts";
import { MODELS } from "../../../../config/models";

/**
 * ENGINE: OMNICHANNEL VIRAL STRATEGIST (v6.0 - Omni-Intelligence Edition)
 * Prioritizes TEXT_PRIMARY for deep creativity, fallbacks to TEXT_FAST.
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
        const primaryModel = MODELS.TEXT_PRIMARY; 
        const fallbackModel = MODELS.TEXT_FAST;

        const optImage = imageUrl ? await optimizeImagePayload(imageUrl, 'vision') : null;
        
        const prompt = `
            [SYSTEM: OMNICHANNEL CONTENT FACTORY v6.0 - OMNI-INTELLIGENCE]
            [ROLE]: Elite Creative Director & Viral Growth Hacker.
            [OBJECTIVE]: Engineer a high-retention, algorithm-optimized viral content ecosystem.
            
            INPUT STORY/CONCEPT: "${baseStory}"
            BRAND DNA & TONE: "${brandDNA}"
            TARGET PLATFORM: ${platform}
            TARGET DURATION: ${duration}
            ${optImage ? "- VISUAL CONTEXT: Attached product/reference image." : ""}

            TASK:
            1. DECONSTRUCT: Analyze the input to find the "Viral Core" (Emotion, Utility, or Shock Value).
            2. HOOK ENGINEERING: Create 3 distinct, high-converting hooks (First 3 seconds).
            3. SCRIPTING: Develop a fast-paced, visually dynamic script with precise audio/visual cues.
               - IMPORTANT: The sum of duration of the shots in your returned list MUST equal the TARGET DURATION.
               - For target duration "10s": Generate exactly 1 Hook shot (represented by the user's selected hook of 5s) and 1 Body or Ending shot (duration 5s), totaling exactly 10 seconds.
               - For target duration "15s": Generate exactly 3 shots of 5s each (1 Hook, 1 Body, 1 Ending), totaling 15 seconds.
               - Each shot's duration in "shots" MUST be strictly 5 seconds to ensure compatibility with standard 5-second video synthesis blocks.
            4. OMNICHANNEL EXPANSION: Generate platform-native social copy and highly shareable quote graphics.
            5. STRICT OUTPUT: Return ONLY valid JSON matching the schema. No markdown formatting outside of JSON.
            6. NO TEXT OVERLAYS: The "visual_prompt" for each shot MUST NOT include any instructions to render text, titles, or subtitles on the video. The video should be pure cinematic visuals.

            ${LANGUAGE_PROTOCOL}
            ${SAFE_VISUAL_PROTOCOL}
            ${VIRAL_STORY_PROTOCOL}

            --- JSON SCHEMA ---
            {
                "plan": {
                    "hookVariants": [
                        { "id": "H1", "title": "Variant Name", "pattern": "POV/ASMR/Educational", "script": "Audio script...", "visual_prompt": "Detailed visual description..." }
                    ],
                    "socialPosts": [
                        { "platform": "Social", "content": "Engaging text with emojis...", "hashtags": ["#tag1", "#tag2"] }
                    ],
                    "instagramQuotes": [
                        { "text": "Punchy, shareable quote...", "style": "Minimalist/Bold/Elegant" }
                    ],
                    "shots": [
                        { "shot_id": "S2", "role": "Body", "duration": 8, "visual_prompt": "Cinematic shot description...", "audio_script": "Voiceover/Text...", "viral_tech": "Pacing/Pattern Interrupt" },
                        { "shot_id": "S3", "role": "Ending", "duration": 4, "visual_prompt": "Call to action visual...", "audio_script": "CTA audio...", "viral_tech": "Loop/CTA" }
                    ]
                },
                "score": { "hookStrength": 95, "retentionLogic": 90, "sharePotential": 85, "totalScore": 90, "notes": "Strategic analysis of why this will go viral." }
            }
        `;

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
                        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } // Add thinking for Pro
                    }
                }),
                2, 1000, primaryModel,
                [
                    () => ai.models.generateContent({ // Fallback to Flash
                        model: fallbackModel,
                        contents: { parts }
                    }),
                    () => ai.models.generateContent({ // Final emergency fallback
                        model: MODELS.TEXT_FAST,
                        contents: { parts }
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
