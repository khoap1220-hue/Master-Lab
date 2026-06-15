
import React from 'react';
import { ScenarioCategory, MessageRole, MemoryInsight, Workflow } from '../../types';
import * as orchestratorService from '../orchestratorService';
import * as agentService from '../agentService';
import { executeManagedTask } from '../../lib/tieredExecutor';
import { executeProjectPlanningFlow } from './projectFlow';

interface AutomationDependencies {
  memory: MemoryInsight;
  addMessage: (msg: any) => string;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  onEngineChange: (engine: string | undefined) => void;
  getNextLabel: () => string;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
}

export const parseAutomationGoal = (goal: string) => {
  const bibleModeMatch = goal.match(/\[MODE: BRAND_BIBLE_(\d+)\]/);
  const isBibleMode = !!bibleModeMatch;
  const isBlueprintMode = goal.includes('[VECTOR BLUEPRINT MODE]');
  const isFutureMode = goal.includes('[MODE: FUTURE_SIMULATION]');
  const isCampaignMode = goal.includes('[MODE: OMNICHANNEL_CAMPAIGN]');
  const isMasterBoardMode = goal.includes('[MODE: UX_MASTER_BOARD]'); 
  const isDeepResearch = goal.includes('[DEEP_RESEARCH: ON]');
  const businessModelMatch = goal.match(/\[BUSINESS_MODEL\]:([\s\S]*?)(?=\[|$)/);
  const businessModel = businessModelMatch ? businessModelMatch[1].trim() : undefined;
  const targetPageCount = bibleModeMatch ? parseInt(bibleModeMatch[1]) : 40;
  
  const cleanGoal = goal.replace(/\[MODE: BRAND_BIBLE_\d+\]:?/, '')
                    .replace(/\[USAGE_PURPOSE\]:[\s\S]*?(?=\[|$)/, '')
                    .replace(/\[VECTOR BLUEPRINT MODE\]:?/, '')
                    .replace(/\[MODE: FUTURE_SIMULATION\]:?/, '')
                    .replace(/\[MODE: OMNICHANNEL_CAMPAIGN\]:?/, '')
                    .replace(/\[MODE: UX_MASTER_BOARD\]:?/, '') 
                    .replace(/\[DEEP_RESEARCH: ON\]:?/, '')
                    .replace(/\[ADVANCED_TECHNIQUES\]:[\s\S]*?(?=\[|$)/, '')
                    .replace(/\[BUSINESS_MODEL\]:[\s\S]*?(?=\[|$)/, '')
                    .trim();

  return { isBibleMode, isBlueprintMode, isFutureMode, isCampaignMode, isMasterBoardMode, isDeepResearch, businessModel, targetPageCount, cleanGoal };
};

export const dispatchWorkflow = async (
  workflowId: string,
  category: ScenarioCategory,
  rawGoal: string,
  batchSize: number,
  assets: { logoAsset: string | null, moodboardAssets?: string[], brandUrl?: string, brandInfo?: { color: string, vibe: string } },
  deps: AutomationDependencies
) => {
  const { memory, addMessage, setMessages, onEngineChange, getNextLabel, updateWorkflow } = deps;
  const { logoAsset, moodboardAssets, brandUrl, brandInfo } = assets;
  const { cleanGoal, businessModel, targetPageCount, isBibleMode, isBlueprintMode, isFutureMode, isCampaignMode, isMasterBoardMode, isDeepResearch } = parseAutomationGoal(rawGoal);

  let workflowName = `Workflow: ${category}`;
  if (isBibleMode) workflowName = `Auto Brand Bible (${targetPageCount}P)`;
  else if (isBlueprintMode) workflowName = `Blueprint Recovery`;
  else if (isFutureMode) workflowName = `Future Simulation`;
  else if (isCampaignMode) workflowName = `Omnichannel Campaign`;
  else if (isMasterBoardMode) workflowName = `UX Master Board (4K)`;
  else if (category === 'SOP Management') workflowName = 'Master Agent SOP';
  else if (category === 'Product Document') workflowName = 'Technical Documentation';

  updateWorkflow(workflowId, { name: workflowName });

  try {
     // --- CASE 1: UX MASTER BOARD (Strategy -> Audit -> Render) ---
     if (isMasterBoardMode) {
        onEngineChange("Gemini 3 Pro"); // Start with Thinking Model
        const procId = addMessage({ role: MessageRole.ASSISTANT, text: `[STRATEGY] Đang lập chiến lược Master Board cho "${cleanGoal}"...`, isProcessing: true });
        
        // 1. PLAN: Create the architectural plan first (No Image yet)
        const plan = await orchestratorService.planProductUX(cleanGoal, "Design System", "User");

        // 2. AUDIT: Check the plan maturity BEFORE generating heavy 4K image
        const audit = await orchestratorService.evaluateMaturity(plan.structuredBrief || plan.visualPrompt, cleanGoal, category);

        // Update UI with Plan & Score immediately
        setMessages(prev => prev.map(m => m.id === procId ? { 
            ...m, 
            text: `✅ **Chiến lược đã được thẩm định.**\n\n${plan.structuredBrief?.substring(0, 200)}...\n\n*Đang chuyển sang giai đoạn Render 4K...*`, 
            maturityScore: audit, // Show score BEFORE image gen
            isProcessing: true // Keep processing
        } : m));

        onEngineChange("Gemini 3 Pro Image [4K]");

        // 3. EXECUTE: Generate the Heavy Image using the audited prompt
        // Optimization: Generate at 1K first, then upscale to 4K to avoid timeout.
        // NOTE: Underlying services already handle their own tiering, so we don't wrap them here to avoid deadlocks.
        const baseResult = await agentService.executeDesignVariation(
            plan.visualPrompt, // Use the improved prompt from Strategy phase
            logoAsset, 
            memory, 
            'UX/UI Design', 
            moodboardAssets, 
            undefined, 
            "16:9",
            false
        );

        // 4. UPSCALE: Upscale the 1K base result to 4K
        const result = await agentService.upscaleTo4K(baseResult.image, 'UX Master Board', '16:9');

        // 5. FINALIZE
        setMessages(prev => prev.map(m => m.id === procId ? { 
            ...m, 
            text: `✅ **UX Master Board (4K) đã hoàn tất.**\nChiến lược gốc: ${audit.summary}`, 
            image: result.image, 
            imageLabel: getNextLabel(),
            isProcessing: false,
            isUpscaled: true
        } : m));

        updateWorkflow(workflowId, { status: 'completed', progress: 100, resultImages: [result.image] });
        return;
     }

     // --- CASE 2: SOP MANAGEMENT (Plan -> Audit -> Diagram) ---
     if (category === 'SOP Management') {
        onEngineChange("Gemini 3 Pro");
        const procIdSOP = addMessage({ role: MessageRole.ASSISTANT, text: `[MASTER AGENT] Đang thiết kế luồng SOP...`, isProcessing: true, neuralPulse: true });
        
        // 1. PLAN
        const result = await orchestratorService.decomposeWorkflow('Brand Building SOP', 'Framework Execution', cleanGoal, memory, businessModel);
        
        // 2. AUDIT PLAN
        const audit = await orchestratorService.evaluateMaturity(result.masterSummary, cleanGoal, category);

        // Update UI: Show audit result before visual generation
        setMessages(prev => prev.map(m => m.id === procIdSOP ? { 
            ...m, 
            text: `**Chiến lược SOP đã được phê duyệt.**\nĐộ trưởng thành: ${audit.grade}\n\n*Đang vẽ sơ đồ quy trình...*`,
            strategicDNA: result.strategicDNA, 
            maturityScore: audit, 
            isProcessing: true 
        } : m));

        // 3. EXECUTE VISUAL
        const diagramResult = await agentService.executeDesignVariation(
            "Corporate flowchart representing: " + result.masterSummary, 
            null, 
            memory, 
            'SOP Management', 
            [], 
            undefined, 
            "16:9"
        );
        
        // 4. FINALIZE
        setMessages(prev => prev.map(m => m.id === procIdSOP ? { 
            ...m, 
            text: result.masterSummary, // Show full text now
            image: diagramResult.image, 
            isProcessing: false, 
            workflowId: workflowId, 
            workflowAction: 'confirm_plan' 
        } : m));

        updateWorkflow(workflowId, { status: 'completed', progress: 100, tasks: result.tasks, resultImages: [diagramResult.image], strategicDNA: result.strategicDNA });
        return;
     }

     // --- CASE 3: PRODUCT DOCUMENT (Doc -> Audit) ---
     if (category === 'Product Document') {
        onEngineChange("Gemini 3 Pro");
        const docId = addMessage({ role: MessageRole.ASSISTANT, text: `[TECHNICAL WRITER] Đang soạn thảo tài liệu PRD & Phân tích thị trường...`, isProcessing: true });
        
        // 1. EXECUTE RESEARCH (Text Gen)
        const result: any = await agentService.executeResearchBasedProductDesign(cleanGoal, memory, category);
        
        // 2. AUDIT DOCUMENT
        const audit = await orchestratorService.evaluateMaturity(result.structuredBrief || result.text, cleanGoal, category);

        setMessages(prev => prev.map(m => m.id === docId ? {
           ...m,
           text: `✅ **Tài liệu đã sẵn sàng.**\n\nPhân tích đối tượng: ${result.audienceProfile || 'Đã hoàn tất.'}`,
           strategicBrief: {
               brandFocus: "Technical Documentation",
               visualVibe: "Professional",
               marketStance: "R&D Ready",
               contentProposal: {
                   conceptName: "Product PRD",
                   strategy: result.structuredBrief, 
                   technicalSpecs: [],
                   toneOfVoice: "Technical",
                   frontSide: { goal: "", headline: "", subline: "", branding: "", visualNotes: "" },
                   backSide: { goal: "", contentPoints: [], footerInfo: "" },
                   designLanguage: { colors: [], visualVibe: "", forbiddenElements: [] },
                   aiPrompts: { front: "", back: "" }
               }
           },
           smartActions: result.smartActions,
           maturityScore: audit, // Audit logic fits perfectly here (Post-text, Pre-implementation)
           isProcessing: false
        } : m));
        
        updateWorkflow(workflowId, { status: 'completed', progress: 100 });
        return;
     }

     // --- CASE 4: INTELLIGENT BATCH PIPELINE ---
     // This pipeline dynamically routes to the correct strategic planner based on the category,
     // audits the plan, and then executes the visual generation.
     onEngineChange("Gemini 3 Pro [STRATEGY]");
     const batchMsgId = addMessage({ role: MessageRole.ASSISTANT, text: `[PIPELINE] Khởi tạo luồng tự động hóa thông minh cho ${batchSize} thiết kế...`, isProcessing: true });
     
     let finalPrompt = cleanGoal;
     
     // 1. DEEP RESEARCH (Optional Context Enrichment)
     if (isDeepResearch) {
         setMessages(prev => prev.map(m => m.id === batchMsgId ? {
             ...m,
             text: `[DEEP RESEARCH] Đang phân tích chuyên sâu ý tưởng và branding...`,
             isProcessing: true
         } : m));
         
         finalPrompt = await orchestratorService.deepResearchPrompt(cleanGoal, category, brandInfo);
     }
     
     // 2. STRATEGIC PLANNING (Auto-route to correct planner)
     setMessages(prev => prev.map(m => m.id === batchMsgId ? {
         ...m,
         text: `[STRATEGY] Đang lập kế hoạch thiết kế chuyên sâu cho danh mục ${category}...`,
         isProcessing: true
     } : m));
     
     // We use the project planning flow to get a structured brief and an optimized visual prompt
     const plan = await executeProjectPlanningFlow(finalPrompt, memory, category);
     
     // Extract the visual prompt from the plan's smart actions (which contains the optimized render prompt)
     let visualPromptToUse = finalPrompt;
     if (plan.smartActions && plan.smartActions.length > 0) {
         visualPromptToUse = plan.smartActions[0].prompt.replace('[EXECUTE_VISUAL]: ', '');
     } else if (plan.structuredBrief) {
         visualPromptToUse = `${plan.structuredBrief}\n\nVisual Prompt: ${finalPrompt}`;
     }
     
     // 3. PRE-AUDIT (Evaluate the generated plan)
     const preAudit = await orchestratorService.evaluateMaturity(plan.structuredBrief || visualPromptToUse, "Input Prompt Analysis", category);
     
     // Update UI with Plan & Pre-Audit Score
     setMessages(prev => prev.map(m => m.id === batchMsgId ? {
         ...m,
         text: `✅ **Chiến lược đã được lập:**\n${plan.structuredBrief ? plan.structuredBrief.substring(0, 250) + '...' : 'Đã tối ưu hóa prompt.'}\n\nThẩm định yêu cầu: ${preAudit.grade}. Đang tiến hành sinh ảnh...`,
         maturityScore: preAudit,
         isProcessing: true
     } : m));

     onEngineChange("Gemini 3 Flash [RENDER]");

     // 4. EXECUTE BATCH
     const results = [];
     for(let i=0; i < batchSize; i++) {
        // Inject specific mode modifiers to ensure variation across the batch
        let variationPrompt = visualPromptToUse;
        if (isBibleMode) variationPrompt += `\n[PAGE ${i+1}/${targetPageCount}]`;
        else if (isCampaignMode) variationPrompt += `\n[ASSET VARIATION ${i+1}]`;
        else if (isFutureMode) variationPrompt += `\n[FUTURE SIMULATION VARIANT ${i+1}]`;
        else if (isBlueprintMode) variationPrompt += `\n[VECTOR BLUEPRINT VARIANT ${i+1}]`;
        else variationPrompt += `\n[VARIATION ${i+1}]`; // Default variation
        
        const res = await agentService.executeDesignVariation(variationPrompt, logoAsset, memory, category, moodboardAssets, brandUrl);
        results.push(res);
        updateWorkflow(workflowId, { progress: Math.round(((i + 1) / batchSize) * 100) });
     }

     // 5. FINALIZE
     setMessages(prev => prev.map(m => m.id === batchMsgId ? { 
         ...m, 
         text: `✅ **Hoàn tất bộ sưu tập ${batchSize} phương án.**\n\n${plan.structuredBrief ? `**Tóm tắt chiến lược:**\n${plan.structuredBrief}` : results[0].text}`, 
         image: results[0].image, 
         isProcessing: false 
     } : m));

     if (results.length > 1) {
        for(let i=1; i<results.length; i++) {
           addMessage({ role: MessageRole.ASSISTANT, text: results[i].text, image: results[i].image, imageLabel: getNextLabel() });
        }
     }
     updateWorkflow(workflowId, { status: 'completed', progress: 100, resultImages: results.map(r => r.image) });

  } catch (error: any) {
     console.error("Workflow failed", error);
     addMessage({ role: MessageRole.ASSISTANT, text: `❌ Lỗi hệ thống: ${error.message}` });
     updateWorkflow(workflowId, { status: 'failed' });
     throw error; // Re-throw to be caught by useAutomation
  } finally {
     onEngineChange(undefined);
  }
};
