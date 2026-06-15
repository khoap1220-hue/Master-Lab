
import React, { useState, useRef, useEffect } from 'react';
import { BatchMode } from '../hooks/useBatchProcessing';
import { BatchJob } from '../../../types';
import JSZip from 'jszip';
import { Button } from '../../../components/ui/Button';
import { globalAgentRegistry } from '../logic';
import * as Icons from 'lucide-react';

interface BatchHeaderProps {
  onClose: () => void;
  mode: BatchMode;
  setMode: (mode: BatchMode) => void;
  isProcessing: boolean;
  onStart: () => void;
  onAddFiles: () => void;
  queuedCount: number;
  jobs: BatchJob[];
}

const BatchHeader: React.FC<BatchHeaderProps> = ({ 
  onClose, mode, setMode, isProcessing, onStart, onAddFiles, queuedCount, jobs 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const canDownloadAll = completedJobs.length > 0;

  // Group agents by category
  const agents = globalAgentRegistry.getAllAgents();
  const categories = Array.from(new Set(agents.map(a => a.category)));
  const BATCH_GROUPS = categories.map(category => ({
    name: category,
    items: agents.filter(a => a.category === category).sort((a, b) => a.priority - b.priority)
  }));

  const activeAgent = globalAgentRegistry.getAgent(mode);
  const ActiveIcon = activeAgent ? (Icons as any)[activeAgent.icon] || Icons.Box : Icons.Box;
  const activeLabel = activeAgent ? activeAgent.name : mode.replace('-', ' ');

  const handleDownloadAll = async () => {
    if (!canDownloadAll || isZipping) return;
    setIsZipping(true);
    try {
        const zip = new JSZip();
        
        // Helper to get content from URL (handles data: and blob:)
        const getFileContent = async (url: string, fallbackBlob?: Blob | File) => {
            if (fallbackBlob) return fallbackBlob;
            if (!url) return null;
            if (url.startsWith('data:')) {
                return url.split(',')[1];
            }
            try {
                const response = await fetch(url);
                return await response.blob();
            } catch (e) {
                console.error("Failed to fetch blob URL", url, e);
                return null;
            }
        };

        for (const job of completedJobs) {
            const safeFileName = job.file.name.split('.')[0] || `job_${job.id}`;
            
            if (mode === 'authentic-review') {
                const folder = zip.folder(safeFileName);
                
                // 1. Main Image
                const mainImageUrl = job.resultUrl || job.originalUrl;
                const mainImageBlob = job.resultBlob || job.file;
                if (mainImageUrl) {
                    const content = await getFileContent(mainImageUrl, mainImageBlob);
                    if (content) {
                        folder?.file(`Main_Image.png`, content, { base64: mainImageUrl.startsWith('data:') && !mainImageBlob });
                    }
                }

                // 2. Check-in Photos
                if (job.checkinPhotos && job.checkinPhotos.length > 0) {
                    for (let i = 0; i < job.checkinPhotos.length; i++) {
                        const photoUrl = job.checkinPhotos[i];
                        const content = await getFileContent(photoUrl);
                        if (content) {
                            folder?.file(`Checkin_${i + 1}.png`, content, { base64: photoUrl.startsWith('data:') });
                        }
                    }
                }

                // 3. Review Text
                if (job.extractedText) {
                    folder?.file(`Generated_Review.txt`, job.extractedText);
                }
            } else {
                // Default mode: just zip the result
                let resultUrl = '';
                let resultBlob: Blob | File | undefined = undefined;
                
                if (job.resultUrl) {
                    resultUrl = job.resultUrl;
                    resultBlob = job.resultBlob;
                } else if (job.resultVideoUrl) {
                    resultUrl = job.resultVideoUrl;
                    resultBlob = job.resultVideoBlob;
                } else if (job.originalUrl) {
                    resultUrl = job.originalUrl;
                    resultBlob = job.file;
                }

                if (resultUrl) {
                    const content = await getFileContent(resultUrl, resultBlob);
                    if (content) {
                        const ext = job.resultVideoUrl ? 'mp4' : 'png';
                        zip.file(`${safeFileName}.${ext}`, content, { base64: resultUrl.startsWith('data:') && !resultBlob });
                    }
                }
            }
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Batch_${mode}_${new Date().getTime()}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Failed to create batch ZIP:", error);
    } finally {
        setIsZipping(false);
    }
  };

  // Allow start if there are queued items OR if we are in modes that support synthetic jobs
  // Added 'ux-flow' to supported synthetic modes
  const supportsSynthetic = ['viral-story', 'ad-campaign', 'ux-flow', 'automation-multi-task', 'omnilora', 'omni-slider'];
  const canStart = !isProcessing && (queuedCount > 0 || supportsSynthetic.includes(mode));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-20 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <Button variant="secondary" onClick={onClose} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-400 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Button>
          <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">Batch Studio</h2>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">High-Performance Neural Processing</p>
          </div>
        </div>

        {/* Mode Switcher Dropdown */}
        <div ref={dropdownRef} className="relative min-w-[280px]">
          <Button
            variant="outline"
            type="button"
            onClick={() => !isProcessing && setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <ActiveIcon size={16} /> {activeLabel}
            </span>
            <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>

          {isOpen && !isProcessing && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto custom-scrollbar z-50">
              {BATCH_GROUPS.map((group, idx) => (
                <div key={group.name} className={`${idx > 0 ? 'border-t border-zinc-800' : ''}`}>
                  <div className="px-4 py-2 bg-zinc-950/90 text-[10px] font-black text-zinc-500 uppercase tracking-widest sticky top-0 backdrop-blur-sm z-10">
                    {group.name}
                  </div>
                  <div className="p-2 grid grid-cols-1 gap-1">
                    {group.items.map(agent => {
                      const ItemIcon = (Icons as any)[agent.icon] || Icons.Box;
                      return (
                        <Button
                          variant="ghost"
                          key={agent.id}
                          type="button"
                          onClick={() => {
                            setMode(agent.id as BatchMode);
                            setIsOpen(false);
                          }}
                          className={`flex items-center px-3 py-2.5 rounded-lg transition-colors text-left ${
                            mode === agent.id 
                              ? 'bg-blue-600/20 text-blue-400' 
                              : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                            <ItemIcon size={16} /> {agent.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
           {canDownloadAll && (
             <Button 
               onClick={handleDownloadAll}
               disabled={isZipping}
               isLoading={isZipping}
               className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-blue-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
             >
               {!isZipping && (
                 <>
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Download All (ZIP)
                 </>
               )}
             </Button>
           )}
           <Button 
             variant="secondary"
             onClick={onAddFiles} 
             className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-zinc-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
           >
             {mode === 'viral-story' ? '+ Add Reference' : 
              mode === 'ad-campaign' ? '+ Add Product' : 
              mode === 'ux-flow' ? '+ Add Sketch' : 
              mode === 'design-system-extractor' ? '+ Add UI Image' :
              mode === 'omni-mockup' ? '+ Add Logo' :
              mode === 'omnichannel-resize' ? '+ Add Base Image' :
              mode === 'omnilora' ? '+ Add Character Refs' :
              mode === 'omni-slider' ? '+ Add References' :
              mode === 'automation-multi-task' ? '+ Add Input' : 
              mode === 'studio-videos' ? '+ Add Hook Images' : 
              '+ Add Files'}
           </Button>
           <Button 
             type="button"
             onClick={onStart}
             disabled={!canStart}
             isLoading={isProcessing}
             className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed ${
               mode === 'auto-mockup' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 
               mode === 'decompose' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
               mode === 'omni-mockup' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' :
               mode === 'omnichannel-resize' ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white' :
               mode === 'omnilora' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
               mode === 'omni-slider' ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white' :
               mode === 'product-photography' ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white' :
               mode === 'structural-architect' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' :
               mode === 'floorplan-stylist' ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white' :
               mode === 'product-360' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' :
               mode === 'ux-flow' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' :
               mode === 'design-system-extractor' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' :
               mode === 'font-creation' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white' : 
               mode === 'full-refresh' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' :
               mode === 'viral-story' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' :
               mode === 'ad-campaign' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' :
               mode === 'automation-multi-task' ? 'bg-gradient-to-r from-zinc-600 to-zinc-500 text-white' :
               mode === 'studio-videos' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
               'bg-white text-zinc-950'
             }`}
           >
             {!isProcessing && (
               (supportsSynthetic.includes(mode) && queuedCount === 0) ? 'Auto Generate' : 'Execute Batch'
             )}
           </Button>
        </div>
    </div>
  );
};

export default BatchHeader;
