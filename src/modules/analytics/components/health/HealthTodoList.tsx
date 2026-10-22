import { AlertTriangle, CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { decimal } from '../../format';
import type { HealthItem, ListingHealth } from '../../healthTypes';
import { editLink } from '../HealthParts';

const URGENT_IMPACT = 10;

function Todo({ item, productId }: { item: HealthItem; productId: string }) {
  return (
    <li className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3 gap-y-1 py-3 sm:grid-cols-[18px_minmax(0,1fr)_auto]">
      <XCircle size={18} className={`mt-px ${item.impact >= URGENT_IMPACT ? 'text-red-600' : 'text-amber-600'}`} aria-label="Chưa đạt" />
      <div className="min-w-0">
        <p className="m-0 text-sm leading-snug text-stone-800">{item.message}</p>
        <p className="m-0 mt-1 text-xs font-semibold text-[#007700]">+{decimal(item.impact, 1)} điểm</p>
      </div>
      {item.code !== 'review' ? (
        <Link to={editLink(productId, item.field)} className="col-start-2 inline-flex items-center gap-1 justify-self-start rounded-md px-2 py-1 text-[13px] font-semibold text-[#007700] no-underline transition-colors hover:bg-[#007700]/10 active:translate-y-px max-sm:-ml-2 sm:col-start-auto sm:justify-self-auto">
          <Pencil size={13} aria-hidden /> Sửa
        </Link>
      ) : <span />}
    </li>
  );
}

export function HealthTodoList({ data, productId }: { data: ListingHealth; productId: string }) {
  const passed = data.breakdown.filter(row => row.sub_score === 100);
  return (
    <section className="min-w-0 rounded-xl border border-stone-200 bg-white px-5 pb-4 pt-4">
      <h2 className="m-0 flex items-center gap-2 text-[15px] font-bold text-stone-900">
        Việc cần làm
        {data.todos.length > 0 && <span className="text-sm font-semibold tabular-nums text-stone-400">{data.todos.length}</span>}
      </h2>
      {data.warnings.length > 0 && (
        <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
          {data.warnings.map(item => (
            <li key={item.message} className={`flex items-start gap-2 text-[13px] leading-snug ${item.type === 'warning' ? 'text-amber-900' : 'text-stone-600'}`}>
              <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${item.type === 'warning' ? 'text-amber-600' : 'text-stone-400'}`} aria-hidden />
              {item.message}
            </li>
          ))}
        </ul>
      )}
      {data.todos.length === 0
        ? <p className="m-0 py-3 text-sm text-stone-500">Không còn việc nào cần làm.</p>
        : <ul className="m-0 list-none divide-y divide-stone-100 p-0">{data.todos.map(item => <Todo key={item.code} item={item} productId={productId} />)}</ul>}
      {passed.length > 0 && (
        <>
          <h3 className="m-0 mt-2 border-t border-stone-100 pt-3 text-[13px] font-semibold text-stone-600">Đã đạt</h3>
          <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 sm:grid-cols-2">
            {passed.map(row => (
              <li key={row.key} className="flex items-center gap-2 text-[13px] text-stone-600">
                <CheckCircle2 size={15} className="shrink-0 text-green-700" aria-hidden /> {row.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
