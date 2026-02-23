import React, { useState, useCallback } from 'react';
import { MessageRole } from '../types';
import { fileToBase64 } from '../lib/utils';

interface UseFileHandlerProps {
  addMessage: (msg: any) => void;
  setCurrentImage: (img: string | null) => void;
}

export const useFileHandler = ({ addMessage, setCurrentImage }: UseFileHandlerProps) => {
  const [pendingRefImage, setPendingRefImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File, isRef: boolean = false) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      if (isRef) {
        setPendingRefImage(base64);
        addMessage({ role: MessageRole.SYSTEM, text: `[SYSTEM] Đã ghi nhận ảnh tham chiếu: ${file.name}` });
      } else {
        const label = `USER-${Math.random().toString(36).substring(7).toUpperCase()}`;
        addMessage({ 
          role: MessageRole.USER, 
          text: `[UPLOAD] Đã tải lên tài nguyên: ${file.name}`,
          image: base64,
          imageLabel: label
        });
        setCurrentImage(base64);
      }
    } catch (e) {
      console.error("Upload error:", e);
      addMessage({ role: MessageRole.ASSISTANT, text: "❌ Lỗi khi đọc file ảnh." });
    }
  };

  const triggerUpload = (isRef: boolean = false) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'hidden';
    document.body.appendChild(input);
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file, isRef);
      document.body.removeChild(input);
    };
    
    input.click();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  return {
    pendingRefImage,
    setPendingRefImage,
    isDragging,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileUpload,
    triggerUpload
  };
};