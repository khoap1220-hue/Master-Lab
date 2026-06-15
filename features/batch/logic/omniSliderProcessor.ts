import { Type } from "@google/genai";
import { BatchJob, ProcessStatus } from '../../../types';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { MODELS } from '../../../config/models';
import { generateDesignVariation } from '../../../services/pixelService';
import { INITIAL_MEMORY } from '../../../data/constants';
import { getExecutionTiers } from '../../../lib/tieredExecutor';

type UpdateStatusFn = (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void;

interface BatchConfig {
    targetText?: string;
    brandVibe: string;
    brandColor: string;
    rebrandStyle: string;
    batchCount?: number;
    packType?: string;
    brandLogo: string | null;
    brandAssets: string[];
}

export const processOmniSlider = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    const state = job.state || {};
    let slides: any[] = state.slides || [];
    let assets: any[] = state.assets || [];

    try {
        const ai = getAI();
        const story = config.targetText || "A generic story.";
        const style = config.brandVibe || "Modern, clean, vibrant";
        const brandColor = config.brandColor || "#000000";
        const material = config.rebrandStyle ? `Material/Texture: ${config.rebrandStyle}.` : "";
        const slideCount = config.batchCount || 5;
        
        // Check if we are already in the rendering phase (e.g., user clicked "Render" after preview)
        const savedPackType = (job.omniLoraInputs as any)?.packType;
        
        const aspectRatio = savedPackType || config.packType || "1:1";

        // Agent 1: Script & Storyboard
        if (slides.length === 0) {
            updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Agent 1: Writing Slider Script..." });
        
        const scriptPrompt = `
            [ROLE: SENIOR CONTENT STRATEGIST & COPYWRITER]
            TASK: You are given a piece of content. Your job is to convert this content into a highly engaging, high-converting carousel/slider presentation.
            
            CONTENT TO PROCESS:
            """
            ${story}
            """
            
            TARGET AUDIENCE & VISUAL STYLE: 
            ${style}
            PRIMARY COLOR: ${brandColor}
            ${material ? `MATERIAL/TEXTURE: ${config.rebrandStyle}` : ''}
            
            CONSTRAINTS & GUIDELINES:
            1. CHECK FOR PRE-DIVIDED SLIDES: If the "CONTENT TO PROCESS" is already explicitly divided into slides (e.g., "Slide 1:", "Slide 2:", etc.), you MUST strictly follow the user's division. Use their exact text for the "text_content" of each slide, and focus your effort on generating the perfect "visual_prompt" for each of their slides. In this case, the number of slides will be determined by the user's input, ignore the ${slideCount} constraint.
            2. IF NOT PRE-DIVIDED: Distill and expand the core message to ensure there is enough valuable content for EXACTLY ${slideCount} slides. Rewrite for maximum impact. "text_content" MUST be engaging, informative, and provide real value (30-60 words per slide).
            3. "visual_prompt" MUST be a highly detailed image generation prompt (describing the scene, lighting, colors, style) that matches the "TARGET AUDIENCE & VISUAL STYLE" and perfectly complements the text.
            4. Slide 1 should be a strong hook. The final slide should include a Call to Action (CTA).
            
            OUTPUT FORMAT (JSON ONLY):
            [
              {
                "thought_process": "Briefly explain how you handled this slide...",
                "slide": 1,
                "visual_prompt": "Detailed image generation prompt...",
                "text_content": "Punchy hook text..."
              }
            ]
        `;

        const scriptResponse = await callWithRetry<any>(
            () => ai.models.generateContent({
                model: MODELS.TEXT_PRIMARY,
                contents: { parts: [{ text: scriptPrompt }] },
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        description: `A list of slides.`,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                thought_process: { type: Type.STRING, description: "Briefly explain how you handled this slide" },
                                slide: { type: Type.INTEGER, description: "Slide number" },
                                visual_prompt: { type: Type.STRING, description: "Detailed image generation prompt" },
                                text_content: { type: Type.STRING, description: "Punchy hook text" }
                            },
                            required: ["thought_process", "slide", "visual_prompt", "text_content"]
                        }
                    }
                }
            }),
            2, 1000, 'OmniSlider-Script',
            [() => ai.models.generateContent({
                model: MODELS.TEXT_PRIMARY,
                contents: { parts: [{ text: scriptPrompt }] },
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        description: `A list of slides.`,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                thought_process: { type: Type.STRING, description: "Briefly explain how you handled this slide" },
                                slide: { type: Type.INTEGER, description: "Slide number" },
                                visual_prompt: { type: Type.STRING, description: "Detailed image generation prompt" },
                                text_content: { type: Type.STRING, description: "Punchy hook text" }
                            },
                            required: ["thought_process", "slide", "visual_prompt", "text_content"]
                        }
                    }
                }
            })]
        );

        try {
            slides = JSON.parse(scriptResponse.text || "[]");
        } catch (e) {
            console.error("Failed to parse script JSON", e);
            throw new Error("Agent 1 failed to generate valid slider JSON.");
        }

        if (!Array.isArray(slides) || slides.length === 0) {
            throw new Error("Agent 1 generated empty slider.");
        }
        
        state.slides = slides;
        updateJobStatus(job.id, 'analyzing_context', { state });
        }

        // Agent 2: Rendering Agent
        updateJobStatus(job.id, 'vectorizing', { progressMessage: `Agent 2: Rendering ${slides.length} Slides...` });
        
        const referenceImages = [];
        if (config.brandLogo) referenceImages.push(config.brandLogo);
        if (config.brandAssets && config.brandAssets.length > 0) {
            referenceImages.push(...config.brandAssets);
        }
        
        const isSynthetic = job.originalUrl.includes("OmniSlider") || job.originalUrl.includes("<svg");
        if (!isSynthetic && job.originalUrl) {
            referenceImages.push(job.originalUrl);
        }

        if (assets.length === 0) {
            assets = new Array(slides.length).fill(null);
        }
        let completedCount = assets.filter(a => a !== null).length;

        const tiers = getExecutionTiers();
        const BATCH_SIZE = tiers.BATCH.concurrency;
        const delay = tiers.BATCH.tierDelay;

        // Batch processing for slides
        for (let i = 0; i < slides.length; i += BATCH_SIZE) {
            const batch = slides.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (slide, idx) => {
                const globalIdx = i + idx;
                if (assets[globalIdx] !== null) return; // Skip already generated
                try {
                    const renderPrompt = `[SLIDER BACKGROUND] ${slide.visual_prompt}. Style: ${style}. Primary Color Palette: ${brandColor}. ${material} High quality, masterpiece, clean composition. IMPORTANT: Include the following text exactly as written: "${slide.text_content}". CRITICAL: If a reference image is provided, the product/subject MUST be kept EXACTLY as it is. Only change the background, lighting, and add the typography.`;
                    
                    const res = await generateDesignVariation(
                        renderPrompt,
                        null, // No base image to preserve layout of
                        INITIAL_MEMORY, 
                        'Social Media', 
                        referenceImages, 
                        undefined,
                        aspectRatio, 
                        false
                    );
                    
                    assets[globalIdx] = {
                        id: `slide-${globalIdx}-${job.id}`,
                        name: `Slide ${globalIdx + 1}`,
                        flattenedUrl: res.image,
                        layers: {
                            content: `**Visual Prompt:** ${slide.visual_prompt}\n\n**Text Content:** ${slide.text_content}`
                        },
                        modelUsed: res.model
                    };

                    completedCount++;

                    // Filter out nulls for the incremental update
                    const currentAssets = assets.filter(a => a !== null);

                    // Update the job status incrementally so the user can see the slides as they are generated
                    state.assets = assets;
                    updateJobStatus(job.id, 'vectorizing', { 
                        progressMessage: `Agent 2: Rendering Slide ${completedCount}/${slides.length}...`,
                        extractedAssets: [...currentAssets],
                        resultUrl: currentAssets[0]?.flattenedUrl, // Show the first slide as the main result
                        state
                    });

                } catch (e) {
                    console.warn(`Failed to render slide ${globalIdx}`, e);
                    throw new Error(`Agent 2 failed at Slide ${globalIdx + 1}. Please retry to resume.`);
                }
            });

            await Promise.all(batchPromises);

            if (i + BATCH_SIZE < slides.length) {
                await new Promise(r => setTimeout(r, delay));
            }
        }

        const finalAssets = assets.filter(a => a !== null);

        if (finalAssets.length === 0) throw new Error("Agent 2 failed to render any slides.");

        // Agent 3: Compositing Agent
        updateJobStatus(job.id, 'completed', { 
            progressMessage: "Agent 3: Compositing Final Slider...",
            extractedAssets: finalAssets, 
            resultUrl: finalAssets[0].flattenedUrl, 
            modelUsed: finalAssets[0].modelUsed,
            omniLoraInputs: {
                characterRefs: referenceImages,
                characterProfiles: '',
                style,
                story,
                characterDNA: 'N/A'
            },
            state: {} // Clear state on success
        });

    } catch (error: any) {
        const currentAssets = assets.filter(a => a !== null);
        updateJobStatus(job.id, 'failed', { 
            error: error.message,
            state: { ...state, slides, assets },
            extractedAssets: currentAssets.length > 0 ? currentAssets : undefined
        });
    }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'omni-slider',
    name: 'Omni Slider',
    description: 'Tạo chuỗi ảnh carousel/slider cho quảng cáo.',
    icon: 'Images',
    category: 'Marketing',
    priority: 55,
    processFn: processOmniSlider
});
