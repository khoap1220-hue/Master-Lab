
import React, { useRef } from 'react';
import { fileToBase64 } from '../../../lib/utils';
import { PHOTOGRAPHY_PRESETS } from '../data/photographyPresets';
import { Button } from '../../../components/ui/Button';

interface ProductShootPanelProps {
  scene: string;
  setScene: (v: string) => void;
  lighting: string;
  setLighting: (v: string) => void;
  batchCount: number;
  setBatchCount: (v: number) => void;
  isAutoPilot: boolean;
  setIsAutoPilot: (v: boolean) => void;
  modelRefImage?: string | null;
  setModelRefImage?: (v: string | null) => void;
}

const ProductShootPanel: React.FC<ProductShootPanelProps> = ({
  scene, setScene, lighting, setLighting, batchCount, setBatchCount, isAutoPilot, setIsAutoPilot,
  modelRefImage, setModelRefImage
}) => {
  const modelInputRef = useRef<HTMLInputElement>(null);
  
  // Defensive Fallback if import fails or file is empty
  const presets = PHOTOGRAPHY_PRESETS || [];

  const applyPreset = (p: { label: string, scene: string, lighting: string }) => {
      setScene(p.scene);
      setLighting(p.lighting);
      setIsAutoPilot(false); // Disable auto if preset clicked
  };

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && setModelRefImage) {
          const base64 = await fileToBase64(e.target.files[0]);
          setModelRefImage(base64);
      }
  };

  return (
    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">📸</div>
           <div>
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Studio Photography</h3>
               <p className="text-[9px] text-zinc-500 font-medium">Professional Product Staging</p>
           </div>
        </div>

        <div className="space-y-4">
            {/* Automation Toggle */}
            <div 
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isAutoPilot 
                    ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                    : 'bg-zinc-900 border-zinc-700'
                }`}
                onClick={() => setIsAutoPilot(!isAutoPilot)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAutoPilot ? 'bg-emerald-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                        {isAutoPilot ? '🤖' : '🖐️'}
                    </div>
                    <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest block ${isAutoPilot ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            Automation 100%
                        </span>
                        <span className="text-[8px] text-zinc-500">
                            {isAutoPilot ? "AI Auto-Director Active" : "Manual Control"}
                        </span>
                    </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isAutoPilot ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${isAutoPilot ? 'translate-x-5' : ''}`}></div>
                </div>
            </div>

            {isAutoPilot ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                        <p className="text-[9px] text-emerald-300 font-medium leading-relaxed">
                            <span className="font-bold">✨ AI Director Workflow:</span>
                        </p>
                        <ul className="text-[9px] text-zinc-400 space-y-2 pl-4 list-disc marker:text-emerald-500">
                            <li>
                                <span className="text-emerald-200 font-bold">Auto-Classification:</span>
                                <br/>Phát hiện loại sản phẩm (VD: Giày, Son, Đồ ăn) và áp dụng "Quy chuẩn ngành" tương ứng.
                            </li>
                            <li>
                                <span className="text-emerald-200 font-bold">Adaptive Lighting:</span>
                                <br/>Tự động chọn sơ đồ ánh sáng (Lighting Map) tối ưu (VD: Rim Light cho đồ điện tử, Soft Light cho mỹ phẩm).
                            </li>
                            <li>
                                <span className="text-emerald-200 font-bold">Dynamic Composition:</span>
                                <br/>AI tự do sắp xếp, thay đổi góc độ và bố cục sản phẩm để tạo ra bức ảnh nghệ thuật nhất.
                            </li>
                        </ul>
                    </div>

                    {/* Model Upload Section */}
                    <div className="pt-2 border-t border-emerald-500/20">
                        <label className="text-[9px] font-bold text-emerald-400 uppercase block mb-2 flex justify-between">
                            <span>Người mẫu đại diện (Model)</span>
                            {modelRefImage && <span className="text-green-400">✓ Đã đính kèm</span>}
                        </label>
                        
                        <input type="file" ref={modelInputRef} className="hidden" accept="image/*" onChange={handleModelUpload} />
                        
                        <div 
                            onClick={() => modelInputRef.current?.click()}
                            className={`w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 cursor-pointer transition-all relative overflow-hidden group ${modelRefImage ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-700 bg-zinc-900/50 hover:border-emerald-500/30'}`}
                        >
                            {modelRefImage ? (
                                <>
                                    <img src={modelRefImage} className="w-8 h-8 rounded-full object-cover border border-emerald-500 shadow-md" alt="Model" />
                                    <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Change Model</span>
                                    <Button 
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); setModelRefImage && setModelRefImage(null); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center transition-colors p-0"
                                    >
                                        ×
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <span className="text-lg opacity-50">👤</span>
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider group-hover:text-emerald-400">
                                        Upload Brand Ambassador
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="text-[8px] text-zinc-500 mt-1.5 italic">
                            * AI sẽ cố gắng giữ đặc điểm khuôn mặt/vóc dáng của người mẫu này trong ảnh chụp sản phẩm.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Quick Presets */}
                    <div>
                        <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Instant Setup</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {presets.length > 0 ? presets.map((p, i) => (
                                <Button 
                                    variant="outline"
                                    key={i} 
                                    onClick={() => applyPreset(p)}
                                    className="flex-shrink-0 px-3 py-2 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 rounded-xl text-[9px] text-zinc-300 font-bold whitespace-nowrap transition-all"
                                >
                                    {p.label}
                                </Button>
                            )) : <span className="text-[9px] text-zinc-500 italic">No presets available</span>}
                        </div>
                    </div>

                    {/* Inputs */}
                    <div>
                        <label className="text-[9px] font-bold text-emerald-400 uppercase block mb-2">Environment / Context</label>
                        <textarea 
                            value={scene}
                            onChange={(e) => setScene(e.target.value)}
                            className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none transition-all shadow-inner leading-relaxed"
                            placeholder="Mô tả bối cảnh (VD: Đặt trên bàn gỗ sồi, bên cạnh tách cà phê...)"
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-bold text-teal-400 uppercase block mb-2">Lighting & Camera</label>
                        <input 
                            type="text"
                            value={lighting}
                            onChange={(e) => setLighting(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-inner"
                            placeholder="VD: Ánh sáng tự nhiên, Macro shot, Bokeh..."
                        />
                    </div>
                </>
            )}

            {/* Quantity Slider (Always Visible) */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase">Số lượng biến thể (Variations)</label>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{batchCount} Shot{batchCount > 1 ? 's' : ''}</span>
                </div>
                <div className="relative h-4 flex items-center">
                    <input 
                        type="range" min="1" max="4" step="1" value={batchCount}
                        onChange={(e) => setBatchCount(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 z-20 relative"
                    />
                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10">
                        {[...Array(4)].map((_, i) => <div key={i} className={`w-0.5 h-1.5 rounded-full ${i+1 <= batchCount ? 'bg-emerald-600/50' : 'bg-zinc-800'}`}></div>)}
                    </div>
                </div>
            </div>
            
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-[9px] text-emerald-300 leading-relaxed">
                    <span className="font-bold">✨ Pro Tip:</span> {isAutoPilot 
                        ? "AI tự do sắp xếp & bố trí sản phẩm trong không gian – không chỉ thay nền, mà là AI quyết định luôn bố cục (composition) như một stylist thực thụ. Hãy tải lên ảnh sản phẩm có nền sạch."
                        : "Hệ thống sẽ giữ nguyên hình dáng sản phẩm và chỉ thay đổi background. Hãy tải lên ảnh sản phẩm có nền sạch để đạt kết quả tốt nhất."
                    }
                </p>
            </div>
        </div>
    </div>
  );
};

export default ProductShootPanel;
