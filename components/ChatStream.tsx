
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, SmartAction } from '../types';
import MessageBubble from './MessageBubble';
import GeneratedImage from './GeneratedImage';
import { Button } from './ui/Button';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Show button if user has scrolled up more than 100px from the bottom
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(isScrolledUp);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar scroll-smooth relative"
    >
      <AnimatePresence initial={false}>
      {messages.map((msg) => (
        <motion.div 
          key={msg.id} 
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
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
              modelUsed={msg.modelUsed}
              onEdit={() => onEditImage(msg.image!, msg.imageLabel || 'IMG')}
              onUpscale={() => onUpscaleImage(msg.image!, msg.imageLabel || 'IMG')}
              onRemoveBg={() => onRemoveBg(msg.image!, msg.imageLabel || 'IMG')}
            />
          ) : msg.imageExpired ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-6 max-w-2xl md:ml-18 p-4 border border-zinc-800 rounded-2xl bg-zinc-900/50 flex items-center gap-4"
            >
               <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700 shadow-inner">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               </div>
               <div className="flex-1">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Bộ nhớ đệm đã được giải phóng</p>
                  <p className="text-[10px] text-zinc-600">Hình ảnh cũ đã được tự động xóa để tối ưu hóa hiệu suất trình duyệt. (ID: {msg.imageLabel})</p>
               </div>
            </motion.div>
          ) : null}
        </motion.div>
      ))}
      </AnimatePresence>
      
      <div ref={chatEndRef} className="h-4" />

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="sm"
          onClick={scrollToBottom}
          className="fixed bottom-32 right-8 md:right-12 rounded-full w-10 h-10 p-0 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4"
          title="Cuộn xuống dưới cùng"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </Button>
      )}
    </main>
  );
};

export default ChatStream;
