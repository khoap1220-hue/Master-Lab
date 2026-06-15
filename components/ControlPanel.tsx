
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin } from '../types';
import { Button } from './ui/Button';

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
    <footer className="p-6 md:p-10 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-3xl relative z-40">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        
        {/* Entity Picker - V8.1 Enhanced UI */}
        <AnimatePresence>
        {showPicker && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col gap-4 bg-zinc-900/95 p-6 rounded-3xl border border-zinc-700 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2 mb-2">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-100 animate-pulse"></div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Neural Entities Available</span>
               </div>
               <span className="text-[9px] font-mono text-zinc-500">{filteredImages.length} Matches</span>
            </div>
            
            {filteredImages.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar px-2 snap-x">
                {filteredImages.map((img, idx) => (
                  <Button 
                    variant="secondary"
                    key={idx}
                    onClick={() => handleSelectImage(img.label)}
                    className="flex-shrink-0 group relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-500 transition-all snap-center shadow-md hover:scale-105 active:scale-95 p-0"
                  >
                    <img src={img.url} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent flex items-end justify-center p-3">
                      <span className="text-[9px] font-mono text-zinc-100 uppercase tracking-wider truncate">{img.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                 <p className="text-xs text-zinc-500 font-medium italic">Không có tài nguyên thị giác khớp với "@${filter}"</p>
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        {/* Quick Starters (Psychological Nudge) */}
        <AnimatePresence>
        {!hasCurrentImage && inputText.length === 0 && quickStarters.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 overflow-x-auto custom-scrollbar pb-2"
            >
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider self-center mr-2 flex-shrink-0">Gợi ý:</span>
                {quickStarters.map((starter, idx) => (
                    <Button 
                        variant="secondary"
                        key={idx}
                        onClick={() => { setInputText(starter); inputRef.current?.focus(); }}
                        className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-[11px] text-zinc-300 hover:text-zinc-100 transition-all whitespace-nowrap h-auto"
                    >
                        {starter}
                    </Button>
                ))}
            </motion.div>
        )}
        </AnimatePresence>

        {/* Neural Input System */}
        <div className={`flex items-center gap-4 bg-zinc-900/80 border rounded-full p-2 md:p-3 shadow-lg transition-all duration-500 ${isProcessing ? 'border-zinc-500/50 ring-2 ring-zinc-500/10' : 'border-zinc-800 focus-within:border-zinc-600 focus-within:bg-zinc-900'}`}>
          <div className="flex gap-1.5 md:gap-2 pl-2">
            <Button variant="secondary" aria-label="Upload main image" onClick={onUploadMain} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-100 transition-all border border-zinc-700 group h-auto">
               <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </Button>
            <Button variant="secondary" aria-label="Mention image" onClick={() => { setInputText(inputText + (inputText.endsWith(' ') || inputText.length === 0 ? '@' : ' @')); inputRef.current?.focus(); }} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-100 transition-all border border-zinc-700 group h-auto">
               <span className="text-lg font-mono leading-none group-hover:scale-110 block">@</span>
            </Button>
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
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base text-zinc-100 placeholder-zinc-500 font-medium py-2"
            aria-label="Message input"
          />
          
          <Button 
            onClick={onSend} 
            disabled={!canSend} 
            isLoading={isProcessing}
            aria-label="Send message"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0 mr-1"
          >
            {!isProcessing && (
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            )}
          </Button>
        </div>
        
        {/* Status Bar - Cleanup */}
        <AnimatePresence>
        {(pendingMask || pendingPins.length > 0 || pendingRefImage) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl"
          >
            <div className="flex items-center gap-6">
              {pendingMask && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-100 animate-pulse"></div>
                  <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider">Selection Active</span>
                </div>
              )}
              {pendingPins.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse"></div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{pendingPins.length} Anchors</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onResetContext} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Clear Context
            </Button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </footer>
  );
};

export default ControlPanel;
