
import React from 'react';
import { BrandIdentity } from '../../types';
import { Button } from '../../components/ui/Button';

interface SidebarHeaderProps {
  onClose: () => void;
  onOpenBatchStudio: () => void;
  onOpenBrandStudio: () => void;
  view: 'automation' | 'projects';
  setView: (view: 'automation' | 'projects') => void;
  activeWorkflowsCount: number;
  brandIdentity?: BrandIdentity | null;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ 
  onClose, 
  onOpenBatchStudio,
  onOpenBrandStudio,
  view, 
  setView, 
  activeWorkflowsCount,
  brandIdentity
}) => {
  return (
    <div className="p-6 md:p-8 border-b border-zinc-800 bg-gradient-to-r from-zinc-900/50 to-zinc-900/10 relative">
      <div className="flex items-center justify-between xl:hidden mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Neural Workspace</h2>
        <Button 
          variant="ghost" 
          onClick={onClose} 
          className="text-zinc-500 hover:text-white transition-colors h-auto p-1"
        >
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </Button>
      </div>
      
      {/* System Status / Agent Telemetry */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col group cursor-help">
            <h2 className="hidden xl:block text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">The Neural Agency</h2>
            <div className="hidden xl:flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Master Orchestrator: Online"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="PixelSmith: Online"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="ContextVision: Online"></span>
               <span className="text-[8px] font-mono text-zinc-500">Systems Nominal</span>
            </div>
        </div>
        
        <div className="flex gap-2">
            {brandIdentity && (
              <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-zinc-800/50 rounded-lg border border-zinc-700/50" title={`Active Brand: ${brandIdentity.name || 'Unnamed'} (Click to copy)`}>
                {brandIdentity.primaryColor && <div onClick={() => navigator.clipboard.writeText(brandIdentity.primaryColor!)} className="w-3 h-3 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: brandIdentity.primaryColor }} title={`Copy ${brandIdentity.primaryColor}`} />}
                {brandIdentity.secondaryColor && <div onClick={() => navigator.clipboard.writeText(brandIdentity.secondaryColor!)} className="w-3 h-3 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: brandIdentity.secondaryColor }} title={`Copy ${brandIdentity.secondaryColor}`} />}
                {brandIdentity.accentColor && <div onClick={() => navigator.clipboard.writeText(brandIdentity.accentColor!)} className="w-3 h-3 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: brandIdentity.accentColor }} title={`Copy ${brandIdentity.accentColor}`} />}
              </div>
            )}
            <Button 
            variant="outline"
            onClick={onOpenBrandStudio} 
            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase text-blue-400 tracking-widest transition-all flex items-center gap-2 group h-auto"
            >
            <span>Brand Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse group-hover:bg-blue-400"></span>
            </Button>
            <Button 
            variant="outline"
            onClick={onOpenBatchStudio} 
            className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg text-[9px] font-black uppercase text-pink-400 tracking-widest transition-all flex items-center gap-2 group h-auto"
            >
            <span>Batch Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse group-hover:bg-pink-400"></span>
            </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
         <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Điều khiển hệ thống</h1>
         <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto shadow-sm">
            <Button 
              variant="ghost"
              onClick={() => setView('automation')} 
              className={`px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all h-auto ${view === 'automation' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Điều khiển
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setView('projects')} 
              className={`px-3 md:px-4 py-2 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 h-auto ${view === 'projects' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Dự án
              {activeWorkflowsCount > 0 && <span className="w-4 h-4 rounded-full bg-white text-orange-600 flex items-center justify-center text-[8px]">{activeWorkflowsCount}</span>}
            </Button>
         </div>
      </div>
    </div>
  );
};

export default SidebarHeader;
