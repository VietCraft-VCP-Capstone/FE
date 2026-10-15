import React from 'react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { compactMoney, count as fmtCount } from '../../../../shared/utils/format';
import { NA, pct } from '../../format';

/**
 * Các hình nhỏ đi kèm số liệu: đường xu hướng tí hon, phễu chuyển đổi, thước phân bố
 * giá, thanh điểm theo trục, và biểu đồ bốn góc cung–cầu.
 *
 * Tất cả đều là SVG hoặc div thuần: nhẹ hơn recharts cho những hình chỉ vài chục điểm,
 * và luôn có số bên cạnh nên hình chỉ là kênh phụ.
 */

/* ---------------------------------------------------------- sparkline ----- */

export function Sparkline({ values, width = 72, height = 22, color = SERIES.green, ariaLabel }: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  ariaLabel?: string;
}) {
  if (!values.length) return <span className="text-xs text-stone-400">{NA}</span>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 3) - 1.5).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel || 'Xu hướng 7 kỳ gần nhất'} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -------------------------------------------------------------- phễu ------ */

export interface FunnelStep {
  label: string;
  value: number;
  /** Tỉ lệ chuyển từ bậc trước sang bậc này. */
  convPct?: number | null;
  /** Bậc yếu nhất: tô cảnh báo và ghi rõ bằng chữ. */
  weakest?: boolean;
}

