
import { Part, GenerateContentResponse } from "@google/genai";
import { MemoryInsight } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";
import { REALISM_ENFORCER } from "../prompts";

export const enrichRegionForPrint = async (
  imageContent: string,
  maskContent: string,
  compositeContent: string | null,
  memoryInsight: MemoryInsight
): Promise<{ image: string; text: string }> => {
  return executeManagedTask('IMAGE_EDIT_COMPLEX', async () => {
    const ai = getAI();
    const model = "gemini-3-pro-image-preview";
    const backupModel = "gemini-2.5-flash-image";
    
    // SMART PRE-OPTIMIZATION
    const [optImage, optMask] = await Promise.all([
        optimizeImagePayload(imageContent, 'editing'),
        optimizeImagePayload(maskContent, 'masking')
    ]);
    
    // Optional composite optimization
    const optComposite = compositeContent ? await optimizeImagePayload(compositeContent, 'editing') : null;

    const prompt = `
      [SYSTEM ROLE: PIXELSMITH MACRO LENS]
      [MODE: GENERATIVE ZOOM & TEXTURE SYNTHESIS]
      
      TASK: "Hyper-Enrich" the masked region for LARGE FORMAT PRINTING.
      
      CRITICAL INSTRUCTIONS:
      1. FREQUENCY SEPARATION: Inject high-frequency details (micro-texture) into the masked area.
      2. MATERIAL AWARENESS: 
         - If Wood: Enhance grain definition.
         - If Fabric: Show individual thread weaves.
         - If Skin: Show skin texture (pores), avoid "wax" look.
      3. RESOLUTION MATCH: Ensure the new details match the lighting direction of the context.
      
      ${REALISM_ENFORCER}
    `;

    const parts: Part[] = [
      { text: prompt },
      { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } },
      { text: "MASK (Target Area):" },
      { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } }
    ];

    if (optComposite) {
      parts.push({ inlineData: { mimeType: "image/png", data: optComposite.split(',')[1] } });
    }

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      }), 
      5, 
      2000, 
      model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1" } }
      })
    );

    let image: string | undefined;
    let text = "";
    response.candidates?.[0]?.content?.parts?.forEach(part => {
      if (part.inlineData) image = `data:image/png;base64,${part.inlineData.data}`;
      else if (part.text) text += part.text;
    });
    
    return { image: image!, text: text.trim() || `Đã tái tạo chi tiết siêu thực (Macro Enhance).` };
  });
};

export const recoverDesignFromMockup = async (
  imageContent: string,
  maskContent: string,
  compositeContent: string | null,
  memoryInsight: MemoryInsight
): Promise<{ image: string; text: string }> => {
  return executeManagedTask('IMAGE_EDIT_COMPLEX', async () => {
    const ai = getAI();
    const model = "gemini-3-pro-image-preview";
    const backupModel = "gemini-2.5-flash-image";
    
    const prompt = `[ROLE: PIXELSMITH DESIGN PUBLISHER] Flatten & Publish the graphic inside the MASK. Remove perspective and lighting. Output flat vector-style graphic on White Background.`;

    // SMART PRE-OPTIMIZATION
    const [optImage, optMask] = await Promise.all([
        optimizeImagePayload(imageContent, 'editing'),
        optimizeImagePayload(maskContent, 'masking')
    ]);

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { 
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } },
            { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      }),
      3,
      2000,
      model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { 
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } },
            { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      })
    );

    let image: string | undefined;
    response.candidates?.[0]?.content?.parts?.forEach(part => {
      if (part.inlineData) image = `data:image/png;base64,${part.inlineData.data}`;
    });
    return { image: image!, text: "Bản thiết kế phẳng đã được phục hồi." };
  });
};

export const scanAndFlattenDocument = async (
  imageContent: string,
  fileName: string,
  targetRatio: string = "3:4"
): Promise<string> => {
  return executeManagedTask('SCAN_PROCESSING', async () => {
    const ai = getAI();
    const model = "gemini-2.5-flash-image"; // FIXED: Use Image model for image generation tasks
    const backupModel = "gemini-3-pro-image-preview";
    
    // SMART PRE-OPTIMIZATION: Vision Profile (Document scanning doesn't need 4K input usually)
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const prompt = `
      [SYSTEM ROLE: INTELLIGENT DOCUMENT SCANNER]
      TASK: Digitize this physical document.
      
      STEPS:
      1. PERSPECTIVE: Dewarp the image to a flat 2D plane (Top-down).
      2. LIGHTING: Remove shadows, glares, and uneven lighting (White Balance correction).
      3. LEGIBILITY: Sharpen text edges using OCR-enhancing filters.
      4. BACKGROUND: Clean pure white (#FFFFFF).
    `;
    
    const validRatio = sanitizeAspectRatio(targetRatio);

    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
      config: { imageConfig: { aspectRatio: validRatio as any } }
    }), 3, 2000, model, () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
        config: { imageConfig: { aspectRatio: validRatio as any, imageSize: "1K" } }
    }), 300000);

    return `data:image/png;base64,${response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data}`;
  });
};

export const upscaleTo4K = async (
  imageContent: string, 
  label: string, 
  aspectRatio: string = "1:1",
  mode: 'general' | 'document' = 'general'
): Promise<string> => {
  // Use HEAVY tier but utilizing fallback logic heavily
  return executeManagedTask('UPSCALE_HighFidelity', async () => {
    const ai = getAI();
    const validRatio = sanitizeAspectRatio(aspectRatio);

    // SMART PRE-OPTIMIZATION: Upscale Input Profile
    // We resize to ~1024px to ensure the model focuses on "Hallucinating details" rather than processing raw pixels.
    // This dramatically reduces upload latency and inference wait time.
    const optimizedInput = await optimizeImagePayload(imageContent, 'upscale_input');

    // STRATEGY 1: PRO MODEL (True 4K) - Optimized Prompt for lower latency
    const performPro4K = () => {
      const prompt = `
        [SYSTEM ROLE: 4K UPSCALER]
        TASK: Upscale [${label}] to 4K resolution.
        ACTION: Denoise, sharpening, texture synthesis.
        OUTPUT: High fidelity photorealistic image.
      `;
      
      return ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optimizedInput.split(',')[1] } }] },
        config: { imageConfig: { imageSize: "4K", aspectRatio: validRatio as any } }
      });
    };

    // STRATEGY 2: FLASH MODEL (High-Res 2K) - Very Simple Prompt
    const performFlashBackup = () => {
      console.warn("⚠️ Switching to Flash Engine for stable upscaling...");
      const prompt = `
        [SYSTEM ROLE: IMAGE ENHANCER]
        TASK: Restore and Enhance [${label}] with maximum clarity.
        ACTION: Denoise and Sharpen edges.
      `;

      return ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optimizedInput.split(',')[1] } }] },
        config: { imageConfig: { aspectRatio: validRatio as any } } // No imageSize param for Flash
      });
    };

    // Execute with Fallback Chain
    // REDUCED RETRIES on Pro to 1 to fail fast and switch to Flash immediately on congestion.
    const response = await callWithRetry<GenerateContentResponse>(
      performPro4K, 
      1, 
      1000, 
      'Gemini-3-Pro-4K', 
      [performFlashBackup],
      120000 // 2 Minutes Timeout
    );

    const resultData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!resultData) throw new Error("Upscaling returned no image data.");
    
    return `data:image/png;base64,${resultData}`;
  });
};
