
import React from 'react';

interface BibleInputsProps {
  usagePurpose: string;
  setUsagePurpose: (val: string) => void;
  biblePageCount: number;
  setBiblePageCount: (val: number) => void;
}

const BibleInputs: React.FC<BibleInputsProps> = ({
  usagePurpose,
  setUsagePurpose,
  biblePageCount,
  setBiblePageCount
}) => {
  return (
    <div className="space-y-4 animate-in slide-in-from-top-2">
      {/* Usage Purpose */}
      <div>
        <label className="text-[9px] font-bold text-orange-500 uppercase block mb-2">Mục đích sử dụng (Context)</label>
        <textarea 
          value={usagePurpose}
          onChange={(e) => setUsagePurpose(e.target.value)}
          placeholder="Ví dụ: Dùng để gọi vốn (Pitch Deck), Đào tạo nội bộ, Nhượng quyền thương mại, Ra mắt công chúng..."
          className="w-full h-20 bg-slate-900/50 border border-orange-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
        />
      </div>

      {/* Page Count Selector */}
      <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
          <label className="text-[9px] font-bold text-orange-400 uppercase block mb-3 flex items-center justify-between">
              <span>Quy mô Brand Bible</span>
              <span className="text-white">{biblePageCount} Trang</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 40].map(count => (
                <button
                  key={count}
                  onClick={() => setBiblePageCount(count)}
                  className={`py-2 rounded-lg text-[10px] font-black transition-all ${biblePageCount === count ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-slate-900 text-slate-500 border border-slate-700 hover:text-white'}`}
                >
                  {count}P
                </button>
              ))}
          </div>
      </div>
    </div>
  );
};

export default BibleInputs;
