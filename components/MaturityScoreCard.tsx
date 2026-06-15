
import React from 'react';
import { MaturityScore } from '../types';

interface MaturityScoreCardProps {
  score: MaturityScore;
}

const MaturityScoreCard: React.FC<MaturityScoreCardProps> = ({ score }) => {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (grade === 'B') return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    if (grade === 'C') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="mt-6 p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-xl overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]"></div>
      
      <div className="flex items-start justify-between relative z-10 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
             <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">Neural Audit Report</span>
          </div>
          <h3 className="text-xl font-semibold text-zinc-100">Thang điểm trưởng thành</h3>
        </div>
        <div className={`px-4 py-2 rounded-2xl border ${getGradeColor(score.grade)} flex flex-col items-center justify-center min-w-[70px]`}>
           <span className="text-2xl font-semibold">{score.grade}</span>
           <span className="text-[8px] font-mono uppercase opacity-60">System Grade</span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {score.criteria.map((item, idx) => (
          <div key={idx} className="space-y-2">
             <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{item.label}</span>
                <span className="text-xs font-mono font-medium text-zinc-100">{item.score}%</span>
             </div>
             <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                    style={{ width: `${item.score}%` }}
                ></div>
             </div>
             <p className="text-[10px] text-zinc-500 italic leading-relaxed pl-2 border-l border-zinc-700">
                {item.feedback}
             </p>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-800 relative z-10">
         <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-2 tracking-wider">Master Counsel Verdict</span>
         <p className="text-xs text-zinc-300 font-medium leading-relaxed bg-zinc-900/50 p-4 rounded-2xl italic border border-zinc-800">
            "{score.summary}"
         </p>
      </div>

      {/* Decorative Index */}
      <div className="absolute bottom-4 right-6 opacity-5 pointer-events-none">
         <span className="text-6xl font-semibold">{(score.totalScore / 10).toFixed(1)}</span>
      </div>
    </div>
  );
};

export default MaturityScoreCard;
