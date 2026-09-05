/**
 * Các khối giao diện của trang chủ người bán.
 *
 * Tách khỏi trang để phần trang chỉ còn lo dữ liệu và bố cục. Kiểu dáng bám theo
 * ngôn ngữ sẵn có của khu người bán: nền trắng, viền stone-200, bo 16px, xanh
 * thương hiệu #007700 làm màu nhấn duy nhất.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export const SELLER_BRAND = '#007700';

/* ------------------------------------------------------------------ thẻ --- */

export function SellerCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex flex-col rounded-2xl border border-stone-200 bg-white shadow-sm ${className || ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="m-0 text-sm font-bold text-stone-900">{title}</h2>
          {description && <p className="mb-0 mt-0.5 text-xs text-stone-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------ thẻ số liệu -- */

export function StatCard({
  label,
  value,
  hint,
  accent,
  loading = false,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Chấm màu đứng trước số, dùng để chỉ trạng thái — không phải để trang trí. */
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</span>
      <div className="mt-1.5 flex items-baseline gap-2">
        {accent && (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
        )}
        {loading ? (
          <span className="my-1 block h-6 w-20 animate-pulse rounded bg-stone-100 motion-reduce:animate-none" />
        ) : (
          /* Số lớn dùng chữ số tỉ lệ tự nhiên; tabular-nums chỉ hợp khi các số
             phải thẳng cột theo chiều dọc, ở đây thì làm con số trông rời rạc. */
          <span className="text-2xl font-extrabold leading-none text-stone-900 font-jakarta">{value}</span>
        )}
      </div>
      {hint && <span className="mt-1.5 block text-xs text-stone-500">{hint}</span>}
    </div>
  );
}

/* --------------------------------------------------------- chọn khoảng ----- */

export function RangeTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-0.5 rounded-xl border border-stone-200 bg-white p-0.5"
    >
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-[10px] border-none px-3 py-1.5 text-xs font-semibold leading-none transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007700] motion-reduce:transition-none ${
              active ? 'bg-[#007700] text-white' : 'bg-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------- việc cần làm -- */

export function TaskRow({ label, done, to }: { label: string; done: boolean; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-stone-100 px-5 py-2.5 no-underline transition-colors duration-150 last:border-b-0 hover:bg-stone-50 motion-reduce:transition-none"
    >
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-[#EAF0E2] text-[#007700]' : 'border border-dashed border-stone-300 bg-white'
        }`}
        aria-hidden
      >
        {done && <Check size={12} strokeWidth={3} />}
      </span>
      <span className={`flex-1 text-[13px] ${done ? 'text-stone-400 line-through' : 'font-medium text-stone-700'}`}>
        {label}
      </span>
      {/* Trạng thái không chỉ nằm ở màu và dấu tick: có chữ đi kèm cho trình đọc
          màn hình và cho người không phân biệt được màu. */}
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {done ? 'Xong' : 'Chưa'}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------- thanh tiến -- */

export function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full rounded-full bg-stone-100"
    >
      <div
        className="h-2 rounded-full transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${clamped}%`, backgroundColor: SELLER_BRAND }}
      />
    </div>
  );
}
