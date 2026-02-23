
import { Part, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { MemoryInsight, ScenarioCategory } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask, executeDirectTier } from "../../lib/tieredExecutor"; 
import { getEmpathyInstruction } from "../memoryService";
import { getVisionarySystemInstruction, REALISM_ENFORCER, CONTENT_STRATEGIST_PROMPT, TYPOGRAPHY_PROTOCOL } from "../prompts";
import { sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";

const RELAXED_SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

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
  // UPGRADE: Use Pro Image for 360 views to ensure texture consistency
  const model = "gemini-3-pro-image-preview"; 

  const angles = [
    { name: "Front View", detail: "Direct front view, symmetrical." },
    { name: "Back View", detail: "Rear view showing back details." },
    { name: "Left Side", detail: "90 degree left profile." },
    { name: "Right Side", detail: "90 degree right profile." },
    { name: "Isometric", detail: "3/4 perspective view from top-left." },
    { name: "Top Down", detail: "Directly from above (Bird's eye)." },
    { name: "Detail Macro", detail: "Close-up of texture/material." }
  ];

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

    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" }, safetySettings: RELAXED_SAFETY }
      });
      return extractImage(response);
    } catch (e) {
      console.warn(`Failed to generate angle ${angle.name}`, e);
      return null;
    }
  };

  // OPTIMIZED EXECUTION: Staggered Batching to respect Rate Limits
  return executeDirectTier('BATCH', async () => {
      const results: (string | null)[] = [];
      const BATCH_SIZE = 3; // Max 3 concurrent requests
      
      for (let i = 0; i < angles.length; i += BATCH_SIZE) {
          const batch = angles.slice(i, i + BATCH_SIZE);
          console.log(`[360 Shoot] Processing batch ${i/BATCH_SIZE + 1}...`);
          
          const batchResults = await Promise.all(batch.map(angle => generateAngle(angle)));
          results.push(...batchResults);
          
          // Slight delay between batches to cool down rate limiter
          if (i + BATCH_SIZE < angles.length) {
              await new Promise(r => setTimeout(r, 1000));
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
  preserveLayout: boolean = true
): Promise<{ image: string; text: string }> => {
  // Use HEAVY tier to allow longer timeouts for Pro model
  return executeManagedTask('IMAGE_GEN_4K', async () => {
    const ai = getAI();
    const validRatio = sanitizeAspectRatio(aspectRatio);
    
    const promises: Promise<any>[] = [];
    if (logoAsset) promises.push(optimizeImagePayload(logoAsset, 'generation'));
    if (moodboardAssets) moodboardAssets.forEach(a => promises.push(optimizeImagePayload(a, 'generation')));

    const optimized = await Promise.all(promises);
    const optLogo = logoAsset ? optimized[0] : null;
    const optMoods = moodboardAssets ? (logoAsset ? optimized.slice(1) : optimized) : [];

    const instruction = `
      ${getEmpathyInstruction(memoryInsight)}
      ${getVisionarySystemInstruction(category)}
      ${TYPOGRAPHY_PROTOCOL}
      [VAI TRÒ: MASTER VISUAL VARIATIONIST & TYPOGRAPHER]
      MỤC TIÊU THIẾT KẾ: ${goal}
      
      *** QUY TẮC NỘI DUNG TUYỆT ĐỐI (ABSOLUTE CONTENT RULE): ***
      - KHÔNG ĐƯỢC vẽ bất kỳ chữ nào liên quan đến 'Engine state', 'Drift', 'Evolution', 'Phase' lên hình.
      - HÃY TỰ BỊA (Hallucinate) tên thương hiệu, slogan và nội dung bao bì chuyên nghiệp, sắc nét dựa trên mục tiêu: "${goal}".
      - NẾU CÓ YÊU CẦU CHỮ CỤ THỂ TRONG DẤU NGOẶC KÉP, HÃY VẼ CHÍNH XÁC NÓ.
      
      ${optLogo ? (preserveLayout 
          ? `QUY TẮC CẤU TRÚC: Giữ nguyên bố cục chính của ẢNH ĐẦU TIÊN (Input 1).` 
          : `QUY TẮC CẤU TRÚC: Giữ nguyên NỘI DUNG/THÔNG TIN của ẢNH ĐẦU TIÊN (Input 1), nhưng ĐƯỢC PHÉP SÁNG TẠO LẠI BỐ CỤC & PHONG CÁCH (Redesign Layout).`) 
      : ''}
      ${optMoods.length > 0 ? `QUY TẮC PHONG CÁCH: Áp dụng Palette và Texture từ CÁC ẢNH SAU.` : ''}
    `;

    const parts: Part[] = [{ text: instruction }];
    if (optLogo) parts.push({ inlineData: { mimeType: "image/png", data: optLogo.split(',')[1] } });
    optMoods.forEach(m => parts.push({ inlineData: { mimeType: "image/png", data: m.split(',')[1] } }));

    // UPGRADE: Primary is Pro Image for maximum quality
    const performPro = () => ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts },
        config: { imageConfig: { aspectRatio: validRatio as any, imageSize: "1K" }, safetySettings: RELAXED_SAFETY }
    });

    const performFlashBackup = () => ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts },
        config: { imageConfig: { aspectRatio: validRatio as any }, safetySettings: RELAXED_SAFETY }
    });

    // Prioritize Pro
    const response = await callWithRetry<GenerateContentResponse>(
        performPro, 3, 3000, 'Gemini-3-Pro-Image', 
        [performFlashBackup], 300000, true 
    );

    const image = extractImage(response);
    if (!image) throw new Error("Synthesis failed to yield image.");

    return { image, text: "Biến thể thiết kế (High Fidelity + Text) đã sẵn sàng." };
  });
};

export const generateBaseImage = async (
  prompt: string,
  memoryInsight: MemoryInsight,
  category: ScenarioCategory,
  aspectRatio: string = "1:1"
): Promise<{ image: string; text: string }> => {
  return executeManagedTask('IMAGE_GEN_4K', async () => {
    const ai = getAI();
    const validRatio = sanitizeAspectRatio(aspectRatio);
    
    // Include Content Strategist Prompt & Typography Protocol here too
    const instruction = `
      ${getEmpathyInstruction(memoryInsight)} 
      ${CONTENT_STRATEGIST_PROMPT} 
      ${TYPOGRAPHY_PROTOCOL}
      ${getVisionarySystemInstruction(category)} 
      Goal: ${prompt}
    `;

    // UPGRADE: Use Pro Image by default
    const performPro = () => ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts: [{ text: instruction }] },
        config: { imageConfig: { aspectRatio: validRatio as any, imageSize: "1K" }, safetySettings: RELAXED_SAFETY }
    });

    const response = await callWithRetry<GenerateContentResponse>(performPro, 3, 3000, 'Base-Image-Pro', undefined, 300000, true);
    const image = extractImage(response);
    return { image: image!, text: "Bản vẽ Ultra-HD (Có hỗ trợ chữ) đã được khởi tạo." };
  });
};
