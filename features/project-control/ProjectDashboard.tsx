
import React from 'react';
import { Workflow } from '../../types';
import WorkflowCard from './components/WorkflowCard';

interface ProjectDashboardProps {
  workflows: Workflow[];
}

export default function ProjectDashboard({ workflows = [] }: ProjectDashboardProps) {
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-10 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl flex items-center justify-center mb-8 animate-bounce-slow">
               <span className="text-4xl">🚀</span>
            </div>
            
            <h2 className="text-lg font-black uppercase text-white tracking-widest mb-3">Khởi tạo Dự án</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-8">
               Hệ thống Neural đã sẵn sàng. Hãy chọn một <b>Danh mục (Category)</b> từ thanh điều khiển bên trái để bắt đầu quy trình sáng tạo.
            </p>

            {/* Visual Guide Arrow pointing left (assuming sidebar is left) */}
            <div className="hidden xl:flex items-center gap-4 text-slate-600 animate-pulse">
                <svg className="w-6 h-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-widest">Bắt đầu từ đây</span>
            </div>
            
            {/* Mobile/Tablet Guide */}
            <div className="xl:hidden px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
               <span className="text-[10px] text-slate-400">Nhấn vào icon <b>Menu</b> ở góc trên bên trái</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between mb-6">
         <h2 className="text-sm font-black text-white uppercase tracking-widest">Active Projects ({workflows.length})</h2>
         <div className="h-px flex-1 bg-slate-800 ml-4"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {workflows.map(wf => (
          <WorkflowCard key={wf.id} workflow={wf} />
        ))}
      </div>
    </div>
  );
}
