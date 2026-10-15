/**
 * Khối giao diện dùng chung của khu "Phân tích & AI".
 *
 * Bám đúng ngôn ngữ của khu người bán (SellerDashboardUi): nền trắng, viền stone-200,
 * bo 6px cho thẻ, nút và ô nhập, viền mảnh, không đổ bóng; chip trạng thái bo tròn hẳn. Xanh #007700 là
 * màu nhấn duy nhất; xanh / vàng / đỏ chỉ dùng cho trạng thái và luôn có chữ đi kèm.
 */

import React from 'react';
import { Tooltip } from 'antd';
import gsap from 'gsap';
import { MOTION_DURATION, reducedMotion } from '../../../shared/hooks/useMotion';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Info, Minus } from 'lucide-react';
import { delta } from '../format';

export const BRAND = '#007700';

/* ------------------------------------------------------------------ thẻ --- */

/** Biểu tượng ⓘ: rê chuột hoặc focus bàn phím để xem chú giải, giữ màn hình ít chữ. */
export function InfoTip({ text, label = 'Xem giải thích', wide = false }: { text: React.ReactNode; label?: string; wide?: boolean }) {
  return (
    <Tooltip styles={wide ? { root: { maxWidth: 420 } } : undefined} title={<div className={`${wide ? 'max-w-sm' : 'max-w-xs'} text-xs leading-relaxed`}>{text}</div>}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex cursor-help items-center align-middle text-stone-400 transition-colors duration-150 hover:text-stone-700 focus-visible:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007700]/30 rounded-sm"
      >
        <Info size={14} aria-hidden />
      </button>
    </Tooltip>
  );
}

export function InsightCard({
  title,
  info,
  description,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  info?: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col rounded-md border border-stone-200 bg-white ${className || ''}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-4 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="m-0 flex items-center gap-1.5 text-sm font-bold text-stone-900">
                {title}
                {info && <InfoTip text={info} label={`Giải thích: ${title}`} />}
              </h2>
            )}
            {description && <p className="mb-0 mt-0.5 text-xs leading-relaxed text-stone-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`flex-1 ${bodyClassName ?? 'p-4'}`}>{children}</div>
      {footer && <footer className="border-t border-stone-100 px-4 py-2.5">{footer}</footer>}
    </section>
  );
}

/* ------------------------------------------------------------------ chip --- */

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'info' | 'brand';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700',
  good: 'bg-[#EAF0E2] text-[#005B00]',
  warn: 'bg-amber-50 text-amber-800',
  bad: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-800',
  brand: 'bg-[#007700] text-white',
};

export function Chip({ tone = 'neutral', icon, children, className }: {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-[11.5px] font-semibold ${TONE_CLASS[tone]} ${className || ''}`}>
      {icon}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- biến động -- */

/** Mũi tên + chữ. Màu chỉ là kênh phụ: chiều tăng/giảm luôn nằm trong chữ và icon. */
export function DeltaBadge({ value, invert = false }: { value: number | null | undefined; invert?: boolean }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-xs text-stone-500">Chưa so được</span>;
  }
  const up = value > 0;
  const flat = value === 0;
  const good = flat ? null : invert ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${good === null ? 'text-stone-500' : good ? 'text-[#005B00]' : 'text-red-700'}`}>
      <Icon size={14} strokeWidth={2.25} aria-hidden />
      {delta(value)}
      <span className="sr-only">{up ? 'tăng' : flat ? 'không đổi' : 'giảm'} so với kỳ trước</span>
    </span>
  );
}

/* ------------------------------------------------------------- ô số liệu -- */

export function KpiTile({ label, value, hint, trailing }: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-md border border-stone-200 bg-white px-4 py-3">
      <span className="block text-xs font-semibold text-stone-500">{label}</span>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-jakarta text-2xl font-extrabold leading-none text-stone-900">{value}</span>
        {trailing}
      </div>
      {hint && <div className="mt-1.5 text-xs text-stone-500">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------- khung chờ -- */

export function Skeleton({ className }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-stone-100 motion-reduce:animate-none ${className || 'h-4 w-full'}`} />;
}

/* ------------------------------------------------------------ chọn trong -- */

export function SelectField({ label, value, onChange, options, className }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <label htmlFor={id} className="whitespace-nowrap text-xs font-semibold text-stone-600">{label}</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 min-w-0 cursor-pointer rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------- thu gọn --- */

/** Khối gập/mở bằng `<details>` gốc của trình duyệt. */
export function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const onToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (e.currentTarget.open && bodyRef.current && !reducedMotion()) {
      gsap.from(bodyRef.current, { autoAlpha: 0, y: -4, duration: MOTION_DURATION, ease: 'power2.out', clearProps: 'all' });
    }
  };
  return (
    <details className="group rounded-md border border-stone-200 bg-white" onToggle={onToggle}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-4 py-3 text-sm font-bold text-stone-800 transition-colors duration-150 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
        <ChevronRight size={16} className="shrink-0 text-stone-500 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none" aria-hidden />
        {title}
      </summary>
      <div ref={bodyRef} className="border-t border-stone-100 px-4 py-3">{children}</div>
    </details>
  );
}

/* ---------------------------------------------------------- ghi chú nhỏ --- */

/** Một dòng giải thích đặt ngay dưới số liệu. Dùng cho giới hạn, cách tính. */
export function Note({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'warn' }) {
  return (
    <p className={`m-0 text-xs leading-relaxed ${tone === 'warn' ? 'text-amber-800' : 'text-stone-500'}`}>{children}</p>
  );
}

/** Bảng dữ liệu gọn, cuộn ngang trên màn nhỏ thay vì vỡ bố cục. */
export function DataTable({ head, children, caption }: {
  head: React.ReactNode;
  children: React.ReactNode;
  caption?: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-stone-100 text-xs font-semibold text-stone-500 [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-semibold">
            {head}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-stone-100 [&>tr:last-child]:border-b-0 [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-middle">
          {children}
        </tbody>
      </table>
    </div>
  );
}
