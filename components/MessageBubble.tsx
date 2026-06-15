
import React, { useState } from 'react';
import { MessageRole, ChatMessage, SmartAction, StrategicDNA } from '../types';
import MaturityScoreCard from './MaturityScoreCard'; // Import new component
import { Button } from './ui/Button';

interface MessageBubbleProps {
  msg: ChatMessage;
  onConfirmPlan?: (workflowId: string) => void;
  onAdjustPlan?: (workflowId: string) => void;
  onSmartAction?: (action: SmartAction) => void;
}

const StrategicIdentityCard: React.FC<{ dna: StrategicDNA }> = ({ dna }) => {
  return (
    <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-zinc-900/40 border border-indigo-500/20 shadow-xl overflow-hidden relative">
       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
       <div className="flex items-start gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-3xl shadow-lg backdrop-blur-sm">
             {dna.archetypeIcon || '🏛️'}
          </div>
          <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Brand Archetype</span>
                <div className="h-px flex-1 bg-indigo-500/20"></div>
             </div>
             <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">{dna.archetype}</h3>
             <p className="text-[10px] text-zinc-400 mt-1 font-medium">{dna.toneOfVoice}</p>
          </div>
       </div>
       <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
          <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
             <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-2">Core Values</span>
             <div className="flex flex-wrap gap-1.5">
                {dna.coreValues.map((val, i) => (
                   <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-medium text-indigo-300">{val}</span>
                ))}
             </div>
          </div>
          <div className="p-3 rounded-xl bg-black/20 border border-zinc-800">
             <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Success Probability</span>
             <div className="flex items-end gap-2">
                <span className="text-2xl font-semibold text-emerald-400">{dna.successProbability}%</span>
                <span className="text-[8px] text-zinc-500 mb-1.5">Calculated by AI</span>
             </div>
             <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${dna.successProbability}%` }}></div>
             </div>
          </div>
       </div>
       <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-center">
          <div className="text-amber-500 text-lg">⚠️</div>
          <div>
             <span className="text-[8px] font-mono text-amber-400 uppercase">Primary Risk Factor</span>
             <p className="text-[10px] text-amber-200/80 leading-tight">{dna.riskFactor}</p>
          </div>
       </div>
    </div>
  );
};

const NeuralLogicTrace: React.FC<{ trace: any }> = ({ trace }) => {
    const [expanded, setExpanded] = useState(false);
    if (!trace) return null;

    return (
        <div className="mb-4 bg-zinc-950/50 border border-indigo-500/20 rounded-2xl overflow-hidden backdrop-blur-sm">
            <Button variant="ghost" onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 px-4 hover:bg-white/5 transition-colors h-auto">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider">Neural Logic Active</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-500 font-medium">Confidence: {(trace.confidence * 100).toFixed(0)}%</span>
                    <svg className={`w-3 h-3 text-zinc-500 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </Button>
            {expanded && (
                <div className="p-4 pt-0 border-t border-indigo-500/10 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[9px] text-zinc-500 font-medium uppercase">Drift Applied</span>
                        <div className="flex items-center gap-1">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className={`w-1 h-2 rounded-sm ${i < (trace.driftUsed || 5) ? 'bg-amber-500' : 'bg-zinc-800'}`}></div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] text-zinc-500 font-medium uppercase block mb-1">Memory Accessed</span>
                        <div className="flex flex-wrap gap-1">
                            {trace.memoryAccessed?.map((m: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[9px] border border-indigo-500/20">{m}</span>
                            ))}
                        </div>
                    </div>
                    <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <span className="text-[8px] text-zinc-500 font-medium uppercase block mb-1">Adaptation Strategy</span>
                        <p className="text-[10px] text-zinc-300 italic">"{trace.adaptationStrategy}"</p>
                    </div>

                    {trace.executionSteps && trace.executionSteps.length > 0 && (
                        <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <span className="text-[8px] text-zinc-500 font-medium uppercase block mb-1">Execution Steps</span>
                            <ul className="list-disc list-inside space-y-1">
                                {trace.executionSteps.map((step: string, i: number) => (
                                    <li key={i} className="text-[10px] text-zinc-300">{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}
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
          <div className="relative w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shadow-lg border border-zinc-800 group transition-all duration-500 hover:scale-110">
            <div className={`absolute top-0 left-0 w-full h-0.5 ${msg.workflowAction ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
            <svg className={`w-5 h-5 ${msg.workflowAction ? 'text-amber-500' : 'text-indigo-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 00-2 2z" />
            </svg>
            {msg.neuralPulse && <div className="absolute inset-0 border border-amber-500 rounded-full animate-ping opacity-40"></div>}
          </div>
        </div>
      )}

      <div className={`max-w-[90%] space-y-6 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-6 md:p-8 rounded-3xl shadow-xl relative group transition-all duration-700 ${
          msg.isProcessing ? 'bg-zinc-100 text-zinc-900 border border-amber-500/30' : 
          isUser ? 'bg-zinc-100 text-zinc-900' : 
          'bg-zinc-900/80 border border-zinc-800 text-zinc-100 backdrop-blur-md'
        }`}>
          {msg.masterOversight && (
            <div className="mb-6 p-4 border-l-2 border-amber-500 rounded-r-xl bg-amber-500/10 text-[11px] font-medium text-amber-200">
               <span className="font-mono text-amber-500 uppercase tracking-wider block mb-1">Master Oversight</span>
               "{msg.masterOversight}"
            </div>
          )}

          {msg.neuralTrace && <NeuralLogicTrace trace={msg.neuralTrace} />}
          {msg.strategicDNA && <StrategicIdentityCard dna={msg.strategicDNA} />}
          
          {/* MATURITY SCORE DISPLAY */}
          {msg.maturityScore && <MaturityScoreCard score={msg.maturityScore} />}

          <div className="relative">
            <p className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium ${msg.isProcessing ? 'animate-pulse text-zinc-600 italic' : isUser ? 'text-zinc-900' : 'text-zinc-300'}`}>
              {content.main}
            </p>
          </div>

          {msg.strategicBrief?.contentProposal?.strategy && (
             <div className="mt-6 p-6 rounded-2xl bg-zinc-950/60 border border-indigo-500/20 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                   <span className="text-xl">📄</span>
                   <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Neural Product Document</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-zinc-400 leading-relaxed font-medium">
                   {msg.strategicBrief.contentProposal.strategy.split('\n').map((line, i) => (
                      <p key={i} className={line.trim().startsWith('#') ? 'text-indigo-400 font-semibold mt-4' : line.trim().startsWith('-') ? 'pl-4' : ''}>{line}</p>
                   ))}
                </div>
             </div>
          )}

          {(msg.groundingSources || []).length > 0 && (
            <div className="mt-4 p-4 bg-black/20 rounded-xl border border-zinc-800">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">Neural Grounding Sources</span>
              <div className="flex flex-wrap gap-2">
                {(msg.groundingSources || []).map((source, i) => (
                  <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={2}/></svg>
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {(msg.smartActions || []).length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
               {(msg.smartActions || []).map((action) => (
                 <Button variant="secondary" key={action.id} onClick={() => onSmartAction?.(action)} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 transition-all text-left group h-auto">
                   <div className="flex items-center gap-3">
                      <span className="text-lg group-hover:scale-110 transition-transform">{action.icon}</span>
                      <span className="text-[10px] font-medium text-zinc-300 uppercase">{action.label}</span>
                   </div>
                 </Button>
               ))}
            </div>
          )}

          {msg.workflowAction === 'confirm_plan' && msg.workflowId && (
            <div className="mt-8 pt-6 border-t border-amber-500/20">
              <Button onClick={() => onConfirmPlan?.(msg.workflowId!)} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[11px] font-semibold uppercase tracking-wider shadow-md transition-all">
                PHÊ CHUẨN & TRIỂN KHAI THỰC TẾ
              </Button>
            </div>
          )}

          {msg.modelUsed && (
            <div className="mt-4 flex justify-end">
              <span className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generated by {msg.modelUsed}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
