
import { GenerateContentResponse } from "@google/genai";
import { MemoryInsight } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { cleanJson } from "./utils";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { calculateThinkingBudget } from "../../lib/utils";
import { loadMemoryFromLocal } from "../memoryService"; // Helper to get current settings
import { MODELS } from "../../config/models";

import { SMART_INFERENCE_PROTOCOL } from "../prompts";

export const generateSpecificBrandContent = async (
  itemType: string,
  generalGoal: string,
  memoryInsight: MemoryInsight
): Promise<{ 
  headline: string; 
  slogan: string; 
  bodyText: string; 
  visualNotes: string; 
  brandName: string; 
  logoVisual: string; 
}> => {
  const ai = getAI();
  const model = MODELS.TEXT_FAST; // Optimized for speed and tokens
  const backupModel = MODELS.TEXT_PRIMARY;

  const prompt = `
    ROLE: BRAND COPYWRITER & CREATIVE DIRECTOR.
    TASK: Generate specific, high-quality text content AND BRAND IDENTITY SPECS for a design asset.
    ASSET TYPE: ${itemType} (e.g. Namecard, Poster, Flyer).
    BRAND GOAL: "${generalGoal}"

    INSTRUCTION:
    1. BRAND NAME: Extract the exact Brand Name from the goal. If none exists, INVENT a cool, relevant name matching the vibe.
    2. LOGO CONCEPT: Describe a visual logo symbol/icon that represents this brand (e.g. "A minimalist geometric fox head", "Interlocking circle monogram").
    3. COPYWRITING: Invent professional Headline, Slogan, and Body Text suitable for the ${itemType}.
    4. TONE & VOICE: Ensure the copywriting matches the implied industry and target audience of the brand goal.
    5. VISUAL NOTES: Provide specific, actionable layout advice (e.g., "Place headline top-left, large bold sans-serif. Logo centered at bottom.").

    OUTPUT JSON ONLY:
    {
      "brandName": "The Brand Name",
      "logoVisual": "A concise description of the logo graphic symbol",
      "headline": "Main text to appear on design",
      "slogan": "Tagline or secondary text",
      "bodyText": "Additional content/details/contact info",
      "visualNotes": "Brief advice on layout for this text"
    }
  `;

  const config = {
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

  return JSON.parse(cleanJson(response.text || "{}"));
};

// STEP 1: INITIALIZE SKELETON (HEAVY THINKING)
export const initializeBrandBibleProject = async (
  userGoal: string,
  targetPageCount: number = 40,
  usagePurpose: string = "Standard Brand Documentation"
): Promise<{
  brandOverview: string;
  visualSystem: string;
  pageStructure: string[]; // List of titles
}> => {
  const ai = getAI();
  const model = MODELS.TEXT_PRIMARY;
  const backupModel = MODELS.TEXT_FAST;
  
  // Get Thinking Preference
  const memory = loadMemoryFromLocal();
  const thinkingLevel = calculateThinkingBudget(memory?.semanticKB?.thinkingPreference || 'BALANCED');

  const prompt = `
    ROLE: BRAND STRATEGIST ORCHESTRATOR.
    TASK: Initialize the Strategic Foundation and Table of Contents for a ${targetPageCount}-PAGE BRAND BIBLE.
    INPUT: "${userGoal}"
    
    CONTEXT & PURPOSE: "${usagePurpose}"
    (Note: Adapt the tone, structure, and content focus based on this purpose. E.g., if 'Pitch Deck', focus on market viability. If 'Training', focus on rules.)

    ${SMART_INFERENCE_PROTOCOL}

    LANGUAGE REQUIREMENT:
    **CRITICAL**: Return "brandOverview" and "pageStructure" in VIETNAMESE (Tiếng Việt).
    "visualSystem" can be in English or Vietnamese (English preferred for image generation prompts).

    INSTRUCTION:
    1. Define the Core Brand Strategy (Overview) & Visual System (Vibe/Colors) tailored to the Usage Purpose.
    2. Outline a professional ${targetPageCount}-page Brand Guideline structure (Table of Contents) in VIETNAMESE.
    3. Ensure the structure logically covers Identity, Usage, Stationery, Merch, and Digital.
    4. The "visualSystem" MUST be highly descriptive, specifying exact color palettes (with hex codes if possible), typography styles, and overall aesthetic mood.
    
    OUTPUT JSON:
    {
      "brandOverview": "Summary of strategy tailored to usage (in Vietnamese)...",
      "visualSystem": "Visual DNA description (e.g., 'Minimalist Swiss design with #FF0000 accent, Helvetica Neue typography, high-contrast photography')...",
      "pageStructure": [
        "1. Trang bìa",
        "2. Mục lục",
        "3. Câu chuyện thương hiệu",
        ... (List exactly ${targetPageCount} titles in Vietnamese)
      ]
    }
  `;

  try {
    const config = {
        ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}), // SMART REGULATION APPLIED
        responseMimeType: "application/json"
    };

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config
      }),
      3,
      2000,
      model,
      [() => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] },
        config
      })]
    );

    const data = JSON.parse(cleanJson(response.text || "{}"));
    
    // Safety Ensure pageStructure is array
    const safeStructure = Array.isArray(data.pageStructure) ? data.pageStructure : [];
    
    // Auto-fill if missing pages
    if (safeStructure.length < targetPageCount) {
        for (let i = safeStructure.length; i < targetPageCount; i++) {
            safeStructure.push(`Trang ${i + 1}: Nội dung bổ sung`);
        }
    }

    return {
        brandOverview: data.brandOverview || "Chiến lược thương hiệu (Đang cập nhật)",
        visualSystem: data.visualSystem || "Hệ thống hình ảnh tiêu chuẩn",
        pageStructure: safeStructure
    };

  } catch (error: any) {
    console.error("Brand Bible Init Failed", error);
    if (error.message && error.message.includes('403')) throw error;
    // Fallback to prevent crash
    const fallbackStructure = [];
    for (let i = 0; i < targetPageCount; i++) fallbackStructure.push(`Trang ${i + 1}: Brand Asset`);
    
    return {
        brandOverview: "Chiến lược mặc định (Do hệ thống bận).",
        visualSystem: "Phong cách thiết kế hiện đại.",
        pageStructure: fallbackStructure
    };
  }
};

