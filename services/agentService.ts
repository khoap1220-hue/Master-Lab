
import { MemoryInsight, ScenarioCategory, SmartAction, ChatMessage } from '../types';
import * as orchestratorService from './orchestratorService';
import * as pixelService from './pixelService';
import { classifyNeuralIntent, NeuralIntent } from './router/intentRouter';

// Flows
import { executeChatFlow } from './flows/chatFlow';
import { executeFastEditFlow } from './flows/fastEditFlow';
import { executeProjectPlanningFlow } from './flows/projectFlow';

/**
 * [V8.2.1] Unified Ensemble Response Interface
 */
export interface EnsembleResponse {
    text: string;
    image?: string;
    sources?: any[];
    smartActions?: SmartAction[];
    structuredBrief?: string;
    audienceProfile?: string;
    batchResults?: Array<{ text: string; image?: string }>;
    strategicDNA?: any;
    meta?: {
        intent: string;
        agent: string;
        model: string;
    };
}

/**
 * LOGIC CORRECTION:
 * Only System Commands (starting with brackets) should bypass the Neural Router.
 * Natural language MUST go through the Router to detect the correct Domain Category.
 */
const isSystemCommand = (text: string) => {
  return text.trim().startsWith('[') && (text.includes(']:') || text.includes(']'));
};

export const executeResearchBasedProductDesign = async (
  text: string,
  memory: MemoryInsight,
  category: ScenarioCategory,
  refImages: string[] = [],
  history: ChatMessage[] = [] 
): Promise<EnsembleResponse> => {
  
  // ---------------------------------------------------------------------------
  // PHASE 1: SYSTEM COMMAND FAST LANE (Zero Latency)
  // Used for button clicks, smart actions, or internal redirects.
  // ---------------------------------------------------------------------------
  if (isSystemCommand(text)) {
      if (text.startsWith('[GENERATE_SPECS]:')) {
          const designContext = text.replace('[GENERATE_SPECS]:', '').trim();
          const result = await orchestratorService.generateTechnicalSpecs(category, designContext, memory);
          return {
              text: `## 📐 ${result.title}\n\n${result.content}`,
              meta: { intent: 'DOCUMENT', agent: 'TechnicalWriter', model: 'gemini-3.1-pro-preview' }
          };
      }
      if (text.startsWith('[EXECUTE_VISUAL]:') || text.startsWith('[MODE:')) {
          const res = await executeFastEditFlow(text, memory, category, refImages);
          return { ...res, meta: { intent: 'VISUAL', agent: 'PixelSmith', model: 'gemini-2.5-flash-image' } };
      }
  }

  // ---------------------------------------------------------------------------
  // PHASE 2: NEURAL ROUTING & AUTO-DISPATCH (The Brain)
  // Process natural language to find the BEST Category and Intent.
  // ---------------------------------------------------------------------------
  
  // 1. Analyze Intent & Category (using Gemini 3 Flash - Fast ~500ms)
  const neuralIntent = await classifyNeuralIntent(text);
  const protocol = neuralIntent.protocol;
  
  // 2. SMART AUTO-DISPATCH LOGIC:
  // If the Router detects a specific specialist category (e.g. 'Logo Design') with high confidence,
  // we override the current UI category. This fixes the "Drawing a logo in Creative Studio" bug.
  let effectiveCategory: ScenarioCategory = category;
  
  if (neuralIntent.targetCategory && 
      neuralIntent.targetCategory !== 'Creative Studio' && 
      neuralIntent.confidence > 0.65) { // Lowered threshold slightly for better responsiveness
      
      // Don't switch if we are already in a specialized mode that matches broadly
      const isAlreadySpecialized = category !== 'Creative Studio';
      
      if (!isAlreadySpecialized || (category !== neuralIntent.targetCategory)) {
          console.log(`[Auto-Dispatch] 🔀 Switching context: ${category} -> ${neuralIntent.targetCategory}`);
          effectiveCategory = neuralIntent.targetCategory;
      }
  }

  // ---------------------------------------------------------------------------
  // PHASE 3: EXECUTION BASED ON INTENT
  // ---------------------------------------------------------------------------

  // A. CHAT / CONSULTATION
  if (neuralIntent.intent === 'CHAT' && neuralIntent.confidence > 0.8) {
      const res = await executeChatFlow(text, history, memory);
      return { ...res, meta: { intent: 'CHAT', agent: 'CreativeStrategist', model: 'gemini-3.1-pro-preview' } };
  }

  // B. STRATEGY / DOCUMENTATION (Deep Work)
  if (neuralIntent.intent === 'DOCUMENT' || neuralIntent.intent === 'STRATEGY') {
      const res = await executeProjectPlanningFlow(text, memory, effectiveCategory);
      return { ...res, meta: { intent: neuralIntent.intent, agent: protocol.primaryAgent, model: protocol.recommendedModel } };
  }

  // C. COMPLEX CREATION (Planning First)
  // If the category requires engineering (Packaging, Architecture), we PLAN before we DRAW.
  const isDeepCategory = ['Packaging', 'Signage', 'Real Estate', 'Floor Plan', 'UX/UI Design', 'Fashion'].includes(effectiveCategory);
  const shouldPlan = neuralIntent.complexity === 'HIGH' || (isDeepCategory && neuralIntent.intent === 'CREATE' && !refImages.length);

  if (shouldPlan) {
      const res = await executeProjectPlanningFlow(text, memory, effectiveCategory);
      return { ...res, meta: { intent: 'PLANNING', agent: 'StrategicCounsel', model: protocol.recommendedModel } };
  }

  // D. VISUAL EXECUTION (Direct)
  // Fallback for Edits, Simple Creations, or when Reference Images are present
  const res = await executeFastEditFlow(text, memory, effectiveCategory, refImages);
  return { ...res, meta: { intent: neuralIntent.intent, agent: protocol.primaryAgent, model: protocol.recommendedModel } };
};

// Re-exports
export { executeMockupDecomposition } from '../features/batch/decompositionAgent';
export { executeAutoRebrand } from '../features/batch/rebrandAgent';
export { executeVectorBlueprint } from '../features/packaging/packagingAgent';

export const executeDesignVariation = pixelService.generateDesignVariation;
export const executeStudioExtraction = pixelService.extractNeuralStudio;
export const executeStudioEnrichment = pixelService.enrichRegionForPrint;
export const executeDesignRecovery = pixelService.recoverDesignFromMockup;
export const executeNeuralMockup = pixelService.pixelSmithEdit;
export const executeImageEditWorkflow = pixelService.pixelSmithEdit;
export const executeBackgroundRemoval = pixelService.isolateSubject;
