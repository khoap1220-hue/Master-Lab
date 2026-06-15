
import { GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { MemoryInsight, GroundingSource, ScenarioCategory } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { cleanJson } from "./utils";
import { SMART_INFERENCE_PROTOCOL, getOutputFormatRules } from "../prompts";
import { MODELS } from "../../config/models";

export const deepResearchPrompt = async (
  rawGoal: string,
  category: ScenarioCategory,
  brandInfo?: { color: string, vibe: string }
): Promise<string> => {
  const ai = getAI();
  const formatRules = getOutputFormatRules(category);
  const instruction = `
    VAI TRÒ: CHUYÊN GIA PHÂN TÍCH & KỸ SƯ PROMPT (DEEP RESEARCHER & MASTER PROMPT ENGINEER).
    NHIỆM VỤ: Phân tích ý tưởng thô của người dùng và viết lại thành một prompt chi tiết, tối ưu nhất cho AI tạo ảnh/thiết kế (Midjourney/Gemini Image style).
    
    Ý TƯỞNG THÔ: "${rawGoal}"
    DANH MỤC (CATEGORY): ${category}
    ${brandInfo ? `BRANDING: Màu chủ đạo ${brandInfo.color}, Phong cách ${brandInfo.vibe}` : ''}
    
    QUY TẮC ĐỊNH DẠNG ĐẦU RA (DỰA TRÊN CATEGORY):
    ${formatRules}
    
    YÊU CẦU:
    1. Phân tích sâu ý tưởng, bổ sung các chi tiết nghệ thuật, kỹ thuật, ánh sáng, bố cục, vật liệu phù hợp với Category và Quy tắc định dạng ở trên.
    2. Nếu có thông tin Branding, hãy tích hợp khéo léo vào thiết kế (ví dụ: áp dụng màu sắc vào điểm nhấn, phong cách vào tổng thể).
    3. Trả về DUY NHẤT prompt tiếng Anh đã được viết lại, KHÔNG giải thích, KHÔNG thêm định dạng JSON.
    4. Prompt phải tuân thủ cấu trúc: [SUBJECT] + [ENVIRONMENT/CONTEXT] + [LIGHTING] + [CAMERA/LENS/ANGLE] + [STYLE/MEDIUM] + [COLOR GRADING] + [TECHNICAL DETAILS].
    5. Sử dụng các từ khóa chuyên ngành nhiếp ảnh/thiết kế (VD: "volumetric lighting", "octane render", "macro photography", "shallow depth of field").
    6. Đảm bảo prompt có độ chi tiết cực cao, mô tả rõ ràng chất liệu, bề mặt và các yếu tố vật lý.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model: MODELS.TEXT_PRIMARY,
        contents: { parts: [{ text: instruction }] },
        config: { 
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction: "You are a Master Prompt Engineer. Your goal is to expand simple ideas into hyper-detailed, professional visual prompts."
        }
      }),
      2, 1000, MODELS.TEXT_PRIMARY
    );
    return response.text?.trim() || rawGoal;
  } catch (e) {
    console.error("Deep Research failed:", e);
    return rawGoal;
  }
};

export const researchProductTrends = async (
  userDescription: string,
  memoryInsight: MemoryInsight,
  category: ScenarioCategory = 'Product Design'
): Promise<{ 
  visualPrompt: string; 
  trendsSummary: string; 
  sources: GroundingSource[];
  audienceProfile?: string;
  structuredBrief?: string; 
  modelUsed?: string;
}> => {
  const ai = getAI();
  const primaryModel = MODELS.TEXT_PRIMARY; 
  const backupModel = MODELS.TEXT_FAST;
  
  const docTypeMatch = userDescription.match(/\[LOẠI TÀI LIỆU\]: ([\s\S]*?)(?=\n|$)/);
  const docType = docTypeMatch ? docTypeMatch[1].trim() : (category === 'Product Document' ? "Technical PRD/FRD" : "Strategic Brief (FRD)");
  
  const formatRules = getOutputFormatRules(category);
  const instruction = `
    VAI TRÒ: CHUYÊN GIA PHÂN TÍCH SẢN PHẨM & KỸ SƯ SOẠN THẢO (SENIOR PRODUCT ANALYST).
    DỰ ÁN: Soạn thảo hồ sơ tài liệu chuyên sâu cho: "${userDescription}".
    LOẠI TÀI LIỆU: ${docType}
    CATEGORY: ${category}
    
    ${SMART_INFERENCE_PROTOCOL}
    
    NGÔN NGỮ: **TIẾNG VIỆT CHUYÊN NGÀNH**.
    
    YÊU CẦU NỘI DUNG TÀI LIỆU (structuredBrief):
    1. Phải trình bày theo định dạng Markdown chuyên nghiệp.
    2. Nếu là PRD/FRD (Product Document): Phải có các mục: 
       # 1. Tổng quan Dự án (Project Overview)
       # 2. Phân tích Đối tượng Mục tiêu (Target Audience & Persona)
       # 3. Tính năng Cốt lõi (Core Features) & USP
       # 4. Thông số Kỹ thuật (Technical Specs - CMF, Dimensions, Tech Stack)
       # 5. Lộ trình Phát triển (Development Roadmap)
       # 6. Rủi ro & Giả định (Risks & Assumptions)
    3. TỰ ĐỘNG SÁNG TẠO (Hallucinate) các thông số logic nếu người dùng chưa cung cấp (VD: Kích thước, vật liệu, công nghệ chipset, tiêu chuẩn kháng nước...). Đừng để trống.
    4. Đảm bảo văn phong chuyên nghiệp, mạch lạc, sử dụng đúng thuật ngữ chuyên ngành.
    
    QUY TẮC ĐỊNH DẠNG HÌNH ẢNH (DỰA TRÊN CATEGORY):
    ${formatRules}
    
    YÊU CẦU MÔ TẢ THỊ GIÁC (fullVisualSpec):
    - Viết bằng TIẾNG ANH.
    - Mô tả cực kỳ chi tiết về kiểu dáng sản phẩm dựa trên các thông số kỹ thuật vừa soạn thảo và tuân thủ chặt chẽ QUY TẮC ĐỊNH DẠNG HÌNH ẢNH ở trên.
    - Nếu là Tài liệu (Product Document), hãy mô tả bìa tài liệu hoặc sơ đồ kiến trúc hệ thống.
    - Tuân thủ cấu trúc prompt tạo ảnh: [SUBJECT] + [ENVIRONMENT/CONTEXT] + [LIGHTING] + [CAMERA/LENS/ANGLE] + [STYLE/MEDIUM] + [COLOR GRADING] + [TECHNICAL DETAILS].

    OUTPUT JSON FORMAT:
    {
      "fullVisualSpec": "Detailed English prompt for image generation...",
      "trendsSummary": "Concise summary of market trends in Vietnamese...",
      "structuredBrief": "Full Markdown documentation in Vietnamese (use # for headers, - for bullets)...",
      "audienceProfile": "Detailed UX profile in Vietnamese..."
    }
  `;

  const config = { 
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }, // UPGRADE: Deep reasoning
      systemInstruction: "You are a Senior Product Analyst and Document Strategist. Your output must be professional, data-driven, and hyper-detailed."
  };

  // Safe config for backup models (remove thinking budget to avoid errors/overload)
  const { thinkingConfig, ...safeConfig } = config;

  const performPrimary = () => ai.models.generateContent({
    model: primaryModel,
    contents: { parts: [{ text: instruction }] },
    config: {
      ...config,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } // Use HIGH thinking for primary
    }
  });

  const performBackup = () => ai.models.generateContent({
      model: backupModel,
      contents: { parts: [{ text: instruction }] },
      config: {
        ...safeConfig,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } // Use LOW thinking for backup
      }
  });

  const performEmergency = () => ai.models.generateContent({
      model: MODELS.TEXT_FAST,
      contents: { parts: [{ text: instruction }] },
      config: safeConfig // No thinking for emergency
  });

  let usedModel: string = primaryModel;
  const response = await callWithRetry<GenerateContentResponse>(
      performPrimary, 2, 1000, primaryModel, [performBackup, performEmergency], 600000, false, (m) => usedModel = m
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
    sources,
    modelUsed: usedModel
  };
};
