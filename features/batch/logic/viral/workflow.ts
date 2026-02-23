
import { BatchJob, ProcessStatus, ViralStoryPlan } from "../../../../types";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { INITIAL_MEMORY } from "../../../../data/constants";
import { runViralEngine } from "./engine";
import { optimizeImagePayload } from "../../../../lib/utils";
import { generateDesignVariation } from "../../../../services/pixelService";

interface BatchConfig {
    brandVibe: string;
    targetText?: string; 
    platform?: string;
    duration?: string;
}

/**
 * HELPER: DRAFT VISUAL GENERATOR (Using Flash Image)
 */
const generateDraftVisual = async (prompt: string, refImage?: string, ratio: string = "9:16") => {
    const ai = getAI();
    const model = "gemini-2.5-flash-image"; // FLASH FOR KEYFRAMES
    
    const parts: any[] = [{ text: prompt }];
    if (refImage) {
        const optRef = await optimizeImagePayload(refImage, 'generation');
        parts.push({ inlineData: { mimeType: "image/png", data: optRef.split(',')[1] } });
    }

    const response = await callWithRetry<any>(
        () => ai.models.generateContent({
            model,
            contents: { parts },
            config: { imageConfig: { aspectRatio: ratio as any } }
        }),
        3, 1000, model
    );

    let image = undefined;
    response.candidates?.[0]?.content?.parts?.forEach((part: any) => {
        if (part.inlineData) image = `data:image/png;base64,${part.inlineData.data}`;
    });
    return image;
};

/**
 * ORCHESTRATOR: MAIN WORKFLOW
 */
export const processViralStory = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    try {
        const isSynthetic = job.originalUrl.includes("Viral Story Plan") || job.originalUrl.includes("<svg");
        const hasImage = !isSynthetic;

        updateJobStatus(job.id, 'scripting', { progressMessage: "V1 Agent: Brainstorming Strategy (Flash 3)..." });

        // 1. Plan Generation (Now using Flash 3)
        const result = await runViralEngine(
            config.targetText || (hasImage ? "This Product" : "Product Concept"),
            config.brandVibe,
            config.platform || "TikTok",
            config.duration || "15s",
            hasImage ? job.originalUrl : undefined
        );

        updateJobStatus(job.id, 'visualizing_hooks', { progressMessage: "V2 Agent: Rendering Keyframes (Flash 2.5)..." });
        
        const hooksWithImages = [];
        const hooks = result?.plan?.hookVariants || [];

        // 2. Sequential Flash Image Gen
        for (let i = 0; i < hooks.length; i++) {
            const hook = hooks[i];
            updateJobStatus(job.id, 'visualizing_hooks', { progressMessage: `Visualizing Hook (${i + 1}/${hooks.length})...` });

            try {
                const keyframeImage = await generateDraftVisual(
                    `[CINEMATIC] ${hook.visual_prompt}. Professional advertising photography, 4k detail.`,
                    hasImage ? job.originalUrl : undefined
                );
                hooksWithImages.push({ ...hook, keyframeImage });
            } catch (e: any) {
                console.warn(`Keyframe failed for ${hook.id}`, e);
                // Fail-fast on 403 Permission
                if (e.message?.includes("403") || e.message?.includes("permission")) {
                    updateJobStatus(job.id, 'failed', { error: "Lỗi phân quyền (403). Vui lòng cấu hình API Key từ Project đã bật Billing." });
                    return;
                }
                hooksWithImages.push({ ...hook, keyframeImage: hasImage ? job.originalUrl : undefined });
            }
            await new Promise(r => setTimeout(r, 1200));
        }

        const finalPlan: ViralStoryPlan = {
            ...(result.plan || {}),
            hookVariants: hooksWithImages,
            socialPosts: result.plan?.socialPosts || [],
            instagramQuotes: result.plan?.instagramQuotes || [],
            shots: result.plan?.shots || []
        } as ViralStoryPlan;

        updateJobStatus(job.id, 'completed', { 
            progressMessage: "Ready for channel distribution.",
            viralPlan: finalPlan,
            viralScore: result.score
        });

    } catch (error: any) {
        console.error("Viral Process Error:", error);
        updateJobStatus(job.id, 'failed', { error: error.message || "Engine busy. Please retry." });
    }
};

