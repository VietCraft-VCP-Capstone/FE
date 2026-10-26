import { Link } from 'react-router-dom';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { decimal } from '../../format';
import type { IntelAdvice, ListingIntel } from '../../intelTypes';
import { editLink } from '../HealthParts';
import { InfoTip } from '../ui';
import { issueCodes, passedChecks } from './checklist';
import { EFFORT_LABEL } from './intelLabels';

function Todo({ item, productId }: { item: IntelAdvice; productId?: string }) {
  return (
    <li className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3 gap-y-1 py-3 sm:grid-cols-[18px_minmax(0,1fr)_auto]">
      <XCircle size={18} className={item.effort === 1 ? 'mt-px text-red-600' : 'mt-px text-amber-600'} aria-label="Chưa đạt" />
      <div className="min-w-0">
        <p className="m-0 text-sm leading-snug text-stone-800">{item.message}</p>
        <p className="m-0 mt-1 text-xs text-stone-500">
          {EFFORT_LABEL[item.effort]}
          {item.impact !== null && item.impact > 0 && <span className="ml-2 font-semibold text-[#007700]">+{decimal(item.impact, 1)} điểm</span>}
          {item.evidence === 'measured' && <span className="ml-2">Đã đo</span>}
        </p>
      </div>
      {productId && item.effort < 3 ? (
        <Link to={editLink(productId)} className="col-start-2 inline-flex items-center gap-1 justify-self-start rounded-md px-2 py-1 text-[13px] font-semibold text-[#007700] no-underline transition-colors hover:bg-[#007700]/10 active:translate-y-px max-sm:-ml-2 sm:col-start-auto sm:justify-self-auto">
          <Pencil size={13} aria-hidden /> Sửa
        </Link>
      ) : <span />}
    </li>
  );
}

export function HealthChecklist({ data, productId, withReviews }: { data: ListingIntel; productId?: string; withReviews: boolean }) {
  const passed = passedChecks(data, withReviews);
  const shown = new Set(data.advice.map(a => a.code));
  const hidden = [...issueCodes(data)].filter(c => !shown.has(c)).length;
  return (
    <section className="min-w-0 rounded-xl border border-stone-200 bg-white px-5 pb-3 pt-4">
      <h2 className="m-0 flex items-center gap-2 text-[15px] font-bold text-stone-900">
        Việc cần làm
        {data.advice.length > 0 && <span className="text-sm font-semibold tabular-nums text-stone-400">{data.advice.length}</span>}
        <InfoTip text="Việc tăng nhiều điểm và dễ làm được xếp trước. +N điểm là ước tính khi làm xong việc đó." label="Cách xếp việc cần làm" />
      </h2>
      {data.advice.length === 0
        ? <p className="m-0 py-3 text-sm text-stone-500">Không còn việc nào cần làm.</p>
        : <ul className="m-0 list-none divide-y divide-stone-100 p-0">{data.advice.map(a => <Todo key={a.code} item={a} productId={productId} />)}</ul>}
      {hidden > 0 && <p className="m-0 pb-2 text-xs text-stone-500">Còn {hidden} vấn đề nhỏ khác trong phần phân tích bên dưới.</p>}
      {passed.length > 0 && (
        <details className="group border-t border-stone-100 pt-2.5">
          <summary className="cursor-pointer list-none text-[13px] font-semibold text-stone-600 hover:text-stone-900">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-green-700" aria-hidden /> {passed.length} mục đã đạt</span>
          </summary>
          <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 sm:grid-cols-2">
            {passed.map(label => (
              <li key={label} className="flex items-start gap-2 text-[13px] text-stone-600">
                <CheckCircle2 size={15} className="mt-px shrink-0 text-green-700" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
