import React, { useState } from 'react';
import { BatchJob } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface OmniSliderScriptReviewProps {
    job: BatchJob;
    onRender: (jobId: string, approvedSlides: any[]) => void;
}

const OmniSliderScriptReview: React.FC<OmniSliderScriptReviewProps> = ({ job, onRender }) => {
    const initialSlides = job.omniLoraInputs?.sliderScript || [];
    const [slides, setSlides] = useState<any[]>(initialSlides);

    const handleTextChange = (index: number, value: string) => {
        const newSlides = [...slides];
        newSlides[index].text_content = value;
        setSlides(newSlides);
    };

    const handlePromptChange = (index: number, value: string) => {
        const newSlides = [...slides];
        newSlides[index].visual_prompt = value;
        setSlides(newSlides);
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#0a0f1d] text-white p-6 overflow-hidden animate-in fade-in">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-black tracking-tight">Review Slider Script</h2>
                    <p className="text-zinc-400 text-sm mt-1">Edit the text and visual prompts before rendering the final images.</p>
                </div>
                <Button 
                    onClick={() => onRender(job.id, slides)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold tracking-widest uppercase text-xs transition-all shadow-lg shadow-blue-900/20"
                >
                    Render Slider
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                {slides.map((slide, index) => (
                    <div key={index} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-blue-400">Slide {index + 1}</h3>
                            <span className="text-xs text-zinc-500 font-mono">Thought: {slide.thought_process}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Text Content (Shown on slide)</label>
                                <textarea 
                                    value={slide.text_content}
                                    onChange={(e) => handleTextChange(index, e.target.value)}
                                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Visual Prompt (For AI Image Gen)</label>
                                <textarea 
                                    value={slide.visual_prompt}
                                    onChange={(e) => handlePromptChange(index, e.target.value)}
                                    className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OmniSliderScriptReview;
