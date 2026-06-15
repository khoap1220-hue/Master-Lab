


import { isProTier } from '../config/models';
import { getKeyPool } from './keyManager';

// --- TITAN VELOCITY KERNEL (v10.0.0 - UNLEASHED) ---
// Hệ thống điều phối tác vụ hiệu năng cao dựa trên phần cứng.

export type ExecutionTier = 'HEAVY' | 'MEDIUM' | 'LIGHT' | 'BATCH' | 'RESCUE';

interface TierConfig {
  id: ExecutionTier;
  concurrency: number; 
  tierDelay: number;   
  timeout: number;     
  label: string;
}

// 1. HARDWARE DETECTION (Tự động nhận diện sức mạnh phần cứng)
const LOGICAL_CORES = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
const IS_HIGH_PERFORMANCE = LOGICAL_CORES >= 8;
const IS_ULTRA_PERFORMANCE = LOGICAL_CORES >= 12;

console.log(`[TITAN CORE] Hardware Detected: ${LOGICAL_CORES} Logical Cores.`);
console.log(`[TITAN CORE] Mode: ${IS_ULTRA_PERFORMANCE ? 'GOD_SPEED' : IS_HIGH_PERFORMANCE ? 'TURBO' : 'STANDARD'}`);

// 2. DYNAMIC CONFIGURATION (Cấu hình động - Bão hòa phần cứng)
// OPTIMIZATION: Reduce concurrency and increase delays for free tier to prevent rate limits
export const getExecutionTiers = (): Record<ExecutionTier, TierConfig> => {
  const isPro = isProTier();
  const poolSize = getKeyPool().length;
  
  // Scale concurrency for free tier if they have a pool
  // Max concurrency for free pool is capped to prevent overall system abuse
  const poolBonus = !isPro && poolSize > 1 ? Math.min(5, Math.floor(poolSize / 1.5)) : 0;

  return {
    HEAVY: { 
      id: 'HEAVY', 
      concurrency: isPro ? (IS_ULTRA_PERFORMANCE ? 4 : (IS_HIGH_PERFORMANCE ? 3 : 2)) : (1 + poolBonus), 
      tierDelay: isPro ? (IS_HIGH_PERFORMANCE ? 50 : 200) : (poolBonus > 0 ? 500 : 1000),
      timeout: 1500000, 
      label: 'PRO CORE (TITAN)' 
    },
    MEDIUM: { 
      id: 'MEDIUM', 
      concurrency: isPro ? Math.max(4, LOGICAL_CORES) : (2 + poolBonus), 
      tierDelay: isPro ? (IS_HIGH_PERFORMANCE ? 20 : 100) : (poolBonus > 0 ? 300 : 500), 
      timeout: 600000, 
      label: 'FLASH CORE (VELOCITY)' 
    },
    LIGHT: { 
      id: 'LIGHT', 
      concurrency: isPro ? Math.min(64, LOGICAL_CORES * 4) : (4 + poolBonus * 2), 
      tierDelay: isPro ? 0 : (poolBonus > 0 ? 100 : 200),
      timeout: 120000, 
      label: 'LITE CORE (INSTANT)' 
    },
    BATCH: {
      id: 'BATCH',
      concurrency: isPro ? Math.max(6, Math.floor(LOGICAL_CORES * 1.5)) : (2 + poolBonus), 
      tierDelay: isPro ? (IS_HIGH_PERFORMANCE ? 100 : 500) : (poolBonus > 0 ? 1000 : 2000), 
      timeout: 1800000, 
      label: 'BATCH ENGINE (SATURATION)'
    },
    RESCUE: { 
      id: 'RESCUE', 
      concurrency: isPro ? 2 : 1, 
      tierDelay: isPro ? 2000 : 4000, 
      timeout: 600000, 
      label: 'RESCUE SQUAD' 
    }
  };
};

export const EXECUTION_TIERS = getExecutionTiers();

export type TaskType = 
  | 'ANALYSIS_DEEP' 
  | 'ANALYSIS_FAST'
  | 'RESEARCH_DEEP'
  | 'STRATEGY_PLANNING'
  | 'REPORTING'
  | 'IMAGE_GEN_4K'
  | 'IMAGE_GEN_FAST'
  | 'IMAGE_GEN_BATCH'
  | 'IMAGE_EDIT_COMPLEX'
  | 'MASKING_SMART'
  | 'UPSCALE_HighFidelity'
  | 'SCAN_PROCESSING'
  | 'BLUEPRINT_DECOMPOSITION'
  | 'MEMORY_DISTILL'
  | 'BRAINSTORMING'
  | 'NAMING_CREATION'
  | 'COPYWRITING_FAST'
  | 'CREATIVE_WRITING'
  | 'VIDEO_GEN';

