
import React, { useState, useEffect, useRef } from 'react';
import { Pin } from '../../../types';

interface PinLayerProps {
  pins: Pin[];
  activePin: string | null;
  uiScale: number;
  onPinClick: (id: string) => void;
  onPinUpdate: (id: string, note: string) => void;
  onPinDelete: (id: string) => void;
  onClosePopup: () => void;
  onMovePin?: (id: string, x: number, y: number) => void;
}

const PinLayer: React.FC<PinLayerProps> = ({
  pins,
  activePin,
  uiScale,
  onPinClick,
  onPinUpdate,
  onPinDelete,
  onClosePopup,
  onMovePin
}) => {
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialPinX: number;
    initialPinY: number;
    isLocked: boolean; // True = Waiting for hold timer, False = Dragging active
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleStart = (e: React.MouseEvent | React.TouchEvent, pin: Pin) => {
    e.stopPropagation();
    
    // Determine input type
    const isTouch = 'touches' in e;
    
    let clientX, clientY;
    if (isTouch) {
        clientX = (e as React.TouchEvent).touches[0].clientX;
        clientY = (e as React.TouchEvent).touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    // DESKTOP: Instant drag (no lock). MOBILE: Hold 250ms to unlock (prevent accidental scroll drag).
    const shouldLock = isTouch; 

    setDragState({
      id: pin.id,
      startX: clientX,
      startY: clientY,
      initialPinX: pin.x,
      initialPinY: pin.y,
      isLocked: shouldLock
    });

    if (shouldLock) {
        // Start Hold Timer
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setDragState(prev => prev ? { ...prev, isLocked: false } : null);
            if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
        }, 250); // Fast response (250ms)
    }
  };

  // Add global listeners for smooth dragging outside the pin
  useEffect(() => {
    if (dragState) {
        // Change cursor if unlocked
        if (!dragState.isLocked) {
            document.body.style.cursor = 'grabbing';
        }

        const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
            if (!onMovePin || !dragState) return;
            
            let clientX, clientY;
            const isTouch = 'touches' in e;

            if (isTouch) {
                // Prevent scroll ONLY if we are actively dragging (unlocked)
                if (!dragState.isLocked) {
                    if (e.cancelable) e.preventDefault(); 
                }
                clientX = (e as TouchEvent).touches[0].clientX;
                clientY = (e as TouchEvent).touches[0].clientY;
            } else {
                e.preventDefault();
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            if (dragState.isLocked) {
                // Tolerance Check: If moved too much while waiting for hold, cancel the hold.
                // Increased tolerance to 25px for easier touch interaction.
                const moveDist = Math.sqrt(Math.pow(clientX - dragState.startX, 2) + Math.pow(clientY - dragState.startY, 2));
                if (moveDist > 25) { 
                    if (timerRef.current) clearTimeout(timerRef.current);
                    setDragState(null); // Cancel drag intent
                }
                return;
            }

            // Execute Move
            const deltaX = (clientX - dragState.startX) * uiScale;
            const deltaY = (clientY - dragState.startY) * uiScale;

            onMovePin(dragState.id, dragState.initialPinX + deltaX, dragState.initialPinY + deltaY);
        };

        const handleGlobalUp = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            setDragState(null);
            document.body.style.cursor = '';
        };

        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalUp);
        // Use { passive: false } to allow preventDefault inside touchmove
        window.addEventListener('touchmove', handleGlobalMove, { passive: false });
        window.addEventListener('touchend', handleGlobalUp);
        
        return () => {
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }
  }, [dragState, uiScale, onMovePin]);

  return (
    <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
    >
      {pins.map(pin => {
        const displayX = pin.x / uiScale;
        const displayY = pin.y / uiScale;
        
        const isInteracting = dragState?.id === pin.id;
        const isDragging = isInteracting && !dragState?.isLocked; // Actively moving
        const isHolding = isInteracting && dragState?.isLocked; // Pressing down, waiting

        return (
          <div 
            key={pin.id} 
            className="absolute pointer-events-auto touch-none" 
            style={{ 
                left: `${displayX}px`, 
                top: `${displayY}px`,
                zIndex: isInteracting ? 60 : 30 // Higher z-index when interacting
            }}
            onMouseDown={(e) => handleStart(e, pin)}
            onTouchStart={(e) => handleStart(e, pin)}
          >
            {/* Enlarged Hit Area (64x64) for easier grabbing */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 cursor-grab flex items-center justify-center group select-none">
                
                {/* Visual Pin */}
                <div 
                    className={`
                        w-8 h-8 rounded-full border-2 border-white shadow-2xl flex items-center justify-center transition-all duration-200
                        ${isDragging ? 'scale-125 bg-orange-500 ring-4 ring-orange-500/30 cursor-grabbing' : ''}
                        ${isHolding ? 'scale-90 bg-red-500 animate-pulse ring-2 ring-white/50' : ''}
                        ${!isInteracting && activePin === pin.id ? 'bg-orange-600 scale-110 ring-2 ring-orange-400' : ''}
                        ${!isInteracting && activePin !== pin.id ? 'bg-red-600 hover:scale-110' : ''}
                    `}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Only interpret as Click if we are NOT dragging and NOT holding (meaning a quick tap)
                        // But wait, if isHolding is true, it means we haven't reached unlock yet. 
                        // If we release now (MouseUp), handleGlobalUp runs. 
                        // So here we just need to ensure we don't toggle if a drag occurred.
                        if (!isDragging) {
                            onPinClick(pin.id);
                        }
                    }}
                >
                    <svg className="w-4 h-4 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                </div>
                
                {/* Drag Hint (Mobile Only) */}
                {isHolding && (
                    <div className="absolute top-10 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded-lg pointer-events-none animate-in fade-in z-50">
                        Giữ...
                    </div>
                )}
            </div>

            {/* Popup Editor */}
            {(activePin === pin.id && !isDragging && !isHolding) && (
                <div 
                  className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-3xl min-w-[200px] z-50 animate-in fade-in zoom-in duration-200 cursor-auto mt-4"
                  onMouseDown={(e) => e.stopPropagation()} 
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <textarea 
                    autoFocus value={pin.note}
                    onChange={(e) => onPinUpdate(pin.id, e.target.value)}
                    className="w-full bg-slate-800 border-none text-white text-xs p-3 rounded-xl focus:ring-1 focus:ring-blue-500 h-20 resize-none mb-2"
                    placeholder="Ghi chú tại điểm này..."
                  />
                  <div className="flex gap-2">
                    <button onClick={onClosePopup} className="flex-1 py-2 text-[10px] font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">Done</button>
                    <button onClick={() => onPinDelete(pin.id)} className="px-3 py-2 text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PinLayer;
