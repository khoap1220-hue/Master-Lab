
import React, { useState, useEffect, useRef } from 'react';
import { Workflow, WorkflowTask, AgentRole } from '../../../types';

interface WorkflowCardProps {
  workflow: Workflow;
}

// --- CONFIG: Simulated Tech Jargon for "Wait Time" Entertainment ---
const SYSTEM_LOGS = [
  "Allocating neural buffers...",
  "Quantizing attention weights...",
  "Synchronizing vector context...",
  "Optimizing tensor graphs...",
  "Fetching semantic layers...",
  "Denoising latent space...",
  "Handshake with Tier-Heavy Node...",
  "Verifying creative constraints...",
  "Applying aesthetic gradients..."
];

const AGENT_COLORS: Record<AgentRole, string> = {
  MasterOrchestrator: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  StrategicCounsel: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  PixelSmith: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  Visionary: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  Wordsmith: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  Architect: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  Sentinel: 'text-red-400 border-red-500/30 bg-red-500/10',
  MotionMaster: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  DepthMaster: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  TypographyExpert: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  LayoutMaster: 'text-lime-400 border-lime-500/30 bg-lime-500/10',
  WorkflowMaster: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
};

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTerminal, setShowTerminal] = useState(true);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulate "Live Activity" when executing
  useEffect(() => {
    if (workflow.status === 'executing' || workflow.status === 'planning') {
      const interval = setInterval(() => {
        const randomLog = SYSTEM_LOGS[Math.floor(Math.random() * SYSTEM_LOGS.length)];
        const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const latency = Math.floor(Math.random() * 200) + 50;
        
        setLogs(prev => [`[${timestamp}] ${randomLog} (${latency}ms)`, ...prev].slice(0, 8));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [workflow.status]);

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `workflow-result-${workflow.id}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (!workflow.resultImages) return;
    workflow.resultImages.forEach((img, idx) => {
      setTimeout(() => handleDownload(img, idx), idx * 500);
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'executing': return 'Running Neural Threads...';
      case 'completed': return 'Process Completed';
      case 'planning': return 'Architecting Solution...';
      case 'gathering': return 'Awaiting Inputs';
      case 'failed': return 'Process Interrupted';
      default: return status;
    }
  };

  const activeTask = workflow.tasks?.find(t => t.status === 'processing');
  const hasResults = workflow.resultImages && workflow.resultImages.length > 0;

  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 group">
      
      {/* HEADER */}
      <div className="p-5 border-b border-slate-800/50 flex items-start justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-transparent">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className={`w-2 h-2 rounded-full ${workflow.status === 'executing' ? 'bg-green-500 animate-pulse' : workflow.status === 'completed' ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
             <h4 className="text-xs font-black text-white uppercase tracking-widest">{workflow.name}</h4>
          </div>
          <p className="text-[10px] font-mono text-slate-400">{getStatusLabel(workflow.status)}</p>
        </div>
        
        <div className="text-right">
           <span className="text-2xl font-black text-white block leading-none">{workflow.progress}%</span>
           <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Completion</span>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="h-1 w-full bg-slate-800/50">
        <div 
          className={`h-full transition-all duration-700 ease-out ${workflow.status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`} 
          style={{ width: `${workflow.progress}%` }}
        ></div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* ACTIVE TASK SPOTLIGHT */}
        {activeTask && (
          <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 animate-pulse-slow">
             <div className="absolute top-0 right-0 p-2 opacity-20">
                <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-1.5 py-0.5 rounded bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">Active Agent</span>
                   <span className={`text-[10px] font-black uppercase ${AGENT_COLORS[activeTask.assignedAgent] || 'text-slate-400'}`}>{activeTask.assignedAgent}</span>
                </div>
                <h5 className="text-sm font-bold text-white mb-1">{activeTask.name}</h5>
                <p className="text-[10px] text-orange-200/70 italic">"{activeTask.description || 'Processing...'}"</p>
             </div>
          </div>
        )}

        {/* LIVE TERMINAL */}
        {(workflow.status === 'executing' || workflow.status === 'planning') && showTerminal && (
           <div className="rounded-xl bg-black/50 border border-slate-800 p-3 font-mono">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-green-500 animate-ping"></span>
                    Live Neural Stream
                 </span>
                 <button onClick={() => setShowTerminal(false)} className="text-[8px] text-slate-600 hover:text-slate-400">Hide</button>
              </div>
              <div ref={scrollRef} className="h-20 overflow-y-auto custom-scrollbar space-y-1">
                 {logs.map((log, i) => (
                    <div key={i} className="text-[9px] text-green-400/80 truncate">
                       <span className="text-slate-600 mr-2">&gt;</span>{log}
                    </div>
                 ))}
                 <div className="text-[9px] text-green-500 animate-pulse">_</div>
              </div>
           </div>
        )}

        {/* TASK TIMELINE */}
        <div className="space-y-0 relative">
           {/* Connecting Line */}
           <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-800 z-0"></div>
           
           {(workflow.tasks || []).slice().reverse().slice(0, 5).map((task, idx) => (
             <div key={task.id} className="relative z-10 flex gap-3 group">
                <div className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                   task.status === 'completed' ? 'bg-slate-900 border-green-500 text-green-500' :
                   task.status === 'processing' ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] scale-110' :
                   'bg-slate-900 border-slate-700 text-slate-600'
                }`}>
                   {task.status === 'completed' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                   {task.status === 'processing' && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
                   {task.status === 'pending' && <div className="w-2 h-2 bg-slate-700 rounded-full"></div>}
                </div>
                
                <div className={`flex-1 pb-4 transition-all ${task.status === 'pending' ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                   <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 px-2 py-0.5 rounded border ${
                         task.status === 'processing' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                         AGENT_COLORS[task.assignedAgent] || 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                         {task.assignedAgent}
                      </span>
                      <span className="text-[8px] text-slate-600 font-mono">{task.status}</span>
                   </div>
                   <p className={`text-[10px] font-bold mt-1 ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                      {task.name}
                   </p>
                </div>
             </div>
           ))}
           {(workflow.tasks || []).length > 5 && (
              <div className="text-center text-[9px] text-slate-600 italic py-2">
                 + {(workflow.tasks || []).length - 5} tasks prior...
              </div>
           )}
        </div>

        {/* RESULTS GRID */}
        {hasResults && (
          <div className="pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Deliverables</span>
                <button 
                   onClick={handleDownloadAll}
                   className="text-[9px] font-bold text-blue-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Download All
                </button>
             </div>
             
             <div className="grid grid-cols-4 gap-2">
                {workflow.resultImages!.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 cursor-pointer" onClick={() => handleDownload(img, idx)}>
                     <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Result ${idx}`} />
                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowCard;
