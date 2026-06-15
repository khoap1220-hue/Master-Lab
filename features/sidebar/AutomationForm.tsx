
import React, { useState, useRef, useEffect } from 'react';
import { ScenarioCategory, BrandIdentity } from '../../types';
import { Button } from '../../components/ui/Button';
import { getCategoryConfig, CATEGORY_PACKS } from './config'; 
import DeliverablesSection from './partials/DeliverablesSection'; 
import StyleControls from './partials/StyleControls';
import MarketingInputs from './partials/MarketingInputs';
import BibleInputs from './partials/BibleInputs';
import { fileToBase64, resizeImage } from '../../lib/utils';
import { extractBrandColors } from '../../services/brandService';

interface AutomationFormProps {
  activeCategory: ScenarioCategory;
  onAutomationStart: (
    goal: string, 
    batchSize: number, 
    category: ScenarioCategory, 
    logoAsset: string | null,
    moodboardAssets?: string[],
    brandUrl?: string,
    brandInfo?: { color: string; vibe: string }
  ) => void;
  creativeDrift: number;
  onDriftChange: (val: number) => void;
  brandIdentity?: BrandIdentity | null;
  brands?: BrandIdentity[];
  onSetActiveBrand?: (id: string | null) => void;
  onUpdateBrands?: (brands: BrandIdentity[]) => void;
}

