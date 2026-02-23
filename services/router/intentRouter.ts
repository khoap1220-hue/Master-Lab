
import { Type } from "@google/genai";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor";
import { cleanJson } from "../orchestrator/utils";
import { ScenarioCategory } from "../../types";

export interface NeuralIntent {
  intent: 'EDIT' | 'CREATE' | 'CHAT' | 'DOCUMENT' | 'STRATEGY' | 'BATCH';
  confidence: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  taskType: string;
  reasoning: string;
  targetCategory?: ScenarioCategory; // NEW: Suggested Category
  protocol: {
    recommendedModel: 'gemini-3.1-pro-preview' | 'gemini-3-flash-preview' | 'gemini-2.5-flash-image';
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
    const model = "gemini-3-flash-preview";

    const prompt = `
      [SYSTEM ROLE: NEURAL DISPATCHER v9.2]
      TASK: Analyze the user request and route it to the correct Specialist Agent and Category.
      
      INPUT: "${text.substring(0, 1000)}"
      
      AVAILABLE CATEGORIES (Domain Context):
      - Signage: Billboards, shop fronts, neon signs, outdoor ads.
      - Packaging: Boxes, labels, bottles, stickers, unboxing.
      - Floor Plan: Architectural layouts, blueprints, 2D technical drawings.
      - Real Estate: Interior design, room staging, renovations, exterior renders.
      - Fashion: Clothing, tech packs, fashion sketches, fabrics.
      - Logo Design: Icons, brand marks, symbols, monograms.
      - UX/UI Design: Apps, websites, dashboards, screens, wireframes.
      - Marketing & Ads: Social posts, banners, campaigns, sales content.
      - Print Design: Flyers, brochures, menus, books, magazines.
      - Product Design: Industrial design, gadgets, furniture, 3D objects (Physical items).
      - Product Document: PRD, specs, manuals, documentation writing, specifications (TEXT HEAVY).
      - SOP Management: Flowcharts, diagrams, process maps, organizational charts, standard operating procedures (VISUAL DIAGRAMS).
      - Product Photography: Studio shoots, lighting setup, camera angles.
      - Multimedia: Video scripts, storyboards, cinematic shots, film direction.
      - Style Transfer: Art style conversion, painting effects, artistic filters.
      - Creative Studio: General art, illustration, editing, removal, magic.

      INTENTS:
      - CREATE: Generate new visual/concept from scratch.
      - EDIT: Modify existing image (change color, remove object).
      - STRATEGY: Planning, consulting, ideas (no image yet).
      - DOCUMENT: Writing long text/specs.
      - CHAT: General conversation.

      OUTPUT JSON:
      {
        "intent": "STRATEGY" | "CREATE" | "EDIT" | "DOCUMENT" | "CHAT",
        "targetCategory": "One of the Categories above (or 'Creative Studio' if generic)",
        "confidence": 0.0 to 1.0,
        "complexity": "LOW" | "MEDIUM" | "HIGH",
        "reasoning": "Why this category?",
        "protocol": {
            "recommendedModel": "gemini-3.1-pro-preview" (for logic) or "gemini-2.5-flash-image" (for visual),
            "primaryAgent": "Name of agent (e.g. Architect, PixelSmith)",
            "requiresVision": boolean
        }
      }
    `;

    try {
      const response = await callWithRetry<any>(
        () => ai.models.generateContent({
          model,
          contents: { parts: [{ text: prompt }] },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                intent: { type: Type.STRING },
                targetCategory: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                complexity: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                protocol: {
                    type: Type.OBJECT,
                    properties: {
                        recommendedModel: { type: Type.STRING },
                        primaryAgent: { type: Type.STRING },
                        requiresVision: { type: Type.BOOLEAN }
                    }
                }
              },
              required: ["intent", "targetCategory", "protocol"]
            }
          }
        }),
        2, 1000, "Intent-Router"
      );

      const result = JSON.parse(cleanJson(response.text || "{}"));
      
      // Fallback for missing category
      if (!result.targetCategory) result.targetCategory = 'Creative Studio';
      
      // Normalization
      if (result.targetCategory === 'Product Photography') result.targetCategory = 'Product Design';

      return result;
    } catch (e) {
      // HEURISTIC FALLBACK (If Neural Router fails)
      const lowerText = text.toLowerCase();
      let fallbackCategory: ScenarioCategory = 'Creative Studio';
      
      if (lowerText.includes('logo')) fallbackCategory = 'Logo Design';
      else if (lowerText.includes('app') || lowerText.includes('web') || lowerText.includes('ui')) fallbackCategory = 'UX/UI Design';
      else if (lowerText.includes('bao bì') || lowerText.includes('hộp')) fallbackCategory = 'Packaging';
      else if (lowerText.includes('nội thất') || lowerText.includes('phòng')) fallbackCategory = 'Real Estate';
      else if (lowerText.includes('video') || lowerText.includes('phim')) fallbackCategory = 'Multimedia';

      return { 
        intent: 'CHAT', 
        targetCategory: fallbackCategory,
        confidence: 0.5, 
        complexity: 'LOW', 
        taskType: 'GENERAL', 
        reasoning: 'Fallback due to error',
        protocol: { recommendedModel: 'gemini-3-flash-preview', primaryAgent: 'ChatBot', requiresVision: false }
      };
    }
  });
};
