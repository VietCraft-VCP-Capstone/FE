import { Button } from 'antd';
import { Link } from 'react-router-dom';
import { decimal, plainText } from '../../format';
import type { HealthItem } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { TODO_HINT } from './todoHints';

export function TodoStep({ item, index, productId }: { item: HealthItem; index: number; productId: string }) {
  const hint = item.code ? TODO_HINT[item.code] : undefined;
  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 py-4 sm:grid-cols-[1.75rem_minmax(0,1fr)_6rem_5.5rem] sm:items-start sm:gap-x-4">
      <span className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 text-xs font-bold tabular-nums text-stone-700">{index}</span>
      <div className="min-w-0">
        <p className="m-0 text-sm font-semibold text-stone-900">{plainText(item.message)}</p>
        {hint && <p className="m-0 mt-1 max-w-[65ch] text-[13px] leading-relaxed text-stone-600">{hint}</p>}
        {item.code === 'review' && <p className="m-0 mt-1 text-[13px] text-stone-500">Cách làm: nhắn khách đã nhận hàng mời đánh giá.</p>}
      </div>
      <p className="col-start-2 m-0 mt-2 text-sm font-semibold tabular-nums text-[#007700] sm:col-start-3 sm:mt-0 sm:text-right">+{decimal(item.impact, 1)} điểm</p>
      <div className="col-start-2 mt-2 sm:col-start-4 sm:mt-0">
        {item.code !== 'review' && <Link to={editLink(productId, item.field)}><Button size="small">Sửa ngay</Button></Link>}
      </div>
    </li>
  );
}
