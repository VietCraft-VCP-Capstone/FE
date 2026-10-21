import { ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dateTime } from '../../../../shared/utils/format';
import { decimal } from '../../format';
import { INSIGHTS_ROOT } from '../../nav';
import type { IntelListItem } from '../../intelTypes';
import { Chip, DataTable } from '../ui';
import { IntelCardList } from './IntelCardList';
import { AXIS_KEYS, AXIS_SHORT, DIRECTION_LABEL, DIRECTION_TONE } from './intelLabels';

const byScore = (a: IntelListItem, b: IntelListItem) => (a.score ?? Infinity) - (b.score ?? Infinity);

function Num({ value }: { value: number | null }) {
  return value === null ? <span className="text-stone-400" title="Thiếu dữ liệu">—</span> : <span className="tabular-nums">{decimal(value, 0)}</span>;
}

function WideTable({ items }: { items: IntelListItem[] }) {
  return (
    <DataTable
      caption="Điểm phân tích của từng sản phẩm"
      minWidth="min-w-[520px]"
      head={
        <>
          <th scope="col">Sản phẩm</th>
          <th scope="col" className="text-right">Điểm</th>
          {AXIS_KEYS.map(k => <th key={k} scope="col" className="whitespace-nowrap text-right !px-2">{AXIS_SHORT[k]}</th>)}
        </>
      }
    >
      {items.map(item => (
        <tr key={item.product_id}>
          <td>
            <div className="flex min-w-[180px] items-center gap-3">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-stone-100 text-stone-400" aria-hidden><ImageOff size={16} /></span>
              )}
              <div className="min-w-0">
                <Link
                  to={`${INSIGHTS_ROOT}/listing-intel/${item.product_id}`}
                  className="line-clamp-2 rounded text-[13px] font-semibold text-stone-800 no-underline hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]"
                >
                  {item.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-500">
                  {item.trend_direction && <Chip tone={DIRECTION_TONE[item.trend_direction]}>{DIRECTION_LABEL[item.trend_direction]}</Chip>}
                  <span>Cập nhật {item.computed_at ? dateTime(item.computed_at) : '—'}</span>
                </div>
              </div>
            </div>
          </td>
          <td className="text-right text-sm font-bold"><Num value={item.score} /></td>
          {AXIS_KEYS.map(k => <td key={k} className="text-right !px-2"><Num value={item.axes[k]} /></td>)}
        </tr>
      ))}
    </DataTable>
  );
}

export function IntelTable({ items }: { items: IntelListItem[] }) {
  const sorted = [...items].sort(byScore);
  return (
    <>
      <div className="md:hidden"><IntelCardList items={sorted} /></div>
      <div className="hidden md:block"><WideTable items={sorted} /></div>
    </>
  );
}
