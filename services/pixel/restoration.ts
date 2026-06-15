
import { Part, GenerateContentResponse } from "@google/genai";
import { MemoryInsight } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";
import { REALISM_ENFORCER } from "../prompts";
import { MODELS, isProTier } from "../../config/models";

export const enrichRegionForPrint = async (
  imageContent: string,
  maskContent: string,
  compositeContent: string | null,
  memoryInsight: MemoryInsight
): Promise<{ image: string; text: string; model?: string }> => {
  return executeManagedTask('IMAGE_EDIT_COMPLEX', async () => {
    const ai = getAI();
    const model = MODELS.IMAGE_PRIMARY;
    const proModel = MODELS.IMAGE_PRO;
    const flashModel = MODELS.IMAGE_FAST;
    
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

    let usedModel: string = model;
    try {
        const response = await callWithRetry<GenerateContentResponse>(
          () => ai.models.generateContent({
            model,
            contents: { parts },
            config: { imageConfig: { aspectRatio: "1:1" } }
          }), 
          2, 
          1000, 
          model,
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
          600000,
          true,
          (m) => usedModel = m
        );

        let image: string | undefined;
        let text = "";
        
        if ((response as any).generatedImages?.[0]?.image?.imageBytes) {
            image = `data:image/png;base64,${(response as any).generatedImages[0].image.imageBytes}`;
        }
        
        response.candidates?.[0]?.content?.parts?.forEach(part => {
          if (part.inlineData && !image) image = `data:image/png;base64,${part.inlineData.data}`;
          else if (part.text) text += part.text;
        });
        
        return { image: image!, text: text.trim() || `Đã tái tạo chi tiết siêu thực (Macro Enhance).`, model: usedModel };
    } catch (error: any) {
        if (error.message && error.message.includes('Neural Refusal')) {
            const contentMatch = error.message.match(/Content:\s*(.*)/);
            const textContent = contentMatch ? contentMatch[1] : error.message;
            return { image: '', text: textContent, model: usedModel };
        }
        throw error;
    }
  });
};

export const recoverDesignFromMockup = async (
  imageContent: string,
  maskContent: string,
  compositeContent: string | null,
  memoryInsight: MemoryInsight
): Promise<{ image: string; text: string; model?: string }> => {
  return executeManagedTask('IMAGE_EDIT_COMPLEX', async () => {
    const ai = getAI();
    const model = MODELS.IMAGE_PRIMARY;
    const proModel = MODELS.IMAGE_PRO;
    const flashModel = MODELS.IMAGE_FAST;
    
    const prompt = `[ROLE: PIXELSMITH DESIGN PUBLISHER] Flatten & Publish the graphic inside the MASK. Remove perspective and lighting. Output flat vector-style graphic on White Background.`;

    // SMART PRE-OPTIMIZATION
    const [optImage, optMask] = await Promise.all([
        optimizeImagePayload(imageContent, 'editing'),
        optimizeImagePayload(maskContent, 'masking')
    ]);

    let usedModel: string = model;
    try {
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
            config: { imageConfig: { aspectRatio: "1:1" } }
          }),
          2,
          1000,
          model,
          [
            () => ai.models.generateContent({
                model: proModel,
                contents: { 
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } },
                    { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } }
                  ]
                },
                config: { imageConfig: { aspectRatio: "1:1" } }
            }),
            () => ai.models.generateContent({
                model: flashModel,
                contents: { 
                  parts: [
                    { text: prompt },
                    { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } },
                    { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } }
                  ]
                },
                config: { imageConfig: { aspectRatio: "1:1" } }
            })
          ],
          600000,
          true,
          (m) => usedModel = m
        );

        let image: string | undefined;
        if ((response as any).generatedImages?.[0]?.image?.imageBytes) {
            image = `data:image/png;base64,${(response as any).generatedImages[0].image.imageBytes}`;
        }
        response.candidates?.[0]?.content?.parts?.forEach(part => {
          if (part.inlineData && !image) image = `data:image/png;base64,${part.inlineData.data}`;
        });
        return { image: image!, text: "Bản thiết kế phẳng đã được phục hồi.", model: usedModel };
    } catch (error: any) {
        if (error.message && error.message.includes('Neural Refusal')) {
            const contentMatch = error.message.match(/Content:\s*(.*)/);
            const textContent = contentMatch ? contentMatch[1] : error.message;
            return { image: '', text: textContent, model: usedModel };
        }
        throw error;
    }
  });
};