// Optimized Routing for Speed
const ROUTING_MATRIX: Record<TaskType, ExecutionTier> = {
  'ANALYSIS_DEEP': 'HEAVY',
  'RESEARCH_DEEP': 'HEAVY',
  'STRATEGY_PLANNING': 'HEAVY',
  'IMAGE_GEN_4K': 'HEAVY',
  'IMAGE_EDIT_COMPLEX': 'HEAVY',
  'UPSCALE_HighFidelity': 'HEAVY',
  'SCAN_PROCESSING': 'HEAVY', 
  'BLUEPRINT_DECOMPOSITION': 'HEAVY',
  'VIDEO_GEN': 'RESCUE', // Video generation is extremely heavy and slow
  'IMAGE_GEN_BATCH': 'BATCH', 
  'IMAGE_GEN_FAST': 'MEDIUM',
  'MASKING_SMART': 'MEDIUM', 
  'COPYWRITING_FAST': 'MEDIUM', // Upgraded to MEDIUM to allow 5 mins timeout
  'CREATIVE_WRITING': 'MEDIUM', // New Task Type
  'ANALYSIS_FAST': 'MEDIUM', // Upgraded to MEDIUM to allow 5 mins timeout for intent analysis
  'REPORTING': 'LIGHT',
  'MEMORY_DISTILL': 'LIGHT',
  'BRAINSTORMING': 'LIGHT', 
  'NAMING_CREATION': 'LIGHT'
};

interface QueueItem<T> {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  onStart?: () => void;
  tier: ExecutionTier;
  addedAt: number;
}

class TieredExecutor {
  private queues: Record<ExecutionTier, QueueItem<any>[]> = {
    HEAVY: [], MEDIUM: [], LIGHT: [], BATCH: [], RESCUE: []
  };
  
  private activeCounts: Record<ExecutionTier, number> = {
    HEAVY: 0, MEDIUM: 0, LIGHT: 0, BATCH: 0, RESCUE: 0
  };
  
  private lastTierDispatch: Record<ExecutionTier, number> = {
    HEAVY: 0, MEDIUM: 0, LIGHT: 0, BATCH: 0, RESCUE: 0
  };

  private lastGlobalDispatch = 0;
  // Minimize global gap to near-zero for high-end devices
  private GLOBAL_MIN_GAP = IS_HIGH_PERFORMANCE ? 10 : 50; 

  public async execute<T>(
    tier: ExecutionTier, 
    task: () => Promise<T>, 
    onStart?: () => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queues[tier].push({ 
        task, 
        resolve, 
        reject, 
        onStart, 
        tier,
        addedAt: Date.now()
      });
      // Trigger immediately
      this.processQueues();
    });
  }

  private processQueues() {
    // Process high priority tiers first
    const tiers: ExecutionTier[] = ['RESCUE', 'LIGHT', 'MEDIUM', 'HEAVY', 'BATCH'];
    
    // Non-blocking loop via setTimeout to allow UI updates between dispatches
    // and prevent throttling when the browser tab is in the background.
    setTimeout(() => {
        tiers.forEach(tier => {
            // Attempt to dispatch as many as possible up to concurrency limit
            // Titan Mode: Dispatch MULTIPLE tasks in one frame if slots available
            while (this.canDispatchImmediate(tier)) {
                this.dispatchTask(tier);
            }
        });
    }, 0);
  }

  private canDispatchImmediate(tier: ExecutionTier): boolean {
    const config = EXECUTION_TIERS[tier];
    if (this.queues[tier].length === 0) return false;
    
    // Strict concurrency check
    if (this.activeCounts[tier] >= config.concurrency) return false;

    // Rate Limiting Logic (Throttling)
    const now = Date.now();
    const tierElapsed = now - this.lastTierDispatch[tier];
    const globalElapsed = now - this.lastGlobalDispatch;

    // If High Performance mode, we ignore most delays unless it's HEAVY
    if (!IS_HIGH_PERFORMANCE) {
        if (tierElapsed < config.tierDelay) return false;
        if (globalElapsed < this.GLOBAL_MIN_GAP) return false;
    } else {
        // For heavy tasks on high-end, still respect a tiny safety gap to prevent network choking
        if (tier === 'HEAVY' && tierElapsed < config.tierDelay) return false;
    }

    return true;
  }

  private dispatchTask(tier: ExecutionTier) {
    const item = this.queues[tier].shift();
    if (!item) return;

    this.lastGlobalDispatch = Date.now();
    this.lastTierDispatch[tier] = Date.now();
    this.activeCounts[tier]++;
    
    if (item.onStart) item.onStart();

    this.executeItem(tier, item);
  }

  private async executeItem(tier: ExecutionTier, item: QueueItem<any>) {
    const config = EXECUTION_TIERS[tier];
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => {
          reject(new Error(`⏱️ [Titan Timeout] Task (${config.label}) exceeded ${config.timeout/1000}s limit.`));
      }, config.timeout)
    );

    try {
        const result = await Promise.race([item.task(), timeoutPromise]);
        item.resolve(result);
    } catch (err: any) {
        item.reject(err);
    } finally {
        this.activeCounts[tier]--;
        // CHAIN REACTION: Immediately trigger next task check without waiting for polling
        this.processQueues(); 
    }
  }
}

export const GlobalExecutor = new TieredExecutor();

export const executeManagedTask = <T>(
  taskType: TaskType, 
  task: () => Promise<T>,
  onStart?: () => void
) => {
  const tier = ROUTING_MATRIX[taskType] || 'MEDIUM'; 
  return GlobalExecutor.execute(tier, task, onStart);
};

export const executeDirectTier = <T>(
  tier: ExecutionTier,
  task: () => Promise<T>,
  onStart?: () => void
) => {
  return GlobalExecutor.execute(tier, task, onStart);
}
