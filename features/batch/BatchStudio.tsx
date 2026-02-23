
import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { BatchJob, ProcessStatus, Pin, EditorState, RefreshStrategy } from '../../types';
import { fileToBase64 } from '../../lib/utils';
import EditorCanvas from '../editor/EditorCanvas/index'; 
import BatchPreview from './components/BatchPreview';
import BatchHeader from './components/BatchHeader';
import BatchSidebar from './components/BatchSidebar';
import { useBatchProcessing, BatchMode } from './hooks/useBatchProcessing';

// Memoized Components for Performance
const MemoBatchSidebar = memo(BatchSidebar);
const MemoBatchPreview = memo(BatchPreview);

interface BatchStudioProps {
  onClose: () => void;
  initialJobs?: BatchJob[];
}

const BatchStudio: React.FC<BatchStudioProps> = ({ onClose, initialJobs = [] }) => {
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobs.length > 0 ? initialJobs[0].id : null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); // Assume true initially
  
  // Brand State
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandAssets, setBrandAssets] = useState<string[]>([]);
  const [brandVibe, setBrandVibe] = useState('');
  const [brandColor, setBrandColor] = useState('#000000');
  const [rebrandStyle, setRebrandStyle] = useState('');
  
  // Refresh State
  const [targetText, setTargetText] = useState('');
  const [refreshStrategy, setRefreshStrategy] = useState<RefreshStrategy>('HYBRID');

  // Viral State
  const [platform, setPlatform] = useState("TikTok");
  const [duration, setDuration] = useState("15s");

  // Packaging State
  const [packDimensions, setPackDimensions] = useState({ w: 10, h: 15, d: 5 });
  const [packType, setPackType] = useState("TuckEnd");

  // Photography Params
  const [batchCount, setBatchCount] = useState(1);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [modelRefImage, setModelRefImage] = useState<string | null>(null);

  // Check API Key on mount and when mode changes
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per docs
    }
  };

  // Memoize config
  const batchConfig = useMemo(() => ({
    brandLogo, brandAssets, brandVibe, brandColor, rebrandStyle,
    targetText, refreshStrategy, platform, duration,
    packDimensions, packType, batchCount, isAutoPilot, modelRefImage
  }), [brandLogo, brandAssets, brandVibe, brandColor, rebrandStyle, targetText, refreshStrategy, platform, duration, packDimensions, packType, batchCount, isAutoPilot, modelRefImage]);

  const { 
    jobs, setJobs, isProcessing, setIsProcessing, mode, setMode, updateJobStatus, triggerVideoGeneration, selectViralHook, deselectViralHook, triggerQuoteGeneration
  } = useBatchProcessing(initialJobs, batchConfig);

  // Editor State
  const [editingContextId, setEditingContextId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({ isOpen: false, image: null, strokes: [], pins: [], currentStroke: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const assetsInputRef = useRef<HTMLInputElement>(null);

  const handleRemoveJob = useCallback((id: string) => {
    setJobs(prev => {
        const newJobs = prev.filter(j => j.id !== id);
        if (activeJobId === id) setActiveJobId(newJobs.length > 0 ? newJobs[0].id : null);
        return newJobs;
    });
  }, [activeJobId, setJobs]);

  const handleEditJob = useCallback((job: BatchJob) => {
    setEditingContextId(job.id);
    setEditorState({ isOpen: true, image: job.originalUrl, strokes: [], pins: [], currentStroke: null });
  }, []);

  const handleRetryJob = useCallback((job: BatchJob) => {
    updateJobStatus(job.id, 'queued');
    setIsProcessing(true);
  }, [updateJobStatus, setIsProcessing]);

  const handleEditorApply = (mask: string, composite: string, pins: Pin[]) => {
    if (editingContextId) {
      updateJobStatus(editingContextId, 'queued', { maskUrl: mask });
      setEditorState(prev => ({ ...prev, isOpen: false }));
      setEditingContextId(null);
      setIsProcessing(true); 
    }
  };

  const handleBrandAssets = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const base64s = await Promise.all(files.map(fileToBase64));
      setBrandAssets(prev => [...prev, ...base64s].slice(0, 5));
      e.target.value = '';
    }
  };

  const handleBrandLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setBrandLogo(base64);
      e.target.value = '';
    }
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files.length > 0) {
        const newJobs = [];
        for (let i = 0; i < e.target.files.length; i++) {
           const file = e.target.files[i];
           const base64 = await fileToBase64(file);
           newJobs.push({ 
               id: Math.random().toString(36).substr(2, 9), 
               file, originalUrl: base64, thumbnailUrl: base64, 
               status: 'queued' as ProcessStatus, 
               dimensions: { width: 0, height: 0 } 
           });
        }
        setJobs(prev => [...prev, ...newJobs]);
        if (!activeJobId && newJobs.length > 0) setActiveJobId(newJobs[0].id);
        e.target.value = '';
     }
  };

  const handleStartProcessing = () => {
      // Barrier for Advanced Modes
      const advancedModes: BatchMode[] = ['viral-story', 'product-360', 'ux-flow', 'product-photography', 'structural-architect'];
      if (advancedModes.includes(mode) && !hasApiKey) {
          handleSelectKey();
          return;
      }

      if (mode === 'ad-campaign' && jobs.length === 0 && targetText.trim()) {
          const lines = targetText.split('\n').filter(l => l.trim().length > 0);
          const newJobs = lines.map((line, idx) => {
              const id = Math.random().toString(36).substr(2, 9);
              const label = line.split('|')[0].trim() || `Campaign ${idx + 1}`;
              const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1080'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='sans-serif' font-weight='bold' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E${label}%3C/text%3E%3C/svg%3E`;
              return {
                  id, file: new File([""], line, { type: "text/plain" }),
                  originalUrl: placeholderSvg, thumbnailUrl: placeholderSvg,
                  status: 'queued' as ProcessStatus, dimensions: { width: 1080, height: 1080 }
              };
          });
          setJobs(prev => [...prev, ...newJobs]);
          if (newJobs.length > 0) setActiveJobId(newJobs[0].id);
          setTimeout(() => setIsProcessing(true), 100);
          return;
      }

      if ((mode === 'viral-story' || mode === 'ux-flow') && jobs.length === 0) {
          const id = Math.random().toString(36).substr(2, 9);
          const label = mode === 'viral-story' ? 'Viral Story Plan' : 'UX Flow Plan';
          const placeholderSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1080'%3E%3Crect width='100%25' height='100%25' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='sans-serif' font-size='40' text-anchor='middle' dominant-baseline='middle'%3E${label}%3C/text%3E%3C/svg%3E`;
          const syntheticJob: BatchJob = {
              id, file: new File([""], label, { type: "text/plain" }),
              originalUrl: placeholderSvg, thumbnailUrl: placeholderSvg,
              status: 'queued', dimensions: { width: 1080, height: 1080 }
          };
          setJobs(prev => [...prev, syntheticJob]);
          setActiveJobId(id);
          setTimeout(() => setIsProcessing(true), 50);
      } else {
          setIsProcessing(true);
      }
  };

  const stats = { total: jobs.length, completed: jobs.filter(j => j.status === 'completed').length };
  const globalProgress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const activeJob = jobs.find(j => j.id === activeJobId);

  const brandProps = useMemo(() => ({ 
      brandLogo, brandAssets, brandVibe, brandColor, rebrandStyle, setBrandVibe, setBrandColor, setRebrandStyle,
      targetText, setTargetText, refreshStrategy, setRefreshStrategy, platform, setPlatform,
      duration, setDuration, packDimensions, setPackDimensions, packType, setPackType,
      batchCount, setBatchCount, isAutoPilot, setIsAutoPilot, modelRefImage, setModelRefImage 
  }), [brandLogo, brandAssets, brandVibe, brandColor, rebrandStyle, targetText, refreshStrategy, platform, duration, packDimensions, packType, batchCount, setBatchCount, isAutoPilot, setIsAutoPilot, modelRefImage]);

  const onUploadLogo = useCallback(() => logoInputRef.current?.click(), []);
  const onUploadAssets = useCallback(() => assetsInputRef.current?.click(), []);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0f1d] flex flex-col animate-in fade-in duration-300">
      <div className="h-1 bg-slate-800 w-full">
         <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${globalProgress}%` }}></div>
      </div>

      {/* API KEY WARNING BAR */}
      {!hasApiKey && ['viral-story', 'product-360', 'ux-flow', 'product-photography', 'structural-architect'].includes(mode) && (
        <div className="bg-orange-600/90 text-white px-8 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top-full duration-500">
           <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>Yêu cầu API Key trả phí để sử dụng tính năng tạo ảnh/video cao cấp.</span>
           </div>
           <button onClick={handleSelectKey} className="bg-white text-orange-600 px-4 py-1 rounded-lg hover:bg-orange-50 transition-all">Chọn API Key</button>
        </div>
      )}

      <BatchHeader 
        onClose={onClose} mode={mode} setMode={setMode} isProcessing={isProcessing}
        onStart={handleStartProcessing} 
        onAddFiles={() => fileInputRef.current?.click()}
        queuedCount={jobs.filter(j => j.status === 'queued').length}
      />

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleAddFiles} />
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleBrandLogo} />
      <input type="file" ref={assetsInputRef} className="hidden" multiple accept="image/*" onChange={handleBrandAssets} />

      <div className="flex-1 flex overflow-hidden">
        <MemoBatchSidebar 
            mode={mode} fontSubMode={'generate'} setFontSubMode={() => {}}
            jobs={jobs} activeJobId={activeJobId} setActiveJobId={setActiveJobId} onRemoveJob={handleRemoveJob}
            brandProps={brandProps}
            onUploadLogo={onUploadLogo}
            onUploadAssets={onUploadAssets}
        />

        <div className="flex-1 bg-black/90 flex flex-col relative overflow-hidden">
           <MemoBatchPreview 
             activeJob={activeJob} 
             mode={mode} 
             isProcessing={isProcessing} 
             onEditJob={handleEditJob} 
             onRetryJob={handleRetryJob}
             onRegenerate={() => {}}
             onRenameGlyph={() => {}}
             onGenerateVideo={triggerVideoGeneration}
             onSelectHook={selectViralHook}
             onDeselectHook={deselectViralHook}
             onGenerateQuoteImage={triggerQuoteGeneration} // Pass the handler
           />
        </div>
      </div>

      <EditorCanvas 
        state={editorState}
        onClose={() => setEditorState(prev => ({ ...prev, isOpen: false }))}
        onApply={handleEditorApply}
        onStateChange={(s) => setEditorState(prev => ({ ...prev, ...s }))}
        availableImages={brandLogo ? [{ url: brandLogo, label: 'BRAND_LOGO' }] : []}
        initialMode={mode === 'auto-mockup' ? 'mockup' : 'draw'}
      />
    </div>
  );
};

export default BatchStudio;
