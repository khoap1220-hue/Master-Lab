
import { ScenarioCategory } from '../../types';
import { CategoryConfigDef, DEFAULT_CONFIG, CONFIG_MAP } from './config/mappings';

// Aggregating exports for backward compatibility and cleanliness
export * from './config/packs';
export * from './config/mappings';

/**
 * Provides dynamic UI configuration for the Sidebar automation forms based on the active category.
 */
export const getCategoryConfig = (category: ScenarioCategory): CategoryConfigDef => {
  return { ...DEFAULT_CONFIG, title: category, ...CONFIG_MAP[category] };
};
