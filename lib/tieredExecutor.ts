
import { AgentRole } from "../types";

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
export const EXECUTION_TIERS: Record<ExecutionTier, TierConfig> = {
  HEAVY: { 
    id: 'HEAVY', 
    // Ultra: 4 concurrent heavy tasks (Pro Vision). High: 3. Std: 2.
    concurrency: IS_ULTRA_PERFORMANCE ? 4 : (IS_HIGH_PERFORMANCE ? 3 : 2), 
    tierDelay: IS_HIGH_PERFORMANCE ? 50 : 200, // Minimal delay for high-end
    timeout: 600000, // 10 mins for heavy rendering
    label: 'PRO CORE (TITAN)' 
  },
  MEDIUM: { 
    id: 'MEDIUM', 
    // Scale aggressively with cores
    concurrency: Math.max(4, LOGICAL_CORES), 
    tierDelay: IS_HIGH_PERFORMANCE ? 20 : 100, 
    timeout: 300000, 
    label: 'FLASH CORE (VELOCITY)' 
  },
  LIGHT: { 
    id: 'LIGHT', 
    // Massive parallelism for chat/analysis/logic. 
    concurrency: Math.min(64, LOGICAL_CORES * 4), 
    tierDelay: 0, // ZERO DELAY for light tasks
    timeout: 60000, 
    label: 'LITE CORE (INSTANT)' 
  },
  BATCH: {
    id: 'BATCH',
    // Batch engine scales linearly with cores for maximum throughput
    concurrency: Math.max(6, Math.floor(LOGICAL_CORES * 1.5)), 
    tierDelay: IS_HIGH_PERFORMANCE ? 100 : 500, 
    timeout: 900000, // 15 mins for massive batches
    label: 'BATCH ENGINE (SATURATION)'
  },
  RESCUE: { 
    id: 'RESCUE', 
    concurrency: 2, 
    tierDelay: 2000, 
    timeout: 240000, 
    label: 'RESCUE SQUAD' 
  }
};

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
  | 'COPYWRITING_FAST';

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
  'IMAGE_GEN_BATCH': 'BATCH', 
  'IMAGE_GEN_FAST': 'MEDIUM',
  'MASKING_SMART': 'MEDIUM', 
  'COPYWRITING_FAST': 'MEDIUM', // Upgraded to MEDIUM to allow 5 mins timeout
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
    
    // Non-blocking loop via RAF to allow UI updates between dispatches
    requestAnimationFrame(() => {
        tiers.forEach(tier => {
            // Attempt to dispatch as many as possible up to concurrency limit
            // Titan Mode: Dispatch MULTIPLE tasks in one frame if slots available
            while (this.canDispatchImmediate(tier)) {
                this.dispatchTask(tier);
            }
        });
    });
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
