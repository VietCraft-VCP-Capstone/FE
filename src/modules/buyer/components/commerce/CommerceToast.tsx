import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastTone = 'success' | 'error';
export interface ToastAction {
  label: string;
  onClick: () => void;
}
export interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
}

/** Một toast tại một thời điểm; toast mới thay toast cũ và hẹn giờ lại. */
export function useCommerceToast(duration = 3200) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((message: string, tone: ToastTone = 'success', action?: ToastAction) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone, action });
    const ms = tone === 'error' || action ? duration + 2000 : duration;
    timer.current = setTimeout(() => setToast(null), ms);
  }, [duration]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { toast, show, dismiss };
}

export function CommerceToast({ toast, onDismiss }: { toast: ToastState | null; onDismiss: () => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-[9999] flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6 sm:justify-end lg:bottom-8">
      {toast && (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          className="vc-toast pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl bg-[#330033] px-4 py-3 text-white shadow-[0_18px_40px_rgba(51,0,51,0.28)]"
        >
          {toast.tone === 'success'
            ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#94FC7E]" />
            : <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#fda4af]" />}
          <p className="m-0 text-[13.5px] font-medium leading-snug">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => { toast.action?.onClick(); onDismiss(); }}
              className="shrink-0 text-[13.5px] font-semibold text-[#94FC7E] underline-offset-2 hover:underline"
            >
              {toast.action.label}
            </button>
          )}
          <button type="button" onClick={onDismiss} aria-label="Đóng thông báo" className="-mr-1 ml-1 rounded-full p-0.5 text-white/60 hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
