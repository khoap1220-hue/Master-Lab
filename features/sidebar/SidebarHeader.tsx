
import React from 'react';

interface SidebarHeaderProps {
  onClose: () => void;
  onOpenBatchStudio: () => void;
  view: 'automation' | 'projects';
  setView: (view: 'automation' | 'projects') => void;
  activeWorkflowsCount: number;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  onClose, 
  onOpenBatchStudio,
  view, 
  setView, 
  activeWorkflowsCount 
}) => {
  return (
    <div className="p-6 md:p-8 border-b border-slate-800 bg-gradient-to-r from-slate-900/50 to-slate-900/10 relative">
      <div className="flex items-center justify-between xl:hidden mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Neural Workspace</h2>
        <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      {/* System Status / Agent Telemetry */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col group cursor-help">
            <h2 className="hidden xl:block text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">The Neural Agency</h2>
            <div className="hidden xl:flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Master Orchestrator: Online"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="PixelSmith: Online"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="ContextVision: Online"></span>
               <span className="text-[8px] font-mono text-slate-500">Systems Nominal</span>
            </div>
        </div>
        
        <div className="flex gap-2">
            <button 
            type="button"
            onClick={onOpenBatchStudio} 
            className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg text-[9px] font-black uppercase text-pink-400 tracking-widest transition-all flex items-center gap-2 group"
            >
            <span>Batch Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse group-hover:bg-pink-400"></span>
            </button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
         <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Điều khiển hệ thống</h1>
         <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shadow-sm">
            <button 
              type="button"
              onClick={() => setView('automation')} 
              className={`px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${view === 'automation' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Điều khiển
            </button>
            <button 
              type="button"
              onClick={() => setView('projects')} 
              className={`px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${view === 'projects' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Dự án
              {activeWorkflowsCount > 0 && <span className="w-4 h-4 rounded-full bg-white text-orange-600 flex items-center justify-center text-[8px]">{activeWorkflowsCount}</span>}
            </button>
         </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
