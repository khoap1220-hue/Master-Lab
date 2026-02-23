
import { GenerateContentResponse, Part } from "@google/genai";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { optimizeImagePayload } from "../../lib/utils";

/**
 * Execute Auto-Rebrand for a specific extracted asset.
 * Optimized for Batch Studio: Uses IMAGE_GEN_BATCH tier for dedicated queuing.
 */
export const executeAutoRebrand = async (
  assetUrl: string,
  assetName: string,
  newLogoUrl: string,
  brandColor: string,
  styleNotes: string
): Promise<string> => {
  // Use 'IMAGE_GEN_BATCH' to route to the BATCH tier (5000ms delay, 30m Timeout)
  return executeManagedTask('IMAGE_GEN_BATCH', async () => {
    const ai = getAI();
    // Using gemini-2.5-flash-image for reliable image output
    const model = "gemini-2.5-flash-image"; 
    const backupModel = "gemini-3-pro-image-preview";
    
    // SMART PRE-OPTIMIZATION: Editing Profile (Preserve Transparency for both items)
    const [optAsset, optLogo] = await Promise.all([
        optimizeImagePayload(assetUrl, 'editing'),
        optimizeImagePayload(newLogoUrl, 'editing')
    ]);

    const prompt = `
      [SYSTEM ROLE: SENIOR BRAND IDENTITY SPECIALIST]
      TASK: REBRAND the Input Item ("${assetName}").
      
      INPUTS:
      1. SOURCE ITEM: A flat cutout of a ${assetName}.
      2. NEW BRAND LOGO: The provided reference image.
      3. BRAND COLOR: ${brandColor}
      4. STYLE NOTE: "${styleNotes}"
      
      INSTRUCTIONS:
      1. LOGO SWAP: Remove the OLD logo/branding on the Source Item completely. Replace it with the NEW BRAND LOGO provided in the reference image.
      2. PLACEMENT: Place the new logo in a visually balanced position. Maintain correct perspective.
      3. COLOR ADAPTATION: Change the accent colors or background of the item to match the NEW BRAND COLOR (${brandColor}).
      4. PRESERVE REALISM: Keep the original paper texture and material finish.
      
      OUTPUT: The Rebranded Item on a clean WHITE (#FFFFFF) background.
    `;

    const parts: Part[] = [
      { text: prompt },
      { text: "SOURCE ITEM:" },
      { inlineData: { mimeType: "image/png", data: optAsset.split(',')[1] } },
      { text: "NEW BRAND LOGO:" },
      { inlineData: { mimeType: "image/png", data: optLogo.split(',')[1] } }
    ];

    // Primary: Flash Image (Fast), Fallback: Pro Image (High Quality)
    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1" } }
      }), 
      3, 1000, model, 
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      }),
      600000 // Extended: 10 minute timeout for individual rebrand
    );

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) throw new Error(`Failed to rebrand ${assetName}`);
    
    return `data:image/png;base64,${part.inlineData.data}`;
  });
};
