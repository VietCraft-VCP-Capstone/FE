import type { ReactNode } from 'react';
import type { HealthRow } from '../../healthTypes';
import type { ShopIssue } from '../health/commonIssues';
import type { Tone } from '../ui';
import type { TierFilter } from './HealthList';
import { healthTier, TIER_COLOR } from './intelLabels';
import { ScoreRing } from './ScoreRing';

const ORDER: { label: Exclude<TierFilter, ''>; tone: Tone }[] = [
  { label: 'Kém', tone: 'bad' },
  { label: 'Cần cải thiện', tone: 'warn' },
  { label: 'Tốt', tone: 'good' },
];

export function ShopOverview({ items, issues, onFilter, children }: {
  children?: ReactNode;
  items: HealthRow[];
  issues: ShopIssue[];
  onFilter: (t: TierFilter) => void;
}) {
  const scores = items.map(i => i.score).filter((s): s is number => s !== null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const tiers = ORDER.map(({ label, tone }) => ({
    label,
    n: items.filter(i => healthTier(i.score).label === label).length,
    color: TIER_COLOR[tone],
  }));
  const notGood = tiers[0].n + tiers[1].n;
  const pending = items.length - scores.length;
  const headline = !scores.length
    ? 'Chưa chấm được sản phẩm nào'
    : notGood ? `${notGood}/${scores.length} sản phẩm chưa đạt mức Tốt` : pending ? 'Mọi sản phẩm đã chấm đạt mức Tốt' : 'Mọi sản phẩm đã đạt mức Tốt';
  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-stone-200 bg-white px-5 py-5">
      <h2 className="m-0 text-[15px] font-bold text-stone-900">Tổng quan shop</h2>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
        <ScoreRing score={avg} size={88} />
        <div className="w-full min-w-0 flex-1">
          <p className="m-0 text-[13px] text-stone-500">Điểm trung bình của {scores.length} sản phẩm đã chấm{pending ? ` · ${pending} đang chờ chấm` : ''}</p>
          <p className="m-0 mt-0.5 font-jakarta text-lg font-bold leading-snug text-stone-900">{headline}</p>
          <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {tiers.filter(t => t.n).map(t => <span key={t.label} style={{ flexGrow: t.n, background: t.color }} />)}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {tiers.map(t => (
              <button key={t.label} type="button" onClick={() => onFilter(t.label)} className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] text-stone-600 hover:text-stone-900">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.color }} aria-hidden />
                {t.label} <strong className="tabular-nums text-stone-900">{t.n}</strong>
              </button>
            ))}
          </div>
        </div>
      </div>
      {issues.length > 0 && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <h3 className="m-0 text-[13px] font-bold text-stone-900">Việc nên làm trước cho cả shop</h3>
          <ul className="m-0 mt-1 list-none divide-y divide-stone-100 p-0">
            {issues.map(i => (
              <li key={i.code} className="grid grid-cols-[92px_minmax(0,1fr)] items-baseline gap-3 py-2">
                <span className="text-[13px] font-bold tabular-nums text-stone-900">{i.count} sản phẩm</span>
                <span className="text-[13px] text-stone-700">{i.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {children && <div className="mt-auto pt-5"><div className="border-t border-stone-100 pt-4">{children}</div></div>}
    </section>
  );
}
