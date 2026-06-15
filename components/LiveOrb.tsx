
import React, { useEffect, useState, useRef } from 'react';
import { LiveSessionManager } from '../services/live/liveSession';
import { Button } from './ui/Button';

interface LiveOrbProps {
  onClose: () => void;
  onAgentAction: (prompt: string, intent: string) => void;
}

const LiveOrb: React.FC<LiveOrbProps> = ({ onClose, onAgentAction }) => {
  const [status, setStatus] = useState('idle'); // idle, initializing, connecting, connected, error, disconnected
  const [detailMsg, setDetailMsg] = useState('');
  const [volume, setVolume] = useState(0); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const managerRef = useRef<LiveSessionManager | null>(null);
  const onAgentActionRef = useRef(onAgentAction);

  useEffect(() => {
      onAgentActionRef.current = onAgentAction;
  }, [onAgentAction]);

  // Auto-connect on mount
  useEffect(() => {
    let isMounted = true;
    
    const startSession = async () => {
        if (managerRef.current) {
            managerRef.current.disconnect();
        }
        
        if (!isMounted) return;

        const manager = new LiveSessionManager(
            (s, detail) => {
                if (!isMounted) return;
                setStatus(s);
                if (detail) setDetailMsg(detail);
            },
            (v, type) => {
                if (!isMounted) return;
                setVolume(v);
                if (type === 'output' && v > 10) {
                    setIsSpeaking(true);
                    setTimeout(() => {
                        if (isMounted) setIsSpeaking(false);
                    }, 200); // Debounce speaking state
                }
            },
            (prompt, intent) => {
                if (!isMounted) return;
                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                // Trigger action in main app
                onAgentActionRef.current(prompt, intent);
            }
        );
        
        managerRef.current = manager;
        await manager.connect();
    };

    startSession();

    return () => {
        isMounted = false;
        if (managerRef.current) {
            managerRef.current.disconnect();
            managerRef.current = null;
        }
    };
  }, []); // Empty dependency array to run only once on mount

  const handleRetry = () => {
      if (managerRef.current) {
          managerRef.current.disconnect();
      }
      setStatus('idle');
      setDetailMsg('');
      
      const manager = new LiveSessionManager(
          (s, detail) => {
              setStatus(s);
              if (detail) setDetailMsg(detail);
          },
          (v, type) => {
              setVolume(v);
              if (type === 'output' && v > 10) {
                  setIsSpeaking(true);
                  setTimeout(() => setIsSpeaking(false), 200);
              }
          },
          (prompt, intent) => {
              if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
              onAgentActionRef.current(prompt, intent);
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
          case 'connected': return isSpeaking ? 'Fenrir đang nói...' : 'Đang lắng nghe...';
          case 'error': return 'Lỗi kết nối';
          case 'disconnected': return 'Đã ngắt';
          default: return status;
      }
  };

  const getStatusColor = () => {
      switch(status) {
          case 'connected': return isSpeaking ? 'bg-emerald-500' : 'bg-indigo-500';
          case 'error': return 'bg-red-500';
          case 'disconnected': return 'bg-zinc-500';
          default: return 'bg-amber-500';
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
             className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl transition-all duration-300 ${status === 'error' ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}
             style={{ 
                 opacity: isLive ? 0.5 + (volume/200) : 0.2,
                 transform: `translate(-50%, -50%) scale(${scale * 1.1})` 
             }}
           ></div>

           {/* Sphere Core */}
           <div 
             className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 border shadow-2xl backdrop-blur-md overflow-hidden ${
                 status === 'error' ? 'bg-red-950/90 border-red-500/50' :
                 isLive ? 'bg-black/90 border-indigo-400/50' :
                 'bg-zinc-900 border-zinc-700'
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
                                className="w-1.5 bg-indigo-400 rounded-full transition-all duration-75" 
                                style={{ height: `${Math.max(6, volume * Math.random() * 1.2)}px` }} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="w-3 h-3 bg-zinc-500 rounded-full"></div>
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
                   <p className={`text-[10px] font-semibold uppercase tracking-widest ${status === 'error' ? 'text-red-400' : 'text-zinc-200'}`}>
                       {getStatusText()}
                   </p>
                   {detailMsg && <p className="text-[8px] text-zinc-500 font-mono truncate max-w-[120px]">{detailMsg}</p>}
               </div>
               
               <Button 
                 variant="ghost"
                 onClick={onClose} 
                 className="ml-2 w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors h-auto p-0"
               >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </Button>
           </div>

           {/* Retry Button (Only on Error/Disconnect) */}
           {(status === 'error' || status === 'disconnected') && (
               <Button 
                   size="sm"
                   onClick={handleRetry}
                   className="text-[9px] font-bold uppercase tracking-wider shadow-lg"
               >
                   Kết nối lại
               </Button>
           )}
       </div>
    </div>
  );
};

export default LiveOrb;
