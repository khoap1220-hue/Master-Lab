
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { cleanJson } from "./utils";

export const researchProductTrends = async (
  userDescription: string,
  memoryInsight: MemoryInsight
): Promise<{ 
  visualPrompt: string; 
  trendsSummary: string; 
  sources: GroundingSource[];
  audienceProfile?: string;
  structuredBrief?: string; 
}> => {
  const ai = getAI();
  const primaryModel = "gemini-3.1-pro-preview"; 
  const backupModel = "gemini-3-flash-preview";
  
  const docTypeMatch = userDescription.match(/\[LOẠI TÀI LIỆU\]: ([\s\S]*?)(?=\n|$)/);
  const docType = docTypeMatch ? docTypeMatch[1].trim() : "Strategic Brief (FRD)";
  
  const instruction = `
    VAI TRÒ: CHUYÊN GIA PHÂN TÍCH SẢN PHẨM & KỸ SƯ SOẠN THẢO (SENIOR PRODUCT ANALYST).
    DỰ ÁN: Soạn thảo hồ sơ tài liệu chuyên sâu cho: "${userDescription}".
    LOẠI TÀI LIỆU: ${docType}
    
    NGÔN NGỮ: **TIẾNG VIỆT CHUYÊN NGÀNH**.
    
    YÊU CẦU NỘI DUNG TÀI LIỆU (structuredBrief):
    1. Phải trình bày theo định dạng Markdown chuyên nghiệp.
    2. Nếu là PRD/FRD: Phải có các mục: 
       # 1. Tổng quan Dự án
       # 2. Phân tích Đối tượng Mục tiêu (Persona)
       # 3. Tính năng Cốt lõi (Core Features) & USP
       # 4. Thông số Kỹ thuật (Technical Specs - CMF)
       # 5. Lộ trình Phát triển (Roadmap)
    3. TỰ ĐỘNG SÁNG TẠO (Hallucinate) các thông số logic nếu người dùng chưa cung cấp (VD: Kích thước, vật liệu, công nghệ chipset, tiêu chuẩn kháng nước...). Đừng để trống.
    
    YÊU CẦU MÔ TẢ THỊ GIÁC (fullVisualSpec):
    - Viết bằng TIẾNG ANH.
    - Mô tả cực kỳ chi tiết về kiểu dáng sản phẩm dựa trên các thông số kỹ thuật vừa soạn thảo.

    OUTPUT JSON FORMAT:
    {
      "fullVisualSpec": "English prompt for image generation...",
      "trendsSummary": "Concise summary of market trends in Vietnamese...",
      "structuredBrief": "Full Markdown documentation in Vietnamese (use # for headers, - for bullets)...",
      "audienceProfile": "Detailed UX profile in Vietnamese..."
    }
  `;

  const config = { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 32768 }, // UPGRADE: Deep reasoning
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullVisualSpec: { type: Type.STRING },
          trendsSummary: { type: Type.STRING },
          structuredBrief: { type: Type.STRING },
          audienceProfile: { type: Type.STRING }
        },
        required: ["fullVisualSpec", "trendsSummary", "structuredBrief", "audienceProfile"]
      }
  } as any;

  const performPrimary = () => ai.models.generateContent({
    model: primaryModel,
    contents: { parts: [{ text: instruction }] },
    config
  });

  const response = await callWithRetry<GenerateContentResponse>(
      performPrimary, 3, 2000, primaryModel, () => ai.models.generateContent({
          model: backupModel,
          contents: { parts: [{ text: instruction }] },
          config
      })
  );

  const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.web)
    .map(chunk => ({ title: chunk.web.title || "Nguồn dữ liệu thực tế", uri: chunk.web.uri || "#" })) || [];

  const data = JSON.parse(cleanJson(response.text || "{}"));

  return {
    visualPrompt: data.fullVisualSpec || userDescription,
    trendsSummary: data.trendsSummary || "Phân tích hoàn tất.",
    structuredBrief: data.structuredBrief,
    audienceProfile: data.audienceProfile,
    sources
  };
};
