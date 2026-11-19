import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import type { HealthRecommendation } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { Chip } from '../ui';
import { Tooltip } from 'antd';
import { AI_HINT } from './factorState';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6';
const TOP = 3;

function RecommendationRow({ r, productId }: { r: HealthRecommendation; productId: string }) {
  const onOpen = () => {
    analyticsApi.recordHealthAction(productId, { recommendation_id: r.id, action: 'open', kind: r.kind }).catch(() => undefined);
  };
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="m-0 text-sm font-semibold text-stone-900">{r.title}</p>
        <p className="m-0 mt-0.5 text-xs leading-relaxed text-stone-600"><b className="font-semibold">Vì sao ưu tiên:</b> {r.why}</p>
        <p className="m-0 mt-0.5 text-xs leading-relaxed text-stone-600">{r.action}</p>
        {r.method === 'ml_unvalidated' && <div className="mt-1.5"><Tooltip title={AI_HINT}><span className="cursor-help"><Chip>AI đoán, nên xem lại</Chip></span></Tooltip></div>}
      </div>
      <Link
        to={editLink(productId, r.field)}
        onClick={onOpen}
        className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#007700] no-underline"
      >
        Sửa
        <ChevronRight size={14} aria-hidden />
      </Link>
    </li>
  );
}

export function Recommendations({ items, productId }: { items?: HealthRecommendation[]; productId: string }) {
  const top = (items ?? []).slice(0, TOP);
  return (
    <section className={CARD}>
      <h2 className="m-0 text-base font-bold text-stone-900">Nên làm trước</h2>
      {top.length === 0 ? (
        <p className="m-0 mt-2 text-sm text-stone-500">Chưa có khuyến nghị cho sản phẩm này.</p>
      ) : (
        <ul className="m-0 mt-1 list-none divide-y divide-stone-100 p-0">
          {top.map(r => <RecommendationRow key={r.id} r={r} productId={productId} />)}
        </ul>
      )}
    </section>
  );
}
