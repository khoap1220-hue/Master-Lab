
import React from 'react';

interface ViralConfigPanelProps {
  text: string;
  setText: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  duration: string;
  setDuration: (v: string) => void;
  currentVibe?: string; // New prop
}

const ViralConfigPanel: React.FC<ViralConfigPanelProps> = ({
  text, setText, platform, setPlatform, duration, setDuration, currentVibe
}) => {
  return (
    <div className="p-6 border-b border-slate-800 bg-slate-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">🎯</div>
           <div>
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Viral Story Engine</h3>
               <p className="text-[9px] text-slate-500 font-medium">One Root - Ten Thousand Branches</p>
           </div>
        </div>

        <div className="space-y-4">
            <div>
                <label className="text-[9px] font-bold text-indigo-400 uppercase block mb-2">Nội dung gốc (Hạt nhân dữ liệu)</label>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all shadow-inner leading-relaxed custom-scrollbar"
                    placeholder="Dán nội dung gốc chất lượng cao vào đây: Bài Blog, Transcript Video, Tài liệu Brand Guideline, hoặc Ý tưởng chi tiết..."
                />
            </div>

            {/* Vibe Confirmation */}
            <div className="p-3 bg-black/20 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Active Brand Tone:</span>
                <span className={`text-[9px] font-bold truncate max-w-[140px] ${currentVibe ? 'text-indigo-400' : 'text-red-400'}`}>
                    {currentVibe || "Missing (See Brand DNA above)"}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Platform</label>
                    <select 
                        value={platform} 
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white focus:ring-indigo-500"
                    >
                        <option value="TikTok">TikTok (9:16)</option>
                        <option value="Reels">Reels (9:16)</option>
                        <option value="Shorts">Shorts (9:16)</option>
                        <option value="YouTube">YouTube (16:9)</option>
                    </select>
                </div>
                <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Duration</label>
                    <select 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white focus:ring-indigo-500"
                    >
                        <option value="15s">15 Seconds</option>
                        <option value="30s">30 Seconds</option>
                        <option value="45s">45 Seconds</option>
                        <option value="60s">60 Seconds</option>
                    </select>
                </div>
            </div>
            
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-[9px] text-indigo-300 leading-relaxed">
                    <span className="font-bold">✨ Automated Workflow:</span> 
                    <br/>1. Trích xuất Hook & Tone từ nội dung gốc.
                    <br/>2. Tạo 10 Video Scripts, 5 Social Posts, 20 Quotes.
                    <br/>3. Agent "Brand Manager" kiểm duyệt tự động.
                </p>
            </div>
        </div>
    </div>
  );
};

export default ViralConfigPanel;
