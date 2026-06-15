
import React, { useState, Suspense, lazy, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageRole, ScenarioCategory, SmartAction, BrandIdentity, Workflow } from './types';
import { SCENARIO_LIBRARY, CATEGORIES } from './data/constants';
import { getCategoryConfig } from './features/sidebar/config';

// Hooks
import { useNeuralMemory } from './hooks/useNeuralMemory';
import { useChat } from './hooks/useChat';
import { useFileHandler } from './hooks/useFileHandler';
import { useAutomation } from './hooks/useAutomation';
import { useEditorFlow } from './hooks/useEditorFlow';
import { useBrands } from './hooks/useBrands';
import { useToast } from './components/Toast';

// Core Components (Critical Path)
import AppHeader from './components/AppHeader';
import Sidebar from './features/sidebar';
import ChatStream from './components/ChatStream';
import ControlPanel from './components/ControlPanel';
import { Button } from './components/ui/Button';
import { KeyPoolModal } from './components/KeyPoolModal';
import { QuotaModal } from './components/QuotaModal';
import { hasKeyPool, getKeyPool, getPoolStatus } from './lib/keyManager';
import { Key, Activity } from 'lucide-react';

// Lazy Loaded Modules (Heavy)
const NeuralPanel = lazy(() => import('./components/NeuralPanel'));
const EditorCanvas = lazy(() => import('./features/editor/EditorCanvas'));
const BatchStudio = lazy(() => import('./features/batch/BatchStudio'));
const BrandStudio = lazy(() => import('./components/BrandStudio').then(module => ({ default: module.BrandStudio })));

import { auth, onAuthStateChanged, User } from './firebase';

