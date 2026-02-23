
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { optimizeImagePayload } from "../../lib/utils";

/**
 * Packaging Strategy Planning
 */
export const planPackagingProject = async (
  userRequest: string,
  boxType: string
): Promise<{
  visualPrompt: string;
  structuredBrief?: string;
  sources: GroundingSource[];
  trendsSummary?: string;
}> => {
  return executeManagedTask('STRATEGY_PLANNING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KỸ SƯ GIẢI PHÁP ĐÓNG GÓI (PACKAGING ENGINEER).
      
      INPUT:
      - Yêu cầu: "${userRequest}"
      - Loại hộp/kiểu dáng: "${boxType}"
      
      NHIỆM VỤ: Phân tích và đề xuất cấu trúc bao bì tối ưu.
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "Detailed prompt for 3D Render (Materials, Finish, Lighting, Angle)...",
        "structuredBrief": "Markdown Content describing: 1. Unboxing Experience, 2. Material Specs, 3. Sustainability Factor...",
        "trendsSummary": "Short note on current packaging trends suitable for this product."
      }
    `;

    const config = {
        thinkingConfig: { thinkingBudget: 32768 }, // UPGRADE: Deep Engineering
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: { type: Type.STRING },
            structuredBrief: { type: Type.STRING },
            trendsSummary: { type: Type.STRING }
          },
          required: ["visualPrompt", "structuredBrief"]
        }
    } as any;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config
      }),
      3,
      2000,
      model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] },
        config
      })
    );

    const data = JSON.parse(cleanJson(response.text || "{}"));

    return {
      visualPrompt: data.visualPrompt,
      structuredBrief: data.structuredBrief,
      trendsSummary: data.trendsSummary,
      sources: []
    };
  });
};

/**
 * Generate Packaging Technical Specs (Die-line, Print)
 */
export const generatePackagingSpecs = async (
  designContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    const prompt = `
      VAI TRÒ: KỸ SƯ SẢN XUẤT BAO BÌ (PACKAGING ENGINEER).
      NHIỆM VỤ: Lập quy cách in ấn (Print Specs) cho thiết kế: "${designContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      1. **CẤU TRÚC KỸ THUẬT (DIE-LINE SPECS):** Kích thước, Loại giấy, Kiểu dáng.
      2. **CÔNG NGHỆ IN ẤN:** Hệ màu, Kỹ thuật bề mặt (UV, Ép kim).
      3. **GIA CÔNG THÀNH PHẨM:** Bế, Dán, Gấp.
      4. **LƯU Ý SẢN XUẤT:** Sai số, Test màu.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] }
      }),
      3,
      2000,
      model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] }
      })
    );

    return response.text || "Đã lập hồ sơ kỹ thuật bao bì.";
  });
};

/**
 * Vector Blueprint Analysis
 * Deconstructs a packaging image into layer generation prompts.
 */
export const generateVectorBlueprint = async (
  packagingImage: string,
  goal: string
): Promise<{
  analysisSummary: string;
  layerPrompts: {
    background: string;
    typography: string;
    graphics: string;
  };
}> => {
  return executeManagedTask('BLUEPRINT_DECOMPOSITION', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    const backupModel = "gemini-3-flash-preview";

    // Optimization
    const optImage = await optimizeImagePayload(packagingImage, 'vision');

    const prompt = `
      [ROLE: PACKAGING DECONSTRUCTION ENGINEER]
      TASK: Analyze the packaging design image and reverse-engineer it into 3 distinct layers for reconstruction.
      CONTEXT: "${goal}"
      
      OUTPUT OBJECTIVES:
      1. BACKGROUND LAYER: Identify the seamless pattern, material texture, or base gradient. Exclude logos and text.
      2. TYPOGRAPHY LAYER: Identify all text elements (Brand Name, Slogan, Net Weight). 
      3. GRAPHICS LAYER: Identify standalone icons, illustrations, or main logos.
      
      FOR EACH LAYER, WRITE A PRECISE GENERATION PROMPT (English) to recreate it on a transparent or white background.
      
      OUTPUT JSON:
      {
        "analysisSummary": "Brief analysis of the packaging structure...",
        "layerPrompts": {
          "background": "Prompt for background texture...",
          "typography": "Prompt for text elements...",
          "graphics": "Prompt for graphical elements..."
        }
      }
    `;

    const config = {
        thinkingConfig: { thinkingBudget: 32768 }, // UPGRADE: Deep Deconstruction
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysisSummary: { type: Type.STRING },
            layerPrompts: {
              type: Type.OBJECT,
              properties: {
                background: { type: Type.STRING },
                typography: { type: Type.STRING },
                graphics: { type: Type.STRING }
              },
              required: ["background", "typography", "graphics"]
            }
          },
          required: ["analysisSummary", "layerPrompts"]
        }
    } as any;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
        config
      }),
      3,
      2000,
      model,
      () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: optImage.split(',')[1] } }] },
        config
      })
    );

    return JSON.parse(cleanJson(response.text || "{}"));
  });
};
