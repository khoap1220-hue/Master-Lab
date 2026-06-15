
import React, { useState, useCallback } from 'react';
import { Workflow, ScenarioCategory, MemoryInsight, ChatMessage, MessageRole } from '../types';
import { dispatchWorkflow } from '../services/flows/automationOrchestrator';
import { useToast } from '../components/Toast';

interface UseAutomationProps {
  addMessage: (msg: Partial<ChatMessage>) => string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsProcessing: (val: boolean) => void;
  setMindStatus: (val: 'idle' | 'observing' | 'planning' | 'syncing') => void;
  setCurrentImage: (img: string | null) => void;
  getNextLabel: () => string;
  memory: MemoryInsight;
  onEngineChange: (engine: string | undefined) => void;
  onWorkflowComplete?: (workflow: Workflow) => void;
}

export const useAutomation = ({
  addMessage,
  setMessages,
  setIsProcessing,
  setMindStatus,
  setCurrentImage,
  getNextLabel,
  memory,
  onEngineChange,
  onWorkflowComplete
}: UseAutomationProps) => {
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);
  const { addToast } = useToast();

  // Helper to update workflow state safely
  const updateWorkflow = useCallback((id: string, updates: Partial<Workflow>) => {
    setActiveWorkflows(prev => {
      const next = prev.map(wf => wf.id === id ? { ...wf, ...updates } : wf);
      
      if (updates.status === 'completed' && onWorkflowComplete) {
        const completedWf = next.find(wf => wf.id === id);
        if (completedWf) {
           onWorkflowComplete(completedWf);
        }
      }
      return next;
    });
  }, [onWorkflowComplete]);

  const handleAutomationStart = async (
    goal: string, 
    batchSize: number, 
    category: ScenarioCategory, 
    logoAsset: string | null,
    moodboardAssets?: string[],
    brandUrl?: string,
    brandInfo?: { color: string; vibe: string }
  ) => {
    setIsProcessing(true);
    setMindStatus('planning');
    
    // Create new workflow entry
    const wfId = Math.random().toString(36).substring(7);
    const newWorkflow: Workflow = {
      id: wfId,
      name: `Initializing ${category}...`, // Will be updated by orchestrator
      type: category,
      status: 'planning',
      progress: 5,
      tasks: [],
      gatheredInfo: { logoAsset, moodboardAssets, brandUrl, brandInfo },
      resultImages: [] 
    };
    setActiveWorkflows(prev => [newWorkflow, ...prev]);

    try {
      addToast(`Bắt đầu tự động hóa: ${category}`, 'info');
      // Delegate Logic to Orchestrator Service
      await dispatchWorkflow(
          wfId,
          category,
          goal,
          batchSize,
          { logoAsset, moodboardAssets, brandUrl, brandInfo },
          {
              memory,
              addMessage,
              setMessages,
              onEngineChange,
              getNextLabel,
              updateWorkflow
          }
      );
      addToast(`Hoàn tất tự động hóa: ${category}`, 'success');
    } catch (e: any) {
      console.error("Automation failed", e);
      updateWorkflow(wfId, { status: 'failed', name: `Failed: ${e.message || 'Unknown error'}` });
      addMessage({ role: MessageRole.ASSISTANT, text: `❌ Lỗi khi chạy Automation: ${e.message || 'Lỗi không xác định'}` });
      addToast(`Lỗi tự động hóa: ${e.message || 'Lỗi không xác định'}`, 'error');
    } finally {
      setIsProcessing(false);
      setMindStatus('idle');
    }
  };

  return { activeWorkflows, setActiveWorkflows, handleAutomationStart, handleConfirmPlan: () => {} };
};
