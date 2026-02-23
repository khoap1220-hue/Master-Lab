
import React, { useEffect, useState, useRef } from 'react';
import { LiveSessionManager } from '../services/live/liveSession';

interface LiveOrbProps {
  onClose: () => void;
  onAgentAction: (prompt: string, intent: string) => void;
}

const LiveOrb: React.FC<LiveOrbProps> = ({ onClose, onAgentAction }) => {
  const [status, setStatus] = useState('idle'); // idle, initializing, connecting, connected, error, disconnected
  const [detailMsg, setDetailMsg] = useState('');
  const [volume, setVolume] = useState(0); 
  const managerRef = useRef<LiveSessionManager | null>(null);

  // Auto-connect on mount
  useEffect(() => {
    startSession();
    return () => {
        managerRef.current?.disconnect();
    };
  }, []);

  const startSession = () => {
      if (managerRef.current) managerRef.current.disconnect();
      
      const manager = new LiveSessionManager(
          (s, detail) => {
              setStatus(s);
              if (detail) setDetailMsg(detail);
          },
          (v) => setVolume(v),
          (prompt, intent) => {
              // Haptic feedback if available
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              // Trigger action in main app
              onAgentAction(prompt, intent);
          }
      );
      
      managerRef.current = manager;
      manager.connect();
  };

  const getStatusText = () => {
      switch(status) {
          case 'idle': return 'Chuẩn bị...';
          case 'initializing': return 'Khởi động...';
          case 'connecting': return 'Đang kết nối...';
          case 'connected': return 'Fenrir đang nghe';
          case 'error': return 'Lỗi kết nối';
          case 'disconnected': return 'Đã ngắt';
          default: return status;
      }
  };

  const getStatusColor = () => {
      switch(status) {
          case 'connected': return 'bg-blue-500';
          case 'error': return 'bg-red-500';
          case 'disconnected': return 'bg-slate-500';
          default: return 'bg-yellow-500';
      }
  };

  const isLive = status === 'connected';
  const scale = isLive ? 1 + (volume / 100) : 1;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center animate-in slide-in-from-bottom-10 fade-in duration-500 pointer-events-none">
       
       {/* MAIN ORB */}
       <div className="relative pointer-events-auto group cursor-move">
           
           {/* Glow Effect */}
           <div 
             className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl transition-all duration-300 ${status === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'}`}
             style={{ 
                 opacity: isLive ? 0.5 + (volume/200) : 0.2,
                 transform: `translate(-50%, -50%) scale(${scale * 1.1})` 
             }}
           ></div>

           {/* Sphere Core */}
           <div 
             className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 border shadow-2xl backdrop-blur-md overflow-hidden ${
                 status === 'error' ? 'bg-red-950/90 border-red-500/50' :
                 isLive ? 'bg-black/90 border-blue-400/50' :
                 'bg-slate-900 border-slate-700'
             }`}
             style={{ transform: `scale(${scale})` }}
           >
              {/* Inner Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/10 opacity-50"></div>
              
              {/* Connection Spinner */}
              {(status === 'connecting' || status === 'initializing') && (
                  <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-white/30 animate-spin"></div>
              )}

              {/* Status Icon / Visuals */}
              <div className="relative z-10 flex items-center justify-center">
                {status === 'error' ? (
                    <span className="text-2xl animate-pulse">⚠️</span>
                ) : isLive ? (
                    <div className="flex gap-1 items-end h-8">
                        {[1, 2, 3].map(i => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-blue-400 rounded-full transition-all duration-75" 
                                style={{ height: `${Math.max(6, volume * Math.random() * 1.2)}px` }} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                )}
              </div>
           </div>
       </div>

       {/* STATUS & CONTROLS */}
       <div className="mt-6 flex flex-col items-center gap-2 pointer-events-auto">
           {/* Status Label */}
           <div className="px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 shadow-xl flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${status === 'connecting' ? 'animate-ping' : ''}`}></div>
               <div className="text-left">
                   <p className={`text-[10px] font-black uppercase tracking-widest ${status === 'error' ? 'text-red-400' : 'text-slate-200'}`}>
                       {getStatusText()}
                   </p>
                   {detailMsg && <p className="text-[8px] text-slate-500 font-mono truncate max-w-[120px]">{detailMsg}</p>}
               </div>
               
               <button 
                 onClick={onClose} 
                 className="ml-2 w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
               >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
           </div>

           {/* Retry Button (Only on Error/Disconnect) */}
           {(status === 'error' || status === 'disconnected') && (
               <button 
                   onClick={startSession}
                   className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95"
               >
                   Kết nối lại
               </button>
           )}
       </div>
    </div>
  );
};

export default LiveOrb;
