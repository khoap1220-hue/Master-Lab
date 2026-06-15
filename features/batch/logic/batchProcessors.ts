
import { globalAgentRegistry } from './registry';
import { BatchJob, ProcessStatus, RefreshStrategy } from '../../../types';
import { getClosestAspectRatio, createFlatDielineLayout, optimizeImagePayload } from '../../../lib/utils';
import { pixelSmithEdit, generateDesignVariation, upscaleTo4K, scanAndFlattenDocument, generateBaseImage, generate360ProductViews } from '../../../services/pixelService';
import { executeBackgroundRemoval, executeMockupDecomposition } from '../../../services/agentService';
import { INITIAL_MEMORY } from '../../../data/constants';
import { runFontStrategist } from '../../font-maker/agents/1_fontStrategist';
import { runStyledTextGenerator } from '../../font-maker/agents/2_seedExpander';
import { extractPackagingStyle } from '../../../services/packaging/agents';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { ThinkingLevel, Type } from '@google/genai';
import { executeManagedTask, getExecutionTiers } from '../../../lib/tieredExecutor';
import { runUXDirector } from './agents/uxDirector'; 
import { UXUI_DESIGN_PROTOCOL } from '../../../services/prompts';
import { MODELS, isProTier } from '../../../config/models';
import { getKeyPool } from '../../../lib/keyManager';

interface BatchConfig {
    brandVibe: string;
    brandColor: string;
    rebrandStyle: string;
    brandLogo: string | null;
    brandAssets: string[];
    targetText?: string;
    refreshStrategy?: RefreshStrategy;
    // Packaging / Structure
    packDimensions?: { w: number, h: number, d: number };
    packType?: string;
    // Photography
    batchCount?: number;
    isAutoPilot?: boolean;
    modelRefImage?: string | null;
    // Video
    videoResolution?: string;
    videoAudioEnabled?: boolean;
    isRenderingPhase?: boolean;
    approvedSlides?: any[];
}

type UpdateStatusFn = (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void;

// --- REGISTRY ---

/**
 * HELPER: Forensic Structural Analysis (Pro-First)
 */
const performForensicScan = async (imageUrl: string, categoryHint: string): Promise<string> => {
    return executeManagedTask('ANALYSIS_DEEP', async () => {
        const ai = getAI();
        const primaryModel = MODELS.TEXT_PRIMARY; 
        const fallbackModel = MODELS.TEXT_FAST; 
        
        const optImage = await optimizeImagePayload(imageUrl, 'generation');

        const prompt = `
            [SYSTEM ROLE: SENIOR VISUAL FORENSIC ANALYST]
            TASK: Analyze the INPUT IMAGE of a "${categoryHint}".
            OBJECTIVE: Identify the subject, context, and key visual elements to describe it for a redesign or campaign.
            OUTPUT: Concise professional description (e.g. "A premium serum bottle on a marble podium", "A dashboard showing financial analytics").
        `;

        try {
            const response = await callWithRetry<any>(
                () => ai.models.generateContent({
                    model: primaryModel,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                }), 
                2, 1000, 'Forensic-Pro',
                [() => ai.models.generateContent({
                    model: fallbackModel,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] }
                })]
            );
            return response.text?.trim() || "Visual composition.";
        } catch (e) {
            return "Standard visual design.";
        }
    });
};

const performDesignIntentAnalysis = async (imageUrl: string): Promise<string> => {
    return executeManagedTask('ANALYSIS_DEEP', async () => {
        const ai = getAI();
        const primaryModel = MODELS.TEXT_PRIMARY; 
        const fallbackModel = MODELS.TEXT_FAST; 
        
        const optImage = await optimizeImagePayload(imageUrl, 'generation');

        const prompt = `
            [SYSTEM ROLE: SENIOR UX/UI & CREATIVE DIRECTOR]
            TASK: Analyze the INPUT IMAGE. This might be a rough sketch, a bad design, or a low-quality mockup.
            OBJECTIVE: 
            1. Understand the USER INTENT: What is the core message or product they are trying to convey?
            2. Identify the key elements (text, subjects, logos, layout structure).
            3. Propose a professional vision: Describe how this should look with a modern layout, aesthetic color coordination, high-resolution details, and professional lighting.
            OUTPUT: A concise, highly descriptive prompt (max 3 sentences) that can be used to generate a professional, high-end version of this design. Focus on the ideal final result, not the flaws of the current image.
        `;

        try {
            const response = await callWithRetry<any>(
                () => ai.models.generateContent({
                    model: primaryModel,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                }), 
                2, 1000, 'Design-Intent-Pro',
                [() => ai.models.generateContent({
                    model: fallbackModel,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] }
                })]
            );
            return response.text?.trim() || "Professional, high-quality, modern design.";
        } catch (e) {
            return "Professional, high-quality, modern design.";
        }
    });
};

