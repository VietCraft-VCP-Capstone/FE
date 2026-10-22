import { Link } from 'react-router-dom';
import { ChevronRight, ImageOff } from 'lucide-react';
import type { HealthRow } from '../../healthTypes';
import { INSIGHTS_ROOT } from '../../nav';
import { healthTier, TIER_COLOR } from './intelLabels';

export const TIERS = ['Kém', 'Cần cải thiện', 'Tốt'] as const;
export type TierFilter = (typeof TIERS)[number] | '';

const COLS = 'md:grid-cols-[minmax(0,1fr)_110px_minmax(0,320px)_16px]';

function fixFirst(row: HealthRow): string {
  if (row.top_todo) return row.top_todo.replace(/\.$/, '');
  return row.score === null ? 'Đang chấm' : 'Đã ổn, không cần sửa';
}

function Row({ item }: { item: HealthRow }) {
  const tier = healthTier(item.score);
  const color = TIER_COLOR[tier.tone];
  return (
    <li>
      <Link
        to={`${INSIGHTS_ROOT}/listings/${item.product_id}`}
        className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-inherit no-underline transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#007700] md:gap-x-4 ${COLS}`}
      >
        <div className="flex min-w-0 items-center gap-3 max-md:contents">
          {item.thumbnail
            ? <img src={item.thumbnail} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400" aria-hidden><ImageOff size={18} /></span>}
          <div className="min-w-0">
            <p className="m-0 line-clamp-2 text-sm font-semibold leading-snug text-stone-800">{item.title}</p>
            <p className="m-0 mt-0.5 text-xs text-stone-500 md:hidden">
              <span style={{ color }}>{tier.label}</span> · Cần sửa trước: {fixFirst(item)}
            </p>
          </div>
        </div>
        <div className="text-right md:text-left">
          <span className="font-jakarta text-xl font-extrabold tabular-nums" style={{ color }}>{item.score === null ? '-' : Math.round(item.score)}</span>
          <span className="ml-2 hidden text-xs font-medium text-stone-500 md:inline">{tier.label}</span>
        </div>
        <p className="m-0 hidden text-[13px] leading-snug text-stone-700 md:line-clamp-2">{fixFirst(item)}</p>
        <ChevronRight size={16} className="hidden text-stone-300 md:block" aria-hidden />
      </Link>
    </li>
  );
}

const byScore = (a: HealthRow, b: HealthRow) => (a.score ?? Number.MAX_SAFE_INTEGER) - (b.score ?? Number.MAX_SAFE_INTEGER);

export function HealthList({ items, filter, onFilter }: { items: HealthRow[]; filter: TierFilter; onFilter: (t: TierFilter) => void }) {
  const count = (t: TierFilter) => items.filter(i => !t || healthTier(i.score).label === t).length;
  const shown = items.filter(i => !filter || healthTier(i.score).label === filter).sort(byScore);
  const options: [TierFilter, string][] = [['', 'Tất cả'], ...TIERS.map(t => [t, t] as [TierFilter, string])];
  return (
    <div>
      <div className="px-4 py-3">
        <div role="group" aria-label="Lọc theo mức" className="inline-flex flex-wrap gap-0.5 rounded-lg bg-stone-100 p-0.5">
          {options.map(([value, label]) => (
            <button
              key={label} type="button" onClick={() => onFilter(value)} aria-pressed={filter === value}
              className={`cursor-pointer rounded-md border-0 px-3 py-1.5 text-[13px] font-semibold transition-colors active:translate-y-px ${filter === value ? 'bg-white text-stone-900 shadow-sm shadow-stone-900/5' : 'bg-transparent text-stone-500 hover:text-stone-800'}`}
            >
              {label} <span className="tabular-nums text-stone-400">{count(value)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`hidden gap-x-4 border-y border-stone-100 bg-stone-50 px-4 py-2 text-xs font-medium text-stone-500 md:grid ${COLS}`}>
        <span>Sản phẩm</span><span>Điểm</span><span>Cần sửa trước</span><span />
      </div>
      {shown.length === 0
        ? <p className="m-0 px-4 py-6 text-sm text-stone-500">Không có sản phẩm nào ở mức này.</p>
        : <ul className="m-0 list-none divide-y divide-stone-100 p-0 max-md:border-t max-md:border-stone-100">{shown.map(i => <Row key={i.product_id} item={i} />)}</ul>}
    </div>
  );
}
