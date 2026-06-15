
import { GenerateContentResponse, Part } from "@google/genai";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { optimizeImagePayload } from "../../lib/utils";
import { MODELS } from "../../config/models";

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
): Promise<{ image: string; model: string }> => {
  // Use 'IMAGE_GEN_BATCH' to route to the BATCH tier (5000ms delay, 30m Timeout)
  return executeManagedTask('IMAGE_GEN_BATCH', async () => {
    const ai = getAI();
    // Using MODELS.IMAGE_PRIMARY for reliable image output
    const model = MODELS.IMAGE_PRIMARY; 
    const proModel = MODELS.IMAGE_PRO;
    const flashModel = MODELS.IMAGE_FAST;
    
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

    let usedModel: string = model;
    // Primary: 3.1 Flash, Backup: 3 Pro, Final: 2.5 Flash
    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1" } }
      }), 
      2, 1000, model, 
      [
        () => ai.models.generateContent({
          model: proModel,
          contents: { parts },
          config: { imageConfig: { aspectRatio: "1:1" } }
        }),
        () => ai.models.generateContent({
          model: flashModel,
          contents: { parts },
          config: { imageConfig: { aspectRatio: "1:1" } }
        })
      ],
      1200000, // Extended: 20 minute timeout for individual rebrand
      true,
      (m) => usedModel = m
    );

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) throw new Error(`Failed to rebrand ${assetName}`);
    
    return {
      image: `data:image/png;base64,${part.inlineData.data}`,
      model: usedModel
    };
  });
};
