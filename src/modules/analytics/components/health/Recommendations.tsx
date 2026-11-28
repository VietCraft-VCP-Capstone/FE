import { Link } from 'react-router-dom';
import { ChevronRight, ListChecks } from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import { decimal } from '../../format';
import type { HealthRecommendation, ListingHealth } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { Chip } from '../ui';
import { Tooltip } from 'antd';
import { AI_HINT } from './factorState';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6';
const TOP = 3;
const COUNTED = new Set(['scored', 'seller_missing']);

export function potentialGain(data: ListingHealth): number {
  const gainOf = scoreGain(data);
  const top = (data.recommendations ?? []).slice(0, TOP);
  return Math.min(100 - (data.score ?? 0), top.reduce((s, r) => s + gainOf(r), 0));
}

function scoreGain(data: ListingHealth): (r: HealthRecommendation) => number {
  const budget = (data.factors ?? []).filter(f => COUNTED.has(f.state)).reduce((s, f) => s + f.weight, 0);
  return r => (budget ? (r.gain_points * 100) / budget : 0);
}

function RecommendationRow({ r, index, gain, productId }: { r: HealthRecommendation; index: number; gain: number; productId?: string }) {
  const first = index === 0;
  const blocker = r.kind === 'blocker';
  const onOpen = () => {
    if (productId) analyticsApi.recordHealthAction(productId, { recommendation_id: r.id, action: 'open', kind: r.kind }).catch(() => undefined);
  };
  return (
    <li className={`flex items-start gap-3 rounded-xl p-3 ${first ? 'border border-[#007700]/20 bg-[#007700]/[0.04]' : ''}`}>
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${blocker ? 'bg-red-100 text-red-700' : first ? 'bg-[#007700] text-white' : 'bg-stone-100 text-stone-600'}`}>
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`m-0 font-semibold text-stone-900 ${first ? 'text-[15px]' : 'text-sm'}`}>{r.title}</p>
          {blocker && <Chip tone="bad">Phải sửa</Chip>}
          {gain >= 0.1 && <Chip tone="good">+{decimal(gain, 1)} điểm</Chip>}
        </div>
        <p className="m-0 mt-1 text-xs leading-relaxed text-stone-600">{r.why}</p>
        <p className="m-0 mt-0.5 text-xs leading-relaxed text-stone-800">→ {r.action}</p>
        {r.method === 'ml_unvalidated' && <div className="mt-1.5"><Tooltip title={AI_HINT}><span className="cursor-help"><Chip>AI đoán, nên xem lại</Chip></span></Tooltip></div>}
      </div>
      {productId && <Link
        to={editLink(productId, r.field)}
        onClick={onOpen}
        className={`inline-flex shrink-0 items-center gap-0.5 rounded-lg text-sm font-semibold no-underline ${first ? 'bg-[#007700] px-3 py-1.5 text-white hover:bg-[#006200]' : 'px-1 py-1.5 text-[#007700]'}`}
      >
        {first ? 'Sửa ngay' : 'Sửa'}
        <ChevronRight size={14} aria-hidden />
      </Link>}
    </li>
  );
}

export function Recommendations({ data, productId }: { data: ListingHealth; productId?: string }) {
  const top = (data.recommendations ?? []).slice(0, TOP);
  const gainOf = scoreGain(data);
  const total = potentialGain(data);
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 inline-flex items-center gap-2 text-base font-bold text-stone-900">
          <ListChecks size={18} className="text-[#007700]" aria-hidden />
          Nên làm trước
        </h2>
        {total >= 0.1 && (
          <span className="text-sm text-stone-600">
            Làm xong có thể <b className="text-base font-bold text-[#007700]">+{decimal(total, 1)} điểm</b>
          </span>
        )}
      </div>
      {top.length === 0 ? (
        <p className="m-0 mt-2 text-sm text-stone-500">Chưa có khuyến nghị cho sản phẩm này.</p>
      ) : (
        <ol className="m-0 mt-3 list-none space-y-1 p-0">
          {top.map((r, i) => <RecommendationRow key={r.id} r={r} index={i} gain={gainOf(r)} productId={productId} />)}
        </ol>
      )}
    </section>
  );
}
