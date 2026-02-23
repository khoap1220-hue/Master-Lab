
import React, { useState } from 'react';
import { suggestDeliverables } from '../../../services/orchestrator/brand';

interface PackItem {
  title: string;
  items: string[];
}

interface DeliverablesSectionProps {
  deliverablesList: string;
  setDeliverablesList: (val: string) => void;
  activeTab: number | null;
  setActiveTab: (val: number | null) => void;
  config: any;
  goal: string;
  packs: PackItem[]; // Injected packs
  categoryLabel: string; // Used for API suggestion context
}

type BudgetTier = 'Economy' | 'Standard' | 'Premium';

const DeliverablesSection: React.FC<DeliverablesSectionProps> = ({
  deliverablesList,
  setDeliverablesList,
  activeTab,
  setActiveTab,
  config,
  goal,
  packs,
  categoryLabel
}) => {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('Standard');
  
  const toggleDeliverableItem = (item: string) => {
    const currentItems = (deliverablesList || '').split(',').map(s => s.trim()).filter(Boolean);
    let newItems = [];
    if (currentItems.includes(item)) {
      newItems = currentItems.filter(i => i !== item);
    } else {
      newItems = [...currentItems, item];
    }
    setDeliverablesList(newItems.join(', '));
  };

  const toggleGroup = (items: string[]) => {
    const currentItems = (deliverablesList || '').split(',').map(s => s.trim()).filter(Boolean);
    const allSelected = items.every(i => currentItems.includes(i));
    let newItems = [...currentItems];
    
    if (allSelected) {
       newItems = newItems.filter(i => !items.includes(i));
    } else {
       items.forEach(i => {
          if (!newItems.includes(i)) newItems.push(i);
       });
    }
    setDeliverablesList(newItems.join(', '));
  };

  const handleMagicSuggest = async () => {
    if (!goal.trim()) return;
    setIsSuggesting(true);
    try {
      const suggestions = await suggestDeliverables(goal, budgetTier, categoryLabel);
      if (suggestions && suggestions.length > 0) {
        // Append suggestions to existing list, avoiding duplicates
        const currentItems = (deliverablesList || '').split(',').map(s => s.trim()).filter(Boolean);
        const newItems = [...currentItems];
        suggestions.forEach(s => {
            if (!newItems.includes(s)) newItems.push(s);
        });
        setDeliverablesList(newItems.join(', '));
      }
    } catch (error) {
      console.error("Magic suggest failed", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-top-3 duration-500">
      <div className="flex justify-between items-center mb-2">
         <label className="text-[9px] font-bold text-slate-500 uppercase block">
            {config.deliverablesLabel || `DANH MỤC ${categoryLabel.toUpperCase()}`}
         </label>
         {deliverablesList && (
            <span className="text-[8px] text-blue-400 font-bold">{(deliverablesList || '').split(',').length} mục đã chọn</span>
         )}
      </div>
      
      {/* Budget Tier Selector */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-2">
         <button 
           type="button"
           onClick={() => setBudgetTier('Economy')}
           className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${budgetTier === 'Economy' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
         >
           Tiết kiệm
         </button>
         <button 
           type="button"
           onClick={() => setBudgetTier('Standard')}
           className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${budgetTier === 'Standard' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
         >
           Tiêu chuẩn
         </button>
         <button 
           type="button"
           onClick={() => setBudgetTier('Premium')}
           className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${budgetTier === 'Premium' ? 'bg-orange-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
         >
           Cao cấp
         </button>
      </div>

      {/* Magic Button */}
      <button 
        type="button"
        onClick={handleMagicSuggest}
        disabled={isSuggesting || !goal.trim()}
        className={`w-full mb-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
          isSuggesting 
            ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-wait'
            : !goal.trim()
              ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 hover:from-indigo-800/50 hover:to-purple-800/50 border-indigo-500/30 text-indigo-300 hover:text-white shadow-lg hover:shadow-indigo-500/20'
        }`}
      >
        {isSuggesting ? (
          <>
            <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[9px] font-black uppercase tracking-widest">AI Đang phân tích & Bổ sung...</span>
          </>
        ) : (
          <>
            <span className="text-lg">✨</span>
            <span className="text-[9px] font-black uppercase tracking-widest">
              {goal.trim() ? "AI Gợi ý & Bổ sung hạng mục" : "Nhập mô tả để AI gợi ý"}
            </span>
          </>
        )}
      </button>

      {/* Smart Checklist UI */}
      <div className="mb-3 space-y-2">
         {packs.map((pack, idx) => {
            const currentItemsArr = (deliverablesList || '').split(',').map(s => s.trim());
            const isFull = pack.items.every(i => currentItemsArr.includes(i));
            const isPartial = !isFull && pack.items.some(i => currentItemsArr.includes(i));

            return (
              <div key={idx} className={`bg-slate-900/50 border rounded-xl overflow-hidden transition-all ${isFull ? 'border-blue-500/50' : 'border-slate-800'}`}>
                 <div className="flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors">
                    <button 
                       type="button"
                       onClick={() => setActiveTab(activeTab === idx ? null : idx)}
                       className="flex-1 text-left flex items-center gap-2"
                    >
                       <div className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-blue-500' : isPartial ? 'bg-orange-500' : 'bg-slate-600'}`}></div>
                       <span className={`text-[9px] font-bold uppercase tracking-wide ${isFull ? 'text-white' : 'text-slate-300'}`}>
                          {pack.title}
                       </span>
                    </button>
                    
                    <div className="flex items-center gap-3">
                       <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleGroup(pack.items); }}
                          className={`px-2 py-1 rounded text-[8px] font-bold uppercase border transition-all ${isFull ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                       >
                          {isFull ? 'Đã chọn hết' : 'Chọn bộ'}
                       </button>
                       
                       <button type="button" onClick={() => setActiveTab(activeTab === idx ? null : idx)}>
                          <svg className={`w-3 h-3 text-slate-500 transform transition-transform ${activeTab === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </button>
                    </div>
                 </div>
                 
                 {activeTab === idx && (
                    <div className="p-3 pt-0 border-t border-slate-800/50 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 bg-black/20">
                       {pack.items.map((item, itemIdx) => {
                          const isSelected = deliverablesList.includes(item);
                          return (
                             <button 
                                key={itemIdx}
                                type="button"
                                onClick={() => toggleDeliverableItem(item)}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-medium border transition-all ${
                                   isSelected 
                                   ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                   : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                }`}
                             >
                                {item} {isSelected && '✓'}
                             </button>
                          );
                       })}
                    </div>
                 )}
              </div>
            );
         })}
      </div>

      <textarea 
         value={deliverablesList}
         onChange={(e) => setDeliverablesList(e.target.value)}
         placeholder={config.deliverablesPlaceholder || 'Ghi thêm các hạng mục khác (phân cách bằng dấu phẩy)...'}
         className="w-full h-14 bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none leading-relaxed shadow-inner"
      />
    </div>
  );
};

export default DeliverablesSection;
