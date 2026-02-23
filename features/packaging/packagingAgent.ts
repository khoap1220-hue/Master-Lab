
import { AgentStep } from "../../types";
import * as orchestratorService from "../../services/orchestratorService";
import * as pixelService from "../../services/pixelService";
import { removeWhiteBackground } from "../../lib/utils";

/**
 * Execute the Vector Blueprint workflow for Packaging.
 * Decomposes a packaging design into 3 distinct layers: Background, Typography, and Graphics.
 */
export const executeVectorBlueprint = async (
  packagingImage: string,
  goal: string,
  onStepUpdate?: (steps: AgentStep[]) => void,
  onImageGenerated?: (image: string, label: string, layerName: string) => void
): Promise<{ 
  summary: string;
  resultImages: string[];
  steps: AgentStep[];
}> => {
  const steps: AgentStep[] = [
    { agent: 'Architect', status: 'processing', message: 'Brain: Đang thực hiện Reverse Engineering để tách lớp cấu trúc...' },
    { agent: 'PixelSmith', status: 'pending', message: 'Layer 1: Texture Extraction (Flat Background)...' },
    { agent: 'TypographyExpert', status: 'pending', message: 'Layer 2: Typography Isolation (Clean White BG)...' },
    { agent: 'PixelSmith', status: 'pending', message: 'Layer 3: Vector Graphics/Logo Isolation...' }
  ];

  if (onStepUpdate) onStepUpdate([...steps]);

  try {
    // 1. Analyze layers
    const analysis = await orchestratorService.generateVectorBlueprint(packagingImage, goal);
    
    // Validate Structure before proceeding
    if (!analysis || !analysis.layerPrompts) {
        throw new Error("Không thể phân tích cấu trúc bao bì (Missing Layer Data).");
    }

    steps[0].status = 'completed';
    // Update all layer statuses to processing since we will run them in parallel
    steps[1].status = 'processing';
    steps[2].status = 'processing';
    steps[3].status = 'processing';
    if (onStepUpdate) onStepUpdate([...steps]);

    const resultImagesMap: Record<string, string> = {};

    // PARALLEL EXECUTION: Utilize the BATCH tier concurrency (3 slots)
    // Each generateLayer4K call routes to 'IMAGE_GEN_BATCH' tier.
    const promises = [
        // Layer 1: Background
        (async () => {
            try {
                const bgLayer = await pixelService.generateLayer4K(packagingImage, 'background', analysis.layerPrompts.background);
                if (bgLayer) {
                    resultImagesMap['bg'] = bgLayer;
                    if (onImageGenerated) onImageGenerated(bgLayer, 'BP-L1', 'Background Layer (Texture)');
                    steps[1].status = 'completed';
                } else {
                    steps[1].status = 'failed';
                }
            } catch (e) {
                console.warn("Background layer failed", e);
                steps[1].status = 'failed';
                steps[1].details = "Failed to generate background";
            }
            if (onStepUpdate) onStepUpdate([...steps]);
        })(),

        // Layer 2: Typography
        (async () => {
            try {
                const typoLayerRaw = await pixelService.generateLayer4K(packagingImage, 'typography', analysis.layerPrompts.typography);
                if (typoLayerRaw) {
                    // Tolerance 30 to ensure clean edges around text
                    const typoLayerTransparent = await removeWhiteBackground(typoLayerRaw, 30);
                    resultImagesMap['typo'] = typoLayerTransparent;
                    if (onImageGenerated) onImageGenerated(typoLayerTransparent, 'BP-L2-Alpha', 'Typography Layer (Transparent Asset)');
                    steps[2].status = 'completed';
                } else {
                    steps[2].status = 'failed';
                }
            } catch (e) {
                console.warn("Typography layer failed", e);
                steps[2].status = 'failed';
                steps[2].details = "Failed to extract typography";
            }
            if (onStepUpdate) onStepUpdate([...steps]);
        })(),

        // Layer 3: Graphics
        (async () => {
            try {
                const graphicLayerRaw = await pixelService.generateLayer4K(packagingImage, 'graphics', analysis.layerPrompts.graphics);
                if (graphicLayerRaw) {
                    const graphicLayerTransparent = await removeWhiteBackground(graphicLayerRaw, 25);
                    resultImagesMap['gfx'] = graphicLayerTransparent;
                    if (onImageGenerated) onImageGenerated(graphicLayerTransparent, 'BP-L3-Alpha', 'Graphics Layer (Transparent Asset)');
                    steps[3].status = 'completed';
                } else {
                    steps[3].status = 'failed';
                }
            } catch (e) {
                console.warn("Graphics layer failed", e);
                steps[3].status = 'failed';
                steps[3].details = "Failed to extract graphics";
            }
            if (onStepUpdate) onStepUpdate([...steps]);
        })()
    ];

    await Promise.all(promises);

    // Reconstruct result array in correct order, filtering out failures
    const images: string[] = [];
    if (resultImagesMap['bg']) images.push(resultImagesMap['bg']);
    if (resultImagesMap['typo']) images.push(resultImagesMap['typo']);
    if (resultImagesMap['gfx']) images.push(resultImagesMap['gfx']);

    return { 
      summary: analysis.analysisSummary,
      resultImages: images,
      steps 
    };

  } catch (error) {
    steps.forEach(s => { if (s.status === 'processing') s.status = 'failed'; });
    if (onStepUpdate) onStepUpdate([...steps]);
    throw error;
  }
};
