import { BatchJob, ProcessStatus } from '../../../types';
import { getAI, callWithRetry } from '../../../lib/gemini';
import { optimizeImagePayload, cropToAspectRatio } from '../../../lib/utils';
import { MODELS } from '../../../config/models';
import { VideoGenerationReferenceType } from '@google/genai';
import { executeManagedTask } from '../../../lib/tieredExecutor';

interface BatchConfig {
    targetText?: string;
    videoResolution?: string;
    videoAudioEnabled?: boolean;
    videoAspectRatio?: string;
}

export const processStudioVideos = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    const state = job.state || {};
    let operation: any = state.operation;

    try {
        // --- API KEY SELECTION FLOW (CRITICAL FOR VEO) ---
        if (process.env.GEMINI_API_KEY || process.env.API_KEY) {
            // Server-provided background key is present, proceed
        } else if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                updateJobStatus(job.id, 'generating_video', { 
                    progressMessage: "Yêu cầu API Key trả phí để render video. Đang mở hộp thoại..." 
                });
                await window.aistudio.openSelectKey();
            }
        }

        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "[Veo 3.1] Khởi tạo Studio Video..." });
        
        const prompt = `${config.targetText || "Cinematic motion, high quality, masterpiece"}. NO text, NO titles, NO subtitles, NO overlays on the video.`;
        
        // Veo 3.1 only supports 720p and 1080p
        let resolution = config.videoResolution || '1080p';
        if (resolution === '4K') {
            resolution = '1080p'; // Fallback to 1080p as 4K is not supported by Veo 3.1 API yet
            console.warn("4K is not supported by Veo 3.1 API yet. Falling back to 1080p.");
        }
        
        const aspectRatio = config.videoAspectRatio || '16:9';

        if (!operation) {
            let optImage = await optimizeImagePayload(job.originalUrl, 'generation');
            
            let modelToUse: string = MODELS.VIDEO_FAST;
            let finalResolution: string = resolution;
            let finalAspectRatio: string = aspectRatio;
            let referenceImagesPayload: any[] = [];
            let useTopLevelImage = true;

            if (job.referenceUrls && job.referenceUrls.length > 0) {
                modelToUse = MODELS.VIDEO_PRO; // Must use veo-3.1-generate-preview
                finalResolution = '720p'; // Must be 720p
                finalAspectRatio = '16:9'; // Must be 16:9 when using reference images
                useTopLevelImage = false; // Do not use top-level image when using reference images
                
                optImage = await cropToAspectRatio(optImage, '16:9');
                const base64Data = optImage.split(',')[1];
                const mimeType = optImage.split(';')[0].split(':')[1];

                // Add the original image as the first reference
                referenceImagesPayload.push({
                    image: {
                        imageBytes: base64Data,
                        mimeType: mimeType,
                    },
                    referenceType: VideoGenerationReferenceType.ASSET,
                });
                
                // Add up to 2 more reference images (max 3 total)
                const refsToUse = job.referenceUrls.slice(0, 2);
                for (const refUrl of refsToUse) {
                    let optRef = await optimizeImagePayload(refUrl, 'generation');
                    optRef = await cropToAspectRatio(optRef, '16:9');
                    referenceImagesPayload.push({
                        image: {
                            imageBytes: optRef.split(',')[1],
                            mimeType: optRef.split(';')[0].split(':')[1],
                        },
                        referenceType: VideoGenerationReferenceType.ASSET,
                    });
                }
            } else {
                // Single image mode, crop to requested aspect ratio
                optImage = await cropToAspectRatio(optImage, finalAspectRatio);
            }

            const base64Data = optImage.split(',')[1];
            const mimeType = optImage.split(';')[0].split(':')[1];

            updateJobStatus(job.id, 'generating_video', { progressMessage: `[Veo 3.1] Đang render video (${finalResolution})...` });

            const videoParams: any = {
                model: modelToUse,
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: finalResolution as '720p' | '1080p',
                    aspectRatio: finalAspectRatio
                }
            };
            
            if (useTopLevelImage) {
                videoParams.image = {
                    imageBytes: base64Data,
                    mimeType: mimeType,
                };
            }

            if (referenceImagesPayload.length > 0) {
                videoParams.config.referenceImages = referenceImagesPayload;
            }

            operation = await executeManagedTask('VIDEO_GEN', async () => {
                const ai = getAI();
                return await callWithRetry<any>(
                    () => ai.models.generateVideos(videoParams),
                    2, 2000, modelToUse,
                    [] // Empty array for no fallbacks
                );
            });
            
            state.operation = operation;
            updateJobStatus(job.id, 'generating_video', { state });
        } else {
            updateJobStatus(job.id, 'generating_video', { progressMessage: `[Veo 3.1] Đang tiếp tục render video (${resolution})...` });
        }

        updateJobStatus(job.id, 'generating_video', { progressMessage: "[Veo 3.1] Đang xử lý trên server (có thể mất vài phút)..." });

        // Polling loop with retries and managed task
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            operation = await executeManagedTask('ANALYSIS_DEEP', async () => {
                const ai = getAI();
                return await callWithRetry<any>(
                    () => ai.operations.getVideosOperation({ operation: operation }),
                    3, 2000, 'Video-Polling',
                    [] // Empty array for no fallbacks
                );
            });

            state.operation = operation;
            updateJobStatus(job.id, 'generating_video', { state });
        }

        if (operation.error) {
            throw new Error(`API Error: ${operation.error.message || JSON.stringify(operation.error)}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (!downloadLink) {
            console.error("Operation details:", JSON.stringify(operation, null, 2));
            throw new Error(`Không nhận được link video từ API. Response: ${JSON.stringify(operation.response || operation)}`);
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || (window.aistudio as any)?.apiKey;
        
        updateJobStatus(job.id, 'generating_video', { progressMessage: "[Veo 3.1] Đang tải video về máy..." });

        const videoResponse = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': apiKey || '',
            },
            credentials: 'omit'
        });

        if (!videoResponse.ok) {
            throw new Error("Không thể tải video từ server.");
        }

        const videoBlob = await videoResponse.blob();
        const videoObjectUrl = URL.createObjectURL(new Blob([videoBlob], { type: 'video/mp4' }));
        
        updateJobStatus(job.id, 'completed', { 
            resultVideoUrl: videoObjectUrl, 
            resultVideoBlob: videoBlob,
            progressMessage: "Hoàn tất Video Studio!",
            state: {} // Xóa state khi hoàn thành
        });

    } catch (error: any) {
        console.error("Studio Video Error:", error);
        const errStr = error.message || "";
        if (errStr.includes("403") || errStr.toLowerCase().includes("permission") || errStr.toLowerCase().includes("billing") || errStr.toLowerCase().includes("thanh toán") || errStr.toLowerCase().includes("paid project")) {
             updateJobStatus(job.id, 'failed', { 
                 error: "Lỗi phân quyền (403): Mô hình Veo yêu cầu API Key từ một Project Google Cloud đã kích hoạt thanh toán. Vui lòng mở Settings (Bánh răng ở góc trên bên phải) -> Secrets để chọn API Key từ một Paid Project.",
                 state: { ...state, operation }
             });
             if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                 window.aistudio.openSelectKey().catch(console.error);
             }
             return;
        }
        updateJobStatus(job.id, 'failed', { 
            error: error.message || "Lỗi tạo video",
            state: { ...state, operation }
        });
    }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'studio-videos',
    name: 'Studio Videos',
    description: 'Tạo video quảng cáo chuyên nghiệp với Veo 3.1.',
    icon: 'Video',
    category: 'Video',
    priority: 15,
    processFn: processStudioVideos
});