// STEP 2: GENERATE DETAIL PER PAGE (ON DEMAND)
export const generatePageContent = async (
  pageTitle: string,
  pageNumber: number,
  strategyContext: string,
  visualSystemContext: string
): Promise<{
  contentOutline: string;
  visualPrompt: string;
}> => {
  const ai = getAI();
  const model = MODELS.TEXT_FAST; // Use Flash for speed and token efficiency
  const backupModel = MODELS.TEXT_PRIMARY;

  const prompt = `
    ROLE: CORPORATE DOCUMENT DESIGNER & INFOGRAPHIC SPECIALIST.
    CONTEXT: Developing Page ${pageNumber}: "${pageTitle}" of a Brand Bible.
    STRATEGY: ${strategyContext}
    VISUAL DNA: ${visualSystemContext}
    
    LANGUAGE REQUIREMENT:
    **CRITICAL**: Return "contentOutline" in VIETNAMESE (Tiếng Việt).
    "visualPrompt" must be in ENGLISH for the image generator.

    TASK:
    1. Write the content outline for this specific page (What text/rules go here?) in VIETNAMESE.
    2. Create a stable image generation prompt to RENDER this page layout in ENGLISH.
    
    LAYOUT STYLE FOR VISUAL PROMPT:
    - If the page title suggests Text (e.g. "Operational Backbone", "Rules"), use: "A professional corporate document layout with clear headings, bullet points, and an infographic diagram."
    - If the page title suggests Diagram (e.g. "Deployment Plan", "Map"), use: "A high-quality infographic flowchart, structured blocks, icons, and connecting lines on a paper texture background."
    - The goal is to look like a PRINTED PAGE from a high-end manual. Use "Swiss Grid", "Clean Typography", "Golden Ratio".
    - Incorporate the VISUAL DNA (colors, mood) into the visual prompt to ensure brand consistency.
    
    OUTPUT JSON ONLY:
    {
      "contentOutline": "Bullet points of text content for this page (in Vietnamese)...",
      "visualPrompt": "A high-fidelity flat graphic design of a Brand Guideline page titled '${pageTitle}'. It features [specific layout details] and uses [colors/style from Visual DNA]..."
    }
  `;

  try {
    const config = {
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

    return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e: any) {
    console.error("Generate Page Content Failed", e);
    if (e.message && e.message.includes('403')) throw e;
    return {
        contentOutline: "Nội dung đang được cập nhật...",
        visualPrompt: "A professional brand guideline page design."
    };
  }
};

const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  'Branding': ['Logo Chính', 'Bảng màu', 'Font chữ', 'Danh thiếp', 'Phong bì', 'Tiêu đề thư', 'Kẹp file', 'Thẻ nhân viên', 'Đồng phục', 'Hồ sơ năng lực'],
  'Packaging': ['Hộp đựng sản phẩm', 'Túi giấy', 'Nhãn dán (Decal)', 'Thư cảm ơn', 'Giấy gói (Tissue)', 'Tem niêm phong', 'Hướng dẫn sử dụng', 'Thùng Carton'],
  'Marketing & Ads': ['Facebook Post', 'Instagram Story', 'Web Banner', 'Standee', 'Poster', 'Brochure', 'Voucher', 'Email Header'],
  'Real Estate': ['Mặt bằng 2D', 'Phối cảnh 3D', 'Virtual Tour', 'Brochure Dự án', 'Flyer', 'Bảng vật liệu', 'Video giới thiệu'],
  'default': ['Bảng kế hoạch', 'Tài liệu hướng dẫn', 'Danh sách kiểm tra', 'Báo cáo tổng quan', 'Kế hoạch hành động', 'Biểu đồ quy trình']
};

