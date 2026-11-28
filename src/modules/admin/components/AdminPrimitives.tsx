import React, { useCallback, useEffect, useId, useRef } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Search, X } from 'lucide-react';
import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  CARD_FOOTER,
  MODAL_FOOTER,
  MODAL_HEADER,
  MODAL_OVERLAY,
  MODAL_PANEL,
  MODAL_TITLE,
  cx,
} from './adminUi';


export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="m-0 text-[24px] font-extrabold tracking-[-0.02em] text-admin-ink">{title}</h1>
        {description && (
          <p className="mb-0 mt-1.5 max-w-[62ch] text-[13.5px] leading-[1.55] text-admin-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface StatItem {
  label: string;
  value: React.ReactNode;
  dot?: string;
  hint?: string;
}

export function StatStrip({ items, loading = false }: { items: StatItem[]; loading?: boolean }) {
  return (
    <div className={cx(CARD, 'mb-4 grid grid-cols-2 divide-admin-line md:grid-cols-4 md:divide-x')}>
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cx(
            'px-[18px] py-3.5',
            i < 2 && items.length > 2 && 'border-b border-admin-line md:border-b-0',
            i % 2 === 1 && 'border-l border-admin-line md:border-l-0'
          )}
        >
          <div className="text-[11.5px] font-bold uppercase tracking-[0.04em] text-admin-muted">{item.label}</div>
          <div className="mt-1 flex items-baseline gap-2">
            {item.dot && (
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.dot }} aria-hidden />
            )}
            {loading ? (
              <span className="my-1 block h-5 w-10 animate-pulse rounded bg-admin-line-soft motion-reduce:animate-none" />
            ) : (
              <span className="text-[21px] font-extrabold leading-none tabular-nums text-admin-ink">{item.value}</span>
            )}
            {item.hint && <span className="text-[12px] text-admin-muted">{item.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  const id = useId();
  return (
    <div className="relative flex w-full max-w-[380px] items-center gap-2.5 rounded-admin border border-[#d5ddd5] bg-white pl-3.5 pr-1.5 text-admin-muted transition-[border-color,box-shadow] duration-150 focus-within:border-admin-brand focus-within:shadow-[0_0_0_3px_rgba(26,107,26,0.1)] motion-reduce:transition-none">
      <Search size={17} aria-hidden />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="min-w-0 flex-1 border-none bg-transparent py-[9px] text-[13.5px] text-admin-ink outline-none placeholder:text-[#9aa6a0] [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Xoá từ khoá tìm kiếm"
        className={cx(
          'inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-admin-muted transition-[background-color,color,opacity] duration-150 hover:bg-admin-canvas hover:text-admin-ink motion-reduce:transition-none',
          value ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <X size={15} aria-hidden />
      </button>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-admin border border-[#d5ddd5] bg-white p-0.5"
    >
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              'inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[7px] border-none px-3 py-[7px] text-[12.5px] font-semibold leading-none transition-[background-color,color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-brand motion-reduce:transition-none',
              active ? 'bg-admin-brand text-white' : 'bg-transparent text-admin-muted hover:bg-admin-canvas hover:text-admin-ink'
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cx('tabular-nums', active ? 'text-white/75' : 'text-[#9aa6a0]')}>{opt.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const PILL_TONES = {
  brand: 'bg-admin-brand-050 text-admin-brand-600',
  neutral: 'bg-admin-line-soft text-[#7c8a83]',
  warn: 'bg-[#fff7ed] text-[#9a3412]',
  danger: 'bg-admin-danger-050 text-[#b91c1c]',
} as const;

export function StatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: keyof typeof PILL_TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-[5px] rounded-full px-[10px] py-[3px] text-[11px] font-bold tracking-[0.01em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']",
        PILL_TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

const ALERT_TONES = {
  danger: { cls: 'border-[#f6caca] bg-admin-danger-050 text-[#b91c1c]', icon: AlertCircle, role: 'alert' },
  warn: { cls: 'border-[#fdba74] bg-[#fff7ed] text-[#9a3412]', icon: AlertCircle, role: 'alert' },
  success: { cls: 'border-[#b7e0b7] bg-admin-brand-050 text-admin-brand-700', icon: CheckCircle2, role: 'status' },
} as const;

export function Alert({
  tone = 'danger',
  children,
  onDismiss,
}: {
  tone?: keyof typeof ALERT_TONES;
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const { cls, icon: Icon, role } = ALERT_TONES[tone];
  return (
    <div
      role={role}
      className={cx('mb-4 flex items-start gap-2.5 rounded-admin border px-[15px] py-[11px] text-[13px] font-medium', cls)}
    >
      <Icon size={16} className="mt-px shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="-my-1 -mr-1.5 inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-current opacity-70 transition-opacity duration-150 hover:opacity-100 motion-reduce:transition-none"
        >
          <X size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-admin-brand-050 text-admin-brand">
        <Icon size={20} />
      </span>
      <p className="m-0 text-[14.5px] font-semibold text-admin-ink">{title}</p>
      {description && <p className="m-0 max-w-[46ch] text-[13px] leading-[1.55] text-admin-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/* phân trang =*/

const PAGE_BTN =
  'inline-flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded-lg border px-2 ' +
  'text-[13px] font-semibold tabular-nums transition-[background-color,border-color,color] duration-150 ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand ' +
  'disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none';
const PAGE_BTN_IDLE =
  'border-[#dde4dd] bg-white text-admin-body hover:border-admin-brand hover:bg-admin-brand-050 hover:text-admin-brand';
const PAGE_BTN_ACTIVE = 'border-admin-brand bg-admin-brand text-white';

export function pageWindow(page: number, totalPages: number, edge = 1): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const out: (number | 'gap')[] = [1];
  const start = Math.max(2, page - edge);
  const end = Math.min(totalPages - 1, page + edge);

  if (start > 2) out.push('gap');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push('gap');
  out.push(totalPages);
  return out;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  itemLabel = 'mục',
  limitOptions,
  onLimitChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  limitOptions?: number[];
  onLimitChange?: (limit: number) => void;
  disabled?: boolean;
}) {
  const limitId = useId();
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const showLimit = !!limitOptions?.length && !!onLimitChange;

  return (
    <nav className={CARD_FOOTER} aria-label="Phân trang">
      <span className="text-[12.5px] tabular-nums text-admin-muted">
        Hiển thị {from}–{to} trên {total} {itemLabel}
      </span>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {showLimit && (
          <span className="flex items-center gap-1.5 text-[12.5px] text-admin-muted">
            <label htmlFor={limitId}>Mỗi trang</label>
            <select
              id={limitId}
              value={limit}
              disabled={disabled}
              onChange={e => onLimitChange!(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-[#dde4dd] bg-white py-1 pl-2 pr-1 text-[12.5px] font-semibold tabular-nums text-admin-body outline-none focus-visible:border-admin-brand disabled:cursor-not-allowed disabled:opacity-55"
            >
              {limitOptions!.map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </span>
        )}

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={cx(PAGE_BTN, PAGE_BTN_IDLE)}
              disabled={disabled || page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} aria-hidden />
            </button>

            <span className="px-1 text-[12.5px] tabular-nums text-admin-muted sm:hidden">
              Trang {page}/{totalPages}
            </span>

            {pageWindow(page, totalPages).map((entry, i) =>
              entry === 'gap' ? (
                <span key={`gap-${i}`} className="hidden select-none px-1 text-[13px] text-admin-muted sm:inline" aria-hidden>
                  …
                </span>
              ) : (
                <button
                  key={entry}
                  type="button"
                  className={cx('hidden sm:inline-flex', PAGE_BTN, entry === page ? PAGE_BTN_ACTIVE : PAGE_BTN_IDLE)}
                  aria-current={entry === page ? 'page' : undefined}
                  aria-label={`Trang ${entry}`}
                  disabled={disabled}
                  onClick={() => onPageChange(entry)}
                >
                  {entry}
                </button>
              )
            )}

            <button
              type="button"
              className={cx(PAGE_BTN, PAGE_BTN_IDLE)}
              disabled={disabled || page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export function SkeletonRows({ rows = 6, columns }: { rows?: number; columns: string[] }) {
  return (
    <div aria-hidden className="divide-y divide-admin-line-soft">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 px-[18px] py-[15px]">
          {columns.map((w, c) => (
            <span
              key={c}
              className={cx(
                'block h-3.5 animate-pulse rounded bg-admin-line-soft motion-reduce:animate-none',
                c === columns.length - 1 && 'ml-auto'
              )}
              style={{ width: w, animationDelay: `${r * 60}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function useDialogBehaviour(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const restoreTo = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTarget =
      panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([readonly]), textarea, select, button[data-autofocus]'
      ) ?? panelRef.current;
    focusTarget?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      restoreTo?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return panelRef;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidth = '480px',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useDialogBehaviour(open, onClose);

  if (!open) return null;

  return (
    <div className={MODAL_OVERLAY} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        style={{ maxWidth }}
        className={cx(MODAL_PANEL, 'outline-none')}
      >
        <div className={MODAL_HEADER}>
          <div className="min-w-0">
            <h2 id={titleId} className={MODAL_TITLE}>
              {title}
            </h2>
            {description && (
              <p id={descId} className="mb-0 mt-1 text-[12.5px] leading-[1.5] text-admin-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="-mr-1.5 -mt-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-admin-muted transition-[background-color,color] duration-150 hover:bg-admin-canvas hover:text-admin-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand motion-reduce:transition-none"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        {children}
        {footer && <div className={MODAL_FOOTER}>{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'brand';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const handleCancel = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={handleCancel}
      maxWidth="420px"
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={handleCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            data-autofocus
            className={tone === 'danger' ? BTN_DANGER : BTN_PRIMARY}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="px-6 py-5 text-[13.5px] leading-[1.6] text-admin-body">{message}</div>
    </Modal>
  );
}


export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-admin border border-admin-line bg-[#fafcfa] px-[13px] py-3">
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-[13px] font-semibold text-admin-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] leading-[1.5] text-admin-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full border-none p-0.5 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand motion-reduce:transition-none',
          checked ? 'bg-admin-brand' : 'bg-[#cbd5d0]'
        )}
      >
        <span
          className={cx(
            'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(16,33,26,0.25)] transition-transform duration-150 motion-reduce:transition-none',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        >
          {checked && <Check size={11} className="text-admin-brand" strokeWidth={3.5} aria-hidden />}
        </span>
      </button>
    </div>
  );
}
