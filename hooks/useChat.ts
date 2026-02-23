
import { useState, useCallback, useEffect } from 'react';
import { MessageRole, ChatMessage, MemoryInsight, ScenarioCategory } from '../types';
import * as agentService from '../services/agentService';
import * as contextOrchestrator from '../services/orchestrator/context'; // Import Context Orchestrator
import { distillMemory } from '../services/memoryService';
import { createEvent, saveEvent } from '../services/registryService'; 

interface UseChatProps {
  onEngineChange: (engine: string | undefined) => void;
  setMemory: (memory: MemoryInsight) => void; 
}

const MAX_ACTIVE_IMAGES = 8; 

export const useChat = ({ onEngineChange, setMemory }: UseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mindStatus, setMindStatus] = useState<'idle' | 'observing' | 'planning' | 'syncing'>('idle');
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const getNextLabel = useCallback(() => {
    return `IMG-${Math.random().toString(36).substring(7).toUpperCase()}`;
  }, []);

  // --- NEURAL GARBAGE COLLECTOR ---
  useEffect(() => {
    if (messages.length <= 10) return;

    const imageMessages = messages.filter(m => m.image && !m.imageExpired);
    
    if (imageMessages.length > MAX_ACTIVE_IMAGES) {
      const imagesToPurge = imageMessages.slice(0, imageMessages.length - MAX_ACTIVE_IMAGES);
      
      if (imagesToPurge.length > 0) {
        console.log(`[Neural GC] Pruning ${imagesToPurge.length} old images.`);
        setMessages(prev => prev.map(msg => {
          if (imagesToPurge.find(p => p.id === msg.id)) {
            return { ...msg, image: undefined, imageExpired: true };
          }
          return msg;
        }));
      }
    }
  }, [messages.length]);

  const addMessage = useCallback((msg: Partial<ChatMessage>) => {
    const id = Math.random().toString(36).substring(7);
    const newMessage: ChatMessage = {
      id,
      role: MessageRole.ASSISTANT,
      text: '',
      timestamp: new Date(),
      ...msg
    };
    setMessages(prev => [...prev, newMessage]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const processUserPrompt = async (text: string, memory: MemoryInsight, category: ScenarioCategory) => {
    // ROBUSTNESS CHECK: Check if we have image context even if text is empty
    const hasPendingImage = messages.some(m => m.role === 'user' && m.image && !m.imageExpired && messages.indexOf(m) === messages.length - 1);
    
    // If empty text AND no recent image, do nothing
    if (!text.trim() && !hasPendingImage && !currentImage) return;

    // --- VISUAL INTENT EXTRACTION (NEW) ---
    // If text is short/empty AND we have an image, check if the image itself is the instruction (Screenshot)
    let finalInputText = text;
    let extractedNote = null;

    if (hasPendingImage) {
        // Find the latest user image
        const latestUserMsg = [...messages].reverse().find(m => m.role === 'user' && m.image);
        if (latestUserMsg && latestUserMsg.image) {
             // Only run extraction if text is vague or empty
             if (!text.trim() || text.length < 50) {
                 extractedNote = await contextOrchestrator.extractIntentionFromImage(latestUserMsg.image);
                 if (extractedNote) {
                     console.log("[Visual OCR] Extracted Instruction:", extractedNote);
                     // Append the extracted note to the input
                     finalInputText = text ? `${text}\n\n[DETECTED INSTRUCTION]: ${extractedNote}` : extractedNote;
                 }
             }
        }
    }

    // Fallback Auto-fill if still empty
    if (!finalInputText.trim() && (hasPendingImage || currentImage)) {
        finalInputText = "Hãy phân tích hình ảnh này và đề xuất các phương án xử lý phù hợp (Design, Edit, hoặc Concept).";
    }

    const mentions = finalInputText.match(/@([a-zA-Z0-9-]+)/gi);
    let refImages: string[] = [];
    
    if (mentions) {
        mentions.forEach(m => {
            const label = m.replace('@', '').trim().toUpperCase();
            const foundMsg = [...messages].reverse().find(msg => msg.imageLabel && msg.imageLabel.toUpperCase() === label);
            if (foundMsg && foundMsg.image) refImages.push(foundMsg.image);
        });
        refImages = Array.from(new Set(refImages));
    }

    // Auto-attach current image if no specific mention and one exists (Implicit Context)
    if (refImages.length === 0 && currentImage) {
        refImages.push(currentImage);
    }

    const userMsgId = Math.random().toString(36).substring(7);
    const newUserMsg: ChatMessage = {
        id: userMsgId,
        role: MessageRole.USER,
        text: text || (extractedNote ? `[Screenshot Content]: ${extractedNote}` : "Phân tích hình ảnh..."), 
        timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsProcessing(true);
    setMindStatus('planning');

    const responseId = addMessage({ role: MessageRole.ASSISTANT, text: extractedNote ? 'Đã đọc được yêu cầu trong ảnh. Đang xử lý...' : 'Đang khởi tạo chuỗi Synergy Agent...', isProcessing: true });
    
    const startTime = Date.now();

    try {
      const realtimeHistory = [...messages, newUserMsg];

      // Execute Agent
      const result: any = await agentService.executeResearchBasedProductDesign(
          finalInputText, 
          memory, 
          category, 
          refImages, 
          realtimeHistory
      );
      
      // LOG EVENT to Neural Registry
      saveEvent(createEvent(
          result.image ? 'GENERATION' : 'WORKFLOW_INIT',
          {
              model: result.meta?.model || 'Unknown',
              latency: Date.now() - startTime,
              status: 'SUCCESS',
              userPrompt: finalInputText.substring(0, 50) + '...'
          },
          memory // Snapshot state before update
      ));

      if (result.meta) {
          onEngineChange(result.meta.model.replace('gemini-', '').toUpperCase());
      } else {
          onEngineChange("Gemini 3 Pro");
      }

      if (result.image) setCurrentImage(result.image);
      
      let finalResponseText = result.text;
      if (result.structuredBrief) {
          finalResponseText = `## 📋 TÀI LIỆU YÊU CẦU SẢN PHẨM (FRD)\n${result.structuredBrief}\n\n---\n### 🎨 VISUAL EXECUTION\n${finalResponseText}`;
      } else if (result.audienceProfile) {
          finalResponseText = `### Phân tích Đối tượng & Trải nghiệm (UX Profile):\n${result.audienceProfile}\n\n---\n${finalResponseText}`;
      }

      // Handle Batch / Action Chain Results
      if (result.batchResults && Array.isArray(result.batchResults) && result.batchResults.length > 0) {
          updateMessage(responseId, {
              text: `✅ **Đã hoàn tất chuỗi Synergy (${result.batchResults.length} bước).**`,
              isProcessing: false,
              masterOversight: `Sử dụng Agent: ${result.meta?.agent || 'Multi-Agent'}`
          });

          result.batchResults.forEach((res: any, idx: number) => {
              setTimeout(() => {
                  addMessage({
                      role: MessageRole.ASSISTANT,
                      text: `**Bước ${idx + 1}:**\n${res.text}`,
                      image: res.image,
                      imageLabel: getNextLabel(),
                      isProcessing: false
                  });
                  if (idx === result.batchResults.length - 1 && res.image) setCurrentImage(res.image);
              }, (idx + 1) * 600);
          });
      } else {
          updateMessage(responseId, {
            text: finalResponseText,
            image: result.image,
            imageLabel: getNextLabel(),
            groundingSources: result.sources,
            smartActions: result.smartActions,
            neuralTrace: result.neuralTrace, // MAP THE NEURAL TRACE HERE
            isProcessing: false,
            masterOversight: result.meta ? `Agent: ${result.meta.agent} | Mode: ${result.meta.intent}` : undefined
          });
      }

      // Background Memory Distillation
      distillMemory(realtimeHistory, memory)
        .then(newMemory => setMemory(newMemory))
        .catch(err => console.warn("[Synergy] Memory sync minor error", err));

    } catch (error: any) {
      console.error("[Synergy Error]", error);
      
      let errorMessage = `❌ Hệ thống Synergy gặp gián đoạn: ${error.message}`;
      
      // Handle 403 Permission Denied by prompting for API Key
      if (error.message && error.message.includes('403') && window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          errorMessage += "\n\n⚠️ Đang mở hộp thoại chọn API Key...";
          setTimeout(() => {
              window.aistudio?.openSelectKey();
          }, 1000);
      }

      updateMessage(responseId, {
        text: errorMessage,
        isProcessing: false
      });
      // Log Failure
      saveEvent(createEvent('GENERATION', { model: 'System', status: 'FAILED', latency: Date.now() - startTime }, memory));
    } finally {
      setIsProcessing(false);
      setMindStatus('idle');
      onEngineChange(undefined);
    }
  };

  return {
    messages, setMessages, addMessage, inputText, setInputText, 
    isProcessing, setIsProcessing, mindStatus, setMindStatus, 
    currentImage, setCurrentImage, processUserPrompt, getNextLabel
  };
};
