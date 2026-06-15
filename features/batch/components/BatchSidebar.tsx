
import React, { useState, useEffect } from 'react';
import { BatchJob, RefreshStrategy } from '../../../types';
import BrandBundlePanel from './BrandBundlePanel';
import ViralConfigPanel from './ViralConfigPanel';
import ProductShootPanel from './ProductShootPanel';
import AdCampaignPanel from './AdCampaignPanel'; // NEW IMPORT
import BatchJobItem from './BatchJobItem';
import { BatchMode } from '../hooks/useBatchProcessing';
import { Button } from '../../../components/ui/Button';

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
    'SOFT': { icon: '✨', label: 'Soft Refresh', color: 'bg-blue-600', desc: 'Giữ nguyên bố cục gốc. Chỉ làm nét, phối lại màu và thêm hiệu ứng ánh sáng.' },
    'HYBRID': { icon: '⚡', label: 'Hybrid Mode', color: 'bg-purple-600', desc: 'Cân bằng. Giữ ý tưởng chính, tự động sắp xếp lại bố cục cho chuẩn thẩm mỹ.' },
    'HARD': { icon: '🔥', label: 'Hard Reboot', color: 'bg-orange-600', desc: 'Sáng tạo tự do. AI tự do thiết kế lại hoàn toàn dựa trên nội dung gốc.' }
};

