import type { ReactNode } from 'react';
import { Collapse } from 'antd';
import { decimal } from '../../format';
import type { HealthFactorKey, ListingHealth } from '../../healthTypes';
import { PART, SOURCE } from './whyText';

function liftText(markets: ListingHealth['basis']['markets']): string | null {
  const lifts = Object.values(markets ?? {}).map(m => m?.lift).filter((x): x is number => Number.isFinite(x));
  if (lifts.length === 0) return null;
  const lo = decimal(Math.min(...lifts), 1);
  const hi = decimal(Math.max(...lifts), 1);
  return lo === hi ? `${lo} lần` : `${lo} đến ${hi} lần`;
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="m-0 text-[13px] font-semibold text-stone-900">{title}</p>
      <div className="mt-1 text-[13px] leading-relaxed text-stone-700">{children}</div>
    </div>
  );
}

function Body({ data }: { data: ListingHealth }) {
  const { weights, markets, ranges, sources } = data.basis;
  const lift = liftText(markets);
  const parts = (Object.keys(weights) as HealthFactorKey[]).sort((a, b) => weights[b] - weights[a]);
  const top = parts.slice(0, 3).map(k => PART[k].label.toLowerCase());
  const learned = parts.filter(k => sources?.[k] === 'learned');
  const fixed = parts.filter(k => sources?.[k] && sources[k] !== 'learned');
  const pool = learned.reduce((sum, k) => sum + weights[k], 0);

  return (
    <div className="space-y-6">
      <Block title="1. Điểm 100 được chia cho 6 phần">
        <p className="m-0">Phần nào ảnh hưởng nhiều đến việc bán được hàng thì được nhiều điểm hơn.</p>
        <ul className="m-0 mt-3 grid list-none gap-x-8 gap-y-1 p-0 md:grid-cols-2 xl:grid-cols-3">
          {parts.map(k => (
            <li key={k} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 border-t border-stone-100 py-2.5">
              <span className="font-semibold tabular-nums text-stone-900">{PART[k].label}<span className="block text-xs font-normal text-stone-500">tối đa {weights[k]}</span></span>
              <span>
                {PART[k].why}
                {sources?.[k] && <span className="mt-0.5 block text-xs text-stone-500">{SOURCE[sources[k]!]}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Block>
      <div className="grid gap-6 md:grid-cols-3">
      <Block title={`2. Vì sao ${learned.map(k => `${PART[k].label.toLowerCase()} ${weights[k]}`).join(', ') || 'có các mức này'}?`}>
        {fixed.length > 0 && <p className="m-0">{fixed.map(k => `${PART[k].label} ${weights[k]}`).join(', ')} là mức cố định, không tính từ dữ liệu.</p>}
        {learned.length > 0 && (
          <p className="m-0 mt-1.5">
            {pool} điểm còn lại chia cho {learned.map(k => PART[k].label.toLowerCase()).join(', ')}. Chúng tôi xem hơn 33 nghìn sản phẩm đã bán thật, đo xem mỗi phần khác nhau bao nhiêu giữa hàng bán chạy và hàng bán chậm, rồi chia điểm theo đúng tỉ lệ đó. {PART[learned[0]].label} tạo khác biệt lớn nhất nên được nhiều điểm nhất.
          </p>
        )}
        {lift && <p className="m-0 mt-1.5">Kiểm tra lại trên Tiki và Shopee: sản phẩm điểm cao bán chạy gấp {lift} so với sản phẩm điểm thấp.</p>}
      </Block>
      <Block title="3. Con số có chắc chắn không?">
        <p className="m-0">
          Đây là ước lượng, không phải con số tuyệt đối.
          {ranges?.image && ` Ví dụ ảnh đang tối đa ${weights.image} điểm, nhưng tính lại với nhóm dữ liệu khác thì có thể từ ${ranges.image[0]} đến ${ranges.image[1]} điểm.`}
          {` Điều gần như không đổi là thứ tự quan trọng: ${top.join(', rồi ')}. Vì vậy hãy ưu tiên sửa theo thứ tự đó.`}
        </p>
      </Block>
      <Block title="4. Điểm này không phải là gì">
        <p className="m-0">Điểm cao không có nghĩa là chắc chắn bán được, và điểm không ảnh hưởng đến thứ hạng khi khách tìm kiếm trên sàn. Điểm chỉ giúp bạn biết tin đăng còn thiếu gì.</p>
      </Block>
      </div>
    </div>
  );
}

export function WhyScore({ data }: { data: ListingHealth }) {
  return (
    <div className="border-t border-stone-200">
      <Collapse ghost expandIconPlacement="end" items={[{ key: 'why', label: <span className="font-semibold text-stone-900">Vì sao điểm được tính như vậy?</span>, children: <Body data={data} /> }]} />
    </div>
  );
}
