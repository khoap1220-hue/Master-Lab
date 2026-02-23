
import React, { useState, memo } from 'react';
import { ExtractedAsset } from '../../../types';
import JSZip from 'jszip';

interface DecomposeGridProps {
  assets: ExtractedAsset[];
}

// 1. Memoized Asset Card for Performance
const AssetCard = memo(({ asset, index, hasLayers }: { asset: ExtractedAsset, index: number, hasLayers: boolean }) => {
    return (
        <div 
            className="group relative bg-slate-900/40 rounded-[1.5rem] border border-slate-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Image Preview Area */}
            <div className="aspect-square bg-[url('https://beupify.com/img/transparent-background.png')] bg-repeat bg-[length:10px_10px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 opacity-60"></div>
                <img 
                    src={asset.flattenedUrl} 
                    className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl" 
                    alt={asset.name}
                    loading="lazy" 
                    decoding="async"
                />
                
                {/* Quick Action Overlay */}
                {!hasLayers && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                       <a 
                          href={asset.flattenedUrl} 
                          download={`${asset.name}_Main.png`}
                          className="px-6 py-3 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl flex items-center gap-2"
                          title="Download Asset"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Save Image
                        </a>
                    </div>
                )}

                {/* Asset Name Badge */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                    <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-wider border border-white/10 truncate max-w-[80%]">
                        {asset.name}
                    </span>
                </div>
            </div>
            
            {/* CONDITIONAL FOOTER: Show Layer Inspector OR Simple Info */}
            {hasLayers ? (
                <div className="p-4 bg-slate-950/30 border-t border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Intelligent Layers</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                            <div className={`h-1 rounded-full w-full ${asset.layers.background ? 'bg-slate-600' : 'bg-slate-800'}`}></div>
                            <a 
                              href={asset.layers.background} 
                              download={`${asset.name}_BG.png`}
                              className={`h-8 rounded-lg border flex items-center justify-center text-[8px] font-bold uppercase transition-all ${asset.layers.background ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer' : 'border-slate-800 bg-transparent text-slate-600 cursor-not-allowed'}`}
                            >BG</a>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className={`h-1 rounded-full w-full ${asset.layers.typography ? 'bg-blue-500' : 'bg-slate-800'}`}></div>
                            <a 
                              href={asset.layers.typography} 
                              download={`${asset.name}_Typo.png`}
                              className={`h-8 rounded-lg border flex items-center justify-center text-[8px] font-bold uppercase transition-all ${asset.layers.typography ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer' : 'border-slate-800 bg-transparent text-slate-600 cursor-not-allowed'}`}
                            >Text</a>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className={`h-1 rounded-full w-full ${asset.layers.graphics ? 'bg-orange-500' : 'bg-slate-800'}`}></div>
                            <a 
                              href={asset.layers.graphics} 
                              download={`${asset.name}_Gfx.png`}
                              className={`h-8 rounded-lg border flex items-center justify-center text-[8px] font-bold uppercase transition-all ${asset.layers.graphics ? 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 cursor-pointer' : 'border-slate-800 bg-transparent text-slate-600 cursor-not-allowed'}`}
                            >Icon</a>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate-600">Generated Asset</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[8px] font-bold text-slate-400">Ready</span>
                    </div>
                </div>
            )}
        </div>
    );
});

// 2. UX Flow Card (Special visualization for connected screens)
const FlowScreenCard = memo(({ asset, index, isLast }: { asset: ExtractedAsset, index: number, isLast: boolean }) => {
    return (
        <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="relative group">
                {/* Screen Frame */}
                <div className="w-[240px] aspect-[9/16] bg-black rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-hidden relative group-hover:border-cyan-500/50 group-hover:scale-105 transition-all duration-500">
                    <img src={asset.flattenedUrl} className="w-full h-full object-cover" alt={asset.name} />
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <a 
                            href={asset.flattenedUrl} 
                            download={`${asset.name}_Screen.png`}
                            className="p-3 bg-white text-black rounded-full shadow-xl hover:scale-110 transition-transform"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                    </div>
                </div>

                {/* Badge Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-cyan-600 border-2 border-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg z-10">
                    {index + 1}
                </div>

                {/* Screen Name */}
                <div className="mt-4 text-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-1">{asset.name}</h4>
                    <p className="text-[9px] text-slate-500">User Step {index + 1}</p>
                </div>
            </div>

            {/* Connector Arrow (if not last) */}
            {!isLast && (
                <div className="flex flex-col items-center gap-1 text-slate-700">
                    <div className="w-16 h-0.5 bg-gradient-to-r from-slate-700 to-slate-800"></div>
                    <svg className="w-4 h-4 -ml-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
            )}
        </div>
    );
});

