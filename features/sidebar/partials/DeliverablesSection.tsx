
import React, { useState } from 'react';
import { suggestDeliverables } from '../../../services/orchestrator/brand';
import { Button } from '../../../components/ui/Button';

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
         <label className="text-[9px] font-bold text-zinc-500 uppercase block">
            {config.deliverablesLabel || `DANH MỤC ${categoryLabel.toUpperCase()}`}
         </label>
         {deliverablesList && (
            <span className="text-[8px] text-blue-400 font-bold">{(deliverablesList || '').split(',').length} mục đã chọn</span>
         )}
      </div>
      
      {/* Budget Tier Selector */}
      <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 mb-2">
         <Button 
           variant="ghost"
           onClick={() => setBudgetTier('Economy')}
           className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all h-auto ${budgetTier === 'Economy' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           Tiết kiệm
         </Button>
         <Button 
           variant="ghost"
           onClick={() => setBudgetTier('Standard')}
           className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all h-auto ${budgetTier === 'Standard' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           Tiêu chuẩn
         </Button>
         <Button 
           variant="ghost"
           onClick={() => setBudgetTier('Premium')}
           className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all h-auto ${budgetTier === 'Premium' ? 'bg-orange-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           Cao cấp
         </Button>
      </div>

      {/* Magic Button */}
      <Button 
        variant="outline"
        onClick={handleMagicSuggest}
        disabled={isSuggesting || !goal.trim()}
        className={`w-full mb-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all h-auto ${
          isSuggesting 
            ? 'bg-zinc-800 border-zinc-700 text-zinc-500 cursor-wait'
            : !goal.trim()
              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 hover:from-indigo-800/50 hover:to-purple-800/50 border-indigo-500/30 text-indigo-300 hover:text-white shadow-lg hover:shadow-indigo-500/20'
        }`}
      >
        {isSuggesting ? (
          <>
            <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
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
      </Button>

      {/* Smart Checklist UI */}
      <div className="mb-3 space-y-2">
         {packs.map((pack, idx) => {
            const currentItemsArr = (deliverablesList || '').split(',').map(s => s.trim());
            const isFull = pack.items.every(i => currentItemsArr.includes(i));
            const isPartial = !isFull && pack.items.some(i => currentItemsArr.includes(i));

            return (
              <div key={idx} className={`bg-zinc-900/50 border rounded-xl overflow-hidden transition-all ${isFull ? 'border-blue-500/50' : 'border-zinc-800'}`}>
                 <div className="flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors">
                    <Button 
                       variant="ghost"
                       onClick={() => setActiveTab(activeTab === idx ? null : idx)}
                       className="flex-1 text-left flex items-center gap-2 h-auto justify-start"
                    >
                       <div className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-blue-500' : isPartial ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                       <span className={`text-[9px] font-bold uppercase tracking-wide ${isFull ? 'text-white' : 'text-zinc-300'}`}>
                          {pack.title}
                       </span>
                    </Button>
                    
                    <div className="flex items-center gap-3">
                       <Button 
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); toggleGroup(pack.items); }}
                          className={`px-2 py-1 rounded text-[8px] font-bold uppercase border transition-all h-auto ${isFull ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
                       >
                          {isFull ? 'Đã chọn hết' : 'Chọn bộ'}
                       </Button>
                       
                       <Button variant="ghost" onClick={() => setActiveTab(activeTab === idx ? null : idx)} className="h-auto p-1">
                          <svg className={`w-3 h-3 text-zinc-500 transform transition-transform ${activeTab === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </Button>
                    </div>
                 </div>
                 
                 {activeTab === idx && (
                    <div className="p-3 pt-0 border-t border-zinc-800/50 flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 bg-black/20">
                       {pack.items.map((item, itemIdx) => {
                          const isSelected = deliverablesList.includes(item);
                          return (
                             <Button 
                                key={itemIdx}
                                variant="outline"
                                onClick={() => toggleDeliverableItem(item)}
                                className={`px-2.5 py-1.5 rounded-lg text-[9px] font-medium border transition-all h-auto ${
                                   isSelected 
                                   ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                                   : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
                                }`}
                             >
                                {item} {isSelected && '✓'}
                             </Button>
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
         className="w-full h-14 bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none leading-relaxed shadow-inner"
      />
    </div>
  );
};

export default DeliverablesSection;
