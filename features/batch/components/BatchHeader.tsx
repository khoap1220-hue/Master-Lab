
import React from 'react';
import { BatchMode } from '../hooks/useBatchProcessing';

interface BatchHeaderProps {
  onClose: () => void;
  mode: BatchMode;
  setMode: (mode: BatchMode) => void;
  isProcessing: boolean;
  onStart: () => void;
  onAddFiles: () => void;
  queuedCount: number;
}

const BatchHeader: React.FC<BatchHeaderProps> = ({ 
  onClose, mode, setMode, isProcessing, onStart, onAddFiles, queuedCount 
}) => {
  // Allow start if there are queued items OR if we are in modes that support synthetic jobs
  // Added 'ux-flow' to supported synthetic modes
  const supportsSynthetic = ['viral-story', 'ad-campaign', 'ux-flow'];
  const canStart = !isProcessing && (queuedCount > 0 || supportsSynthetic.includes(mode));

  return (
    <div className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">Batch Studio</h2>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">High-Performance Neural Processing</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl gap-1 border border-slate-800 shadow-inner overflow-x-auto custom-scrollbar">
           {(['remove-bg', 'upscale', 'print-prep', 'auto-mockup', 'product-photography', 'product-360', 'structural-architect', 'ux-flow', 'font-creation', 'full-refresh', 'viral-story', 'ad-campaign'] as BatchMode[]).map(m => (
             <button 
               type="button"
               key={m}
               onClick={() => !isProcessing && setMode(m)}
               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${mode === m ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {m === 'auto-mockup' ? '✨ AUTO MOCKUP' : 
                m === 'product-photography' ? '📸 STUDIO SHOOT' :
                m === 'product-360' ? '🔄 360° SPIN' :
                m === 'structural-architect' ? '🧬 STRUCTURE LAB' :
                m === 'ux-flow' ? '📱 UX FLOW' :
                m === 'font-creation' ? '🅰️ FONT MAKER' : 
                m === 'full-refresh' ? '🔄 FULL REFRESH' :
                m === 'viral-story' ? '🎯 VIRAL STORY' :
                m === 'ad-campaign' ? '📢 AD CAMPAIGN' :
                m.replace('-', ' ')}
             </button>
           ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
           <button onClick={onAddFiles} className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-slate-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
             + Add Files
           </button>
           <button 
             type="button"
             onClick={onStart}
             disabled={!canStart}
             className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed ${
               mode === 'auto-mockup' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white' : 
               mode === 'product-photography' ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white' :
               mode === 'structural-architect' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' :
               mode === 'product-360' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' :
               mode === 'ux-flow' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' :
               mode === 'font-creation' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white' : 
               mode === 'full-refresh' ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' :
               mode === 'viral-story' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white' :
               mode === 'ad-campaign' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' :
               'bg-white text-slate-950'
             }`}
           >
             {isProcessing ? 'Processing...' : (supportsSynthetic.includes(mode) && queuedCount === 0) ? 'Auto Generate' : 'Execute Batch'}
           </button>
        </div>
    </div>
  );
};

export default BatchHeader;
