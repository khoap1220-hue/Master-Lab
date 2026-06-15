import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white font-sans p-8">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-xl">
                ⚠️
              </div>
              <h1 className="text-xl font-semibold text-red-400 uppercase tracking-widest">Hệ thống gián đoạn</h1>
            </div>
            <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
              Đã xảy ra lỗi không mong muốn trong quá trình xử lý. Vui lòng tải lại trang để khôi phục trạng thái.
            </p>
            <div className="bg-black/50 rounded-lg p-3 mb-6 overflow-auto max-h-32 border border-zinc-800">
              <code className="text-[10px] text-red-300 font-mono">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-500 text-white uppercase tracking-widest text-xs"
              onClick={() => window.location.reload()}
            >
              Khởi động lại Hệ thống
            </Button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