// UNIVERSAL MAGIC SUGGEST: Works for Branding, Packaging, UI/UX, etc.
export const suggestDeliverables = async (
  goal: string, 
  budgetTier: string = "Standard",
  category: string = "Branding"
): Promise<string[]> => {
  // Use Managed Task to prevent overload and queue requests
  return executeManagedTask('BRAINSTORMING', async () => {
    const ai = getAI();
    const primaryModel = MODELS.TEXT_FAST;
    const backupModel = MODELS.TEXT_FAST;

    const prompt = `
      ROLE: SENIOR CONSULTANT (Specializing in ${category}).
      INPUT GOAL: "${goal}"
      INVESTMENT TIER: "${budgetTier}" (Economy/Standard/Premium).
      
      TASK: Based on the specific description and INVESTMENT LEVEL in the Input Goal, suggest the TOP 12 most practical and aesthetic DELIVERABLES (Items/Assets) for this category.
      
      BUDGET LOGIC:
      - Economy: Focus on essentials (Logo, Card, Basic Label).
      - Standard: Full professional suite (Stationery, POSM, Social Kit).
      - Premium: High-end items (Hardcover Book, Merchandise, Interactive Web, VIP Gifts).

      CONTEXTUAL LOGIC FOR ${category}:
      - If "Packaging": Suggest boxes, labels, bags, stickers, wrapping paper specific to the product type.
      - If "Marketing": Suggest specific ad formats (FB Square, IG Story), POSM (Standee, Poster), Digital (Banner).
      - If "Real Estate": Suggest renders (Living room, Facade), technical drawings (Floor plan), VR tours.
      - If "UI/UX": Suggest screens (Home, Detail, Checkout), states (Empty, Error), components.
      - If "SOP Management": Suggest specific Flowcharts, Forms, Handbooks, Checklists relevant to the business.
      - If "Branding": Suggest Logo, Typography, Color Palette, Business Card, Letterhead, Envelope, Brand Guidelines.
      
      INSTRUCTION:
      - Return specific item names in Vietnamese.
      - Append a short note in parentheses if helpful, e.g., "Sơ đồ tổ chức (Org Chart)", "Thiệp mời (Giấy mỹ thuật)".
      - Ensure the suggestions are highly relevant to the specific INPUT GOAL (e.g., if the goal is a coffee shop, suggest coffee cups, aprons, menus).
      
      OUTPUT: A simple JSON array of strings.
    `;

    try {
      const config = {
        responseMimeType: "application/json"
      };

      const performPrimary = () => ai.models.generateContent({
        model: primaryModel,
        contents: { parts: [{ text: prompt }] },
        config
      });

      const performBackup = () => ai.models.generateContent({
        model: backupModel,
        contents: { parts: [{ text: prompt }] },
        config
      });

      const response = await callWithRetry<GenerateContentResponse>(
        performPrimary, 
        2, 
        1000, 
        primaryModel,
        [performBackup],
        30000 // 30s timeout for suggestions
      );

      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e: any) {
      console.warn("Magic suggest fallback triggered:", e);
      if (e.message && e.message.includes('403')) throw e;
      // Smart Fallback based on Category
      return FALLBACK_SUGGESTIONS[category] || FALLBACK_SUGGESTIONS['default'];
    }
  });
};

// Legacy stub for backward compatibility
export const generateBrandBibleStructure = async (userGoal: string) => {
  const data = await initializeBrandBibleProject(userGoal, 4, "General"); // Minimal fallback
  return {
    brandOverview: data.brandOverview,
    visualSystem: data.visualSystem,
    pages: data.pageStructure.slice(0, 4).map((title, i) => ({
      pageNumber: i + 1,
      title: title,
      contentSummary: "Generated via legacy path",
      visualType: 'hybrid' as const
    }))
  };
};
