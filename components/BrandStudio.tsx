import React, { useState, useRef } from 'react';
import { extractBrandColors } from '../services/brandService';
import { resizeImage } from '../lib/utils';
import { BrandIdentity, BrandProject } from '../types';
import { Upload, X, Palette, Loader2, Plus, Check, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from './Toast';

interface BrandStudioProps {
  brands: BrandIdentity[];
  activeBrandId: string | null;
  onUpdateBrands: (brands: BrandIdentity[]) => void;
  onSetActiveBrand: (id: string | null) => void;
  onClose: () => void;
}

export const BrandStudio: React.FC<BrandStudioProps> = ({ 
  brands, 
  activeBrandId, 
  onUpdateBrands, 
  onSetActiveBrand, 
  onClose 
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [brandName, setBrandName] = useState('');
  const [brandVibe, setBrandVibe] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let url = event.target?.result as string;
      try {
        url = await resizeImage(url, 500, true, 0.8); // Resize logo to max 500px, preserve transparency
      } catch (e) {
        console.error("Failed to resize logo", e);
      }
      setImageUrl(url);
      setLoading(true);
      
      try {
        const colors = await extractBrandColors(url, 5);
        setExtractedColors(colors);
      } catch (error) {
        console.error("Failed to extract colors", error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (imageUrl && extractedColors.length >= 3 && brandName.trim()) {
      const newBrand: BrandIdentity = {
        id: Math.random().toString(36).substring(7),
        name: brandName.trim(),
        logoUrl: imageUrl,
        primaryColor: extractedColors[0],
        secondaryColor: extractedColors[1],
        accentColor: extractedColors[2],
        toneOfVoice: brandVibe.trim(),
        projects: [],
        lastUpdated: new Date().toISOString(),
      };
      
      const newBrands = [...brands, newBrand];
      onUpdateBrands(newBrands);
      onSetActiveBrand(newBrand.id!);
      
      // Reset form
      setIsCreating(false);
      setImageUrl(null);
      setExtractedColors([]);
      setBrandName('');
      setBrandVibe('');
      addToast(`Đã lưu brand "${newBrand.name}" thành công!`, "success");
    }
  };

  const handleDelete = (id: string) => {
    const brandToDelete = brands.find(b => b.id === id);
    const newBrands = brands.filter(b => b.id !== id);
    onUpdateBrands(newBrands);
    if (activeBrandId === id) {
      onSetActiveBrand(newBrands.length > 0 ? newBrands[0].id! : null);
    }
    if (brandToDelete) {
      addToast(`Đã xóa brand "${brandToDelete.name}".`, "info");
    }
  };

  const handleProjectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBrandId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let url = event.target?.result as string;
      try {
        url = await resizeImage(url, 800, false, 0.7); // Resize project image to max 800px, jpeg
      } catch (e) {
        console.error("Failed to resize project image", e);
      }

      const newProject: BrandProject = {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        imageUrl: url,
        date: new Date().toISOString()
      };
      
      const updatedBrands = brands.map(b => {
        if (b.id === activeBrandId) {
          return {
            ...b,
            projects: [...(b.projects || []), newProject]
          };
        }
        return b;
      });
      
      onUpdateBrands(updatedBrands);
    };
    reader.readAsDataURL(file);
    if (projectInputRef.current) projectInputRef.current.value = '';
  };

  const handleDeleteProject = (projectId: string) => {
    if (!activeBrandId) return;
    const updatedBrands = brands.map(b => {
      if (b.id === activeBrandId) {
        return {
          ...b,
          projects: (b.projects || []).filter(p => p.id !== projectId)
        };
      }
      return b;
    });
    onUpdateBrands(updatedBrands);
  };

  const activeBrand = brands.find(b => b.id === activeBrandId);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 rounded-2xl w-full max-w-4xl h-[600px] border border-zinc-800 shadow-2xl flex overflow-hidden">
        
        {/* Left Sidebar - Brand List */}
        <div className="w-1/3 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-zinc-100">Brand Library</h2>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="px-2"
              title="Add New Brand"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {brands.length === 0 ? (
              <div className="text-center text-zinc-500 text-sm mt-10">
                Chưa có brand nào. Hãy tạo mới!
              </div>
            ) : (
              brands.map(brand => (
                <div 
                  key={brand.id}
                  onClick={() => onSetActiveBrand(brand.id!)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all group relative ${
                    activeBrandId === brand.id 
                      ? 'bg-indigo-500/10 border-indigo-500/50' 
                      : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-zinc-200 truncate pr-6">{brand.name}</span>
                    {activeBrandId === brand.id && (
                      <Check className="w-4 h-4 text-indigo-400 absolute right-3 top-3" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    {brand.primaryColor && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: brand.primaryColor }} title={brand.primaryColor} />}
                    {brand.secondaryColor && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: brand.secondaryColor }} title={brand.secondaryColor} />}
                    {brand.accentColor && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: brand.accentColor }} title={brand.accentColor} />}
                  </div>
                  
                  <Button 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(brand.id!);
                    }}
                    className="absolute right-2 bottom-2 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all h-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content - Create/Edit Form */}
        <div className="flex-1 flex flex-col relative">
          <Button variant="ghost" onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors z-10 h-auto">
            <X className="w-5 h-5" />
          </Button>

          {isCreating ? (
            <div className="p-8 flex flex-col h-full overflow-y-auto">
              <h2 className="text-xl font-semibold text-zinc-100 mb-6">Tạo Brand Mới</h2>
              
              <div className="flex flex-col gap-6 max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-300">Tên Brand</label>
                  <input 
                    type="text" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="VD: Tiệm Ảnh Master"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-300">Brand Vibe (Giọng điệu / Phong cách)</label>
                  <input 
                    type="text" 
                    value={brandVibe}
                    onChange={(e) => setBrandVibe(e.target.value)}
                    placeholder="VD: Hiện đại, tối giản, sang trọng..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <label className="text-sm font-medium text-zinc-300">Logo / Hình ảnh nhận diện</label>
                  {!imageUrl ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-zinc-900/50 hover:bg-zinc-900 transition-all group"
                    >
                      <div className="p-3 bg-zinc-800 group-hover:bg-indigo-500/20 rounded-full transition-colors">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-zinc-300">Tải ảnh lên để nhận diện màu</p>
                        <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                      <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain" />
                    <Button 
                        variant="ghost"
                        onClick={() => {
                          setImageUrl(null);
                          setExtractedColors([]);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors h-auto"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {loading && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      <span className="text-sm text-zinc-400">Đang phân tích màu sắc...</span>
                    </div>
                  )}

                  {!loading && extractedColors.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-medium text-zinc-300">Màu sắc nhận diện được:</h3>
                      <div className="flex gap-2">
                        {extractedColors.map((color, idx) => (
                          <div key={idx} className="flex-1 flex flex-col gap-1">
                            <div 
                              className="w-full h-12 rounded-lg shadow-inner border border-white/10" 
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="text-[10px] text-center text-zinc-400 font-mono uppercase">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <Button 
                    variant="secondary"
                    onClick={() => setIsCreating(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={!imageUrl || extractedColors.length === 0 || !brandName.trim()}
                    className="flex-1"
                  >
                    Lưu Brand
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-start h-full overflow-y-auto">
              {activeBrand ? (
                <div className="max-w-2xl w-full flex flex-col items-center gap-6 pb-10">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                    <img src={activeBrand.logoUrl} alt="Brand Logo" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-2xl font-semibold text-zinc-100">{activeBrand.name}</h2>
                  
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex flex-col gap-4">
                      <h3 className="text-sm font-medium text-zinc-400 text-left">Bảng màu thương hiệu</h3>
                      <div className="flex gap-4">
                        {activeBrand.primaryColor && (
                          <div className="flex-1 flex flex-col gap-2 items-center">
                            <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: activeBrand.primaryColor }} />
                            <span className="text-[10px] text-zinc-400 font-mono uppercase">{activeBrand.primaryColor}</span>
                          </div>
                        )}
                        {activeBrand.secondaryColor && (
                          <div className="flex-1 flex flex-col gap-2 items-center">
                            <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: activeBrand.secondaryColor }} />
                            <span className="text-[10px] text-zinc-400 font-mono uppercase">{activeBrand.secondaryColor}</span>
                          </div>
                        )}
                        {activeBrand.accentColor && (
                          <div className="flex-1 flex flex-col gap-2 items-center">
                            <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: activeBrand.accentColor }} />
                            <span className="text-[10px] text-zinc-400 font-mono uppercase">{activeBrand.accentColor}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {activeBrand.toneOfVoice && (
                      <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex flex-col gap-2">
                        <h3 className="text-sm font-medium text-zinc-400 text-left">Brand Vibe</h3>
                        <p className="text-zinc-100 text-left text-sm leading-relaxed">{activeBrand.toneOfVoice}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Projects Section */}
                  <div className="w-full p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex flex-col gap-4 mt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-zinc-400 text-left">Dự án liên quan (Moodboard/Reference)</h3>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => projectInputRef.current?.click()}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm ảnh
                      </Button>
                      <input 
                        type="file" 
                        ref={projectInputRef} 
                        onChange={handleProjectUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    
                    {activeBrand.projects && activeBrand.projects.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {activeBrand.projects.map(proj => (
                          <div key={proj.id} className="relative group rounded-xl overflow-hidden border border-zinc-800 aspect-square bg-zinc-900">
                            <img src={proj.imageUrl} alt={proj.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1">
                              <Button 
                                variant="ghost"
                                onClick={() => handleDeleteProject(proj.id)}
                                className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-md transition-colors h-auto"
                                title="Xóa ảnh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="w-8 h-8 text-zinc-600" />
                        <p className="text-sm text-zinc-500">Chưa có dự án/hình ảnh nào.</p>
                        <p className="text-xs text-zinc-600">Thêm ảnh moodboard hoặc các thiết kế cũ để AI tham khảo.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                    <Palette className="w-8 h-8 text-zinc-600" />
                  </div>
                  <p className="text-zinc-400">Chọn một brand từ danh sách hoặc tạo mới.</p>
                  <Button 
                    onClick={() => setIsCreating(true)}
                  >
                    Tạo Brand Mới
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
