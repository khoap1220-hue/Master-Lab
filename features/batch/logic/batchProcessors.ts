
import { BatchJob, ProcessStatus, RefreshStrategy } from '../../../types';
import { getClosestAspectRatio, createFlatDielineLayout, optimizeImagePayload } from '../../../lib/utils';
import { pixelSmithEdit, generateDesignVariation, upscaleTo4K, scanAndFlattenDocument, generate360ProductViews, generateBaseImage } from '../../../services/pixelService';
import { executeBackgroundRemoval, executeMockupDecomposition } from '../../../services/agentService';
import { INITIAL_MEMORY } from '../../../data/constants';
import { runFontStrategist } from '../../font-maker/agents/1_fontStrategist';
import { runStyledTextGenerator } from '../../font-maker/agents/2_seedExpander';
import { extractPackagingStyle, composeSurfacePlan } from '../../../services/packaging/agents';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { executeManagedTask } from '../../../lib/tieredExecutor';
import { runUXDirector } from './agents/uxDirector'; 

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
}

type UpdateStatusFn = (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void;

// --- EXPORT NEW PROCESSOR ---
export { processAdCampaign } from './adCampaignProcessor';

/**
 * HELPER: Forensic Structural Analysis (Pro-First)
 */
const performForensicScan = async (imageUrl: string, categoryHint: string): Promise<string> => {
    return executeManagedTask('ANALYSIS_DEEP', async () => {
        const ai = getAI();
        const primaryModel = "gemini-3.1-pro-preview"; 
        const fallbackModel = "gemini-3-flash-preview"; 
        
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
                    config: { thinkingConfig: { thinkingBudget: 2048 } }
                }), 
                2, 2000, 'Forensic-Pro',
                () => ai.models.generateContent({
                    model: fallbackModel,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] }
                })
            );
            return response.text?.trim() || "Visual composition.";
        } catch (e) {
            return "Standard visual design.";
        }
    });
};