export const processRemoveBg = async (job: BatchJob, config: BatchConfig, updateJobStatus: UpdateStatusFn) => {
    try {
        const res = await executeBackgroundRemoval(job.originalUrl, job.file.name, INITIAL_MEMORY);
        updateJobStatus(job.id, 'completed', { resultUrl: res.image, modelUsed: res.model });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processUpscale = async (job: BatchJob, config: BatchConfig, updateJobStatus: UpdateStatusFn) => {
    try {
        const ratio = await getClosestAspectRatio(job.originalUrl);
        const { image, model } = await upscaleTo4K(job.originalUrl, job.file.name, ratio, '4K');
        updateJobStatus(job.id, 'completed', { resultUrl: image, modelUsed: model });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processDecompose = async (job: BatchJob, config: BatchConfig, updateJobStatus: UpdateStatusFn) => {
    try {
        const state = job.state || {};
        const assets = await executeMockupDecomposition(job.id, job.originalUrl, (status, partial, updatedState) => {
            updateJobStatus(job.id, 'decomposing', { progressMessage: status, extractedAssets: partial, state: updatedState });
        }, state);
        updateJobStatus(job.id, 'completed', { 
            extractedAssets: assets, 
            resultUrl: assets[0]?.flattenedUrl,
            modelUsed: assets[0]?.modelUsed,
            state: {} // Xóa state khi hoàn thành
        });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processAutoMockup = async (job: BatchJob, config: BatchConfig, updateJobStatus: UpdateStatusFn) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Analyzing 3D geometry..." });
        
        const resMock = await pixelSmithEdit(
            `[NEURAL MOCKUP] Vibe: ${config.brandVibe}. Color: ${config.brandColor}.`,
            INITIAL_MEMORY,
            job.originalUrl,
            job.file.name,
            'Mockup',
            'Branding',
            job.maskUrl, 
            undefined,
            config.brandLogo || undefined,
            config.brandAssets.map((a, i) => ({ label: `Asset ${i}`, data: a }))
        );
        
        updateJobStatus(job.id, 'completed', { resultUrl: resMock.image, modelUsed: resMock.model });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processOmniMockup = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Planning Omni-Mockup Variations..." });
        
        const brandVibe = config.brandVibe ? `VISUAL VIBE: ${config.brandVibe}.` : "";
        const brandColor = config.brandColor ? `PRIMARY COLOR: ${config.brandColor}.` : "";
        
        const mockupTypes = [
            { id: 'tshirt', name: 'Apparel (T-Shirt)', prompt: `[MOCKUP] A high-quality, photorealistic blank t-shirt mockup. The uploaded image is the logo/graphic printed on the chest. ${brandVibe} ${brandColor} Studio lighting, clean background.`, ratio: "3:4" },
            { id: 'mug', name: 'Merch (Coffee Mug)', prompt: `[MOCKUP] A photorealistic ceramic coffee mug mockup. The uploaded image is the logo printed on the side of the mug. ${brandVibe} ${brandColor} Placed on a wooden desk, soft morning light.`, ratio: "1:1" },
            { id: 'billboard', name: 'OOH (Billboard)', prompt: `[MOCKUP] A large outdoor billboard mockup in a modern city. The uploaded image is the main visual on the billboard. ${brandVibe} ${brandColor} Cinematic lighting, urban environment.`, ratio: "16:9" },
            { id: 'tote', name: 'Merch (Tote Bag)', prompt: `[MOCKUP] A canvas tote bag mockup hanging on a hook. The uploaded image is printed on the bag. ${brandVibe} ${brandColor} Natural sunlight, lifestyle photography.`, ratio: "3:4" }
        ];

        updateJobStatus(job.id, 'vectorizing', { progressMessage: `Generating 4 Mockup Variations...` });

        const generateMockup = async (mockup: any, index: number) => {
            try {
                // We use the uploaded image as the logo/graphic (brandLogo)
                // We generate a base image with the logo applied
                const res = await generateDesignVariation(
                    mockup.prompt, 
                    job.originalUrl, // Use the uploaded image as the logoAsset
                    INITIAL_MEMORY, 
                    'Branding', 
                    [], // No extra assets
                    undefined, 
                    mockup.ratio, 
                    false
                );
                if (!res.image) throw new Error(res.text || "Neural Refusal: No image generated.");
                return { id: `mockup-${mockup.id}-${job.id}`, name: mockup.name, flattenedUrl: res.image, layers: {}, modelUsed: res.model };
            } catch (e: any) {
                console.warn(`Failed to generate mockup ${mockup.name}`, e);
                if (e.message && e.message.includes('403')) throw e;
                return null;
            }
        };

        const assets: any[] = [];
        const tiers = getExecutionTiers();
        const BATCH_SIZE = tiers.BATCH.concurrency;
        
        for (let i = 0; i < mockupTypes.length; i += BATCH_SIZE) {
            const batch = mockupTypes.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map((m, idx) => generateMockup(m, i + idx)));
            assets.push(...batchResults.filter(res => res !== null));
            if (i + BATCH_SIZE < mockupTypes.length) {
                const delay = tiers.BATCH.tierDelay;
                await new Promise(r => setTimeout(r, delay));
            }
        }

        if (assets.length === 0) throw new Error("No mockups generated.");

        updateJobStatus(job.id, 'completed', { extractedAssets: assets, resultUrl: assets[0].flattenedUrl, modelUsed: assets[0].modelUsed });

    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processOmnichannelResize = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Analyzing Image Composition..." });
        
        const imageDesc = await executeManagedTask('ANALYSIS_DEEP', async () => {
            const ai = getAI();
            const optImage = await optimizeImagePayload(job.originalUrl, 'generation');
            
            const prompt = `
                [SYSTEM ROLE: SENIOR ART DIRECTOR]
                TASK: Describe the main subject and background of this image in extreme detail so it can be recreated in different aspect ratios.
                OUTPUT: A highly detailed prompt describing the image.
            `;

            const response = await callWithRetry<any>(
                () => ai.models.generateContent({
                    model: MODELS.TEXT_PRIMARY,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                }), 
                2, 1000, 'Omnichannel-Resize-Analysis',
                [() => ai.models.generateContent({
                    model: MODELS.TEXT_FAST,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] }
                })]
            );

            return response.text?.trim() || "A high quality image.";
        });

        const formats = [
            { id: 'ig-story', name: 'IG Story (9:16)', ratio: "9:16" },
            { id: 'fb-post', name: 'FB Post (1:1)', ratio: "1:1" },
            { id: 'web-banner', name: 'Web Banner (16:9)', ratio: "16:9" }
        ];

        updateJobStatus(job.id, 'vectorizing', { progressMessage: `Generating 3 Formats...` });

        const generateFormat = async (format: any) => {
            try {
                const res = await generateDesignVariation(
                    `[OMNICHANNEL RESIZE] Recreate this exact scene perfectly adapted for a ${format.name} format. Description: ${imageDesc}`, 
                    job.originalUrl, 
                    INITIAL_MEMORY, 
                    'Marketing & Ads', 
                    [], 
                    undefined, 
                    format.ratio, 
                    false
                );
                if (!res.image) throw new Error(res.text || "Neural Refusal: No image generated.");
                return { id: `resize-${format.id}-${job.id}`, name: format.name, flattenedUrl: res.image, layers: {}, modelUsed: res.model };
            } catch (e: any) {
                console.warn(`Failed to generate format ${format.name}`, e);
                return null;
            }
        };

        const assets: any[] = [];
        const tiers = getExecutionTiers();
        const BATCH_SIZE = tiers.BATCH.concurrency;
        
        for (let i = 0; i < formats.length; i += BATCH_SIZE) {
            const batch = formats.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map(f => generateFormat(f)));
            assets.push(...batchResults.filter(res => res !== null));
            if (i + BATCH_SIZE < formats.length) {
                await new Promise(r => setTimeout(r, tiers.BATCH.tierDelay));
            }
        }

        if (assets.length === 0) throw new Error("No formats generated.");

        updateJobStatus(job.id, 'completed', { extractedAssets: assets, resultUrl: assets[0].flattenedUrl, modelUsed: assets[0].modelUsed });

    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processPrintPrep = async (job: BatchJob, config: BatchConfig, updateJobStatus: UpdateStatusFn) => {
    try {
        const scanned = await scanAndFlattenDocument(job.originalUrl, job.file.name);
        updateJobStatus(job.id, 'completed', { resultUrl: scanned });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

/**
 * PROCESSOR: SMART FULL REFRESH
 */
export const processRefreshJob = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        const strategy = config.refreshStrategy || 'HYBRID';
        let contextDescription = config.targetText;
        let typographyInstruction = "";

        if (contextDescription && (contextDescription.includes('"') || contextDescription.includes("'"))) {
            typographyInstruction = `[TYPOGRAPHY ALERT]: Write text: ${contextDescription}. Make it LEGIBLE and BOLD.`;
        }

        if (!contextDescription || contextDescription.trim() === "") {
             updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Semantic Scan: Analyzing Design Intent..." });
             const analysis = await performDesignIntentAnalysis(job.originalUrl);
             contextDescription = analysis;
             await new Promise(r => setTimeout(r, 800));
        }

        updateJobStatus(job.id, 'refreshing', { progressMessage: `Executing ${strategy} Refresh Strategy...` });
        const ratio = await getClosestAspectRatio(job.originalUrl);
        let result;
        const promptParts: string[] = [];
        promptParts.push(`CONTEXT: ${contextDescription}`);
        if (config.brandVibe) promptParts.push(`TARGET VIBE: ${config.brandVibe}`);
        if (config.brandColor) promptParts.push(`PRIMARY COLOR: ${config.brandColor}`);
        if (typographyInstruction) promptParts.push(typographyInstruction);

        if (strategy === 'SOFT') {
            promptParts.push("EXECUTION: SOFT REFRESH. Keep the exact layout of the original image. Focus ONLY on improving resolution, color coordination, and adding professional lighting effects.");
        } else if (strategy === 'HARD') {
            promptParts.push("EXECUTION: HARD REBOOT. Free creative control. Completely redesign the layout and visuals based on the core intent, ensuring a highly aesthetic and modern result.");
        } else {
            promptParts.push("EXECUTION: HYBRID REFRESH. Keep the core idea but automatically rearrange the layout for better aesthetics, modernize the structure, and apply professional lighting and colors.");
        }

        const mainPrompt = promptParts.join("\n");

        if (strategy === 'SOFT') {
            result = await generateDesignVariation(mainPrompt, job.originalUrl, INITIAL_MEMORY, 'Branding', config.brandAssets, undefined, ratio, true);
        } else if (strategy === 'HARD') {
            result = await generateDesignVariation(mainPrompt, job.originalUrl, INITIAL_MEMORY, 'Branding', [...config.brandAssets], undefined, ratio, false);
        } else {
            result = await pixelSmithEdit(mainPrompt, INITIAL_MEMORY, job.originalUrl, job.file.name, "Neural Refresh Upgrade", 'Branding', job.maskUrl, undefined, config.brandLogo || undefined);
        }

        if (!result.image) throw new Error(result.text || "Neural Refusal: No image generated.");

        updateJobStatus(job.id, 'completed', { 
            resultUrl: result.image, 
            refreshStrategy: strategy, 
            refreshedFrom: job.originalUrl,
            modelUsed: (result as any).model || (result as any).modelUsed
        });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message || "Refresh failed" });
    }
};

