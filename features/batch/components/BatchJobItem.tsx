
import React, { useState, useEffect } from 'react';
import { BatchJob } from '../../../types';

export interface BatchJobItemProps {
  job: BatchJob;
  activeJobId: string | null;
  setActiveJobId: (id: string) => void;
  mode: 'remove-bg' | 'upscale' | 'print-prep' | 'auto-mockup' | 'decompose' | 'localize' | 'font-creation' | 'vectorize' | 'product-360' | 'viral-story';
  onRemove: (id: string) => void;
}

const BatchJobItem: React.FC<BatchJobItemProps> = ({ job, activeJobId, setActiveJobId, mode, onRemove }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Auto-reset confirmation state after 3 seconds if not clicked
  useEffect(() => {
    if (isConfirmingDelete) {
        const timer = setTimeout(() => setIsConfirmingDelete(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [isConfirmingDelete]);

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isConfirmingDelete) {
          onRemove(job.id);
      } else {
          setIsConfirmingDelete(true);
      }
  };
  
  const getStatusDisplay = (job: BatchJob) => {
    if (job.status === 'failed') return { text: job.error || 'Failed', color: 'text-red-500', icon: '🔴' };
    if (job.status === 'preprocessing') {
      return { text: mode === 'auto-mockup' ? 'Initializing AI...' : 'Preparing...', color: 'text-blue-400', icon: '⏳' };
    }
    
    // Detailed Status Mapping
    if (job.status === 'analyzing_context') return { text: 'Analyzing Space...', color: 'text-indigo-400', icon: '👁️' };
    if (job.status === 'placing_neural') return { text: 'Neural Placement...', color: 'text-purple-400', icon: '🧠' };
    if (job.status === 'decomposing') return { text: job.progressMessage || 'Decomposing...', color: 'text-purple-400', icon: '🧩' };
    if (job.status === 'localizing') return { text: job.progressMessage || 'Localizing...', color: 'text-cyan-400', icon: '🌐' };
    if (job.status === 'vectorizing') return { text: job.progressMessage || 'Vectorizing...', color: 'text-pink-400', icon: '🅰️' };
    
    if (job.status === 'scripting') return { text: job.progressMessage || 'Brainstorming...', color: 'text-indigo-400', icon: '📝' };
    if (job.status === 'rendering_video') return { text: job.progressMessage || 'Rendering...', color: 'text-red-400', icon: '🎬' };

    if (job.status === 'refining') return { text: 'Refining...', color: 'text-orange-400', icon: '✨' };
    if (job.status === 'matting') return { text: 'Masking...', color: 'text-cyan-400', icon: '🖌️' };
    
    if (job.status === 'completed') {
        if (job.extractedAssets && job.extractedAssets.length > 0) {
            return { text: `${job.extractedAssets.length} Assets Found`, color: 'text-green-400', icon: '✅' };
        }
        if (job.fontFamilyName) {
            return { text: 'Font Ready', color: 'text-green-400', icon: '🔤' };
        }
        if (job.viralPlan) {
            return { text: job.videoUrl ? 'Video Ready' : 'Script Ready', color: 'text-green-400', icon: job.videoUrl ? '🎥' : '📜' };
        }
        return { text: 'Complete', color: 'text-green-400', icon: '✅' };
    }
    
    return { text: 'Queued', color: 'text-slate-600', icon: '•' };
  };

  const status = getStatusDisplay(job);
  const isJobRunning = ['preprocessing', 'matting', 'refining', 'analyzing_context', 'placing_neural', 'decomposing', 'localizing', 'vectorizing', 'scripting', 'rendering_video', 'visualizing_hooks', 'drafting_content', 'rendering_visuals'].includes(job.status);
  const radius = 14;
  const circumference = 2 * Math.PI * radius;

  return (
    <div 
      className={`group relative p-3 rounded-xl flex items-center gap-3 cursor-pointer border transition-all ${
        activeJobId === job.id 
        ? 'bg-slate-900 border-slate-700 shadow-lg ring-1 ring-slate-700' 
        : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'
      }`}
      onClick={() => !isConfirmingDelete && setActiveJobId(job.id)}
    >
      <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 border border-slate-700 relative">
        <img src={job.resultUrl || job.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="thumbnail" />
        
        {isJobRunning && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[1px]">
              {job.progress !== undefined ? (
                  <div className="relative w-8 h-8">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle className="text-slate-700" strokeWidth="3" stroke="currentColor" fill="transparent" r={radius} cx="16" cy="16" />
                          <circle 
                              className="text-blue-500"
                              strokeWidth="3"
                              strokeDasharray={circumference}
                              strokeDashoffset={circumference - (job.progress / 100) * circumference}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r={radius}
                              cx="16"
                              cy="16"
                              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                          />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">{job.progress}%</span>
                  </div>
              ) : (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              )}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
            <p className={`text-[11px] font-bold truncate pr-6 ${activeJobId === job.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {job.file.name}
            </p>
        </div>
        
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
             <span className="text-[8px]">{status.icon}</span>
             <span className={`text-[9px] uppercase tracking-wider font-black truncate max-w-[100px] ${status.color}`} title={job.status === 'failed' ? job.error : ''}>
                {status.text}
             </span>
          </div>
          <span className="text-[9px] text-slate-600 font-mono">{Math.round(job.file.size / 1024)}KB</span>
        </div>
      </div>

      <button 
        onClick={handleDeleteClick}
        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${
            isConfirmingDelete 
            ? 'bg-red-600 text-white opacity-100 scale-110 shadow-lg' 
            : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'
        }`}
        title={isConfirmingDelete ? "Confirm Delete" : "Remove Job"}
      >
        {isConfirmingDelete ? (
            <span className="text-[8px] font-black px-1">CONFIRM</span>
        ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        )}
      </button>
    </div>
  );
};

export default BatchJobItem;
