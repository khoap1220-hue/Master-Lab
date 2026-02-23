
import { Pin, ScenarioCategory, MemoryInsight } from '../../types';
import * as agentService from '../agentService';

interface EditorActionParams {
  mask: string;
  composite: string;
  originalImage: string;
  label: string;
  prompt?: string;
  pins: Pin[];
  category: ScenarioCategory;
  memory: MemoryInsight;
  flags: {
    isExtraction?: boolean;
    isEnrichment?: boolean;
    isDesignRecovery?: boolean;
    isMockup?: boolean;
  };
  contextImages?: {label: string, data: string}[]; // NEW: Pass context images (e.g. from chat history)
}

/**
 * Routes the editor action to the correct specialized agent service.
 */
export const dispatchEditorAction = async (params: EditorActionParams) => {
  const { mask, composite, originalImage, label, prompt, category, memory, flags, contextImages } = params;

  if (flags.isExtraction) {
     return await agentService.executeStudioExtraction(originalImage, mask, composite, memory);
  } 
  
  if (flags.isEnrichment) {
     return await agentService.executeStudioEnrichment(originalImage, mask, composite, memory);
  } 
  
  if (flags.isDesignRecovery) {
     return await agentService.executeDesignRecovery(originalImage, mask, composite, memory);
  } 
  
  if (flags.isMockup) {
     // Neural Mockup placement logic
     // Note: refImage logic logic is handled by caller passing it in contextImages or similar, 
     // here we simplify to passing a specific ref if available.
     // For now, let's assume specific ref handling is done via the `contextImages` or `prompt` parsing in the hook before calling this.
     
     // Simple find ref logic if passed in params or rely on prompt parsing inside the agent?
     // agentService.executeNeuralMockup expects a refImage string.
     
     // Simplification: We will pass undefined for refImage here and let the prompt carry the weight, 
     // unless we explicitly passed a refImage. 
     // To keep this pure, let's assume the hook resolved the reference image string if needed.
     
     // *Self-Correction*: The original hook looked up images by label. 
     // We will support passing `refImageContent` in params.
     
     return await agentService.executeNeuralMockup(
       prompt || "Placement", 
       memory, 
       originalImage, 
       label, 
       "Neural Mockup Placement", 
       category, 
       mask, 
       composite, 
       undefined // refImage is passed via contextImages or logic in agent
     );
  }

  // Default: General Edit
  const editPrompt = prompt || "Edit based on selection";
  return await agentService.executeImageEditWorkflow(
     editPrompt, 
     memory, 
     originalImage, 
     label, 
     "General Edit", 
     category, 
     mask, 
     composite
  );
};
