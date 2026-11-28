/** Dòng gợi ý đầu bảng Kho voucher: bật lại, hoặc tạo mã mới (điền sẵn) khi mã tốt nhất hết hoặc sắp hết lượt. */
import { Plus, Power, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { VoucherStock } from '../../moneyTypes';
import { draftLink, draftTerms } from './voucherNotes';

type Suggest = NonNullable<VoucherStock['suggest']>;
const CODE = 'rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-stone-900 ring-1 ring-stone-200';

/** Tô mã voucher có trong kho (VD HUNG50K) thành nhãn dễ nhìn. */
function withCodes(text: string, codes: string[]) {
  const safe = codes.filter(c => /^[\w-]+$/.test(c));
  if (safe.length === 0) return text;
  const re = new RegExp(`\\b(${safe.join('|')})\\b`);
  return text.split(re).map((part, i) => (i % 2 ? <code key={i} className={CODE}>{part}</code> : part));
}

const LABEL = { create: 'Mã nên tạo', reactivate: 'Nên bật lại' };
const BTN = 'inline-flex items-center gap-1 rounded-md bg-[#008000] px-2.5 py-1 text-xs font-bold text-white no-underline hover:bg-[#006b00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008000]';

export function VoucherSuggestRow({ suggest, typeName, tip, codes }: { suggest: Suggest; typeName: string; tip?: string; aiLoading: boolean; codes: string[] }) {
  const points = suggest.points ?? [suggest.reason];
  const action = suggest.action ?? 'create';
  const d = action === 'create' ? suggest.draft : null;
  const code = d?.code ?? suggest.code;
  return (
    <tr className="bg-[#f3f9f3] align-top">
      <td>
        <span className="flex items-center gap-1 text-xs font-semibold text-[#005B00]"><Sparkles size={13} aria-hidden /> {LABEL[action]}</span>
        {code && <code className={`mt-1 inline-block ${d ? 'rounded border border-dashed border-[#008000] bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-stone-900' : CODE}`}>{code}</code>}
      </td>
      <td className="font-semibold text-stone-900">{typeName}</td>
      <td colSpan={3} title={tip}>
        <p className="m-0 font-semibold text-stone-900">{d ? draftTerms(suggest.type, d) : withCodes(points[1] ?? points[0], codes)}</p>
        {d && points[1] && <p className="m-0 mt-0.5 text-xs text-stone-600">{withCodes(points[1], codes)}</p>}
      </td>
      <td>
        {action === 'create' && (
          <>
            <Link to={d ? draftLink(suggest.type, d) : `/seller/promotions?new=${suggest.type}`} title="Mở hộp tạo mã đã điền sẵn, bạn xem lại rồi lưu" className={BTN}>
              <Plus size={13} aria-hidden /> Tạo {d ? d.code : 'mã này'}
            </Link>
          </>
        )}
        {action === 'reactivate' && <Link to="/seller/promotions" className={BTN}><Power size={13} aria-hidden /> Bật lại {suggest.code}</Link>}
      </td>
    </tr>
  );
}
