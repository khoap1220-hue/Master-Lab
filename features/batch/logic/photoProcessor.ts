import { BatchJob, ProcessStatus } from '../../../types';
import { pixelSmithEdit } from '../../../services/pixelService';
import { INITIAL_MEMORY } from '../../../data/constants';

type UpdateStatusFn = (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void;

interface BatchConfig {
    targetText?: string;
    brandVibe: string;
    brandLogo: string | null;
    brandAssets: string[];
}

export const processErrorFixer = async (job: BatchJob, config: BatchConfig, updateJobStatus: UpdateStatusFn) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Analyzing image errors and design flaws..." });
        
        const prompt = `[ERROR FIXER & DESIGN ENHANCEMENT] 
        Analyze the provided image for any visual errors, layout issues, typography mistakes, or design flaws.
        Focus Area: ${config.brandVibe || 'Auto-Detect'}
        Specific Instructions: ${config.targetText || 'Fix all visible errors and improve aesthetics.'}
        CRITICAL: The main subject/product in the reference image MUST be kept EXACTLY as it is. Only fix the errors and enhance the quality.`;

        const resFix = await pixelSmithEdit(
            prompt,
            INITIAL_MEMORY,
            job.originalUrl,
            job.file.name,
            'Error Fixer',
            'Creative Studio',
            job.maskUrl, 
            undefined,
            config.brandLogo || undefined,
            config.brandAssets.map((a, i) => ({ label: `Asset ${i}`, data: a }))
        );
        
        updateJobStatus(job.id, 'completed', { resultUrl: resFix.image, modelUsed: resFix.model });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

export const processPhotoRetouch = async (job: BatchJob, config: BatchConfig, updateJobStatus: UpdateStatusFn) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "Analyzing photo lighting and details..." });
        
        const prompt = `[PHOTO RETOUCH & POST-PROCESSING] 
        Perform professional post-processing on this photograph.
        Enhance lighting, color grading, contrast, and sharpness.
        Retouch any imperfections while maintaining a natural look.
        Target style/vibe: ${config.brandVibe || 'Professional studio quality, balanced lighting'}.
        Specific instructions: ${config.targetText || 'Enhance overall quality and color grading.'}
        CRITICAL: The main subject/product in the reference image MUST be kept EXACTLY as it is. Only apply retouching and color grading.`;

        const resRetouch = await pixelSmithEdit(
            prompt,
            INITIAL_MEMORY,
            job.originalUrl,
            job.file.name,
            'Photo Retouch',
            'Creative Studio',
            job.maskUrl, 
            undefined,
            config.brandLogo || undefined,
            config.brandAssets.map((a, i) => ({ label: `Asset ${i}`, data: a }))
        );
        
        updateJobStatus(job.id, 'completed', { resultUrl: resRetouch.image, modelUsed: resRetouch.model });
    } catch (error: any) {
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'error-fixer',
    name: 'Error Fixer',
    description: 'Tự động sửa lỗi thiết kế và nâng cấp chất lượng ảnh.',
    icon: 'Wrench',
    category: 'Utility',
    priority: 140,
    processFn: processErrorFixer
});

globalAgentRegistry.register({
    id: 'photo-retouch',
    name: 'Photo Retouch',
    description: 'Chỉnh sửa ảnh chuyên nghiệp (màu sắc, ánh sáng).',
    icon: 'Camera',
    category: 'Utility',
    priority: 150,
    processFn: processPhotoRetouch
});
