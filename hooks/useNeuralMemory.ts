
import { useState, useEffect } from 'react';
import { MemoryInsight, NeuralEvent } from '../types';
import { INITIAL_MEMORY } from '../data/constants';
import * as memoryService from '../services/memoryService';
import * as registryService from '../services/registryService';

export const useNeuralMemory = () => {
  const [memory, setMemory] = useState<MemoryInsight>(INITIAL_MEMORY);
  const [showMemory, setShowMemory] = useState(false);
  const [registry, setRegistry] = useState<NeuralEvent[]>([]);

  // Initial Load + Event Listeners for Live Updates
  useEffect(() => {
    const loadData = () => {
        const loadedMem = memoryService.loadMemoryFromLocal();
        if (loadedMem) setMemory(loadedMem);
        
        const loadedReg = registryService.getEvents();
        setRegistry(loadedReg);
    };

    // Load initially
    loadData();

    // Listen for updates from other services
    const handleUpdate = () => loadData();
    
    if (typeof window !== 'undefined') {
        window.addEventListener('NEURAL_REGISTRY_UPDATE', handleUpdate);
        window.addEventListener('NEURAL_MEMORY_UPDATE', handleUpdate);
    }

    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('NEURAL_REGISTRY_UPDATE', handleUpdate);
            window.removeEventListener('NEURAL_MEMORY_UPDATE', handleUpdate);
        }
    };
  }, []);

  return {
    memory,
    setMemory,
    showMemory,
    setShowMemory,
    registry,
    setRegistry
  };
};
