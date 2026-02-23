
export interface MaturityCriteria {
  label: string;
  score: number; // 0-100
  feedback: string;
}

export interface MaturityScore {
  totalScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  summary: string;
  criteria: MaturityCriteria[];
}

export interface AdCampaignData {
  headline: string;
  caption: string;
  visualPrompt: string;
  targetAudience: string;
  tone: string;
}

export interface BatchJob {
  id: string;
  file: File;
  originalUrl: string;
  thumbnailUrl: string;
  status: ProcessStatus;
  resultUrl?: string; 
  resultJson?: string; 
  typeSpecimenUrl?: string; 
  maskUrl?: string; 
  dimensions: { width: number, height: number };
  error?: string;
  tier?: ExecutionTier;
  mockupContext?: string; 
  extractedAssets?: ExtractedAsset[]; 
  progress?: number; 
  progressMessage?: string;
  fontFamilyName?: string;
  previewGlyphs?: Array<{id: string, char: string, path: string, width: number}>; 
  glyphPreviews?: Record<string, string>;
  refreshedFrom?: string;
  refreshStrategy?: RefreshStrategy;
  viralPlan?: ViralStoryPlan;
  viralScore?: ViralScore;
  videoUrl?: string; 
  campaignData?: AdCampaignData;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export type ScenarioCategory = 
  | 'E-commerce' 
  | 'Real Estate' 
  | 'Social Media' 
  | 'Branding' 
  | 'Logo Design'
  | 'Event & Wedding' 
  | 'Food & Beverage' 
  | 'Enterprise' 
  | 'Style Transfer'
  | 'UX/UI Design'
  | 'Product Design'
  | 'Product Document' 
  | 'Marketing & Ads'
  | 'Multimedia'
  | 'Print Design'
  | 'Packaging'
  | 'Floor Plan'
  | 'Signage'
  | 'Fashion'
  | 'SOP Management'
  | 'Creative Studio'; 

export type AgentRole = 
  | 'MasterOrchestrator' 
  | 'StrategicCounsel' 
  | 'PixelSmith'   
  | 'Visionary'    
  | 'Wordsmith'    
  | 'Architect'    
  | 'Sentinel'     
  | 'MotionMaster' 
  | 'DepthMaster'
  | 'TypographyExpert' 
  | 'LayoutMaster'
  | 'WorkflowMaster';

export interface WorkflowTask {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  assignedAgent: AgentRole;
  description: string;
  handoffTo?: string;
}

export interface SmartAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  prompt: string;
  type: 'primary' | 'creative' | 'technical';
}

export interface GuidedPath {
  title: string;
  reason: string;
  nextStep: string;
}

export interface BlueprintElement {
  id: string;
  label: string;
  type: 'text' | 'graphic' | 'logo' | 'background' | 'structure';
  boundingBox: { ymin: number; xmin: number; ymax: number; xmax: number };
  properties: {
    textContent?: string;
    fontInfo?: string;
    colorHex?: string;
  };
  extractedUri?: string; 
}

export interface VectorBlueprint {
  analysisSummary: string;
  dimensions: { width: string; height: string };
  colorPalette: { hex: string; usage: string }[];
  elements: BlueprintElement[];
}

export interface StrategicDNA {
  archetype: string;       
  archetypeIcon: string;   
  coreValues: string[];    
  marketPosition: string;  
  toneOfVoice: string;     
  successProbability: number; 
  riskFactor: string;      
}

