import { Tag } from 'antd';
import { vnd } from '../../format';
import type { HealthFactor, ListingHealth } from '../../healthTypes';
import { PriceRange } from './PriceRange';
import { Section } from './Section';

type Source = NonNullable<NonNullable<HealthFactor['reference']>['source']>;

const SOURCE_TEXT: Record<Source, string> = {
  category: 'sản phẩm cùng danh mục trên VietCraft',
  group: 'sản phẩm cùng nhóm hàng trên VietCraft',
  model: 'sản phẩm tương tự, ước tính từ tên sản phẩm',
  tiki: 'sản phẩm cùng nhóm trên Tiki',
};

export function PriceAdvice({ data }: { data: ListingHealth }) {
  const row = data.breakdown.find(r => r.key === 'price');
  if (!row || (row.value === null && !row.suggestion)) return null;
  const { value, suggestion, reference } = row;
  const ref = reference?.price ?? null;
  const over = value !== null && ref ? Math.round((value / ref - 1) * 100) : 0;

  return (
    <Section title="Giá so với sản phẩm tương tự">
      <p className="m-0 text-sm text-stone-500">Giá bạn đang bán</p>
      <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
        <span className="text-2xl font-bold tabular-nums text-stone-900">{value !== null ? vnd(value) : 'Chưa có giá'}</span>
        {value !== null && ref && <Tag variant="filled" color={over > 0 ? 'orange' : 'green'} className="!m-0">{over > 0 ? `Cao hơn mức giữa ${over}%` : 'Không cao hơn mức giữa'}</Tag>}
      </div>
      {suggestion && (
        <p className="m-0 mt-2 text-[13px] text-stone-600">
          Khoảng tham khảo <span className="font-semibold tabular-nums text-stone-900">{vnd(suggestion.low)} đến {vnd(suggestion.high)}</span>
          {ref && <>, mức giữa <span className="font-semibold tabular-nums text-stone-900">{vnd(ref)}</span></>}
        </p>
      )}
      {suggestion && <PriceRange price={value} low={suggestion.low} mid={ref} high={suggestion.high} />}
      <p className="m-0 mt-3 text-[13px] leading-relaxed text-stone-700">
        {over > 0
          ? `Nếu sản phẩm làm thủ công hoặc dùng chất liệu tốt, hãy nói rõ trong mô tả và ảnh để khách hiểu vì sao giá cao hơn.`
          : 'Giá bạn không cao hơn mức giữa, phần giá đang được đủ điểm.'}
      </p>
      <p className="m-0 mt-2 text-xs leading-relaxed text-stone-500">
        {reference?.source && `So với ${SOURCE_TEXT[reference.source]}. `}Giá gấp đôi mức giữa trở lên thì không được điểm giá. Khoảng tham khảo không phải giá bắt buộc.
      </p>
    </Section>
  );
}
