
import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef, ReactNode } from 'react';
import MaskLayer, { MaskLayerRef } from './MaskLayer';

export interface CanvasViewportRef {
  getMask: () => string | null;
  getComposite: () => string | null;
  clear: () => void;
  undo: () => void; // NEW
  getNaturalDimensions: () => { width: number, height: number } | null;
}

interface CanvasViewportProps {
  image: string;
  mode: 'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup';
  brushSize: number;
  onAddPin: (x: number, y: number) => void;
  onUiScaleChange: (scale: number) => void;
  onMovePin?: (id: string, x: number, y: number) => void;
  children?: ReactNode;
}

const CanvasViewport = forwardRef<CanvasViewportRef, CanvasViewportProps>(({ 
  image, mode, brushSize, onAddPin, onUiScaleChange, onMovePin, children 
}, ref) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null); 
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorPreviewRef = useRef<HTMLDivElement>(null);
  const maskLayerRef = useRef<MaskLayerRef>(null);
  
  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});
  const [uiScale, setUiScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useImperativeHandle(ref, () => ({
    getMask: () => {
      return maskLayerRef.current?.getMask() || null;
    },
    getComposite: () => {
      if (!imgRef.current) return null;
      return maskLayerRef.current?.getComposite(imgRef.current) || null;
    },
    clear: () => {
      maskLayerRef.current?.clear();
    },
    undo: () => {
      maskLayerRef.current?.undo();
    },
    getNaturalDimensions: () => {
      if (!imgRef.current) return null;
      return { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight };
    }
  }));

  const updateViewport = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    
    if (!img || !img.complete || img.naturalWidth === 0 || !container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (containerWidth === 0 || containerHeight === 0) return;

    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;
    if (imageRatio > containerRatio) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageRatio;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageRatio;
    }

    const intDisplayWidth = Math.floor(displayWidth);
    const intDisplayHeight = Math.floor(displayHeight);

    setViewportStyle({
      width: `${intDisplayWidth}px`,
      height: `${intDisplayHeight}px`,
      position: 'relative',
      willChange: 'transform' // Performance Optimization: Promote to GPU Layer
    });

    const newScale = naturalWidth / intDisplayWidth;
    setUiScale(newScale);
    setDimensions({ width: naturalWidth, height: naturalHeight });
    onUiScaleChange(newScale);

  }, [onUiScaleChange]);

  const handleCursorMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cursorPreviewRef.current || !viewportRef.current) return;
    
    const rect = viewportRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Use requestAnimationFrame for smoother cursor updates if needed, 
    // but transform is usually fast enough.
    cursorPreviewRef.current.style.display = 'flex';
    cursorPreviewRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };

  const handlePinClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'pin' || !viewportRef.current) return;
    e.preventDefault();
    
    const rect = viewportRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
       if (e.touches.length === 0) return;
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) * uiScale;
    const y = (clientY - rect.top) * uiScale;
    
    onAddPin(x, y);
  };

  useEffect(() => {
    updateViewport();
    const observer = new ResizeObserver(() => {
        requestAnimationFrame(() => updateViewport());
    });
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', updateViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateViewport);
    };
  }, [updateViewport]);

  const displayBrushSize = brushSize / uiScale;
  const isPinMode = mode === 'pin';
  
  const getCursorBorder = () => {
      if (mode === 'erase') return 'border-white bg-white/10';
      if (mode === 'extract') return 'border-orange-500 bg-orange-500/10';
      if (mode === 'enrich') return 'border-purple-500 bg-purple-500/10';
      if (mode === 'design_recovery') return 'border-cyan-500 bg-cyan-500/10';
      if (mode === 'mockup') return 'border-emerald-500 bg-emerald-500/10';
      if (isPinMode) return 'border-red-500 bg-red-500/10'; // Red for pin
      return 'border-blue-400 bg-blue-400/10';
  };

  return (
    <div ref={containerRef} className="relative flex-1 bg-black rounded-[2.5rem] overflow-hidden flex items-center justify-center border border-slate-800 shadow-3xl select-none touch-none">
       <div 
         ref={viewportRef} 
         style={viewportStyle}
         onMouseMove={handleCursorMove}
         onMouseLeave={() => { if(cursorPreviewRef.current) cursorPreviewRef.current.style.display = 'none'; }}
         onTouchMove={handleCursorMove}
         onClick={handlePinClick}
       >
          <img 
            ref={imgRef}
            src={image} 
            className="w-full h-full object-contain pointer-events-none select-none" 
            draggable={false}
            onLoad={updateViewport}
            alt="Source"
            decoding="async" // Async decoding for main editor image
          />
          
          <MaskLayer
            ref={maskLayerRef}
            width={dimensions.width}
            height={dimensions.height}
            mode={mode}
            brushSize={brushSize}
            scale={uiScale} 
            onStrokeStart={() => {}}
            onStrokeEnd={() => {}}
            enabled={mode !== 'pin'}
          />

          <div 
            ref={cursorPreviewRef}
            className={`absolute pointer-events-none z-50 rounded-full border-2 ${getCursorBorder()} shadow-2xl transition-none flex items-center justify-center`}
            style={{
              display: 'none',
              width: isPinMode ? '32px' : `${displayBrushSize}px`,
              height: isPinMode ? '32px' : `${displayBrushSize}px`,
              top: 0,
              left: 0,
              willChange: 'transform' // GPU promote
            }}
          >
             {isPinMode && <div className="w-1 h-1 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]" />}
          </div>
          
          {children}
       </div>
    </div>
  );
});

export default CanvasViewport;
