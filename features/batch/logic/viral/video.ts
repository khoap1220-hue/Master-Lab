import { GoogleGenAI } from "@google/genai";
import { BatchJob, ProcessStatus } from "../../../../types";
import { getAI } from "../../../../lib/gemini";
import { optimizeImagePayload } from "../../../../lib/utils";

declare global {
    // FIX: Changed to a named interface to resolve subsequent property declaration error.
    // This ensures consistency with other parts of the codebase that define window.aistudio.
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

/**
 * HELPER: POLL VEO OPERATION WITH RICH PROGRESS
 */
const pollOperation = async (ai: any, initialOp: any, onProgress: (updates: Partial<BatchJob>) => void): Promise<any> => {
    let operation = initialOp;
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll faster
        operation = await ai.operations.getVideosOperation({ operation: operation });

        // --- RICH PROGRESS REPORTING ---
        const metadata = operation.metadata;
        if (metadata && typeof metadata.progress_percentage === 'number') {
            onProgress({
                progress: metadata.progress_percentage,
                progressMessage: metadata.progress_message || `Đang render... ${metadata.progress_percentage}%`
            });
        } else {
            // Fallback for older API or different metadata structure
            onProgress({ progressMessage: "Đang xử lý video..." });
        }
    }
    if (operation.error) throw new Error(operation.error.message);
    return operation;
};

/**
 * VIDEO: SEQUENTIAL NEURAL EXTENSION (v2 - STABILIZED)
 */
export const generateVeoVideo = async (
    job: BatchJob,
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    if (!job.viralPlan || !job.viralPlan.selectedHookId) {
        updateJobStatus(job.id, 'failed', { error: "Vui lòng chọn một chiến lược Hook trước." });
        return;
    }

    try {
        // --- API KEY SELECTION FLOW (CRITICAL FOR VEO) ---
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                updateJobStatus(job.id, 'rendering_video', { 
                    progressMessage: "Yêu cầu API Key trả phí để render video. Đang mở hộp thoại..." 
                });
                await window.aistudio.openSelectKey();
                // Per docs, assume success and proceed.
            }
        }

        // --- DYNAMIC AI INSTANCE (DO NOT USE SINGLETON FOR VEO) ---
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("API Key is missing. Please select a key or check your configuration.");
        }
        const ai = new GoogleGenAI({ apiKey }); 
        const model = "veo-3.1-generate-preview";
        const shots = job.viralPlan.shots;
        
        // --- PHASE 1: RENDER HOOK (BASE VIDEO) ---
        const hookShot = shots.find(s => s.role === 'Hook')!;
        updateJobStatus(job.id, 'rendering_video', { progressMessage: "Neural Phase 1: Rendering Hook..." });
        
        const startFrame = hookShot.keyframeImage || job.originalUrl;
        const optStartFrame = await optimizeImagePayload(startFrame, 'upscale_input');

        let currentOp = await ai.models.generateVideos({
            model,
            prompt: `[SHOT 1: HOOK] ${hookShot.visual_prompt}. Cinematic, high quality. Action matches script: ${hookShot.audio_script}`,
            image: { imageBytes: optStartFrame.split(',')[1], mimeType: 'image/png' },
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
        });

        currentOp = await pollOperation(ai, currentOp, (updates) => updateJobStatus(job.id, 'rendering_video', { ...updates, progressMessage: `Shot 1: ${updates.progressMessage}` }));

        // --- PHASE 2: SEQUENTIAL EXTENSIONS ---
        const remainingShots = shots.filter(s => s.role !== 'Hook');
        for (let i = 0; i < remainingShots.length; i++) {
            const shot = remainingShots[i];
            const shotName = `Shot ${i + 2} (${shot.role})`;
            updateJobStatus(job.id, 'rendering_video', { progressMessage: `Neural Phase ${i + 2}: Extending ${shot.role}...` });

            const lastVideo = currentOp.response?.generatedVideos?.[0]?.video;

            currentOp = await ai.models.generateVideos({
                model,
                video: lastVideo,
                prompt: `[STORY CONTINUATION] Character and environment continuity. ${shot.visual_prompt}. Action strictly matches audio script: ${shot.audio_script}`,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
            });

            currentOp = await pollOperation(ai, currentOp, (updates) => updateJobStatus(job.id, 'rendering_video', { ...updates, progressMessage: `${shotName}: ${updates.progressMessage}` }));
        }

        // --- PHASE 3: FINALIZATION ---
        const finalVideoUri = currentOp.response?.generatedVideos?.[0]?.video?.uri;
        if (!finalVideoUri) throw new Error("Neural Extension hoàn tất nhưng không tìm thấy URI.");

        const urlObj = new URL(finalVideoUri);
        urlObj.searchParams.set('key', apiKey);
        
        const response = await fetch(urlObj.toString(), { credentials: 'omit' });
        if (!response.ok) throw new Error(`Đồng bộ video thất bại: ${response.status}`);
        
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);

        updateJobStatus(job.id, 'completed', { 
            progressMessage: "Render câu chuyện thành công.",
            videoUrl,
            progress: 100
        });

    } catch (error: any) {
        console.error("Sequence Error:", error);
        // --- API KEY ERROR HANDLING ---
        if (error.message && error.message.includes("Requested entity was not found.")) {
             updateJobStatus(job.id, 'failed', { error: "API Key không hợp lệ hoặc hết hạn. Vui lòng chọn lại Key từ một Project đã bật thanh toán." });
             return;
        }
        updateJobStatus(job.id, 'failed', { error: `Render bị gián đoạn: ${error.message}` });
    }
};