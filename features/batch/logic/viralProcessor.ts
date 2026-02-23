
import { Type, GenerateContentResponse } from "@google/genai";
import { BatchJob, ProcessStatus, ViralStoryPlan, ViralScore, HookVariant } from '../../../types';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { cleanJson } from '../../../services/orchestrator/utils';
import { executeManagedTask } from '../../../lib/tieredExecutor';
import { optimizeImagePayload } from '../../../lib/utils';
import { generateBaseImage, generateDesignVariation } from '../../../services/pixelService'; // Import DesignVariation for I2I
import { INITIAL_MEMORY } from '../../../data/constants';

interface BatchConfig {
    brandVibe: string;
    targetText?: string; 
    platform?: string;
    duration?: string;
}

export const processViralStory = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    try {
        const isSynthetic = job.originalUrl.includes("Viral Story Plan") || job.originalUrl.includes("<svg");

        updateJobStatus(job.id, 'scripting', { progressMessage: "V1 Agent: Analyzing Brand DNA..." });
        await new Promise(r => setTimeout(r, 1500)); 

        updateJobStatus(job.id, 'scripting', { progressMessage: "V2 Agent: Drafting 3 Hook Strategies..." });

        // 1. Generate Plan with 3 Hooks
        const result = await runViralEngine(
            config.targetText || (isSynthetic ? "Product Showcase" : "This product"),
            config.brandVibe,
            config.platform || "TikTok",
            config.duration || "15s"
        );

        // 2. Parallel Render Keyframes for 3 Hooks
        // FIX: If user uploaded a real image (not synthetic), use it as a reference for Image-to-Image generation
        updateJobStatus(job.id, 'visualizing_hooks', { progressMessage: "V3 Agent: Rendering Keyframe Visuals..." });
        
        const hooksWithImages = await Promise.all(result.plan.hookVariants!.map(async (hook) => {
            try {
                if (!isSynthetic) {
                    // USER UPLOAD DETECTED: Use Image-to-Image
                    // We use generateDesignVariation which supports refImage
                    const res = await generateDesignVariation(
                        `[CINEMATIC KEYFRAME] ${hook.visual_prompt}. Maintain the product identity from the input image. High quality, 4k detail.`,
                        job.originalUrl, // <--- INPUT IMAGE
                        INITIAL_MEMORY,
                        'Multimedia',
                        [], // No extra moodboard
                        undefined, // No brand url
                        "9:16" // Target ratio for TikTok/Reels
                    );
                    return { ...hook, keyframeImage: res.image };
                } else {
                    // TEXT ONLY MODE: Use Text-to-Image
                    const res = await generateBaseImage(
                        `[CINEMATIC KEYFRAME] ${hook.visual_prompt}. High quality, 4k detail.`,
                        INITIAL_MEMORY,
                        'Multimedia',
                        "9:16"
                    );
                    return { ...hook, keyframeImage: res.image };
                }
            } catch (e) {
                console.warn(`Keyframe fail for ${hook.id}`, e);
                return hook;
            }
        }));

        const finalPlan: ViralStoryPlan = {
            ...result.plan,
            hookVariants: hooksWithImages
        };

        updateJobStatus(job.id, 'completed', { 
            progressMessage: "Hooks ready for selection.",
            viralPlan: finalPlan,
            viralScore: result.score
        });

    } catch (error: any) {
        console.error("Viral Process Error:", error);
        updateJobStatus(job.id, 'failed', { error: error.message || "Script generation failed." });
    }
};

/**
 * SELECT & CONFIRM HOOK
 */
export const confirmViralHook = (
    job: BatchJob, 
    hookId: string,
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    if (!job.viralPlan || !job.viralPlan.hookVariants) return;

    const selected = job.viralPlan.hookVariants.find(h => h.id === hookId);
    if (!selected) return;

    // Build finalized shots array
    const finalShots = [
        { 
            shot_id: "S1", 
            role: "Hook" as const, 
            duration: 3, 
            visual_prompt: selected.visual_prompt, 
            audio_script: selected.script, 
            viral_tech: selected.pattern,
            keyframeImage: selected.keyframeImage // Ensure keyframe is carried over
        },
        ...job.viralPlan.shots // AI generated Body/Ending shots
    ];

    updateJobStatus(job.id, 'completed', { 
        progressMessage: "Selection confirmed. Ready to render video.",
        viralPlan: {
            ...job.viralPlan,
            selectedHookId: hookId,
            shots: finalShots
        }
    });
};

/**
 * GENERATE VEO VIDEO
 */
