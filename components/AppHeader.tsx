
import React, { useState } from 'react';
import LiveOrb from './LiveOrb'; // Import Orb
import { Button } from './ui/Button';

interface AppHeaderProps {
  mindStatus: 'idle' | 'observing' | 'planning' | 'syncing';
  activeEngine?: string;
  onShowMemory: () => void;
  onUploadMain: () => void;
  showMemory: boolean;
  onToggleSidebar: () => void;
  onAgentAction: (prompt: string, intent: string) => void;
  onClearChat: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  mindStatus, 
  activeEngine, 
  onShowMemory, 
  onUploadMain, 
  showMemory, 
  onToggleSidebar,
  onAgentAction,
  onClearChat
}) => {
  const isBusy = mindStatus !== 'idle';
  const isEnsemble = activeEngine?.includes("BATCH") || mindStatus === 'planning';
  const [showLive, setShowLive] = useState(false);

  return (
    <>
    <header className="px-4 md:px-8 py-4 border-b border-zinc-800 flex items-center justify-between glass sticky top-0 z-30 transition-all duration-500">
      <div className="flex items-center gap-4 md:gap-6">
        <Button 
          variant="secondary"
          onClick={onToggleSidebar}
          className="xl:hidden p-2 bg-zinc-900 rounded-md text-zinc-400 hover:text-white transition-all border border-zinc-800 h-auto"
          aria-label="Toggle Sidebar"
          aria-expanded="false"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>

        <div className="flex items-center gap-3 group cursor-default">
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${isBusy ? 'bg-zinc-100 scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-zinc-700'}`}></div>
            {isBusy && <div className="absolute inset-0 bg-zinc-100 rounded-full animate-ping opacity-20"></div>}
          </div>
          <h1 className="font-semibold text-sm md:text-base tracking-tight text-zinc-100 group-hover:text-white transition-colors">
            Master <span className="text-zinc-400 group-hover:text-zinc-300">Intelligence</span>
          </h1>
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
             <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-400">v11.0.0-Omni</span>
             {isEnsemble && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 animate-pulse">Synergy Active</span>}
          </div>
        </div>
        
        <div className="hidden md:block h-4 w-px bg-zinc-800"></div>
        
        {/* LIVE BUTTON */}
        <Button 
            variant="secondary"
            onClick={() => setShowLive(!showLive)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all h-auto ${showLive ? 'bg-red-950 border-red-900 text-red-400 hover:bg-red-900/50' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${showLive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`}></span>
            <span className="text-[10px] font-mono uppercase tracking-wider">xLive Mode</span>
        </Button>

      </div>

      <div className="flex gap-2">
         <Button 
           variant="ghost"
           size="sm"
           onClick={onClearChat}
           title="Xóa lịch sử trò chuyện"
           className="hidden sm:flex gap-2"
         >
           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
           </svg>
           <span>New Session</span>
         </Button>
         <Button 
           variant="ghost"
           size="sm"
           onClick={() => (window as any).aistudio?.openSelectKey?.()} 
           title="Thiết lập Gemini API Key"
           className="hidden sm:flex gap-2"
         >
           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
           </svg>
           <span>API Key</span>
         </Button>
         <Button 
           variant={showMemory ? "primary" : "secondary"}
           size="sm"
           onClick={onShowMemory} 
         >
           Neural Logic
         </Button>
         <Button 
           variant="primary"
           size="sm"
           onClick={onUploadMain} 
         >
           Nạp Tri Thức
         </Button>
      </div>
    </header>
    
    {showLive && <LiveOrb onClose={() => setShowLive(false)} onAgentAction={onAgentAction} />}
    </>
  );
};

export default AppHeader;
