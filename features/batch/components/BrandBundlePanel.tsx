
import React from 'react';

interface BrandBundlePanelProps {
  mode?: string;
  brandLogo: string | null;
  brandAssets: string[];
  brandVibe: string;
  brandColor: string;
  rebrandStyle: string;
  setBrandVibe: (v: string) => void;
  setBrandColor: (v: string) => void;
  setRebrandStyle: (v: string) => void;
  onUploadLogo: () => void;
  onUploadAssets: () => void;
}

const BrandBundlePanel: React.FC<BrandBundlePanelProps> = ({
  mode,
  brandLogo,
  brandAssets,
  brandVibe,
  brandColor,
  rebrandStyle,
  setBrandVibe,
  setBrandColor,
  setRebrandStyle,
  onUploadLogo,
  onUploadAssets
}) => {
  const isViral = mode === 'viral-story';
  const isCampaign = mode === 'ad-campaign';
  const isMultiTask = mode === 'automation-multi-task';
  
  let title = "Brand Kit";
  let subtitle = "Identity & Assets";
  let vibeLabel = "Brand Vibe";
  let vibePlaceholder = "Mô tả cảm xúc: Tối giản, Sang trọng...";

  if (isViral) {
      title = "Brand DNA & Tone";
      subtitle = "Voice & Personality for Scripts";
      vibeLabel = "Tone of Voice (Giọng văn)";
      vibePlaceholder = "VD: Gen Z, Hài hước, Chuyên gia, Sang trọng...";
  } else if (isCampaign) {
      title = "Campaign Identity";
      subtitle = "Visual Key & Message Tone";
  } else if (isMultiTask) {
      title = "Brand Context";
      subtitle = "Global Identity for All Tasks";
  }

  return (
    <div className="p-6 border-b border-zinc-800 space-y-8 bg-zinc-950">
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/50">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg ${isViral ? 'bg-indigo-600 shadow-indigo-900/30' : isMultiTask ? 'bg-zinc-600 shadow-zinc-900/30' : 'bg-blue-600 shadow-blue-900/30'}`}>
                {isViral ? '🗣️' : isMultiTask ? '🧠' : '💼'}
            </div>
            <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">{title}</h3>
                <p className="text-[9px] text-zinc-500 font-medium">{subtitle}</p>
            </div>
        </div>
        
        {/* 1. Primary Logo */}
        {mode !== 'omni-mockup' && mode !== 'omnilora' && (
        <div className="group">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">1. Primary Logo <span className="text-zinc-600 font-normal normal-case">(Optional)</span></label>
                {brandLogo && <span className="text-[9px] font-bold text-green-500 flex items-center gap-1">✓ Ready</span>}
            </div>
            
            <div onClick={onUploadLogo} className={`w-full h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all relative overflow-hidden ${brandLogo ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-blue-500/50 hover:bg-zinc-800'}`}>
                {brandLogo ? (
                    <div className="relative w-full h-full p-4 flex items-center justify-center">
                        <img src={brandLogo} className="max-w-full max-h-full object-contain drop-shadow-xl" alt="Brand Logo" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <span className="text-[9px] font-bold text-white uppercase tracking-widest border border-white/30 px-3 py-1 rounded-full">Change Logo</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-zinc-500 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider group-hover:text-blue-400">Click to Upload</span>
                    </>
                )}
            </div>
        </div>
        )}

        {/* 2. Visual Assets */}
        {mode !== 'omni-mockup' && (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    {mode === 'omnilora' ? 'Character References' : '2. Brand Patterns'} <span className="text-zinc-600 font-normal normal-case">(Optional)</span>
                </label>
                <span className="text-[9px] font-mono text-zinc-600">{mode === 'omnilora' ? brandAssets.length : `${brandAssets.length}/5`}</span>
            </div>
            
            <div onClick={onUploadAssets} className={`w-full min-h-[80px] p-3 rounded-2xl border-2 border-dashed flex flex-wrap gap-2 items-center justify-center cursor-pointer transition-all hover:border-indigo-500/50 hover:bg-zinc-800 ${brandAssets.length > 0 ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
                {brandAssets.length > 0 ? (
                    <>
                        {brandAssets.map((asset, i) => (
                            <div key={i} className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-black/40 shadow-sm relative group/asset">
                                <img src={asset} className="w-full h-full object-cover" alt={`Asset ${i}`} />
                                {mode === 'omnilora' && (
                                    <div className="absolute top-0 left-0 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg">
                                        #{i + 1}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="w-12 h-12 rounded-xl border-2 border-dashed border-indigo-500/30 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400">
                            <span className="text-xl">+</span>
                        </div>
                    </>
                ) : (
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider py-4">
                        {mode === 'omnilora' ? 'Upload Characters' : 'Upload Graphics'}
                    </span>
                )}
            </div>

            {mode === 'omnilora' && (
                <div className="mt-3">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">Character Profiles <span className="text-zinc-500 font-normal normal-case">(Link to images)</span></label>
                    <textarea 
                        value={rebrandStyle} 
                        onChange={(e) => setRebrandStyle(e.target.value)} 
                        className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[10px] text-white resize-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-zinc-600 transition-all"
                        placeholder="Ví dụ: Ảnh #1: Alice (Nữ chính, tóc vàng). Ảnh #2: Bob (Nam chính, tóc đen)..."
                    />
                </div>
            )}
        </div>
        )}

        <div className="h-px bg-zinc-800/50 w-full"></div>

        {/* 3. Vibe Description */}
        <div>
            <label className="text-[9px] font-bold text-zinc-400 uppercase block mb-2">{mode === 'omni-mockup' || mode === 'omnilora' ? '1.' : '3.'} {mode === 'omnilora' ? 'Art Style (Anime, Webtoon...)' : vibeLabel} <span className="text-indigo-400 font-bold">*</span></label>
            <div className="relative">
                <textarea 
                    value={brandVibe} 
                    onChange={(e) => setBrandVibe(e.target.value)} 
                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[10px] text-white resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-zinc-600 transition-all"
                    placeholder={vibePlaceholder}
                />
                <div className="absolute bottom-2 right-2 text-lg opacity-50">✨</div>
            </div>
        </div>

        {/* 4. Branding Details */}
        {mode !== 'omnilora' && (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-2">{mode === 'omni-mockup' ? '2.' : ''} Primary Color</label>
                <div className="h-10 w-full bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-2 gap-2 hover:border-zinc-700 transition-colors cursor-pointer relative overflow-hidden group">
                    <input 
                        type="color" 
                        value={brandColor} 
                        onChange={(e) => setBrandColor(e.target.value)} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="w-6 h-6 rounded-lg border border-white/20 shadow-sm" style={{ backgroundColor: brandColor }}></div>
                    <span className="text-[9px] font-mono text-zinc-300 uppercase tracking-widest">{brandColor}</span>
                </div>
            </div>
            <div>
                <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-2">Material</label>
                <input 
                    type="text" 
                    value={rebrandStyle} 
                    onChange={(e) => setRebrandStyle(e.target.value)} 
                    className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-3 text-[9px] text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-0 transition-all" 
                    placeholder="Tùy chọn..." 
                />
            </div>
        </div>
        )}
    </div>
  );
};

export default BrandBundlePanel;