/**
 * ORCHESTRATOR: SELECTION & AUTO-VISUALIZE
 */
export const confirmViralHook = async (
    job: BatchJob, 
    hookId: string,
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    if (!job.viralPlan || !job.viralPlan.hookVariants) return;

    const selected = job.viralPlan.hookVariants.find(h => h.id === hookId);
    if (!selected) return;

    const baseShots = (job.viralPlan.shots || []).filter(s => s.role !== 'Hook');
    
    const initialShots = [
        { 
            shot_id: "S1", 
            role: "Hook" as const, 
            duration: 3, 
            visual_prompt: selected.visual_prompt, 
            audio_script: selected.script, 
            viral_tech: selected.pattern, 
            keyframeImage: selected.keyframeImage
        },
        ...baseShots
    ];

    updateJobStatus(job.id, 'completed', { 
        progressMessage: "Syncing Timeline Visuals...",
        viralPlan: { ...job.viralPlan, selectedHookId: hookId, shots: initialShots }
    });

    try {
        const isSynthetic = job.originalUrl.includes("Viral Story Plan") || job.originalUrl.includes("<svg");
        const renderedShots = [];

        for (const shot of initialShots) {
            if (shot.keyframeImage) {
                renderedShots.push(shot);
                continue;
            }

            try {
                // Background Render for other shots (Body/Ending)
                const keyframeImage = await generateDraftVisual(
                    `[STORYBOARD CONTINUITY] ${shot.visual_prompt}. Consistent style and product.`,
                    selected.keyframeImage || (isSynthetic ? undefined : job.originalUrl)
                );
                renderedShots.push({ ...shot, keyframeImage });
            } catch (e: any) {
                console.warn(`Shot failed: ${shot.shot_id}`, e);
                if (e.message?.includes("403")) {
                    updateJobStatus(job.id, 'failed', { error: "Lỗi phân quyền. Kiểm tra Billing." });
                    return;
                }
                renderedShots.push(shot); 
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        updateJobStatus(job.id, 'completed', { 
            viralPlan: {
                ...job.viralPlan,
                selectedHookId: hookId,
                shots: renderedShots
            }
        });
    } catch (e) {
        console.warn("Timeline visualization failed", e);
    }
};

export const resetViralHook = (
    job: BatchJob,
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    if (!job.viralPlan) return;
    updateJobStatus(job.id, 'completed', {
        progressMessage: "Select a hook strategy.",
        viralPlan: { ...job.viralPlan, selectedHookId: undefined }
    });
};

/**
 * ORCHESTRATOR: GENERATE QUOTE VISUAL
 */
export const generateQuoteVisual = async (
    job: BatchJob,
    quoteIndex: number,
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    if (!job.viralPlan?.instagramQuotes?.[quoteIndex]) return;
    
    updateJobStatus(job.id, 'drafting_content', { progressMessage: "Designing Quote Visual..." });

    try {
        const quote = job.viralPlan.instagramQuotes[quoteIndex];
        const isSynthetic = job.originalUrl.includes("Viral Story Plan") || job.originalUrl.includes("<svg");
        
        // Use generateDesignVariation for higher quality text rendering
        // Use 4:5 ratio for Instagram Portrait
        const res = await generateDesignVariation(
            `[INSTAGRAM QUOTE DESIGN] Text: "${quote.text}". Style: ${quote.style}. Typography focus, clean, aesthetic, high contrast.`,
            isSynthetic ? null : job.originalUrl, 
            INITIAL_MEMORY,
            'Marketing & Ads',
            [], // No extra moodboard
            undefined, // No brand url
            "4:5", // Target ratio
            false // Don't preserve layout, allow creation
        );

        // Update Job Data
        const newQuotes = [...job.viralPlan.instagramQuotes];
        newQuotes[quoteIndex] = { ...quote, imageUrl: res.image };
        
        updateJobStatus(job.id, 'completed', { 
            viralPlan: { ...job.viralPlan, instagramQuotes: newQuotes },
            progressMessage: "Quote Generated."
        });

    } catch (e: any) {
        console.error("Quote Gen Failed:", e);
        updateJobStatus(job.id, 'failed', { error: `Quote Gen Failed: ${e.message}` });
    }
};
