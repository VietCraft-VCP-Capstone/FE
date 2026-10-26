import { decimal } from '../../format';
import type { SellChance, SellChanceAdvice } from '../../healthTypes';
import { useInsight } from '../../hooks/useInsight';
import { InsightBlock } from '../InsightBlock';
import { InsightCard, Note } from '../ui';

const ADVICE: Record<string, { label: string; unit: string }> = {
  photos: { label: 'Số ảnh', unit: ' ảnh' },
  description_length: { label: 'Độ dài mô tả', unit: ' ký tự' },
  name_length: { label: 'Độ dài tên', unit: ' ký tự' },
  log_price_rel: { label: 'Giá so với mức giữa của nhóm', unit: '%' },
  seller_ship_days: { label: 'Số ngày giao hàng của shop', unit: ' ngày' },
};

const COMPARE: Record<string, string> = {
  days_since_last: 'Số ngày từ đơn gần nhất',
  log_sales_90d: 'Số món bán 90 ngày qua',
  log_sales_180d: 'Số món bán 180 ngày qua',
  log_seller_sales: 'Số món shop bán (180 ngày)',
  log_seller_listings: 'Số sản phẩm có đơn (180 ngày) của shop',
  log_reviews: 'Số đánh giá',
  rating: 'Điểm sao',
  seller_rating: 'Điểm sao của shop',
};

const WHAT_IS_IT = 'Con số này ước tính khả năng sản phẩm có đơn, so với các sản phẩm tương tự. Chỉ để tham khảo, không phải cam kết.';

function signed(feature: string, v: number | null, unit: string) {
  if (v === null) return '-';
  return feature === 'log_price_rel' && v > 0 ? `+${decimal(v, 0)}%` : `${decimal(v, 1)}${unit}`;
}

function AdviceRow({ a }: { a: SellChanceAdvice }) {
  const meta = ADVICE[a.feature] ?? { label: a.feature, unit: '' };
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-[13px]">
      <span className="text-stone-800">
        {meta.label}: <strong>{signed(a.feature, a.current, meta.unit)}</strong> → <strong>{signed(a.feature, a.target, meta.unit)}</strong>
      </span>
      <span className="whitespace-nowrap text-xs font-semibold text-[#005B00]">+{decimal(a.gain * 100, 1)}% khả năng có đơn</span>
    </li>
  );
}

function Body({ data }: { data: SellChance }) {
  const group = data.peer_group.type === 'category' ? `danh mục "${data.peer_group.name}"` : 'toàn sàn';
  const m = data.model;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="font-jakarta text-4xl font-extrabold leading-none tabular-nums text-stone-900">{data.score}%</span>
        <span className="pb-1 text-sm text-stone-500">khả năng có đơn so với sản phẩm cùng nhóm</span>
        <span className="mb-1 text-[13px] text-stone-700">
          Khả năng có đơn trong {m.horizon_days} ngày tới cao hơn {data.score}% sản phẩm trong {group} ({data.peer_group.size} sản phẩm).
        </span>
      </div>
      <section>
        <h3 className="m-0 text-[13px] font-bold text-stone-900">Có thể thử thay đổi để tăng khả năng có đơn</h3>
        {data.advice.length ? (
          <ul className="m-0 list-none divide-y divide-stone-100 p-0">{data.advice.map(a => <AdviceRow key={a.feature} a={a} />)}</ul>
        ) : (
          <div className="py-2"><Note>Theo số liệu đã có, ảnh, mô tả và giá không làm thay đổi đáng kể khả năng ra đơn khi đã biết đà bán. Phần kiểm tra ảnh, mô tả ở trên là điều kiện tối thiểu, không phải lợi thế cạnh tranh.</Note></div>
        )}
      </section>
      <section>
        <h3 className="m-0 text-[13px] font-bold text-stone-900">So với nhóm (mức giữa)</h3>
        <ul className="m-0 list-none p-0 text-[13px] text-stone-700">
          {data.compare.map(c => (
            <li key={c.feature} className="flex justify-between gap-3 py-1">
              <span>{COMPARE[c.feature] ?? c.feature}</span>
              <span className="tabular-nums"><strong>{decimal(c.value, 1)}</strong> / {decimal(c.peer_median, 1)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function SellChanceCard({ productId }: { productId: string }) {
  const { state, reload } = useInsight<SellChance>(`/listings/${productId}/health/ml`);
  return (
    <InsightCard title="Khả năng ra đơn" info={WHAT_IS_IT} bodyClassName="px-4 py-3">
      <InsightBlock state={state} onRetry={reload} compact>
        {data => <Body data={data} />}
      </InsightBlock>
    </InsightCard>
  );
}
