
import React, { useState, useEffect, useRef } from 'react';

interface ImageRef {
  url: string;
  label: string;
}

interface EditorToolbarProps {
  mode: 'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup';
  setMode: (mode: 'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onClear: () => void;
  onUndo: () => void; // NEW
  onApply: (prompt?: string) => void; 
  availableImages: ImageRef[];
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  mode,
  setMode,
  brushSize,
  setBrushSize,
  onClear,
  onUndo,
  onApply,
  availableImages
}) => {
  const [prompt, setPrompt] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setPrompt('');
  }, [mode]);

  useEffect(() => {
    const lastAtPos = prompt.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const textAfterAt = prompt.slice(lastAtPos + 1);
      if (!textAfterAt.includes(' ')) {
        setShowPicker(true);
        setFilter(textAfterAt.toLowerCase());
      } else {
        setShowPicker(false);
      }
    } else {
      setShowPicker(false);
    }
  }, [prompt]);

  const handleSelectImage = (label: string) => {
    const lastAtPos = prompt.lastIndexOf('@');
    const newText = prompt.slice(0, lastAtPos) + `@${label} `;
    setPrompt(newText);
    setShowPicker(false);
    inputRef.current?.focus();
  };

  const handleApply = () => {
    onApply(prompt);
  };

  const getPlaceholder = () => {
    if (mode === 'draw') return 'Nhập lệnh chỉnh sửa (vd: đổi màu, xóa vật thể)...';
    if (mode === 'extract') return 'Ghi chú thêm về vật thể cần Scan (vd: Hóa đơn, Logo)...';
    if (mode === 'enrich') return 'Mô tả chi tiết cần làm rõ (vd: vân gỗ, sợi vải)...';
    if (mode === 'design_recovery') return 'Ghi chú về thiết kế phẳng...';
    if (mode === 'mockup') return 'Bước 2: Gõ "@" để chọn Logo/Ảnh muốn đặt vào vùng này...';
    return 'Nhập yêu cầu...';
  };

  const filteredImages = availableImages.filter(img => 
    img.label.toLowerCase().includes(filter)
  );

  return (
    <div className="mt-6 flex flex-col gap-4 w-full max-w-6xl mx-auto">
      
      {/* 1. Generative Input Layer */}
      {mode !== 'pin' && (
        <div className="relative z-50">
           {showPicker && (
              <div className="absolute bottom-full left-0 w-full mb-3 bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-3 px-2">
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Select Neural Asset</span>
                     <span className="text-[9px] text-slate-500">{filteredImages.length} matches</span>
                  </div>
                  
                  {filteredImages.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {filteredImages.map((img, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleSelectImage(img.label)}
                            className="flex-shrink-0 relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all group"
                          >
                            <img src={img.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[8px] font-bold text-white uppercase truncate px-1">{img.label}</span>
                            </div>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-[9px] text-slate-500 italic">No matching assets found</div>
                  )}
              </div>
           )}

           <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700 p-2 rounded-2xl shadow-xl backdrop-blur-xl">
             <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
             </div>
             <input 
               ref={inputRef}
               type="text" 
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder={getPlaceholder()}
               className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0"
               onKeyDown={(e) => e.key === 'Enter' && handleApply()}
             />
             {prompt && (
               <button onClick={() => setPrompt('')} className="text-slate-500 hover:text-white p-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             )}
           </div>
        </div>
      )}

      {/* 2. Tools Layer */}
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6 backdrop-blur-2xl">
        <div className="flex bg-black/40 rounded-2xl p-1.5 border border-slate-800 gap-1 overflow-x-auto custom-scrollbar max-w-[500px]">
          <button onClick={() => setMode('draw')} className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all flex-shrink-0 ${mode === 'draw' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            BRUSH
          </button>
          <button onClick={() => setMode('mockup')} className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all flex-shrink-0 ${mode === 'mockup' ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-500/70 hover:text-emerald-300'}`}>
            ✨ MOCKUP
          </button>
          <button onClick={() => setMode('extract')} className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all flex-shrink-0 ${mode === 'extract' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            SCAN
          </button>
          <button onClick={() => setMode('enrich')} className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all flex-shrink-0 ${mode === 'enrich' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            MACRO
          </button>
          <button onClick={() => setMode('design_recovery')} className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all flex-shrink-0 ${mode === 'design_recovery' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            FLAT
          </button>
          <button onClick={() => setMode('erase')} className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all flex-shrink-0 ${mode === 'erase' ? 'bg-slate-200 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            ERASER
          </button>
          <button onClick={() => setMode('pin')} className={`px-4 py-3 rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all flex-shrink-0 ${mode === 'pin' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            PIN
          </button>
        </div>

        {(mode !== 'pin') && (
          <div className="flex-1 max-w-xs flex items-center gap-6 px-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Size</span>
            <input type="range" min="10" max="400" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <span className="text-xs font-bold text-blue-400 w-8">{brushSize}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={onUndo} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-inner" title="Undo">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>
          
          <button onClick={onClear} className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Clear</button>
          
          <button onClick={handleApply} className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${
              mode === 'extract' ? 'bg-orange-600 text-white' : 
              mode === 'enrich' ? 'bg-purple-600 text-white' : 
              mode === 'design_recovery' ? 'bg-cyan-600 text-white' :
              mode === 'mockup' ? 'bg-emerald-600 text-white' :
              'bg-white text-black hover:bg-blue-50'
            }`}>
            <span>
              {mode === 'extract' ? 'Scan & Upscale' : 
               mode === 'enrich' ? 'Generative Zoom' : 
               mode === 'design_recovery' ? 'Publish Design' :
               mode === 'mockup' ? 'Execute Placement' :
               prompt ? 'Run Edit' : 'Apply'}
            </span>
            {prompt && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
