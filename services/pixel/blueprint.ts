
import { GenerateContentResponse } from "@google/genai";
import { MemoryInsight, ScenarioCategory } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { getClosestAspectRatio, sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";
import { executeManagedTask } from "../../lib/tieredExecutor"; // Import Queue Manager
import { getEmpathyInstruction } from "../memoryService";
import { cleanJson } from "../orchestrator/utils";
import { getOutputFormatRules } from "../prompts";
import { MODELS } from "../../config/models";

export const refineAssetForBlueprint = async (
  croppedElement: string,
  elementType: string,
  elementLabel: string
): Promise<string | null> => {
  // Use Batch Executor to manage concurrency
  return executeManagedTask('IMAGE_GEN_BATCH', async () => {
    const ai = getAI();
    // Correct Model: Flash Image for refinement
    const model = MODELS.IMAGE_PRIMARY; 
    const proModel = MODELS.IMAGE_PRO;
    const flashModel = MODELS.IMAGE_FAST;
    
    // SMART PRE-OPTIMIZATION: Editing Profile (Needs transparency for assets)
    const optCropped = await optimizeImagePayload(croppedElement, 'editing');

    const prompt = `
      [SYSTEM ROLE: ASSET EXTRACTOR]
      TASK: Clean up and refine this cropped image element to create a High-Quality Design Asset.
      INPUT: A cropped section of a packaging design (Type: ${elementType}, Label: ${elementLabel}).
      
      INSTRUCTIONS:
      1. ISOLATE: Remove background noise, nearby text artifacts, or packaging material textures.
      2. FLATTEN: Correct any perspective distortion. Make it strictly flat 2D.
      3. ENHANCE: Sharpen edges and clean up colors. 
      4. BACKGROUND: If it's a Logo or Graphic, put it on a transparent or solid white background. If it's a Background Pattern, make it seamless.
      
      OUTPUT: A polished PNG asset ready for vectorization or layout assembly.
    `;

    try {
      const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { 
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/png", data: optCropped.split(',')[1] } }
          ] 
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      }), 2, 1000, model, [
          () => ai.models.generateContent({
              model: proModel,
              contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optCropped.split(',')[1] } }] },
              config: { imageConfig: { aspectRatio: "1:1" } }
          }),
          () => ai.models.generateContent({
              model: flashModel,
              contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optCropped.split(',')[1] } }] },
              config: { imageConfig: { aspectRatio: "1:1" } }
          })
      ], 600000, true);

      if ((response as any).generatedImages?.[0]?.image?.imageBytes) {
        return `data:image/png;base64,${(response as any).generatedImages[0].image.imageBytes}`;
      }
      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part && part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error: any) {
      console.error("Asset refinement failed", error);
      if (error.message && error.message.includes('403')) throw error;
      return null;
    }
  });
};

export const generateLayer4K = async (
  originalImage: string,
  layerType: 'background' | 'typography' | 'graphics',
  layerDescription: string
): Promise<string | null> => {
  // CRITICAL FIX: Route through 'IMAGE_GEN_BATCH' tier.
  // This tier now allows 3 concurrent jobs, perfect for generating 3 layers simultaneously.
  return executeManagedTask('IMAGE_GEN_BATCH', async () => {
      const ai = getAI();
      const model = MODELS.IMAGE_PRIMARY; 
      const proModel = MODELS.IMAGE_PRO;
      const flashModel = MODELS.IMAGE_FAST;
      
      const detectedRatio = await getClosestAspectRatio(originalImage);
      const ratio = sanitizeAspectRatio(detectedRatio);

      // SMART PRE-OPTIMIZATION: Editing Profile
      const optImage = await optimizeImagePayload(originalImage, 'editing');

      const prompt = `
        [SYSTEM ROLE: DIGITAL ASSET RIPPER]
        INPUT IMAGE: A packaging design.
        TARGET: EXTRACT and RECONSTRUCT only the [${layerType.toUpperCase()}] layer.

        SPECIFIC CONTENT TO GENERATE: ${layerDescription}

        STRICT RENDERING RULES:
        1. VIEWPORT: ORTHOGRAPHIC / FLAT LAY VIEW. Do not render 3D box shapes. Render a flat texture/plane.
        2. ISOLATION:
          - IF Background: Generate ONLY the seamless material texture/color. COMPLETELY REMOVE ALL TEXT, LOGOS, ICONS, AND GRAPHICS.
          - IF Typography: Generate ONLY the text elements. **MUST BE ON PURE #FFFFFF WHITE BACKGROUND.**
          - IF Graphics: Generate ONLY the isolated logo/icons. **MUST BE ON PURE #FFFFFF WHITE BACKGROUND.**
        
        3. QUALITY: High fidelity reconstruction.
        4. COMPOSITION: Maintain the exact aspect ratio (${ratio}) and relative positioning of elements.
      `;

      try {
        const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
          model,
          contents: { 
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
            ] 
          },
          config: { imageConfig: { aspectRatio: ratio } }
        }), 2, 1000, model, [
            () => ai.models.generateContent({
                model: proModel,
                contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
                config: { imageConfig: { aspectRatio: ratio } }
            }),
            () => ai.models.generateContent({
                model: flashModel,
                contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
                config: { imageConfig: { aspectRatio: ratio } }
            })
        ], 600000, true); 

        if ((response as any).generatedImages?.[0]?.image?.imageBytes) {
          return `data:image/png;base64,${(response as any).generatedImages[0].image.imageBytes}`;
        }
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
      } catch (error: any) {
        console.error(`Layer generation failed for ${layerType}`, error);
        if (error.message && error.message.includes('403')) throw error;
        return null;
      }
  });
};

