
import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { MessageRole, ScenarioCategory, SmartAction } from './types';
import { SCENARIO_LIBRARY, CATEGORIES } from './data/constants';
import { getCategoryConfig } from './features/sidebar/config';

// Hooks
import { useNeuralMemory } from './hooks/useNeuralMemory';
import { useChat } from './hooks/useChat';
import { useFileHandler } from './hooks/useFileHandler';
import { useAutomation } from './hooks/useAutomation';
import { useEditorFlow } from './hooks/useEditorFlow';

// Core Components (Critical Path)
import AppHeader from './components/AppHeader';
import Sidebar from './features/sidebar';
import ChatStream from './components/ChatStream';
import ControlPanel from './components/ControlPanel';

// Lazy Loaded Modules (Heavy)
const NeuralPanel = lazy(() => import('./components/NeuralPanel'));
const EditorCanvas = lazy(() => import('./features/editor/EditorCanvas/index'));
const BatchStudio = lazy(() => import('./features/batch/BatchStudio'));

const App: React.FC = () => {
  // 1. Core State
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>('Creative Studio');
  const [creativeDrift, setCreativeDrift] = useState(5);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBatchStudio, setShowBatchStudio] = useState(false);
  const [activeEngine, setActiveEngine] = useState<string | undefined>(undefined);
  
  // Track previous category to detect changes
  const prevCategoryRef = useRef<ScenarioCategory>(activeCategory);

  // 2. Custom Hooks Composition
  const { memory, setMemory, showMemory, setShowMemory, registry } = useNeuralMemory();
  
  const { 
    messages, setMessages, addMessage, inputText, setInputText, 
    isProcessing, setIsProcessing, mindStatus, setMindStatus, 
    currentImage, setCurrentImage, processUserPrompt, getNextLabel 
  } = useChat({ 
    onEngineChange: setActiveEngine,
    setMemory: setMemory 
  });

  const { 
    pendingRefImage, setPendingRefImage, isDragging, 
    handleDrop, handleDragOver, handleDragLeave, 
    handleFileUpload, triggerUpload 
  } = useFileHandler({ addMessage, setCurrentImage });

  const { 
    activeWorkflows, handleAutomationStart, handleConfirmPlan 
  } = useAutomation({ 
    addMessage, setMessages, setIsProcessing, setMindStatus, 
    setCurrentImage, getNextLabel, memory, onEngineChange: setActiveEngine
  });

  const { 
    editorState, setEditorState, handleEditImage, 
    handleEditorApply, handleUpscale, handleRemoveBg 
  } = useEditorFlow({ 
    addMessage, setMessages, setCurrentImage, 
    setIsProcessing, getNextLabel, memory,
    activeCategory,
    onEngineChange: setActiveEngine
  });

  // 3. Handlers
  const handleSend = () => {
     const text = inputText;
     setInputText('');
     processUserPrompt(text, memory, activeCategory);
  };

  const handleSmartAction = (action: SmartAction) => {
    processUserPrompt(action.prompt, memory, activeCategory);
  };

  const handleResetContext = () => {
    setCurrentImage(null);
    setPendingRefImage(null);
    addMessage({ role: MessageRole.SYSTEM, text: "Đã xóa ngữ cảnh làm việc." });
  };

  const handleVoiceCommand = (prompt: string, intent: string) => {
      console.log(`[Voice Bridge] ${intent}: ${prompt}`);
      // Only process valid intents
      if (['CREATE', 'EDIT', 'PLAN'].includes(intent)) {
          processUserPrompt(prompt, memory, activeCategory);
      }
  };

  // --- PERSONA SWITCHER LOGIC ---
  useEffect(() => {
    if (activeCategory !== prevCategoryRef.current) {
        // Only trigger if messages history is not empty (to avoid spamming on load)
        if (messages.length > 0) {
            const config = getCategoryConfig(activeCategory);
            const agentName = config.title;
            // Inject a subtle system message
            addMessage({ 
                role: MessageRole.ASSISTANT, 
                text: `**[SYSTEM SWITCH]** Đã chuyển sang chế độ **${agentName}**.\nTôi có thể giúp gì cho dự án ${activeCategory} của bạn?` 
            });
        }
        prevCategoryRef.current = activeCategory;
    }
  }, [activeCategory, messages.length, addMessage]);

  const currentConfig = getCategoryConfig(activeCategory);

  return (
    <div 
      className="flex h-screen bg-[#0a0f1d] text-white font-sans overflow-hidden relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
       {/* Drag Overlay */}
       {isDragging && (
         <div className="absolute inset-0 z-[60] bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
           <div className="text-3xl font-black text-blue-100 uppercase tracking-widest animate-bounce">
             Thả ảnh vào để phân tích
           </div>
         </div>
       )}

       <Sidebar 
         categories={CATEGORIES}
         activeCategory={activeCategory}
         onCategoryChange={setActiveCategory}
         scenarios={SCENARIO_LIBRARY}
         onScenarioSelect={(prompt) => setInputText(prompt)}
         onAutomationStart={handleAutomationStart}
         activeWorkflows={activeWorkflows}
         isOpen={showSidebar}
         onClose={() => setShowSidebar(false)}
         creativeDrift={creativeDrift}
         onDriftChange={setCreativeDrift}
         onOpenBatchStudio={() => setShowBatchStudio(true)}
       />
       
       <div className="flex-1 flex flex-col relative min-w-0">
          <AppHeader 
            mindStatus={mindStatus}
            activeEngine={activeEngine}
            onShowMemory={() => setShowMemory(true)}
            onUploadMain={() => triggerUpload(false)}
            showMemory={showMemory}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onAgentAction={handleVoiceCommand} // Pass Voice Bridge
          />

          <ChatStream 
             messages={messages}
             isProcessing={isProcessing}
             onSmartAction={handleSmartAction}
             onConfirmPlan={handleConfirmPlan}
             onEditImage={handleEditImage}
             onUpscaleImage={handleUpscale}
             onRemoveBg={handleRemoveBg}
          />

          <ControlPanel 
             inputText={inputText}
             setInputText={setInputText}
             isProcessing={isProcessing}
             hasCurrentImage={!!currentImage}
             onSend={handleSend}
             onUploadMain={() => triggerUpload(false)}
             onUploadRef={() => triggerUpload(true)}
             availableImages={messages.filter(m => m.image).map(m => ({ url: m.image!, label: m.imageLabel || 'IMG' }))}
             pendingMask={null}
             pendingPins={[]}
             pendingRefImage={pendingRefImage}
             onResetContext={handleResetContext}
             quickStarters={currentConfig.quickStarters} // Pass dynamic starters
          />
       </div>

       <Suspense fallback={null}>
         <NeuralPanel 
           isOpen={showMemory}
           onClose={() => setShowMemory(false)}
           memory={memory}
           registry={registry}
         />
       </Suspense>
       
       <Suspense fallback={null}>
         <EditorCanvas 
           state={editorState}
           onClose={() => setEditorState(prev => ({ ...prev, isOpen: false }))}
           onApply={handleEditorApply}
           onStateChange={(s) => setEditorState(prev => ({ ...prev, ...s }))}
           availableImages={messages.filter(m => m.image).map(m => ({ url: m.image!, label: m.imageLabel || 'IMG' }))}
         />
       </Suspense>
       
       {showBatchStudio && (
         <Suspense fallback={
            <div className="fixed inset-0 z-[60] bg-[#0a0f1d] flex items-center justify-center backdrop-blur-xl">
               <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">Initializing Batch Studio...</span>
               </div>
            </div>
         }>
           <BatchStudio onClose={() => setShowBatchStudio(false)} />
         </Suspense>
       )}
    </div>
  );
};

export default App;
