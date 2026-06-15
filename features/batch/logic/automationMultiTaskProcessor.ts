
import { BatchJob, ProcessStatus } from '../../../types';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { executeManagedTask } from '../../../lib/tieredExecutor';

import { MODELS } from '../../../config/models';
import { SAFE_VISUAL_PROTOCOL } from '../../../services/prompts';

type UpdateStatusFn = (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void;

interface AutomationConfig {
    targetText?: string; // The "Big Data" input
    batchCount?: number; // Number of tasks/outputs
    isAutoPilot?: boolean;
    brandVibe?: string;
    brandColor?: string;
    rebrandStyle?: string;
    brandLogo?: string | null;
    brandAssets?: string[];
}

/**
 * PROCESSOR: AUTOMATION MULTI-TASK
 * Input: "Big Data" (Text/File)
 * Process: Multi-Agent Analysis -> Strategy -> Execution
 * Output: Multi-format assets (JSON, Markdown, Images)
 */
export const processAutomationMultiTask = async (
    job: BatchJob,
    config: AutomationConfig,
    updateJobStatus: UpdateStatusFn
) => {
    const state = job.state || {};
    let analysisResult = state.analysisResult;
    let assets: any[] = state.assets || [];

    try {
        const inputData = config.targetText || "No input data provided.";
        
        // STEP 1: DEEP ANALYSIS (The "Big Data" Processor)
        if (!analysisResult) {
            updateJobStatus(job.id, 'analyzing_context', { progressMessage: "[Central Brain] Ingesting & Analyzing Data..." });
            
            analysisResult = await executeManagedTask('ANALYSIS_DEEP', async () => {
            const ai = getAI();
            const model = MODELS.TEXT_PRIMARY;
            
            const prompt = `
                [SYSTEM ROLE: MASTER ORCHESTRATOR & DATA INTELLIGENCE UNIT]
                AUTHORITY LEVEL: MAXIMUM (SYSTEM-WIDE DELEGATION)

                TASK: Analyze the following INPUT DATA and BRANDING CONTEXT with deep empathy and psychological insight.
                OBJECTIVE: You are the Supreme Commander and Chief Empathy Officer of the system. You have the authority to mobilize ALL existing system resources, specialized engines, and agents (e.g., UX/UI Flow Engine, Structural Architect, Viral Story Engine, Product Photographer, Ad Campaign Manager, Font Creator, Print Prep, Copywriter, Visual Artist, Brochure Designer, and any future modules) to complete the work.
                
                CRITICAL INSTRUCTION: Do not just process the literal text. Read between the lines. Understand the user's unstated goals, the emotional core of their brand, and the psychological triggers of their target audience. Your strategy must reflect a profound comprehension of *why* the user wants this and *who* they are trying to reach.
                
                Extract deep psychological insights, identify emotional patterns, and propose a comprehensive execution plan with distinct tasks delegated to the most appropriate specialized agents.
                
                LANGUAGE: VIETNAMESE (All output must be in Vietnamese)
                
                BRANDING CONTEXT:
                - Brand Vibe: ${config.brandVibe || "Not specified"}
                - Brand Color: ${config.brandColor || "Not specified"}
                - Style/Theme: ${config.rebrandStyle || "Not specified"}
                
                INPUT DATA:
                "${inputData.substring(0, 5000)}..." (Truncated for context)
                
                OUTPUT JSON FORMAT:
                {
                    "summary": "Tóm tắt dữ liệu, mục tiêu cốt lõi và chiến lược tổng thể (Tiếng Việt)",
                    "psychological_profile": "Phân tích tâm lý khách hàng mục tiêu và định vị cảm xúc của thương hiệu (Tiếng Việt)",
                    "key_insights": ["Insight sâu sắc 1", "Insight sâu sắc 2", "Insight sâu sắc 3"],
                    "recommended_tasks": [
                        { 
                            "id": "task_1", 
                            "agent": "Tên Agent/Module được điều động (VD: VIRAL_STORY_ENGINE, UX_DIRECTOR, PRODUCT_PHOTOGRAPHER, COPYWRITER, VISUAL_ARTIST, BROCHURE_DESIGNER...)", 
                            "type": "TEXT" | "VISION" | "HYBRID",
                            "name": "Tên tác vụ", 
                            "description": "Prompt/Chỉ thị chi tiết và cụ thể giao cho Agent này thực hiện. Nếu là thiết kế brochure, hãy chỉ định rõ nội dung và hình ảnh cho mặt trước (Front) và mặt sau (Back)." 
                        }
                    ]
                }
            `;

            const response = await callWithRetry<any>(() => ai.models.generateContent({
                model,
                contents: { parts: [{ text: prompt }] },
                config: {  }
            }), 2, 1000, model, [
                () => ai.models.generateContent({
                    model: MODELS.TEXT_FAST,
                    contents: { parts: [{ text: prompt }] },
                    config: {  }
                })
            ], 600000);

            let jsonStr = response.text || "{}";
            jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        });

        if (!analysisResult.recommended_tasks || !Array.isArray(analysisResult.recommended_tasks)) {
            throw new Error("Failed to analyze data. Invalid response format.");
        }
        
        state.analysisResult = analysisResult;
        updateJobStatus(job.id, 'analyzing_context', { state });
        }

        // STEP 2: MULTI-TASK EXECUTION (Parallel Agents)
        updateJobStatus(job.id, 'processing', { progressMessage: `[Orchestrator] Kích hoạt ${analysisResult.recommended_tasks.length} Tác vụ song song...` });

        const tasks = analysisResult.recommended_tasks;

        // Execute tasks sequentially to prevent timeouts and server overload
        const startIndex = assets.length;
        for (let i = startIndex; i < tasks.length; i++) {
            const task = tasks[i];
            updateJobStatus(job.id, 'processing', { progressMessage: `[Tác vụ ${i+1}/${tasks.length}] Điều động ${task.agent}: ${task.name}...` });
            
            let content = "";
            let flattenedUrl = undefined;

            if (task.type === 'VISION' || task.type === 'HYBRID') {
                // 1. Generate Prompt (English for better image gen)
                const imagePrompt = await executeManagedTask('COPYWRITING_FAST', async () => {
                    const ai = getAI();
                    const promptRes = await callWithRetry<any>(() => ai.models.generateContent({
                        model: MODELS.TEXT_FAST,
                        contents: { parts: [{ text: `[AGENT: ${task.agent}] Generate a high-quality, detailed image generation prompt for: ${task.description}. 
                        Context: ${JSON.stringify(analysisResult.key_insights)}. 
                        Psychological Profile: ${JSON.stringify(analysisResult.psychological_profile)}. 
                        Brand Vibe: ${config.brandVibe}. 
                        Brand Color: ${config.brandColor}. 
                        Style: ${config.rebrandStyle}. 
                        
                        ${SAFE_VISUAL_PROTOCOL}
                        
                        OUTPUT: Just the prompt text in English. NO meta-talk.` }] }
                    }), 2, 1000, MODELS.TEXT_FAST, [
                        () => ai.models.generateContent({
                            model: MODELS.TEXT_FAST, // Fallback to same if only one fast model, or another fast one if available
                            contents: { parts: [{ text: `[AGENT: ${task.agent}] Generate a high-quality, detailed image generation prompt for: ${task.description}.` }] }
                        })
                    ]);
                    return promptRes.text;
                });
                
                content = `**[${task.agent}] Visual Prompt:**\n${imagePrompt}\n\n`;

                // 2. Generate Image
                try {
                    flattenedUrl = await executeManagedTask('IMAGE_GEN_BATCH', async () => {
                        const ai = getAI();
                        const parts: any[] = [{ text: imagePrompt }];
                        const isSynthetic = job.originalUrl.includes("Automation") || job.originalUrl.includes("<svg");
                        if (!isSynthetic && job.originalUrl) {
                            const { optimizeImagePayload } = await import('../../../lib/utils');
                            const optRef = await optimizeImagePayload(job.originalUrl, 'generation');
                            parts.push({ inlineData: { mimeType: "image/png", data: optRef.split(',')[1] } });
                            parts[0].text += "\nCRITICAL: The product/subject in the reference image MUST be kept EXACTLY as it is. Only change the background, lighting, and add the typography.";
                        }

                        const imageRes = await callWithRetry<any>(() => ai.models.generateContent({
                            model: MODELS.IMAGE_PRIMARY,
                            contents: { parts },
                            config: { imageConfig: { aspectRatio: "1:1" } }
                        }), 2, 1000, MODELS.IMAGE_PRIMARY, [
                            () => ai.models.generateContent({
                                model: MODELS.IMAGE_PRO,
                                contents: { parts },
                                config: { imageConfig: { aspectRatio: "1:1" } }
                            })
                        ], 600000, true);

                        // Extract Image
                        let imgUrl: string | undefined;
                        if (imageRes?.generatedImages?.[0]?.image?.imageBytes) {
                            imgUrl = `data:image/png;base64,${imageRes.generatedImages[0].image.imageBytes}`;
                        } else {
                            const imagePart = imageRes?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
                            if (imagePart) {
                                imgUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                            }
                        }
                        return imgUrl;
                    });
                } catch (e) {
                    console.warn("Image generation failed", e);
                    content += "\n[Error] Image generation failed.";
                }
            }

            if (task.type === 'TEXT' || task.type === 'HYBRID') {
                // Text Task
                const textContent = await executeManagedTask('CREATIVE_WRITING', async () => {
                    const ai = getAI();
                    const textRes = await callWithRetry<any>(() => ai.models.generateContent({
                        model: MODELS.TEXT_PRIMARY,
                        contents: { parts: [{ text: `[SYSTEM ROLE: ${task.agent}] Execute task: ${task.name}. Description: ${task.description}. Context: ${JSON.stringify(analysisResult.summary)}. Psychological Profile: ${JSON.stringify(analysisResult.psychological_profile)}. Brand Vibe: ${config.brandVibe}. Brand Color: ${config.brandColor}. Style: ${config.rebrandStyle}. LANGUAGE: VIETNAMESE (Output must be in Vietnamese, use Markdown formatting). Embody the brand's voice and deeply connect with the target audience's psychology.` }] }
                    }), 2, 1000, MODELS.TEXT_PRIMARY, [
                        () => ai.models.generateContent({
                            model: MODELS.TEXT_FAST,
                            contents: { parts: [{ text: `[SYSTEM ROLE: ${task.agent}] Execute task: ${task.name}. Description: ${task.description}. Context: ${JSON.stringify(analysisResult.summary)}. Psychological Profile: ${JSON.stringify(analysisResult.psychological_profile)}. Brand Vibe: ${config.brandVibe}. Brand Color: ${config.brandColor}. Style: ${config.rebrandStyle}. LANGUAGE: VIETNAMESE (Output must be in Vietnamese, use Markdown formatting). Embody the brand's voice and deeply connect with the target audience's psychology.` }] }
                        })
                    ], 600000);
                    return textRes.text;
                });
                content += textContent;
            }

            assets.push({
                id: task.id,
                name: `[${task.agent}] ${task.name}`,
                type: task.type,
                content: content,
                flattenedUrl: flattenedUrl,
                originalUrl: job.originalUrl
            });
            
            state.assets = assets;
            updateJobStatus(job.id, 'processing', { state });
        }

        // STEP 3: AGGREGATE OUTPUT
        updateJobStatus(job.id, 'completed', { 
            resultUrl: job.originalUrl, // Keep original or set to a summary image
            extractedAssets: assets.map(a => ({
                id: a.id,
                name: a.name,
                flattenedUrl: a.flattenedUrl || a.originalUrl, // Fallback
                layers: { 
                    content: (a.type === 'TEXT' || a.type === 'HYBRID' || !a.flattenedUrl) ? a.content : undefined
                } 
            })),
            state: {} // Clear state on success
        });

    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { 
            error: error.message,
            state: { ...state, analysisResult, assets },
            extractedAssets: assets.map(a => ({
                id: a.id,
                name: a.name,
                flattenedUrl: a.flattenedUrl || a.originalUrl,
                layers: { 
                    content: (a.type === 'TEXT' || a.type === 'HYBRID' || !a.flattenedUrl) ? a.content : undefined
                } 
            }))
        });
    }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'automation-multi-task',
    name: 'Automation Multi-Task',
    description: 'Tự động phân tích và điều phối nhiều Agent cùng lúc.',
    icon: 'Cpu',
    category: 'Automation',
    priority: 5,
    processFn: processAutomationMultiTask
});
