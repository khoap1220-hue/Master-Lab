import { BatchJob, ProcessStatus } from '../../../types';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { MODELS } from '../../../config/models';
import { generateDesignVariation } from '../../../services/pixelService';
import { INITIAL_MEMORY } from '../../../data/constants';
import { optimizeImagePayload } from '../../../lib/utils';
import { executeManagedTask, getExecutionTiers } from '../../../lib/tieredExecutor';

type UpdateStatusFn = (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void;

interface BatchConfig {
    targetText?: string;
    brandVibe: string;
    rebrandStyle: string;
    brandAssets: string[];
}

export const processOmniLoRA = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    // Khôi phục trạng thái từ checkpoint (nếu có)
    const state = job.state || {};
    let characterDNA = state.characterDNA || config.rebrandStyle || "A generic protagonist";
    let panels = state.panels || [];
    let assets = state.assets || [];

    try {
        const story = config.targetText || "A hero walks into a mysterious forest.";
        const style = config.brandVibe || "Anime/Webtoon style, vibrant colors, high quality";
        const characterRefs = config.brandAssets || [];
        const characterProfiles = config.rebrandStyle || "";
        
        // Agent 1: Orchestrator
        if (!state.orchestrated) {
            updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Agent 1: Orchestrating workflow..." });
            await new Promise(r => setTimeout(r, 1000));
            state.orchestrated = true;
            updateJobStatus(job.id, 'analyzing_context', { state });
        }

        // Agent 3: Character & Asset Manager
        if (!state.characterDNA && characterRefs.length > 0) {
            updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Agent 3: Extracting Character DNA..." });
            
            const dnaPrompt = `
                [ROLE: CHARACTER MANAGER AGENT]
                TASK: You are given ${characterRefs.length} character reference images.
                User provided character profiles/names: ${characterProfiles}
                
                Describe the physical appearance, clothing, and distinguishing features of the characters in these images in extreme detail. 
                Map the provided names to the visual descriptions.
                This will be used as a reference tag (DNA) to keep the characters consistent across multiple comic panels.
                OUTPUT: A concise but highly detailed mapping of Character Name -> Visual DNA.
            `;
            
            const parts: any[] = [{ text: dnaPrompt }];
            for (const ref of characterRefs) {
                const optRef = await optimizeImagePayload(ref, 'generation');
                parts.push({ inlineData: { mimeType: "image/png", data: optRef.split(',')[1] } });
            }

            characterDNA = await executeManagedTask('ANALYSIS_FAST', async () => {
                const ai = getAI();
                const dnaResponse = await callWithRetry<any>(
                    () => ai.models.generateContent({
                        model: MODELS.TEXT_PRIMARY,
                        contents: { parts }
                    }),
                    2, 1000, 'OmniLoRA-DNA',
                    [() => ai.models.generateContent({
                        model: MODELS.TEXT_FAST,
                        contents: { parts }
                    })]
                );
                return dnaResponse.text?.trim() || characterDNA;
            });

            state.characterDNA = characterDNA;
            updateJobStatus(job.id, 'analyzing_context', { state });
        }

        // Agent 2: Script & Storyboard
        if (panels.length === 0) {
            updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Agent 2: Writing Script & Storyboard..." });
            
            const scriptPrompt = `
                [ROLE: SCRIPT & STORYBOARD AGENT]
                TASK: Convert the following story into a comic storyboard.
                STORY: ${story}
                AVAILABLE CHARACTERS: ${characterDNA}
                
                OUTPUT FORMAT (JSON ONLY):
                [
                  {
                    "panel": 1,
                    "action": "Description of the scene and character action",
                    "camera": "Close-up / Wide shot / etc.",
                    "dialogue": "Character speech or narration (keep it short)"
                  }
                ]
                Generate as many panels as needed to tell the story, but keep it concise (max 10 panels for this demo).
            `;

            panels = await executeManagedTask('COPYWRITING_FAST', async () => {
                const ai = getAI();
                const scriptResponse = await callWithRetry<any>(
                    () => ai.models.generateContent({
                        model: MODELS.TEXT_PRIMARY,
                        contents: { parts: [{ text: scriptPrompt }] },
                        config: { responseMimeType: "application/json" }
                    }),
                    2, 1000, 'OmniLoRA-Script',
                    [() => ai.models.generateContent({
                        model: MODELS.TEXT_FAST,
                        contents: { parts: [{ text: scriptPrompt }] },
                        config: { responseMimeType: "application/json" }
                    })]
                );

                try {
                    return JSON.parse(scriptResponse.text || "[]");
                } catch (e) {
                    console.error("Failed to parse script JSON", e);
                    throw new Error("Agent 2 failed to generate valid storyboard JSON.");
                }
            });

            if (!Array.isArray(panels) || panels.length === 0) {
                throw new Error("Agent 2 generated empty storyboard.");
            }

            state.panels = panels;
            updateJobStatus(job.id, 'analyzing_context', { state });
        }

        // Agent 4: Prompt Engineer
        updateJobStatus(job.id, 'vectorizing', { progressMessage: "Agent 4: Engineering Prompts..." });
        const renderPrompts = panels.map(p => {
            return `[COMIC PANEL] ${p.camera} shot. ${p.action}. Characters involved must match this DNA: ${characterDNA}. Style: ${style}. High quality, masterpiece, comic book illustration.`;
        });

        // Agent 5: Rendering Agent
        updateJobStatus(job.id, 'vectorizing', { progressMessage: `Agent 5: Rendering ${panels.length} Panels...` });
        
        const tiers = getExecutionTiers();
        const BATCH_SIZE = tiers.BATCH.concurrency;
        const delay = tiers.BATCH.tierDelay;

        // Batch processing for panels
        for (let i = assets.length; i < panels.length; i += BATCH_SIZE) {
            const batch = panels.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (panel, idx) => {
                const globalIdx = i + idx;
                updateJobStatus(job.id, 'vectorizing', { progressMessage: `Agent 5: Rendering Panel ${globalIdx + 1}/${panels.length}...` });
                
                try {
                    const res = await generateDesignVariation(
                        renderPrompts[globalIdx],
                        null, 
                        INITIAL_MEMORY, 
                        'Social Media', 
                        characterRefs, 
                        undefined,
                        "1:1", 
                        false
                    );
                    
                    return {
                        id: `panel-${globalIdx}-${job.id}`,
                        name: `Panel ${globalIdx + 1}`,
                        flattenedUrl: res.image,
                        layers: {
                            content: `![Panel ${globalIdx + 1}](${res.image})\n\n**Action:** ${panels[globalIdx].action}\n**Camera:** ${panels[globalIdx].camera}\n**Dialogue:** ${panels[globalIdx].dialogue || 'None'}`
                        },
                        modelUsed: res.model
                    };
                } catch (e) {
                    console.warn(`Failed to render panel ${globalIdx}`, e);
                    throw new Error(`Agent 5 failed at Panel ${globalIdx + 1}. Please retry to resume.`);
                }
            });

            const results = await Promise.all(batchPromises);
            assets.push(...results);
            state.assets = assets;
            updateJobStatus(job.id, 'vectorizing', { state });

            if (i + BATCH_SIZE < panels.length) {
                await new Promise(r => setTimeout(r, delay));
            }
        }

        if (assets.length === 0) throw new Error("Agent 5 failed to render any panels.");

        // Agent 6: Compositing Agent
        updateJobStatus(job.id, 'completed', { 
            progressMessage: "Agent 6: Compositing Final Page...",
            extractedAssets: assets, 
            resultUrl: assets[0].flattenedUrl, 
            modelUsed: assets[0].modelUsed,
            omniLoraInputs: {
                characterRefs,
                characterProfiles,
                style,
                story,
                characterDNA
            },
            state: {} // Xóa state khi hoàn thành
        });

    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { 
            error: error.message,
            state: { ...state, characterDNA, panels, assets },
            extractedAssets: assets.length > 0 ? assets : undefined
        });
    }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'omnilora',
    name: 'OmniLoRA Comic',
    description: 'Tạo truyện tranh nhất quán nhân vật từ ảnh gốc.',
    icon: 'BookOpen',
    category: 'Design',
    priority: 65,
    processFn: processOmniLoRA
});
