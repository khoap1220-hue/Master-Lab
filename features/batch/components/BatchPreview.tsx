
import React from 'react';
import { BatchJob } from '../../../types';
import ComparisonSlider from '../../../components/ComparisonSlider';
import DecomposeGrid from './DecomposeGrid';
import ViralStoryDashboard from './ViralStoryDashboard';

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
}

const BatchPreview: React.FC<BatchPreviewProps> = ({ activeJob, mode, isProcessing, onEditJob, onRetryJob, onGenerateVideo, onSelectHook, onDeselectHook, onGenerateQuoteImage }) => {
  
  if (!activeJob) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-6">
           <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-4xl opacity-20 animate-pulse">🏗️</div>
           <div className="text-center space-y-2">
             <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Neural Deployer Active</p>
             <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Select an asset from the queue to preview</p>
           </div>
        </div>
    );
  }

  const handleDownloadResult = () => {
    if (!activeJob.resultUrl) return;
    const a = document.createElement('a');
    a.href = activeJob.resultUrl;
    a.download = `Result_${mode}_${activeJob.file.name}.png`;
    a.click();
  };

  const isJobRunning = ['preprocessing', 'refreshing', 'analyzing_context', 'vectorizing', 'matting', 'refining', 'placing_neural', 'scripting', 'visualizing_hooks', 'drafting_content', 'rendering_visuals'].includes(activeJob.status);
  const isVideoRendering = activeJob.status === 'rendering_video';
  const isGenericProcessing = isJobRunning || isVideoRendering;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-8 pb-0 flex-shrink-0">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 bg-black/50 p-1">
                    <img src={activeJob.originalUrl} className="w-full h-full object-cover rounded-xl opacity-80" alt="thumb" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">{activeJob.file.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${
                            mode === 'product-360' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' : 
                            mode === 'ad-campaign' ? 'bg-violet-900/20 text-violet-400 border-violet-800' :
                            'bg-slate-900 text-slate-500 border-slate-800'
                        }`}>
                            {mode === 'product-360' ? 'STUDIO 360°' : mode.replace('-', ' ').toUpperCase()}
                        </span>
                        {activeJob.resultUrl && (
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
                
                {activeJob.resultUrl && !activeJob.viralPlan && (
                    <button 
                        onClick={handleDownloadResult}
                        className="px-5 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download Result
                    </button>
                )}
            </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center p-6 bg-slate-900/20 m-4 rounded-[2.5rem] border border-slate-800/50 overflow-hidden">
            
            {activeJob.extractedAssets && activeJob.extractedAssets.length > 0 ? (
                <DecomposeGrid assets={activeJob.extractedAssets} />
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

            activeJob.campaignData ? (
                <div className="w-full h-full max-w-6xl grid grid-cols-2 gap-8 p-4 animate-in slide-in-from-bottom-4">
                    {/* Visual Column */}
                    <div className="relative rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl bg-[#0a0f1d]">
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
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{activeJob.campaignData.caption}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Target Audience</span>
                                    <p className="text-[10px] text-slate-300">{activeJob.campaignData.targetAudience}</p>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tone of Voice</span>
                                    <p className="text-[10px] text-slate-300">{activeJob.campaignData.tone}</p>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Visual Prompt Used</span>
                                <p className="text-[9px] text-slate-500 font-mono italic truncate">{activeJob.campaignData.visualPrompt}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full max-w-5xl flex flex-col gap-4 animate-in zoom-in-95 duration-500 relative group/view">
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        {activeJob.resultUrl ? (
                            <div className="w-full h-full shadow-2xl rounded-[2rem] overflow-hidden border border-slate-800 relative bg-[url('https://beupify.com/img/transparent-background.png')] bg-repeat bg-[length:10px_10px]">
                                <img src={activeJob.resultUrl} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center group">
                                <img 
                                    src={activeJob.originalUrl} 
                                    className={`max-w-full max-h-full object-contain rounded-[1.5rem] transition-all duration-700 ${isGenericProcessing ? 'scale-95 opacity-60 grayscale-[0.5] blur-[2px]' : ''}`} 
                                />
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
