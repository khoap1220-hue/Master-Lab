
import React, { useState, useEffect } from 'react';
import { BatchJob, RefreshStrategy } from '../../../types';
import BrandBundlePanel from './BrandBundlePanel';
import ViralConfigPanel from './ViralConfigPanel';
import ProductShootPanel from './ProductShootPanel';
import AdCampaignPanel from './AdCampaignPanel'; // NEW IMPORT
import BatchJobItem from './BatchJobItem';
import { BatchMode } from '../hooks/useBatchProcessing';

interface BatchSidebarProps {
  mode: BatchMode;
  fontSubMode: 'generate' | 'trace';
  setFontSubMode: (m: 'generate' | 'trace') => void;
  brandProps: any; 
  jobs: BatchJob[];
  activeJobId: string | null;
  setActiveJobId: (id: string) => void;
  onRemoveJob: (id: string) => void;
  onUploadLogo: () => void;
  onUploadAssets: () => void;
}

const STRATEGY_INFO = {
    'SOFT': { icon: '✨', label: 'Soft Refresh', color: 'bg-blue-600', desc: 'Giữ nguyên nội dung & bố cục. Chỉ làm mới Style.' },
    'HYBRID': { icon: '⚡', label: 'Hybrid Mode', color: 'bg-purple-600', desc: 'Cân bằng. Giữ cấu trúc chính, hiện đại hóa chi tiết.' },
    'HARD': { icon: '🔥', label: 'Hard Reboot', color: 'bg-orange-600', desc: 'Sáng tạo tự do. Thay đổi bố cục hoàn toàn.' }
};

