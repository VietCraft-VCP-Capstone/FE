import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);

    setToasts((prev) => {
      // Remove any existing toast with the exact same message to avoid duplicate spam
      const filtered = prev.filter(t => t.message !== message);
      // Limit to at most 2 active toasts so it never clutters the screen
      const limited = filtered.slice(-1);
      return [...limited, { id, message, type, title }];
    });

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <style>{`
        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-lg pointer-events-none">
        {toasts.map((toast) => {
          const borderColor =
            toast.type === 'success'
              ? '#008000'
              : toast.type === 'error'
              ? '#e11d48'
              : '#6366f1';

          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              style={{
                backgroundColor: '#fff',
                borderLeft: `4px solid ${borderColor}`,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                borderRadius: 8,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                animation: 'toastSlideUp 0.3s ease-out',
                cursor: 'pointer',
              }}
              className="pointer-events-auto border border-stone-100/80 transition-all hover:shadow-xl"
            >
              {toast.type === 'success' && (
                <CheckCircle2 size={20} color="#008000" strokeWidth={2.5} className="shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle size={20} color="#e11d48" strokeWidth={2.5} className="shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info size={20} color="#6366f1" strokeWidth={2.5} className="shrink-0" />
              )}

              <div className="flex-1">
                {toast.title && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#330033', marginBottom: 2 }}>
                    {toast.title}
                  </p>
                )}
                <span style={{ fontSize: 14, fontWeight: 600, color: '#330033' }}>
                  {toast.message}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