export const processStyledTextGeneration = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        const textToRender = config.targetText || "Demo Text";
        const localStyle = config.brandVibe || "";
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "[AGENT 1] Phân tích DNA nét chữ..." });
        const strategy = await runFontStrategist(job.originalUrl);
        updateJobStatus(job.id, 'vectorizing', { progressMessage: `[AGENT 2] Vẽ chữ "${textToRender}"...` });
        const { resultImageUrl } = await runStyledTextGenerator(job.originalUrl, strategy, textToRender, localStyle);
        updateJobStatus(job.id, 'completed', { resultUrl: resultImageUrl, progressMessage: `Hoàn tất: ${strategy.classification}` });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message || "Unknown error" });
    }
};

export const processProduct360 = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Analyzing product structure..." });
        let contextText = config.targetText;
        if (!contextText || contextText.trim() === "") {
             contextText = await performForensicScan(job.originalUrl, "Product");
        }
        const vibe = config.brandVibe ? `Studio Style: ${config.brandVibe}.` : "";
        const color = config.brandColor ? `Theme Color: ${config.brandColor}.` : "";
        const prompt = `${vibe} ${color} ${contextText} Product shot`.trim();
        const images = await generate360ProductViews(prompt, INITIAL_MEMORY, job.originalUrl);
        if (images.length === 0) throw new Error("No images generated.");
        const assets = images.map((img, idx) => ({ id: `360-${job.id}-${idx}`, name: `Angle ${idx + 1}`, flattenedUrl: img, layers: {} }));
        updateJobStatus(job.id, 'completed', { extractedAssets: assets, resultUrl: assets[0].flattenedUrl });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processUniversalStructure = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "[Forensic] Scanning Internal Components..." });
        let userContext = config.targetText;
        const type = config.packType || 'Auto-Detect';
        if (!userContext || userContext.trim() === "") {
            userContext = await performForensicScan(job.originalUrl, type);
        }
        const isPackaging = type.includes('Box') || type.includes('Packaging');
        const exactRatio = await getClosestAspectRatio(job.originalUrl);

        if (isPackaging) {
            const style = await extractPackagingStyle(job.originalUrl);
            updateJobStatus(job.id, 'matting', { progressMessage: "[Architect] Dewarping & Flattening..." });
            const frontFlat = await scanAndFlattenDocument(job.originalUrl, "Visible Packaging Face");
            updateJobStatus(job.id, 'vectorizing', { progressMessage: "[PixelSmith] Hallucinating Hidden Sides..." });
            const backPrompt = `[MODE: PACKAGING TEXTURE] Target: BACK SIDE. STYLE: Match Input Front Face.`;
            const sidePrompt = `[MODE: PACKAGING TEXTURE] Target: SIDE PANEL. STYLE: Match Input Front Face.`;
            const structurePrompt = `[MODE: PACKAGING EXPLODED VIEW] PRODUCT: ${style.textContent.productName}. STYLE: Clean Studio 3D Render.`;
            const [backResult, sideResult, structureResult] = await Promise.all([
                generateDesignVariation(backPrompt, null, INITIAL_MEMORY, 'Packaging', [frontFlat], undefined, "2:3"),
                generateDesignVariation(sidePrompt, null, INITIAL_MEMORY, 'Packaging', [frontFlat], undefined, "1:3"),
                generateDesignVariation(structurePrompt, null, INITIAL_MEMORY, 'Packaging', [frontFlat], undefined, "4:3")
            ]);
            
            if (!backResult.image || !sideResult.image || !structureResult.image) {
                throw new Error("Neural Refusal: No image generated for packaging sides.");
            }
            
            updateJobStatus(job.id, 'localizing', { progressMessage: "[Architect] Assembling 2D Flat Plan..." });
            const fullDieline = await createFlatDielineLayout(frontFlat, backResult.image, sideResult.image);
            const assets = [
                { id: 'dieline-master', name: '1. Master Flat Dieline', flattenedUrl: fullDieline, layers: {}, modelUsed: backResult.model },
                { id: 'structure-viz', name: '2. Structure: Exploded View', flattenedUrl: structureResult.image, layers: {}, modelUsed: structureResult.model },
                { id: 'panel-1-front', name: '3. Front (Flattened)', flattenedUrl: frontFlat, layers: {} },
                { id: 'panel-2-back', name: '4. Back (Generated)', flattenedUrl: backResult.image, layers: {}, modelUsed: backResult.model },
                { id: 'panel-3-side', name: '5. Side (Generated)', flattenedUrl: sideResult.image, layers: {}, modelUsed: sideResult.model },
            ];
            updateJobStatus(job.id, 'completed', { resultUrl: fullDieline, extractedAssets: assets, modelUsed: structureResult.model });
            return;
        }

        const basePrompt = `[MODE: REVERSE ENGINEERING] INPUT: ${userContext}. CATEGORY: ${type}. REFERENCE: Use Input Image as absolute truth.`;
        const viewPrompts = [
            { id: 'exploded', name: '1. Exploded View', prompt: `${basePrompt} TASK: HYPER-COMPLEX EXPLODED VIEW.`, ratio: "4:3" },
            { id: 'front', name: '2. Front Elevation', prompt: `${basePrompt} TASK: FRONT ELEVATION.`, ratio: exactRatio },
            { id: 'side', name: '3. Side Profile', prompt: `${basePrompt} TASK: SIDE PROFILE.`, ratio: exactRatio },
            { id: 'top', name: '4. Top Plan', prompt: `${basePrompt} TASK: TOP-DOWN PLAN.`, ratio: "1:1" },
            { id: 'detail', name: '5. Macro Detail', prompt: `${basePrompt} TASK: MACRO CLOSE-UP.`, ratio: "16:9" }
        ];

        const results: any[] = [];
        const tiers = getExecutionTiers();
        const BATCH_SIZE = tiers.BATCH.concurrency;
        
        for (let i = 0; i < viewPrompts.length; i += BATCH_SIZE) {
            const batch = viewPrompts.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(batch.map(async (v) => {
                const res = await generateDesignVariation(v.prompt, job.originalUrl, INITIAL_MEMORY, 'Product Design', [], undefined, v.ratio);
                if (!res.image) throw new Error(res.text || "Neural Refusal: No image generated.");
                return res;
            }));
            results.push(...batchResults);
            if (i + BATCH_SIZE < viewPrompts.length) {
                await new Promise(r => setTimeout(r, tiers.BATCH.tierDelay));
            }
        }
        const assets = results.map((res, i) => ({ id: `view-${viewPrompts[i].id}`, name: viewPrompts[i].name, flattenedUrl: res.image, layers: {}, modelUsed: res.model }));
        updateJobStatus(job.id, 'completed', { resultUrl: assets[0].flattenedUrl, extractedAssets: assets, modelUsed: results[0].model });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processDesignSystemExtractor = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Scanning UI Elements..." });
        
        const extractionScope = config.packType || 'Full Extraction';
        
        let prompt = `[SYSTEM ROLE: SENIOR UX/UI ARCHITECT]\n`;
        
        if (extractionScope === 'Color Palette Only') {
            prompt += `TASK: Extract ONLY the Color Palette from the provided UI image.
            OUTPUT FORMAT (Markdown):
            # 🎨 Color Palette
            - Primary: [Hex] - [Usage]
            - Secondary: [Hex] - [Usage]
            - Background: [Hex]
            - Text: [Hex]
            - Accents/States: [Hex] - [Usage]`;
        } else if (extractionScope === 'Typography Only') {
            prompt += `TASK: Extract ONLY the Typography hierarchy from the provided UI image.
            OUTPUT FORMAT (Markdown):
            # 🔤 Typography
            - Headings: [Font Family Guess], [Weight], [Size Guess]
            - Subheadings: [Font Family Guess], [Weight], [Size Guess]
            - Body: [Font Family Guess], [Weight], [Size Guess]
            - Small Text: [Font Family Guess], [Weight], [Size Guess]`;
        } else if (extractionScope === 'UI Components Only') {
            prompt += `TASK: Extract ONLY the UI Components specs from the provided UI image.
            OUTPUT FORMAT (Markdown):
            # 🧩 UI Components
            - Buttons: [Border Radius, Padding, Shadow, Colors]
            - Cards: [Border Radius, Background, Shadow, Padding]
            - Inputs: [Border, Background, Padding, Text Color]
            - Navigation/Tabs: [Style, Active State, Spacing]`;
        } else {
            prompt += `TASK: Extract a complete Design System from the provided UI image.
            OUTPUT FORMAT (Markdown):
            # 🎨 Color Palette
            - Primary: [Hex] - [Usage]
            - Secondary: [Hex] - [Usage]
            - Background: [Hex]
            - Text: [Hex]
            
            # 🔤 Typography
            - Headings: [Font Family Guess], [Weight]
            - Body: [Font Family Guess], [Weight]
            
            # 🧩 UI Components
            - Buttons: [Border Radius, Padding, Shadow]
            - Cards: [Border Radius, Background, Shadow]
            - Inputs: [Border, Background, Padding]
            
            # 📏 Spacing & Layout
            - Grid System: [Guess]
            - General Padding: [Guess]`;
        }

        if (config.targetText) {
            prompt += `\n\nADDITIONAL CONTEXT/FOCUS: ${config.targetText}`;
        }

        const extractedText = await executeManagedTask('ANALYSIS_DEEP', async () => {
            const ai = getAI();
            const optImage = await optimizeImagePayload(job.originalUrl, 'generation');
            
            const response = await callWithRetry<any>(
                () => ai.models.generateContent({
                    model: MODELS.TEXT_PRIMARY,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] },
                    config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                }), 
                2, 1000, 'Design-System-Extractor-Pro',
                [() => ai.models.generateContent({
                    model: MODELS.TEXT_FAST,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] }
                })]
            );

            return response.text?.trim() || "Failed to extract design system.";
        });

        updateJobStatus(job.id, 'vectorizing', { progressMessage: "Generating Visual Board..." });

        const visualPrompt = `
            [SENIOR UI DESIGN] Create a clean, modern Design System presentation board.
            Include color swatches, typography hierarchy (Heading 1, Heading 2, Body), and UI components (Buttons, Inputs, Cards).
            Style: Minimalist, professional, Dribbble-quality.
            ${UXUI_DESIGN_PROTOCOL}
        `;

        const visualRes = await generateDesignVariation(visualPrompt, job.originalUrl, INITIAL_MEMORY, 'UX/UI Design', [], undefined, "16:9", false);
        if (!visualRes.image) throw new Error(visualRes.text || "Neural Refusal: No image generated.");

        const assets = [
            { id: `ds-text-${job.id}`, name: 'Design System Specs', flattenedUrl: '', layers: { content: extractedText } },
            { id: `ds-visual-${job.id}`, name: 'Visual Board', flattenedUrl: visualRes.image, layers: {}, modelUsed: visualRes.model }
        ];

        updateJobStatus(job.id, 'completed', { extractedAssets: assets, resultUrl: visualRes.image, modelUsed: visualRes.model });

    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processUXFlow = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        const platform = config.packType || 'Mobile App'; 
        const screenCount = config.batchCount || 3;
        let appContext = config.targetText;
        
        // LOGIC FIX: If user text is empty, scan the image first
        if (!appContext || appContext.trim() === "") {
             updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Forensic Scan: Identifying App Type..." });
             appContext = await performForensicScan(job.originalUrl, "Mobile UI");
        }

        const brandVibe = config.brandVibe ? `VISUAL VIBE: ${config.brandVibe}.` : "";
        const brandColor = config.brandColor ? `PRIMARY COLOR: ${config.brandColor}.` : "";
        const isSynthetic = job.originalUrl.includes("UX Flow Plan") || job.originalUrl.includes("<svg");
        
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: `Planning ${platform} Flow...` });

        let activeScreens: Array<{ name: string, description: string, uiElements?: string[], layout?: string, colorPalette?: string, typography?: string }> = [];
        if (config.isAutoPilot) {
            const directorPlan = await runUXDirector(appContext, platform, screenCount, config.brandVibe);
            activeScreens = directorPlan.screens;
        } else {
            // Default sequence fallback
            activeScreens = [
                { name: "1. Login / Onboarding", description: "Brand Identity focus, clean input fields" },
                { name: "2. Home Dashboard", description: "Main navigation, key metrics, activity feed" },
                { name: "3. Detail / Action", description: "Specific task view, interaction focus" },
                { name: "4. Profile / Settings", description: "User management, preferences" }
            ].slice(0, screenCount);
        }
        
        updateJobStatus(job.id, 'vectorizing', { progressMessage: `Rendering ${activeScreens.length} screens...` });
        
        const generateScreen = async (screen: any, index: number) => {
            const layoutHint = screen.layout ? `Layout: ${screen.layout}.` : '';
            const colorHint = screen.colorPalette ? `Colors: ${screen.colorPalette}.` : '';
            const typoHint = screen.typography ? `Typography: ${screen.typography}.` : '';
            const uiHint = screen.uiElements ? `Key Elements: ${screen.uiElements.join(', ')}.` : '';

            const prompt = `
                [SENIOR UI DESIGN] Platform: ${platform}. App: ${appContext}. Screen: ${screen.name}. 
                Description: ${screen.description}. 
                ${layoutHint} ${colorHint} ${typoHint} ${uiHint}
                ${brandVibe} ${brandColor} 
                Requirement: High-Fidelity Flat 2D View. Modern, Clean, Professional.
                ${UXUI_DESIGN_PROTOCOL}
            `;
            try {
                const res = await (isSynthetic ? generateBaseImage(prompt, INITIAL_MEMORY, 'UX/UI Design', platform.includes('Mobile') ? "9:16" : "16:9") : generateDesignVariation(prompt, job.originalUrl, INITIAL_MEMORY, 'UX/UI Design', config.brandAssets, undefined, platform.includes('Mobile') ? "9:16" : "16:9", false));
                if (!res.image) {
                    throw new Error(res.text || "Neural Refusal: No image generated.");
                }
                return { id: `screen-${index}`, name: screen.name, flattenedUrl: res.image, layers: {}, modelUsed: res.model };
            } catch (e: any) {
                console.warn(`Failed to generate screen ${screen.name}`, e);
                if (e.message && e.message.includes('403')) throw e;
                return null;
            }
        };

        const assets: any[] = [];
        const tiers = getExecutionTiers();
        const BATCH_SIZE = tiers.BATCH.concurrency;
        
        for (let i = 0; i < activeScreens.length; i += BATCH_SIZE) {
            const batch = activeScreens.slice(i, i + BATCH_SIZE);
            console.log(`[UX Flow] Processing batch ${i/BATCH_SIZE + 1}...`);
            
            const batchResults = await Promise.all(batch.map((screen, idx) => generateScreen(screen, i + idx)));
            assets.push(...batchResults.filter(res => res !== null));
            
            if (i + BATCH_SIZE < activeScreens.length) {
                const delay = tiers.BATCH.tierDelay;
                await new Promise(r => setTimeout(r, delay));
            }
        }

        if (assets.length === 0) throw new Error("No screens generated.");

        updateJobStatus(job.id, 'completed', { extractedAssets: assets, resultUrl: assets[0].flattenedUrl, modelUsed: assets[0].modelUsed });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

