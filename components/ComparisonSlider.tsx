
import React, { useState, useRef, useEffect } from 'react';

interface ComparisonSliderProps {
  before: string;
  after: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ before, after }) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const newPos = ((x - rect.left) / rect.width) * 100;
    setPosition(Math.min(Math.max(newPos, 0), 100));
  };

  // Safe width calculation to avoid Infinity when position is 0
  const beforeImageWidth = position > 0 ? 100 / (position / 100) : 10000;

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none border border-slate-700 shadow-2xl group"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e)}
      onTouchMove={handleMove}
    >
      {/* After Image (Background) */}
      <img src={after} className="absolute inset-0 w-full h-full object-cover" alt="After" />
      
      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img 
            src={before} 
            className="absolute inset-0 w-full h-full object-cover max-w-none" 
            style={{ width: `${beforeImageWidth}%` }} 
            alt="Before" 
        />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center z-10"
        style={{ left: `${position}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-800 shadow-lg flex items-center justify-center -ml-0.5 transform transition-transform group-hover:scale-110">
            <svg className="w-4 h-4 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
            </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-[10px] rounded text-white font-bold uppercase tracking-wider backdrop-blur-sm pointer-events-none">Trước</div>
      <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600/50 text-[10px] rounded text-white font-bold uppercase tracking-wider backdrop-blur-sm pointer-events-none">Sau</div>
    </div>
  );
};

export default ComparisonSlider;
