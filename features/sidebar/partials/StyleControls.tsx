
import React from 'react';

interface StyleControlsProps {
  injectors: string[];
  selectedInjectors: string[];
  toggleInjector: (tag: string) => void;
  creativeDrift: number;
  onDriftChange: (val: number) => void;
  batchSize: number;
  setBatchSize: (val: number) => void;
  // Added 'campaign' and 'master_board' to designMode type to match AutomationForm state
  designMode: 'new' | 'variant' | 'vector' | 'bible' | 'campaign' | 'master_board';
  categoryLabel: string;
  configScaleLabel: string;
}

const StyleControls: React.FC<StyleControlsProps> = ({
  injectors,
  selectedInjectors,
  toggleInjector,
  creativeDrift,
  onDriftChange,
  batchSize,
  setBatchSize,
  designMode,
  categoryLabel,
  configScaleLabel
}) => {
  return (
    <>
      <div>
         <div className="flex items-center gap-2 mb-2 group relative w-fit">
            <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2 cursor-help">
                Bộ tiêm Neural (Style Injectors)
                <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </label>
            {/* TOOLTIP */}
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-[9px] text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
               Thêm các phong cách nghệ thuật hoặc kỹ thuật cụ thể vào thiết kế (VD: Ánh sáng neon, Chất liệu gỗ).
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Tùy chọn</span>
         </div>
         
         <div className="flex flex-wrap gap-2">
            {injectors.map(tag => (
               <button 
                 key={tag} 
                 onClick={() => toggleInjector(tag)}
                 className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all ${
                   selectedInjectors.includes(tag) 
                     ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                     : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                 }`}
               >
                 {tag}
               </button>
            ))}
         </div>
      </div>

      {/* Slider Bars: Creativity & Batch Size */}
      <div className="space-y-4">
         <div>
           <div className="flex items-center justify-between mb-2">
              <div className="group relative flex items-center gap-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase cursor-help border-b border-dashed border-slate-700">Mức độ sáng tạo (Creative Drift)</label>
                  {/* TOOLTIP */}
                  <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-slate-800 text-[9px] text-slate-300 rounded-lg border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                     Điều chỉnh độ "bay bổng" của AI.
                     <br/>• <b>1-3:</b> Bám sát thực tế, ít thay đổi.
                     <br/>• <b>4-7:</b> Cân bằng (Khuyên dùng).
                     <br/>• <b>8-10:</b> Sáng tạo đột phá, có thể ảo giác.
                  </div>
              </div>
              <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20">{creativeDrift}/10</span>
           </div>
           <div className="relative h-4 flex items-center">
             <input 
                type="range" min="1" max="10" step="1" value={creativeDrift}
                onChange={(e) => onDriftChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-600 hover:accent-orange-500 z-20 relative"
             />
              <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10">
                {[...Array(10)].map((_, i) => <div key={i} className={`w-0.5 h-1.5 rounded-full ${i+1 <= creativeDrift ? 'bg-orange-600/50' : 'bg-slate-800'}`}></div>)}
             </div>
           </div>
         </div>

         <div>
           <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase">
                 {designMode === 'variant' ? 'Quy mô bản phối' : 
                  categoryLabel === 'Branding' ? 'Số lượng concept/hạng mục' : configScaleLabel}
              </label>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">{batchSize} Concept</span>
           </div>
           <div className="relative h-4 flex items-center">
             <input 
                type="range" min="1" max="10" step="1" value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 z-20 relative"
             />
             <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-10">
                {[...Array(10)].map((_, i) => <div key={i} className={`w-0.5 h-1.5 rounded-full ${i+1 <= batchSize ? 'bg-blue-600/50' : 'bg-slate-800'}`}></div>)}
             </div>
           </div>
         </div>
      </div>
    </>
  );
};

export default StyleControls;
