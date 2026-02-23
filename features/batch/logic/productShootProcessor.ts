
import { BatchJob, ProcessStatus } from '../../../types';
import { generateDesignVariation } from '../../../services/pixelService';
import { INITIAL_MEMORY } from '../../../data/constants';
import { getClosestAspectRatio } from '../../../lib/utils';
import { runCreativeDirector } from './agents/creativeDirector';

interface BatchConfig {
    targetText?: string; // Scene Context
    brandVibe: string;   // Lighting & Style
    batchCount?: number; // Quantity
    isAutoPilot?: boolean; // 100% Automation Mode
    modelRefImage?: string | null; // Brand Ambassador
}

export const processProductPhotography = async (
    job: BatchJob, 
    config: BatchConfig, 
    updateJobStatus: (id: string, status: ProcessStatus, updates?: Partial<BatchJob>) => void
) => {
    try {
        const count = config.batchCount || 1;
        
        // 1. Detect Aspect Ratio
        const ratio = await getClosestAspectRatio(job.originalUrl);

        let scene = config.targetText || "Professional Studio Setting, Clean White Background";
        let lighting = config.brandVibe || "Softbox Lighting, High Key";
        let camera = "Standard Product View, Sharp Focus";
        let category = "Product";

        // --- AUTOMATION 100% LOGIC ---
        if (config.isAutoPilot) {
            updateJobStatus(job.id, 'analyzing_context', { progressMessage: "AI Director: Analyzing Product DNA & Category..." });
            
            try {
                const analysis = await runCreativeDirector(job.originalUrl);
                category = analysis.category;
                scene = analysis.scene;
                lighting = analysis.lighting;
                camera = analysis.camera || camera;
                
                updateJobStatus(job.id, 'analyzing_context', { progressMessage: `Director's Cut: ${category} detected. Setting up studio...` });
                
                // Add a small delay so user can read the status
                await new Promise(r => setTimeout(r, 1000));

            } catch (e) {
                console.warn("Auto-Director failed, falling back to manual config.", e);
                updateJobStatus(job.id, 'analyzing_context', { progressMessage: "AI Director busy. Using standard studio..." });
            }
        }

        updateJobStatus(job.id, 'analyzing_context', { progressMessage: `Shooting ${count} variations for ${category}...` });

        // 3. Execute using Design Variation (Image-to-Image) in Parallel Loop
        const promises = [];
        
        // AUTO-PILOT FREEDOM: If true, we set preserveLayout to false, allowing AI to recompose
        const preserveLayout = !config.isAutoPilot;

        // PREPARE REFERENCE IMAGES (Moodboard + Brand Ambassador)
        const refImages = [];
        let modelPromptAddon = "";
        
        if (config.modelRefImage) {
            refImages.push(config.modelRefImage);
            modelPromptAddon = "INCORPORATE MODEL: Use the person from the provided REFERENCE IMAGE as the brand ambassador/model holding or interacting with the product. Maintain their facial features and style.";
        }

        for (let i = 0; i < count; i++) {
            // Variation Logic: If creating multiple shots, slightly vary the prompt to avoid duplicates
            let variationPrompt = "";
            if (count > 1) {
                if (i === 0) variationPrompt = "Standard Hero Shot. Best Angle.";
                if (i === 1) variationPrompt = "Close-up detail shot. Shallow depth of field.";
                if (i === 2) variationPrompt = "Lifestyle context. Natural positioning.";
                if (i === 3) variationPrompt = "Creative angle. Dynamic composition.";
            }

            // Build The Photographer's Prompt
            // If AutoPilot is ON, we explicitly tell the model it has freedom to arrange.
            const compositionInstruction = config.isAutoPilot 
                ? "COMPOSITION: Creative Director Mode. You have FULL FREEDOM to arrange, rotate, resize, and position the product to create the best artistic composition. Focus on Visual Impact. Do NOT just paste it in the center."
                : "1. SUBJECT: Keep the input product EXACTLY as it is (Shape, Label, Material, Logo). Position and Angle should remain consistent.";

            const prompt = `
                [SYSTEM ROLE: MASTER COMMERCIAL PHOTOGRAPHER]
                CATEGORY: ${category}
                TASK: Commercial Product Photography.
                
                ${compositionInstruction}
                ${modelPromptAddon}
                
                2. SCENE: ${scene}
                3. LIGHTING: ${lighting}
                4. CAMERA: ${camera}
                5. VARIATION FOCUS: ${variationPrompt}
                
                QUALITY: 8k resolution, highly detailed texture, photorealistic, advertising quality.
            `;

            // Slight delay to prevent rate limit issues if using high concurrency
            if (i > 0) await new Promise(r => setTimeout(r, 500));

            promises.push(
                generateDesignVariation(
                    prompt,
                    job.originalUrl, // Input Image as Reference
                    INITIAL_MEMORY,
                    'Product Design',
                    refImages, // Pass Model Reference here
                    undefined,
                    ratio,
                    preserveLayout
                ).then(res => ({ 
                    id: `shot-${Date.now()}-${i}`,
                    name: `Shot ${i + 1} (${i === 0 ? 'Hero' : i === 1 ? 'Detail' : i === 2 ? 'Context' : 'Creative'})`,
                    flattenedUrl: res.image,
                    layers: {} // Standard Asset Structure
                }))
            );
        }

        const assets = await Promise.all(promises);

        updateJobStatus(job.id, 'completed', { 
            resultUrl: assets[0].flattenedUrl, // Show first as main
            extractedAssets: assets, // Populate grid with all variations
            progressMessage: `Photoshoot Complete (${count} shots).`
        });

    } catch (error: any) {
        console.error("Product Shoot Error:", error);
        updateJobStatus(job.id, 'failed', { error: error.message || "Shoot failed." });
    }
};
