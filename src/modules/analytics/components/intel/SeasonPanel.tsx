import type { ReactNode } from 'react';
import { shortDate } from '../../format';
import type { IntelTimelinePoint } from '../../intelTypes';

type Scored = IntelTimelinePoint & { score: number };

function Sparkline({ points, peak }: { points: Scored[]; peak: Scored }) {
  const w = 100, h = 40;
  const step = w / (points.length - 1);
  const values = points.map(p => p.score);
  const lo = Math.max(0, Math.min(...values) - 5);
  const hi = Math.min(100, Math.max(...values) + 5);
  const y = (v: number) => (h - 3 - ((v - lo) / Math.max(1, hi - lo)) * (h - 6)).toFixed(2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(2)},${y(p.score)}`).join(' ');
  const pi = points.indexOf(peak);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-14 w-full" aria-hidden>
      <path d={path} fill="none" stroke="#007700" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={pi * step} cy={y(peak.score)} r="1.8" fill="#007700" />
    </svg>
  );
}

export function SeasonPanel({ points, children }: { points: IntelTimelinePoint[]; children?: ReactNode }) {
  const scored = points.filter((p): p is Scored => p.score !== null);
  const peak = scored.reduce<Scored | null>((best, p) => (!best || p.score > best.score ? p : best), null);
  return (
    <section className="min-w-0 rounded-xl border border-stone-200 bg-white px-5 py-4">
      <h2 className="m-0 text-[15px] font-bold text-stone-900">Thời điểm bán tốt</h2>
      {peak && scored.length > 1 ? (
        <>
          <div className="mt-3"><Sparkline points={scored} peak={peak} /></div>
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-stone-400">
            <span>{shortDate(scored[0].week_start)}</span>
            <span>{shortDate(scored[scored.length - 1].week_start)}</span>
          </div>
          <p className="m-0 mt-3 text-[13px] leading-relaxed text-stone-700">
            Đỉnh mùa bán là tuần <strong className="tabular-nums">{shortDate(peak.week_start)}</strong>
            {peak.events.length ? `, dịp ${peak.events.join(', ')}` : ''}. Chuẩn bị hàng trước tuần đó.
          </p>
        </>
      ) : <p className="m-0 mt-2 text-[13px] text-stone-500">Chưa có dữ liệu theo tuần.</p>}
      {children && <div className="mt-4 border-t border-stone-100 pt-3">{children}</div>}
    </section>
  );
}
