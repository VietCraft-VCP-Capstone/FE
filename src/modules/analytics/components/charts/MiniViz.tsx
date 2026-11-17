import React from 'react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { compactMoney } from '../../../../shared/utils/format';
import { NA } from '../../format';

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
                // Vạch sát mép thì nhãn mọc vào trong, không tràn khỏi thẻ.
                style={{ top: t.mine ? -20 : 20, ...(posOf(t.at) > 80 ? { right: 0 } : posOf(t.at) < 20 ? { left: 0 } : {}) }}
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
