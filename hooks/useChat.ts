
import { useState, useCallback, useEffect } from 'react';
import { MessageRole, ChatMessage, MemoryInsight, ScenarioCategory, BrandIdentity, SmartAction } from '../types';
import * as agentService from '../services/agentService';
import * as contextOrchestrator from '../services/orchestrator/context'; // Import Context Orchestrator
import { distillMemory } from '../services/memoryService';
import { createEvent, saveEvent } from '../services/registryService'; 
import { base64ToBlobUrl } from '../lib/utils';
import { useToast } from '../components/Toast';

interface UseChatProps {
  onEngineChange: (engine: string | undefined) => void;
  setMemory: (memory: MemoryInsight) => void; 
  brandIdentity?: BrandIdentity | null;
}

const MAX_ACTIVE_IMAGES = 8; 

export const useChat = ({ onEngineChange, setMemory, brandIdentity }: UseChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mindStatus, setMindStatus] = useState<'idle' | 'observing' | 'planning' | 'syncing'>('idle');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const { addToast } = useToast();

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
            // Revoke the blob URL to free up browser memory
            if (msg.image && msg.image.startsWith('blob:')) {
                URL.revokeObjectURL(msg.image);
            }
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

  const clearChat = useCallback(() => {
    // Revoke all active blob URLs
    messages.forEach(msg => {
      if (msg.image && msg.image.startsWith('blob:')) {
        URL.revokeObjectURL(msg.image);
      }
    });
    setMessages([]);
    setCurrentImage(null);
    setInputText('');
    setMindStatus('idle');
  }, [messages]);

  const processUserPrompt = async (text: string, memory: MemoryInsight, category: ScenarioCategory) => {
    // ROBUSTNESS CHECK: Check if we have image context even if text is empty
    const hasPendingImage = messages.some(m => m.role === 'user' && m.image && !m.imageExpired && messages.indexOf(m) === messages.length - 1);
    
    // If empty text AND no recent image, do nothing
    if (!text.trim() && !hasPendingImage && !currentImage) return;

    const userMsgId = Math.random().toString(36).substring(7);
    const newUserMsg: ChatMessage = {
        id: userMsgId,
        role: MessageRole.USER,
        text: text || "Phân tích hình ảnh...", // Will update text later if extracted
        timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsProcessing(true);
    setMindStatus('planning');

    const responseId = addMessage({ role: MessageRole.ASSISTANT, text: 'Đang khởi tạo chuỗi Synergy Agent...', isProcessing: true });
    
    const startTime = Date.now();

    try {
      // --- VISUAL INTENT EXTRACTION & CONTEXT ENRICHMENT (PARALLEL) ---
      let finalInputText = text;
      let extractedNote: string | null = null;
      let enrichedText = text;

      // Inject Brand Identity context if available
      const brandContext = brandIdentity 
        ? `[BRAND IDENTITY ACTIVE: ${brandIdentity.name || 'Unnamed'}] Primary: ${brandIdentity.primaryColor || 'N/A'}, Secondary: ${brandIdentity.secondaryColor || 'N/A'}, Accent: ${brandIdentity.accentColor || 'N/A'}. Please use these colors in your designs or suggestions if applicable.\n\n`
        : '';

      // Prepare parallel tasks
      const tasks: Promise<any>[] = [];

      // Task 1: Context Enrichment from History
      if (messages.length > 0 && text.trim()) {
          tasks.push(contextOrchestrator.enrichContextFromHistory(text, messages).then(res => enrichedText = res));
      }

      // Task 2: Visual Intent Extraction
      let latestUserMsgImage: string | undefined = undefined;
      if (hasPendingImage) {
          const latestUserMsg = [...messages].reverse().find(m => m.role === 'user' && m.image);
          if (latestUserMsg && latestUserMsg.image && (!text.trim() || text.length < 50)) {
              latestUserMsgImage = latestUserMsg.image;
              tasks.push(contextOrchestrator.extractIntentionFromImage(latestUserMsgImage).then(res => extractedNote = res));
          }
      }

      // Wait for all pre-processing tasks
      if (tasks.length > 0) {
          await Promise.all(tasks);
      }

      // Resolve final text
      if (enrichedText !== text) {
          console.log(`[Context Resolved] "${text}" -> "${enrichedText}"`);
          finalInputText = enrichedText;
      }

      if (extractedNote) {
          console.log("[Visual OCR] Extracted Instruction:", extractedNote);
          finalInputText = text ? `${finalInputText}\n\n[DETECTED INSTRUCTION]: ${extractedNote}` : extractedNote;
          
          // Update user message and assistant message to reflect extraction
          updateMessage(userMsgId, { text: text || `[Screenshot Content]: ${extractedNote}` });
          updateMessage(responseId, { text: 'Đã đọc được yêu cầu trong ảnh. Đang xử lý...' });
      }

      finalInputText = `${brandContext}${finalInputText}`;

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

      // Truncate history to last 15 messages to avoid token bloat
      const realtimeHistory = [...messages, newUserMsg].slice(-15);

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

      // Convert result image to Blob URL to save RAM
      if (result.image) {
          result.image = await base64ToBlobUrl(result.image);
          setCurrentImage(result.image);
      }
      
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
              masterOversight: `Sử dụng Agent: ${result.meta?.agent || 'Multi-Agent'}`,
              modelUsed: result.meta?.model
          });

          // Convert all batch images to Blob URLs
          for (let i = 0; i < result.batchResults.length; i++) {
              if (result.batchResults[i].image) {
                  result.batchResults[i].image = await base64ToBlobUrl(result.batchResults[i].image);
              }
          }

          result.batchResults.forEach((res: any, idx: number) => {
              setTimeout(() => {
                  addMessage({
                      role: MessageRole.ASSISTANT,
                      text: `**Bước ${idx + 1}:**\n${res.text}`,
                      image: res.image,
                      imageLabel: getNextLabel(),
                      isProcessing: false,
                      modelUsed: res.meta?.model || result.meta?.model
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
            masterOversight: result.meta ? `Agent: ${result.meta.agent} | Mode: ${result.meta.intent}` : undefined,
            modelUsed: result.meta?.model
          });
      }

      // Background Memory Distillation
      distillMemory(realtimeHistory, memory)
        .then(newMemory => setMemory(newMemory))
        .catch(err => console.warn("[Synergy] Memory sync minor error", err));

      addToast("Xử lý hoàn tất", "success");

    } catch (error: any) {
      console.error("[Synergy Error]", error);
      
      let errorMessage = `❌ Hệ thống Synergy gặp gián đoạn: ${error.message}`;
      
      // If it's the generic error we just translated, or similar
      if (error.message && (error.message.includes('Không thể kết nối') || error.message.includes('Lỗi kết nối API'))) {
          errorMessage = `⚠️ ${error.message}`;
      }

      addToast("Có lỗi xảy ra trong quá trình xử lý", "error");
      
      // Handle 403 Permission Denied gracefully
      let smartActions: SmartAction[] | undefined = undefined;
      
      if (error.message && error.message.includes('403')) {
          errorMessage = `⚠️ Tính năng này đòi hỏi tài nguyên lớn hoặc mô hình cao cấp. Hệ thống đã cố gắng dùng mô hình dự phòng nhưng không thành công.`;
          smartActions = [{
              id: 'upgrade_pro',
              label: 'Kết nối API Key (Pro)',
              description: 'Mở khóa giới hạn',
              icon: 'Key',
              prompt: '/system OPEN_SETTINGS',
              type: 'technical'
          }, {
              id: 'retry_simple',
              label: 'Thử lại (Cơ bản)',
              description: 'Dùng mô hình miễn phí',
              icon: 'RefreshCw',
              prompt: text,
              type: 'primary'
          }];
      }

      if (error.message && error.message.includes('503')) {
          smartActions = [{
              id: 'retry_503',
              label: 'Thử lại (Retry)',
              description: 'Gửi lại yêu cầu vừa rồi',
              icon: '🔄',
              prompt: text,
              type: 'creative'
          }];
      }

      updateMessage(responseId, {
        text: errorMessage,
        isProcessing: false,
        smartActions
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
    currentImage, setCurrentImage, processUserPrompt, getNextLabel, clearChat
  };
};