export const scanAndFlattenDocument = async (
  imageContent: string,
  fileName: string,
  targetRatio: string = "3:4"
): Promise<string> => {
  return executeManagedTask('SCAN_PROCESSING', async () => {
    const ai = getAI();
    const model = MODELS.IMAGE_PRIMARY;
    const proModel = MODELS.IMAGE_PRO;
    const flashModel = MODELS.IMAGE_FAST;
    
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

    let usedModel: string = model;
    try {
        const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
          model,
          contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
          config: { imageConfig: { aspectRatio: validRatio } }
        }), 2, 1000, model, [
            () => ai.models.generateContent({
                model: proModel,
                contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
                config: { imageConfig: { aspectRatio: validRatio } }
            }),
            () => ai.models.generateContent({
                model: flashModel,
                contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
                config: { imageConfig: { aspectRatio: validRatio } }
            })
        ], 600000, true, (m) => usedModel = m);

        if ((response as any).generatedImages?.[0]?.image?.imageBytes) {
            return `data:image/png;base64,${(response as any).generatedImages[0].image.imageBytes}`;
        }
        return `data:image/png;base64,${response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data}`;
    } catch (error: any) {
        if (error.message && error.message.includes('Neural Refusal')) {
            throw new Error("Neural Refusal: Không thể scan tài liệu.");
        }
        throw error;
    }
  });
};

export const upscaleTo4K = async (
  imageContent: string, 
  label: string, 
  aspectRatio: string = "1:1",
  targetSize: "2K" | "4K" = "4K"
): Promise<{ image: string; model: string }> => {
  // Use HEAVY tier but utilizing fallback logic heavily
  return executeManagedTask('UPSCALE_HighFidelity', async () => {
    const ai = getAI();
    const validRatio = sanitizeAspectRatio(aspectRatio);
    const isPro = isProTier();
    const imageConfig: any = { aspectRatio: validRatio };
    
    // imageSize is typically a Pro feature for Gemini models
    if (isPro) {
      imageConfig.imageSize = targetSize;
    }

    // SMART PRE-OPTIMIZATION: Upscale Input Profile
    const optimizedInput = await optimizeImagePayload(imageContent, 'upscale_input');

    // STRATEGY 1: 3.1 FLASH (Primary)
    const performFlash31 = () => {
      const prompt = `
        [SYSTEM ROLE: ${targetSize} UPSCALER]
        TASK: Upscale [${label}] to ${targetSize} resolution.
        ACTION: Denoise, sharpening, texture synthesis.
        OUTPUT: High fidelity photorealistic image.
      `;
      
      return ai.models.generateContent({
        model: MODELS.IMAGE_PRIMARY,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optimizedInput.split(',')[1] } }] },
        config: { imageConfig }
      });
    };

    // STRATEGY 2: PRO MODEL (Backup)
    const performPro3 = () => {
      const prompt = `
        [SYSTEM ROLE: ${targetSize} UPSCALER]
        TASK: Upscale [${label}] to ${targetSize} resolution.
        ACTION: Denoise, sharpening, texture synthesis.
        OUTPUT: High fidelity photorealistic image.
      `;
      
      return ai.models.generateContent({
        model: MODELS.IMAGE_PRO,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optimizedInput.split(',')[1] } }] },
        config: { imageConfig }
      });
    };

    // STRATEGY 2.5: 3.1 FLASH (Standard Res Fallback - No 4K)
    const performFlash31Standard = () => {
      console.warn("⚠️ 4K Upscale failed or restricted. Falling back to Standard Resolution...");
      const prompt = `
        [SYSTEM ROLE: IMAGE ENHANCER]
        TASK: Restore and Enhance [${label}] with maximum clarity.
        ACTION: Denoise and Sharpen edges.
      `;
      
      return ai.models.generateContent({
        model: MODELS.IMAGE_PRIMARY,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optimizedInput.split(',')[1] } }] },
        config: { imageConfig: { aspectRatio: validRatio } }
      });
    };

    // STRATEGY 3: FLASH 2.5 MODEL (High-Res 2K)
    const performFlash25 = () => {
      console.warn("⚠️ Switching to Flash Engine for stable upscaling...");
      const prompt = `
        [SYSTEM ROLE: IMAGE ENHANCER]
        TASK: Restore and Enhance [${label}] with maximum clarity.
        ACTION: Denoise and Sharpen edges.
      `;

      return ai.models.generateContent({
        model: MODELS.IMAGE_FAST,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optimizedInput.split(',')[1] } }] },
        config: { imageConfig: { aspectRatio: validRatio } } // No imageSize param for Flash
      });
    };

    // Execute with Fallback Chain
    let usedModel = 'Gemini-3.1-Flash-Image';
    try {
        const response = await callWithRetry<GenerateContentResponse>(
          performFlash31, 
          1, 
          1000, 
          'Gemini-3.1-Flash-Image', 
          [performPro3, performFlash31Standard, performFlash25],
          150000, // 2.5 Minutes Timeout
          true,
          (m) => usedModel = m
        );

        let resultData = (response as any).generatedImages?.[0]?.image?.imageBytes;
        if (!resultData) {
            resultData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        }
        if (!resultData) throw new Error("Upscaling returned no image data.");
        
        return { image: `data:image/png;base64,${resultData}`, model: usedModel };
    } catch (error: any) {
        if (error.message && error.message.includes('Neural Refusal')) {
            throw new Error("Neural Refusal: Không thể upscale ảnh.");
        }
        throw error;
    }
  });
};
