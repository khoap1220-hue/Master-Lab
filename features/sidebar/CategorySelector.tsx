
import React, { useState, useRef, useEffect } from 'react';
import { ScenarioCategory } from '../../types';
import { Button } from '../../components/ui/Button';

interface CategorySelectorProps {
  categories: {id: ScenarioCategory, icon: string}[];
  activeCategory: ScenarioCategory;
  onCategoryChange: (cat: ScenarioCategory) => void;
}

const CATEGORY_GROUPS = [
  {
    name: 'Brand & Marketing',
    items: ['Branding', 'Logo Design', 'Marketing & Ads', 'Print Design', 'Signage', 'Social Media', 'Enterprise']
  },
  {
    name: 'Product & Packaging',
    items: ['Product Design', 'Product Document', 'Packaging', 'Fashion']
  },
  {
    name: 'Digital & UI',
    items: ['UX/UI Design', 'App Icon Design', 'Multimedia', 'Style Transfer', 'Vector Art']
  },
  {
    name: 'Architecture & Space',
    items: ['Real Estate', 'Floor Plan', 'Interior Design', '3D Rendering']
  },
  {
    name: 'Industry & Lifestyle',
    items: ['E-commerce', 'Event & Wedding', 'Food & Beverage']
  },
  {
    name: 'Video & Animation',
    items: ['Cinematic Video', 'Character Design']
  },
  {
    name: 'Operations & Studio',
    items: ['Creative Studio', 'SOP Management']
  }
];

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, activeCategory, onCategoryChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCatObj = categories.find(c => c.id === activeCategory);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-4 border-b border-zinc-800/50 bg-zinc-950/30 relative z-50">
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Workflow Category</div>
      <div ref={dropdownRef} className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl hover:bg-zinc-800 transition-colors h-auto"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{activeCatObj?.icon}</span>
            <span className="text-sm font-bold text-white">{activeCategory}</span>
          </div>
          <svg className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto custom-scrollbar">
            {CATEGORY_GROUPS.map((group, idx) => (
              <div key={group.name} className={`${idx > 0 ? 'border-t border-zinc-800' : ''}`}>
                <div className="px-4 py-2 bg-zinc-950/90 text-[10px] font-black text-zinc-500 uppercase tracking-widest sticky top-0 backdrop-blur-sm z-10">
                  {group.name}
                </div>
                <div className="p-2 grid grid-cols-1 gap-1">
                  {group.items.map(itemId => {
                    const cat = categories.find(c => c.id === itemId);
                    if (!cat) return null;
                    return (
                      <Button
                        key={cat.id}
                        variant="ghost"
                        onClick={() => {
                          onCategoryChange(cat.id);
                          setIsOpen(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left h-auto justify-start ${
                          activeCategory === cat.id 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-xs font-semibold">{cat.id}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;
