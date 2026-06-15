
import React, { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { BatchJob, ProcessStatus, Pin, EditorState, RefreshStrategy, BrandIdentity } from '../../types';
import { fileToBase64, resizeImage } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Key } from 'lucide-react';
import { hasKeyPool, getKeyPool, getPoolStatus } from '../../lib/keyManager';
import { KeyPoolModal } from '../../components/KeyPoolModal';
import { useToast } from '../../components/Toast';
import EditorCanvas from '../editor/EditorCanvas'; 
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
  brands?: BrandIdentity[];
  activeBrandId?: string | null;
  onUpdateBrands?: (brands: BrandIdentity[]) => void;
}

const BatchStudio: React.FC<BatchStudioProps> = ({ onClose, initialJobs = [], brands = [], activeBrandId = null, onUpdateBrands }) => {
  const { addToast } = useToast();
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobs.length > 0 ? initialJobs[0].id : null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); // Assume true initially
  const [isKeyPoolOpen, setIsKeyPoolOpen] = useState(false);
  const [poolActive, setPoolActive] = useState(hasKeyPool());
  
  // Brand State
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandAssets, setBrandAssets] = useState<string[]>([]);
  const [brandVibe, setBrandVibe] = useState('');
  const [brandColor, setBrandColor] = useState('#000000');
  const [rebrandStyle, setRebrandStyle] = useState('');

  // Sync with Brand Studio
  useEffect(() => {
    if (activeBrandId && brands.length > 0) {
      const activeBrand = brands.find(b => b.id === activeBrandId);
      if (activeBrand) {
        setBrandLogo(activeBrand.logoUrl || null);
        setBrandColor(activeBrand.primaryColor || '#000000');
        setBrandVibe(activeBrand.toneOfVoice || '');
        if (activeBrand.projects) {
          setBrandAssets(activeBrand.projects.map(p => p.imageUrl));
        }
      }
    }
  }, [activeBrandId]); // Removed brands from dependency to avoid infinite loop when updating brands

  // Sync back to Brand Studio
  const updateActiveBrand = useCallback((updates: Partial<BrandIdentity>) => {
    if (activeBrandId && onUpdateBrands) {
      const updatedBrands = brands.map(b => 
        b.id === activeBrandId ? { ...b, ...updates, lastUpdated: new Date().toISOString() } : b
      );
      onUpdateBrands(updatedBrands);
    }
  }, [activeBrandId, brands, onUpdateBrands]);
  
  // Refresh State
  const [targetText, setTargetText] = useState('');
  const [refreshStrategy, setRefreshStrategy] = useState<RefreshStrategy>('HYBRID');

  // Viral State
  const [platform, setPlatform] = useState("TikTok");
  const [duration, setDuration] = useState("10s");

  // Packaging State
  const [packDimensions, setPackDimensions] = useState({ w: 10, h: 15, d: 5 });
  const [packType, setPackType] = useState("TuckEnd");

  // Photography Params
  const [batchCount, setBatchCount] = useState(1);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [modelRefImage, setModelRefImage] = useState<string | null>(null);

  // Video Params
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [videoAudioEnabled, setVideoAudioEnabled] = useState(true);
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");

  // Check API Key on mount and when mode changes
  useEffect(() => {
    const checkKey = async () => {
      if (process.env.GEMINI_API_KEY || process.env.API_KEY) {
        setHasApiKey(true);
      } else if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true);
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
    packDimensions, packType, batchCount, isAutoPilot, modelRefImage,
    videoResolution, videoAudioEnabled, videoAspectRatio
  }), [brandLogo, brandAssets, brandVibe, brandColor, rebrandStyle, targetText, refreshStrategy, platform, duration, packDimensions, packType, batchCount, isAutoPilot, modelRefImage, videoResolution, videoAudioEnabled, videoAspectRatio]);

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
        const jobToRemove = prev.find(j => j.id === id);
        if (jobToRemove) {
            if (jobToRemove.originalUrl && jobToRemove.originalUrl.startsWith('blob:')) URL.revokeObjectURL(jobToRemove.originalUrl);
            if (jobToRemove.resultUrl && jobToRemove.resultUrl.startsWith('blob:')) URL.revokeObjectURL(jobToRemove.resultUrl);
            if (jobToRemove.resultVideoUrl && jobToRemove.resultVideoUrl.startsWith('blob:')) URL.revokeObjectURL(jobToRemove.resultVideoUrl);
            if (jobToRemove.maskUrl && jobToRemove.maskUrl.startsWith('blob:')) URL.revokeObjectURL(jobToRemove.maskUrl);
            if (jobToRemove.referenceUrls) {
                jobToRemove.referenceUrls.forEach(url => {
                    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
                });
            }
            if (jobToRemove.extractedAssets) {
                jobToRemove.extractedAssets.forEach(asset => {
                    if (asset.flattenedUrl && asset.flattenedUrl.startsWith('blob:')) URL.revokeObjectURL(asset.flattenedUrl);
                    if (asset.rebrandedUrl && asset.rebrandedUrl.startsWith('blob:')) URL.revokeObjectURL(asset.rebrandedUrl);
                });
            }
        }
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
      const files = Array.from(e.target.files) as File[];
      const base64s = await Promise.all(files.map(async (file) => {
        let b64 = await fileToBase64(file);
        try {
          // Resize to a smaller dimension to save space in localStorage
          b64 = await resizeImage(b64, 800, false, 0.7);
        } catch (e) {
          console.error("Failed to resize brand asset:", e);
        }
        return b64;
      }));
      
      setBrandAssets(prev => {
        const newAssets = (mode === 'omnilora' || mode === 'omni-slider') ? [...prev, ...base64s] : [...prev, ...base64s].slice(0, 5);
        if (activeBrandId) {
          const activeBrand = brands.find(b => b.id === activeBrandId);
          if (activeBrand) {
            const newProjects = base64s.map((b64, i) => ({
              id: Math.random().toString(36).substring(7),
              name: `Asset ${i + 1}`,
              imageUrl: b64,
              date: new Date().toISOString()
            }));
            updateActiveBrand({ projects: [...(activeBrand.projects || []), ...newProjects] });
          }
        }
        return newAssets;
      });
      e.target.value = '';
    }
  };

  const handleBrandLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let base64 = await fileToBase64(e.target.files[0]);
      try {
        base64 = await resizeImage(base64, 500, true, 0.8);
      } catch (e) {
        console.error("Failed to resize brand logo:", e);
      }
      setBrandLogo(base64);
      updateActiveBrand({ logoUrl: base64 });
      e.target.value = '';
    }
  };

  const handleBrandColorChange = (color: string) => {
    setBrandColor(color);
    updateActiveBrand({ primaryColor: color });
  };

  const handleBrandVibeChange = (vibe: string) => {
    setBrandVibe(vibe);
    updateActiveBrand({ toneOfVoice: vibe });
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files.length > 0) {
        const newJobs = [];
        if (mode === 'studio-videos') {
            const files = Array.from(e.target.files).slice(0, 4) as File[];
            const objectUrls = files.map(f => URL.createObjectURL(f));
            newJobs.push({
                id: Math.random().toString(36).substr(2, 9),
                file: files[0],
                originalUrl: objectUrls[0],
                thumbnailUrl: objectUrls[0],
                referenceUrls: objectUrls.slice(1),
                referenceBlobs: files.slice(1),
                status: 'queued' as ProcessStatus,
                dimensions: { width: 0, height: 0 }
            });
        } else {
            for (let i = 0; i < e.target.files.length; i++) {
               const file = e.target.files[i];
               const objectUrl = URL.createObjectURL(file);
               newJobs.push({ 
                   id: Math.random().toString(36).substr(2, 9), 
                   file, originalUrl: objectUrl, thumbnailUrl: objectUrl, 
                   status: 'queued' as ProcessStatus, 
                   dimensions: { width: 0, height: 0 } 
               });
            }
        }
        setJobs(prev => [...prev, ...newJobs]);
        if (!activeJobId && newJobs.length > 0) setActiveJobId(newJobs[0].id);
        e.target.value = '';
     }
  };

  const handleStartProcessing = () => {
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

      if ((mode === 'viral-story' || mode === 'ux-flow' || mode === 'automation-multi-task' || mode === 'omnilora' || mode === 'omni-slider') && jobs.length === 0) {
          const id = Math.random().toString(36).substr(2, 9);
          let label = 'Task';
          if (mode === 'viral-story') label = 'Viral Story Plan';
          else if (mode === 'ux-flow') label = 'UX Flow Plan';
          else if (mode === 'automation-multi-task') label = 'Tự Động Hóa Đa Nhiệm';
          else if (mode === 'omnilora') label = 'OmniLoRA Comic Plan';
          else if (mode === 'omni-slider') label = 'Omni Slider Plan';

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

  const handleRenderSlider = useCallback((jobId: string, approvedSlides: any[]) => {
    updateJobStatus(jobId, 'queued', { 
        omniLoraInputs: {
            ...jobs.find(j => j.id === jobId)?.omniLoraInputs,
            sliderScript: approvedSlides,
            isRenderingPhase: true,
            packType: packType // Save the selected aspect ratio
        } as any
    });
    setIsProcessing(true);
  }, [jobs, packType, updateJobStatus]);

  const stats = { total: jobs.length, completed: jobs.filter(j => j.status === 'completed').length };
  const globalProgress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const activeJob = jobs.find(j => j.id === activeJobId);

  // Monitor processing completion for notifications
  const prevProcessingRef = useRef(isProcessing);
  useEffect(() => {
    if (prevProcessingRef.current && !isProcessing) {
      // Processing just finished
      const failedJobs = jobs.filter(j => j.status === 'failed');
      if (failedJobs.length > 0) {
        addToast(`Hoàn tất xử lý. Có ${failedJobs.length} tác vụ bị lỗi.`, "error");
      } else if (jobs.length > 0 && globalProgress === 100) {
        addToast("Đã hoàn tất xử lý toàn bộ tác vụ!", "success");
      }
    }
    prevProcessingRef.current = isProcessing;
  }, [isProcessing, jobs, globalProgress, addToast]);

  const brandProps = useMemo(() => ({ 
      brandLogo, brandAssets, brandVibe, brandColor, rebrandStyle, setBrandVibe: handleBrandVibeChange, setBrandColor: handleBrandColorChange, setRebrandStyle,
      targetText, setTargetText, refreshStrategy, setRefreshStrategy, platform, setPlatform,
      duration, setDuration, packDimensions, setPackDimensions, packType, setPackType,
      batchCount, setBatchCount, isAutoPilot, setIsAutoPilot, modelRefImage, setModelRefImage,
      videoResolution, setVideoResolution, videoAudioEnabled, setVideoAudioEnabled, videoAspectRatio, setVideoAspectRatio
  }), [brandLogo, brandAssets, brandVibe, brandColor, rebrandStyle, targetText, refreshStrategy, platform, duration, packDimensions, packType, batchCount, setBatchCount, isAutoPilot, setIsAutoPilot, modelRefImage, videoResolution, setVideoResolution, videoAudioEnabled, setVideoAudioEnabled, videoAspectRatio, setVideoAspectRatio]);

  const onUploadLogo = useCallback(() => logoInputRef.current?.click(), []);
  const onUploadAssets = useCallback(() => assetsInputRef.current?.click(), []);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0f1d] flex flex-col animate-in fade-in duration-300">
      <div className="h-1 bg-zinc-800 w-full">
         <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${globalProgress}%` }}></div>
      </div>

      {/* API KEY SUGGESTION/STATUS BAR */}
      <div className={`px-8 py-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${hasApiKey ? 'bg-zinc-900/80 text-zinc-400 border-b border-zinc-800' : 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white'}`}>
         <div className="flex items-center gap-2">
            <span className="text-lg">{hasApiKey ? '🚀' : '✨'}</span>
            <span>
              {hasApiKey 
                ? (process.env.GEMINI_API_KEY || process.env.API_KEY 
                    ? 'Đang sử dụng chế độ Pro (Đã kết nối API Key hệ thống mặc định).' 
                    : 'Đang sử dụng chế độ Pro (Đã kết nối API Key).')
                : 'Đang sử dụng chế độ Miễn phí. Kết nối API Key (Pro) để mở khóa chất lượng 4K & mô hình nâng cao.'}
            </span>
         </div>
         <div className="flex items-center gap-3">
            {!hasApiKey && <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-blue-200 hover:text-white lowercase normal-case text-xs font-medium">Lấy Key miễn phí</a>}
            
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setIsKeyPoolOpen(true)} 
                className={`${hasApiKey ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-blue-700 text-white hover:bg-blue-800'} px-4 py-1.5 rounded-lg transition-all shadow-sm h-auto flex items-center gap-2`}
              >
                <Key size={14} className={poolActive ? 'text-green-400' : ''} />
                {poolActive ? (
                  <span className="flex items-center gap-1">
                    Pool: {getPoolStatus().currentIndex + 1}/{getPoolStatus().size}
                    {getPoolStatus().cooldowns > 0 && <span className="text-red-400 ml-1">({getPoolStatus().cooldowns} CD)</span>}
                  </span>
                ) : 'Key Pool'}
              </Button>

              <Button variant="secondary" onClick={handleSelectKey} className={`${hasApiKey ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-white text-blue-600 hover:bg-blue-50'} px-4 py-1.5 rounded-lg transition-all shadow-sm h-auto`}>
                {hasApiKey ? 'Đổi API Key' : 'Kết nối API Key'}
              </Button>
            </div>
         </div>
      </div>

      <BatchHeader 
        onClose={onClose} mode={mode} setMode={setMode} isProcessing={isProcessing}
        onStart={handleStartProcessing} 
        onAddFiles={() => fileInputRef.current?.click()}
        queuedCount={jobs.filter(j => j.status === 'queued').length}
        jobs={jobs}
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
             onRenderSlider={handleRenderSlider}
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
      <KeyPoolModal 
        isOpen={isKeyPoolOpen} 
        onClose={() => {
          setIsKeyPoolOpen(false);
          setPoolActive(hasKeyPool());
        }} 
      />
    </div>
  );
};

export default BatchStudio;
