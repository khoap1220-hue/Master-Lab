
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { Stroke, DrawingPoint } from '../../../types';
import { createMaskFromStrokes, createCompositeImage } from '../../../lib/utils';

export interface MaskLayerRef {
  getMask: () => string;
  getComposite: (originalImage: HTMLImageElement) => string;
  clear: () => void;
  undo: () => void;
  isEmpty: () => boolean;
}

interface MaskLayerProps {
  width: number;
  height: number;
  mode: 'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup';
  brushSize: number;
  scale: number;
  onStrokeStart: () => void;
  onStrokeEnd: () => void;
  enabled: boolean;
}

const MaskLayer = forwardRef<MaskLayerRef, MaskLayerProps>(({
  width, height, mode, brushSize, scale, onStrokeStart, onStrokeEnd, enabled
}, ref) => {
  // 1. MAIN DISPLAY CANVAS (Shows Buffer + Current Active Stroke)
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // 2. OFFSCREEN BUFFER (Stores all confirmed strokes as a single bitmap)
  // This prevents iterating through 10,000 array points on every frame.
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // HISTORY: We store the array of strokes. To undo, we pop and rebuild the buffer.
  const historyRef = useRef<Stroke[][]>([]);
  
  const isDrawing = useRef(false);
  const lastPoint = useRef<DrawingPoint | null>(null);
  const currentStrokePoints = useRef<DrawingPoint[]>([]);
  
  useImperativeHandle(ref, () => ({
    getMask: () => createMaskFromStrokes(width, height, strokes),
    getComposite: (originalImage: HTMLImageElement) => createCompositeImage(width, height, strokes, originalImage),
    clear: () => {
      saveToHistory();
      setStrokes([]);
      // Clearing state triggers useEffect, which will clear canvases
    },
    undo: () => {
      if (historyRef.current.length > 0) {
        const previousState = historyRef.current.pop();
        setStrokes(previousState || []);
        // State change triggers useEffect -> rebuild buffer
      }
    },
    isEmpty: () => strokes.length === 0
  }));

  const saveToHistory = () => {
    // Limit history depth to 30 to prevent Memory OOM on mobile
    if (historyRef.current.length >= 30) historyRef.current.shift();
    historyRef.current.push([...strokes]);
  };

  // --- RENDERING CORE ---

  const initCanvases = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return false;

    // Safety check: Do not initialize if dimensions are invalid or zero
    if (width <= 0 || height <= 0) return false;

    const dpr = window.devicePixelRatio || 1;
    
    // Resize Main Canvas
    // FIX: Only check internal resolution match. Visual style should always be 100% to match parent.
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // CRITICAL FIX: Ensure visual size matches the parent container (which is scaled to fit screen)
        // Do NOT set style.width/height to 'width' (natural size) or it will overflow/misalign.
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            ctx.scale(dpr, dpr);
            // RETINA PHYSICS: Reset line properties after context reset/scale
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctxRef.current = ctx;
        }

        // Init Buffer Canvas (Create if not exists)
        if (!bufferCanvasRef.current) {
            bufferCanvasRef.current = document.createElement('canvas');
        }
        bufferCanvasRef.current.width = width * dpr;
        bufferCanvasRef.current.height = height * dpr;
        const bCtx = bufferCanvasRef.current.getContext('2d');
        if (bCtx) {
            bCtx.scale(dpr, dpr);
            // RETINA PHYSICS: Reset line properties for buffer too
            bCtx.lineCap = 'round';
            bCtx.lineJoin = 'round';
            bufferCtxRef.current = bCtx;
        }
        
        // When resized, we must redraw everything from history to the new buffer
        return true; // Signal that a rebuild is needed
    }
    return false;
  }, [width, height]);

  // Copy Buffer to Main Canvas (Fast Blit)
  const copyBufferToMain = () => {
      const ctx = ctxRef.current;
      const bufferCanvas = bufferCanvasRef.current;
      if (!ctx || !bufferCanvas) return;

      // FIX: Prevent drawImage with zero-size source which causes InvalidStateError
      if (bufferCanvas.width === 0 || bufferCanvas.height === 0) return;
      if (ctx.canvas.width === 0 || ctx.canvas.height === 0) return;

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Use identity matrix for pixel-to-pixel copy
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(bufferCanvas, 0, 0);
      ctx.restore();
  };

  // Draw a single stroke path
  const drawStrokePath = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 1) return;
    
    // Ensure line props are set (Redundant safety check)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;
    
    if (stroke.color === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke.color;
    }

    ctx.beginPath();
    if (stroke.points.length < 2) {
      ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  // Rebuild Buffer from Strokes (Expensive - only run on Undo/Resize/Clear)
  const rebuildBuffer = useCallback(() => {
      const bCtx = bufferCtxRef.current;
      const bufferCanvas = bufferCanvasRef.current;
      if (!bCtx || !bufferCanvas) return;

      // FIX: Prevent operation on zero-size canvas
      if (bufferCanvas.width === 0 || bufferCanvas.height === 0) return;

      // 1. Clear Buffer
      bCtx.save();
      bCtx.setTransform(1, 0, 0, 1, 0, 0);
      bCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
      bCtx.restore();

      // 2. Draw all existing strokes to Buffer
      strokes.forEach(stroke => drawStrokePath(bCtx, stroke));

      // 3. Copy Buffer to Main
      copyBufferToMain();
  }, [strokes]);

  // Draw current active segment (Live drawing)
  const drawActiveSegment = (p1: DrawingPoint, p2: DrawingPoint) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize; 
    
    if (mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        let visualColor = 'rgba(59, 130, 246, 0.6)'; 
        if (mode === 'extract') visualColor = 'rgba(249, 115, 22, 0.6)'; 
        else if (mode === 'enrich') visualColor = 'rgba(168, 85, 247, 0.6)'; 
        else if (mode === 'design_recovery') visualColor = 'rgba(6, 182, 212, 0.6)'; 
        else if (mode === 'mockup') visualColor = 'rgba(16, 185, 129, 0.6)'; 
        ctx.strokeStyle = visualColor;
    }

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  // Sync canvases when props change or history undo happens
  useEffect(() => {
    // Only proceed if width and height are valid to avoid InvalidStateError
    if (width > 0 && height > 0) {
      const needsRebuild = initCanvases();
      if (needsRebuild || strokes.length > 0 || strokes.length === 0) {
          requestAnimationFrame(rebuildBuffer);
      }
    }
  }, [width, height, strokes, initCanvases, rebuildBuffer]);

  // --- INTERACTION HANDLERS ---

  const getLocalCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!mainCanvasRef.current) return null;
    const rect = mainCanvasRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: (clientX - rect.left) * scale, y: (clientY - rect.top) * scale };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!enabled || mode === 'pin') return;
    e.preventDefault();
    saveToHistory();

    const coords = getLocalCoords(e);
    if (!coords) return;

    isDrawing.current = true;
    lastPoint.current = coords;
    currentStrokePoints.current = [coords];
    onStrokeStart();
    
    // Draw initial dot immediately
    if (ctxRef.current) {
        ctxRef.current.lineCap = 'round';
        ctxRef.current.fillStyle = mode === 'erase' ? 'rgba(0,0,0,1)' : 'rgba(59, 130, 246, 0.6)';
        if(mode === 'extract') ctxRef.current.fillStyle = 'rgba(249, 115, 22, 0.6)';
        if(mode === 'enrich') ctxRef.current.fillStyle = 'rgba(168, 85, 247, 0.6)';
        if(mode === 'erase') ctxRef.current.globalCompositeOperation = 'destination-out';
        
        ctxRef.current.beginPath();
        ctxRef.current.arc(coords.x, coords.y, brushSize/2, 0, Math.PI*2);
        ctxRef.current.fill();
        ctxRef.current.globalCompositeOperation = 'source-over';
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!enabled || mode === 'pin' || !isDrawing.current || !lastPoint.current) return;
    e.preventDefault();

    const coords = getLocalCoords(e);
    if (!coords) return;

    // Draw segment on Main Canvas (Fast, temporary)
    drawActiveSegment(lastPoint.current, coords);
    
    lastPoint.current = coords;
    currentStrokePoints.current.push(coords);
  };

  const handleEnd = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentStrokePoints.current.length > 0) {
      // 1. Create Stroke Data Object
      let colorCode = 'rgba(59, 130, 246, 0.6)'; 
      if (mode === 'extract') colorCode = 'rgba(249, 115, 22, 0.6)';
      else if (mode === 'enrich') colorCode = 'rgba(168, 85, 247, 0.6)';
      else if (mode === 'design_recovery') colorCode = 'rgba(6, 182, 212, 0.6)'; 
      else if (mode === 'mockup') colorCode = 'rgba(16, 185, 129, 0.6)'; 
      else if (mode === 'erase') colorCode = 'erase';

      const newStroke: Stroke = {
        points: [...currentStrokePoints.current],
        color: colorCode,
        width: brushSize
      };
      
      // 2. Commit Stroke to OFFSCREEN BUFFER (Permanent)
      if (bufferCtxRef.current && bufferCanvasRef.current && bufferCanvasRef.current.width > 0) {
          drawStrokePath(bufferCtxRef.current, newStroke);
      }

      // 3. Update React State (So we can Undo/Save later)
      setStrokes(prev => [...prev, newStroke]);
    }

    lastPoint.current = null;
    currentStrokePoints.current = [];
    onStrokeEnd();
  };

  return (
    <canvas
      ref={mainCanvasRef}
      className="absolute inset-0 w-full h-full cursor-none z-20 touch-none"
      style={{ touchAction: 'none' }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
});

export default MaskLayer;
