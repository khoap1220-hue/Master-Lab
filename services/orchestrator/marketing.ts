
import { GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "./utils";
import { MODELS } from "../../config/models";

const SPELLING_ENFORCER = `
  *** QUY TẮC CHÍNH TẢ & NGÔN NGỮ (BẮT BUỘC) ***
  - Phải sử dụng tiếng Việt chuẩn xác 100%.
  - Kiểm tra kỹ các từ dễ sai (VD: "xử lý", "trình bày", "chuyên nghiệp").
  - Văn phong Marketing: Cuốn hút nhưng phải giữ đúng quy chuẩn ngữ pháp.
`;

import { ThinkingLevel } from '@google/genai';

/**
 * Marketing Campaign Strategy (Deep Thinking)
 */
export const planMarketingCampaign = async (
  goal: string,
  targetChannels: string
): Promise<{
  visualPrompt: string;
  structuredBrief?: string;
  sources: GroundingSource[];
}> => {
  return executeManagedTask('STRATEGY_PLANNING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_PRIMARY;
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: GIÁM ĐỐC MARKETING (CMO).
      ${SPELLING_ENFORCER}
      INPUT:
      - Mục tiêu chiến dịch: "${goal}"
      - Kênh triển khai: "${targetChannels}"
      
      NHIỆM VỤ: Lên kế hoạch nội dung và hình ảnh chủ đạo (Key Visual).
      
      OUTPUT FORMAT (JSON):
      {
        "visualPrompt": "High-conversion ad creative prompt (AIDA framework). Focus on stopping power...",
        "structuredBrief": "Markdown Content describing: 1. Big Idea, 2. Message House (Key Message), 3. Channel Strategy..."
      }
    `;

    const config = {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }, // UPGRADE: Deep Strategy
        responseMimeType: "application/json"
    };

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config
      }),
      2,
      1000,
      model,
      [() => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] },
        config
      })]
    );

    const data = JSON.parse(cleanJson(response.text || "{}"));

    return {
      visualPrompt: data.visualPrompt,
      structuredBrief: data.structuredBrief,
      sources: []
    };
  });
};

/**
 * Generate Marketing Specs (Media Plan / Copy)
 */
export const generateMarketingSpecs = async (
  campaignContext: string
): Promise<string> => {
  return executeManagedTask('REPORTING', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST; 
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      VAI TRÒ: DIGITAL MARKETER & COPYWRITER.
      ${SPELLING_ENFORCER}
      NHIỆM VỤ: Viết nội dung quảng cáo chi tiết cho: "${campaignContext}".
      
      YÊU CẦU ĐẦU RA (MARKDOWN TIẾNG VIỆT):
      
      1. **ADS COPY (Facebook/Instagram):**
         - Headline (Gây chú ý).
         - Body text (Lợi ích + Cảm xúc).
         - CTA (Kêu gọi hành động).
      
      2. **THÔNG SỐ KỸ THUẬT ẢNH/VIDEO:**
         - Tỷ lệ khung hình khuyên dùng.
         - Text overlay rule (20% text).
      
      3. **TARGETING SUGGESTION:**
         - Độ tuổi, Sở thích, Hành vi nên nhắm tới.
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } }),
      2,
      1000,
      model,
      [() => ai.models.generateContent({ model: backupModel, contents: { parts: [{ text: prompt }] } })]
    );

    return response.text || "Đã lập kế hoạch content.";
  });
};
