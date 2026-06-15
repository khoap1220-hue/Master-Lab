
import React from 'react';
import { Button } from '../../../components/ui/Button';

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
    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">🎯</div>
           <div>
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Viral Story Engine</h3>
               <p className="text-[9px] text-zinc-500 font-medium">One Root - Ten Thousand Branches</p>
           </div>
        </div>

        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] font-bold text-indigo-400 uppercase">Nội dung gốc (Hạt nhân dữ liệu)</label>
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const suggestions = [
                                "Một cô gái trẻ đang ngồi uống cà phê trong một quán nhỏ ở Paris, ánh nắng chiều chiếu qua cửa sổ, cô ấy đang đọc một cuốn sách cũ.",
                                "Sản phẩm tai nghe không dây mới nhất, thiết kế tối giản, chống ồn chủ động, phù hợp cho người tập thể thao và dân văn phòng.",
                                "Hành trình khởi nghiệp từ hai bàn tay trắng của một chàng trai trẻ đam mê công nghệ, vượt qua nhiều khó khăn để thành lập công ty AI."
                            ];
                            setText(suggestions[Math.floor(Math.random() * suggestions.length)]);
                        }}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors h-auto py-1 px-2"
                    >
                        🎲 Gợi ý ngẫu nhiên
                    </Button>
                </div>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[11px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all shadow-inner leading-relaxed custom-scrollbar"
                    placeholder="Dán nội dung gốc chất lượng cao vào đây: Bài Blog, Transcript Video, Tài liệu Brand Guideline, hoặc Ý tưởng chi tiết..."
                />
            </div>

            {/* Vibe Confirmation */}
            <div className="p-3 bg-black/20 border border-zinc-800 rounded-xl flex items-center justify-between">
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Active Brand Tone:</span>
                <span className={`text-[9px] font-bold truncate max-w-[140px] ${currentVibe ? 'text-indigo-400' : 'text-red-400'}`}>
                    {currentVibe || "Missing (See Brand DNA above)"}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Platform</label>
                    <select 
                        value={platform} 
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-[10px] text-white focus:ring-indigo-500 outline-none"
                    >
                        <option value="TikTok">TikTok (9:16)</option>
                        <option value="Reels">Reels (9:16)</option>
                        <option value="Shorts">Shorts (9:16)</option>
                        <option value="YouTube">YouTube (16:9)</option>
                    </select>
                </div>
                <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Duration</label>
                    <select 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-[10px] text-white focus:ring-indigo-500 outline-none"
                    >
                        <option value="10s">10 Seconds</option>
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
