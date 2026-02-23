
import { Type, GenerateContentResponse } from "@google/genai";
import { ExtractedAsset } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "../../services/orchestrator/utils";
import { executeVectorBlueprint } from "../packaging/packagingAgent";
import { optimizeImagePayload } from "../../lib/utils";

/**
 * PHASE 1: Identify all distinct items in the mockup
 * Keeps using ANALYSIS_FAST (Light Tier) for quick JSON response.
 */
const identifyMockupItems = async (imageContent: string): Promise<string[]> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    // Primary: Gemini 3 Flash (Text), Backup: Gemini 3 Flash (Stable)
    const model = "gemini-3-flash-preview";
    const backupModel = "gemini-3-flash-preview";
    
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
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }), 
      3, 2000, model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { 
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
          ] 
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      })
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
): Promise<string> => {
  const ai = getAI();
  // Ensure Gemini 2.5 Image is used for image outputs
  const model = "gemini-2.5-flash-image"; 
  const backupModel = "gemini-3-pro-image-preview"; 
  
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
      3, 2000, model, 
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      }), 
      900000 // Extended: 15 minute timeout for complex extraction
    );

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) throw new Error(`Failed to extract ${itemName}`);
    
    return `data:image/png;base64,${part.inlineData.data}`;
  });
};

/**
 * MASTER FUNCTION: Execute the full Decomposition Pipeline
 */
export const executeMockupDecomposition = async (
  jobId: string,
  imageContent: string,
  onProgress: (status: string, extracted?: ExtractedAsset[]) => void
): Promise<ExtractedAsset[]> => {
  
  // 1. Identification
  onProgress("Phase 1: Scanning Mockup Items...");
  const items = await identifyMockupItems(imageContent);
  
  if (items.length === 0) {
    throw new Error("Không tìm thấy vật phẩm nào trong Mockup.");
  }

  const assets: ExtractedAsset[] = [];

  // 2. Loop Processing
  for (let i = 0; i < items.length; i++) {
    const itemName = items[i];
    onProgress(`Phase 2: Extracting ${itemName} (${i + 1}/${items.length}) - High Velocity...`);
    
    try {
      const flattened = await extractSpecificItem(imageContent, itemName);
      
      onProgress(`Phase 3: Layering ${itemName}...`);
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
        layers
      });

      onProgress(`Processed: ${itemName}`, assets);

    } catch (e) {
      console.warn(`Failed to process item ${itemName}:`, e);
    }
  }

  return assets;
};
