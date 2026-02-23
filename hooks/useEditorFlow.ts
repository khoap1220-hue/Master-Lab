
import React, { useState } from 'react';
import { EditorState, Pin, MessageRole, MemoryInsight, ChatMessage, ScenarioCategory } from '../types';
import * as editorOrchestrator from '../services/flows/editorOrchestrator';
import * as pixelService from '../services/pixelService';
import * as agentService from '../services/agentService'; // For removeBg direct call
import { getClosestAspectRatio } from '../lib/utils';

interface UseEditorFlowProps {
  addMessage: (msg: Partial<ChatMessage>) => string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setCurrentImage: (img: string | null) => void;
  setIsProcessing: (val: boolean) => void;
  getNextLabel: () => string;
  memory: MemoryInsight;
  activeCategory: ScenarioCategory; 
  onEngineChange: (engine: string | undefined) => void;
}

export const useEditorFlow = ({
  addMessage,
  setMessages,
  setCurrentImage,
  setIsProcessing,
  getNextLabel,
  memory,
  activeCategory,
  onEngineChange
}: UseEditorFlowProps) => {
  const [editorState, setEditorState] = useState<EditorState>({
    isOpen: false,
    image: null,
    strokes: [],
    pins: [],
    currentStroke: null
  });

  const handleEditImage = (img: string, label: string) => {
    setEditorState({
      isOpen: true,
      image: img,
      imageLabel: label,
      strokes: [],
      pins: [],
      currentStroke: null
    });
  };

  const findImageByLabel = (text: string, currentMessages: ChatMessage[]): string | null => {
    const mentions = text.match(/@([a-zA-Z0-9-]+)/g);
    if (!mentions || mentions.length === 0) return null;
    const label = mentions[0].replace('@', '').trim();
    for (let i = currentMessages.length - 1; i >= 0; i--) {
      if (currentMessages[i].imageLabel === label && currentMessages[i].image) {
        return currentMessages[i].image!;
      }
    }
    return null;
  };

  const handleEditorApply = async (
    mask: string, 
    composite: string, 
    pins: Pin[], 
    isExtraction?: boolean, 
    isEnrichment?: boolean, 
    isDesignRecovery?: boolean, 
    prompt?: string,
    isMockup?: boolean
  ) => {
     setEditorState(prev => ({ ...prev, isOpen: false }));
     
     const label = editorState.imageLabel || 'IMG';
     const originalImage = editorState.image!;
     
     if (prompt) {
        addMessage({ role: MessageRole.USER, text: `[EDIT REQUEST] ${label}: ${prompt}` });
     }

     setIsProcessing(true);
     const procId = addMessage({ 
       role: MessageRole.ASSISTANT, 
       text: isExtraction ? `Đang tách nền đối tượng...` : 
             isEnrichment ? `Đang zoom chi tiết (Macro)...` :
             isDesignRecovery ? `Đang làm phẳng thiết kế...` :
             isMockup ? `Đang thực hiện nhúng Neural Mockup...` :
             `Đang thực hiện chỉnh sửa trên ${label}...`, 
       isProcessing: true 
     });
     
     try {
        onEngineChange("Gemini 3 Pro Image");

        // Resolve Reference Image if Mockup Mode
        let refImg = undefined;
        if (isMockup && prompt) {
            setMessages(prev => {
                refImg = findImageByLabel(prompt, prev) || undefined;
                return prev;
            });
        }

        // Delegate to Orchestrator
        // NOTE: We rely on the orchestrator to handle the specifics.
        // We pass 'refImg' via a temporary shim or assume the orchestrator handles the 'prompt' parsing if we moved that logic there.
        // For strict Separation of Concerns, the hook shouldn't know *how* reference images are looked up, but here we do it for state access.
        // In a perfect world, we'd pass the message history to the service.
        
        // For now, let's call the original agent service directly for Mockup if refImg is found, 
        // OR pass it to our new dispatch function if we update it.
        // Let's stick to the dispatched function for cleaner architecture.
        
        // BUT wait, `dispatchEditorAction` in our new file doesn't accept `refImage` directly yet in the interface I defined above.
        // I'll assume standard dispatch for now and let the prompt carry context. 
        // If we really need the refImage logic inside orchestrator, we should pass contextImages.
        
        let result;
        if (isMockup && refImg) {
             // Direct call for Mockup with Ref to ensure ref is passed correctly, 
             // bypassing simple dispatcher if needed, or update dispatcher.
             // Actually, let's use the dispatcher but maybe we update it to accept contextImages?
             // See previous file change.
             // Since I can't easily pass the refImage string into the simple interface I made without updating it,
             // I will call executeNeuralMockup directly here for this specific case to be safe, 
             // OR better: use the dispatcher and rely on prompt. 
             
             // BEST APPROACH: Call the dispatcher.
             result = await agentService.executeNeuralMockup(
                 prompt || "Placement", memory, originalImage, label, "Neural Mockup", activeCategory, mask, composite, refImg
             );
        } else {
             result = await editorOrchestrator.dispatchEditorAction({
                mask, composite, originalImage, label, prompt, 
                pins, category: activeCategory, memory,
                flags: { isExtraction, isEnrichment, isDesignRecovery, isMockup }
             });
        }

        if (result.image) setCurrentImage(result.image);

        setMessages(prev => prev.map(m => m.id === procId ? {
           ...m,
           text: result.text,
           image: result.image,
           imageLabel: getNextLabel(),
           isProcessing: false
        } : m));

     } catch (e: any) {
        setMessages(prev => prev.map(m => m.id === procId ? { ...m, text: `Failed: ${e.message}`, isProcessing: false } : m));
     } finally {
        setIsProcessing(false);
        onEngineChange(undefined);
     }
  };

  const handleUpscale = async (img: string, label: string) => {
    onEngineChange("Gemini 3 Pro Image [4K ENGINE]");
    setMessages(prev => prev.map(m => m.image === img ? { ...m, isUpscaling: true } : m));
    
    try {
      const ratio = await getClosestAspectRatio(img);
      const res = await pixelService.upscaleTo4K(img, label, ratio);
      
      setMessages(prev => prev.map(m => m.image === img ? { 
          ...m, 
          image: res, 
          isUpscaled: true, 
          isUpscaling: false,
          text: m.text + "\n\n[✓] Hình ảnh đã được nâng cấp lên độ phân giải 4K ULTRA HD với tỷ lệ gốc."
      } : m));
      
      if (res) setCurrentImage(res);

    } catch (e) {
      console.error("4K Upscale failed", e);
      setMessages(prev => prev.map(m => m.image === img ? { ...m, isUpscaling: false } : m));
      alert("Nâng cấp 4K thất bại. Vui lòng thử lại.");
    } finally {
      onEngineChange(undefined);
    }
  };

  const handleRemoveBg = async (img: string, label: string) => {
    onEngineChange("Gemini 3 Pro Image");
    try {
      const res = await agentService.executeBackgroundRemoval(img, label, memory);
      if(res.image) {
         const link = document.createElement('a');
         link.href = res.image;
         link.download = `${label}-nobg.png`;
         link.click();
      }
    } finally {
      onEngineChange(undefined);
    }
  };

  return {
    editorState,
    setEditorState,
    handleEditImage,
    handleEditorApply,
    handleUpscale,
    handleRemoveBg
  };
};
