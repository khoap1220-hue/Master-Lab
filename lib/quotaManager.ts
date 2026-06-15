export interface QuotaStatus {
  model: string;
  used: number;
  limit: number;
  name: string;
  description: string;
}

const QUOTAS = {
  'gemini-3.1-pro-preview': { limit: 15, name: 'Gemini 3.1 Pro', description: 'Nghiên cứu sâu (10-15 câu/ngày)' },
  'gemini-3.5-flash': { limit: 1500, name: 'Gemini 3.5 Flash', description: 'Việc thường ngày (1.500 câu/ngày)' },
  'gemini-3-flash-preview': { limit: 1500, name: 'Gemini 3.1 Flash', description: 'Việc thường ngày (1.500 câu/ngày)' },
  'gemini-3.1-flash-lite-preview': { limit: 5000, name: 'Gemini 3.1 Lite', description: 'Việc tốc độ (Hạn mức dư dả)' },
  'gemma-4-31b-it': { limit: 1500, name: 'Gemma 4 (31B)', description: 'Nghiên cứu Free (1.500 câu/ngày)' },
  'gemma-4-26b-it': { limit: 1500, name: 'Gemma 4 (26B)', description: 'Nghiên cứu Free (1.500 câu/ngày)' },
  'gemini-3-pro-image-preview': { limit: 50, name: 'Gemini 3 Pro Image', description: 'Tạo ảnh Pro (50 ảnh/ngày)' },
  'gemini-3.1-flash-image-preview': { limit: 500, name: 'Gemini 3.1 Flash Image (Banana)', description: 'Tạo ảnh tốc độ (500 ảnh/ngày)' },
  'gemini-2.5-flash-image-preview': { limit: 100, name: 'Gemini 2.5 Flash Image', description: 'Tạo ảnh Free (100 ảnh/ngày)' },
  'veo-3.1-generate-preview': { limit: 10, name: 'Veo 3.1 Pro', description: 'Video chất lượng cao (10 video/ngày)' },
  'veo-3.1-fast-generate-preview': { limit: 50, name: 'Veo 3.1 Fast', description: 'Video tốc độ (50 video/ngày)' },
};

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

const getStorageKey = (model: string) => `quota_${getTodayKey()}_${model}`;

export const getQuota = (model: string): QuotaStatus | null => {
  const config = QUOTAS[model as keyof typeof QUOTAS];
  if (!config) return null;

  let used = 0;
  if (typeof window !== 'undefined') {
    used = parseInt(localStorage.getItem(getStorageKey(model)) || '0', 10);
  }

  return {
    model,
    used,
    limit: config.limit,
    name: config.name,
    description: config.description
  };
};

export const incrementQuota = (model: string) => {
  if (typeof window === 'undefined') return;
  const config = QUOTAS[model as keyof typeof QUOTAS];
  if (!config) return;

  const key = getStorageKey(model);
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, (current + 1).toString());
};

export const getAllQuotas = (): QuotaStatus[] => {
  return Object.keys(QUOTAS).map(model => getQuota(model)!);
};

export const checkQuotaAvailable = (model: string): boolean => {
  const quota = getQuota(model);
  if (!quota) return true; // No quota tracked for this model
  return quota.used < quota.limit;
};
