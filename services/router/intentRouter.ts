

import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "../orchestrator/utils";
import { ScenarioCategory } from "../../types";
import { MODELS } from "../../config/models";

export interface NeuralIntent {
  intent: 'EDIT' | 'CREATE' | 'CHAT' | 'DOCUMENT' | 'STRATEGY' | 'BATCH';
  confidence: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  taskType: string;
  reasoning: string;
  targetCategory?: ScenarioCategory; // NEW: Suggested Category
  resolution?: '1K' | '2K' | '4K';
  userPsychology?: {
      emotionalState: string; // e.g., "Urgent", "Frustrated", "Excited", "Confused"
      coreDesire: string; // The underlying unstated need
  };
  protocol: {
    recommendedModel: string;
    primaryAgent: string;
    requiresVision: boolean;
  };
}

/**
 * [V9.2] INTELLIGENT DISPATCHER
 * Analyzes intent AND Domain Category to route to the correct Specialist Agent.
 */
export const classifyNeuralIntent = async (text: string): Promise<NeuralIntent> => {
  return executeManagedTask('ANALYSIS_FAST', async () => {
    const ai = getAI();
    const model = MODELS.TEXT_FAST;

    const prompt = `
      [SYSTEM ROLE: NEURAL DISPATCHER v9.5]
      TASK: Analyze the user request and route it to the correct Specialist Agent and Category with high precision.
      
      INPUT: "${(text || "").substring(0, 1000)}"
      
      CATEGORIES:
      - E-commerce: Product photos, banners, lifestyle.
      - Social Media: Viral posts, thumbnails, ads.
      - Event/Wedding: Invitations, menus, boards.
      - Food/Beverage: Culinary styling, menus.
      - Enterprise: Reports, company profiles, pitch decks.
      - Signage: Billboards, neon, outdoor.
      - Packaging: Boxes, labels, unboxing.
      - Floor Plan: 2D technical drawings.
      - Real Estate: Interior/Exterior renders, staging.
      - Fashion: Clothing, tech packs, sketches.
      - Logo Design: Icons, marks, symbols.
      - UX/UI Design: Apps, websites, dashboards.
      - Marketing/Ads: Campaigns, sales content.
      - Print Design: Flyers, brochures, magazines.
      - Product Design: Industrial/Physical items.
      - Document: PRD, specs, manuals (TEXT HEAVY).
      - SOP: Flowcharts, process maps (DIAGRAMS).
      - Multimedia: Scripts, storyboards, cinematic.
      - Cinematic Video: High-end film production.
      - Style Transfer: Art style conversion.
      - Character Design: Game characters, mascots.
      - 3D Rendering: High-end visuals (Octane/Unreal).
      - Vector Art: Flat/Isometric graphics.
      - Creative Studio: General art, illustration, magic.

      INTENTS:
      - CREATE: New visual/concept.
      - EDIT: Modify existing image.
      - STRATEGY: Planning, consulting, ideas.
      - DOCUMENT: Writing long text/specs.
      - CHAT: General conversation.

      - resolution: Detect if user explicitly asks for "2K", "4K", "High Res", "Ultra HD", "1K", etc.
      
      OUTPUT JSON ONLY:
      {
        "intent": "STRATEGY" | "CREATE" | "EDIT" | "DOCUMENT" | "CHAT",
        "targetCategory": "Category Name",
        "resolution": "1K" | "2K" | "4K" | null,
        "confidence": 0.0-1.0,
        "complexity": "LOW" | "MEDIUM" | "HIGH",
        "reasoning": "Brief explanation",
        "userPsychology": { "emotionalState": "Vietnamese", "coreDesire": "Vietnamese" },
        "protocol": { "recommendedModel": "Model Name", "primaryAgent": "Agent Name", "requiresVision": boolean }
      }
    `;

    try {
      const response = await callWithRetry<any>(
        () => ai.models.generateContent({
          model,
          contents: { parts: [{ text: prompt }] },
          config: {
            responseMimeType: "application/json"
          }
        }),
        2, 1000, "Intent-Router",
        [] // Empty array for no fallbacks
      );

      const result = JSON.parse(cleanJson(response.text || "{}"));
      
      // Fallback for missing category
      if (!result.targetCategory) result.targetCategory = 'Creative Studio';
      
      // Normalization
      if (result.targetCategory === 'Product Photography') result.targetCategory = 'Product Design';

      return result;
    } catch (e: any) {
      if (e.message && e.message.includes('403')) throw e;
      // HEURISTIC FALLBACK (If Neural Router fails)
      const lowerText = text.toLowerCase();
      let fallbackCategory: ScenarioCategory = 'Creative Studio';
      
      if (lowerText.includes('logo')) fallbackCategory = 'Logo Design';
      else if (lowerText.includes('app icon') || lowerText.includes('biểu tượng')) fallbackCategory = 'App Icon Design';
      else if (lowerText.includes('app') || lowerText.includes('web') || lowerText.includes('ui')) fallbackCategory = 'UX/UI Design';
      else if (lowerText.includes('bao bì') || lowerText.includes('hộp')) fallbackCategory = 'Packaging';
      else if (lowerText.includes('nội thất') || lowerText.includes('phòng')) fallbackCategory = 'Interior Design';
      else if (lowerText.includes('video') || lowerText.includes('phim')) fallbackCategory = 'Cinematic Video';
      else if (lowerText.includes('nhân vật') || lowerText.includes('character')) fallbackCategory = 'Character Design';
      else if (lowerText.includes('3d') || lowerText.includes('render')) fallbackCategory = '3D Rendering';
      else if (lowerText.includes('vector') || lowerText.includes('minh họa')) fallbackCategory = 'Vector Art';
      else if (lowerText.includes('shopee') || lowerText.includes('amazon') || lowerText.includes('sản phẩm')) fallbackCategory = 'E-commerce';
      else if (lowerText.includes('social') || lowerText.includes('facebook') || lowerText.includes('instagram') || lowerText.includes('tiktok')) fallbackCategory = 'Social Media';
      else if (lowerText.includes('cưới') || lowerText.includes('sự kiện') || lowerText.includes('event')) fallbackCategory = 'Event & Wedding';
      else if (lowerText.includes('món ăn') || lowerText.includes('food') || lowerText.includes('nhà hàng')) fallbackCategory = 'Food & Beverage';
      else if (lowerText.includes('báo cáo') || lowerText.includes('doanh nghiệp') || lowerText.includes('profile')) fallbackCategory = 'Enterprise';
      else if (lowerText.includes('quy trình') || lowerText.includes('sop') || lowerText.includes('flowchart')) fallbackCategory = 'SOP Management';
      else if (lowerText.includes('thời trang') || lowerText.includes('quần áo') || lowerText.includes('váy') || lowerText.includes('fashion')) fallbackCategory = 'Fashion';

      return { 
        intent: 'CHAT', 
        targetCategory: fallbackCategory,
        confidence: 0.5, 
        complexity: 'LOW', 
        taskType: 'GENERAL', 
        reasoning: 'Fallback due to error',
        protocol: { recommendedModel: MODELS.TEXT_FAST, primaryAgent: 'ChatBot', requiresVision: false }
      };
    }
  });
};
