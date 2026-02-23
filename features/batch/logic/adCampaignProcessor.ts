
import { Type, GenerateContentResponse } from "@google/genai";
import { BatchJob, ProcessStatus, AdCampaignData } from '../../../types';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { cleanJson } from '../../../services/orchestrator/utils';
import { executeManagedTask } from '../../../lib/tieredExecutor';
import { optimizeImagePayload } from '../../../lib/utils';
import { TYPOGRAPHY_PROTOCOL } from '../../../services/prompts'; 

interface BatchConfig {
    brandVibe: string;
    brandColor: string;
    targetText?: string;
    brandLogo: string | null;
    brandAssets: string[];
}

/**
 * Parses the raw brief to extract content and potential aspect ratio overrides.
 */
const extractRatioAndCleanBrief = (rawText: string): { brief: string, ratio: string } => {
    // Keywords mapping to standard ratios
    const KEYWORD_MAP: Record<string, string> = {
        'banner': '16:9',
        'cover': '21:9',
        'story': '9:16',
        'reel': '9:16',
        'tiktok': '9:16',
        'shorts': '9:16',
        'post': '1:1',
        'square': '1:1',
        'portrait': '4:5',
        'landscape': '16:9'
    };

    const ratioMatch = rawText.match(/\b(\d{1,2}:\d{1,2})\b/);
    let detectedRatio = "4:5"; 

    if (ratioMatch) {
        const rawRatio = ratioMatch[1];
        const [w, h] = rawRatio.split(':').map(Number);
        const val = w / h;
        
        if (val >= 2.3) detectedRatio = "21:9";
        else if (val >= 1.7) detectedRatio = "16:9";
        else if (val >= 1.3) detectedRatio = "4:3";
        else if (val >= 0.9 && val <= 1.1) detectedRatio = "1:1";
        else if (val >= 0.7) detectedRatio = "4:5"; 
        else if (val >= 0.6) detectedRatio = "2:3"; 
        else detectedRatio = "9:16"; 
    } else {
        const lower = rawText.toLowerCase();
        for (const [key, val] of Object.entries(KEYWORD_MAP)) {
            if (lower.includes(key)) {
                detectedRatio = val;
                break;
            }
        }
    }

    const parts = rawText.split('|').map(s => s.trim()).filter(s => {
        const isRatio = s.match(/\b\d{1,2}:\d{1,2}\b/);
        const isMeta = Object.keys(KEYWORD_MAP).some(kw => s.toLowerCase() === kw);
        return !isRatio && !isMeta;
    });
    
    const brief = parts.join('. ');

    return { brief, ratio: detectedRatio };
};

// Internal Helper for Forensic Scan (Duplicated here to keep module standalone or import if exported)
const performAdForensicScan = async (imageUrl: string): Promise<string> => {
    return executeManagedTask('ANALYSIS_DEEP', async () => {
        const ai = getAI();
        const primaryModel = "gemini-3.1-pro-preview"; 
        const fallbackModel = "gemini-3-flash-preview"; 
        const optImage = await optimizeImagePayload(imageUrl, 'generation');
        const prompt = `[SYSTEM ROLE: ADVERTISING ANALYST] Analyze this image. What is the product/service? Who is the audience? Output a concise ad brief.`;
        try {
            const response = await callWithRetry<any>(
                () => ai.models.generateContent({
                    model: primaryModel,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] }
                }), 2, 2000, 'Ad-Forensic',
                () => ai.models.generateContent({
                    model: fallbackModel,
                    contents: { parts: [ { text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } } ] }
                })
            );
            return response.text?.trim() || "Product Promotion";
        } catch (e) { return "Product Promotion"; }
    });
};

