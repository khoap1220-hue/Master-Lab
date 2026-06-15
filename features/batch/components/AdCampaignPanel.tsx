
import React, { useState } from 'react';
import { generateCampaignBatch } from '../logic/agents/adStrategist';
import { Button } from '../../../components/ui/Button';

interface AdCampaignPanelProps {
  text: string;
  setText: (v: string) => void;
  brandVibe: string;
}

const AdCampaignPanel: React.FC<AdCampaignPanelProps> = ({
  text, setText, brandVibe
}) => {
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [campaignCount, setCampaignCount] = useState(5);

  const handleAutoGenerate = async () => {
    setIsAutoGenerating(true);
    try {
        const campaigns = await generateCampaignBatch(text, brandVibe, campaignCount);
        // Append to existing text or replace? Let's replace for clean slate, or append if user wants.
        // Joining with newlines
        const formattedBlock = campaigns.join('\n');
        setText(formattedBlock);
    } catch (e) {
        console.error("Auto-gen failed", e);
    } finally {
        setIsAutoGenerating(false);
    }
  };

  return (
    <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 space-y-5 animate-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/20">📢</div>
           <div>
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Ad Campaign Manager</h3>
               <p className="text-[9px] text-zinc-500 font-medium">Multi-Channel Generator</p>
           </div>
        </div>

        <div className="space-y-4">
            {/* Automation Controls */}
            <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-violet-300 uppercase">Auto-Strategy</label>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-violet-400 font-bold">{campaignCount} Campaigns</span>
                        <input 
                            type="range" min="3" max="10" step="1" 
                            value={campaignCount}
                            onChange={(e) => setCampaignCount(parseInt(e.target.value))}
                            className="w-16 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                    </div>
                </div>
                
                <Button
                    onClick={handleAutoGenerate}
                    disabled={isAutoGenerating}
                    className={`w-full py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        isAutoGenerating 
                        ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg hover:shadow-violet-500/25'
                    }`}
                >
                    {isAutoGenerating ? (
                        <>
                            <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>Brainstorming...</span>
                        </>
                    ) : (
                        <>
                            <span>✨ Generate {campaignCount} Concepts</span>
                        </>
                    )}
                </Button>
                <p className="text-[8px] text-zinc-500 italic text-center">
                    *AI sẽ tạo danh sách chiến dịch dựa trên Brand Vibe của bạn.
                </p>
            </div>

            {/* Manual Editor */}
            <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Campaign Queue (Editable)</label>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[10px] text-white placeholder-zinc-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none transition-all shadow-inner leading-relaxed whitespace-pre font-mono custom-scrollbar"
                    placeholder={`Summer Sale | Thời trang biển | 4:5\nBack To School | Laptop giảm giá | 16:9`}
                />
            </div>
            
            <div className="flex items-center gap-2 text-[8px] text-zinc-500 bg-black/20 p-2 rounded-lg">
                <span className="font-bold text-violet-400">Format:</span> 
                <span>Headline | Visual Context | Ratio</span>
            </div>
        </div>
    </div>
  );
};

export default AdCampaignPanel;
