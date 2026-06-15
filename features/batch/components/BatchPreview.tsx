
import React, { useState } from 'react';
import { BatchJob } from '../../../types';
import JSZip from 'jszip';
import { Button } from '../../../components/ui/Button';

import DecomposeGrid from './DecomposeGrid';
import ViralStoryDashboard from './ViralStoryDashboard';
import OmniSliderScriptReview from './OmniSliderScriptReview';

interface BatchPreviewProps {
  activeJob: BatchJob | undefined;
  mode: string;
  isProcessing: boolean;
  onEditJob: (job: BatchJob) => void;
  onRetryJob?: (job: BatchJob) => void;
  onRegenerate?: (jobId: string, chars: string[]) => void;
  onRenameGlyph?: (jobId: string, glyphId: string, newChar: string) => void;
  onGenerateVideo?: (job: BatchJob) => void; 
  onSelectHook?: (job: BatchJob, hookId: string) => void;
  onDeselectHook?: (job: BatchJob) => void;
  onGenerateQuoteImage?: (job: BatchJob, index: number) => void; // New Prop
  onRenderSlider?: (jobId: string, approvedSlides: any[]) => void;
}

const BatchPreview: React.FC<BatchPreviewProps> = ({ activeJob, mode, isProcessing, onEditJob, onRetryJob, onGenerateVideo, onSelectHook, onDeselectHook, onGenerateQuoteImage, onRenderSlider }) => {
  const [isZipping, setIsZipping] = useState(false);

  if (!activeJob) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-6">
           <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center text-4xl opacity-20 animate-pulse">🏗️</div>
           <div className="text-center space-y-2">
             <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Neural Deployer Active</p>
             <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Select an asset from the queue to preview</p>
           </div>
        </div>
    );
  }

  const handleDownloadResult = async () => {
    if (activeJob.resultVideoUrl) {
        const a = document.createElement('a');
        a.href = activeJob.resultVideoUrl;
        a.download = `Video_${mode}_${activeJob.file.name}.mp4`;
        a.click();
        return;
    }

    if (mode === 'authentic-review' && activeJob.extractedText) {
        if (isZipping) return;
        setIsZipping(true);
        try {
            const zip = new JSZip();
            const safeFileName = activeJob.file.name.split('.')[0] || 'review';
            const folder = zip.folder(safeFileName);

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

            // 1. Add Main Image
            let mainImageUrl = '';
            let mainImageBlob: Blob | File | undefined = undefined;
            
            if (activeJob.resultUrl) {
                mainImageUrl = activeJob.resultUrl;
                mainImageBlob = activeJob.resultBlob;
            } else if (activeJob.originalUrl) {
                mainImageUrl = activeJob.originalUrl;
                mainImageBlob = activeJob.file;
            }

            if (mainImageUrl) {
                const content = await getFileContent(mainImageUrl, mainImageBlob);
                if (content) {
                    folder?.file(`Main_Image.png`, content, { base64: mainImageUrl.startsWith('data:') && !mainImageBlob });
                }
            }

            // 2. Add Check-in Photos
            if (activeJob.checkinPhotos && activeJob.checkinPhotos.length > 0) {
                for (let i = 0; i < activeJob.checkinPhotos.length; i++) {
                    const photoUrl = activeJob.checkinPhotos[i];
                    const content = await getFileContent(photoUrl);
                    if (content) {
                        folder?.file(`Checkin_${i + 1}.png`, content, { base64: photoUrl.startsWith('data:') });
                    }
                }
            }

            // 3. Add Review Text
            folder?.file(`Generated_Review.txt`, activeJob.extractedText);

            const blob = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${safeFileName}_Review.zip`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Failed to create review ZIP:", error);
        } finally {
            setIsZipping(false);
        }
        return;
    }

    if (!activeJob.resultUrl) return;
    const a = document.createElement('a');
    a.href = activeJob.resultUrl;
    a.download = `Result_${mode}_${activeJob.file.name}.png`;
    a.click();
  };

  const isJobRunning = ['preprocessing', 'refreshing', 'analyzing_context', 'vectorizing', 'matting', 'refining', 'placing_neural', 'scripting', 'visualizing_hooks', 'drafting_content', 'rendering_visuals', 'processing', 'generating_video'].includes(activeJob.status);
  const isVideoRendering = activeJob.status === 'rendering_video';
  const isGenericProcessing = isJobRunning || isVideoRendering;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-8 pb-0 flex-shrink-0">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-700 bg-black/50 p-1">
                        <img src={activeJob.originalUrl} className="w-full h-full object-cover rounded-xl opacity-80" alt="thumb" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">{activeJob.file.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${
                                mode === 'product-360' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' : 
                                mode === 'ad-campaign' ? 'bg-violet-900/20 text-violet-400 border-violet-800' :
                                'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}>
                                {mode === 'product-360' ? 'STUDIO 360°' : mode.replace('-', ' ').toUpperCase()}
                            </span>
                            {(activeJob.resultUrl || activeJob.resultVideoUrl) && (
                                <span className="text-[9px] text-green-400 uppercase font-bold tracking-widest px-2 py-0.5 bg-green-900/20 rounded border border-green-800">
                                    {activeJob.status.toUpperCase()}
                                </span>
                            )}
                            {activeJob.refreshStrategy && (
                                <span className="text-[9px] text-blue-400 uppercase font-bold tracking-widest px-2 py-0.5 bg-blue-900/20 rounded border border-blue-800">
                                    STRATEGY: {activeJob.refreshStrategy}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {(activeJob.resultUrl || activeJob.resultVideoUrl || (mode === 'authentic-review' && activeJob.extractedText)) && !activeJob.viralPlan && (
                        <Button 
                            onClick={handleDownloadResult}
                            disabled={isZipping}
                            isLoading={isZipping}
                            className="px-5 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {!isZipping && (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    {mode === 'authentic-review' ? 'Download All (ZIP)' : 'Download Result'}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-6 bg-zinc-900/20 m-4 rounded-[2.5rem] border border-zinc-800/50">
            
            {activeJob.extractedAssets && activeJob.extractedAssets.length > 0 ? (
                <DecomposeGrid assets={activeJob.extractedAssets} job={activeJob} />
            ) : 
            
            activeJob.viralPlan ? (
                <ViralStoryDashboard 
                    job={activeJob} 
                    onGenerateVideo={onGenerateVideo} 
                    onSelectHook={onSelectHook}
                    onDeselectHook={onDeselectHook}
                    onGenerateQuoteImage={onGenerateQuoteImage}
                    isRendering={isVideoRendering} 
                />
            ) :

            activeJob.omniLoraInputs?.sliderScript && !activeJob.resultUrl ? (
                <OmniSliderScriptReview 
                    job={activeJob} 
                    onRender={onRenderSlider || (() => {})} 
                />
            ) :

            activeJob.campaignData ? (
                <div className="w-full h-full max-w-6xl grid grid-cols-2 gap-8 p-4 animate-in slide-in-from-bottom-4">
                    {/* Visual Column */}
                    <div className="relative rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl bg-[#0a0f1d]">
                        <img src={activeJob.resultUrl} className="w-full h-full object-contain" alt="Ad Visual" />
                    </div>

                    {/* Copywriting Column */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div className="p-6 bg-violet-900/20 border border-violet-500/30 rounded-[2rem] space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block mb-2">Headline</span>
                                <h2 className="text-2xl font-black text-white leading-tight">{activeJob.campaignData.headline}</h2>
                            </div>
                            
                            <div>
                                <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block mb-2">Social Caption</span>
                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{activeJob.campaignData.caption}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Target Audience</span>
                                    <p className="text-[10px] text-zinc-300">{activeJob.campaignData.targetAudience}</p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Tone of Voice</span>
                                    <p className="text-[10px] text-zinc-300">{activeJob.campaignData.tone}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Visual Prompt Used</span>
                                <p className="text-[9px] text-zinc-500 font-mono italic truncate">{activeJob.campaignData.visualPrompt}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeJob.extractedText ? (
                <div className="w-full h-full max-w-6xl grid grid-cols-2 gap-8 p-4 animate-in slide-in-from-bottom-4 relative">
                    {/* Visual Column */}
                    <div className="relative rounded-[2rem] overflow-hidden border border-zinc-800 shadow-2xl bg-[#0a0f1d] flex flex-col gap-4 p-4">
                        <img src={activeJob.resultUrl || activeJob.originalUrl} className={`w-full ${activeJob.checkinPhotos && activeJob.checkinPhotos.length > 0 ? 'h-1/2' : 'h-full'} object-contain rounded-2xl`} alt="Original Visual" />
                        {activeJob.checkinPhotos && activeJob.checkinPhotos.length > 0 && (
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                {activeJob.checkinPhotos.map((photo, idx) => (
                                    <img key={idx} src={photo} className="w-full h-full object-cover rounded-2xl" alt={`Checkin ${idx}`} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Text Column */}
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[2rem] h-full flex flex-col">
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-4 shrink-0">Generated Review</span>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{activeJob.extractedText}</p>
                            </div>
                        </div>
                    </div>

                    {activeJob.status === 'failed' && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 backdrop-blur-sm rounded-[2rem]">
                            <div className="px-8 py-6 bg-black/80 backdrop-blur-xl border border-red-500/30 rounded-3xl flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-300 w-96">
                                <div className="text-4xl">❌</div>
                                <div className="text-center w-full">
                                    <span className="text-xs font-black text-red-400 uppercase tracking-[0.2em] block mb-2">
                                        Processing Failed (Partial Results)
                                    </span>
                                    <span className="text-[10px] font-mono text-red-300 block mb-4">
                                        {activeJob.error || "An unknown error occurred."}
                                    </span>
                                    {onRetryJob && (
                                        <Button 
                                            onClick={() => onRetryJob(activeJob)}
                                            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                                        >
                                            Thử Lại (Retry)
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full h-full max-w-5xl flex flex-col gap-4 animate-in zoom-in-95 duration-500 relative group/view">
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        {activeJob.resultVideoUrl ? (
                            <div className="w-full h-full shadow-2xl rounded-[2rem] overflow-hidden border border-zinc-800 relative bg-black flex items-center justify-center">
                                <video 
                                    src={activeJob.resultVideoUrl} 
                                    className="w-full h-full object-contain" 
                                    controls 
                                    autoPlay 
                                    loop 
                                />
                            </div>
                        ) : activeJob.resultUrl ? (
                            <div className="w-full h-full shadow-2xl rounded-[2rem] overflow-hidden border border-zinc-800 relative bg-[url('https://beupify.com/img/transparent-background.png')] bg-repeat bg-[length:10px_10px]">
                                <img src={activeJob.resultUrl} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex flex-col items-center justify-center gap-4 group">
                                <div className="flex-1 flex items-center justify-center min-h-0 w-full relative">
                                    {activeJob.file && activeJob.file.type.startsWith('video/') ? (
                                        <div className="relative max-w-full max-h-full flex items-center justify-center">
                                            <video 
                                                src={activeJob.originalUrl} 
                                                className={`max-w-full max-h-full object-contain rounded-[1.5rem] transition-all duration-700 ${isGenericProcessing ? 'scale-95 opacity-60 grayscale-[0.5] blur-[2px]' : ''}`} 
                                                controls
                                            />
                                            {activeJob.videoEdits && activeJob.videoEdits.length > 0 && !isGenericProcessing && (
                                                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-zinc-700 rounded-xl p-3 max-w-xs shadow-2xl">
                                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Queued Edits ({activeJob.videoEdits.length})</h4>
                                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                        {activeJob.videoEdits.map((edit, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                                                                <img src={edit.maskUrl} className="w-8 h-8 object-cover rounded bg-black" />
                                                                <p className="text-[10px] text-zinc-300 line-clamp-2 flex-1">{edit.prompt}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <img 
                                            src={activeJob.originalUrl} 
                                            className={`max-w-full max-h-full object-contain rounded-[1.5rem] transition-all duration-700 ${isGenericProcessing ? 'scale-95 opacity-60 grayscale-[0.5] blur-[2px]' : ''}`} 
                                        />
                                    )}
                                </div>
                                {activeJob.referenceUrls && activeJob.referenceUrls.length > 0 && (
                                    <div className="flex gap-2 h-24 shrink-0">
                                        {activeJob.referenceUrls.map((url, idx) => (
                                            <div key={idx} className="h-full aspect-square rounded-xl overflow-hidden border border-zinc-700 bg-black/50 p-1">
                                                <img src={url} className="w-full h-full object-cover rounded-lg opacity-80" alt={`ref-${idx}`} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {isGenericProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center z-30">
                                        <div className="px-8 py-6 bg-black/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-300 w-96">
                                            <div className="relative">
                                                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                                {activeJob.progress !== undefined && (
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                        {activeJob.progress}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center w-full">
                                                <span className="text-xs font-black text-white uppercase tracking-[0.2em] block mb-2">
                                                    Neural Processing
                                                </span>
                                                {activeJob.progress !== undefined && (
                                                    <div className="w-full bg-blue-900/50 rounded-full h-1.5 mb-2 border border-blue-800">
                                                        <div 
                                                            className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                                                            style={{ width: `${activeJob.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-mono text-blue-300 truncate block">
                                                    {activeJob.progressMessage || "Analyzing Pixel Data..."}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeJob.status === 'failed' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-30">
                                        <div className="px-8 py-6 bg-black/80 backdrop-blur-xl border border-red-500/30 rounded-3xl flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in-95 duration-300 w-96">
                                            <div className="text-4xl">❌</div>
                                            <div className="text-center w-full">
                                                <span className="text-xs font-black text-red-400 uppercase tracking-[0.2em] block mb-2">
                                                    Processing Failed
                                                </span>
                                                <span className="text-[10px] font-mono text-red-300 block mb-4">
                                                    {activeJob.error || "An unknown error occurred."}
                                                </span>
                                                {onRetryJob && (
                                                    <Button 
                                                        onClick={() => onRetryJob(activeJob)}
                                                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                                                    >
                                                        Thử Lại (Retry)
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Edit Overlay */}
                                {!isProcessing && !isGenericProcessing && activeJob.status !== 'failed' && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[1.5rem] flex items-center justify-center backdrop-blur-sm z-20">
                                        <Button 
                                            onClick={() => onEditJob(activeJob)}
                                            className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-2xl backdrop-blur-md flex items-center gap-3 transition-all hover:scale-105"
                                        >
                                            <span className="text-2xl">🖌️</span>
                                            <span className="text-sm font-bold uppercase tracking-widest">Mở Studio Chỉnh Sửa</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        
        <style>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
        `}</style>
    </div>
  );
};

export default BatchPreview;
