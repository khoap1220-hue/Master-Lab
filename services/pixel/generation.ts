
import { Part, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MemoryInsight, ScenarioCategory } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask, executeDirectTier, getExecutionTiers } from "../../lib/tieredExecutor"; 
import { getEmpathyInstruction } from "../memoryService";
import { getVisionarySystemInstruction, REALISM_ENFORCER, CONTENT_STRATEGIST_PROMPT, TYPOGRAPHY_PROTOCOL } from "../prompts";
import { sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";
import { MODELS } from "../../config/models";

const RELAXED_SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

import { isProTier } from '../../config/models';

const extractImage = (response: any): string | undefined => {
    if (response.generatedImages?.[0]?.image?.imageBytes) {
        return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
    }
    let img: string | undefined;
    response.candidates?.[0]?.content?.parts?.forEach((part: any) => {
        if (part.inlineData) img = `data:image/png;base64,${part.inlineData.data}`;
    });
    return img;
}

export const generate360ProductViews = async (
  basePrompt: string,
  memoryInsight: MemoryInsight,
  refImage?: string 
): Promise<string[]> => {
  const ai = getAI();
  const isPro = isProTier();
  // Use Flash Image for faster generation by default
  const model = MODELS.IMAGE_PRIMARY; 

  let angles = [
    { name: "Front View", detail: "Direct front view, symmetrical." },
    { name: "Back View", detail: "Rear view showing back details." },
    { name: "Left Side", detail: "90 degree left profile." },
    { name: "Right Side", detail: "90 degree right profile." },
    { name: "Isometric", detail: "3/4 perspective view from top-left." },
    { name: "Top Down", detail: "Directly from above (Bird's eye)." },
    { name: "Detail Macro", detail: "Close-up of texture/material." }
  ];

  // OPTIMIZATION: Reduce angles for Free Tier to save cost and avoid rate limits
  if (!isPro) {
    angles = [
      { name: "Front View", detail: "Direct front view, symmetrical." },
      { name: "Back View", detail: "Rear view showing back details." },
      { name: "Isometric", detail: "3/4 perspective view from top-left." },
      { name: "Detail Macro", detail: "Close-up of texture/material." }
    ];
  }

  // Optimize reference image if provided
  const optRef = refImage ? await optimizeImagePayload(refImage, 'generation') : null;

  const generateAngle = async (angle: { name: string, detail: string }) => {
    const instruction = `
        ${getEmpathyInstruction(memoryInsight)} 
        ${CONTENT_STRATEGIST_PROMPT} 
        ${REALISM_ENFORCER} 
        
        TASK: Generate a specific view of the product.
        VIEW ANGLE: ${angle.name}.
        ANGLE DETAIL: ${angle.detail}.
        CONTEXT/STYLE: ${basePrompt}
        
        IMPORTANT: Maintain consistency with the input product (if provided). Keep branding, colors, and shape identical.
    `;
    
    const parts: Part[] = [{ text: instruction }];
    if (optRef) {
        parts.push({ inlineData: { mimeType: "image/png", data: optRef.split(',')[1] } });
    }

    const performFlash31 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRIMARY,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1" }, safetySettings: RELAXED_SAFETY }
    });

    const performPro3 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRO,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1" }, safetySettings: RELAXED_SAFETY }
    });

    try {
      const response = await callWithRetry<GenerateContentResponse>(
        performFlash31, 2, 1000, 'Gemini-2.5-Flash-Image',
        [performPro3], 120000, true
      );
      return extractImage(response);
    } catch (e: any) {
      console.warn(`Failed to generate angle ${angle.name}`, e);
      if (e.message && e.message.includes('403')) throw e;
      return null;
    }
  };

  // OPTIMIZED EXECUTION: Staggered Batching to respect Rate Limits
  return executeDirectTier('BATCH', async () => {
      const results: (string | null)[] = [];
      const tiers = getExecutionTiers();
      const BATCH_SIZE = tiers.BATCH.concurrency;
      
      for (let i = 0; i < angles.length; i += BATCH_SIZE) {
          const batch = angles.slice(i, i + BATCH_SIZE);
          console.log(`[360 Shoot] Processing batch ${i/BATCH_SIZE + 1}...`);
          
          const batchResults = await Promise.all(batch.map(angle => generateAngle(angle)));
          results.push(...batchResults);
          
          // Slight delay between batches to cool down rate limiter
          if (i + BATCH_SIZE < angles.length) {
              const delay = tiers.BATCH.tierDelay;
              await new Promise(r => setTimeout(r, delay));
          }
      }
      
      return results.filter((img): img is string => img !== null);
  });
};

