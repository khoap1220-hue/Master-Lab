
import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, MessageRole, SmartAction } from '../types';
import MessageBubble from './MessageBubble';
import GeneratedImage from './GeneratedImage';

interface ChatStreamProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSmartAction: (action: SmartAction) => void;
  onConfirmPlan: (workflowId: string) => void;
  onEditImage: (imageUrl: string, label: string) => void;
  onUpscaleImage: (imageUrl: string, label: string) => void;
  onRemoveBg: (imageUrl: string, label: string) => void;
}

const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  isProcessing,
  onSmartAction,
  onConfirmPlan,
  onEditImage,
  onUpscaleImage,
  onRemoveBg
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar scroll-smooth">
      {messages.map((msg) => (
        <div key={msg.id} className="w-full">
          <MessageBubble 
            msg={msg} 
            onSmartAction={onSmartAction} 
            onConfirmPlan={() => {
                if (msg.workflowId) onConfirmPlan(msg.workflowId);
            }} 
          />
          
          {msg.image ? (
            <GeneratedImage
              image={msg.image}
              label={msg.imageLabel || 'IMG'}
              text={msg.text}
              isProcessing={isProcessing}
              isUpscaled={msg.isUpscaled}
              isUpscaling={msg.isUpscaling}
              onEdit={() => onEditImage(msg.image!, msg.imageLabel || 'IMG')}
              onUpscale={() => onUpscaleImage(msg.image!, msg.imageLabel || 'IMG')}
              onRemoveBg={() => onRemoveBg(msg.image!, msg.imageLabel || 'IMG')}
            />
          ) : msg.imageExpired ? (
            <div className="mt-6 max-w-2xl md:ml-18 p-4 border border-slate-800 rounded-2xl bg-slate-900/50 flex items-center gap-4 animate-in fade-in">
               <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700 shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Bộ nhớ đệm đã được giải phóng</p>
                  <p className="text-[10px] text-slate-600">Hình ảnh cũ đã được tự động xóa để tối ưu hóa hiệu suất trình duyệt. (ID: {msg.imageLabel})</p>
               </div>
            </div>
          ) : null}
        </div>
      ))}
      
      <div ref={chatEndRef} className="h-4" />
    </main>
  );
};

export default ChatStream;
