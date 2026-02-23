
import React from 'react';
import { ScenarioCategory } from '../../types';

interface CategorySelectorProps {
  categories: {id: ScenarioCategory, icon: string}[];
  activeCategory: ScenarioCategory;
  onCategoryChange: (cat: ScenarioCategory) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex items-center gap-2 p-4 overflow-x-auto border-b border-slate-800/50 bg-slate-950/30 custom-scrollbar">
      {categories.map(cat => (
        <button 
          key={cat.id} 
          type="button"
          onClick={() => onCategoryChange(cat.id)} 
          className={`flex-shrink-0 px-3 py-2 rounded-xl flex items-center gap-2 transition-all border group ${activeCategory === cat.id ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
        >
          <span className={`text-sm group-hover:scale-110 transition-transform ${activeCategory === cat.id ? 'grayscale-0' : 'grayscale opacity-70'}`}>{cat.icon}</span>
          <span className="text-[9px] font-black uppercase tracking-widest">{cat.id}</span>
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;
