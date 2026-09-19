import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ModalOverlay } from './ModalOverlay';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  hideCancel?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  hideCancel = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const iconByVariant = {
    danger: <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    info: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    primary: <Info className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
  };

  const bgIconByVariant = {
    danger: 'bg-rose-100 dark:bg-rose-950/60',
    warning: 'bg-amber-100 dark:bg-amber-950/60',
    info: 'bg-blue-100 dark:bg-blue-950/60',
    primary: 'bg-emerald-100 dark:bg-emerald-950/60',
  };

  const btnByVariant = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
    info: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
  };

  return (
    <ModalOverlay>
      <div 
        role="dialog" 
        aria-modal="true" 
        className="relative bg-white dark:bg-stone-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200/80 dark:border-stone-800"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Đóng"
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl flex-shrink-0 ${bgIconByVariant[variant]}`}>
            {iconByVariant[variant]}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {title}
            </h3>
            <div className="mt-2 text-sm text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-bold rounded-xl shadow-sm transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${btnByVariant[variant]}`}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
