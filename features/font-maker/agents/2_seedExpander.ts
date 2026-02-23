
import { GenerateContentResponse } from "@google/genai";
import { getAI, callWithRetry } from "../../../lib/gemini";
import { optimizeImagePayload } from "../../../lib/utils";
import { executeManagedTask } from "../../../lib/tieredExecutor";
import { FontStrategy } from "./1_fontStrategist";

export const runStyledTextGenerator = async (
  seedImage: string,
  strategy: FontStrategy,
  targetText: string
): Promise<{ resultImageUrl: string }> => {
  return executeManagedTask('IMAGE_GEN_4K', async () => {
    const ai = getAI();
    const generationModel = "gemini-3-pro-image-preview";
    const backupModel = "gemini-2.5-flash-image";
    
    // Optimize input
    const optInput = await optimizeImagePayload(seedImage, 'generation');

    const genPrompt = `
      [SYSTEM ROLE: MASTER TYPOGRAPHY ARTIST]
      
      TASK: Render the specific text "${targetText}" using the EXACT visual style of the Input Image.
      
      INPUT STYLE DNA:
      - Class: ${strategy.classification}
      - Vibe: ${strategy.emotionalVibe}
      - Visual: ${strategy.visualDescription}
      
      RENDERING RULES:
      1. CONTENT: Write ONLY the text: "${targetText}".
      2. STYLE TRANSFER: Copy the stroke width, texture (ink/brush/clean), and imperfections from the input image.
      3. COMPOSITION: Center the text on a clean WHITE background (#FFFFFF).
      4. COLOR: Use high-contrast BLACK ink (unless input suggests otherwise).
      5. QUALITY: High resolution, sharp edges, no artifacts.
      
      OUTPUT: A single image containing the stylized text.
    `;

    const genResponse = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model: generationModel,
        contents: { parts: [
            { text: genPrompt }, 
            { inlineData: { mimeType: "image/png", data: optInput.split(',')[1] } } 
        ] },
        config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } } 
      }), 
      3, 
      5000, 
      generationModel,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [
            { text: genPrompt }, 
            { inlineData: { mimeType: "image/png", data: optInput.split(',')[1] } } 
        ] },
        config: { imageConfig: { aspectRatio: "16:9" } } 
      })
    );

    let resultImage = "";
    genResponse.candidates?.[0]?.content?.parts?.forEach(part => { 
        if (part.inlineData) resultImage = `data:image/png;base64,${part.inlineData.data}`; 
    });
    
    if (!resultImage) throw new Error("Text Generation Failed: No image generated.");
    
    return { resultImageUrl: resultImage };
  });
};
