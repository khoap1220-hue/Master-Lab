
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EditorState, Pin } from '../../../types';
import EditorHeader from '../components/EditorHeader';
import EditorToolbar from '../components/EditorToolbar';
import CanvasViewport, { CanvasViewportRef } from './CanvasViewport';
import PinLayer from './PinLayer';

interface EditorCanvasProps {
  state: EditorState;
  onClose: () => void;
  onApply: (mask: string, composite: string, pins: Pin[], isExtraction?: boolean, isEnrichment?: boolean, isDesignRecovery?: boolean, prompt?: string, isMockup?: boolean) => void;
  onStateChange: (state: Partial<EditorState>) => void;
  availableImages: { url: string; label: string }[];
  initialMode?: 'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup';
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ state, onClose, onApply, availableImages, initialMode = 'draw' }) => {
  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup'>(initialMode);
  
  const [localPins, setLocalPins] = useState<Pin[]>(state.pins || []);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [uiScale, setUiScale] = useState(1);

  const viewportRef = useRef<CanvasViewportRef>(null);

  // Sync state when opening editor
  useEffect(() => {
    if (state.isOpen) {
        setLocalPins(state.pins || []);
        setMode(initialMode);
    }
  }, [state.isOpen, state.image, state.pins, initialMode]);

  const handleApply = (prompt?: string) => {
    if (!viewportRef.current) return;
    const mask = viewportRef.current.getMask();
    const composite = viewportRef.current.getComposite();
    
    if (mask && composite) {
      onApply(mask, composite, localPins, mode === 'extract', mode === 'enrich', mode === 'design_recovery', prompt, mode === 'mockup');
    }
  };

  const handleClear = () => {
    viewportRef.current?.clear();
    setLocalPins([]);
  };

  const handleUndo = () => {
    if (viewportRef.current && (viewportRef.current as any).undo) {
        (viewportRef.current as any).undo();
    }
  };

  const handleAddPin = (x: number, y: number) => {
    const newPin: Pin = { 
      id: Math.random().toString(36).substring(7), 
      x, 
      y, 
      note: '' 
    };
    setLocalPins(prev => [...prev, newPin]);
    setActivePin(newPin.id);
  };

  // Optimized with useCallback to ensure stable reference for child components
  const handleMovePin = useCallback((id: string, x: number, y: number) => {
    setLocalPins(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
  }, []);

  const handleUpdatePin = (id: string, note: string) => {
    setLocalPins(prev => prev.map(p => p.id === id ? { ...p, note } : p));
  };

  const handleDeletePin = (id: string) => {
    setLocalPins(prev => prev.filter(p => p.id !== id));
    if (activePin === id) setActivePin(null);
  };

  if (!state.isOpen || !state.image) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-6xl flex flex-col h-full relative">
        
        <EditorHeader mode={mode} onClose={onClose} />

        <CanvasViewport 
          ref={viewportRef}
          image={state.image}
          mode={mode}
          brushSize={brushSize}
          onAddPin={handleAddPin}
          onUiScaleChange={setUiScale}
          onMovePin={handleMovePin}
        >
          <PinLayer 
            pins={localPins}
            activePin={activePin}
            uiScale={uiScale}
            onPinClick={setActivePin}
            onPinUpdate={handleUpdatePin}
            onPinDelete={handleDeletePin}
            onClosePopup={() => setActivePin(null)}
            onMovePin={handleMovePin}
          />
        </CanvasViewport>

        <EditorToolbar 
          mode={mode}
          setMode={setMode}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onClear={handleClear}
          onUndo={handleUndo}
          onApply={handleApply}
          availableImages={availableImages}
        />
      </div>
    </div>
  );
};

export default EditorCanvas;