export const generateDesignVariation = async (
  goal: string,
  logoAsset: string | null,
  memoryInsight: MemoryInsight,
  category: ScenarioCategory,
  moodboardAssets?: string[],
  brandUrl?: string,
  aspectRatio: string = "1:1",
  preserveLayout: boolean = true,
  targetSize?: "1K" | "2K" | "4K"
): Promise<{ image: string; text: string; model?: string }> => {
  // Use HEAVY tier to allow longer timeouts
  return executeManagedTask('IMAGE_GEN_4K', async () => {
    const ai = getAI();
    const validRatio = sanitizeAspectRatio(aspectRatio);
    const isPro = isProTier();
    
    const imageConfig: any = { aspectRatio: validRatio };
    if (targetSize && isPro) {
        imageConfig.imageSize = targetSize;
    }

    const promises: Promise<any>[] = [];
    // Use 'generation' profile which resizes to max 768px and compresses
    if (logoAsset) promises.push(optimizeImagePayload(logoAsset, 'generation'));
    // Limit to max 2 moodboard images to save payload size
    const limitedMoodboards = moodboardAssets ? moodboardAssets.slice(0, 2) : [];
    if (limitedMoodboards.length > 0) {
        limitedMoodboards.forEach(a => promises.push(optimizeImagePayload(a, 'generation')));
    }

    const optimized = await Promise.all(promises);
    const optLogo = logoAsset ? optimized[0] : null;
    const optMoods = limitedMoodboards.length > 0 ? (logoAsset ? optimized.slice(1) : optimized) : [];

    // Compress the instruction to be more concise
    const instruction = `
      [ROLE: MASTER VISUAL VARIATIONIST]
      GOAL: ${goal}
      
      RULES:
      - NO text like 'Engine state', 'Drift', 'Evolution', 'Phase'.
      - Hallucinate professional brand name/slogan based on goal.
      - Draw exact text if in quotes.
      
      ${optLogo ? (preserveLayout ? `Keep main layout of Input 1.` : `Keep content of Input 1, redesign layout/style.`) : ''}
      ${optMoods.length > 0 ? `Apply Palette/Texture from following images.` : ''}
    `;

    const parts: Part[] = [{ text: instruction }];
    if (optLogo) parts.push({ inlineData: { mimeType: "image/png", data: optLogo.split(',')[1] } });
    optMoods.forEach(m => parts.push({ inlineData: { mimeType: "image/png", data: m.split(',')[1] } }));

    const performFlash31 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRIMARY,
        contents: { parts },
        config: { imageConfig, safetySettings: RELAXED_SAFETY }
    });

    const performPro3 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRO,
        contents: { parts },
        config: { imageConfig, safetySettings: RELAXED_SAFETY }
    });

    // Fallback for free tier keys that don't support 4K/2K
    const performFlash31Standard = () => {
        console.warn("⚠️ High-res generation failed or restricted. Falling back to Standard Resolution...");
        return ai.models.generateContent({
            model: MODELS.IMAGE_PRIMARY,
            contents: { parts },
            config: { imageConfig: { aspectRatio: validRatio }, safetySettings: RELAXED_SAFETY }
        });
    };

    // Prioritize Flash 3.1
    let usedModel = 'Gemini-3.1-Flash-Image';
    try {
        const response = await callWithRetry<GenerateContentResponse>(
            performFlash31, 2, 1000, 'Gemini-3.1-Flash-Image', 
            [performPro3, performFlash31Standard], 600000, true,
            (m) => usedModel = m
        );

        const image = extractImage(response);
        if (!image) throw new Error("Synthesis failed to yield image.");

        return { image, text: "Biến thể thiết kế (High Fidelity + Text) đã sẵn sàng.", model: usedModel };
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

export const generateBaseImage = async (
  prompt: string,
  memoryInsight: MemoryInsight,
  category: ScenarioCategory,
  aspectRatio: string = "1:1",
  targetSize?: "1K" | "2K" | "4K"
): Promise<{ image: string; text: string; model?: string }> => {
  return executeManagedTask('IMAGE_GEN_4K', async () => {
    const ai = getAI();
    const validRatio = sanitizeAspectRatio(aspectRatio);
    const isPro = isProTier();
    
    const imageConfig: any = { aspectRatio: validRatio };
    if (targetSize && isPro) {
        imageConfig.imageSize = targetSize;
    }
    
    // Include Content Strategist Prompt & Typography Protocol here too
    const instruction = `
      ${getEmpathyInstruction(memoryInsight)} 
      ${CONTENT_STRATEGIST_PROMPT} 
      ${TYPOGRAPHY_PROTOCOL}
      ${getVisionarySystemInstruction(category)} 
      Goal: ${prompt}
    `;

    const performFlash31 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRIMARY,
        contents: { parts: [{ text: instruction }] },
        config: { imageConfig, safetySettings: RELAXED_SAFETY }
    });

    const performPro3 = () => ai.models.generateContent({
        model: MODELS.IMAGE_PRO,
        contents: { parts: [{ text: instruction }] },
        config: { imageConfig, safetySettings: RELAXED_SAFETY }
    });

    // Fallback for free tier keys that don't support 4K/2K
    const performFlash31Standard = () => {
        console.warn("⚠️ High-res generation failed or restricted. Falling back to Standard Resolution...");
        return ai.models.generateContent({
            model: MODELS.IMAGE_PRIMARY,
            contents: { parts: [{ text: instruction }] },
            config: { imageConfig: { aspectRatio: validRatio }, safetySettings: RELAXED_SAFETY }
        });
    };

    let usedModel = 'Gemini-3.1-Flash-Image';
    try {
        const response = await callWithRetry<GenerateContentResponse>(
            performFlash31, 2, 1000, 'Gemini-3.1-Flash-Image', 
            [performPro3, performFlash31Standard], 600000, true,
            (m) => usedModel = m
        );
        const image = extractImage(response);
        if (!image) throw new Error("Synthesis failed to yield image.");
        return { image: image, text: "Bản vẽ Ultra-HD (Có hỗ trợ chữ) đã được khởi tạo.", model: usedModel };
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
