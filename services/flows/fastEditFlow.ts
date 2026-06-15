
import { MemoryInsight, ScenarioCategory, SmartAction } from '../../types';
import * as pixelService from '../pixelService';
import * as contextOrchestrator from '../orchestrator/context'; // Import Context Module
import { executeManagedTask } from '../../lib/tieredExecutor';

export const executeFastEditFlow = async (
  text: string,
  memory: MemoryInsight,
  category: ScenarioCategory,
  refImages: string[] = [], // Optional reference images
  targetSize?: "1K" | "2K" | "4K"
) => {
  // Clean up command flag if present
  const rawPrompt = text.replace('[EXECUTE_VISUAL]:', '').trim();

  // --- DETECT ASPECT RATIO OVERRIDE ---
  // Match patterns like 16:9, 4:3, 1:1, 9:16, 21:9
  const ratioMatch = rawPrompt.match(/\b(\d{1,2}:\d{1,2})\b/);
  const targetRatio = ratioMatch ? ratioMatch[1] : undefined;

  // --- DETECT RESOLUTION OVERRIDE ---
  const resMatch = rawPrompt.match(/\b(2K|4K|1K|512px)\b/i);
  const effectiveSize = (resMatch ? resMatch[1].toUpperCase() : targetSize) as "1K" | "2K" | "4K" | undefined;

  // --- DETECT ACTION CHAIN (=> or ->) ---
  // Example: "@A => Neon Style => Sketch Style => 3D Render"
  const chainSegments = rawPrompt.split(/\s*=>\s*|\s*->\s*/).map(s => s.trim()).filter(s => s.length > 0);

  // If chain detected (more than 1 segment) OR explicitly multiple refs with distinct actions
  if (chainSegments.length > 1) {
      console.log(`[FastEditFlow] Action Chain Detected: ${chainSegments.length} steps.`);
      
      const batchResults: Array<{ text: string, image?: string, model?: string }> = [];
      const mainSubject = refImages[0];
      const styleRefs = refImages.slice(1); 

      // STEP 0: PRE-ANALYSIS (Using new module)
      let subjectContext = "";
      if (mainSubject) {
          try {
             subjectContext = await contextOrchestrator.identifyVisualSubject(mainSubject);
             console.log("Analyzed Subject Context:", subjectContext);
          } catch (e) {
             console.warn("Failed to analyze subject context, proceeding without it.");
          }
      }

      // Execute in Parallel (BATCH TIER)
      const promises = chainSegments.map(async (segmentPrompt, index) => {
          // Skip segment if it's just the reference tag itself (e.g. "@A")
          if (segmentPrompt.startsWith('@') && !segmentPrompt.includes(' ') && chainSegments.length > 1) {
              return null;
          }

          try {
              // Determine intent for this specific segment
              const lowerSeg = segmentPrompt.toLowerCase();
              const isCreation = ['tạo', 'vẽ', 'generate', 'render', 'làm', 'make', 'create', 'theo vibe', 'style', 'phong cách', 'giống'].some(kw => lowerSeg.includes(kw));
              
              let enhancedPrompt = segmentPrompt;
              
              // "Sequence Context" keeps the chain flow logical
              const prevStep = index > 0 && chainSegments[index - 1] && !chainSegments[index - 1].startsWith('@') 
                  ? chainSegments[index - 1] 
                  : null;
              
              if (mainSubject) {
                  // USE CONTEXT MODULE TO BUILD PROMPT
                  enhancedPrompt = contextOrchestrator.buildStoryboardPrompt(
                      segmentPrompt,
                      subjectContext,
                      prevStep
                  );
              }

              // Use mainSubject as structure for all steps in the chain
              if (mainSubject && !isCreation) {
                  return await pixelService.generateDesignVariation(
                      enhancedPrompt, 
                      mainSubject, 
                      memory, 
                      category, 
                      styleRefs, 
                      undefined, 
                      targetRatio || "1:1",
                      true,
                      effectiveSize
                  );
              } else {
                  return await pixelService.generateDesignVariation(
                      segmentPrompt, 
                      isCreation ? null : mainSubject, 
                      memory, 
                      category, 
                      mainSubject ? [mainSubject] : styleRefs, 
                      undefined, 
                      targetRatio || "1:1",
                      true,
                      effectiveSize
                  );
              }
          } catch (e: any) {
              return { text: `⚠️ Lỗi bước ${index + 1}: ${e.message}`, image: undefined, model: undefined };
          }
      });

      const results = await Promise.all(promises);
      
      results.forEach(res => {
          if (res) batchResults.push(res);
      });

      if (batchResults.length > 0) {
          return {
              text: `✅ **Chuỗi hành động hoàn tất (${subjectContext ? `Chủ thể: ${subjectContext}` : 'Đa tác vụ'}).**`,
              image: batchResults[0].image, 
              batchResults: batchResults, 
              sources: [],
              smartActions: [],
              model: batchResults[0].model
          };
      }
  }

  // --- STANDARD FLOW (Single Action) ---

  // --- SPECIAL LOGIC: 360 View for Product/Packaging (Only if no refs) ---
  // FIX: Added !rawPrompt.includes('VISUAL SUMMARY') to prevent this block from running
  // on illustration requests from the Product Document workflow.
  if ((category === 'Product Design' || category === 'Packaging') && refImages.length === 0 && !rawPrompt.includes('VISUAL SUMMARY')) {
      try {
          const images = await pixelService.generate360ProductViews(rawPrompt, memory);
          if (images.length > 0) {
              const bestViewIndex = 4; // Isometric Front-Left
              const displayImage = images[bestViewIndex] || images[0];
              
              let batchSmartActions: SmartAction[] = [];
              if (category === 'Packaging') {
                  batchSmartActions.push({
                      id: 'generate_pack_specs',
                      label: 'XUẤT QUY CÁCH IN ẤN 🖨️',
                      description: 'Tạo tài liệu Die-line & Print Specs',
                      icon: '📏',
                      prompt: `[GENERATE_SPECS]: ${rawPrompt}`,
                      type: 'technical'
                  });
              }

              return {
                text: `✅ **Đã hoàn tất Render 360 Độ (4 Mặt + Góc chéo).**\n\nHệ thống đã tạo đầy đủ các góc: Trước, Sau, Trái, Phải, Chéo, Trên, Chi tiết.`,
                image: displayImage,
                sources: [],
                audienceProfile: undefined,
                structuredBrief: undefined, 
                smartActions: batchSmartActions,
                model: 'Gemini-2.5-Flash-Image'
              };
          }
      } catch (e) {
          console.error("Batch 360 failed, falling back to single", e);
      }
  }

  let genResult;
  let processNote = "";

  try {
    // --- REFERENCE IMAGE HANDLING STRATEGY ---
    if (refImages.length > 0) {
        // Intent Detection: Is this "Generate New" or "Edit Existing"?
        const lowerText = rawPrompt.toLowerCase();
        // Keywords that imply creating something NEW using the ref as STYLE
        const creationKeywords = ['sanh', 'tạo', 'vẽ', 'generate', 'render', 'làm', 'make', 'create', 'theo vibe', 'style', 'phong cách', 'giống'];
        const isGenerationIntent = creationKeywords.some(kw => lowerText.includes(kw));

        if (isGenerationIntent) {
            // STRATEGY: TEXT-TO-IMAGE + MOODBOARD (Use ALL refs as Style only)
            console.log("Detect: Generation with Style Reference");
            processNote = `🎨 **Chế độ Sáng tạo:** Đang tổng hợp phong cách từ ${refImages.length} ảnh tham chiếu.`;
            
            genResult = await pixelService.generateDesignVariation(
                rawPrompt, 
                null, // No structural base image
                memory, 
                category, 
                refImages, // Pass ALL refs as Style/Moodboard
                undefined, 
                targetRatio || "1:1",
                true,
                effectiveSize
            );
        } else {
            // STRATEGY: IMAGE-TO-IMAGE (Variation)
            // Use first image as Structure, others as Style
            console.log("Detect: Structure Variation");
            
            const mainSubject = refImages[0];
            const styleRefs = refImages.slice(1);
            
            if (styleRefs.length > 0) {
               processNote = `🔧 **Cấu trúc:** Giữ nguyên ảnh gốc (@1).\n🎨 **Phong cách:** Áp dụng màu sắc/ánh sáng từ ${styleRefs.length} ảnh còn lại.`;
            } else {
               processNote = `🔧 **Biến thể:** Chỉnh sửa trực tiếp trên ảnh gốc (@1).`;
            }
            
            genResult = await pixelService.generateDesignVariation(
                rawPrompt, 
                mainSubject, 
                memory, 
                category, 
                styleRefs,
                undefined, 
                targetRatio || "1:1",
                true,
                effectiveSize
            );
        }
    } else {
        // --- STANDARD GENERATION (Text-to-Image) ---
        genResult = await pixelService.generateBaseImage(rawPrompt, memory, category, targetRatio || "1:1", effectiveSize);
    }
  } catch (e: any) {
    console.error("Fast Edit Flow Error:", e);
    if (e.message && e.message.includes('403')) throw e;
    throw new Error(`Lỗi tạo ảnh: ${e.message}`);
  }
  
  // Generate Smart Actions based on Category Logic
  let smartActions: SmartAction[] = [];
  const specsCategories = [
      'Signage', 'Floor Plan', 'Real Estate', 'Packaging', 
      'Fashion', 'Marketing & Ads', 'Logo Design', 'Print Design', 'Multimedia'
  ];
  
  if (specsCategories.includes(category)) {
      let label = 'XUẤT HỒ SƠ KỸ THUẬT 📐';
      let icon = '📋';
      
      if (category === 'Logo Design') { label = 'XUẤT GUIDELINE 💠'; icon = '📏'; }
      if (category === 'Print Design') { label = 'CHECKLIST IN ẤN 🖨️'; icon = '✔️'; }
      if (category === 'Multimedia') { label = 'XUẤT SHOT LIST 🎬'; icon = '📝'; }
      if (category === 'Real Estate') { label = 'DANH MỤC HOÀN THIỆN 🏠'; icon = '🔨'; }

      smartActions.push({
          id: 'generate_tech_specs',
          label: label,
          description: 'Tạo tài liệu kỹ thuật chi tiết',
          icon: icon,
          prompt: `[GENERATE_SPECS]: ${rawPrompt}`,
          type: 'technical'
      });
  }

  let finalMessage = "";
  if (!genResult.image && genResult.text) {
      // If there's no image, it's likely a Neural Refusal or conversational response
      finalMessage = genResult.text;
  } else {
      finalMessage = processNote 
          ? `${processNote}\n\n✅ **Kết quả:**\n${genResult.text}`
          : `✅ **Kết quả Visual:**\n${genResult.text}`;
  }

  return {
    text: finalMessage,
    image: genResult.image,
    sources: [],
    audienceProfile: undefined,
    structuredBrief: undefined,
    smartActions,
    model: genResult.model
  };
};