// --- REGISTRY ---
globalAgentRegistry.register({
    id: 'remove-bg',
    name: 'Remove Background',
    description: 'Tự động tách nền sản phẩm với độ chính xác cao.',
    icon: 'Scissors',
    category: 'Utility',
    priority: 100,
    processFn: processRemoveBg
});

globalAgentRegistry.register({
    id: 'upscale',
    name: 'Upscale 4K',
    description: 'Nâng cấp độ phân giải hình ảnh lên 4K sắc nét.',
    icon: 'Maximize',
    category: 'Utility',
    priority: 110,
    processFn: processUpscale
});

globalAgentRegistry.register({
    id: 'decompose',
    name: 'Decompose Mockup',
    description: 'Phân tách các lớp layer từ ảnh mockup phẳng.',
    icon: 'Layers',
    category: 'Utility',
    priority: 120,
    processFn: processDecompose
});

globalAgentRegistry.register({
    id: 'auto-mockup',
    name: 'Auto Mockup',
    description: 'Tự động ghép logo/thiết kế vào mockup 3D.',
    icon: 'Box',
    category: 'Design',
    priority: 50,
    processFn: processAutoMockup
});

globalAgentRegistry.register({
    id: 'omni-mockup',
    name: 'Omni Mockup',
    description: 'Tạo mockup đa kênh (Áo, Cốc, Túi, Biển bảng).',
    icon: 'Package',
    category: 'Marketing',
    priority: 40,
    processFn: processOmniMockup
});

