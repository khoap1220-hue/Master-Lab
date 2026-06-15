
import { BatchJob, ProcessStatus } from '../../../types';
import { generateDesignVariation } from '../../../services/pixelService';
import { INITIAL_MEMORY } from '../../../data/constants';
import { getClosestAspectRatio } from '../../../lib/utils';
import { runCreativeDirector } from './agents/creativeDirector';
import { getExecutionTiers } from '../../../lib/tieredExecutor';

// Add the protocol here directly since it's specific to this domain
const PRODUCT_PHOTOGRAPHY_PROTOCOL = `
  *** PRODUCT PHOTOGRAPHY PROTOCOL (NHIẾP ẢNH SẢN PHẨM) ***
  
  1. LIGHTING & SHADOWS:
     - The product MUST cast realistic shadows on the surface it sits on (Contact shadows + Cast shadows).
     - Match the lighting direction of the background with the lighting on the product.
     - Use "Studio Lighting", "Softbox", or "Natural Window Light" to define the mood.

  2. SCALE & PERSPECTIVE:
     - The product must look like it physically belongs in the scene.
     - Pay attention to the focal length (e.g., "Shot on 85mm lens" for portraits/products, "Macro lens" for details).
     - Add subtle Depth of Field (Bokeh) to separate the product from the background.

  3. MATERIAL ACCURACY:
     - Glass/Liquids must refract light and show caustics.
     - Metals must reflect the surrounding environment.
     - Matte surfaces should have soft, diffused highlights.
`;

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
    const state = job.state || {};
    let assets: any[] = state.assets || [];
    let analysis = state.analysis;

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
                if (!analysis) {
                    analysis = await runCreativeDirector(job.originalUrl);
                    state.analysis = analysis;
                    updateJobStatus(job.id, 'analyzing_context', { state });
                }
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

        // AUTO-PILOT FREEDOM: If true, we set preserveLayout to false, allowing AI to recompose
        const preserveLayout = !config.isAutoPilot;

        // PREPARE REFERENCE IMAGES (Moodboard + Brand Ambassador)
        const refImages: string[] = [];
        let modelPromptAddon = "";
        
        if (config.modelRefImage) {
            refImages.push(config.modelRefImage);
            modelPromptAddon = "INCORPORATE MODEL: Use the person from the provided REFERENCE IMAGE as the brand ambassador/model holding or interacting with the product. Maintain their facial features and style.";
        }

        if (assets.length === 0) {
            assets = new Array(count).fill(null);
        }
        let completedCount = assets.filter(a => a !== null).length;

        const tiers = getExecutionTiers();
        const BATCH_SIZE = tiers.BATCH.concurrency;
        const delay = tiers.BATCH.tierDelay;

        // 3. Execute using Design Variation (Image-to-Image) in Batch Loop
        for (let i = 0; i < count; i += BATCH_SIZE) {
            const batch = Array.from({ length: Math.min(BATCH_SIZE, count - i) }, (_, idx) => i + idx);
            const batchPromises = batch.map(async (globalIdx) => {
                if (assets[globalIdx] !== null) return; // Skip already generated
                
                // Variation Logic: If creating multiple shots, slightly vary the prompt to avoid duplicates
                let variationPrompt = "";
                if (count > 1) {
                    if (globalIdx === 0) variationPrompt = "Standard Hero Shot. Best Angle.";
                    if (globalIdx === 1) variationPrompt = "Close-up detail shot. Shallow depth of field.";
                    if (globalIdx === 2) variationPrompt = "Lifestyle context. Natural positioning.";
                    if (globalIdx === 3) variationPrompt = "Creative angle. Dynamic composition.";
                }

                // Build The Photographer's Prompt
                const compositionInstruction = config.isAutoPilot 
                    ? "COMPOSITION: Creative Director Mode. You have FULL FREEDOM to arrange, rotate, resize, and position the product to create the best artistic composition. Focus on Visual Impact. Do NOT just paste it in the center. CRITICAL: The product itself MUST look EXACTLY like the reference image (Shape, Label, Material, Logo)."
                    : "1. SUBJECT: Keep the input product EXACTLY as it is (Shape, Label, Material, Logo). Position and Angle should remain consistent.";

                const prompt = `
                    [SYSTEM ROLE: MASTER COMMERCIAL PHOTOGRAPHER]
                    CATEGORY: ${category}
                    TASK: Commercial Product Photography.
                    
                    ${PRODUCT_PHOTOGRAPHY_PROTOCOL}

                    ${compositionInstruction}
                    ${modelPromptAddon}
                    
                    2. SCENE: ${scene}
                    3. LIGHTING: ${lighting}
                    4. CAMERA: ${camera}
                    5. VARIATION FOCUS: ${variationPrompt}
                    
                    QUALITY: 8k resolution, highly detailed texture, photorealistic, advertising quality.
                `;

                const res = await generateDesignVariation(
                    prompt,
                    job.originalUrl, // Input Image as Reference
                    INITIAL_MEMORY,
                    'Product Design',
                    refImages, // Pass Model Reference here
                    undefined,
                    ratio,
                    preserveLayout
                );

                assets[globalIdx] = { 
                    id: `shot-${Date.now()}-${globalIdx}`,
                    name: `Shot ${globalIdx + 1} (${globalIdx === 0 ? 'Hero' : globalIdx === 1 ? 'Detail' : globalIdx === 2 ? 'Context' : 'Creative'})`,
                    flattenedUrl: res.image,
                    layers: {} // Standard Asset Structure
                };
                
                completedCount++;
                const currentAssets = assets.filter(a => a !== null);
                
                state.assets = assets;
                updateJobStatus(job.id, 'analyzing_context', { 
                    progressMessage: `Shooting ${completedCount}/${count} variations for ${category}...`,
                    extractedAssets: [...currentAssets],
                    resultUrl: currentAssets[0]?.flattenedUrl,
                    state
                });
            });

            await Promise.all(batchPromises);

            if (i + BATCH_SIZE < count) {
                await new Promise(r => setTimeout(r, delay));
            }
        }

        updateJobStatus(job.id, 'completed', { 
            resultUrl: assets[0].flattenedUrl, // Show first as main
            extractedAssets: assets, // Populate grid with all variations
            progressMessage: `Photoshoot Complete (${count} shots).`,
            state: {} // Clear state on success
        });

    } catch (error: any) {
        console.error("Product Shoot Error:", error);
        const currentAssets = assets.filter(a => a !== null);
        updateJobStatus(job.id, 'failed', { 
            error: error.message || "Shoot failed.",
            state: { ...state, assets, analysis },
            extractedAssets: currentAssets.length > 0 ? currentAssets : undefined
        });
    }
};

import { globalAgentRegistry } from './registry';

globalAgentRegistry.register({
    id: 'product-photography',
    name: 'Product Photography',
    description: 'Chụp ảnh sản phẩm chuyên nghiệp với AI.',
    icon: 'Camera',
    category: 'Marketing',
    priority: 25,
    processFn: processProductPhotography
});