export interface ContentProposal {
  conceptName: string;
  toneOfVoice: string;
  technicalSpecs: { label: string; value: string }[];
  frontSide: {
    goal: string;
    headline: string;
    subline: string;
    branding: string;
    visualNotes: string;
  };
  backSide: {
    goal: string;
    contentPoints: string[];
    footerInfo: string;
    contactInfo?: string;
  };
  designLanguage: {
    colors: string[];
    visualVibe: string;
    forbiddenElements: string[];
  };
  aiPrompts: {
    front: string;
    back: string;
  };
  strategy: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Workflow {
  id: string;
  name: string;
  type: string;
  status: 'gathering' | 'planning' | 'executing' | 'completed' | 'failed';
  progress: number;
  tasks: WorkflowTask[];
  gatheredInfo: Record<string, any>;
  resultImages?: string[];
  strategicBrief?: {
    brandFocus: string;
    visualVibe: string;
    marketStance: string;
    contentProposal?: ContentProposal;
  };
  vectorBlueprint?: VectorBlueprint;
  strategicDNA?: StrategicDNA; 
}

export interface EntityRecord {
  name: string;
  type: string;
  attributes: string[];
  lastUpdated: string;
}

export type ThinkingLevel = 'FAST' | 'BALANCED' | 'DEEP' | 'MAXIMUM';

export interface MemoryInsight {
  currentFocus: string;
  transientPreferences: string[];
  semanticKB: {
    projects: string[];
    technicalRules: string[];
    aestheticEvolution: string;
    strategicGoals: string[];
    creativeDrift: number;
    styleTrends: string[];
    thinkingPreference?: ThinkingLevel; 
  };
  entities: EntityRecord[];
  coreIntent: string;
  systemAuthorityLevel: number;
}

export interface NeuralEvent {
  id: string;
  timestamp: string;
  type: 'GENERATION' | 'EDIT' | 'MEMORY_DISTILL' | 'UPSCALE' | 'WORKFLOW_INIT' | 'EXTRACTION';
  metadata: {
    model: string;
    systemPrompt?: string;
    userPrompt?: string;
    driftLevel?: number;
    latency?: number;
    tokenEstimate?: number;
    status: 'SUCCESS' | 'REGRESSION_ALERT' | 'FAILED';
  };
  snapshot: Partial<MemoryInsight>;
}

export interface AgentStep {
  agent: AgentRole;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  timestamp?: string;
  details?: string;
  reasoning?: string;
}

export interface NeuralTrace {
  driftUsed: number;
  memoryAccessed: string[]; 
  adaptationStrategy: string; 
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  image?: string;
  imageExpired?: boolean; 
  imageLabel?: string; 
  refImage?: string; 
  refImageLabel?: string; 
  prevImage?: string;
  originalPrompt?: string;
  pendingMask?: string;
  pendingRefImage?: string;
  timestamp: Date;
  isProcessing?: boolean;
  isUpscaling?: boolean; 
  isUpscaled?: boolean; 
  agentSteps?: AgentStep[];
  feedback?: 'like' | 'dislike';
  masterOversight?: string; 
  neuralPulse?: boolean;
  neuralTrace?: NeuralTrace; 
  maturityScore?: MaturityScore; // NEW
  eventId?: string;
  workflowId?: string;
  workflowAction?: 'confirm_plan' | 'adjustment_requested' | 'smart_decision' | 'confirm_content';
  workflowTasks?: WorkflowTask[];
  strategicBrief?: {
    brandFocus: string;
    visualVibe: string;
    marketStance: string;
    contentProposal?: ContentProposal;
  };
  vectorBlueprint?: VectorBlueprint;
  strategicDNA?: StrategicDNA; 
  smartActions?: SmartAction[];
  guidedPaths?: GuidedPath[];
  groundingSources?: GroundingSource[];
}

export interface TaskLog {
  taskName: string;
  completedSteps: number;
  totalSteps: number;
  status: string;
  history: {
    timestamp: string;
    agent: AgentRole;
    message: string;
    details?: string;
  }[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
  category: ScenarioCategory;
  isWorkflow?: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
  color?: string; 
}

export interface Pin {
  id: string;
  x: number;
  y: number;
  note: string;
}

export interface Stroke {
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface EditorState {
  isOpen: boolean;
  image: string | null;
  imageLabel?: string;
  strokes: Stroke[];
  pins: Pin[];
  currentStroke: Stroke | null;
  isExtractionMode?: boolean;
  isMockupMode?: boolean; 
}

export type ProcessStatus = 'queued' | 'preprocessing' | 'matting' | 'refining' | 'rescue_queued' | 'rescuing' | 'completed' | 'failed' | 'analyzing_context' | 'placing_neural' | 'decomposing' | 'localizing' | 'vectorizing' | 'refreshing' | 'scripting' | 'rendering_video' | 'visualizing_hooks' | 'drafting_content' | 'rendering_visuals';

export type ExecutionTier = 'HEAVY' | 'MEDIUM' | 'LIGHT' | 'BATCH' | 'RESCUE';

export interface ExtractedAsset {
  id: string;
  name: string;
  flattenedUrl: string;
  rebrandedUrl?: string; 
  rebrandStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  layeringStatus?: 'pending' | 'processing' | 'completed' | 'failed'; 
  layers: {
    background?: string; 
    typography?: string; 
    graphics?: string; 
  };
}

export type RefreshStrategy = 'SOFT' | 'HARD' | 'HYBRID';
export type RefreshScope = 'ALL' | 'TAG' | 'DATE';

export interface ViralShot {
  shot_id: string;
  role: 'Hook' | 'Body' | 'Twist' | 'Ending' | 'CTA';
  duration: number; 
  visual_prompt: string;
  audio_script: string;
  viral_tech: string; 
  keyframeImage?: string; 
}

export interface HookVariant {
  id: string;
  title: string;
  pattern: string; 
  script: string;
  visual_prompt: string;
  keyframeImage?: string; 
}

export interface SocialPost {
  platform: string;
  content: string;
  hashtags: string[];
}

export interface InstaQuote {
  text: string;
  style: string;
  imageUrl?: string; // Stores the generated visual
}

export interface ViralStoryPlan {
  hookVariants?: HookVariant[]; 
  selectedHookId?: string;      
  twist: string;
  ending: string;
  shots: ViralShot[];
  primaryPattern?: string;
  secondaryPattern?: string;
  shareTrigger?: string;
  hook?: string;
  socialPosts?: SocialPost[]; 
  instagramQuotes?: InstaQuote[];
}

export interface ViralScore {
  hookStrength: number;
  retentionLogic: number;
  sharePotential: number;
  totalScore: number;
  notes: string;
}

export interface GlyphData {
  id: string;
  char: string;
  path: string;
  width: number;
}