export const suggestCreativeConcepts = async (
  category: string,
  currentInput: string
): Promise<Array<{ title: string; desc: string; style: string }>> => {
  return executeManagedTask('BRAINSTORMING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST;
    const formatRules = getOutputFormatRules(category as ScenarioCategory);

    const prompt = `
      ROLE: SENIOR CREATIVE DIRECTOR (Specializing in ${category}).
      TASK: Brainstorm 3 distinct concepts based on user input.
      FOCUS: STORY & SYMBOL (Optimize for speed).
      
      USER INPUT: "${currentInput || 'Standard'}"
      
      QUY TẮC ĐỊNH DẠNG HÌNH ẢNH (DỰA TRÊN CATEGORY):
      ${formatRules}
      
      INSTRUCTIONS:
      - Suggest 3 concrete directions focused on the visual story and key symbols that strictly adhere to the Category Format Rules.
      - Keep descriptions concise but evocative.
      - RETURN VIETNAMESE CONTENT.
      - "style": 1-2 keywords (e.g. "Minimalist").
      
      OUTPUT JSON:
      [
        { "title": "Concept Name", "desc": "Concise Story & Symbol description...", "style": "Style Tags" }
      ]
    `;

    try {
      const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
          
          
        }
      }), 2, 1000, model, [], 60000); 
      const raw = JSON.parse(cleanJson(response.text || "[]"));
      return Array.isArray(raw) ? raw.map((item: any) => ({
        title: item.title || "Concept",
        desc: item.desc || "",
        style: typeof item.style === 'string' ? item.style : "Standard"
      })) : [];
    } catch (e: any) {
      if (e.message && e.message.includes('403')) throw e;
      return [{ title: "Gợi ý mặc định", desc: "Không thể tải gợi ý lúc này.", style: "Standard" }];
    }
  });
};

export const planTaskAction = async (
  memoryInsight: MemoryInsight, 
  currentImage: string, 
  label: string, 
  userPrompt: string,
  category: ScenarioCategory
): Promise<{ name: string; creativeAdvice: string }> => {
  return executeManagedTask('STRATEGY_PLANNING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST; // Optimized for speed and tokens
    const backupModel = MODELS.TEXT_PRIMARY;
    
    // SMART PRE-OPTIMIZATION: Vision Profile
    const optImage = await optimizeImagePayload(currentImage, 'vision');
    const formatRules = getOutputFormatRules(category);

    const prompt = `
      ${getEmpathyInstruction(memoryInsight)}
      
      ROLE: VISUAL DIRECTOR FOR [${category.toUpperCase()}].
      TASK: Analyze the user's edit request and the image content. Translate it into a precise technical instruction for the Image Generation AI.
      
      CONTEXT:
      - Category: ${category}
      - Image Label: ${label}
      - User Request: "${userPrompt}"
      
      INSTRUCTIONS:
      1. ANALYZE: What exactly needs to change? (Lighting, Color, Object Removal, Addition, Texture).
      2. CATEGORY RULES:
         ${formatRules}
      3. OUTPUT:
         - "technicalPrompt": The strict prompt for the AI Editor (English). Use technical terms (e.g. "Increase exposure +1EV", "Change fill color to #FF0000", "Remove object using in-painting").
         - "userExplanation": A friendly, professional explanation to the user (Vietnamese) about what you are going to do.
      
      OUTPUT JSON ONLY:
      {
        "technicalPrompt": "The precise English prompt for the image model...",
        "userExplanation": "Thông báo cho người dùng bằng tiếng Việt..."
      }
    `;

    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
      config: { 
        responseMimeType: "application/json"
      }
    }), 2, 1000, model, [
        () => ai.models.generateContent({
            model: backupModel,
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
            config: { responseMimeType: "application/json" }
        })
    ], 600000);
    
    const data = JSON.parse(cleanJson(response.text || "{}"));
    return {
      name: data.technicalPrompt || userPrompt, 
      creativeAdvice: data.userExplanation || "Đang thực hiện chỉnh sửa theo yêu cầu..."
    };
  });
};

export const analyzeImageInitial = async (imageContent: string, label: string, memoryInsight: MemoryInsight) => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST;
    
    // SMART PRE-OPTIMIZATION: Vision Profile (Low res OK)
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const response = await callWithRetry<any>(
      () => ai.models.generateContent({
        model,
        contents: [{ text: `Phân tích ${label}` }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }],
        config: {  }
      }),
      2, 1000, model,
      [] // Empty array for no fallbacks
    );
    return JSON.parse(cleanJson(response.text || "{}"));
  });
};
