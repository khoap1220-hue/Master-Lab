
import React, { useState } from 'react';
import { BatchJob } from '../../../types';
import { MODELS } from '../../../config/models';
import { Button } from '../../../components/ui/Button';

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
          <div className="bg-zinc-900/50 p-1 rounded-xl flex gap-1 border border-zinc-800 shadow-xl">
              <Button 
                  variant="ghost"
                  onClick={() => setActiveTab('video')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-auto ${activeTab === 'video' ? 'bg-indigo-600 text-white shadow hover:bg-indigo-700' : 'text-zinc-500 hover:text-white'}`}
              >
                  {(job.viralPlan?.hookVariants || []).length} Scripts
              </Button>
              <Button 
                  variant="ghost"
                  onClick={() => setActiveTab('social')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-auto ${activeTab === 'social' ? 'bg-blue-600 text-white shadow hover:bg-blue-700' : 'text-zinc-500 hover:text-white'}`}
              >
                  {(job.viralPlan?.socialPosts || []).length} Posts
              </Button>
              <Button 
                  variant="ghost"
                  onClick={() => setActiveTab('quotes')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-auto ${activeTab === 'quotes' ? 'bg-pink-600 text-white shadow hover:bg-pink-700' : 'text-zinc-500 hover:text-white'}`}
              >
                  {(job.viralPlan?.instagramQuotes || []).length} Quotes
              </Button>
              <Button 
                  variant="ghost"
                  onClick={() => setActiveTab('lab')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all h-auto ${activeTab === 'lab' ? 'bg-emerald-600 text-white shadow hover:bg-emerald-700' : 'text-zinc-500 hover:text-white'}`}
              >
                  Viral Lab
              </Button>
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
                      <p className="text-[10px] text-zinc-400 max-w-lg mx-auto">AI has extracted {(job.viralPlan?.hookVariants || []).length} high-potential hooks from your root content.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                      {(job.viralPlan?.hookVariants || []).map((hook) => (
                          <div 
                            key={hook.id}
                            onClick={() => onSelectHook && onSelectHook(job, hook.id)}
                            className="group relative bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden cursor-pointer hover:border-indigo-500 hover:scale-[1.02] transition-all duration-500 shadow-2xl flex flex-col h-full"
                          >
                              {/* Keyframe Preview */}
                              <div className="aspect-[9/16] w-full bg-zinc-800 relative flex-shrink-0">
                                  {hook.keyframeImage ? (
                                      <img src={hook.keyframeImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={hook.title} />
                                  ) : job.status === 'completed' ? (
                                      // Fallback UI if generation failed but job is complete
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-zinc-800/50">
                                          <div className="text-2xl opacity-50">🖼️</div>
                                          <span className="text-[10px] font-bold text-zinc-500">Visual Gen Failed</span>
                                          <span className="text-[8px] text-zinc-600 px-4 text-center">Using placeholder</span>
                                      </div>
                                  ) : (
                                      // Loading State
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                          <span className="text-[10px] font-bold text-zinc-500 animate-pulse">Visualizing...</span>
                                      </div>
                                  )}
                                  
                                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                                  
                                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                                      <span className="px-2 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">
                                          {hook.pattern}
                                      </span>
                                      <h4 className="text-lg font-black text-white leading-tight line-clamp-2">{hook.title}</h4>
                                  </div>
                              </div>
                              
                              <div className="p-6 pt-0 flex-1 flex flex-col">
                                  <p className="text-[10px] text-zinc-400 italic line-clamp-4 flex-1">"{hook.script}"</p>
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                  <Button variant="secondary" className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                      Select Strategy
                                  </Button>
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
                <div className="bg-zinc-950 rounded-[3rem] p-8 border border-zinc-800 shadow-3xl flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Final Neural Render</h3>
                    </div>
                    <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] border-4 border-zinc-900">
                        <video src={job.videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-8 flex gap-4">
                        <a 
                            href={job.videoUrl} 
                            download={`viral_story_${job.id}.mp4`}
                            className="px-10 py-4 bg-white text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-2"
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
                             <Button 
                                variant="ghost"
                                onClick={() => onDeselectHook && onDeselectHook(job)}
                                className="ml-2 px-3 py-1 h-auto rounded-lg border border-indigo-500/30 text-[9px] font-bold text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover/header:opacity-100"
                             >
                                Change
                             </Button>
                         )}
                     </div>
                     <h2 className="text-3xl font-black text-white uppercase">{selectedHook?.title}</h2>
                     <p className="text-sm text-zinc-400 italic max-w-xl">"{selectedHook?.script}"</p>
                 </div>
            </div>

            {/* TIMELINE LIST */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">Production Timeline</h3>
                {(job.viralPlan.shots || []).map((shot, idx) => (
                    <div key={idx} className="flex gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl group hover:border-indigo-500/40 transition-all items-start">
                        
                        {/* Visual Thumbnail Column */}
                        <div className="w-28 h-20 rounded-2xl overflow-hidden bg-black/40 border border-zinc-700 flex-shrink-0 relative">
                            {shot.keyframeImage ? (
                                <img src={shot.keyframeImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <span className="text-lg opacity-20">🎞️</span>
                                    <span className="text-[8px] font-mono text-zinc-600 mt-1">Shot {idx + 1}</span>
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[8px] font-mono text-white">
                                {shot.duration}s
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${shot.role === 'Hook' ? 'bg-red-600 text-white' : shot.role === 'Ending' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                    {shot.role}
                                </span>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">{shot.viral_tech}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="text-[8px] font-black text-zinc-500 uppercase block mb-1">Visual Prompt</span>
                                    <p className="text-[10px] text-white leading-relaxed line-clamp-3">{shot.visual_prompt}</p>
                                </div>
                                <div className="border-l border-zinc-800 pl-4 border-dashed">
                                    <span className="text-[8px] font-black text-orange-500 uppercase block mb-1">Audio Script</span>
                                    <p className="text-[10px] text-zinc-400 italic leading-relaxed">"{shot.audio_script}"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* RENDER BUTTON - COST CONTROL LOCK */}
            {!job.videoUrl && (
                <div className="sticky bottom-6 flex flex-col items-center justify-center pb-8 pt-4 z-30">
                    <Button 
                        onClick={() => !isRendering && onGenerateVideo && onGenerateVideo(job)}
                        disabled={isRendering}
                        isLoading={isRendering}
                        className={`group px-12 py-5 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.2em] flex items-center gap-4 transition-all ${
                          isRendering 
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-80 border border-zinc-700' 
                            : 'bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-[length:200%_auto] hover:bg-right text-white shadow-[0_20px_50px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95'
                        }`}
                    >
                        {!isRendering && (
                            <>
                                <span>Render Video (Veo 3)</span>
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
      );
  };

  // SOCIAL TAB
  const renderSocialTab = () => (
      <div className="space-y-6 animate-in slide-in-from-right-6 pb-20">
          {(job.viralPlan?.socialPosts || []).map((post, i) => (
              <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
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
                  <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>
                  <div className="flex flex-wrap gap-2">
                      {(post.hashtags || []).map((tag, t) => (
                          <span key={t} className="text-[10px] text-blue-400 font-bold">{tag}</span>
                      ))}
                  </div>
                  <Button 
                    variant={copiedIndex === i ? 'primary' : 'secondary'}
                    onClick={() => handleCopy(post.content, i)} 
                    className={`mt-4 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                        copiedIndex === i ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                      {copiedIndex === i ? '✓ Copied!' : 'Copy Content'}
                  </Button>
              </div>
          ))}
          {(!job.viralPlan?.socialPosts || job.viralPlan.socialPosts.length === 0) && (
              <div className="text-center text-zinc-500 p-10">No social posts generated.</div>
          )}
      </div>
  );

  // QUOTES TAB
  const renderQuotesTab = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 animate-in slide-in-from-right-6 pb-20">
          {(job.viralPlan?.instagramQuotes || []).map((quote, i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-purple-900/40 to-zinc-900 border border-purple-500/20 rounded-3xl p-8 flex flex-col justify-center items-center text-center relative group hover:border-pink-500/50 transition-all overflow-hidden">
                  
                  {quote.imageUrl ? (
                      <>
                        <img src={quote.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Quote Visual" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-sm z-20">
                             <Button 
                                variant="secondary"
                                onClick={() => onGenerateQuoteImage && onGenerateQuoteImage(job, i)}
                                className="px-3 py-1.5 bg-white text-purple-900 rounded-lg text-[8px] font-black uppercase shadow-lg hover:scale-105"
                             >
                                Regenerate
                             </Button>
                             <a 
                                href={quote.imageUrl} 
                                download={`Quote_${i}.png`} 
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[8px] font-black uppercase shadow-lg hover:scale-105 inline-flex items-center justify-center"
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
                            <Button 
                                variant="secondary"
                                onClick={() => onGenerateQuoteImage && onGenerateQuoteImage(job, i)}
                                className="px-4 py-2 bg-white text-purple-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                                Generate Image
                            </Button>
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
    const [, setActiveTool] = useState<string | null>(null);

    const runAnalysis = async (promptType: string) => {
        if (!input) return;
        setIsLoading(true);
        setActiveTool(promptType);
        setResult('');
        
        try {
            const { getAI, callWithRetry } = await import('../../../lib/gemini');
            const ai = getAI();
            
            let prompt = '';
            let useSearch = false;

            switch (promptType) {
                case 'analyze_competitor':
                    prompt = `[SYSTEM ROLE: ELITE VIRAL CONTENT ANALYST]
Hãy phân tích chuyên sâu video lan truyền này để giải mã "Mã Gen Viral" của nó.
Tập trung vào các yếu tố cốt lõi sau:
1. HOOK (3 giây đầu): Kỹ thuật nào được sử dụng để giữ chân người xem ngay lập tức? (Hình ảnh, âm thanh, text, hành động).
2. NHỊP DỰNG (Pacing): Tốc độ cắt cảnh, sự thay đổi góc máy và cách duy trì sự chú ý (Retention).
3. ÂM THANH (Sound Design): Cách sử dụng nhạc nền, hiệu ứng âm thanh (SFX) và giọng đọc (Voiceover) để tạo cảm xúc.
4. TƯƠNG TÁC (Engagement): Lý do tâm lý nào khiến người xem bình luận, chia sẻ hoặc lưu video này nhiều đến vậy?
Link/Data: ${input}`;
                    useSearch = true;
                    break;
                case 'extract_script':
                    prompt = `[SYSTEM ROLE: MASTER STORYBOARD ARTIST]
Hãy trích xuất và viết lại toàn bộ kịch bản của video này dưới dạng Storyboard chi tiết (Scene-by-scene) để tôi học tập cấu trúc.
Yêu cầu định dạng:
- Phân cảnh (Cảnh 1, Cảnh 2... kèm thời gian ước tính)
- Lời thoại (Voiceover/Text on screen) chính xác
- Mô tả hình ảnh (Góc máy, hành động nhân vật, bối cảnh)
- Kỹ thuật chỉnh sửa (Hiệu ứng, chuyển cảnh đáng chú ý)
Link/Data: ${input}`;
                    useSearch = true;
                    break;
                case 'optimize_hook':
                    prompt = `[SYSTEM ROLE: VIRAL COPYWRITER EXPERT]
Hãy sáng tạo 5 tiêu đề (Text on screen) và 5 câu thoại mở đầu (Voiceover) cực kỳ ấn tượng cho chủ đề sau, nhằm mục đích tối đa hóa tỷ lệ giữ chân (Retention Rate) trong 3 giây đầu tiên trên TikTok/Reels.
Yêu cầu:
- Sử dụng các kỹ thuật: Gây tò mò, Đi ngược đám đông, Đánh vào nỗi đau, hoặc Lời hứa giá trị cao.
- Ngắn gọn, súc tích, đánh thẳng vào tâm lý người xem.
Chủ đề/Dữ liệu: ${input}`;
                    break;
                case 'suggest_pacing':
                    prompt = `[SYSTEM ROLE: SENIOR VIDEO EDITOR]
Dựa trên các đoạn footage thô hoặc mô tả sau đây, hãy đề xuất một kịch bản dựng phim (Editing Pacing) theo phong cách nhịp điệu nhanh, cuốn hút của TikTok/Reels/Shorts.
Yêu cầu:
- Sắp xếp thứ tự các đoạn footage sao cho logic và hấp dẫn nhất.
- Chỉ ra chính xác những điểm cần cắt tỉa (Cut on action, Jump cut).
- Đề xuất chèn B-roll, hiệu ứng âm thanh (SFX) hoặc Text ở những đoạn nào để tránh nhàm chán (Pattern Interrupt).
Dữ liệu footage: ${input}`;
                    break;
                case 'evaluate_edit':
                    prompt = `[SYSTEM ROLE: CHIEF CREATIVE OFFICER (CCO)]
Hãy đánh giá bản dựng video này dưới góc độ một chuyên gia sản xuất nội dung hàng đầu.
Tiêu chí đánh giá:
1. Độ mượt mà của luồng câu chuyện và các đoạn chuyển cảnh.
2. Màu sắc (Color Grading) và Thẩm mỹ thị giác (Visual Appeal).
3. Thiết kế âm thanh (Mix nhạc, SFX, độ rõ của Voiceover).
4. ĐIỂM CẢI THIỆN: Chỉ ra chính xác 3 điểm cần chỉnh sửa ngay lập tức để tăng tỷ lệ giữ chân người xem (Retention Rate) và khả năng lên xu hướng.
Data/Link: ${input}`;
                    useSearch = true;
                    break;
            }

            const response = await callWithRetry<any>(
                () => ai.models.generateContent({
                    model: MODELS.TEXT_PRIMARY,
                    contents: prompt,
                    config: {
                        tools: useSearch ? [{ googleSearch: {} }] : []
                    }
                }),
                2, 1000, MODELS.TEXT_PRIMARY,
                [] // Empty array for no fallbacks
            );

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
                <p className="text-[10px] text-zinc-400 max-w-lg mx-auto">Phân tích "Mã Gen" video lan truyền và tối ưu hóa hậu kỳ với chuyên gia AI.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập Link Video TikTok/Facebook, chủ đề, hoặc mô tả footage thô..."
                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none custom-scrollbar"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phân tích Mã Gen */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            1. Phân tích "Mã Gen" (Dùng Google Search)
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            <Button 
                                variant="ghost"
                                onClick={() => runAnalysis('analyze_competitor')}
                                disabled={isLoading}
                                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-all border border-zinc-700 hover:border-emerald-500/50 group h-auto flex flex-col items-start"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-emerald-400">Phân tích Video đối thủ</div>
                                <div className="text-[9px] text-zinc-400">Phân tích Hook, nhịp dựng, âm thanh và lý do viral.</div>
                            </Button>
                            <Button 
                                variant="ghost"
                                onClick={() => runAnalysis('extract_script')}
                                disabled={isLoading}
                                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-all border border-zinc-700 hover:border-emerald-500/50 group h-auto flex flex-col items-start"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-emerald-400">Trích xuất kịch bản</div>
                                <div className="text-[9px] text-zinc-400">Viết lại lời thoại và mô tả từng phân cảnh (scene-by-scene).</div>
                            </Button>
                        </div>
                    </div>

                    {/* Chuyên gia Hậu kỳ */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            2. Chuyên gia Hậu kỳ
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            <Button 
                                variant="ghost"
                                onClick={() => runAnalysis('optimize_hook')}
                                disabled={isLoading}
                                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-all border border-zinc-700 hover:border-blue-500/50 group h-auto flex flex-col items-start"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400">Tối ưu Hook (3s đầu)</div>
                                <div className="text-[9px] text-zinc-400">Viết 5 tiêu đề và 5 câu thoại mở đầu ấn tượng.</div>
                            </Button>
                            <Button 
                                variant="ghost"
                                onClick={() => runAnalysis('suggest_pacing')}
                                disabled={isLoading}
                                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-all border border-zinc-700 hover:border-blue-500/50 group h-auto flex flex-col items-start"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400">Đề xuất nhịp dựng (Pacing)</div>
                                <div className="text-[9px] text-zinc-400">Sắp xếp footage thô để có nhịp điệu nhanh, cuốn hút.</div>
                            </Button>
                            <Button 
                                variant="ghost"
                                onClick={() => runAnalysis('evaluate_edit')}
                                disabled={isLoading}
                                className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-left transition-all border border-zinc-700 hover:border-blue-500/50 group h-auto flex flex-col items-start"
                            >
                                <div className="text-xs font-bold text-white mb-1 group-hover:text-blue-400">Đánh giá bản dựng</div>
                                <div className="text-[9px] text-zinc-400">Nhận xét độ mượt, màu sắc, âm thanh để tăng retention rate.</div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result Area */}
            {(isLoading || result) && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800">
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
                                <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                                <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
                                <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">
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