const AutomationForm: React.FC<AutomationFormProps> = ({ 
  activeCategory, 
  onAutomationStart, 
  creativeDrift, 
  onDriftChange,
  brandIdentity,
  brands = [],
  onSetActiveBrand,
  onUpdateBrands
}) => {
  const config = getCategoryConfig(activeCategory);
  
  const [goal, setGoal] = useState('');
  const [targetAudience, setTargetAudience] = useState(''); // New for Product Design
  const [usagePurpose, setUsagePurpose] = useState(''); 
  const [contextValue, setContextValue] = useState(''); 
  const [mockupEnv, setMockupEnv] = useState(''); 
  const [batchSize, setBatchSize] = useState(1);
  const [selectedInjectors, setSelectedInjectors] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]); 
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]); 
  const [logoAsset, setLogoAsset] = useState<string | null>(null);
  const [moodboardAssets, setMoodboardAssets] = useState<string[]>([]);
  const [brandUrl, setBrandUrl] = useState('');
  const [deliverablesList, setDeliverablesList] = useState('');
  
  // Brand Identity State
  const [brandColor, setBrandColor] = useState('#000000');
  const [brandVibe, setBrandVibe] = useState('');

  // Sync with active brand
  useEffect(() => {
    if (brandIdentity) {
      setBrandColor(brandIdentity.primaryColor || '#000000');
      setBrandVibe(brandIdentity.toneOfVoice || '');
      setLogoAsset(brandIdentity.logoUrl || null);
    } else {
      setBrandColor('#000000');
      setBrandVibe('');
      setLogoAsset(null);
    }
  }, [brandIdentity]);

  const hasUnsavedBrandChanges = () => {
    if (!brandIdentity) return brandColor !== '#000000' || brandVibe !== '' || logoAsset !== null;
    return brandColor !== (brandIdentity.primaryColor || '#000000') 
        || brandVibe !== (brandIdentity.toneOfVoice || '') 
        || logoAsset !== (brandIdentity.logoUrl || null);
  };

  const handleSaveAsNewBrand = () => {
    if (onUpdateBrands && onSetActiveBrand) {
      const newBrand: BrandIdentity = {
        id: Math.random().toString(36).substring(7),
        name: `Brand ${brands.length + 1}`,
        logoUrl: logoAsset || undefined,
        primaryColor: brandColor,
        toneOfVoice: brandVibe,
        projects: [],
        lastUpdated: new Date().toISOString(),
      };
      onUpdateBrands([...brands, newBrand]);
      onSetActiveBrand(newBrand.id!);
    }
  };

  const handleUpdateBrand = () => {
    if (onUpdateBrands && brandIdentity) {
      const updatedBrands = brands.map(b => 
        b.id === brandIdentity.id 
          ? { ...b, logoUrl: logoAsset || undefined, primaryColor: brandColor, toneOfVoice: brandVibe, lastUpdated: new Date().toISOString() }
          : b
      );
      onUpdateBrands(updatedBrands);
    }
  };

  // Added 'master_board' mode
  const [designMode, setDesignMode] = useState<'new' | 'variant' | 'vector' | 'bible' | 'campaign' | 'master_board'>('new');
  const [biblePageCount, setBiblePageCount] = useState<number>(40); 
  
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [isDeepResearch, setIsDeepResearch] = useState(true);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const moodboardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGoal('');
    setTargetAudience('');
    setUsagePurpose('');
    setContextValue(config.contextOptions ? config.contextOptions[0] : '');
    setMockupEnv('');
    setBatchSize(1);
    setSelectedInjectors([]);
    setSelectedFormats([]);
    setSelectedTechniques([]);
    setDeliverablesList('');
    setDesignMode('new');
    setBiblePageCount(40);
    setActiveTab(null);
    // Removed resets for logoAsset, moodboardAssets, brandUrl, brandColor, and brandVibe
    // so they persist when switching categories.
  }, [activeCategory]); 

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      let base64 = await fileToBase64(e.target.files[0]);
      try {
        base64 = await resizeImage(base64, 500, true, 0.8);
      } catch (e) {
        console.error("Failed to resize logo:", e);
      }
      setLogoAsset(base64);
      
      // Extract color from the new logo
      try {
        const colors = await extractBrandColors(base64, 5);
        if (colors && colors.length > 0) {
          setBrandColor(colors[0]);
        }
      } catch (error) {
        console.error("Failed to extract color from logo:", error);
      }
    }
  };

  const handleMoodboardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const base64s = await Promise.all(files.map(async (file) => {
        let b64 = await fileToBase64(file);
        try {
          b64 = await resizeImage(b64, 800, false, 0.7);
        } catch (e) {
          console.error("Failed to resize moodboard image:", e);
        }
        return b64;
      }));
      setMoodboardAssets(prev => [...prev, ...base64s].slice(0, 5));
    }
  };

  const toggleInjector = (tag: string) => {
    setSelectedInjectors(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev => prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]);
  };

  const toggleTechnique = (tech: string) => {
    setSelectedTechniques(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
  };

  const handleStart = () => {
    // ROBUSTNESS: If goal is empty, use Auto-Generation Prompt based on assets
    let effectiveGoal = goal;
    
    if (!effectiveGoal.trim()) {
        if (logoAsset || moodboardAssets.length > 0) {
            effectiveGoal = `Analyze the provided assets (Logo/Moodboard) and create a high-quality ${activeCategory} concept that matches their style.`;
        } else {
            effectiveGoal = `Generate a trending, high-quality ${activeCategory} concept from scratch using current industry best practices.`;
        }
    }
    
    let finalGoal = effectiveGoal;
    if (targetAudience.trim()) finalGoal += `\n[TARGET_AUDIENCE]: ${targetAudience.trim()}`;
    if (config.contextLabel && contextValue) finalGoal += `\n[${config.contextLabel.toUpperCase()}]: ${contextValue}`;
    if (mockupEnv.trim()) finalGoal += `\n[MOCKUP_ENVIRONMENT]: ${mockupEnv.trim()}`;
    if (selectedInjectors.length > 0) finalGoal += `\n[STYLE INJECTORS]: ${selectedInjectors.join(', ')}`;
    if (activeCategory === 'SOP Management') finalGoal += `\n[BUSINESS_MODEL]: ${contextValue}`;
    if (activeCategory === 'Marketing & Ads') {
        if (selectedFormats.length > 0) finalGoal += `\n[OUTPUT FORMATS]: ${selectedFormats.join(', ')}`;
        if (selectedTechniques.length > 0) finalGoal += `\n[ADVANCED_TECHNIQUES]: ${selectedTechniques.join(', ')}`;
    }
    
    if (isDeepResearch) finalGoal += `\n[DEEP_RESEARCH: ON]`;
    
    if (deliverablesList && designMode !== 'bible') {
        finalGoal += `\n[REQUESTED_DELIVERABLES]: ${deliverablesList}`;
    }
    
    if (designMode === 'variant') finalGoal = `[VARIATION MODE]: ${finalGoal}`;
    else if (designMode === 'vector') finalGoal = `[VECTOR BLUEPRINT MODE]: ${finalGoal}`;
    else if (designMode === 'campaign') finalGoal = `[MODE: OMNICHANNEL_CAMPAIGN]: ${finalGoal}`;
    else if (designMode === 'bible') {
       if (usagePurpose.trim()) finalGoal += `\n[USAGE_PURPOSE]: ${usagePurpose.trim()}`;
       finalGoal = `[MODE: BRAND_BIBLE_${biblePageCount}]: ${finalGoal}`;
    } else if (designMode === 'master_board') {
       // Special Mode: UX Master Board 4K
       finalGoal = `[MODE: UX_MASTER_BOARD]: ${finalGoal}`;
    } else if (activeCategory === 'Creative Studio') {
       if (designMode === 'new') finalGoal = `[MODE: FUTURE_SIMULATION]: ${finalGoal}`;
    }

    onAutomationStart(finalGoal, batchSize, activeCategory, logoAsset, moodboardAssets, brandUrl, {
        color: brandColor,
        vibe: brandVibe
    });
  };

  const currentPack = CATEGORY_PACKS[activeCategory];

  // Determine if the start button should be enabled
  // ROBUSTNESS: Always enable start. If empty, we use Fallback logic.
  const canStart = true;

  const getButtonLabel = () => {
      if (designMode === 'variant') return 'Khởi tạo Biến thể';
      if (designMode === 'bible') return `Generate Bible (${biblePageCount}P)`;
      if (designMode === 'master_board') return 'Generate 4K Master Board';
      if (!goal.trim()) return `Tự động sáng tạo (Auto-Gen)`;
      return config.actionBtn || 'Kích hoạt Neural Engine';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-8 pb-20 min-h-0">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
           <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-xl">{config.icon}</div>
           <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide">{config.title}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{config.descLabel}</p>
           </div>
        </div>

        <div className="flex bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 flex-wrap gap-1 relative z-10">
           <Button 
             variant="ghost"
             onClick={() => setDesignMode('new')} 
             className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative overflow-hidden group h-auto ${designMode === 'new' ? 'bg-blue-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}`}
           >
             <span className="relative z-10">{config.actionBtn || 'Tác vụ chính'}</span>
           </Button>
           {config.variantBtn && (
             <Button 
               variant="ghost"
               onClick={() => {
                   if (activeCategory === 'UX/UI Design') setDesignMode('master_board');
                   else setDesignMode('variant');
               }} 
               className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all relative overflow-hidden group h-auto ${(designMode === 'variant' || designMode === 'master_board') ? 'bg-purple-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'}`}
             >
               <span className="relative z-10">{config.variantBtn}</span>
             </Button>
           )}
        </div>
      </div>

      <div className="space-y-6">
         <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase block">1. Nội dung mục tiêu</label>
                {config.contextOptions && (
                    <div className="flex items-center gap-2">
                        <select value={contextValue} onChange={(e) => setContextValue(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded text-[9px] font-bold text-blue-400 px-2 py-0.5 focus:ring-0 cursor-pointer max-w-[120px]">
                            {config.contextOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="relative group">
                <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={config.placeholder} className={`w-full bg-zinc-900/50 border border-zinc-700 rounded-2xl p-4 pb-12 text-xs text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none leading-relaxed h-36`} />
                <Button 
                  variant="ghost"
                  onClick={() => setIsDeepResearch(!isDeepResearch)} 
                  className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 h-auto ${isDeepResearch ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                >
                   ✨ Nghiên cứu sâu: {isDeepResearch ? 'BẬT' : 'TẮT'}
                </Button>
            </div>
         </div>

         {/* CONDITIONALLY RENDER TARGET AUDIENCE FOR PRODUCT DESIGN */}
         {activeCategory === 'Product Design' && (
           <div className="animate-in slide-in-from-top-2">
             <label className="text-[9px] font-bold text-emerald-500 uppercase block mb-2">Đối tượng khách hàng (Target Audience)</label>
             <input 
               type="text" 
               value={targetAudience}
               onChange={(e) => setTargetAudience(e.target.value)}
               placeholder="VD: Người leo núi chuyên nghiệp, Trẻ em 5-10 tuổi..."
               className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-700 focus:ring-1 focus:ring-emerald-500 transition-all"
             />
             <p className="text-[8px] text-zinc-500 mt-1 italic">* AI sẽ tự động phân tích Nhân trắc học & UX nếu bạn để trống.</p>
           </div>
         )}

         {/* Mockup Positioning / Environment context */}
         {(activeCategory === 'Branding' || activeCategory === 'Packaging' || activeCategory === 'Logo Design') && (
           <div>
             <label className="text-[9px] font-bold text-orange-500 uppercase block mb-2">Phối cảnh / Vị trí mong muốn</label>
             <input 
               type="text" 
               value={mockupEnv}
               onChange={(e) => setMockupEnv(e.target.value)}
               placeholder="Ví dụ: Trong văn phòng hiện đại, Trên đường phố New York..."
               className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-3 text-xs text-white placeholder-zinc-700 focus:ring-1 focus:ring-orange-500 transition-all"
             />
           </div>
         )}

         <div>
            <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">2. Tài nguyên & Brand Kit</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div onClick={() => logoInputRef.current?.click()} className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group ${logoAsset ? 'border-green-500/50 bg-green-500/5' : 'border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800'}`}>
                  {logoAsset ? <img src={logoAsset} className="h-14 object-contain" alt="Logo" /> : <>
                       <svg className="w-6 h-6 text-zinc-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                       <span className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-blue-400 text-center px-2">{config.assetLabel}</span>
                  </>}
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
               </div>
               <div onClick={() => moodboardInputRef.current?.click()} className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group ${moodboardAssets.length > 0 ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-700 bg-zinc-900/30 hover:bg-zinc-800'}`}>
                   {moodboardAssets.length > 0 ? <div className="flex -space-x-2">
                        {moodboardAssets.slice(0,3).map((src, i) => <img key={i} src={src} className="w-8 h-8 rounded-full border border-zinc-900 object-cover" />)}
                   </div> : <>
                        <svg className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-indigo-400 text-center px-2">Moodboard</span>
                   </>}
                   <input type="file" ref={moodboardInputRef} className="hidden" accept="image/*" multiple onChange={handleMoodboardUpload} />
               </div>
            </div>

            {/* BRAND KIT: Selector, Color & Vibe */}
            <div className="flex flex-col gap-3 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800">
               <div className="flex items-end gap-2">
                 <div className="flex-1">
                    <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Select Brand Kit</label>
                    <select 
                      value={brandIdentity?.id || ''} 
                      onChange={(e) => {
                        if (onSetActiveBrand) {
                          onSetActiveBrand(e.target.value || null);
                        }
                      }}
                      className="w-full h-9 bg-zinc-800 border border-zinc-700 rounded-lg px-2 text-[10px] text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">-- Tùy chỉnh thủ công --</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                 </div>
                 {hasUnsavedBrandChanges() && (
                   <div className="flex gap-1">
                     {brandIdentity && (
                       <Button 
                         variant="outline"
                         onClick={handleUpdateBrand}
                         className="h-9 px-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap"
                         title="Cập nhật Brand hiện tại"
                       >
                         Cập nhật
                       </Button>
                     )}
                     <Button 
                       variant="outline"
                       onClick={handleSaveAsNewBrand}
                       className="h-9 px-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap"
                       title="Lưu thành Brand mới để tái sử dụng"
                     >
                       Lưu mới
                     </Button>
                   </div>
                 )}
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Brand Color</label>
                    <div className="h-9 w-full bg-zinc-800 border border-zinc-700 rounded-lg flex items-center px-2 gap-2 relative overflow-hidden group">
                        <input 
                            type="color" 
                            value={brandColor} 
                            onChange={(e) => setBrandColor(e.target.value)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="w-5 h-5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: brandColor }}></div>
                        <span className="text-[9px] font-mono text-zinc-300 uppercase tracking-widest">{brandColor}</span>
                    </div>
                 </div>
                 <div>
                    <label className="text-[8px] font-bold text-zinc-500 uppercase block mb-1">Brand Vibe</label>
                    <input 
                        type="text" 
                        value={brandVibe} 
                        onChange={(e) => setBrandVibe(e.target.value)} 
                        placeholder="VD: Modern, Friendly"
                        className="w-full h-9 bg-zinc-800 border border-zinc-700 rounded-lg px-2 text-[10px] text-white placeholder-zinc-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                 </div>
               </div>
            </div>
         </div>

         {designMode === 'bible' && <BibleInputs usagePurpose={usagePurpose} setUsagePurpose={setUsagePurpose} biblePageCount={biblePageCount} setBiblePageCount={setBiblePageCount} />}
         {activeCategory === 'Marketing & Ads' && <MarketingInputs config={config} selectedFormats={selectedFormats} toggleFormat={toggleFormat} selectedTechniques={selectedTechniques} toggleTechnique={toggleTechnique} />}

         {currentPack && designMode !== 'bible' && (
            <DeliverablesSection 
               deliverablesList={deliverablesList} 
               setDeliverablesList={setDeliverablesList} 
               activeTab={activeTab} 
               setActiveTab={setActiveTab} 
               config={config} 
               goal={goal}
               packs={currentPack}
               categoryLabel={activeCategory}
            />
         )}

         <StyleControls 
            injectors={config.injectors || []} selectedInjectors={selectedInjectors} toggleInjector={toggleInjector}
            creativeDrift={creativeDrift} onDriftChange={onDriftChange} batchSize={batchSize} setBatchSize={setBatchSize}
            designMode={designMode} categoryLabel={activeCategory} configScaleLabel={config.scaleLabel}
         />
      </div>

      <div className="pt-4 border-t border-zinc-800">
         <Button 
            onClick={handleStart} 
            disabled={!canStart}
            className={`w-full py-4 bg-gradient-to-r text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed h-auto ${
             designMode === 'bible' ? 'from-orange-600 to-red-600' : 
             designMode === 'master_board' ? 'from-cyan-600 to-blue-600' :
             'from-blue-600 to-indigo-600 shadow-blue-900/30'
           }`}
         >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {getButtonLabel()}
         </Button>
      </div>
    </div>
  );
};

export default AutomationForm;
