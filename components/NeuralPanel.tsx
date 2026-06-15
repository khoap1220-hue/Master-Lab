
import React, { useState } from 'react';
import { MemoryInsight, NeuralEvent, ThinkingLevel } from '../types';
import { clearMemory, saveMemoryToLocal } from '../services/memoryService';
import { clearEvents } from '../services/registryService';
import { Button } from './ui/Button';

interface NeuralPanelProps {
  isOpen: boolean;
  onClose: () => void;
  memory: MemoryInsight;
  registry: NeuralEvent[];
}

const THINKING_LEVELS: { id: ThinkingLevel; label: string; desc: string; color: string }[] = [
    { id: 'FAST', label: 'Tốc độ', desc: 'Phản hồi tức thì, bỏ qua suy luận sâu. (0 Tokens)', color: 'text-blue-400' },
    { id: 'BALANCED', label: 'Cân bằng', desc: 'Phân tích vừa đủ cho tác vụ chung. (8k Tokens)', color: 'text-emerald-400' },
    { id: 'DEEP', label: 'Sâu sắc', desc: 'Suy luận đa chiều, logic chặt chẽ. (16k Tokens)', color: 'text-amber-400' },
    { id: 'MAXIMUM', label: 'Tối đa', desc: 'Dành toàn bộ tài nguyên để giải quyết vấn đề khó. (32k Tokens)', color: 'text-red-500' }
];

const NeuralPanel: React.FC<NeuralPanelProps> = ({ isOpen, onClose, memory, registry = [] }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleFullReset = () => {
      setIsResetting(true);
      clearMemory();
      clearEvents();
      // Use a small delay to ensure localstorage is cleared before reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
  };

  const handleThinkingChange = (level: ThinkingLevel) => {
      if (!memory) return;
      const updatedMemory: MemoryInsight = { 
          ...memory, 
          semanticKB: { 
              ...memory.semanticKB, 
              thinkingPreference: level 
          } 
      };
      saveMemoryToLocal(updatedMemory);
  };

  const currentThinking = memory?.semanticKB?.thinkingPreference || 'BALANCED';

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] z-[60] bg-zinc-950/95 border-l border-zinc-800 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500 flex flex-col">
      <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-widest">Neural Logic Center</h2>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium uppercase">Hệ thống quản trị tri thức thấu cảm (Live)</p>
        </div>
        <Button variant="secondary" onClick={onClose} className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all h-auto p-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        
        {/* Cognitive Load Control */}
        <section className="space-y-4">
            <div className="flex justify-between items-end">
                <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Cognitive Load Regulator</h3>
                <span className={`text-[10px] font-mono uppercase ${THINKING_LEVELS.find(t => t.id === currentThinking)?.color}`}>
                    {currentThinking}
                </span>
            </div>
            
            <div className="bg-zinc-900 rounded-2xl p-1 flex border border-zinc-800">
                {THINKING_LEVELS.map((level) => (
                    <Button
                        variant="ghost"
                        key={level.id}
                        onClick={() => handleThinkingChange(level.id)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-semibold uppercase tracking-wider transition-all h-auto ${
                            currentThinking === level.id 
                            ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={level.desc}
                    >
                        {level.label}
                    </Button>
                ))}
            </div>
            
            <p className="text-[10px] text-zinc-500 italic border-l-2 border-zinc-800 pl-3">
                {THINKING_LEVELS.find(t => t.id === currentThinking)?.desc}
            </p>
        </section>

        {/* Creative Drift Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Creative Drift Index</h3>
            <span className="text-2xl font-semibold text-amber-500">{memory?.semanticKB?.creativeDrift || 5}/10</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              style={{ width: `${(memory?.semanticKB?.creativeDrift || 5) * 10}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-zinc-500 italic">Chỉ số này điều phối mức độ đột phá trong các thuật toán PixelSmith.</p>
        </section>

        {/* Semantic KB Section */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Semantic Knowledge Base</h3>
          
          <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
             <span className="text-[9px] font-mono text-indigo-400 uppercase block">Aesthetic Evolution</span>
             <p className="text-xs text-zinc-300 font-medium leading-relaxed italic">"{memory?.semanticKB?.aestheticEvolution || 'Khởi tạo thực thể'}"</p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
             <span className="text-[9px] font-mono text-blue-400 uppercase block">Current Focus</span>
             <p className="text-xs text-zinc-300 font-medium leading-relaxed">"{memory?.currentFocus || 'Chưa xác định'}"</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
               <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-2">Style Trends</span>
               <div className="flex flex-wrap gap-1">
                  {(memory?.semanticKB?.styleTrends || []).length > 0 ? (
                    memory.semanticKB?.styleTrends?.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-300 border border-zinc-700">{t}</span>
                    ))
                  ) : <span className="text-[9px] text-zinc-600 italic">Chưa có dữ liệu</span>}
               </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
               <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-2">Strategic Goals</span>
               <div className="space-y-1">
                  {(memory?.semanticKB?.strategicGoals || []).map((g, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                       <div className="w-1 h-1 rounded-full bg-amber-500"></div>
                       <span className="text-[9px] text-zinc-400 font-medium">{g}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Neural History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Neural Event Ledger</h3>
            <span className="text-[9px] font-mono text-zinc-600">Total: {(registry || []).length} events</span>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {(registry || []).map((event) => (
              <div key={event.id} className="group p-4 rounded-2xl border border-zinc-800 bg-black/20 hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${event.metadata?.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-semibold text-white uppercase tracking-tight">{event.type}</span>
                   </div>
                   <span className="text-[8px] font-mono text-zinc-600">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-3">
                   <span className="px-2 py-0.5 bg-zinc-800 rounded text-[8px] font-medium text-zinc-500">{event.metadata?.model || 'Unknown Model'}</span>
                   {event.metadata?.latency && <span className="text-[8px] font-mono text-zinc-600">{event.metadata.latency}ms</span>}
                </div>
                {event.metadata?.userPrompt && (
                  <p className="text-[9px] text-zinc-500 mt-2 line-clamp-1 italic">"{event.metadata.userPrompt}"</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-8 border-t border-zinc-800 bg-zinc-900/20">
        <div className="flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">System Authority</span>
              <span className="text-xs font-semibold text-white uppercase">Level {memory?.systemAuthorityLevel || 10}</span>
           </div>
           <Button 
             onClick={() => setShowConfirm(true)} 
             disabled={isResetting}
             variant="secondary"
             className={`px-4 py-2 rounded-xl border text-[10px] font-semibold uppercase tracking-wider border-zinc-700 transition-all ${isResetting ? 'bg-zinc-700 text-zinc-500 cursor-wait' : 'bg-zinc-800 hover:bg-red-600 hover:border-red-400 text-zinc-300 hover:text-white'}`}
           >
             {isResetting ? 'Cleaning...' : 'Reset Neural Core'}
           </Button>
        </div>
      </div>

      {/* Custom Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold text-white mb-2">Xác nhận Reset</h3>
            <p className="text-sm text-zinc-400 mb-6">Hành động này sẽ xóa sạch Bộ nhớ Neural và Nhật ký sự kiện. Bạn có chắc chắn muốn thực hiện?</p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="secondary"
                onClick={() => setShowConfirm(false)}
              >
                Hủy
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirm(false);
                  handleFullReset();
                }}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                Xóa sạch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuralPanel;
