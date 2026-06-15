
import React from 'react';
import { Button } from '../../../components/ui/Button';

interface MarketingInputsProps {
  config: any;
  selectedFormats: string[];
  toggleFormat: (fmt: string) => void;
  selectedTechniques: string[];
  toggleTechnique: (tech: string) => void;
}

const MarketingInputs: React.FC<MarketingInputsProps> = ({
  config,
  selectedFormats,
  toggleFormat,
  selectedTechniques,
  toggleTechnique
}) => {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-2">
       {/* Format */}
       {config.formatOptions && (
         <div>
            <label className="text-[9px] font-bold text-pink-500 uppercase block mb-2">Định dạng hiển thị (Tùy chọn)</label>
            <div className="grid grid-cols-2 gap-2">
                {config.formatOptions.map((opt: any) => (
                  <Button
                      key={opt.label}
                      variant="outline"
                      onClick={() => toggleFormat(opt.label)}
                      className={`p-2 rounded-xl border text-left transition-all group h-auto flex-col items-start ${
                        selectedFormats.includes(opt.label) 
                        ? 'bg-pink-600/20 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'
                      }`}
                  >
                      <div className={`text-[9px] font-bold uppercase mb-0.5 ${selectedFormats.includes(opt.label) ? 'text-pink-400' : 'text-zinc-300'}`}>
                        {opt.label}
                      </div>
                      <div className="text-[8px] text-zinc-500 leading-tight whitespace-normal">
                        {opt.desc}
                      </div>
                  </Button>
                ))}
            </div>
         </div>
       )}

       {/* Advanced Techniques */}
       {config.techniqueOptions && (
         <div>
            <label className="text-[9px] font-bold text-blue-500 uppercase block mb-2">Kỹ thuật Thị giác & Tâm lý học (New)</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {config.techniqueOptions.map((opt: any) => (
                  <Button
                      key={opt.label}
                      variant="outline"
                      onClick={() => toggleTechnique(opt.label)}
                      className={`p-2 rounded-xl border text-left transition-all group h-auto flex-col items-start ${
                        selectedTechniques.includes(opt.label) 
                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800'
                      }`}
                  >
                      <div className="flex justify-between items-start mb-0.5 w-full">
                         <span className={`text-[9px] font-bold uppercase ${selectedTechniques.includes(opt.label) ? 'text-blue-400' : 'text-zinc-300'}`}>
                           {opt.label}
                         </span>
                         <span className="text-[7px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">{opt.group}</span>
                      </div>
                      <div className="text-[8px] text-zinc-500 leading-tight whitespace-normal">
                        {opt.desc}
                      </div>
                  </Button>
                ))}
            </div>
         </div>
       )}
    </div>
  );
};

export default MarketingInputs;