export const processAdCampaign = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    try {
        const isGenericName = job.file.name === "Ad Campaign" || job.file.name === "Ad Campaign Plan";
        // LOGIC FIX: Use config.targetText first. If empty, check file name. If file name generic, SCAN.
        let rawBrief = (config.targetText && config.targetText.trim()) ? config.targetText : job.file.name;
        
        if (!rawBrief || isGenericName || rawBrief.trim().length === 0) {
             updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Scanning Image for Ad Context..." });
             rawBrief = await performAdForensicScan(job.originalUrl);
        }
        
        const { brief, ratio } = extractRatioAndCleanBrief(rawBrief);

        // 1. DRAFTING PHASE
        updateJobStatus(job.id, 'drafting_content', { progressMessage: "V1 Agent: Drafting Ad Copy..." });
        const strategy = await runAdStrategyAgent(brief, config.brandVibe);
        
        // 2. RENDERING PHASE
        updateJobStatus(job.id, 'rendering_visuals', { progressMessage: `V2 Agent: Rendering Visuals (${ratio})...` });
        
        const resultImage = await executeManagedTask('IMAGE_GEN_BATCH', async () => {
            const ai = getAI();
            const model = "gemini-3-pro-image-preview"; 
            const backupModel = "gemini-2.5-flash-image"; 

            const visualPrompt = `
            [ADVERTISING PHOTOGRAPHY]
            ${TYPOGRAPHY_PROTOCOL}
            VISUAL GOAL: ${strategy.visualPrompt}.
            TEXT TO RENDER (HEADLINE): "${strategy.headline}"
            SUB-TEXT (OPTIONAL): "${strategy.caption.substring(0, 15)}..."
            STYLE: ${config.brandVibe}. COLOR: ${config.brandColor}.
            QUALITY: High resolution, commercial quality.
            `;

            const parts: any[] = [{ text: visualPrompt }];
            const isSynthetic = job.originalUrl.includes("Ad Campaign") || job.originalUrl.includes("<svg");
            
            if (!isSynthetic) {
                const optRef = await optimizeImagePayload(job.originalUrl, 'generation');
                parts.push({ inlineData: { mimeType: "image/png", data: optRef.split(',')[1] } });
            } else if (config.brandAssets.length > 0) {
                const optAsset = await optimizeImagePayload(config.brandAssets[0], 'generation');
                parts.push({ inlineData: { mimeType: "image/png", data: optAsset.split(',')[1] } });
            }

            const response = await callWithRetry<any>(
                () => ai.models.generateContent({
                    model,
                    contents: { parts },
                    config: { imageConfig: { aspectRatio: ratio as any, imageSize: "1K" } }
                }), 3, 2000, model,
                () => ai.models.generateContent({
                    model: backupModel,
                    contents: { parts },
                    config: { imageConfig: { aspectRatio: ratio as any } }
                })
            );

            let img: string | undefined;
            if (response.generatedImages?.[0]?.image?.imageBytes) {
                return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
            }
            response.candidates?.[0]?.content?.parts?.forEach((part: any) => {
                if (part.inlineData) img = `data:image/png;base64,${part.inlineData.data}`;
            });
            if (!img) throw new Error("Image generation returned empty.");
            return img;
        });

        updateJobStatus(job.id, 'completed', { 
            progressMessage: `Campaign Ready (${ratio}).`,
            resultUrl: resultImage,
            campaignData: strategy
        });

    } catch (error: any) {
        console.error("Ad Campaign Error:", error);
        updateJobStatus(job.id, 'failed', { error: error.message || "Campaign generation failed." });
    }
};

const runAdStrategyAgent = async (brief: string, vibe: string): Promise<AdCampaignData> => {
    return executeManagedTask('COPYWRITING_FAST', async () => {
        const ai = getAI();
        const model = "gemini-3-flash-preview";
        const backupModel = "gemini-3-flash-preview";

        const prompt = `
            [SYSTEM ROLE: SENIOR CREATIVE DIRECTOR]
            TASK: Create a Single-Image Ad Campaign Strategy based on the Brief.
            
            INPUT BRIEF: "${brief}"
            BRAND VIBE: "${vibe}"
            
            REQUIREMENTS:
            1. HEADLINE: Punchy, short (Max 5 words) for Typography on Image. **MUST BE IN VIETNAMESE**.
            2. CAPTION: Engaging social media copy in **VIETNAMESE**.
            3. VISUAL_PROMPT: Detailed **ENGLISH** description for the AI Image Generator. Include "TEXT PLACEHOLDER" positioning.
            
            OUTPUT JSON:
            {
                "headline": "Short Headline (Vietnamese)",
                "caption": "Social caption (Vietnamese)",
                "visualPrompt": "English visual description...",
                "targetAudience": "Audience...",
                "tone": "Tone..."
            }
        `;

        const config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    headline: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    tone: { type: Type.STRING }
                },
                required: ["headline", "caption", "visualPrompt"]
            }
        };

        const response = await callWithRetry<GenerateContentResponse>(
            () => ai.models.generateContent({
                model,
                contents: { parts: [{ text: prompt }] },
                config: config as any
            }), 3, 2000, model,
            () => ai.models.generateContent({ 
                model: backupModel,
                contents: { parts: [{ text: prompt }] },
                config: config as any
            })
        );

        return JSON.parse(cleanJson(response.text || "{}"));
    });
}
