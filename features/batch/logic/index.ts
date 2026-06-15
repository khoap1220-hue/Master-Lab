export { globalAgentRegistry } from './registry';
export type { AgentMetadata } from './registry';

// Import all processors to register them automatically
import './batchProcessors';
import './adCampaignProcessor';
import './authenticReviewProcessor';
import './automationMultiTaskProcessor';
import './floorplanProcessor';
import './omniLoraProcessor';
import './omniSliderProcessor';
import './photoProcessor';
import './productShootProcessor';
import './studioVideoProcessor';
import './viral/workflow';
