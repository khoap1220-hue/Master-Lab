
import { MemoryInsight } from '../types';

// Re-export modular configurations
export * from './scenarios';
export * from './categories';

export const INITIAL_MEMORY: MemoryInsight = { 
  currentFocus: "Tiến hóa tri thức",
  transientPreferences: [],
  semanticKB: { 
      projects: [], 
      technicalRules: [], 
      aestheticEvolution: "Khởi tạo di sản", 
      strategicGoals: ["Định nghĩa phong cách"], 
      creativeDrift: 5, 
      styleTrends: [],
      thinkingPreference: 'BALANCED' // Default to Smart Balanced Mode
  },
  entities: [],
  coreIntent: "Kiến tạo di sản",
  systemAuthorityLevel: 10
};
