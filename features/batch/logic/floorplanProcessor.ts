import { BatchJob, ProcessStatus } from '../../../types';
import { BatchConfig } from '../hooks/useBatchProcessing';
import { generateDesignVariation } from '../../../services/pixel/generation';
import { INITIAL_MEMORY } from '../../../data/constants';
import { getClosestAspectRatio } from '../../../lib/utils';
import { executeManagedTask } from '../../../lib/tieredExecutor';

export type UpdateStatusFn = (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void;

export const processFloorplanStylist = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: UpdateStatusFn
) => {
    try {
        updateJobStatus(job.id, 'analyzing_context', { progressMessage: "[Architect] Analyzing Floorplan Structure..." });
        
        const conceptImages = config.brandAssets || [];
        if (conceptImages.length === 0) {
            throw new Error("Missing Concept Image. Please upload a reference floorplan in the Brand Assets section.");
        }

        const perspective = config.packType === 'Match Input' ? 'EXACTLY match the perspective and camera angle of Input 1 (Base Image)' : `${config.packType} view`;
        const buildingType = config.targetText || 'Apartment';
        const visualStyle = config.brandVibe || 'Photorealistic';
        
        updateJobStatus(job.id, 'matting', { progressMessage: `[Stylist] Applying Concept to ${buildingType}...` });
        
        const exactRatio = await getClosestAspectRatio(job.originalUrl);

        const prompt = `
            [MODE: FLOORPLAN STYLE TRANSFER] 
            TASK: Interior arrangement and styling.
            BUILDING TYPE: ${buildingType}.
            PERSPECTIVE: ${perspective}.
            VISUAL STYLE: ${visualStyle}.
            STRUCTURE: Strictly preserve all walls, doors, windows, and structural layouts from Input 1 (Base Image). Do not alter the architecture.
            CLEANUP: The input floorplan may contain handwritten notes, text, dimensions, or labels. You MUST completely remove all text, numbers, and labels. The final output must be a clean, text-free architectural visualization.
            STYLE: Extract and apply the exact interior design style, color palette, material finishes (floors, walls), and furniture types from Input 2 (Reference Image).
            RENDER: High-quality architectural floor plan. Strictly follow the requested visual style (${visualStyle}).
        `;

        // Using generateDesignVariation with preserveLayout = true
        const result = await generateDesignVariation(
            prompt, 
            job.originalUrl, 
            INITIAL_MEMORY, 
            'Real Estate', 
            conceptImages, 
            undefined, 
            exactRatio, 
            true // STRICTLY PRESERVE LAYOUT
        );

        updateJobStatus(job.id, 'completed', { 
            resultUrl: result.image, 
            modelUsed: result.model 
        });

    } catch (error: any) {
        console.error("Floorplan Stylist Error:", error);
        updateJobStatus(job.id, 'failed', { error: error.message });
    }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'floorplan-stylist',
    name: 'Floorplan Stylist',
    description: 'Render mặt bằng 2D thành 3D nội thất chân thực.',
    icon: 'Home',
    category: 'Design',
    priority: 75,
    processFn: processFloorplanStylist
});
