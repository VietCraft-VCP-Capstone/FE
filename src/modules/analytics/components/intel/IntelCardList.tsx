import { ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { decimal } from '../../format';
import { INSIGHTS_ROOT } from '../../nav';
import type { IntelListItem } from '../../intelTypes';
import { Chip } from '../ui';
import { AXIS_KEYS, AXIS_SHORT, DIRECTION_LABEL, DIRECTION_TONE } from './intelLabels';

function MiniBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0">
      <dt className="whitespace-nowrap text-[10px] font-medium text-stone-500">{label}</dt>
      <dd className="m-0">
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100" aria-hidden>
          {value !== null && <div className="h-full rounded-full bg-[#007700]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />}
        </div>
        <span className={`text-xs font-bold tabular-nums ${value === null ? 'text-stone-400' : 'text-stone-800'}`} title={value === null ? 'Thiếu dữ liệu' : undefined}>
          {value === null ? '—' : decimal(value, 0)}
        </span>
      </dd>
    </div>
  );
}

export function IntelCardList({ items }: { items: IntelListItem[] }) {
  return (
    <ul className="m-0 list-none divide-y divide-stone-100 p-0">
      {items.map(item => (
        <li key={item.product_id} className="py-3">
          <div className="flex items-start gap-3">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-400" aria-hidden><ImageOff size={16} /></span>
            )}
            <div className="min-w-0 flex-1">
              <Link to={`${INSIGHTS_ROOT}/listing-intel/${item.product_id}`} className="line-clamp-2 text-[13px] font-semibold text-stone-800 no-underline hover:text-[#007700]">
                {item.title}
              </Link>
              {item.trend_direction && <div className="mt-1"><Chip tone={DIRECTION_TONE[item.trend_direction]}>{DIRECTION_LABEL[item.trend_direction]}</Chip></div>}
            </div>
            <div className="shrink-0 text-right">
              <span className="font-jakarta text-2xl font-extrabold leading-none tabular-nums text-stone-900">{item.score === null ? '—' : decimal(item.score, 0)}</span>
              <span className="block text-[10px] text-stone-500">/ 100</span>
            </div>
          </div>
          <dl className="m-0 mt-2.5 grid grid-cols-5 gap-1.5">
            {AXIS_KEYS.map(k => <MiniBar key={k} label={AXIS_SHORT[k]} value={item.axes[k]} />)}
          </dl>
        </li>
      ))}
    </ul>
  );
}
