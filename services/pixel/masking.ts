
import { Part, GenerateContentResponse } from "@google/genai";
import { MemoryInsight } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { getClosestAspectRatio, optimizeImagePayload } from "../../lib/utils";
import { executeManagedTask } from "../../lib/tieredExecutor"; 

// HEAVY TASK: Subject Isolation (High Velocity Migration)
export const isolateSubject = async (
  imageContent: string,
  imageLabel: string,
  memoryInsight: MemoryInsight
): Promise<{ image: string; text: string }> => {
  return executeManagedTask('IMAGE_EDIT_COMPLEX', async () => {
    const ai = getAI();
    // UPGRADE: Use Pro Image for better edge detection
    const model = "gemini-3-pro-image-preview"; 
    const backupModel = "gemini-2.5-flash-image";
    
    const ratio = await getClosestAspectRatio(imageContent);
    
    // SMART PRE-OPTIMIZATION: Editing Profile (Preserve any existing alpha, though input usually opaque)
    const optImage = await optimizeImagePayload(imageContent, 'editing');

    const prompt = `
      [SYSTEM ROLE: PIXELSMITH ISOLATOR]
      TASK: ISOLATE the main subject from the background of [${imageLabel}].
      
      INSTRUCTIONS:
      1. SUBJECT: Keep the main subject (person, product, or object) EXACTLY as it is.
      2. BACKGROUND: Replace the entire background with SOLID PURE WHITE (Hex Code #FFFFFF).
      3. EDGES: Ensure the edges of the subject are sharp and clean.
      4. COMPOSITION: Respect the original aspect ratio (${ratio}).
      5. SHADOWS: DO NOT include cast shadows on the white background.
      6. OUTPUT: The result must be the subject on #FFFFFF.
    `;

    const parts: Part[] = [
      { text: prompt },
      { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
    ];

    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts },
      config: { imageConfig: { aspectRatio: ratio as any, imageSize: "1K" } }
    }), 3, 2000, model, () => ai.models.generateContent({
        model: backupModel,
        contents: { parts },
        config: { imageConfig: { aspectRatio: ratio as any } }
    }));

    let image: string | undefined;
    let text = "";
    
    if (response.candidates?.[0]?.content?.parts) {
      response.candidates[0].content.parts.forEach(part => {
        if (part.inlineData) image = `data:image/png;base64,${part.inlineData.data}`;
        else if (part.text) text += part.text;
      });
    }

    if (!image) {
      throw new Error("Không thể tách nền: Gemini không trả về hình ảnh.");
    }
    
    return { 
      image: image, 
      text: text.trim() || "Chủ thể đã được tách nền (White Matte)." 
    };
  });
};

// MEDIUM TASK: Mask Generation (Using G3 Flash for speed)
export const generateSegmentationMask = async (
  imageContent: string,
  imageLabel: string
): Promise<string> => {
  return executeManagedTask('MASKING_SMART', async () => {
    const ai = getAI();
    const model = "gemini-2.5-flash-image"; // FIXED: Use Image model for image generation
    const ratio = await getClosestAspectRatio(imageContent);
    
    // SMART PRE-OPTIMIZATION: Masking Profile (Higher Res allowed)
    const optImage = await optimizeImagePayload(imageContent, 'masking');

    const prompt = `
      [SYSTEM ROLE: SOLID SILHOUETTE EXTRACTOR]
      TASK: Create a SOLID WHITE MASK for the main physical object in [${imageLabel}].
      
      CRITICAL RULE: OUTER CONTOUR CUT ONLY (NO INTERNAL HOLES).
      1. OBJECT AREA = PURE WHITE (#FFFFFF).
      2. BACKGROUND AREA = PURE BLACK (#000000).
      
      STRICT INSTRUCTIONS:
      - Treat the object as a SOLID SHEET. FILL THE ENTIRE SHAPE with white.
      - IGNORE internal contrast. Only separate the object from the external environment.
    `;

    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { 
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }
        ]
      },
      config: { imageConfig: { aspectRatio: ratio as any } }
    }), 3, 2000, model);

    let image: string | undefined;
    if (response.candidates?.[0]?.content?.parts) {
      response.candidates[0].content.parts.forEach(part => {
        if (part.inlineData) image = `data:image/png;base64,${part.inlineData.data}`;
      });
    }

    if (!image) throw new Error("Mask generation failed.");
    return image;
  });
};

// HEAVY TASK: Scan Processing
export const extractNeuralStudio = async (
  imageContent: string,
  maskContent: string,
  compositeContent: string | null,
  memoryInsight: MemoryInsight
): Promise<{ image: string; text: string }> => {
  return executeManagedTask('SCAN_PROCESSING', async () => {
    const ai = getAI();
    const model = "gemini-3-pro-image-preview";
    const backupModel = "gemini-2.5-flash-image";
    
    const ratio = await getClosestAspectRatio(imageContent);
    
    // SMART PRE-OPTIMIZATION
    const [optImage, optMask] = await Promise.all([
        optimizeImagePayload(imageContent, 'editing'), // Source
        optimizeImagePayload(maskContent, 'masking')   // Mask
    ]);
    
    const prompt = `
      [SYSTEM ROLE: HIGH-FIDELITY OPTICAL SCANNER]
      TASK: Extract AND Rectify the object defined by the WHITE MASK area.
      
      INPUT DATA:
      1. Source Image: The original photo.
      2. Mask: The user's brush selection of what they want to "Scan".
      
      STRICT PRESERVATION PROTOCOL (DO NOT REDESIGN):
      1. OPTICAL CLONE: The output must look EXACTLY like the original object.
      2. NO AI HALLUCINATION: Do NOT invent new details.
      3. GEOMETRY ONLY: Perspective Correction (Dewarp/Flatten).
      4. COLOR FIDELITY: Keep the original material texture and ink colors.
      5. BACKGROUND REMOVAL: Place the result on PURE SOLID WHITE (#FFFFFF).
      
      OUTPUT: A pixel-perfect, flat, rectified clone of the selected object.
    `;

    const parts: Part[] = [
      { text: prompt },
      { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } },
      { text: "MASK (Area to Scan & Flatten):" },
      { inlineData: { mimeType: "image/png", data: optMask.split(',')[1] } }
    ];

    if (compositeContent) {
      const optComposite = await optimizeImagePayload(compositeContent, 'editing');
      parts.push({ text: "VISUAL GUIDE (Overlay for context):" });
      parts.push({ inlineData: { mimeType: "image/png", data: optComposite.split(',')[1] } });
    }

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts },
        config: { 
          imageConfig: { aspectRatio: ratio as any, imageSize: "1K" }
        }
      }), 
      5, 
      2000, 
      model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts },
        config: { 
          imageConfig: { aspectRatio: ratio as any }
        }
      })
    );

    let image: string | undefined;
    let text = "";
    response.candidates?.[0]?.content?.parts?.forEach(part => {
      if (part.inlineData) image = `data:image/png;base64,${part.inlineData.data}`;
      else if (part.text) text += part.text;
    });
    
    return { 
      image: image!, 
      text: text.trim() || `Đối tượng đã được Scan, Nắn phẳng và Tách nền (Smart Scan).` 
    };
  });
};
