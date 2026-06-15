
import { MemoryInsight, ScenarioCategory, SmartAction, ChatMessage } from '../types';
import * as orchestratorService from './orchestratorService';
import * as pixelService from './pixelService';
import { classifyNeuralIntent, NeuralIntent } from './router/intentRouter';
import { MODELS } from '../config/models';

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
    batchResults?: Array<{ text: string; image?: string; model?: string }>;
    strategicDNA?: any;
    neuralTrace?: any; // Added NeuralTrace
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
              meta: { intent: 'DOCUMENT', agent: 'TechnicalWriter', model: MODELS.TEXT_PRIMARY }
          };
      }
      if (text.startsWith('[EXECUTE_VISUAL]:') || text.startsWith('[MODE:')) {
          const res = await executeFastEditFlow(text, memory, category, refImages);
          return { ...res, meta: { intent: 'VISUAL', agent: 'PixelSmith', model: res.model || MODELS.IMAGE_FAST } };
      }
  }

  // ---------------------------------------------------------------------------
  // PHASE 2: NEURAL ROUTING & AUTO-DISPATCH (The Brain)
  // Process natural language to find the BEST Category and Intent.
  // ---------------------------------------------------------------------------
  
  // 1. Analyze Intent & Category (using Gemini 3 Flash - Fast ~500ms)
  const neuralIntent = await classifyNeuralIntent(text);
  const protocol = neuralIntent.protocol;
  const targetSize = neuralIntent.resolution;
  
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
  if (neuralIntent.intent === 'CHAT') {
      const res = await executeChatFlow(text, history, memory);
      return { ...res, meta: { intent: 'CHAT', agent: 'CreativeStrategist', model: MODELS.TEXT_PRIMARY } };
  }

  // B. STRATEGY / DOCUMENTATION (Deep Work)
  if (neuralIntent.intent === 'DOCUMENT' || neuralIntent.intent === 'STRATEGY') {
      const res = await executeProjectPlanningFlow(text, memory, effectiveCategory);
      return { 
          ...res, 
          neuralTrace: {
              driftUsed: memory.semanticKB?.creativeDrift || 5,
              memoryAccessed: ["Strategic Knowledge Base", "User Intent"],
              adaptationStrategy: "Deep Strategic Analysis",
              confidence: neuralIntent.confidence,
              executionSteps: [
                  "Phân tích yêu cầu người dùng & Context",
                  `Kích hoạt Agent chuyên gia: ${effectiveCategory}`,
                  "Truy xuất dữ liệu thị trường & Xu hướng",
                  "Tổng hợp chiến lược & Lập tài liệu"
              ]
          },
          meta: { intent: neuralIntent.intent, agent: protocol.primaryAgent, model: protocol.recommendedModel } 
      };
  }

  // C. COMPLEX CREATION (Planning First)
  // If the category requires engineering (Packaging, Architecture), we PLAN before we DRAW.
  const isDeepCategory = ['Packaging', 'Signage', 'Real Estate', 'Floor Plan', 'UX/UI Design', 'Fashion', 'Product Document', 'Interior Design', '3D Rendering', 'Cinematic Video'].includes(effectiveCategory);
  const shouldPlan = neuralIntent.complexity === 'HIGH' || (isDeepCategory && neuralIntent.intent === 'CREATE' && !refImages.length);

  if (shouldPlan) {
      const res = await executeProjectPlanningFlow(text, memory, effectiveCategory);
      return { 
          ...res, 
          neuralTrace: {
              driftUsed: memory.semanticKB?.creativeDrift || 5,
              memoryAccessed: ["Visual Knowledge Base", "Design Principles"],
              adaptationStrategy: "Multi-Step Creative Planning",
              confidence: neuralIntent.confidence,
              executionSteps: [
                  "Phân tích độ phức tạp & Yêu cầu kỹ thuật",
                  `Kích hoạt Creative Director cho ${effectiveCategory}`,
                  "Lập kế hoạch Visual & Cấu trúc Brief",
                  "Đề xuất phương án thực thi tối ưu"
              ]
          },
          meta: { intent: 'PLANNING', agent: 'StrategicCounsel', model: protocol.recommendedModel } 
      };
  }

  // D. VISUAL EXECUTION (Direct)
  // Fallback for Edits, Simple Creations, or when Reference Images are present
  const res = await executeFastEditFlow(text, memory, effectiveCategory, refImages, targetSize);
  return { 
      ...res, 
      neuralTrace: {
          driftUsed: memory.semanticKB?.creativeDrift || 5,
          memoryAccessed: ["Visual Context", "Image Processing Rules"],
          adaptationStrategy: "Direct Visual Execution",
          confidence: neuralIntent.confidence,
          executionSteps: [
              "Phân tích yêu cầu chỉnh sửa/tạo ảnh",
              "Xử lý hình ảnh đầu vào (nếu có)",
              "Áp dụng bộ lọc & Hiệu ứng Neural",
              "Hoàn thiện & Tối ưu hóa kết quả"
          ]
      },
      meta: { intent: neuralIntent.intent, agent: protocol.primaryAgent, model: res.model || protocol.recommendedModel } 
  };
};

// Re-exports
export { executeMockupDecomposition } from '../features/batch/decompositionAgent';
export { executeAutoRebrand } from '../features/batch/rebrandAgent';
export { executeVectorBlueprint } from '../features/packaging/packagingAgent';

export const executeDesignVariation = pixelService.generateDesignVariation;
export const upscaleTo4K = pixelService.upscaleTo4K;
export const executeStudioExtraction = pixelService.extractNeuralStudio;
export const executeStudioEnrichment = pixelService.enrichRegionForPrint;
export const executeDesignRecovery = pixelService.recoverDesignFromMockup;
export const executeNeuralMockup = pixelService.pixelSmithEdit;
export const executeImageEditWorkflow = pixelService.pixelSmithEdit;
export const executeBackgroundRemoval = pixelService.isolateSubject;