const DecomposeGrid: React.FC<DecomposeGridProps> = ({ assets }) => {
  const [isZipping, setIsZipping] = useState(false);

  if (!assets || assets.length === 0) return null;

  // Heuristic: Is this a UX Flow? (Check if names contain screen-like patterns)
  // Or simply if there are multiple assets with "screen" or numbered names and no layers
  const isUXFlow = assets.some(a => 
      a.name.toLowerCase().includes('screen') || 
      a.name.toLowerCase().includes('login') || 
      a.name.toLowerCase().includes('dashboard') ||
      a.id.includes('screen-')
  );

  // Helper: Check if asset actually has decomposed layers
  const checkLayers = (asset: ExtractedAsset) => {
      return !!(asset.layers && (asset.layers.background || asset.layers.typography || asset.layers.graphics));
  };

  const handleDownloadAll = async () => {
    if (isZipping) return;
    setIsZipping(true);
    
    try {
        const zip = new JSZip();
        const folder = zip.folder("Batch_Assets");
        
        assets.forEach((asset, i) => {
            // Clean filename
            const safeName = asset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            // Add main flattened image
            if (asset.flattenedUrl) {
                const data = asset.flattenedUrl.split(',')[1];
                folder?.file(`${i+1}_${safeName}_Full.png`, data, {base64: true});
            }
            
            // Add layers if exist
            if (checkLayers(asset)) {
                if (asset.layers.background) folder?.file(`${i+1}_${safeName}_BG.png`, asset.layers.background.split(',')[1], {base64: true});
                if (asset.layers.typography) folder?.file(`${i+1}_${safeName}_Text.png`, asset.layers.typography.split(',')[1], {base64: true});
                if (asset.layers.graphics) folder?.file(`${i+1}_${safeName}_Icon.png`, asset.layers.graphics.split(',')[1], {base64: true});
            }
        });

        const blob = await zip.generateAsync({type:"blob"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Batch_Assets_${new Date().toISOString().slice(0,10)}.zip`;
        link.click();
        
    } catch (e) {
        console.error("Failed to zip assets", e);
        alert("Lỗi khi nén file. Vui lòng thử lại.");
    } finally {
        setIsZipping(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#0a0f1d]/90 backdrop-blur-xl py-4 z-20 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-xl ${isUXFlow ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
                {isUXFlow ? '📱' : assets[0]?.name.includes('Angle') ? '📸' : '🧩'}
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    {isUXFlow ? 'User Experience Flow' : 'Asset Library'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                    {assets.length} items ready for {isUXFlow ? 'development' : 'production'}
                </p>
            </div>
          </div>
          
          <button 
            onClick={handleDownloadAll}
            disabled={isZipping}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all border ${isZipping ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/20 shadow-blue-900/20 group hover:scale-105 active:scale-95'}`}
          >
              {isZipping ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                    <span>Compressing...</span>
                  </>
              ) : (
                  <>
                    <span>Download All (ZIP)</span>
                    <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </>
              )}
          </button>
      </div>
      
      {/* Content View */}
      {isUXFlow ? (
          // HORIZONTAL FLOW LAYOUT
          <div className="flex items-center gap-4 pb-20 overflow-x-auto custom-scrollbar min-h-[400px]">
              {assets.map((asset, index) => (
                  <FlowScreenCard 
                      key={asset.id} 
                      asset={asset} 
                      index={index} 
                      isLast={index === assets.length - 1} 
                  />
              ))}
              
              {/* End Node */}
              <div className="flex flex-col items-center gap-2 opacity-50 animate-in fade-in slide-in-from-right-8" style={{ animationDelay: '500ms' }}>
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                      <span className="text-xl">🏁</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">End Flow</span>
              </div>
          </div>
      ) : (
          // STANDARD GRID LAYOUT
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
              {assets.map((asset, index) => (
                 <AssetCard 
                    key={asset.id} 
                    asset={asset} 
                    index={index} 
                    hasLayers={checkLayers(asset)} 
                 />
              ))}
          </div>
      )}
    </div>
  );
};

export default DecomposeGrid;
