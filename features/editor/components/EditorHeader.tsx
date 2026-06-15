
import React from 'react';
import { Button } from '../../../components/ui/Button';

interface EditorHeaderProps {
  mode: 'draw' | 'erase' | 'pin' | 'extract' | 'enrich' | 'design_recovery' | 'mockup';
  onClose: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ mode, onClose }) => {
  let activeColor = 'bg-blue-600';
  let title = 'Xưởng Chỉnh Sửa';
  let subTitle = 'Tô vùng cần thay đổi hoặc xóa bỏ';
  
  if (mode === 'extract') {
    activeColor = 'bg-orange-500';
    title = 'Quét & Tách Nền Thông Minh';
    subTitle = 'Chọn vùng > Làm phẳng > Nâng cấp > Tách nền';
  } else if (mode === 'enrich') {
    activeColor = 'bg-purple-500';
    title = 'Phóng To Chi Tiết (Macro)';
    subTitle = 'Tái tạo chi tiết siêu nhỏ và chất liệu';
  } else if (mode === 'design_recovery') {
    activeColor = 'bg-cyan-500';
    title = 'Xuất Bản Thiết Kế';
    subTitle = 'Làm phẳng và xuất file thiết kế từ ảnh chụp';
  } else if (mode === 'mockup') {
    activeColor = 'bg-emerald-500';
    title = 'Neural Mockup Studio';
    subTitle = 'Bước 1: Tô vùng muốn đặt nội dung (Biển hiệu, Tường, Bao bì...)';
  }

  return (
    <div className="flex justify-between items-end mb-6 text-white">
      <div className="flex items-center gap-4">
        <div className={`w-1.5 h-10 rounded-full ${activeColor}`}></div>
        <div>
          <h3 className="text-2xl font-black tracking-tighter uppercase">{title}</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{subTitle}</p>
        </div>
      </div>
      <Button variant="outline" onClick={onClose} className="w-12 h-12 p-0 flex items-center justify-center bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-red-500/10 hover:text-red-500 transition-all">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </Button>
    </div>
  );
};

export default EditorHeader;
