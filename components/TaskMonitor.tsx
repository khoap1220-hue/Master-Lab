
import React from 'react';
import { TaskLog, AgentRole } from '../types';

interface TaskMonitorProps {
  task: TaskLog | null;
  onClose: () => void;
}

// Added missing roles to AGENT_COLORS to satisfy the Record<AgentRole, string> type constraint
const AGENT_COLORS: Record<AgentRole, string> = {
  MasterOrchestrator: 'text-blue-400',
  StrategicCounsel: 'text-indigo-400', // Added StrategicCounsel
  PixelSmith: 'text-purple-400',
  Visionary: 'text-pink-400',
  Wordsmith: 'text-yellow-400',
  Architect: 'text-emerald-400',
  Sentinel: 'text-red-400',
  MotionMaster: 'text-indigo-400',
  DepthMaster: 'text-cyan-400',
  TypographyExpert: 'text-orange-400',
  LayoutMaster: 'text-lime-400',
  WorkflowMaster: 'text-amber-400',
};

const TaskMonitor: React.FC<TaskMonitorProps> = ({ task, onClose }) => {
  if (!task) return null;

  const progress = Math.round((task.completedSteps / task.totalSteps) * 100);

  return (
    <div className="fixed bottom-32 right-8 w-96 bg-[#0f172a]/95 border border-slate-800 rounded-3xl shadow-3xl backdrop-blur-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-500">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Active Task Monitor</h4>
            <p className="text-[10px] text-slate-500 font-bold">{task.taskName}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase">Tiến độ tổng thể</span>
          <span className="text-sm font-black text-blue-400">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 custom-scrollbar bg-black/20">
        {task.history.slice().reverse().map((step, idx) => (
          <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-top-1">
            <div className="text-[10px] font-mono text-slate-600 pt-0.5">{step.timestamp}</div>
            <div className="flex-1">
              <span className={`text-[10px] font-black uppercase ${AGENT_COLORS[step.agent] || 'text-slate-400'}`}>
                [{step.agent}]
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{step.message}</p>
              {step.details && (
                <p className="text-[10px] text-slate-500 mt-1 italic border-l border-slate-800 pl-2">{step.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-500 uppercase">Status: {task.status.toUpperCase()}</span>
        <div className="flex items-center gap-1">
           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
           <span className="text-[9px] font-bold text-slate-400">Live Telemetry</span>
        </div>
      </div>
    </div>
  );
};

export default TaskMonitor;
