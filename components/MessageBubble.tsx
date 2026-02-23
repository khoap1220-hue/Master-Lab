
import React, { useState } from 'react';
import { MessageRole, ChatMessage, SmartAction, StrategicDNA } from '../types';
import MaturityScoreCard from './MaturityScoreCard'; // Import new component

interface MessageBubbleProps {
  msg: ChatMessage;
  onConfirmPlan?: (workflowId: string) => void;
  onAdjustPlan?: (workflowId: string) => void;
  onSmartAction?: (action: SmartAction) => void;
}

const StrategicIdentityCard: React.FC<{ dna: StrategicDNA }> = ({ dna }) => {
  return (
    <div className="mb-6 p-6 rounded-[2rem] bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 shadow-xl overflow-hidden relative">
       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
       <div className="flex items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
             {dna.archetypeIcon || '🏛️'}
          </div>
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Brand Archetype</span>
                <div className="h-px flex-1 bg-indigo-500/20"></div>
             </div>
             <h3 className="text-xl font-black text-white tracking-tight">{dna.archetype}</h3>
             <p className="text-[10px] text-slate-400 mt-1 font-medium">{dna.toneOfVoice}</p>
          </div>
       </div>
       <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
          <div className="p-3 rounded-xl bg-black/20 border border-slate-700/50">
             <span className="text-[8px] font-black text-slate-500 uppercase block mb-2">Core Values</span>
             <div className="flex flex-wrap gap-1.5">
                {dna.coreValues.map((val, i) => (
                   <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-300">{val}</span>
                ))}
             </div>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-slate-700/50">
             <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Success Probability</span>
             <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-green-400">{dna.successProbability}%</span>
                <span className="text-[8px] text-slate-500 mb-1.5">Calculated by AI</span>
             </div>
             <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${dna.successProbability}%` }}></div>
             </div>
          </div>
       </div>
       <div className="mt-4 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-3 items-center">
          <div className="text-orange-500 text-lg">⚠️</div>
          <div>
             <span className="text-[8px] font-black text-orange-400 uppercase">Primary Risk Factor</span>
             <p className="text-[10px] text-orange-200/80 leading-tight">{dna.riskFactor}</p>
          </div>
       </div>
    </div>
  );
};

const NeuralLogicTrace: React.FC<{ trace: any }> = ({ trace }) => {
    const [expanded, setExpanded] = useState(false);
    if (!trace) return null;

    return (
        <div className="mb-4 bg-slate-950/50 border border-blue-500/20 rounded-2xl overflow-hidden backdrop-blur-sm">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 px-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Neural Logic Active</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-500 font-medium">Confidence: {(trace.confidence * 100).toFixed(0)}%</span>
                    <svg className={`w-3 h-3 text-slate-500 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>
            {expanded && (
                <div className="p-4 pt-0 border-t border-blue-500/10 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Drift Applied</span>
                        <div className="flex items-center gap-1">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className={`w-1 h-2 rounded-sm ${i < (trace.driftUsed || 5) ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Memory Accessed</span>
                        <div className="flex flex-wrap gap-1">
                            {trace.memoryAccessed?.map((m: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-[9px] border border-blue-500/20">{m}</span>
                            ))}
                        </div>
                    </div>
                    <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                        <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Adaptation Strategy</span>
                        <p className="text-[10px] text-slate-300 italic">"{trace.adaptationStrategy}"</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ msg, onConfirmPlan, onAdjustPlan, onSmartAction }) => {
  const isUser = msg.role === MessageRole.USER;
  
  const parseContent = (text: string) => {
    const safeText = text || "";
    const mainText = safeText.replace(/\[THẤU CẢM\]:?\s*[\s\S]*?(?=\[HÀNH ĐỘNG\]|$)/i, '').replace(/\[HÀNH ĐỘNG\]:?\s*[\s\S]*?$/i, '').trim();
    return { main: mainText || safeText.trim() || "Dữ liệu đang được đồng bộ..." };
  };

  const content = parseContent(msg.text);

  return (
    <div className={`flex gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-700 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-2">
          <div className="relative w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shadow-2xl border-2 border-slate-800 group transition-all duration-500 hover:scale-110">
            <div className={`absolute top-0 left-0 w-full h-1 ${msg.workflowAction ? 'bg-orange-500' : 'bg-blue-600'}`}></div>
            <svg className={`w-6 h-6 ${msg.workflowAction ? 'text-orange-500' : 'text-blue-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 00-2 2z" />
            </svg>
            {msg.neuralPulse && <div className="absolute inset-0 border-2 border-orange-500 rounded-full animate-ping opacity-40"></div>}
          </div>
        </div>
      )}

      <div className={`max-w-[90%] space-y-6 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-8 rounded-[2.5rem] shadow-2xl relative group transition-all duration-700 ${
          msg.isProcessing ? 'bg-white text-slate-900 border-2 border-orange-500/30' : 
          isUser ? 'bg-indigo-600 text-white shadow-indigo-500/20' : 
          'bg-slate-900/98 border border-slate-800/60 text-slate-100 backdrop-blur-xl'
        }`}>
          {msg.masterOversight && (
            <div className="mb-6 p-4 border-l-4 border-orange-500 rounded-r-2xl bg-orange-500/10 text-[11px] font-medium text-orange-200">
               <span className="font-black text-orange-500 uppercase tracking-widest block mb-1">Master Oversight</span>
               "{msg.masterOversight}"
            </div>
          )}

          {msg.neuralTrace && <NeuralLogicTrace trace={msg.neuralTrace} />}
          {msg.strategicDNA && <StrategicIdentityCard dna={msg.strategicDNA} />}
          
          {/* MATURITY SCORE DISPLAY */}
          {msg.maturityScore && <MaturityScoreCard score={msg.maturityScore} />}

          <div className="relative">
            <p className={`text-base leading-relaxed whitespace-pre-wrap font-bold ${msg.isProcessing ? 'animate-pulse text-indigo-800 italic' : 'text-slate-100'}`}>
              {content.main}
            </p>
          </div>

          {msg.strategicBrief?.contentProposal?.strategy && (
             <div className="mt-6 p-6 rounded-3xl bg-slate-950/60 border border-blue-500/30 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                   <span className="text-xl">📄</span>
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Neural Product Document</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed font-medium">
                   {msg.strategicBrief.contentProposal.strategy.split('\n').map((line, i) => (
                      <p key={i} className={line.trim().startsWith('#') ? 'text-blue-400 font-black mt-4' : line.trim().startsWith('-') ? 'pl-4' : ''}>{line}</p>
                   ))}
                </div>
             </div>
          )}

          {(msg.groundingSources || []).length > 0 && (
            <div className="mt-4 p-4 bg-black/30 rounded-2xl border border-slate-800">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Neural Grounding Sources</span>
              <div className="flex flex-wrap gap-2">
                {(msg.groundingSources || []).map((source, i) => (
                  <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={2}/></svg>
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {(msg.smartActions || []).length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-3">
               {(msg.smartActions || []).map((action) => (
                 <button key={action.id} onClick={() => onSmartAction?.(action)} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all text-left group">
                   <div className="flex items-center gap-3">
                      <span className="text-lg group-hover:scale-110 transition-transform">{action.icon}</span>
                      <span className="text-[10px] font-black text-white uppercase">{action.label}</span>
                   </div>
                 </button>
               ))}
            </div>
          )}

          {msg.workflowAction === 'confirm_plan' && msg.workflowId && (
            <div className="mt-8 pt-8 border-t border-orange-500/30">
              <button onClick={() => onConfirmPlan?.(msg.workflowId!)} className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl transition-all">
                PHÊ CHUẨN & TRIỂN KHAI THỰC TẾ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
