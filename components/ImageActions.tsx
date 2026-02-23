
import React from 'react';

interface ImageActionsProps {
  imageUrl: string;
  onEdit: () => void;
  onUpscale?: () => void;
  onRemoveBg?: () => void;
  onRegenerate?: () => void;
  isUpscaling?: boolean;
  isRegenerating?: boolean;
  isRemovingBg?: boolean;
  hideUpscale?: boolean;
}

const ImageActions: React.FC<ImageActionsProps> = ({ 
  imageUrl, 
  onEdit, 
  onUpscale,
  onRemoveBg, 
  onRegenerate,
  isUpscaling,
  isRegenerating,
  isRemovingBg,
  hideUpscale 
}) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `studio-factory-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-3 p-5 bg-slate-900/95 border-t border-slate-800/50 flex-wrap w-full backdrop-blur-md">
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }} 
        className="flex-1 min-w-[120px] h-12 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
      >
        <svg className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        EDIT MASK
      </button>

      {onRemoveBg && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemoveBg(); }} 
          disabled={isRemovingBg}
          className="flex-1 min-w-[120px] h-12 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
           {isRemovingBg ? (
              <div className="w-4 h-4 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
           ) : (
              <div className="flex items-center gap-2">
                 <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                 </svg>
                 REMOVE BG
              </div>
           )}
        </button>
      )}

      {onRegenerate && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRegenerate(); }} 
          disabled={isRegenerating}
          className="flex-1 min-w-[120px] h-12 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isRegenerating ? (
            <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                REGENERATE
            </div>
          )}
        </button>
      )}

      {onUpscale && !hideUpscale && (
        <button 
          onClick={(e) => { e.stopPropagation(); onUpscale(); }} 
          disabled={isUpscaling}
          className="flex-1 min-w-[120px] h-12 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isUpscaling ? (
            <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                4K UPSCALE
            </div>
          )}
        </button>
      )}

      <button 
        onClick={handleDownload} 
        className="flex-1 md:flex-none px-8 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        SAVE
      </button>
    </div>
  );
};

export default ImageActions;
