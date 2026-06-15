
import React from 'react';
import ImageActions from './ImageActions';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { Button } from './ui/Button';

interface GeneratedImageProps {
  image: string;
  label: string;
  text: string;
  isProcessing: boolean;
  isUpscaled?: boolean;
  isUpscaling?: boolean;
  modelUsed?: string;
  onEdit: () => void;
  onUpscale: () => void;
  onRemoveBg: () => void;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({
  image,
  label,
  text,
  isProcessing,
  isUpscaled,
  isUpscaling,
  modelUsed,
  onEdit,
  onUpscale,
  onRemoveBg
}) => {
  const resolvedImageUrl = useBlobUrl(image);

  return (
    <div className="mt-6 rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-zinc-800 max-w-2xl md:ml-18 shadow-2xl relative group bg-black">
      {resolvedImageUrl ? (
        <img src={resolvedImageUrl} className={`w-full h-full object-contain transition-opacity duration-500 ${isUpscaling ? 'opacity-50 blur-sm' : 'opacity-100'}`} alt={label || 'AI Generated'} />
      ) : (
        <div className="w-full h-64 flex items-center justify-center text-zinc-500 text-sm">Loading image...</div>
      )}
      
      {/* PERSISTENT QUICK EDIT BUTTON (Always Visible) */}
      <div className="absolute top-6 right-20 z-20 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-300">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-indigo-600/40 transition-all"
        >
          <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Chỉnh sửa
        </Button>
      </div>

      {/* 4K BADGE */}
      {isUpscaled && (
        <div className="absolute top-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-amber-500/50 rounded-xl flex items-center gap-2 shadow-2xl animate-in zoom-in duration-500 z-10">
           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
           <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">4K ULTRA HD</span>
        </div>
      )}

      {/* UPSCALING LOADER (SKELETON EFFECT) */}
      {isUpscaling && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
           <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
           <div className="relative bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4">
               <div className="relative">
                   <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center font-bold text-[8px] text-indigo-300">4K</div>
               </div>
               <span className="text-[10px] font-semibold text-white uppercase tracking-widest animate-pulse">Neural Upres Processing...</span>
           </div>
        </div>
      )}

      {/* MODEL USED BADGE */}
      {modelUsed && !isUpscaling && (
        <div className="absolute top-6 left-6 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-zinc-700/50 rounded-lg flex items-center gap-1.5 shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
           <span className="text-[9px] font-mono text-zinc-300 uppercase tracking-wider">{modelUsed}</span>
        </div>
      )}

      {/* ACTIONS OVERLAY - Improved Visibility */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 md:group-hover:translate-y-0 transition-transform duration-300 z-30 md:translate-y-full">
        <ImageActions 
          imageUrl={image}
          onEdit={onEdit}
          onUpscale={onUpscale}
          onRemoveBg={onRemoveBg}
          isUpscaling={isUpscaling}
          isRemovingBg={isProcessing && text.includes('xóa phông')}
          hideUpscale={isUpscaled} // Hide button if already upscaled
        />
      </div>

      {/* MOBILE ACTIONS TOGGLE (Visible only on mobile or when not hovered) */}
      <div className="absolute bottom-4 right-4 md:hidden z-40">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            const el = e.currentTarget.parentElement?.previousElementSibling;
            if (el) el.classList.toggle('translate-y-0');
            if (el) el.classList.toggle('translate-y-full');
          }}
          className="rounded-full w-10 h-10 p-0 bg-black/60 backdrop-blur-md border border-white/20 shadow-xl"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default GeneratedImage;
