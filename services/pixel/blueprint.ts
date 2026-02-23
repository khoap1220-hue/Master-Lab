
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, ScenarioCategory } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { getClosestAspectRatio, sanitizeAspectRatio, optimizeImagePayload } from "../../lib/utils";
import { executeManagedTask } from "../../lib/tieredExecutor"; // Import Queue Manager
import { getEmpathyInstruction } from "../memoryService";
import { cleanJson } from "../orchestrator/utils";

export const refineAssetForBlueprint = async (
  croppedElement: string,
  elementType: string,
  elementLabel: string
): Promise<string | null> => {
  // Use Batch Executor to manage concurrency
  return executeManagedTask('IMAGE_GEN_BATCH', async () => {
    const ai = getAI();
    // Correct Model: Flash Image for refinement
    const model = "gemini-2.5-flash-image"; 
    const backupModel = "gemini-3-pro-image-preview";
    
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
      }), 3, 2000, model, () => ai.models.generateContent({
          model: backupModel,
          contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optCropped.split(',')[1] } }] },
          config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
      }), 300000);

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part && part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) {
      console.error("Asset refinement failed", error);
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
      // CRITICAL FIX: Use 'gemini-2.5-flash-image' instead of 'gemini-3-flash-preview' (Text Model)
      const model = "gemini-2.5-flash-image"; 
      const backupModel = "gemini-3-pro-image-preview";
      
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
          config: { imageConfig: { aspectRatio: ratio as any } }
        }), 3, 2000, model, () => ai.models.generateContent({
            model: backupModel,
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
            config: { imageConfig: { aspectRatio: ratio as any, imageSize: "1K" } }
        }), 300000); 

        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part && part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
        return null;
      } catch (error) {
        console.error(`Layer generation failed for ${layerType}`, error);
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
    const model = "gemini-3-flash-preview";

    const prompt = `
      ROLE: SENIOR CREATIVE DIRECTOR (Specializing in ${category}).
      TASK: Brainstorm 3 distinct concepts based on user input.
      FOCUS: STORY & SYMBOL (Optimize for speed).
      
      USER INPUT: "${currentInput || 'Standard'}"
      
      INSTRUCTIONS:
      - Suggest 3 concrete directions focused on the visual story and key symbols.
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
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                desc: { type: Type.STRING },
                style: { type: Type.STRING }
              }
            }
          }
        }
      }), 3, 2000, model, undefined, 60000); 
      const raw = JSON.parse(cleanJson(response.text || "[]"));
      return Array.isArray(raw) ? raw.map((item: any) => ({
        title: item.title || "Concept",
        desc: item.desc || "",
        style: typeof item.style === 'string' ? item.style : "Standard"
      })) : [];
    } catch (e) {
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
    const model = "gemini-3.1-pro-preview";
    
    // SMART PRE-OPTIMIZATION: Vision Profile
    const optImage = await optimizeImagePayload(currentImage, 'vision');

    const prompt = `
      ${getEmpathyInstruction(memoryInsight)}
      
      ROLE: VISUAL DIRECTOR FOR [${category.toUpperCase()}].
      TASK: Analyze the user's edit request and the image content. Translate it into a precise technical instruction for the Image Generation AI.
      
      CONTEXT:
      - Category: ${category} (This determines the style rules).
      - Image Label: ${label}
      - User Request: "${userPrompt}"
      
      INSTRUCTIONS:
      1. ANALYZE: What exactly needs to change? (Lighting, Color, Object Removal, Addition, Texture).
      2. CATEGORY RULES:
         - If 'Logo Design': Keep it FLAT, VECTOR-STYLE. No 3D shadows.
         - If 'Real Estate': Maintain architectural straight lines. Realistic lighting.
         - If 'Product Design': Focus on material accuracy (CMF).
      3. OUTPUT:
         - "technicalPrompt": The strict prompt for the AI Editor (English). Use technical terms (e.g. "Increase exposure +1EV", "Change fill color to #FF0000", "Remove object using in-painting").
         - "userExplanation": A friendly, professional explanation to the user (Vietnamese) about what you are going to do.
      
      OUTPUT JSON:
      {
        "technicalPrompt": "The precise English prompt for the image model...",
        "userExplanation": "Thông báo cho người dùng bằng tiếng Việt..."
      }
    `;

    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technicalPrompt: { type: Type.STRING },
            userExplanation: { type: Type.STRING }
          }
        }
      }
    }), 3, 3000, model, undefined, 180000);
    
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
    const model = "gemini-3-flash-preview";
    
    // SMART PRE-OPTIMIZATION: Vision Profile (Low res OK)
    const optImage = await optimizeImagePayload(imageContent, 'vision');

    const response = await ai.models.generateContent({
      model,
      contents: [{ text: `Phân tích ${label}` }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJson(response.text || "{}"));
  });
};
