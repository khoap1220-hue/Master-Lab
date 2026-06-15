
import { GenerateContentResponse } from "@google/genai";
import { ExtractedAsset } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "../../services/orchestrator/utils";
import { executeVectorBlueprint } from "../packaging/packagingAgent";
import { optimizeImagePayload } from "../../lib/utils";
import { MODELS } from "../../config/models";

/**
 * PHASE 1: Identify all distinct items in the mockup
 * Keeps using ANALYSIS_FAST (Light Tier) for quick JSON response.
 */
const identifyMockupItems = async (imageContent: string): Promise<string[]> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    // Primary: Gemini 3 Flash (Text), Backup: Gemini 3 Flash (Stable)
    const model = MODELS.TEXT_FAST;
    const backupModel = MODELS.TEXT_FAST;
    
    // SMART PRE-OPTIMIZATION: Vision Profile (1024px sufficient for identification)
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const prompt = `
      ROLE: MOCKUP ANALYST.
      TASK: List all distinct branding items visible in this mockup image.
      
      INSTRUCTIONS:
      - Identify distinct items like "Business Card", "Letterhead", "Envelope", "iPhone Screen", "Tag", "Shopping Bag".
      - Return ONLY the list of names in Vietnamese.
      - Ignore generic background elements (plants, pens, clips) unless they are branded.
      - Max 6 most prominent items to avoid noise.
      
      OUTPUT JSON:
      ["Name Card (Mặt trước)", "Phong bì thư", ...]
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { 
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
          ] 
        },
        config: {
          
          
        }
      }), 
      2, 1000, model,
      [() => ai.models.generateContent({
        model: backupModel,
        contents: { 
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
          ] 
        },
        config: {
          
          
        }
      })]
    );

    return JSON.parse(cleanJson(response.text || "[]"));
  });
};

/**
 * PHASE 2: Extract specific item using "Smart Scan" logic
 * UPDATED: Uses 'IMAGE_GEN_BATCH' to route to BATCH tier for mass processing.
 */
const extractSpecificItem = async (
  wholeImage: string,
  itemName: string
): Promise<{ image: string; model: string }> => {
  const ai = getAI();
  // Ensure Gemini 3.1 Flash Image is used for image outputs
  const model = MODELS.IMAGE_PRIMARY; 
  const proModel = MODELS.IMAGE_PRO; 
  const flashModel = MODELS.IMAGE_FAST; 
  
  return executeManagedTask('IMAGE_GEN_BATCH', async () => {
    // SMART PRE-OPTIMIZATION: Masking Profile (2048px allowed for precise cropping)
    const optImage = await optimizeImagePayload(wholeImage, 'masking');

    const prompt = `
      [SYSTEM ROLE: PRECISION CROPPER & RECTIFIER]
      TASK: Locate the "${itemName}" in the image.
      ACTION: CROP it out, DEWARP/FLATTEN the perspective, and place it on a clean WHITE background.
      
      CRITICAL:
      - Output MUST be just the "${itemName}".
      - Discard everything else (No backgrounds, no shadows).
      - Ensure text is legible and straight (Top-down view).
    `;

    let usedModel: string = model;
    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { 
          parts: [
            { text: prompt }, 
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
          ] 
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      }), 
      2, 1000, model, 
      [
        () => ai.models.generateContent({
          model: proModel,
          contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        }),
        () => ai.models.generateContent({
          model: flashModel,
          contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
          config: { imageConfig: { aspectRatio: "1:1" } }
        })
      ],
      1200000, // Extended: 20 minute timeout for complex extraction
      true,
      (m) => usedModel = m
    );

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) throw new Error(`Failed to extract ${itemName}`);
    
    return {
      image: `data:image/png;base64,${part.inlineData.data}`,
      model: usedModel
    };
  });
};

/**
 * MASTER FUNCTION: Execute the full Decomposition Pipeline
 */
export const executeMockupDecomposition = async (
  jobId: string,
  imageContent: string,
  onProgress: (status: string, extracted?: ExtractedAsset[], state?: any) => void,
  state: any = {}
): Promise<ExtractedAsset[]> => {
  
  // 1. Identification
  let items = state.items || [];
  if (items.length === 0) {
    onProgress("Phase 1: Scanning Mockup Items...", undefined, state);
    items = await identifyMockupItems(imageContent);
    state.items = items;
    onProgress("Phase 1: Scanning Mockup Items...", undefined, state);
  }
  
  if (items.length === 0) {
    throw new Error("Không tìm thấy vật phẩm nào trong Mockup.");
  }

  const assets: ExtractedAsset[] = state.assets || [];

  // 2. Loop Processing
  for (let i = assets.length; i < items.length; i++) {
    const itemName = items[i];
    onProgress(`Phase 2: Extracting ${itemName} (${i + 1}/${items.length}) - High Velocity...`, assets, state);
    
    try {
      const extractionResult = await extractSpecificItem(imageContent, itemName);
      const flattened = extractionResult.image;
      
      onProgress(`Phase 3: Layering ${itemName}...`, assets, state);
      const blueprintResult = await executeVectorBlueprint(flattened, `Extract layers for ${itemName}`);
      
      const layers = {
        background: blueprintResult.resultImages[0],
        typography: blueprintResult.resultImages[1],
        graphics: blueprintResult.resultImages[2]
      };

      assets.push({
        id: `asset-${Date.now()}-${i}`,
        name: itemName,
        flattenedUrl: flattened,
        layers,
        modelUsed: extractionResult.model
      });
      
      state.assets = assets;
      onProgress(`Processed: ${itemName}`, assets, state);

    } catch (e) {
      console.warn(`Failed to process item ${itemName}:`, e);
      throw new Error(`Failed at item ${itemName}. Please retry to resume.`);
    }
  }

  return assets;
};
