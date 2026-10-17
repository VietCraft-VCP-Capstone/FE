/**
 * Khối giao diện dùng chung của khu "Phân tích & AI".
 *
 * Bám đúng ngôn ngữ của khu người bán (SellerDashboardUi): nền trắng, viền stone-200,
 * bo 16px cho thẻ, 12px cho nút và ô nhập, chip trạng thái bo tròn hẳn. Xanh #007700 là
 * màu nhấn duy nhất; xanh / vàng / đỏ chỉ dùng cho trạng thái và luôn có chữ đi kèm.
 */

import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { delta } from '../format';

export const BRAND = '#007700';

/* ------------------------------------------------------------------ thẻ --- */

export function InsightCard({
  title,
  description,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-stone-200 bg-white shadow-sm ${className || ''}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="m-0 text-sm font-bold text-stone-900">{title}</h2>}
            {description && <p className="mb-0 mt-0.5 text-xs leading-relaxed text-stone-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`flex-1 ${bodyClassName ?? 'p-5'}`}>{children}</div>
      {footer && <footer className="border-t border-stone-100 px-5 py-3">{footer}</footer>}
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
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_CLASS[tone]} ${className || ''}`}>
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
    <div className="min-w-0 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
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
  return <span className={`block animate-pulse rounded-lg bg-stone-100 motion-reduce:animate-none ${className || 'h-4 w-full'}`} />;
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
        className="h-9 min-w-0 cursor-pointer rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------- kết luận nhanh --- */

export const ACTION_CLASS =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border-none bg-[#007700] px-4 py-2 text-[13px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:bg-stone-300 motion-reduce:transition-none';

/** Đầu mỗi trang: câu trả lời trước, số liệu sau, kèm đúng một việc nên làm (người bán mới đọc 5 giây là đủ). */
export function Takeaway({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section aria-label="Kết luận nhanh" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#007700]/20 bg-[#EAF0E2] px-5 py-4">
      <div className="min-w-0 flex-1">
        <span className="block text-[11.5px] font-bold uppercase tracking-wide text-[#005B00]">Kết luận nhanh</span>
        <p className="mb-0 mt-1 text-[15px] leading-relaxed text-stone-900">{children}</p>
      </div>
      {action}
    </section>
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
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-stone-100 text-xs font-semibold text-stone-500 [&>th]:px-5 [&>th]:py-2.5 [&>th]:font-semibold">
            {head}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-stone-100 [&>tr:last-child]:border-b-0 [&_td]:px-5 [&_td]:py-2.5 [&_td]:align-middle">
          {children}
        </tbody>
      </table>
    </div>
  );
}