globalAgentRegistry.register({
    id: 'omnichannel-resize',
    name: 'Omnichannel Resize',
    description: 'Tự động resize ảnh cho nhiều nền tảng MXH.',
    icon: 'Scaling',
    category: 'Marketing',
    priority: 45,
    processFn: processOmnichannelResize
});

globalAgentRegistry.register({
    id: 'print-prep',
    name: 'Print Prep',
    description: 'Chuẩn bị file in ấn, làm phẳng tài liệu.',
    icon: 'Printer',
    category: 'Utility',
    priority: 130,
    processFn: processPrintPrep
});

globalAgentRegistry.register({
    id: 'full-refresh',
    name: 'Full Refresh',
    description: 'Làm mới thiết kế cũ với phong cách hiện đại.',
    icon: 'RefreshCw',
    category: 'Design',
    priority: 60,
    processFn: processRefreshJob
});

globalAgentRegistry.register({
    id: 'font-creation',
    name: 'Font Creation',
    description: 'Tạo chữ nghệ thuật từ văn bản.',
    icon: 'Type',
    category: 'Design',
    priority: 70,
    processFn: processStyledTextGeneration
});

globalAgentRegistry.register({
    id: 'product-360',
    name: 'Product 360',
    description: 'Tạo ảnh sản phẩm 360 độ từ 1 ảnh gốc.',
    icon: 'Rotate3D',
    category: 'Marketing',
    priority: 30,
    processFn: processProduct360
});

globalAgentRegistry.register({
    id: 'structural-architect',
    name: 'Structural Architect',
    description: 'Phân tích cấu trúc và tạo bản vẽ kỹ thuật.',
    icon: 'DraftingCompass',
    category: 'Design',
    priority: 80,
    processFn: processUniversalStructure
});

globalAgentRegistry.register({
    id: 'design-system-extractor',
    name: 'Design System Extractor',
    description: 'Trích xuất hệ thống thiết kế từ UI.',
    icon: 'Palette',
    category: 'Analysis',
    priority: 90,
    processFn: processDesignSystemExtractor
});

globalAgentRegistry.register({
    id: 'ux-flow',
    name: 'UX Flow Generator',
    description: 'Tạo luồng UX/UI từ mô tả.',
    icon: 'GitMerge',
    category: 'Design',
    priority: 85,
    processFn: processUXFlow
});
