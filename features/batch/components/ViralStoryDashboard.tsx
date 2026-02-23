
import React, { useState } from 'react';
import { BatchJob } from '../../../types';

interface ViralStoryDashboardProps {
  job: BatchJob;
  onGenerateVideo?: (job: BatchJob) => void;
  onSelectHook?: (job: BatchJob, hookId: string) => void;
  onDeselectHook?: (job: BatchJob) => void;
  onGenerateQuoteImage?: (job: BatchJob, index: number) => void; // New Prop
  isRendering: boolean;
}

const ViralStoryDashboard: React.FC<ViralStoryDashboardProps> = ({ job, onGenerateVideo, onSelectHook, onDeselectHook, onGenerateQuoteImage, isRendering }) => {
  const [activeTab, setActiveTab] = useState<'video' | 'social' | 'quotes' | 'lab'>('video');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!job.viralPlan) return null;

  const handleCopy = (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render Tabs
  const renderTabs = () => (
      <div className="flex justify-center mb-6 sticky top-0 z-20 bg-[#0a0f1d]/90 backdrop-blur-md py-4 -mt-6">
          <div className="bg-slate-900/50 p-1 rounded-xl flex gap-1 border border-slate-800 shadow-xl">
              <button 
                  onClick={() => setActiveTab('video')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
              >
                  {(job.viralPlan?.hookVariants || []).length} Scripts
              </button>
              <button 
                  onClick={() => setActiveTab('social')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'social' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
              >
                  {(job.viralPlan?.socialPosts || []).length} Posts
              </button>
              <button 
                  onClick={() => setActiveTab('quotes')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-pink-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
              >
                  {(job.viralPlan?.instagramQuotes || []).length} Quotes
              </button>
              <button 
                  onClick={() => setActiveTab('lab')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'lab' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}
              >
                  Viral Lab
              </button>
          </div>
      </div>
  );

  // VIDEO TAB
  const renderVideoTab = () => {
      // STATE A: HOOK SELECTION
      if (!job.viralPlan?.selectedHookId) {
          return (
              <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                  <div className="text-center space-y-3 mb-6">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Omnichannel Scripts</h3>
                      <p className="text-[10px] text-slate-400 max-w-lg mx-auto">AI has extracted {(job.viralPlan?.hookVariants || []).length} high-potential hooks from your root content.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {(job.viralPlan?.hookVariants || []).map((hook) => (
                          <div 
                            key={hook.id}
                            onClick={() => onSelectHook && onSelectHook(job, hook.id)}
                            className="group relative bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-2xl flex flex-col h-full"
                          >
                              {/* Keyframe Preview */}
                              <div className="aspect-[9/16] w-full bg-slate-800 relative flex-shrink-0">
                                  {hook.keyframeImage ? (
                                      <img src={hook.keyframeImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={hook.title} />
                                  ) : job.status === 'completed' ? (
                                      // Fallback UI if generation failed but job is complete
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-800/50">
                                          <div className="text-2xl opacity-50">🖼️</div>
                                          <span className="text-[10px] font-bold text-slate-500">Visual Gen Failed</span>
                                          <span className="text-[8px] text-slate-600 px-4 text-center">Using placeholder</span>
                                      </div>
                                  ) : (
                                      // Loading State
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                          <span className="text-[10px] font-bold text-slate-500 animate-pulse">Visualizing...</span>
                                      </div>
                                  )}
                                  
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                                  
                                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                                      <span className="px-2 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">
                                          {hook.pattern}
                                      </span>
                                      <h4 className="text-lg font-black text-white leading-tight line-clamp-2">{hook.title}</h4>
                                  </div>
                              </div>
                              
                              <div className="p-6 pt-0 flex-1 flex flex-col">
                                  <p className="text-[10px] text-slate-400 italic line-clamp-4 flex-1">"{hook.script}"</p>
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                      Select Strategy
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }

      // STATE B: TIMELINE & FINAL RENDER
      const selectedHook = job.viralPlan.hookVariants?.find(h => h.id === job.viralPlan?.selectedHookId);

      return (
        <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500 pb-20">
            {/* VIDEO PREVIEW (IF RENDERED) */}
            {job.videoUrl && (
                <div className="bg-slate-950 rounded-[3rem] p-8 border border-slate-800 shadow-3xl flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Final Neural Render</h3>
                    </div>
                    <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] border-4 border-slate-900">
                        <video src={job.videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-8 flex gap-4">
                        <a 
                            href={job.videoUrl} 
                            download={`viral_story_${job.id}.mp4`}
                            className="px-10 py-4 bg-white text-slate-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-2"
                        >
                            Download Full 4K
                        </a>
                    </div>
                </div>
            )}

            {/* HEADER SECTION */}
            <div className="flex items-center gap-8 p-8 bg-indigo-900/10 rounded-[3rem] border border-indigo-500/20 group/header relative">
                 <div className="w-24 h-40 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-2xl flex-shrink-0 bg-black">
                     {selectedHook?.keyframeImage ? (
                        <img src={selectedHook?.keyframeImage} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-500 text-2xl">🎬</div>
                     )}
                 </div>
                 <div className="space-y-2">
                     <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Selected Strategy</span>
                         <div className="w-1 h-1 rounded-full bg-indigo-500"></div>
                         <span className="text-[10px] text-white opacity-60">{selectedHook?.pattern}</span>
                         
                         {/* CHANGE BUTTON */}
                         {!job.videoUrl && !isRendering && (
                             <button 
                                onClick={() => onDeselectHook && onDeselectHook(job)}
                                className="ml-2 px-3 py-1 rounded-lg border border-indigo-500/30 text-[9px] font-bold text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover/header:opacity-100"
                             >
                                Change
                             </button>
                         )}
                     </div>
                     <h2 className="text-3xl font-black text-white uppercase">{selectedHook?.title}</h2>
                     <p className="text-sm text-slate-400 italic max-w-xl">"{selectedHook?.script}"</p>
                 </div>
            </div>

            {/* TIMELINE LIST */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Production Timeline</h3>
                {(job.viralPlan.shots || []).map((shot, idx) => (
                    <div key={idx} className="flex gap-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl group hover:border-indigo-500/40 transition-all items-start">
                        
                        {/* Visual Thumbnail Column */}
                        <div className="w-28 h-20 rounded-2xl overflow-hidden bg-black/40 border border-slate-700 flex-shrink-0 relative">
                            {shot.keyframeImage ? (
                                <img src={shot.keyframeImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <span className="text-lg opacity-20">🎞️</span>
                                    <span className="text-[8px] font-mono text-slate-600 mt-1">Shot {idx + 1}</span>
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[8px] font-mono text-white">
                                {shot.duration}s
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${shot.role === 'Hook' ? 'bg-red-600 text-white' : shot.role === 'Ending' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    {shot.role}
                                </span>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">{shot.viral_tech}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Visual Prompt</span>
                                    <p className="text-[10px] text-white leading-relaxed line-clamp-3">{shot.visual_prompt}</p>
                                </div>
                                <div className="border-l border-slate-800 pl-4 border-dashed">
                                    <span className="text-[8px] font-black text-orange-500 uppercase block mb-1">Audio Script</span>
                                    <p className="text-[10px] text-slate-400 italic leading-relaxed">"{shot.audio_script}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* RENDER BUTTON - COST CONTROL LOCK */}
            {!job.videoUrl && (
                <div className="sticky bottom-6 flex flex-col items-center justify-center pb-8 pt-4 z-30">
                    <button 
                        onClick={() => !isRendering && onGenerateVideo && onGenerateVideo(job)}
                        disabled={isRendering}
                        className={`group px-12 py-5 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 transition-all ${
                          isRendering 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80 border border-slate-700' 
                            : 'bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-[length:200%_auto] hover:bg-right text-white shadow-[0_20px_50px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95'
                        }`}
                    >
                        {isRendering ? (
                            <>
                                <div className="w-5 h-5 border-3 border-slate-600 border-t-white rounded-full animate-spin"></div>
                                <span className="animate-pulse">{job.progressMessage || "Rendering Neural Video..."}</span>
                            </>
                        ) : (
                            <>
                                <span>Render Video (Veo 3)</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
      );
  };

  // SOCIAL TAB
  const renderSocialTab = () => (
      <div className="space-y-6 animate-in slide-in-from-right-6 pb-20">
          {(job.viralPlan?.socialPosts || []).map((post, i) => (
              <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="text-4xl">
                          {post.platform === 'Facebook' ? '📘' : post.platform === 'LinkedIn' ? '💼' : '🐦'}
                      </span>
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase rounded-lg">
                          {post.platform}
                      </span>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>
                  <div className="flex flex-wrap gap-2">
                      {(post.hashtags || []).map((tag, t) => (
                          <span key={t} className="text-[10px] text-blue-400 font-bold">{tag}</span>
                      ))}
                  </div>
                  <button 
                    onClick={() => handleCopy(post.content, i)} 
                    className={`mt-4 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                        copiedIndex === i ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                      {copiedIndex === i ? '✓ Copied!' : 'Copy Content'}
                  </button>
              </div>
          ))}
          {(!job.viralPlan?.socialPosts || job.viralPlan.socialPosts.length === 0) && (
              <div className="text-center text-slate-500 p-10">No social posts generated.</div>
          )}
      </div>
  );

  // QUOTES TAB
  const renderQuotesTab = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 animate-in slide-in-from-right-6 pb-20">
          {(job.viralPlan?.instagramQuotes || []).map((quote, i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative group hover:border-pink-500/50 transition-all overflow-hidden">
                  
                  {quote.imageUrl ? (
                      <>
                        <img src={quote.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Quote Visual" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-sm z-20">
                             <button 
                                onClick={() => onGenerateQuoteImage && onGenerateQuoteImage(job, i)}
                                className="px-3 py-1.5 bg-white text-purple-900 rounded-lg text-[8px] font-black uppercase shadow-lg hover:scale-105"
                             >
                                Regenerate
                             </button>
                             <a 
                                href={quote.imageUrl} 
                                download={`Quote_${i}.png`} 
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[8px] font-black uppercase shadow-lg hover:scale-105"
                             >
                                Save
                             </a>
                        </div>
                      </>
                  ) : (
                      <>
                        <p className="text-sm font-serif italic text-white mb-4 relative z-10 line-clamp-4">"{quote.text}"</p>
                        <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest relative z-10">
                            Style: {quote.style}
                        </span>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-20">
                            <button 
                                onClick={() => onGenerateQuoteImage && onGenerateQuoteImage(job, i)}
                                className="px-4 py-2 bg-white text-purple-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                                Generate Image
                            </button>
                        </div>
                      </>
                  )}
              </div>
          ))}
      </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-8">
        {renderTabs()}
        {activeTab === 'video' && renderVideoTab()}
        {activeTab === 'social' && renderSocialTab()}
        {activeTab === 'quotes' && renderQuotesTab()}
        {activeTab === 'lab' && <ViralLab />}
    </div>
  );
};

// --- VIRAL LAB COMPONENT ---
const ViralLab = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const runAnalysis = async (promptType: string) => {
        if (!input) return;
        setIsLoading(true);
        setActiveTool(promptType);
        setResult('');
        
        try {
            const { getAI } = await import('../../../lib/gemini');
            const ai = getAI();
            
            let prompt = '';
            let useSearch = false;

            switch (promptType) {
                case 'analyze_competitor':
                    prompt = `Hãy đóng vai chuyên gia sáng tạo nội dung, phân tích video này về: 3 giây đầu (Hook), nhịp dựng, cách sắp xếp âm thanh và lý do tại sao người xem lại bình luận nhiều đến vậy. Link/Data: ${input}`;
                    useSearch = true;
                    break;
                case 'extract_script':
                    prompt = `Viết lại toàn bộ lời thoại và mô tả từng phân cảnh (scene-by-scene) của video này để tôi học tập cấu trúc. Link/Data: ${input}`;
                    useSearch = true;
                    break;
                case 'optimize_hook':
                    prompt = `Viết 5 tiêu đề và 5 câu thoại mở đầu ấn tượng cho chủ đề sau để giữ chân người xem ngay lập tức: ${input}`;
                    break;
                case 'suggest_pacing':
                    prompt = `Với các đoạn footage thô sau đây, hãy sắp xếp thứ tự và chỉ ra những điểm cần cắt tỉa để video có nhịp điệu nhanh, cuốn hút theo phong cách TikTok/Reels: ${input}`;
                    break;
                case 'evaluate_edit':
                    prompt = `Hãy đánh giá bản dựng video này dưới góc độ chuyên gia. Nhận xét về độ mượt, màu sắc và âm thanh. Chỗ nào cần chỉnh để tăng tỷ lệ giữ chân người xem (retention rate)? Data/Link: ${input}`;
                    useSearch = true;
                    break;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: prompt,
                config: {
                    tools: useSearch ? [{ googleSearch: {} }] : []
                }
            });

            setResult(response.text || 'Không có kết quả.');
        } catch (error: any) {
            console.error(error);
            setResult(`Lỗi: ${error.message}`);
        } finally {
            setIsLoading(false);
            setActiveTool(null);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-6 pb-20 max-w-5xl mx-auto">
            <div className="text-center space-y-3 mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Viral Lab & Post-Production</h3>
                <p className="text-[10px] text-slate-400 max-w-lg mx-auto">Phân tích "Mã Gen" video lan truyền và tối ưu hóa hậu kỳ với chuyên gia AI.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập Link Video TikTok/Facebook, chủ đề, hoặc mô tả footage thô..."
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none custom-scrollbar"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phân tích Mã Gen */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            1. Phân tích "Mã Gen" (Dùng Google Search)
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            <button 
                                onClick={() => runAnalysis('analyze_competitor')}
                                disabled={isLoading}
                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all border border-slate-700 hover:border-emerald-500/50 group"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-emerald-400">Phân tích Video đối thủ</div>
                                <div className="text-[9px] text-slate-400">Phân tích Hook, nhịp dựng, âm thanh và lý do viral.</div>
                            </button>
                            <button 
                                onClick={() => runAnalysis('extract_script')}
                                disabled={isLoading}
                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all border border-slate-700 hover:border-emerald-500/50 group"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-emerald-400">Trích xuất kịch bản</div>
                                <div className="text-[9px] text-slate-400">Viết lại lời thoại và mô tả từng phân cảnh (scene-by-scene).</div>
                            </button>
                        </div>
                    </div>

                    {/* Chuyên gia Hậu kỳ */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            2. Chuyên gia Hậu kỳ
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            <button 
                                onClick={() => runAnalysis('optimize_hook')}
                                disabled={isLoading}
                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all border border-slate-700 hover:border-blue-500/50 group"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400">Tối ưu Hook (3s đầu)</div>
                                <div className="text-[9px] text-slate-400">Viết 5 tiêu đề và 5 câu thoại mở đầu ấn tượng.</div>
                            </button>
                            <button 
                                onClick={() => runAnalysis('suggest_pacing')}
                                disabled={isLoading}
                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all border border-slate-700 hover:border-blue-500/50 group"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400">Đề xuất nhịp dựng (Pacing)</div>
                                <div className="text-[9px] text-slate-400">Sắp xếp footage thô để có nhịp điệu nhanh, cuốn hút.</div>
                            </button>
                            <button 
                                onClick={() => runAnalysis('evaluate_edit')}
                                disabled={isLoading}
                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all border border-slate-700 hover:border-blue-500/50 group"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400">Đánh giá bản dựng</div>
                                <div className="text-[9px] text-slate-400">Nhận xét độ mượt, màu sắc, âm thanh để tăng retention rate.</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result Area */}
            {(isLoading || result) && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <span className="text-emerald-500">✨</span>
                        )}
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">
                            {isLoading ? 'Đang phân tích...' : 'Kết quả phân tích'}
                        </h4>
                    </div>
                    
                    <div className="prose prose-invert prose-sm max-w-none">
                        {isLoading ? (
                            <div className="space-y-2 animate-pulse">
                                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-800 rounded w-full"></div>
                                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                                {result}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViralStoryDashboard;
