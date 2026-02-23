
import React, { useState, useCallback } from 'react';
import { Workflow, ScenarioCategory, MemoryInsight, ChatMessage } from '../types';
import { dispatchWorkflow } from '../services/flows/automationOrchestrator';

interface UseAutomationProps {
  addMessage: (msg: Partial<ChatMessage>) => string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsProcessing: (val: boolean) => void;
  setMindStatus: (val: 'idle' | 'observing' | 'planning' | 'syncing') => void;
  setCurrentImage: (img: string | null) => void;
  getNextLabel: () => string;
  memory: MemoryInsight;
  onEngineChange: (engine: string | undefined) => void;
}

export const useAutomation = ({
  addMessage,
  setMessages,
  setIsProcessing,
  setMindStatus,
  setCurrentImage,
  getNextLabel,
  memory,
  onEngineChange
}: UseAutomationProps) => {
  const [activeWorkflows, setActiveWorkflows] = useState<Workflow[]>([]);

  // Helper to update workflow state safely
  const updateWorkflow = useCallback((id: string, updates: Partial<Workflow>) => {
    setActiveWorkflows(prev => prev.map(wf => wf.id === id ? { ...wf, ...updates } : wf));
  }, []);

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

    setIsProcessing(false);
    setMindStatus('idle');
  };

  return { activeWorkflows, setActiveWorkflows, handleAutomationStart, handleConfirmPlan: () => {} };
};
