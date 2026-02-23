
import React from 'react';
import { MaturityScore } from '../types';

interface MaturityScoreCardProps {
  score: MaturityScore;
}

const MaturityScoreCard: React.FC<MaturityScoreCardProps> = ({ score }) => {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (grade === 'B') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (grade === 'C') return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="mt-6 p-6 rounded-[2.5rem] bg-slate-950/80 border border-white/10 shadow-2xl overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px]"></div>
      
      <div className="flex items-start justify-between relative z-10 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Neural Audit Report</span>
          </div>
          <h3 className="text-xl font-black text-white">Thang điểm trưởng thành</h3>
        </div>
        <div className={`px-4 py-2 rounded-2xl border ${getGradeColor(score.grade)} flex flex-col items-center justify-center min-w-[70px]`}>
           <span className="text-2xl font-black">{score.grade}</span>
           <span className="text-[8px] font-bold uppercase opacity-60">System Grade</span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {score.criteria.map((item, idx) => (
          <div key={idx} className="space-y-2">
             <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                <span className="text-xs font-mono font-bold text-white">{item.score}%</span>
             </div>
             <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 transition-all duration-1000 ease-out"
                    style={{ width: `${item.score}%` }}
                ></div>
             </div>
             <p className="text-[10px] text-slate-500 italic leading-relaxed pl-2 border-l border-slate-700">
                {item.feedback}
             </p>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
         <span className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Master Counsel Verdict</span>
         <p className="text-xs text-slate-300 font-medium leading-relaxed bg-white/5 p-4 rounded-2xl italic border border-white/5">
            "{score.summary}"
         </p>
      </div>

      {/* Decorative Index */}
      <div className="absolute bottom-4 right-6 opacity-5 pointer-events-none">
         <span className="text-6xl font-black">{(score.totalScore / 10).toFixed(1)}</span>
      </div>
    </div>
  );
};

export default MaturityScoreCard;
