import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { getAllQuotas, QuotaStatus } from '../lib/quotaManager';
import { X, Activity, Zap, Shield, Cpu } from 'lucide-react';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({ isOpen, onClose }) => {
  const [quotas, setQuotas] = useState<QuotaStatus[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuotas(getAllQuotas());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = (model: string) => {
    if (model.includes('veo')) return <Activity className="w-5 h-5 text-pink-400" />;
    if (model.includes('image')) return <Activity className="w-5 h-5 text-yellow-400" />;
    if (model.includes('pro')) return <Cpu className="w-5 h-5 text-purple-400" />;
    if (model.includes('lite')) return <Zap className="w-5 h-5 text-green-400" />;
    if (model.includes('gemma')) return <Shield className="w-5 h-5 text-orange-400" />;
    return <Activity className="w-5 h-5 text-blue-400" />;
  };

  const getProgressColor = (used: number, limit: number) => {
    const ratio = used / limit;
    if (ratio >= 0.9) return 'bg-red-500';
    if (ratio >= 0.7) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Kiểm soát Hạn mức (Quota)</h2>
                  <p className="text-xs text-zinc-500 font-medium">Phân bổ sử dụng tối ưu hàng ngày</p>
                </div>
              </div>
              <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white p-2">
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
              <div className="space-y-4">
                {quotas.map((quota) => (
                  <div key={quota.model} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {getIcon(quota.model)}
                        <div>
                          <h3 className="text-sm font-bold text-zinc-200">{quota.name}</h3>
                          <p className="text-[10px] text-zinc-500">{quota.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-white">{quota.used}</span>
                        <span className="text-xs text-zinc-500"> / {quota.limit}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(quota.used, quota.limit)}`}
                        style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                      />
                    </div>
                    
                    {/* Strategy Text */}
                    <div className="mt-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {quota.model === 'gemini-3.1-pro-preview' && <span><strong className="text-purple-400">Pro Research:</strong> Mô hình tư duy mạnh nhất cho gói Pro. Dùng cho các yêu cầu phức tạp nhất.</span>}
                        {quota.model === 'gemini-3.1-flash-image-preview' && <span><strong className="text-yellow-400">Banana 2:</strong> Ưu tiên số 1 cho tạo ảnh gói Pro. Chất lượng và tốc độ cân bằng hoàn hảo.</span>}
                        {quota.model === 'gemini-2.5-flash-image-preview' && <span><strong className="text-blue-400">Free Image:</strong> Ngựa thồ tạo ảnh cho gói Free. Ổn định và nhanh chóng.</span>}
                        {quota.model.includes('gemma') && <span><strong className="text-orange-400">Gemma 4:</strong> Ưu tiên nghiên cứu cho gói Free. Phản hồi thông minh, bảo mật cao.</span>}
                        {quota.model.includes('veo') && <span><strong className="text-pink-400">Cinematic:</strong> Dùng cho các tác vụ tạo video. Bản Pro có giới hạn khắt khe hơn bản Fast.</span>}
                        {quota.model.includes('lite') && <span><strong className="text-green-400">Speed:</strong> Dùng khi cần phản hồi tức thì. Hạn mức cực kỳ dư dả.</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-300 leading-relaxed">
                  <strong className="text-blue-400">💡 Mẹo tối ưu:</strong> Để tận dụng tối đa các mô hình này trên tài khoản miễn phí mà không bị gián đoạn, bạn nên phân bổ công việc theo "sức mạnh" và "hạn mức" của từng con như trên.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
