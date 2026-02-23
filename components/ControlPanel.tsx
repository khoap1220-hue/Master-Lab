
import React, { useState, useEffect, useRef } from 'react';
import { Pin } from '../types';

interface ImageRef {
  url: string;
  label: string;
}

interface ControlPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  isProcessing: boolean;
  hasCurrentImage: boolean;
  onSend: () => void;
  onUploadMain: () => void;
  onUploadRef: () => void;
  availableImages: ImageRef[]; 
  pendingMask: string | null;
  pendingPins: Pin[];
  pendingRefImage: string | null;
  pendingRefLabel?: string;
  onResetContext: () => void;
  // New Prop for Quick Starters
  quickStarters?: string[];
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  inputText, setInputText, isProcessing, hasCurrentImage, onSend, onUploadMain, onUploadRef,
  availableImages, pendingMask, pendingPins, pendingRefImage, onResetContext, quickStarters = []
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lastAtPos = inputText.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const textAfterAt = inputText.slice(lastAtPos + 1);
      if (!textAfterAt.includes(' ')) {
        setShowPicker(true);
        setFilter(textAfterAt.toLowerCase());
      } else {
        setShowPicker(false);
      }
    } else {
      setShowPicker(false);
    }
  }, [inputText]);

  const handleSelectImage = (label: string) => {
    const lastAtPos = inputText.lastIndexOf('@');
    const newText = inputText.slice(0, lastAtPos) + `@${label} `;
    setInputText(newText);
    setShowPicker(false);
    inputRef.current?.focus();
  };

  const filteredImages = availableImages.filter(img => 
    img.label.toLowerCase().includes(filter)
  );

  const canSend = inputText.trim().length > 0 && !isProcessing;

  return (
    <footer className="p-6 md:p-10 border-t border-white/5 bg-slate-950/80 backdrop-blur-3xl relative z-40">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Entity Picker - V8.1 Enhanced UI */}
        {showPicker && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500 bg-slate-900/95 p-6 rounded-[2.5rem] border border-blue-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between px-2 mb-2">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Neural Entities Available</span>
               </div>
               <span className="text-[9px] font-mono text-slate-500">{filteredImages.length} Matches</span>
            </div>
            
            {filteredImages.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar px-2 snap-x">
                {filteredImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSelectImage(img.label)}
                    className="flex-shrink-0 group relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500 transition-all snap-center shadow-xl hover:scale-105 active:scale-95"
                  >
                    <img src={img.url} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end justify-center p-3">
                      <span className="text-[9px] font-black text-white uppercase tracking-widest truncate">{img.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                 <p className="text-xs text-slate-500 font-bold italic">Không có tài nguyên thị giác khớp với "@${filter}"</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Starters (Psychological Nudge) */}
        {!hasCurrentImage && inputText.length === 0 && quickStarters.length > 0 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest self-center mr-2 flex-shrink-0">Gợi ý:</span>
                {quickStarters.map((starter, idx) => (
                    <button 
                        key={idx}
                        onClick={() => { setInputText(starter); inputRef.current?.focus(); }}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-[10px] text-slate-300 hover:text-white transition-all whitespace-nowrap"
                    >
                        {starter}
                    </button>
                ))}
            </div>
        )}

        {/* Neural Input System */}
        <div className={`flex items-center gap-4 bg-slate-900/80 border rounded-[3rem] p-3 md:p-4 shadow-2xl transition-all duration-500 ${isProcessing ? 'border-blue-500/50 ring-4 ring-blue-500/5' : 'border-white/10 focus-within:border-blue-500/40 focus-within:bg-slate-900'}`}>
          <div className="flex gap-1.5 md:gap-2">
            <button onClick={onUploadMain} className="p-3.5 md:p-4 bg-white/5 hover:bg-blue-600/20 rounded-2xl text-slate-400 hover:text-blue-400 transition-all border border-white/5 group shadow-inner">
               <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={() => { setInputText(inputText + (inputText.endsWith(' ') || inputText.length === 0 ? '@' : ' @')); inputRef.current?.focus(); }} className="p-3.5 md:p-4 bg-white/5 hover:bg-orange-600/20 rounded-2xl text-slate-400 hover:text-orange-400 transition-all border border-white/5 group shadow-inner">
               <span className="text-lg font-black font-mono leading-none group-hover:scale-110 block">@</span>
            </button>
          </div>
          
          <input 
            ref={inputRef}
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && canSend) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={hasCurrentImage ? "Nhập lệnh... (Sử dụng @ để gọi tên ảnh)" : "Tải ảnh lên hoặc mô tả yêu cầu..."}
            className="flex-1 bg-transparent border-none focus:ring-0 text-base md:text-lg text-white placeholder-slate-600 font-semibold py-2"
          />
          
          <button 
            onClick={onSend} 
            disabled={!canSend} 
            className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-full md:rounded-[1.75rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/30 disabled:opacity-20 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed`}
          >
             {isProcessing ? (
               <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
             )}
          </button>
        </div>
        
        {/* Status Bar - Cleanup */}
        {(pendingMask || pendingPins.length > 0 || pendingRefImage) && (
          <div className="flex items-center justify-between px-8 py-3.5 bg-blue-500/5 border border-blue-500/20 rounded-2xl animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-6">
              {pendingMask && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Selection Active</span>
                </div>
              )}
              {pendingPins.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{pendingPins.length} Anchors</span>
                </div>
              )}
            </div>
            <button onClick={onResetContext} className="text-[9px] font-black text-slate-500 hover:text-white uppercase transition-colors tracking-widest border-b border-transparent hover:border-white/20 pb-0.5">Reset Neural Context</button>
          </div>
        )}
      </div>
    </footer>
  );
};

export default ControlPanel;