const BatchSidebar: React.FC<BatchSidebarProps> = ({
  mode, brandProps, jobs, activeJobId, setActiveJobId, onRemoveJob, onUploadLogo, onUploadAssets
}) => {
  const [localText, setLocalText] = useState("");
  const [localStyle, setLocalStyle] = useState("");
  const [strategy, setStrategy] = useState<RefreshStrategy>('HYBRID');
  
  // Viral Config State
  const [platform, setPlatform] = useState("TikTok");
  const [duration, setDuration] = useState("10s");

  // Structure/Packaging State
  const [dims] = useState({ w: 10, h: 15, d: 5 });
  
  // Initialize packType based on mode to prevent stale state issues
  const [packType, setPackType] = useState(mode === 'ux-flow' ? "Mobile App (iOS/Android)" : "Auto-Detect");

  // Photography Params
  const [batchCount, setBatchCount] = useState(1);
  const [isAutoPilot, setIsAutoPilot] = useState(false); 

  // Video Params
  const [videoResolution, setVideoResolution] = useState("1080p");
  const [videoAudioEnabled, setVideoAudioEnabled] = useState(true);
  const [videoAspectRatio, setVideoAspectRatio] = useState("16:9");
  
  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Watch for mode changes to reset defaults
  useEffect(() => {
      if (mode === 'ux-flow') {
          setPackType("Mobile App (iOS/Android)");
      } else if (mode === 'structural-architect') {
          setPackType("Auto-Detect");
      } else if (mode === 'floorplan-stylist') {
          setPackType("Match Input");
          setLocalText("Apartment");
          setLocalStyle("Photorealistic");
      } else if (mode === 'photo-retouch') {
          setLocalStyle("Auto Enhance");
      } else if (mode === 'error-fixer') {
          setLocalStyle("Auto-Detect");
      } else if (mode === 'design-system-extractor') {
          setPackType("Full Extraction");
      } else if (mode === 'omni-slider') {
          setPackType("1:1");
      } else if (mode === 'authentic-review') {
          setLocalStyle("Gen Z (Trẻ trung, trendy)");
          setPackType("Khen ngợi & Góp ý nhẹ");
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
      } else if (mode === 'studio-videos') {
          if (brandProps.setTargetText) brandProps.setTargetText(localText); 
          if (brandProps.setVideoResolution) brandProps.setVideoResolution(videoResolution);
          if (brandProps.setVideoAudioEnabled) brandProps.setVideoAudioEnabled(videoAudioEnabled);
          if (brandProps.setVideoAspectRatio) brandProps.setVideoAspectRatio(videoAspectRatio);
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
          if (brandProps.setTargetText) brandProps.setTargetText(localText);
      }
      
      if (mode === 'floorplan-stylist') {
          if (brandProps.setPackType) brandProps.setPackType(packType);
          if (brandProps.setTargetText) brandProps.setTargetText(localText);
          if (brandProps.setBrandVibe) brandProps.setBrandVibe(localStyle);
      }
      
      if (mode === 'photo-retouch' || mode === 'error-fixer' || mode === 'font-creation') {
          if (brandProps.setBrandVibe) brandProps.setBrandVibe(localStyle);
      }
      
      if (mode === 'design-system-extractor') {
          if (brandProps.setPackType) brandProps.setPackType(packType);
      }
      
      // Sync Omni Slider Params
      if (mode === 'omni-slider') {
          if (brandProps.setPackType) brandProps.setPackType(packType);
          if (brandProps.setBatchCount) brandProps.setBatchCount(batchCount);
      }
      
      if (mode === 'authentic-review') {
          if (brandProps.setBrandVibe) brandProps.setBrandVibe(localStyle);
          if (brandProps.setPackType) brandProps.setPackType(packType);
          if (brandProps.setTargetText) brandProps.setTargetText(localText);
      }
  }, [localText, localStyle, strategy, platform, duration, dims, packType, batchCount, isAutoPilot, videoResolution, videoAudioEnabled, brandProps, mode]);

  return (
    <div className="w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full min-h-0 z-10 shadow-2xl relative">
        
        {/* Single Scroll Container for the entire sidebar content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            
            {/* CONFIGURATION SECTION */}
            <div className="flex-shrink-0">
                {(mode === 'auto-mockup' || mode === 'omni-mockup' || mode === 'omnichannel-resize' || mode === 'omnilora' || mode === 'omni-slider' || mode === 'full-refresh' || mode === 'product-360' || mode === 'ad-campaign' || mode === 'ux-flow' || mode === 'viral-story' || mode === 'automation-multi-task' || mode === 'design-system-extractor' || mode === 'floorplan-stylist') && (
                    <BrandBundlePanel 
                      mode={mode} // Pass mode for dynamic titles
                      {...brandProps}
                      onUploadLogo={onUploadLogo}
                      onUploadAssets={onUploadAssets}
                    />
                )}

                {mode === 'product-360' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20">🔄</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">360° Product Viewer</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Generate multi-angle views</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Product Context (Optional)
                                </label>
                                <textarea
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    placeholder="e.g. 'A sleek modern coffee maker', 'A pair of running shoes'"
                                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                                />
                            </div>
                            
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <p className="text-[10px] text-emerald-400 font-medium leading-relaxed">
                                    <span className="font-bold text-emerald-300">AI Logic:</span> The system will analyze the product and generate multiple angles to create a 360-degree interactive viewer.
                                </p>
                            </div>
                        </div>
                    </div>
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
                {mode === 'omni-mockup' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/20">🛍️</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Omni-Mockup Generator</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Auto-generate 4 mockups from 1 logo</p>
                           </div>
                        </div>

                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                            <p className="text-[10px] text-orange-400 font-medium leading-relaxed">
                                <span className="font-bold text-orange-300">AI Logic:</span> Upload your logo as the main image. The system will automatically generate 4 high-quality mockups (T-Shirt, Mug, Billboard, Tote Bag) applying your logo and brand vibe.
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'omnichannel-resize' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">📐</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Omnichannel Auto-Resize</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Auto-crop & expand to 3 standard formats</p>
                           </div>
                        </div>

                        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <p className="text-[10px] text-indigo-400 font-medium leading-relaxed">
                                <span className="font-bold text-indigo-300">AI Logic:</span> Upload your base image. The system will analyze the composition and intelligently generate 3 optimized formats: IG Story (9:16), FB Post (1:1), and Web Banner (16:9) without losing the main subject.
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'omni-slider' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-900/20">🖼️</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Omni Slider Generator</h3>
                               <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Tạo chuỗi slider ảnh tự động</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Nội dung Full (Story/Content)</label>
                                <textarea 
                                    value={localText}
                                    onChange={e => setLocalText(e.target.value)}
                                    placeholder="Nhập toàn bộ nội dung cần chuyển thành slider..."
                                    className="w-full h-32 bg-black/50 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all resize-none custom-scrollbar"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Đối tượng & Phong cách</label>
                                <textarea 
                                    value={localStyle}
                                    onChange={e => setLocalStyle(e.target.value)}
                                    placeholder="Ví dụ: GenZ, phong cách hiện đại, màu sắc tươi sáng..."
                                    className="w-full h-20 bg-black/50 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all resize-none custom-scrollbar"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Tỷ lệ khung hình</label>
                                    <select 
                                        value={packType}
                                        onChange={e => setPackType(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                                    >
                                        <option value="1:1">Vuông (1:1)</option>
                                        <option value="3:4">Dọc (3:4)</option>
                                        <option value="9:16">Story (9:16)</option>
                                        <option value="4:3">Ngang (4:3)</option>
                                        <option value="16:9">Video (16:9)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Số lượng Slide</label>
                                    <input 
                                        type="number" 
                                        min="2" max="10" 
                                        value={batchCount}
                                        onChange={e => setBatchCount(parseInt(e.target.value) || 5)}
                                        className="w-full bg-black/50 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                                    />
                                </div>
                            </div>

                            <p className="text-[10px] text-zinc-500 italic">
                                💡 AI sẽ tự động phân tích nội dung, chia slide, lên kịch bản hình ảnh và render đồng loạt. Bạn có thể chia sẵn slide bằng cách ghi "Slide 1:", "Slide 2:",...
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'omnilora' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-yellow-900/20">🦸</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">OmniLoRA Comic Studio</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Multi-Agent Webtoon Generation</p>
                           </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Story / Plot <span className="text-yellow-400 font-bold">*</span></label>
                            <textarea 
                                value={localText} 
                                onChange={(e) => setLocalText(e.target.value)} 
                                className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] text-white resize-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 placeholder-zinc-600 transition-all"
                                placeholder="Nhập cốt truyện của bạn vào đây..."
                            />
                        </div>

                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                            <p className="text-[10px] text-yellow-400 font-medium leading-relaxed">
                                <span className="font-bold text-yellow-300">Workflow:</span> 1. Orchestrator -&gt; 2. Script & Storyboard -&gt; 3. Character Manager -&gt; 4. Prompt Engineer -&gt; 5. Rendering -&gt; 6. Compositing.
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'authentic-review' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/20">🗣️</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Authentic Review</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Tạo review chân thực & ảnh check-in</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    Đối tượng (Target Audience)
                                </label>
                                <select
                                    value={localStyle}
                                    onChange={(e) => setLocalStyle(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                                >
                                    <option value="Gen Z (Trẻ trung, trendy)">Gen Z (Trẻ trung, trendy)</option>
                                    <option value="Dân văn phòng (Lịch sự, chill)">Dân văn phòng (Lịch sự, chill)</option>
                                    <option value="Gia đình (Ấm cúng, tiện ích)">Gia đình (Ấm cúng, tiện ích)</option>
                                    <option value="Chuyên gia (Đánh giá sâu sắc)">Chuyên gia (Đánh giá sâu sắc)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                    Tone giọng (Review Tone)
                                </label>
                                <select
                                    value={packType}
                                    onChange={(e) => setPackType(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                                >
                                    <option value="Khen ngợi & Góp ý nhẹ">Khen ngợi & Góp ý nhẹ (Tích cực)</option>
                                    <option value="Khen nức nở">Khen nức nở (Seeding mạnh)</option>
                                    <option value="Chê tinh tế">Chê tinh tế (Khó tính)</option>
                                    <option value="Khách quan 50/50">Khách quan 50/50 (Công tâm)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    Điểm nhấn (Tùy chọn)
                                </label>
                                <textarea
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    placeholder="Ví dụ: Nhấn mạnh vào view hoàng hôn, hoặc nhắc đến món nước signature..."
                                    className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'photo-retouch' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">✨</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Photo Retouch</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Professional post-processing</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Target Vibe / Style
                                </label>
                                <select
                                    value={localStyle}
                                    onChange={(e) => setLocalStyle(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                >
                                    <option value="Auto Enhance">✨ Auto Enhance (Tự động tối ưu)</option>
                                    <option value="Cinematic">🎬 Cinematic (Điện ảnh)</option>
                                    <option value="Vintage Film">🎞️ Vintage Film (Màu phim cổ điển)</option>
                                    <option value="Bright & Airy">☁️ Bright & Airy (Sáng & Trong trẻo)</option>
                                    <option value="Moody & Dark">🌑 Moody & Dark (Tối & Sâu lắng)</option>
                                    <option value="Black & White">⚫ Black & White (Đen trắng)</option>
                                    <option value="Cyberpunk">🌆 Cyberpunk (Neon)</option>
                                    <option value="Studio Portrait">📸 Studio Portrait (Chân dung Studio)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                    Specific Instructions (Optional)
                                </label>
                                <textarea
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    placeholder="e.g. 'Enhance the contrast', 'Make the colors pop more'"
                                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                                />
                            </div>
                            
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <p className="text-[10px] text-blue-400 font-medium leading-relaxed">
                                    <span className="font-bold text-blue-300">AI Logic:</span> The system will analyze the photo's lighting, color grading, and details, then apply professional retouching to enhance the overall quality based on your instructions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'error-fixer' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-900/20">🛠️</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Error Fixer & Enhancer</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Auto-detect and fix design flaws</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Focus Area
                                </label>
                                <select
                                    value={localStyle}
                                    onChange={(e) => setLocalStyle(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500/50 transition-colors"
                                >
                                    <option value="Auto-Detect">✨ Auto-Detect (Tự động phát hiện lỗi)</option>
                                    <option value="Typography & Text">🔤 Typography & Text (Lỗi chữ/font)</option>
                                    <option value="Layout & Alignment">📐 Layout & Alignment (Bố cục/Căn chỉnh)</option>
                                    <option value="Color & Contrast">🎨 Color & Contrast (Màu sắc/Độ tương phản)</option>
                                    <option value="Artifact Removal">🧹 Artifact Removal (Xóa chi tiết thừa)</option>
                                    <option value="Face & Hands">👤 Face & Hands (Sửa lỗi khuôn mặt/bàn tay)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    Specific Instructions (Optional)
                                </label>
                                <textarea
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    placeholder="e.g. 'Fix the typography alignment', 'Remove the weird artifact on the left'"
                                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                                />
                            </div>
                            
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-[10px] text-red-400 font-medium leading-relaxed">
                                    <span className="font-bold text-red-300">AI Logic:</span> The system will scan the image for visual errors, layout issues, or typography mistakes, and generate a corrected, enhanced version.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'design-system-extractor' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-900/20">🎨</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Design System Extractor</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Auto-extract colors, typography & components</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                    Extraction Scope
                                </label>
                                <select
                                    value={packType}
                                    onChange={(e) => setPackType(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                                >
                                    <option value="Full Extraction">✨ Full Extraction (Tất cả)</option>
                                    <option value="Color Palette Only">🎨 Color Palette Only (Chỉ bảng màu)</option>
                                    <option value="Typography Only">🔤 Typography Only (Chỉ Typography)</option>
                                    <option value="UI Components Only">🧩 UI Components Only (Chỉ UI Components)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                    Context / Notes (Optional)
                                </label>
                                <textarea
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    placeholder="Any specific focus? (e.g. 'Focus on button states' or 'Extract dark mode colors')"
                                    className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 transition-colors resize-none"
                                />
                            </div>
                            
                            <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                                <p className="text-[10px] text-pink-400 font-medium leading-relaxed">
                                    <span className="font-bold text-pink-300">AI Logic:</span> The system will scan the uploaded UI image, extract the color palette, typography hierarchy, and UI component specs into a Markdown document, and generate a visual presentation board.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'ux-flow' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-900/20">📱</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">UX Flow Engine</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Flow vs Layout Mode</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            {/* Automation Toggle */}
                            <div 
                                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                    isAutoPilot 
                                    ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                                    : 'bg-zinc-900 border-zinc-700'
                                }`}
                                onClick={() => setIsAutoPilot(!isAutoPilot)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAutoPilot ? 'bg-cyan-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {isAutoPilot ? '🤖' : '🖐️'}
                                    </div>
                                    <div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest block ${isAutoPilot ? 'text-cyan-400' : 'text-zinc-400'}`}>
                                            Automation 100%
                                        </span>
                                        <span className="text-[8px] text-zinc-500">
                                            {isAutoPilot ? "AI UX Director" : "Manual Screens"}
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isAutoPilot ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isAutoPilot ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-cyan-400 uppercase block mb-2">Project Context</label>
                                <textarea 
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none transition-all shadow-inner leading-relaxed"
                                    placeholder={isAutoPilot ? "Ví dụ: 'Ứng dụng dắt chó đi dạo giống Grab'. AI sẽ tự nghĩ ra các màn hình cần thiết." : "Mô tả chung về ứng dụng..."}
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Platform & Mode</label>
                                <select value={packType} onChange={(e) => setPackType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-[10px] text-white">
                                    <option value="Mobile App (iOS/Android)">📱 Mobile App (Sequence Flow)</option>
                                    <option value="Web Dashboard (Desktop)">💻 Web Dashboard (Layout)</option>
                                    <option value="Tablet / POS">📟 Tablet / POS (Hybrid)</option>
                                </select>
                            </div>

                            {packType.includes("Mobile") && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase">Screen Count</label>
                                        <span className="text-[10px] font-black text-cyan-400">{batchCount} Screens</span>
                                    </div>
                                    <input 
                                        type="range" min="2" max="6" step="1" value={batchCount}
                                        onChange={(e) => setBatchCount(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
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

                {/* Floorplan Stylist Config */}
                {mode === 'floorplan-stylist' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-900/20">📐</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Floorplan Stylist</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">1-Click Concept Transfer</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Building Type</label>
                                <select
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-inner"
                                >
                                    <option value="Apartment">Apartment</option>
                                    <option value="Studio Apartment">Studio Apartment</option>
                                    <option value="Penthouse">Penthouse</option>
                                    <option value="Duplex">Duplex</option>
                                    <option value="House">House / Villa</option>
                                    <option value="Mansion">Mansion</option>
                                    <option value="Office">Office Space</option>
                                    <option value="Co-working Space">Co-working Space</option>
                                    <option value="Retail">Retail / Store</option>
                                    <option value="Restaurant">Restaurant / Cafe</option>
                                    <option value="Hotel Room">Hotel Room</option>
                                    <option value="Resort Villa">Resort Villa</option>
                                    <option value="Clinic">Clinic / Hospital</option>
                                    <option value="Classroom">School / Classroom</option>
                                    <option value="Gym">Gym / Fitness Center</option>
                                    <option value="Exhibition Booth">Exhibition Booth</option>
                                    <option value="Warehouse">Warehouse / Factory</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Visual Style</label>
                                <select
                                    value={localStyle}
                                    onChange={(e) => setLocalStyle(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-inner"
                                >
                                    <option value="Photorealistic">Photorealistic (Chân thực)</option>
                                    <option value="Blueprint">Blueprint (Bản vẽ kỹ thuật)</option>
                                    <option value="Hand-drawn Sketch">Hand-drawn Sketch (Bản vẽ tay)</option>
                                    <option value="Watercolor">Watercolor (Màu nước)</option>
                                    <option value="3D Render">3D Render (Kết xuất 3D)</option>
                                    <option value="Minimalist">Minimalist (Tối giản)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Perspective</label>
                                <select
                                    value={packType}
                                    onChange={(e) => setPackType(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all shadow-inner"
                                >
                                    <option value="Match Input">Match Input (Giữ nguyên góc nhìn gốc)</option>
                                    <option value="2D Top-down">2D Top-down (Flat)</option>
                                    <option value="3D Isometric">3D Isometric (Angled)</option>
                                    <option value="3D Perspective">3D Perspective (Eye-level)</option>
                                    <option value="3D Bird's-eye">3D Bird's-eye View</option>
                                    <option value="3D Cutaway">3D Cutaway View</option>
                                    <option value="Elevation">Elevation (Front/Side View)</option>
                                </select>
                            </div>
                            
                            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                                <p className="text-[10px] text-teal-400/80 leading-relaxed">
                                    <strong className="text-teal-300">Instructions:</strong><br/>
                                    1. Upload your <strong>New Floorplan</strong> structure to the main Job area.<br/>
                                    2. Upload your <strong>Concept Image</strong> to the Brand Assets section above.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Universal Structure Lab Config */}
                {mode === 'structural-architect' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/20">🧬</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Structure Lab</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Any Product: Exploded View</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Object Name / Context</label>
                                <textarea 
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 resize-none transition-all shadow-inner leading-relaxed"
                                    placeholder="Mô tả vật thể (VD: Giày thể thao, Loa Bluetooth, Ghế văn phòng)..."
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Structure Category</label>
                                <select value={packType} onChange={(e) => setPackType(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-[10px] text-white">
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

                {/* Automation Multi-Task Config */}
                {mode === 'automation-multi-task' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-500 flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">🤖</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Đa Nhiệm Tự Động</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">Big Data &rarr; Đa Kết Quả</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Dữ liệu đầu vào (Big Data)</label>
                                <textarea 
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-zinc-500/50 focus:border-zinc-500 resize-none transition-all shadow-inner leading-relaxed custom-scrollbar"
                                    placeholder="Dán dữ liệu lớn, báo cáo hoặc ngữ cảnh vào đây..."
                                />
                            </div>
                            
                            <div className="p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-xl">
                                <p className="text-[9px] text-zinc-300 leading-relaxed">
                                    <span className="font-bold">✨ Quy trình:</span> 
                                    <br/>1. <span className="text-zinc-400">Phân tích:</span> Quét sâu dữ liệu đầu vào.
                                    <br/>2. <span className="text-zinc-400">Chiến lược:</span> Xác định các nhiệm vụ trọng tâm.
                                    <br/>3. <span className="text-zinc-400">Thực thi:</span> Xử lý song song bằng Multi-Agent.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refresh Mode Config */}
                {/* Refresh Mode Config */}
                {mode === 'full-refresh' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">🔄</div>
                           <div>
                               <h3 className="text-xs font-black text-white uppercase tracking-widest">Refresh Logic</h3>
                               <p className="text-[9px] text-zinc-500 font-medium">AI Design Intent Analysis & Upgrade</p>
                           </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <p className="text-[10px] text-blue-300 leading-relaxed">
                                <strong className="text-blue-400">Cách hoạt động:</strong> Tải lên một bản thiết kế xấu, phác thảo tay hoặc mockup chất lượng thấp. AI sẽ tự động đọc hiểu ý đồ, sắp xếp lại bố cục, phối màu chuẩn thẩm mỹ và vẽ lại chi tiết với độ phân giải cao.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                           <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex justify-between">
                               Mức độ can thiệp (Strategy)
                               <span className="text-blue-400">{strategy}</span>
                           </label>
                           
                           <div className="grid grid-cols-3 gap-2">
                              {(['SOFT', 'HYBRID', 'HARD'] as RefreshStrategy[]).map(s => (
                                <Button 
                                   key={s}
                                   variant="outline"
                                   onClick={() => setStrategy(s)}
                                   className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-2 group ${
                                       strategy === s 
                                       ? `${STRATEGY_INFO[s].color} border-transparent text-white shadow-lg scale-105` 
                                       : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                                   }`}
                                >
                                   <span className="text-xl group-hover:scale-110 transition-transform">{STRATEGY_INFO[s].icon}</span>
                                   <span className="text-[8px] font-black uppercase tracking-wider">{s}</span>
                                </Button>
                              ))}
                           </div>
                           
                           {/* Informative Context Help */}
                           <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                              <p className="text-[10px] text-zinc-300 leading-relaxed flex gap-2">
                                  <span className="text-lg">{STRATEGY_INFO[strategy].icon}</span>
                                  <span>{STRATEGY_INFO[strategy].desc}</span>
                              </p>
                           </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                           <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                               ✨ Yêu cầu bổ sung
                               <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[8px] border border-blue-500/20">Optional</span>
                           </label>
                           <textarea 
                                value={localText}
                                onChange={(e) => setLocalText(e.target.value)}
                                className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-all shadow-inner leading-relaxed"
                                placeholder="Ví dụ: Làm cho ảnh sáng hơn, thêm hiệu ứng neon, đổi màu nền sang xanh, giữ nguyên logo..."
                            />
                        </div>
                    </div>
                )}

                {/* Font Engine Config */}
                {mode === 'font-creation' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-950 space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-zinc-800/50">
                            <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-900/30">🅰️</div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Text Styler</h3>
                                <p className="text-[9px] text-zinc-500 font-medium">Style Transfer</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-pink-500 uppercase block mb-2">Nội dung cần viết</label>
                            <textarea 
                                value={localText}
                                onChange={(e) => setLocalText(e.target.value)}
                                className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 resize-none transition-all"
                                placeholder="Nhập chữ bạn muốn tạo hình..."
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-pink-500 uppercase block mb-2">Phong cách (Style)</label>
                            <input 
                                type="text"
                                value={localStyle}
                                onChange={(e) => setLocalStyle(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all"
                                placeholder="VD: Neon, 3D Gold, Cyberpunk..."
                            />
                        </div>
                    </div>
                )}
                {/* Studio Videos Config */}
                {mode === 'studio-videos' && (
                    <div className="p-6 border-b border-zinc-800 bg-zinc-950 space-y-5">
                        <div className="flex items-center gap-3 pb-2 border-b border-zinc-800/50">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30">🎬</div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Studio Videos</h3>
                                <p className="text-[9px] text-zinc-500 font-medium">Veo 3.1 AI Generation</p>
                            </div>
                        </div>

                        <div className="p-3 bg-purple-900/20 border border-purple-800/50 rounded-xl">
                            <p className="text-[10px] text-purple-300 leading-relaxed">
                                <strong className="text-purple-400">Mẹo:</strong> Bạn có thể chọn cùng lúc lên đến 4 ảnh (1 ảnh gốc + 3 ảnh tham chiếu) khi bấm nút "Add Hook Images" để tạo video có độ nhất quán cao hơn.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase">Video Prompt</label>
                                    <Button 
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const suggestions = [
                                                "Camera pan slowly, cinematic lighting, 4k resolution, photorealistic",
                                                "Fast paced action, motion blur, dynamic angle, neon cyberpunk style",
                                                "Soft focus, romantic atmosphere, golden hour lighting, gentle breeze",
                                                "Drone shot flying over, epic scale, highly detailed, 8k",
                                                "Macro shot, extreme close up, shallow depth of field, studio lighting"
                                            ];
                                            setLocalText(suggestions[Math.floor(Math.random() * suggestions.length)]);
                                        }}
                                        className="text-[9px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors h-auto py-1 px-2"
                                    >
                                        🎲 Gợi ý ngẫu nhiên
                                    </Button>
                                </div>
                                <textarea 
                                    value={localText}
                                    onChange={(e) => setLocalText(e.target.value)}
                                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all shadow-inner leading-relaxed"
                                    placeholder="Mô tả hành động, chuyển động, không gian... (VD: Camera pan slowly, cinematic lighting...)"
                                />
                            </div>

                            <div className="border-t border-zinc-800/50 pt-4">
                                <Button 
                                    variant="ghost"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-400 hover:text-white uppercase transition-colors h-auto py-2"
                                >
                                    <span className="flex items-center gap-2">⚙️ Cài đặt nâng cao</span>
                                    <span>{showAdvanced ? '▲' : '▼'}</span>
                                </Button>
                                
                                {showAdvanced && (
                                    <div className="grid grid-cols-2 gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Độ phân giải</label>
                                            <select 
                                                value={videoResolution}
                                                onChange={(e) => setVideoResolution(e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                                            >
                                                <option value="720p">720p (Fast)</option>
                                                <option value="1080p">1080p (HQ)</option>
                                                <option value="4K">4K (Ultra)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Tỷ lệ khung hình</label>
                                            <select 
                                                value={jobs[0]?.referenceUrls && jobs[0].referenceUrls.length > 0 ? "16:9" : videoAspectRatio}
                                                onChange={(e) => setVideoAspectRatio(e.target.value)}
                                                disabled={jobs[0]?.referenceUrls && jobs[0].referenceUrls.length > 0}
                                                className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-purple-500/50 outline-none ${jobs[0]?.referenceUrls && jobs[0].referenceUrls.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="16:9">16:9 (Ngang)</option>
                                                <option value="9:16">9:16 (Dọc)</option>
                                            </select>
                                            {jobs[0]?.referenceUrls && jobs[0].referenceUrls.length > 0 && (
                                                <p className="text-[8px] text-orange-400 mt-1">Bắt buộc 16:9 khi dùng nhiều ảnh</p>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Audio FX</label>
                                            <Button
                                                onClick={() => setVideoAudioEnabled(!videoAudioEnabled)}
                                                className={`w-full p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                                    videoAudioEnabled 
                                                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' 
                                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                                                }`}
                                            >
                                                {videoAudioEnabled ? '🔊 Bật (Auto)' : '🔇 Tắt'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex gap-3 items-start">
                                <span className="text-lg">🖼️</span>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    <strong className="text-zinc-200">Frame-specific:</strong> Ảnh gốc của bạn sẽ tự động được dùng làm First Frame (khung hình đầu tiên) cho video.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* STICKY QUEUE HEADER */}
            <div className="p-4 border-y border-zinc-800 bg-[#0a0f1d]/95 flex justify-between items-center sticky top-0 backdrop-blur-md z-20 shadow-lg">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Queue ({jobs.length})</span>
            </div>
            
            {/* JOB LIST - Now part of the main scroll container */}
            <div className="p-3 space-y-2 pb-20">
                {jobs.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs flex flex-col items-center gap-2">
                        <span className="text-2xl opacity-50">📂</span>
                        <p>Chưa có file nào trong hàng đợi.</p>
                        <p className="text-[10px] opacity-70">Thêm file để bắt đầu xử lý.</p>
                    </div>
                ) : (
                    jobs.map(job => (
                        <BatchJobItem 
                            key={job.id} 
                            job={job} 
                            activeJobId={activeJobId} 
                            setActiveJobId={setActiveJobId} 
                            mode={mode as any} 
                            onRemove={onRemoveJob} 
                        />
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

export default BatchSidebar;