export function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.value || 1;
  return (
    <ol className="m-0 list-none space-y-2.5 p-0">
      {steps.map((s, i) => {
        const widthPct = Math.max(4, Math.round((s.value / top) * 100));
        return (
          <li key={s.label}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
              <span className="font-semibold text-stone-700">
                {s.label}
                {s.weakest && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">khâu yếu nhất</span>}
              </span>
              <span className="tabular-nums text-stone-600">
                {fmtCount(s.value)}
                {i > 0 && <span className="ml-2 text-stone-500">{s.convPct == null ? NA : pct(s.convPct)} từ bậc trên</span>}
              </span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded-lg bg-stone-100">
              <div
                className="h-7 rounded-lg transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${widthPct}%`, background: s.weakest ? '#d97706' : SERIES.green, opacity: s.weakest ? 0.85 : 1 - i * 0.18 }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------- thước phân bố ---- */

export interface RulerTick {
  at: number;
  label: string;
  /** Vạch của chính người bán: vẽ đậm và có nhãn riêng. */
  mine?: boolean;
  tone?: 'brand' | 'warn' | 'muted';
}

/**
 * Thước giá: dải p10–p90 với vùng phổ biến p25–p75 tô đậm hơn, và vạch giá của mình.
 * Không dùng thanh tiến độ có nền tô kín — ở đây phần "đã đạt" không có nghĩa gì.
 */
export function DistributionRuler({ min, max, bandLow, bandHigh, ticks, formatValue = compactMoney }: {
  min: number;
  max: number;
  bandLow?: number | null;
  bandHigh?: number | null;
  ticks: RulerTick[];
  formatValue?: (n: number) => string;
}) {
  const span = max - min || 1;
  const posOf = (v: number) => Math.min(100, Math.max(0, ((v - min) / span) * 100));
  return (
    <div className="pb-9 pt-7">
      <div className="relative h-2.5 rounded-full bg-stone-100">
        {bandLow != null && bandHigh != null && (
          <div
            className="absolute inset-y-0 rounded-full bg-[#EAF0E2]"
            style={{ left: `${posOf(bandLow)}%`, width: `${Math.max(1, posOf(bandHigh) - posOf(bandLow))}%` }}
            aria-hidden
          />
        )}
        {ticks.map(t => {
          const color = t.tone === 'warn' ? '#b45309' : t.tone === 'muted' ? '#9ca3af' : SERIES.green;
          return (
            <span key={`${t.label}-${t.at}`} className="absolute -top-1 flex -translate-x-1/2 flex-col items-center" style={{ left: `${posOf(t.at)}%` }}>
              <span
                className={`block rounded-full ${t.mine ? 'h-4.5 w-1.5' : 'h-3.5 w-[3px]'}`}
                style={{ background: color, height: t.mine ? 18 : 14 }}
                aria-hidden
              />
              <span
                className={`absolute whitespace-nowrap text-[10.5px] ${t.mine ? 'font-bold text-stone-800' : 'text-stone-500'}`}
                style={t.mine ? { top: -20 } : { top: 20 }}
              >
                {t.label}
              </span>
            </span>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10.5px] text-stone-400">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- thanh điểm trục -- */

export function ScoreBars({ rows }: {
  rows: { label: string; score: number | null; weight: number; counted: boolean }[];
}) {
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {rows.map(r => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
            <span className="font-medium text-stone-700">
              {r.label} <span className="text-xs text-stone-400">trọng số {Math.round(r.weight * 100)}%</span>
            </span>
            <span className="tabular-nums font-semibold text-stone-800">
              {r.counted && r.score != null ? Math.round(r.score) : <span className="text-xs font-normal text-stone-500">không tính (thiếu dữ liệu)</span>}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
            {r.counted && r.score != null && (
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max(2, Math.min(100, r.score))}%`,
                  background: r.score >= 80 ? SERIES.green : r.score >= 50 ? '#d97706' : '#d03b3b',
                }}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------- bốn góc ngách ---- */

export interface QuadrantPoint {
  id: string;
  label: string;
  /** Trục hoành: nguồn cung, 0–100. */
  supply: number;
  /** Trục tung: nhu cầu, 0–100. */
  demand: number;
  highlight?: boolean;
}

/**
 * Bốn góc cung–cầu: cầu cao + cung thấp (góc trên trái) là ngách đáng vào.
 * Cắt ở 30 và 70 theo đúng cách service AI phân loại quadrant.
 */
export function QuadrantScatter({ points, onSelect, selectedId }: {
  points: QuadrantPoint[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  const CUT_LOW = 30;
  const CUT_HIGH = 70;
  return (
    <div className="relative aspect-[4/3] w-full rounded-xl border border-stone-200 bg-white">
      {/* Vùng cơ hội: cầu cao, cung thấp. */}
      <div className="pointer-events-none absolute left-0 top-0 rounded-tl-xl bg-[#EAF0E2]/70" style={{ width: `${CUT_LOW}%`, height: `${100 - CUT_HIGH}%` }} aria-hidden />
      <span className="pointer-events-none absolute left-2 top-2 text-[10.5px] font-bold uppercase tracking-wide text-[#005B00]">Cơ hội</span>
      <span className="pointer-events-none absolute right-2 top-2 text-[10.5px] font-semibold text-stone-400">Đông đúc</span>
      <span className="pointer-events-none absolute bottom-6 right-2 text-[10.5px] font-semibold text-stone-400">Thừa cung</span>
      <span className="pointer-events-none absolute bottom-6 left-2 text-[10.5px] font-semibold text-stone-400">Ngách nhỏ</span>

      <div className="pointer-events-none absolute inset-y-0 border-l border-dashed border-stone-200" style={{ left: `${CUT_LOW}%` }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-stone-200" style={{ top: `${100 - CUT_HIGH}%` }} aria-hidden />

      {points.map(p => {
        const selected = selectedId === p.id;
        return (
          <button
            type="button"
            key={p.id}
            onClick={() => onSelect?.(p.id)}
            title={`${p.label}: cầu ${Math.round(p.demand)}%, cung ${Math.round(p.supply)}%`}
            aria-label={`${p.label}, nhu cầu ${Math.round(p.demand)} phần trăm, nguồn cung ${Math.round(p.supply)} phần trăm`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white transition-transform duration-150 hover:z-10 hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007700] motion-reduce:transition-none ${selected ? 'z-10 scale-125' : ''}`}
            style={{
              left: `${Math.min(97, Math.max(3, p.supply))}%`,
              top: `${Math.min(97, Math.max(3, 100 - p.demand))}%`,
              width: p.highlight || selected ? 15 : 11,
              height: p.highlight || selected ? 15 : 11,
              background: p.highlight ? SERIES.green : SERIES.blue,
              opacity: p.highlight || selected ? 1 : 0.62,
            }}
          />
        );
      })}

      <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-stone-500">Nguồn cung (số listing đang có)</span>
      <span className="pointer-events-none absolute -left-1 top-1/2 origin-left -translate-y-1/2 -rotate-90 text-[11px] text-stone-500">Nhu cầu tìm kiếm</span>
    </div>
  );
}

/* ------------------------------------------------------------- tiện ích --- */

/** Hai dòng số liệu nhỏ đặt cạnh nhau trong thẻ. */
export function MiniStat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <span className="block text-[11.5px] font-semibold text-stone-500">{label}</span>
      <span className="mt-0.5 block font-jakarta text-lg font-bold leading-tight text-stone-900">{value}</span>
      {hint && <span className="mt-0.5 block text-[11.5px] leading-snug text-stone-500">{hint}</span>}
    </div>
  );
}
