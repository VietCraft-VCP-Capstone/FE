import { pct, vnd } from '../../format';
import type { HealthFactorV3, ListingHealth } from '../../healthTypes';

const REASON_LABEL: Record<string, string> = {
  process: 'cách làm',
  origin: 'xuất xứ',
  warranty: 'bảo hành, chứng nhận',
  size: 'kích thước',
};

type PriceEvidence = {
  pct: number | null;
  n: number | null;
  factor: number | null;
  reasons: string[] | null;
  p10: number | null;
  p90: number | null;
};

function FactorPrice({ f }: { f: HealthFactorV3 }) {
  if (f.state === 'seller_missing') return <p className="m-0 mt-2 text-sm text-stone-500">Chưa có giá.</p>;
  if (f.state === 'not_applicable') return <p className="m-0 mt-2 text-sm text-stone-500">Chưa đủ sản phẩm tương đồng để so giá.</p>;
  if (f.state === 'technical_failure') return <p className="m-0 mt-2 text-sm text-stone-500">Chưa so giá được lúc này.</p>;
  const ev = f.evidence as PriceEvidence;
  return (
    <div className="mt-2 space-y-1.5">
      <p className="m-0 text-sm font-semibold text-stone-900">
        Giá của bạn ở phân vị {pct(ev.pct, 0)} so với {ev.n ?? '—'} sản phẩm cùng danh mục{ev.factor && ev.factor !== 1 ? ', đã quy đổi theo chất liệu' : ''}
      </p>
      <p className="m-0 text-xs text-stone-600">Khoảng giá phổ biến (P10–P90): {vnd(ev.p10)} đến {vnd(ev.p90)}</p>
      {ev.reasons?.length ? <p className="m-0 text-xs text-stone-600">Lý do giá đã nêu: {ev.reasons.map(r => REASON_LABEL[r] ?? r).join(', ')}</p> : null}
    </div>
  );
}

export function PriceCompare({ data }: { data: ListingHealth }) {
  const factor = data.factors?.find(f => f.key === 'price');
  if (!factor) return null;
  return (
    <div>
      <h2 className="m-0 text-base font-bold text-stone-900">So sánh giá</h2>
      <FactorPrice f={factor} />
    </div>
  );
}
