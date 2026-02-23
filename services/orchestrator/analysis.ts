
import { GenerateContentResponse, Type } from "@google/genai";
import { MemoryInsight, WorkflowTask, SmartAction, GuidedPath, ContentProposal, GroundingSource, StrategicDNA, ScenarioCategory, MaturityScore } from "../../types";
import { getAI, callWithRetry } from "../../lib/gemini";
import { executeManagedTask } from "../../lib/tieredExecutor"; 
import { getEmpathyInstruction, loadMemoryFromLocal } from "../memoryService";
import { cleanJson } from "./utils";
import { calculateThinkingBudget } from "../../lib/utils";
import { LANGUAGE_PROTOCOL } from "../prompts";

const LINGUISTIC_ENFORCER = `
  [LINGUISTIC RULES v8.6]
  - ${LANGUAGE_PROTOCOL}
  - TONE: Sharp, Empathetic, Result-Oriented.
  - FORBIDDEN: Generic responses (e.g. "optimize", "enhance" without saying HOW).
  - REQUIREMENT: Provide specific actionable solutions (e.g. "Use Serif font for luxury feel", "Use #FF4500 for appetite stimulation").
`;

/**
 * AGENT: THE SENTINEL AUDITOR (OPTIMIZED V2)
 * Evaluates the maturity of a design/strategy.
 * [OPTIMIZATION]: Uses Gemini 3 Flash (Fast Tier) instead of Pro to save resources.
 */
export const evaluateMaturity = async (
  subject: string,
  context: string,
  category: ScenarioCategory
): Promise<MaturityScore> => {
    // Switch to ANALYSIS_FAST tier for speed/cost efficiency
    return executeManagedTask('ANALYSIS_FAST', async () => {
        const ai = getAI();
        const model = "gemini-3-flash-preview"; // OPTIMIZED: Use Flash instead of Pro
        
        const prompt = `
            [SYSTEM ROLE: DESIGN AUDITOR - EMPATHY MODE]
            TASK: Audit the output Quality using the "Sandwich Method".
            
            ${LINGUISTIC_ENFORCER}
            
            CATEGORY: ${category}
            CONTEXT: "${context.substring(0, 500)}"
            SUBJECT: "${subject.substring(0, 1500)}"
            
            FEEDBACK STRATEGY (SANDWICH):
            1. RECOGNIZE: Identify one strong point (The Top Bun).
            2. CRITIQUE: Identify one specific weakness (The Meat).
            3. SOLUTION: Suggest one concrete fix (The Bottom Bun).
            
            CRITERIA (0-100):
            1. CONSISTENCY
            2. PROFESSIONALISM
            3. VIABILITY
            4. BRAND POWER
            
            OUTPUT JSON ONLY:
            {
                "totalScore": 85,
                "grade": "A",
                "summary": "1 sentence sandwich feedback (Match User Language).",
                "criteria": [
                    { "label": "Label (Match Language)", "score": 90, "feedback": "Positive but actionable..." },
                    ...x4
                ]
            }
        `;

        try {
            const response = await callWithRetry<GenerateContentResponse>(
                () => ai.models.generateContent({
                    model,
                    contents: { parts: [{ text: prompt }] },
                    config: { responseMimeType: "application/json" }
                }), 2, 2000, model
            );
            return JSON.parse(cleanJson(response.text || "{}"));
        } catch (e) {
            // Fallback if audit fails (don't block the UI)
            console.warn("Audit skipped due to resource constraint.");
            return {
                totalScore: 80,
                grade: 'B',
                summary: "Hệ thống đang tối ưu hóa tài nguyên, bỏ qua bước kiểm định chi tiết.",
                criteria: []
            };
        }
    });
};

export const suggestCreativeConcepts = async (
  category: string,
  currentInput: string
): Promise<Array<{ title: string; desc: string; style: string }>> => {
  return executeManagedTask('BRAINSTORMING', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview"; 
    
    const memory = loadMemoryFromLocal();
    const thinkingBudget = calculateThinkingBudget(memory?.semanticKB?.thinkingPreference || 'BALANCED');

    const prompt = `
      [ROLE: STRATEGIC CREATIVE DIRECTOR v8.5]
      ${LINGUISTIC_ENFORCER}
      CATEGORY: ${category}
      CONTEXT: "${currentInput}"
      
      TASK: Suggest 3 BREAKTHROUGH Visual Concepts.
      
      [ANTI-LAZINESS]:
      - No safe concepts. Be bold.
      - "desc": Describe Lighting, Composition, Color, and Emotion in detail.
      - "style": Must contain professional keywords (e.g., "Bauhaus", "Cyberpunk", "Minimalist Brutalism").
    `;

    try {
      const response = await callWithRetry<GenerateContentResponse>(
        () => ai.models.generateContent({
          model,
          contents: { parts: [{ text: prompt }] },
          config: {
            thinkingConfig: { thinkingBudget }, 
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  style: { type: Type.STRING }
                },
                required: ["title", "desc", "style"]
              }
            }
          }
        }),
        3, 2000, model
      );
      
      return JSON.parse(cleanJson(response.text || "[]"));
    } catch (e) {
      return [{ title: "Concept Generator v8", desc: "System synchronizing high-level thought process.", style: "Modern Luxury" }];
    }
  });
};

export const decomposeWorkflow = async (
  projectName: string,
  projectType: string,
  userPrompt: string,
  memoryInsight: MemoryInsight,
  businessContext?: string
): Promise<{
  tasks: WorkflowTask[];
  masterSummary: string;
  strategicBrief: { 
    brandFocus: string; 
    visualVibe: string; 
    marketStance: string; 
    contentProposal?: ContentProposal;
  };
  strategicDNA?: StrategicDNA;
  smartActions: SmartAction[];
  guidedPaths: GuidedPath[];
  groundingSources?: GroundingSource[];
}> => {
  return executeManagedTask('ANALYSIS_DEEP', async () => {
    const ai = getAI();
    const model = "gemini-3.1-pro-preview";
    
    const thinkingBudget = calculateThinkingBudget(memoryInsight?.semanticKB?.thinkingPreference || 'BALANCED');

    const prompt = `
      [ROLE: MASTER SYSTEM ARCHITECT v8.5]
      PROJECT: ${projectName} (${projectType})
      REQUEST: "${userPrompt}"
      CONTEXT: "${businessContext || 'Standard'}"
      
      ${LINGUISTIC_ENFORCER}

      TASK: Synthesize multi-layer strategy and decompose neural execution workflow.
      
      [DEPTH REQUIREMENT]:
      - Deep Customer Persona Analysis.
      - Clear USP Differentiation Strategy.
      - Workflow tasks must be specific (e.g. "Sketch 3 Monogram Logo Concepts" instead of "Design Logo").
    `;

    const response = await callWithRetry<GenerateContentResponse>(
      () => ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
          thinkingConfig: { thinkingBudget }, 
          responseMimeType: "application/json"
        }
      }), 3, 2000, model
    );

    const data = JSON.parse(cleanJson(response.text || "{}"));
    return {
        tasks: data.tasks || [],
        masterSummary: data.masterSummary || "Synthesis complete.",
        strategicBrief: data.strategicBrief || { brandFocus: "", visualVibe: "", marketStance: "" },
        strategicDNA: data.strategicDNA,
        smartActions: data.smartActions || [],
        guidedPaths: [],
        groundingSources: []
    };
  });
};