export const processRemoveBg = async (job: BatchJob, updateJobStatus: UpdateStatusFn) => {
    try {
        const res = await executeBackgroundRemoval(job.originalUrl, job.file.name, INITIAL_MEMORY);
        updateJobStatus(job.id, 'completed', { resultUrl: res.image });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processUpscale = async (job: BatchJob, updateJobStatus: UpdateStatusFn) => {
    try {
        const ratio = await getClosestAspectRatio(job.originalUrl);
        const resUp = await upscaleTo4K(job.originalUrl, job.file.name, ratio, 'general');
        updateJobStatus(job.id, 'completed', { resultUrl: resUp });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processDecompose = async (job: BatchJob, updateJobStatus: UpdateStatusFn) => {
    try {
        const assets = await executeMockupDecomposition(job.id, job.originalUrl, (status, partial) => {
            updateJobStatus(job.id, 'decomposing', { progressMessage: status, extractedAssets: partial });
        });
        updateJobStatus(job.id, 'completed', { extractedAssets: assets, resultUrl: assets[0]?.flattenedUrl });
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
        
        updateJobStatus(job.id, 'completed', { resultUrl: resMock.image });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processPrintPrep = async (job: BatchJob, updateJobStatus: UpdateStatusFn) => {
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
             updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Semantic Scan: Decoding Visual DNA..." });
             const analysis = await performForensicScan(job.originalUrl, "Design Asset");
             contextDescription = `Modernize this ${analysis}`;
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
            promptParts.push("EXECUTION: SOFT REFRESH. Keep exact layout.");
        } else if (strategy === 'HARD') {
            promptParts.push("EXECUTION: HARD REBOOT. Sáng tạo tự do.");
        } else {
            promptParts.push("EXECUTION: HYBRID REFRESH. Modernize structure.");
        }

        const mainPrompt = promptParts.join("\n");

        if (strategy === 'SOFT') {
            result = await generateDesignVariation(mainPrompt, job.originalUrl, INITIAL_MEMORY, 'Branding', config.brandAssets, undefined, ratio, true);
        } else if (strategy === 'HARD') {
            result = await generateDesignVariation(mainPrompt, job.originalUrl, INITIAL_MEMORY, 'Branding', [...config.brandAssets], undefined, ratio, false);
        } else {
            result = await pixelSmithEdit(mainPrompt, INITIAL_MEMORY, job.originalUrl, job.file.name, "Neural Refresh Upgrade", 'Branding', job.maskUrl, undefined, config.brandLogo || undefined);
        }

        updateJobStatus(job.id, 'completed', { resultUrl: result.image, refreshStrategy: strategy, refreshedFrom: job.originalUrl });
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
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "[AGENT 1] Phân tích DNA nét chữ..." });
        const strategy = await runFontStrategist(job.originalUrl);
        updateJobStatus(job.id, 'vectorizing', { progressMessage: `[AGENT 2] Vẽ chữ "${textToRender}"...` });
        const { resultImageUrl } = await runStyledTextGenerator(job.originalUrl, strategy, textToRender);
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
            updateJobStatus(job.id, 'localizing', { progressMessage: "[Architect] Assembling 2D Flat Plan..." });
            const fullDieline = await createFlatDielineLayout(frontFlat, backResult.image, sideResult.image);
            const assets = [
                { id: 'dieline-master', name: '1. Master Flat Dieline', flattenedUrl: fullDieline, layers: {} },
                { id: 'structure-viz', name: '2. Structure: Exploded View', flattenedUrl: structureResult.image, layers: {} },
                { id: 'panel-1-front', name: '3. Front (Flattened)', flattenedUrl: frontFlat, layers: {} },
                { id: 'panel-2-back', name: '4. Back (Generated)', flattenedUrl: backResult.image, layers: {} },
                { id: 'panel-3-side', name: '5. Side (Generated)', flattenedUrl: sideResult.image, layers: {} },
            ];
            updateJobStatus(job.id, 'completed', { resultUrl: fullDieline, extractedAssets: assets });
            return;
        }

        const basePrompt = `[MODE: REVERSE ENGINEERING] INPUT: ${userContext}. REFERENCE: Use Input Image as absolute truth.`;
        const viewPrompts = [
            { id: 'exploded', name: '1. Exploded View', prompt: `${basePrompt} TASK: HYPER-COMPLEX EXPLODED VIEW.`, ratio: "4:3" },
            { id: 'front', name: '2. Front Elevation', prompt: `${basePrompt} TASK: FRONT ELEVATION.`, ratio: exactRatio },
            { id: 'side', name: '3. Side Profile', prompt: `${basePrompt} TASK: SIDE PROFILE.`, ratio: exactRatio },
            { id: 'top', name: '4. Top Plan', prompt: `${basePrompt} TASK: TOP-DOWN PLAN.`, ratio: "1:1" },
            { id: 'detail', name: '5. Macro Detail', prompt: `${basePrompt} TASK: MACRO CLOSE-UP.`, ratio: "16:9" }
        ];

        const results = await Promise.all(viewPrompts.map(v => generateDesignVariation(v.prompt, job.originalUrl, INITIAL_MEMORY, 'Product Design', [], undefined, v.ratio)));
        const assets = results.map((res, i) => ({ id: `view-${viewPrompts[i].id}`, name: viewPrompts[i].name, flattenedUrl: res.image, layers: {} }));
        updateJobStatus(job.id, 'completed', { resultUrl: assets[0].flattenedUrl, extractedAssets: assets });
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

        let activeScreens: Array<{ name: string, description: string }> = [];
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
        const assets = [];
        for (let i=0; i < activeScreens.length; i++) {
            const screen = activeScreens[i];
            const prompt = `[SENIOR UI DESIGN] Platform: ${platform}. App: ${appContext}. Screen: ${screen.name}. Description: ${screen.description}. ${brandVibe} ${brandColor} Requirement: High-Fidelity Flat 2D View. Modern, Clean, Professional.`;
            const res = await (isSynthetic ? generateBaseImage(prompt, INITIAL_MEMORY, 'UX/UI Design', platform.includes('Mobile') ? "9:16" : "16:9") : generateDesignVariation(prompt, job.originalUrl, INITIAL_MEMORY, 'UX/UI Design', config.brandAssets, undefined, platform.includes('Mobile') ? "9:16" : "16:9", false));
            assets.push({ id: `screen-${i}`, name: screen.name, flattenedUrl: res.image, layers: {} });
            await new Promise(r => setTimeout(r, 1000)); // Cool down rate limit
        }

        updateJobStatus(job.id, 'completed', { extractedAssets: assets, resultUrl: assets[0].flattenedUrl });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};
