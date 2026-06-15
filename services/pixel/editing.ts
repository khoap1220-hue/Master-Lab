
import { Part, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MemoryInsight, ScenarioCategory } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { getVisionarySystemInstruction, REALISM_ENFORCER, CONTENT_STRATEGIST_PROMPT, ANTI_LAZINESS_PROTOCOL, getOutputFormatRules } from "../prompts";
import { getEmpathyInstruction } from "../memoryService";
import { getClosestAspectRatio, sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";
import { MODELS } from "../../config/models";

export const pixelSmithEdit = async (
  prompt: string,
  memoryInsight: MemoryInsight,
  imageContent: string,
  imageLabel: string,
  targetDescription: string,
  category: ScenarioCategory = 'Creative Studio',
  maskContent?: string,
  compositeContent?: string | null,
  refImageContent?: string,
  contextImages: {label: string, data: string}[] = []
): Promise<{ image?: string; text: string; model?: string }> => {
  return executeManagedTask('IMAGE_EDIT_COMPLEX', async () => {
    const ai = getAI();
    const detectedRatio = await getClosestAspectRatio(imageContent);
    const ratio = sanitizeAspectRatio(detectedRatio);
    
    const isLogoMode = category === 'Logo Design';
    const isCompositing = !!refImageContent || contextImages.length > 0;
    const formatRules = getOutputFormatRules(category);

    // Limit context images to max 2 to save payload size
    const limitedContextImages = contextImages.slice(0, 2);

    // SMART PRE-OPTIMIZATION (v2)
    const promises: Promise<any>[] = [optimizeImagePayload(imageContent, 'editing')];
    
    if (maskContent) promises.push(optimizeImagePayload(maskContent, 'masking')); else promises.push(Promise.resolve(null));
    if (compositeContent) promises.push(optimizeImagePayload(compositeContent, 'editing')); else promises.push(Promise.resolve(null));
    if (refImageContent) promises.push(optimizeImagePayload(refImageContent, 'editing')); else promises.push(Promise.resolve(null));
    
    if (limitedContextImages.length > 0) {
        limitedContextImages.forEach(img => promises.push(optimizeImagePayload(img.data, 'editing')));
    }

    const optimizedResults = await Promise.all(promises);
    
    const optImage = optimizedResults[0];
    const optMask = optimizedResults[1];
    const optComposite = optimizedResults[2];
    const optRefImage = optimizedResults[3];
    const optContextImages = limitedContextImages.map((img, idx) => ({
        label: img.label,
        data: optimizedResults[4 + idx]
    }));

    const systemPrompt = `
      [ROLE: IMAGE EDITOR & COMPOSITOR]
      TASK: Edit or embed brand assets into [${imageLabel}].
      REQ: "${prompt}"
      TECH GOAL: ${targetDescription}
      RATIO: ${ratio}
      
      QUY TẮC ĐỊNH DẠNG HÌNH ẢNH (DỰA TRÊN CATEGORY):
      ${formatRules}
      
      CRITICAL RULE: DO NOT RENDER metadata text.
      
      ${isCompositing ? `
      *** COMPOSITING MODE ***
      Embed assets physically. Add Contact Shadows, Reflections, Fresnel.
      Material Match: Apply Displacement/Multiply for textures (wood, fabric).
      DO NOT paste flatly. Curve with surface.
      ` : `
      RULES:
      1. INTEGRATION: Match lighting and perspective perfectly.
      2. MASK COMPLIANCE: Only edit WHITE mask areas.
      3. DETAIL BOOST: Add random micro-details (dust, scratches) for realism.
      `}
    `;

    const parts: Part[] = [{ text: systemPrompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }];
    
    if (optMask) parts.push({ text: "MASK (White = Target area, Black = Protect):" }, { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } });
    if (optComposite) parts.push({ text: "VISUAL GUIDE (Context overlay):" }, { inlineData: { mimeType: "image/png", data: optComposite.split(',')[1] } });
    
    if (optRefImage) {
      parts.push({ text: "PRIMARY BRAND LOGO/ASSET:" });
      parts.push({ inlineData: { mimeType: "image/png", data: optRefImage.split(',')[1] } });
    }

    if (optContextImages.length > 0) {
      parts.push({ text: "BRAND IDENTITY BUNDLE (Style & Elements references):" });
      optContextImages.forEach((img) => {
        parts.push({ text: `REFERENCE: ${img.label}` });
        parts.push({ inlineData: { mimeType: "image/png", data: img.data.split(',')[1] } });
      });
    }

    const sharedSafety = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
    ];

    // UPGRADE: Gemini 3.1 Flash Image is PRIMARY.
    const performFlash31 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRIMARY,
        contents: { parts },
        config: { imageConfig: { aspectRatio: ratio }, safetySettings: sharedSafety }
    });

    const performPro3 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRO,
        contents: { parts },
        config: { imageConfig: { aspectRatio: ratio }, safetySettings: sharedSafety }
    });

    const performFlash25 = () => ai.models.generateContent({
        model: MODELS.IMAGE_FAST,
        contents: { parts },
        config: { imageConfig: { aspectRatio: ratio }, safetySettings: sharedSafety }
    });

    let usedModel = 'Gemini-3.1-Flash-Edit';
    try {
        const response = await callWithRetry<GenerateContentResponse>(
          performFlash31, 
          2, 
          1000, 
          'Gemini-3.1-Flash-Edit', 
          [performPro3, performFlash25],
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
        
        if (!image) throw new Error("Mô hình không trả về ảnh chỉnh sửa.");
        return { image, text: text.trim() || "Chỉnh sửa hoàn tất (Pro Engine).", model: usedModel };
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
