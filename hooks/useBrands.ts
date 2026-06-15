import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { BrandIdentity } from '../types';

export const useBrands = () => {
  const [brands, setBrandsState] = useState<BrandIdentity[]>([]);
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedBrands = await get('master_brands');
        if (savedBrands) {
          setBrandsState(savedBrands);
        }
        
        const savedActiveId = await get('master_active_brand_id');
        if (savedActiveId) {
          setActiveBrandIdState(savedActiveId);
        }
      } catch (error) {
        console.error('Failed to load brands from IndexedDB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Set brands and persist
  const setBrands = useCallback((newBrandsOrUpdater: BrandIdentity[] | ((prev: BrandIdentity[]) => BrandIdentity[])) => {
    setBrandsState((prev) => {
      const updated = typeof newBrandsOrUpdater === 'function' ? newBrandsOrUpdater(prev) : newBrandsOrUpdater;
      set('master_brands', updated).catch(err => console.error('Failed to save brands:', err));
      return updated;
    });
  }, []);

  // Set active brand ID and persist
  const setActiveBrandId = useCallback((id: string | null) => {
    setActiveBrandIdState(id);
    if (id) {
      set('master_active_brand_id', id).catch(err => console.error('Failed to save active brand ID:', err));
    } else {
      set('master_active_brand_id', null).catch(err => console.error('Failed to clear active brand ID:', err));
    }
  }, []);

  return {
    brands,
    setBrands,
    activeBrandId,
    setActiveBrandId,
    isLoading
  };
};
