
import React, { useState } from 'react';
import { MemoryInsight, NeuralEvent, ThinkingLevel } from '../types';
import { clearMemory, saveMemoryToLocal } from '../services/memoryService';
import { clearEvents } from '../services/registryService';

interface NeuralPanelProps {
  isOpen: boolean;
  onClose: () => void;
  memory: MemoryInsight;
  registry: NeuralEvent[];
}

const THINKING_LEVELS: { id: ThinkingLevel; label: string; desc: string; color: string }[] = [
    { id: 'FAST', label: 'Tốc độ', desc: 'Phản hồi tức thì, bỏ qua suy luận sâu. (0 Tokens)', color: 'text-blue-400' },
    { id: 'BALANCED', label: 'Cân bằng', desc: 'Phân tích vừa đủ cho tác vụ chung. (8k Tokens)', color: 'text-green-400' },
    { id: 'DEEP', label: 'Sâu sắc', desc: 'Suy luận đa chiều, logic chặt chẽ. (16k Tokens)', color: 'text-orange-400' },
    { id: 'MAXIMUM', label: 'Tối đa', desc: 'Dành toàn bộ tài nguyên để giải quyết vấn đề khó. (32k Tokens)', color: 'text-red-500' }
];

const NeuralPanel: React.FC<NeuralPanelProps> = ({ isOpen, onClose, memory, registry = [] }) => {
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleFullReset = () => {
    if (confirm("Hành động này sẽ xóa sạch Bộ nhớ Neural và Nhật ký sự kiện. Bạn có chắc chắn muốn thực hiện?")) {
      setIsResetting(true);
      clearMemory();
      clearEvents();
      // Use a small delay to ensure localstorage is cleared before reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleThinkingChange = (level: ThinkingLevel) => {
      const updatedMemory = { 
          ...memory, 
          semanticKB: { ...memory.semanticKB, thinkingPreference: level } 
      };
      saveMemoryToLocal(updatedMemory);
  };

  const currentThinking = memory?.semanticKB?.thinkingPreference || 'BALANCED';

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] z-[60] bg-slate-950/95 border-l border-slate-800 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500 flex flex-col">
      <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.3em]">Neural Logic Center</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase">Hệ thống quản trị tri thức thấu cảm (Live)</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        
        {/* Cognitive Load Control */}
        <section className="space-y-4">
            <div className="flex justify-between items-end">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cognitive Load Regulator</h3>
                <span className={`text-[10px] font-black uppercase ${THINKING_LEVELS.find(t => t.id === currentThinking)?.color}`}>
                    {currentThinking}
                </span>
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-1 flex border border-slate-800">
                {THINKING_LEVELS.map((level) => (
                    <button
                        key={level.id}
                        onClick={() => handleThinkingChange(level.id)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                            currentThinking === level.id 
                            ? 'bg-slate-800 text-white shadow-lg border border-slate-700' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={level.desc}
                    >
                        {level.label}
                    </button>
                ))}
            </div>
            
            <p className="text-[10px] text-slate-500 italic border-l-2 border-slate-800 pl-3">
                {THINKING_LEVELS.find(t => t.id === currentThinking)?.desc}
            </p>
        </section>

        {/* Creative Drift Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creative Drift Index</h3>
            <span className="text-2xl font-black text-orange-500">{memory?.semanticKB?.creativeDrift || 5}/10</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-orange-500 transition-all duration-1000 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
              style={{ width: `${(memory?.semanticKB?.creativeDrift || 5) * 10}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 italic">Chỉ số này điều phối mức độ đột phá trong các thuật toán PixelSmith.</p>
        </section>

        {/* Semantic KB Section */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Semantic Knowledge Base</h3>
          
          <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
             <span className="text-[9px] font-black text-indigo-400 uppercase block">Aesthetic Evolution</span>
             <p className="text-xs text-slate-300 font-medium leading-relaxed italic">"{memory?.semanticKB?.aestheticEvolution || 'Khởi tạo thực thể'}"</p>
          </div>

          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
             <span className="text-[9px] font-black text-blue-400 uppercase block">Current Focus</span>
             <p className="text-xs text-slate-300 font-medium leading-relaxed">"{memory?.currentFocus || 'Chưa xác định'}"</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
               <span className="text-[8px] font-black text-slate-500 uppercase block mb-2">Style Trends</span>
               <div className="flex flex-wrap gap-1">
                  {(memory?.semanticKB?.styleTrends || []).length > 0 ? (
                    memory.semanticKB.styleTrends.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-[9px] text-slate-300 border border-slate-700">{t}</span>
                    ))
                  ) : <span className="text-[9px] text-slate-600 italic">Chưa có dữ liệu</span>}
               </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
               <span className="text-[8px] font-black text-slate-500 uppercase block mb-2">Strategic Goals</span>
               <div className="space-y-1">
                  {(memory?.semanticKB?.strategicGoals || []).map((g, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                       <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                       <span className="text-[9px] text-slate-400 font-bold">{g}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* Neural History */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Event Ledger</h3>
            <span className="text-[9px] font-mono text-slate-600">Total: {(registry || []).length} events</span>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {(registry || []).map((event) => (
              <div key={event.id} className="group p-4 rounded-2xl border border-slate-800 bg-black/20 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${event.metadata?.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter">{event.type}</span>
                   </div>
                   <span className="text-[8px] font-mono text-slate-600">{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-3">
                   <span className="px-2 py-0.5 bg-slate-800 rounded text-[8px] font-bold text-slate-500">{event.metadata?.model || 'Unknown Model'}</span>
                   {event.metadata?.latency && <span className="text-[8px] font-mono text-slate-600">{event.metadata.latency}ms</span>}
                </div>
                {event.metadata?.userPrompt && (
                  <p className="text-[9px] text-slate-500 mt-2 line-clamp-1 italic">"{event.metadata.userPrompt}"</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-8 border-t border-slate-800 bg-slate-900/20">
        <div className="flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">System Authority</span>
              <span className="text-xs font-black text-white uppercase">Level {memory?.systemAuthorityLevel || 10}</span>
           </div>
           <button 
             onClick={handleFullReset} 
             disabled={isResetting}
             className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest border-slate-700 transition-all ${isResetting ? 'bg-slate-700 text-slate-500 cursor-wait' : 'bg-slate-800 hover:bg-red-600 hover:border-red-400 text-slate-300 hover:text-white'}`}
           >
             {isResetting ? 'Cleaning...' : 'Reset Neural Core'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default NeuralPanel;
