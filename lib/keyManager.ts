const STORAGE_KEY = 'gemini_api_key_pool';

export const getKeyPool = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse key pool', e);
  }
  return [];
};

export const setKeyPool = (keys: string[]) => {
  if (typeof window === 'undefined') return;
  const validKeys = keys.filter(k => k && k.trim().length > 0).map(k => k.trim());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(validKeys));
};

export const addKeysToPool = (keys: string[]) => {
  const current = getKeyPool();
  const newKeys = keys.filter(k => k && k.trim().length > 0).map(k => k.trim());
  const combined = Array.from(new Set([...current, ...newKeys]));
  setKeyPool(combined);
};

export const removeKeyFromPool = (key: string) => {
  const current = getKeyPool();
  setKeyPool(current.filter(k => k !== key.trim()));
};

export const clearKeyPool = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

// State for rotation and health
let currentKeyIndex = 0;
const keyCooldowns = new Map<string, number>();
const COOLDOWN_DURATION = 60000; // 1 minute cooldown for a key that fails

export const getFlashKey = (): string | null => {
  const pool = getKeyPool();
  if (pool.length === 0) {
    // Ưu tiên cao nhất cho GEMINI_API_KEY của AI Studio
    return process.env.GEMINI_API_KEY || process.env.API_KEY || null;
  }

  // Find the next healthy key starting from currentKeyIndex
  const now = Date.now();
  for (let i = 0; i < pool.length; i++) {
    const index = (currentKeyIndex + i) % pool.length;
    const key = pool[index];
    const cooldownUntil = keyCooldowns.get(key) || 0;
    
    if (now > cooldownUntil) {
      currentKeyIndex = index;
      return key;
    }
  }

  // If all keys are in cooldown, return the current one anyway (last resort)
  if (currentKeyIndex >= pool.length) currentKeyIndex = 0;
  return pool[currentKeyIndex];
};

export const getProKey = (): string | null => {
  // Ưu tiên tuyệt đối GEMINI_API_KEY từ server nền AI Studio
  return process.env.GEMINI_API_KEY || process.env.API_KEY || null;
};

export const getCurrentKey = (): string | null => {
  // If the user selected a custom key (which exists in the key pool), prioritize it.
  // Otherwise, fallback to the default dev system key (process.env.GEMINI_API_KEY).
  const pool = getKeyPool();
  if (pool.length > 0) {
    return getFlashKey();
  }
  return process.env.GEMINI_API_KEY || process.env.API_KEY || null;
};

export const reportKeyFailure = (key: string) => {
  if (!key) return;
  console.warn(`[KeyManager] ⚠️ Key ${key.substring(0, 8)}... reported failure. Cooling down.`);
  keyCooldowns.set(key, Date.now() + COOLDOWN_DURATION);
};

export const rotateKey = (): boolean => {
  const pool = getKeyPool();
  if (pool.length <= 1) return false;

  // Mark current key as failed if we are rotating due to an error
  const currentKey = pool[currentKeyIndex];
  if (currentKey) reportKeyFailure(currentKey);

  currentKeyIndex = (currentKeyIndex + 1) % pool.length;
  console.log(`[KeyManager] Rotated to key index ${currentKeyIndex + 1}/${pool.length}`);
  return true;
};

export const hasKeyPool = (): boolean => {
  return getKeyPool().length > 0;
};

export const getPoolStatus = () => {
  const pool = getKeyPool();
  return {
    size: pool.length,
    currentIndex: currentKeyIndex,
    activeKey: pool[currentKeyIndex] || null,
    cooldowns: Array.from(keyCooldowns.entries()).filter(([_, time]) => time > Date.now()).length
  };
};
