import { BatchJob, ProcessStatus } from "../../../../types";
import { optimizeImagePayload, cropToAspectRatio } from "../../../../lib/utils";
import { MODELS } from "../../../../config/models";
import { getAI, callWithRetry } from "../../../../lib/gemini";
import { executeManagedTask } from "../../../../lib/tieredExecutor";

declare global {
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
        
        operation = await executeManagedTask('VIDEO_GEN', async () => {
            return await ai.operations.getVideosOperation({ operation: operation });
        });

        // --- RICH PROGRESS REPORTING ---
        const metadata = operation.metadata;
        if (metadata && typeof metadata.progress_percentage === 'number') {
            onProgress({
                progress: metadata.progress_percentage,
                progressMessage: metadata.progress_message || `Đang render... ${metadata.progress_percentage}%`
            });
        } else {
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
        if (process.env.GEMINI_API_KEY || process.env.API_KEY) {
            // Server-provided background key is present, proceed
        } else if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                updateJobStatus(job.id, 'rendering_video', { 
                    progressMessage: "Yêu cầu API Key trả phí để render video. Đang mở hộp thoại..." 
                });
                await window.aistudio.openSelectKey();
            }
        }

        const model = MODELS.VIDEO_PRO;
        const shots = job.viralPlan.shots;
        
        // --- PHASE 1: RENDER HOOK (BASE VIDEO) ---
        const hookShot = shots.find(s => s.role === 'Hook')!;
        updateJobStatus(job.id, 'rendering_video', { progressMessage: "Neural Phase 1: Rendering Hook..." });
        
        const startFrame = hookShot.keyframeImage || job.originalUrl;
        let optStartFrame = await optimizeImagePayload(startFrame, 'upscale_input');
        optStartFrame = await cropToAspectRatio(optStartFrame, '9:16');

        const videoParams = {
            model,
            prompt: `[SHOT 1: HOOK] ${hookShot.visual_prompt}. Cinematic, high quality. Action matches script: ${hookShot.audio_script}`,
            image: { imageBytes: optStartFrame.split(',')[1], mimeType: 'image/png' },
            config: { 
                numberOfVideos: 1, 
                resolution: '720p', 
                aspectRatio: '9:16',
                durationSeconds: hookShot.duration || 5
            }
        };

        let currentOp = await executeManagedTask('VIDEO_GEN', async () => {
            const ai = getAI();
            return await callWithRetry<any>(
                () => ai.models.generateVideos(videoParams),
                2, 2000, model,
                [] // Empty array for no fallbacks
            );
        });

        const ai = getAI();
        currentOp = await pollOperation(ai, currentOp, (updates) => updateJobStatus(job.id, 'rendering_video', { ...updates, progressMessage: `Shot 1: ${updates.progressMessage}` }));

        // --- PHASE 2: SEQUENTIAL EXTENSIONS ---
        const remainingShots = shots.filter(s => s.role !== 'Hook');
        for (let i = 0; i < remainingShots.length; i++) {
            const shot = remainingShots[i];
            const shotName = `Shot ${i + 2} (${shot.role})`;
            updateJobStatus(job.id, 'rendering_video', { progressMessage: `Neural Phase ${i + 2}: Extending ${shot.role}...` });

            const lastVideo = currentOp.response?.generatedVideos?.[0]?.video;

            const extensionParams = {
                model,
                video: lastVideo,
                prompt: `[STORY CONTINUATION] Character and environment continuity. ${shot.visual_prompt}. Action strictly matches audio script: ${shot.audio_script}`,
                config: { 
                    numberOfVideos: 1, 
                    resolution: '720p', 
                    aspectRatio: '9:16',
                    durationSeconds: shot.duration || 5
                }
            };

            currentOp = await executeManagedTask('VIDEO_GEN', async () => {
                const ai = getAI();
                return await callWithRetry<any>(
                    () => ai.models.generateVideos(extensionParams),
                    2, 2000, model,
                    [] // Empty array for no fallbacks
                );
            });

            currentOp = await pollOperation(ai, currentOp, (updates) => updateJobStatus(job.id, 'rendering_video', { ...updates, progressMessage: `${shotName}: ${updates.progressMessage}` }));
        }

        // --- PHASE 3: FINALIZATION ---
        const finalVideoUri = currentOp.response?.generatedVideos?.[0]?.video?.uri;
        if (!finalVideoUri) throw new Error("Neural Extension hoàn tất nhưng không tìm thấy URI.");

        const apiKey = (ai as any).apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
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
        const errStr = error.message || "";
        if (errStr.includes("Requested entity was not found.")) {
             updateJobStatus(job.id, 'failed', { error: "API Key không hợp lệ hoặc hết hạn. Vui lòng chọn lại Key từ một Project đã bật thanh toán." });
             return;
        }
        if (errStr.includes("403") || errStr.toLowerCase().includes("permission") || errStr.toLowerCase().includes("billing") || errStr.toLowerCase().includes("thanh toán") || errStr.toLowerCase().includes("paid project")) {
             updateJobStatus(job.id, 'failed', { error: "Lỗi phân quyền (403): Mô hình Veo yêu cầu API Key từ một Project Google Cloud đã kích hoạt thanh toán. Vui lòng mở Settings (Bánh răng ở góc trên bên phải) -> Secrets để chọn API Key từ một Paid Project." });
             if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                 window.aistudio.openSelectKey().catch(console.error);
             }
             return;
        }
        updateJobStatus(job.id, 'failed', { error: `Render bị gián đoạn: ${error.message}` });
    }
};