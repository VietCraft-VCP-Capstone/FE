import type { ReactNode } from 'react';
import { scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import type { ShopIssue } from '../health/commonIssues';
import { TIERS, type TierFilter } from './HealthList';
import { healthTier, TIER_COLOR } from './intelLabels';

const TONE = { Kém: 'bad', 'Cần cải thiện': 'warn', Tốt: 'good' } as const;

export function ShopOverview({ items, issues, onFilter, children }: {
  children?: ReactNode;
  items: HealthRow[];
  issues: ShopIssue[];
  onFilter: (t: TierFilter) => void;
}) {
  const scores = items.map(i => i.score).filter((s): s is number => s !== null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const count = (label: string) => items.filter(i => i.score !== null && healthTier(i.score).label === label).length;

  return (
    <div className="space-y-8 pt-2">
      <section className="grid gap-x-12 gap-y-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-end">
        <div>
          <p className="m-0 text-sm text-stone-500">Điểm trung bình của {scores.length} sản phẩm</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-jakarta text-6xl font-extrabold leading-none tracking-tight tabular-nums text-stone-900">{scoreText(avg)}</span>
            <span className="text-base text-stone-400">/ 100</span>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-stone-200 border-y border-stone-200">
          {TIERS.map(t => (
            <button key={t} type="button" onClick={() => onFilter(t)} className="cursor-pointer border-0 bg-transparent px-4 py-3 text-left first:pl-0 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]">
              <span className="block text-2xl font-bold tabular-nums" style={{ color: TIER_COLOR[TONE[t]] }}>{count(t)}</span>
              <span className="block text-xs text-stone-600">{t}</span>
            </button>
          ))}
        </div>
      </section>
      {issues.length > 0 && (
        <section className="border-t border-stone-200 pt-5">
          <h2 className="m-0 mb-3 text-base font-bold text-stone-900">Việc nên làm cho cả shop</h2>
          <ul className="m-0 list-none divide-y divide-stone-100 p-0">
            {issues.map(issue => (
              <li key={issue.code} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 py-2.5 text-sm text-stone-700">
                <span className="font-semibold tabular-nums text-stone-900">{issue.count} sản phẩm</span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {children}
    </div>
  );
}