const BatchSidebar: React.FC<BatchSidebarProps> = ({
  mode, brandProps, jobs, activeJobId, setActiveJobId, onRemoveJob, onUploadLogo, onUploadAssets
}) => {
  const [localText, setLocalText] = useState("");
  const [localStyle, setLocalStyle] = useState("");
  const [strategy, setStrategy] = useState<RefreshStrategy>('HYBRID');
  
  // Viral Config State
  const [platform, setPlatform] = useState("TikTok");
  const [duration, setDuration] = useState("15s");

  // Structure/Packaging State
  const [dims, setDims] = useState({ w: 10, h: 15, d: 5 });
  
  // Initialize packType based on mode to prevent stale state issues
  const [packType, setPackType] = useState(mode === 'ux-flow' ? "Mobile App (iOS/Android)" : "Auto-Detect");

  // Photography Params
  const [batchCount, setBatchCount] = useState(1);
  const [isAutoPilot, setIsAutoPilot] = useState(false); 

  // Watch for mode changes to reset defaults
  useEffect(() => {
      if (mode === 'ux-flow') {
          setPackType("Mobile App (iOS/Android)");
      } else if (mode === 'structural-architect') {
          setPackType("Auto-Detect");
      }
  }, [mode]);

  useEffect(() => {
      // Map local state to parent props based on mode
      if (mode === 'product-photography') {
          if (brandProps.setTargetText) brandProps.setTargetText(localText); 
          if (brandProps.setBrandVibe) brandProps.setBrandVibe(localStyle); 
          if (brandProps.setBatchCount) brandProps.setBatchCount(batchCount); 
          if (brandProps.setIsAutoPilot) brandProps.setIsAutoPilot(isAutoPilot); 
      } else if (mode === 'ux-flow') {
          if (brandProps.setTargetText) brandProps.setTargetText(localText); 
          if (brandProps.setPackType) brandProps.setPackType(packType); 
          if (brandProps.setBatchCount) brandProps.setBatchCount(batchCount); 
          if (brandProps.setIsAutoPilot) brandProps.setIsAutoPilot(isAutoPilot); 
      } else {
          if (brandProps.setTargetText) brandProps.setTargetText(localText);
      }

      if (brandProps.setRefreshStrategy) {
          brandProps.setRefreshStrategy(strategy);
      }
      // Sync Viral Configs
      if (mode === 'viral-story') {
          if (brandProps.setPlatform) brandProps.setPlatform(platform);
          if (brandProps.setDuration) brandProps.setDuration(duration);
      }
      // Sync Structure Params
      if (mode === 'structural-architect') {
          if (brandProps.setPackDimensions) brandProps.setPackDimensions(dims);
          if (brandProps.setPackType) brandProps.setPackType(packType);
      }
  }, [localText, localStyle, strategy, platform, duration, dims, packType, batchCount, isAutoPilot, brandProps, mode]);

  return (
    <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col h-full z-10 shadow-2xl relative">
        
        {/* Single Scroll Container for the entire sidebar content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            
            {/* CONFIGURATION SECTION */}
            <div className="flex-shrink-0">
                {(mode === 'auto-mockup' || mode === 'full-refresh' || mode === 'product-360' || mode === 'ad-campaign' || mode === 'ux-flow' || mode === 'viral-story') && (
                    <BrandBundlePanel 
                      mode={mode} // Pass mode for dynamic titles
                      {...brandProps}
                      onUploadLogo={onUploadLogo}
                      onUploadAssets={onUploadAssets}
                    />
                )}

                {/* Product Photography Panel */}
                {mode === 'product-photography' && (
                    <ProductShootPanel 
                        scene={localText}
                        setScene={setLocalText}
                        lighting={localStyle}
                        setLighting={setLocalStyle}
                        batchCount={batchCount}
                        setBatchCount={setBatchCount}
                        isAutoPilot={isAutoPilot}
                        setIsAutoPilot={setIsAutoPilot}
                        modelRefImage={brandProps.modelRefImage}
                        setModelRefImage={brandProps.setModelRefImage}
                    />
                )}

                {/* Viral Story Config (MODULARIZED) */}
                {mode === 'viral-story' && (
                    <ViralConfigPanel 
                        text={localText} 
                        setText={setLocalText}
                        platform={platform}
                        setPlatform={setPlatform}
                        duration={duration}
                        setDuration={setDuration}
                        currentVibe={brandProps.brandVibe} // Show current vibe in UI
                    />
                )}

                {/* UX/UI Flow Config */}
                {mode === 'ux-flow' && (
                    <div className="p-6 border-b border-slate-800 bg-slate-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">📱</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">UX Flow Engine</h3>
                               <p className="text-[9px] text-slate-500 font-medium">Flow vs Layout Mode</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            {/* Automation Toggle */}
                            <div 
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    isAutoPilot 
                                    ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                                    : 'bg-slate-900 border-slate-700'
                                }`}
                                onClick={() => setIsAutoPilot(!isAutoPilot)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAutoPilot ? 'bg-cyan-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                        {isAutoPilot ? '🤖' : '🖐️'}
                                    </div>
                                    <div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest block ${isAutoPilot ? 'text-cyan-400' : 'text-slate-400'}`}>
                                            Automation 100%
                                        </span>
                                        <span className="text-[8px] text-slate-500">
                                            {isAutoPilot ? "AI UX Director" : "Manual Screens"}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isAutoPilot ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isAutoPilot ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-cyan-400 uppercase block mb-2">Project Context</label>
                                <textarea 
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none transition-all shadow-inner leading-relaxed"
                                    placeholder={isAutoPilot ? "Ví dụ: 'Ứng dụng dắt chó đi dạo giống Grab'. AI sẽ tự nghĩ ra các màn hình cần thiết." : "Mô tả chung về ứng dụng..."}
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Platform & Mode</label>
                                <select value={packType} onChange={(e) => setPackType(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white">
                                    <option value="Mobile App (iOS/Android)">📱 Mobile App (Sequence Flow)</option>
                                    <option value="Web Dashboard (Desktop)">💻 Web Dashboard (Layout)</option>
                                    <option value="Tablet / POS">📟 Tablet / POS (Hybrid)</option>
                                </select>
                            </div>

                            {packType.includes("Mobile") && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Screen Count</label>
                                        <span className="text-[10px] font-black text-cyan-400">{batchCount} Screens</span>
                                    </div>
                                    <input 
                                        type="range" min="2" max="6" step="1" value={batchCount}
                                        onChange={(e) => setBatchCount(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>
                            )}
                            
                            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                <p className="text-[9px] text-cyan-300 leading-relaxed">
                                    <span className="font-bold">✨ AI Logic:</span> 
                                    {isAutoPilot 
                                      ? " AI UX Director sẽ tự phân tích ý tưởng của bạn và quyết định danh sách màn hình tối ưu nhất cho User Flow."
                                      : (packType.includes("Mobile") ? " Tạo chuỗi màn hình mặc định (Login -> Home -> Detail)." : " Tạo Layout Dashboard chuẩn.")
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ad Campaign Config (UPDATED) */}
                {mode === 'ad-campaign' && (
                    <AdCampaignPanel 
                        text={localText} 
                        setText={setLocalText} 
                        brandVibe={brandProps.brandVibe || ""} 
                    />
                )}

                {/* Universal Structure Lab Config */}
                {mode === 'structural-architect' && (
                    <div className="p-6 border-b border-slate-800 bg-slate-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/20">🧬</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Structure Lab</h3>
                               <p className="text-[9px] text-slate-500 font-medium">Any Product: Exploded View</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Object Name / Context</label>
                                <textarea 
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    className="w-full h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none transition-all shadow-inner leading-relaxed"
                                    placeholder="Mô tả vật thể (VD: Giày thể thao, Loa Bluetooth, Ghế văn phòng)..."
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Structure Category</label>
                                <select value={packType} onChange={(e) => setPackType(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white">
                                    <option value="Auto-Detect">✨ Auto-Detect (AI decides)</option>
                                    <option value="Mechanical">⚙️ Mechanical / Machinery</option>
                                    <option value="Electronics">🔌 Electronics (PCB/Casing)</option>
                                    <option value="Footwear">👟 Footwear / Apparel</option>
                                    <option value="Furniture">🪑 Furniture / Joinery</option>
                                    <option value="Rigid Box">📦 Packaging (Box)</option>
                                </select>
                            </div>
                            
                            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                <p className="text-[9px] text-orange-300 leading-relaxed">
                                    <span className="font-bold">✨ Forensic Scanner:</span> Hệ thống sẽ quét từng chi tiết nhỏ (vân, ốc, khớp nối) trước khi thực hiện bản vẽ kỹ thuật để đảm bảo độ chính xác tuyệt đối.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refresh Mode Config */}
                {mode === 'full-refresh' && (
                    <div className="p-6 border-b border-slate-800 bg-slate-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">🔄</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Refresh Logic</h3>
                               <p className="text-[9px] text-slate-500 font-medium">Visual Upgrade Engine</p>
                           </div>
                        </div>
                        
                        <div className="space-y-3">
                           <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                               Strategy
                               <span className="text-blue-400">{strategy}</span>
                           </label>
                           
                           <div className="grid grid-cols-3 gap-2">
                              {(['SOFT', 'HYBRID', 'HARD'] as RefreshStrategy[]).map(s => (
                                <button 
                                   key={s}
                                   onClick={() => setStrategy(s)}
                                   className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-2 group ${
                                       strategy === s 
                                       ? `${STRATEGY_INFO[s].color} border-transparent text-white shadow-lg scale-105` 
                                       : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                                   }`}
                                >
                                   <span className="text-xl group-hover:scale-110 transition-transform">{STRATEGY_INFO[s].icon}</span>
                                   <span className="text-[8px] font-black uppercase tracking-wider">{s}</span>
                                </button>
                              ))}
                           </div>
                           
                           {/* Informative Context Help */}
                           <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
                              <p className="text-[10px] text-slate-300 leading-relaxed flex gap-2">
                                  <span className="text-lg">{STRATEGY_INFO[strategy].icon}</span>
                                  <span>{STRATEGY_INFO[strategy].desc}</span>
                              </p>
                           </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-800/50">
                           <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                               ✨ Yêu cầu bổ sung
                               <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[8px] border border-blue-500/20">Optional</span>
                           </label>
                           <textarea 
                                value={localText}
                                onChange={(e) => setLocalText(e.target.value)}
                                className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-all shadow-inner leading-relaxed"
                                placeholder="Ví dụ: Làm cho ảnh sáng hơn, thêm hiệu ứng neon, bỏ chi tiết thừa, đổi màu nền sang xanh..."
                            />
                        </div>
                    </div>
                )}

                {/* Font Engine Config */}
                {mode === 'font-creation' && (
                    <div className="p-6 border-b border-slate-800 bg-slate-950 space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-800/50">
                            <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-900/30">🅰️</div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Text Styler</h3>
                                <p className="text-[9px] text-slate-500 font-medium">Style Transfer</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-pink-500 uppercase block mb-2">Nội dung cần viết</label>
                            <textarea 
                                value={localText}
                                onChange={(e) => setLocalText(e.target.value)}
                                className="w-full h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 resize-none transition-all"
                                placeholder="Nhập chữ bạn muốn tạo hình..."
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* STICKY QUEUE HEADER */}
            <div className="p-4 border-y border-slate-800 bg-[#0a0f1d]/95 flex justify-between items-center sticky top-0 backdrop-blur-md z-20 shadow-lg">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Queue ({jobs.length})</span>
            </div>
            
            {/* JOB LIST - Now part of the main scroll container */}
            <div className="p-3 space-y-2 pb-20">
                {jobs.map(job => (
                <BatchJobItem 
                    key={job.id} 
                    job={job} 
                    activeJobId={activeJobId} 
                    setActiveJobId={setActiveJobId} 
                    mode={mode as any} 
                    onRemove={onRemoveJob} 
                />
                ))}
            </div>
        </div>
    </div>
  );
};

export default BatchSidebar;
