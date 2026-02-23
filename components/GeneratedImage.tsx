
import React from 'react';
import ImageActions from './ImageActions';

interface GeneratedImageProps {
  image: string;
  label: string;
  text: string;
  isProcessing: boolean;
  isUpscaled?: boolean;
  isUpscaling?: boolean;
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
  onEdit,
  onUpscale,
  onRemoveBg
}) => {
  return (
    <div className="mt-6 rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-slate-800 max-w-2xl md:ml-18 shadow-2xl relative group bg-black">
      <img src={image} className={`w-full h-full object-contain transition-opacity duration-500 ${isUpscaling ? 'opacity-50 blur-sm' : 'opacity-100'}`} alt={label || 'AI Generated'} />
      
      {/* 4K BADGE */}
      {isUpscaled && (
        <div className="absolute top-6 right-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-yellow-500/50 rounded-xl flex items-center gap-2 shadow-2xl animate-in zoom-in duration-500 z-10">
           <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
           <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">4K ULTRA HD</span>
        </div>
      )}

      {/* UPSCALING LOADER (SKELETON EFFECT) */}
      {isUpscaling && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
           <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
           <div className="relative bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4">
               <div className="relative">
                   <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center font-bold text-[8px] text-blue-300">4K</div>
               </div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Neural Upres Processing...</span>
           </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30">
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
    </div>
  );
};

export default GeneratedImage;
