
import React, { useState } from 'react';
import LiveOrb from './LiveOrb'; // Import Orb

interface AppHeaderProps {
  mindStatus: 'idle' | 'observing' | 'planning' | 'syncing';
  activeEngine?: string;
  onShowMemory: () => void;
  onUploadMain: () => void;
  showMemory: boolean;
  onToggleSidebar: () => void;
  onAgentAction: (prompt: string, intent: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  mindStatus, 
  activeEngine, 
  onShowMemory, 
  onUploadMain, 
  showMemory, 
  onToggleSidebar,
  onAgentAction
}) => {
  const isBusy = mindStatus !== 'idle';
  const isEnsemble = activeEngine?.includes("BATCH") || mindStatus === 'planning';
  const [showLive, setShowLive] = useState(false);

  return (
    <>
    <header className="px-4 md:px-8 py-4 md:py-6 border-b border-white/5 flex items-center justify-between glass sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-4 md:gap-6">
        <button 
          onClick={onToggleSidebar}
          className="xl:hidden p-2.5 bg-slate-800/40 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3 group cursor-default">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full transition-all duration-700 ${isBusy ? 'bg-blue-500 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : 'bg-slate-600'}`}></div>
            {isBusy && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40"></div>}
          </div>
          <h1 className="font-black text-sm md:text-lg uppercase tracking-tighter text-white group-hover:text-blue-400 transition-colors">
            Master <span className="text-blue-500 group-hover:text-white">Intelligence</span>
          </h1>
          <div className="hidden lg:flex items-center gap-1.5">
             <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-widest">v11.0.0-Omni</span>
             {isEnsemble && <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-[8px] font-black text-orange-400 uppercase animate-pulse">Synergy Active</span>}
          </div>
        </div>
        
        <div className="hidden md:block h-6 w-px bg-white/10"></div>
        
        {/* LIVE BUTTON */}
        <button 
            onClick={() => setShowLive(!showLive)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all ${showLive ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_red]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
        >
            <span className={`w-2 h-2 rounded-full ${showLive ? 'bg-white animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest">Live Mode</span>
        </button>

      </div>

      <div className="flex gap-2 md:gap-4">
         <button 
           onClick={() => (window as any).aistudio?.openSelectKey?.()} 
           className="px-4 py-2 rounded-xl border border-white/10 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
           title="Thiết lập Gemini API Key"
         >
           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
           </svg>
           <span className="hidden sm:inline">API Key</span>
         </button>
         <button 
           onClick={onShowMemory} 
           className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${showMemory ? 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-900/40' : 'bg-slate-800/40 border-white/10 text-slate-400 hover:text-white hover:bg-slate-800'}`}
         >
           Neural Logic
         </button>
         <button 
           onClick={onUploadMain} 
           className="px-5 md:px-7 py-2.5 md:py-3 bg-white text-slate-950 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 hover:bg-blue-50 hover:shadow-blue-500/20"
         >
           Nạp Tri Thức
         </button>
      </div>
    </header>
    
    {showLive && <LiveOrb onClose={() => setShowLive(false)} onAgentAction={onAgentAction} />}
    </>
  );
};

export default AppHeader;