const App: React.FC = () => {
  const { addToast } = useToast();
  // 1. Core State
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>('Creative Studio');
  const [creativeDrift, setCreativeDrift] = useState(5);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBatchStudio, setShowBatchStudio] = useState(false);
  const [showBrandStudio, setShowBrandStudio] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const { brands, setBrands, activeBrandId, setActiveBrandId, isLoading: isBrandsLoading } = useBrands();

  const activeBrand = brands.find(b => b.id === activeBrandId) || null;
  const [activeEngine, setActiveEngine] = useState<string | undefined>(undefined);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isKeyPoolOpen, setIsKeyPoolOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [poolActive, setPoolActive] = useState(hasKeyPool());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      if (process.env.GEMINI_API_KEY) {
        setHasKey(true);
        localStorage.setItem('has_user_api_key', 'true');
      } else if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
        localStorage.setItem('has_user_api_key', selected ? 'true' : 'false');
      } else {
        setHasKey(true);
        localStorage.setItem('has_user_api_key', 'true');
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      localStorage.setItem('has_user_api_key', 'true');
    }
  };
  
  // Track previous category to detect changes
  const prevCategoryRef = useRef<ScenarioCategory>(activeCategory);

  // 2. Custom Hooks Composition
  const { memory, setMemory, showMemory, setShowMemory, registry } = useNeuralMemory(user);
  
  const { 
    messages, setMessages, addMessage, inputText, setInputText, 
    isProcessing, setIsProcessing, mindStatus, setMindStatus, 
    currentImage, setCurrentImage, processUserPrompt, getNextLabel, clearChat 
  } = useChat({ 
    onEngineChange: setActiveEngine,
    setMemory: setMemory,
    brandIdentity: activeBrand
  });

  const { 
    pendingRefImage, setPendingRefImage, isDragging, 
    handleDrop, handleDragOver, handleDragLeave, 
    triggerUpload 
  } = useFileHandler({ addMessage, setCurrentImage });

  const handleWorkflowComplete = useCallback((workflow: Workflow) => {
    if (workflow.type === 'Branding' && workflow.resultImages && workflow.resultImages.length > 0) {
      setBrands(prev => {
        const activeBrand = prev.find(b => b.id === activeBrandId);
        if (activeBrand) {
          return prev.map(b => {
            if (b.id === activeBrandId) {
              const newProjects = workflow.resultImages!.map((img, i) => ({
                id: Math.random().toString(36).substring(7),
                name: `Branding Result ${i + 1}`,
                imageUrl: img,
                date: new Date().toISOString()
              }));
              return {
                ...b,
                projects: [...(b.projects || []), ...newProjects]
              };
            }
            return b;
          });
        } else {
          const newBrand: BrandIdentity = {
            id: Math.random().toString(36).substring(7),
            name: `Brand from ${workflow.name}`,
            logoUrl: workflow.gatheredInfo?.logoAsset || undefined,
            primaryColor: workflow.gatheredInfo?.brandInfo?.color || undefined,
            toneOfVoice: workflow.gatheredInfo?.brandInfo?.vibe || undefined,
            projects: workflow.resultImages!.map((img, i) => ({
              id: Math.random().toString(36).substring(7),
              name: `Branding Result ${i + 1}`,
              imageUrl: img,
              date: new Date().toISOString()
            })),
            lastUpdated: new Date().toISOString()
          };
          setTimeout(() => setActiveBrandId(newBrand.id!), 0);
          return [...prev, newBrand];
        }
      });
    }
  }, [activeBrandId]);

  const { 
    activeWorkflows, handleAutomationStart, handleConfirmPlan 
  } = useAutomation({ 
    addMessage, setMessages, setIsProcessing, setMindStatus, 
    setCurrentImage, getNextLabel, memory, onEngineChange: setActiveEngine,
    onWorkflowComplete: handleWorkflowComplete
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
    addToast("Đã xóa ngữ cảnh làm việc", "info");
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

  if (isBrandsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0f1d]" aria-busy="true" aria-label="Loading application">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen bg-[#0a0f1d] text-white font-sans overflow-hidden relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
       {/* Drag Overlay */}
       <AnimatePresence>
       {isDragging && (
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           className="absolute inset-0 z-[60] bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed flex items-center justify-center pointer-events-none"
         >
           <div className="text-3xl font-black text-blue-100 uppercase tracking-widest animate-bounce">
             Thả ảnh vào để phân tích
           </div>
         </motion.div>
       )}
       </AnimatePresence>

       <AnimatePresence mode="wait">
       {showSidebar && (
         <motion.div
           initial={{ x: -300, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           exit={{ x: -300, opacity: 0 }}
           transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
           className="h-full z-40"
         >
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
             onOpenBrandStudio={() => setShowBrandStudio(true)}
             brandIdentity={activeBrand}
             brands={brands}
             onSetActiveBrand={setActiveBrandId}
             onUpdateBrands={setBrands}
           />
         </motion.div>
       )}
       </AnimatePresence>
       
       <div className="flex-1 flex flex-col relative min-w-0">
          {/* API KEY SUGGESTION/STATUS BAR */}
          <div className={`px-6 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest z-50 transition-colors duration-500 ${hasKey ? 'bg-zinc-900/80 text-zinc-400 border-b border-zinc-800' : 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white'}`}>
             <div className="flex items-center gap-2">
                <span className="text-sm">{hasKey ? '🚀' : '✨'}</span>
                <span>{hasKey ? 'Đang sử dụng chế độ Pro (Đã kết nối API Key).' : 'Đang sử dụng chế độ Miễn phí. Kết nối API Key (Pro) để mở khóa chất lượng 4K & mô hình nâng cao.'}</span>
             </div>
             <div className="flex items-center gap-3">
                {!hasKey && <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-blue-200 hover:text-white lowercase normal-case text-xs font-medium">Lấy Key miễn phí</a>}
                
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="secondary" 
                    onClick={() => setIsQuotaModalOpen(true)} 
                    className={`${hasKey ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-blue-700 text-white hover:bg-blue-800'} px-3 py-1 rounded-md transition-all shadow-sm h-auto text-xs flex items-center gap-1.5`}
                  >
                    <Activity size={12} />
                    Hạn mức
                  </Button>

                  <Button 
                    variant="secondary" 
                    onClick={() => setIsKeyPoolOpen(true)} 
                    className={`${hasKey ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-blue-700 text-white hover:bg-blue-800'} px-3 py-1 rounded-md transition-all shadow-sm h-auto text-xs flex items-center gap-1.5`}
                  >
                    <Key size={12} className={poolActive ? 'text-green-400' : ''} />
                    {poolActive ? (
                      <span className="flex items-center gap-1">
                        Pool: {getPoolStatus().currentIndex + 1}/{getPoolStatus().size}
                        {getPoolStatus().cooldowns > 0 && <span className="text-red-400 ml-1">({getPoolStatus().cooldowns} CD)</span>}
                      </span>
                    ) : 'Key Pool'}
                  </Button>

                  <Button variant="secondary" onClick={handleSelectKey} className={`${hasKey ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-white text-blue-600 hover:bg-blue-50'} px-3 py-1 rounded-md transition-all shadow-sm h-auto text-xs`}>
                    {hasKey ? 'Đổi API Key' : 'Kết nối API Key'}
                  </Button>
                </div>
             </div>
          </div>

          <AppHeader 
            mindStatus={mindStatus}
            activeEngine={activeEngine}
            onShowMemory={() => setShowMemory(true)}
            onUploadMain={() => triggerUpload(false)}
            showMemory={showMemory}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onAgentAction={handleVoiceCommand} // Pass Voice Bridge
            onClearChat={clearChat}
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

       {/* MODALS */}
       <QuotaModal 
         isOpen={isQuotaModalOpen} 
         onClose={() => setIsQuotaModalOpen(false)} 
       />

       <KeyPoolModal 
         isOpen={isKeyPoolOpen} 
         onClose={() => {
           setIsKeyPoolOpen(false);
           setPoolActive(hasKeyPool());
         }} 
       />

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
       
       <AnimatePresence>
       {showBatchStudio && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: 20 }}
           className="fixed inset-0 z-[60]"
         >
           <Suspense fallback={
              <div className="fixed inset-0 z-[60] bg-[#0a0f1d] flex items-center justify-center backdrop-blur-xl">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse">Initializing Batch Studio...</span>
                 </div>
              </div>
           }>
             <BatchStudio 
               onClose={() => setShowBatchStudio(false)} 
               brands={brands}
               activeBrandId={activeBrandId}
               onUpdateBrands={setBrands}
             />
           </Suspense>
         </motion.div>
       )}
       </AnimatePresence>

       <AnimatePresence>
       {showBrandStudio && (
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: 20 }}
           className="fixed inset-0 z-[60]"
         >
           <Suspense fallback={
              <div className="fixed inset-0 z-[60] bg-[#0a0f1d] flex items-center justify-center backdrop-blur-xl">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-black text-purple-500 uppercase tracking-[0.3em] animate-pulse">Initializing Brand Studio...</span>
                 </div>
              </div>
           }>
             <BrandStudio 
               brands={brands}
               activeBrandId={activeBrandId}
               onUpdateBrands={(newBrands) => setBrands(newBrands)}
               onSetActiveBrand={(id) => setActiveBrandId(id)}
               onClose={() => setShowBrandStudio(false)}
             />
           </Suspense>
         </motion.div>
       )}
       </AnimatePresence>
    </div>
  );
};

export default App;
