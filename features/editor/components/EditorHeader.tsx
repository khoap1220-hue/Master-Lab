
import React from 'react';

interface EditorHeaderProps {
  mode: 'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup';
  onClose: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ mode, onClose }) => {
  let activeColor = 'bg-blue-600';
  let title = 'Context Studio';
  let subTitle = 'High-Performance Brushing';
  
  if (mode === 'extract') {
    activeColor = 'bg-orange-500';
    title = 'Smart Scan & Cutout (4K)';
    subTitle = 'Select area > Dewarp > Flatten > Upscale > Remove BG';
  } else if (mode === 'enrich') {
    activeColor = 'bg-purple-500';
    title = 'Generative Macro Zoom';
    subTitle = 'Reveal microscopic details & textures (Upres)';
  } else if (mode === 'design_recovery') {
    activeColor = 'bg-cyan-500';
    title = 'Design Publisher Mode';
    subTitle = 'Flatten, Dewarp & Publish designs from photos';
  } else if (mode === 'mockup') {
    activeColor = 'bg-emerald-500';
    title = 'Neural Mockup Studio';
    subTitle = 'Bước 1: Tô vùng muốn đặt nội dung (Biển hiệu, Tường, Bao bì...)';
  }

  return (
    <div className="flex justify-between items-end mb-6 text-white">
      <div className="flex items-center gap-4">
        <div className={`w-1.5 h-10 rounded-full ${activeColor}`}></div>
        <div>
          <h3 className="text-2xl font-black tracking-tighter uppercase">{title}</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{subTitle}</p>
        </div>
      </div>
      <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800 hover:bg-red-500/10 hover:text-red-500 transition-all">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};

export default EditorHeader;
