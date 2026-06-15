import React, { useState, useEffect } from 'react';
import { getKeyPool, setKeyPool, addKeysToPool, removeKeyFromPool, clearKeyPool } from '../lib/keyManager';
import { Button } from './ui/Button';
import { X, Key, Trash2, Plus, Save } from 'lucide-react';

interface KeyPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyPoolModal: React.FC<KeyPoolModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [inputKeys, setInputKeys] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKeys(getKeyPool());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddKeys = () => {
    // Split by comma, newline, or space
    const newKeys = inputKeys.split(/[\n, ]+/).filter(k => k.trim().length > 0);
    if (newKeys.length > 0) {
      addKeysToPool(newKeys);
      setKeys(getKeyPool());
      setInputKeys('');
    }
  };

  const handleRemoveKey = (keyToRemove: string) => {
    removeKeyFromPool(keyToRemove);
    setKeys(getKeyPool());
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ Key trong Pool?')) {
      clearKeyPool();
      setKeys([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quản lý Key Pool</h2>
              <p className="text-sm text-zinc-400">Tự động luân chuyển API Key khi bị giới hạn (Rate Limit)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-800">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Add Keys Section */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-zinc-300">Thêm API Key mới</label>
            <textarea 
              value={inputKeys}
              onChange={(e) => setInputKeys(e.target.value)}
              placeholder="Dán danh sách API Key vào đây (mỗi key 1 dòng hoặc cách nhau bằng dấu phẩy)..."
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 font-mono focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <div className="flex justify-end">
              <Button onClick={handleAddKeys} disabled={!inputKeys.trim()} className="bg-blue-600 hover:bg-blue-500 text-white">
                <Plus size={16} className="mr-2" /> Thêm vào Pool
              </Button>
            </div>
          </div>

          {/* Current Pool Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-300">Danh sách Key hiện tại ({keys.length})</label>
              {keys.length > 0 && (
                <button onClick={handleClearAll} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Trash2 size={14} /> Xóa tất cả
                </button>
              )}
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              {keys.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  Chưa có Key nào trong Pool. Hãy thêm Key để sử dụng tính năng luân chuyển tự động.
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800 max-h-60 overflow-y-auto">
                  {keys.map((key, index) => (
                    <li key={index} className="p-3 flex items-center justify-between hover:bg-zinc-900 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">#{index + 1}</span>
                        <span className="text-sm font-mono text-zinc-300">
                          {key.substring(0, 8)}...{key.substring(key.length - 4)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveKey(key)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                        title="Xóa Key này"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-end">
          <Button onClick={onClose} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-white">
            Đóng
          </Button>
        </div>

      </div>
    </div>
  );
};