export const generateVeoVideo = async (
    job: BatchJob,
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    if (!job.viralPlan || !job.viralPlan.selectedHookId) {
        updateJobStatus(job.id, 'failed', { error: "Please select a hook strategy first." });
        return;
    }

    try {
        updateJobStatus(job.id, 'rendering_video', { progressMessage: "Veo 3: Uploading & Pre-processing Assets..." });

        const selectedHook = job.viralPlan.hookVariants?.find(h => h.id === job.viralPlan?.selectedHookId);
        const hookShot = job.viralPlan.shots.find(s => s.role === 'Hook') || job.viralPlan.shots[0];
        
        // Use the Rendered Keyframe Image as the starting frame for Veo for maximum consistency
        const startFrame = selectedHook?.keyframeImage || job.originalUrl;
        
        const prompt = `Cinematic Video: ${hookShot.visual_prompt}. Photorealistic, 4k, smooth cinematic motion, high quality textures.`;
        const optImage = await optimizeImagePayload(startFrame, 'upscale_input');

        const ai = getAI();
        const model = "veo-3.1-fast-generate-preview";

        let operation = await ai.models.generateVideos({
            model,
            prompt: prompt,
            image: {
                imageBytes: optImage.split(',')[1],
                mimeType: 'image/png'
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '9:16'
            }
        });

        let elapsed = 0;
        const POLLING_INTERVAL = 5000;

        while (!operation.done) {
            elapsed += (POLLING_INTERVAL / 1000);
            let phaseMessage = "Initializing Physics Engine...";
            if (elapsed > 10) phaseMessage = "Generating Motion Vectors...";
            if (elapsed > 25) phaseMessage = "Refining Lighting & Shadows...";
            if (elapsed > 45) phaseMessage = "Finalizing Neural Encoding...";

            updateJobStatus(job.id, 'rendering_video', { 
                progressMessage: `Veo 3.1: ${phaseMessage} (${elapsed}s)` 
            });
            
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL)); 
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(`Veo Failed: ${operation.error.message}`);
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (videoUri) {
            // FIX: Safely append API Key with correct separator
            const separator = videoUri.includes('?') ? '&' : '?';
            updateJobStatus(job.id, 'completed', { 
                progressMessage: "Video Generation Successful.",
                videoUrl: `${videoUri}${separator}key=${process.env.API_KEY || process.env.GEMINI_API_KEY || ''}`
            });
        } else {
            throw new Error("Render complete but no video URI found.");
        }

    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: `${error.message}` });
    }
};

/**
 * ENGINE: 3-VARIANT GENERATOR
 */
const runViralEngine = async (
    baseStory: string,
    brandDNA: string,
    platform: string,
    duration: string
): Promise<{ plan: ViralStoryPlan, score: ViralScore }> => {
    
    return executeManagedTask('STRATEGY_PLANNING', async () => {
        const ai = getAI();
        const model = "gemini-3.1-pro-preview";

        const prompt = `
            [SYSTEM: VIRAL STORY ENGINE v3.5]
            [MODE: MULTI-AGENT HOOK STRATEGY]
            
            TASK: Generate 3 DISTINCT Hook Variations for a viral video.
            
            INPUT:
            - Concept: "${baseStory}"
            - Brand Style: "${brandDNA}"
            - Platform: ${platform}
            - Total Duration: ${duration}

            REQUIREMENTS:
            1. hookVariants: Provide exactly 3 options.
               - Variant 1: "Visual Hook" (Shocking or aesthetic imagery).
               - Variant 2: "Story Hook" (Relatable problem or question).
               - Variant 3: "ASMR/Detail Hook" (Focus on texture/sound).
            2. shots: Provide ONLY the Body and Ending shots (S2, S3...) that work with ANY of the 3 hooks.
            3. visual_prompt: Must be English, detailed for AI synthesis.

            OUTPUT JSON SCHEMA:
            {
                "plan": {
                    "hookVariants": [
                        { "id": "H1", "title": "...", "pattern": "...", "script": "...", "visual_prompt": "..." },
                        ...x3
                    ],
                    "twist": "...",
                    "ending": "...",
                    "shots": [
                        // Start from Shot S2 (Body)
                        { "shot_id": "S2", "role": "Body", "duration": 8, "visual_prompt": "...", "audio_script": "...", "viral_tech": "..." },
                        { "shot_id": "S3", "role": "Ending", "duration": 4, "visual_prompt": "...", "audio_script": "...", "viral_tech": "..." }
                    ]
                },
                "score": {
                    "type": "object",
                    "properties": {
                        "hookStrength": { "type": "number" },
                        "retentionLogic": { "type": "number" },
                        "sharePotential": { "type": "number" },
                        "totalScore": { "type": "number" },
                        "notes": { "type": "string" }
                    }
                }
            }
        `;

        const config = {
            thinkingConfig: { thinkingBudget: 2048 }, 
            responseMimeType: "application/json",
            responseSchema: {
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
                            twist: { type: Type.STRING },
                            ending: { type: Type.STRING },
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
            }
        } as any;

        try {
            const response = await ai.models.generateContent({
                model,
                contents: { parts: [{ text: prompt }] },
                config
            });

            const parsed = JSON.parse(cleanJson(response.text || "{}"));
            
            // --- AUTO-REPAIR Logic for "Missing Shots" ---
            if (!parsed?.plan?.shots || parsed.plan.shots.length === 0) {
                console.warn("AI skipped shots, repairing...");
                parsed.plan.shots = [
                    { shot_id: "S2", role: "Body", duration: 7, visual_prompt: `A dynamic showcase of ${baseStory}`, audio_script: "Experience the magic.", viral_tech: "Value Prop" },
                    { shot_id: "S3", role: "Ending", duration: 5, visual_prompt: `Call to action for ${baseStory}`, audio_script: "Click to learn more.", viral_tech: "CTA" }
                ];
            }

            if (!parsed?.plan?.hookVariants || parsed.plan.hookVariants.length === 0) {
                throw new Error("Invalid Engine Output: No hooks found.");
            }

            return parsed;
        } catch (e) {
            console.error("Engine script failed:", e);
            throw e;
        }
    });
};
