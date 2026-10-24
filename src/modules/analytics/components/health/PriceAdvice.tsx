import { Tag } from 'antd';
import { DollarSign, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const isHigh = over > 0;

  return (
    <Section
      title="Giá so với thị trường"
      subtitle="Đối sánh giá niêm yết với mặt bằng sản phẩm cùng nhóm"
      icon={<DollarSign size={18} />}
    >
      {/* Current price hero row */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/70 p-4">
        <div>
          <span className="text-xs text-stone-500">Giá bán hiện tại:</span>
          <div className="mt-0.5 font-jakarta text-2xl font-extrabold tabular-nums text-stone-900">
            {value !== null ? vnd(value) : 'Chưa có giá'}
          </div>
        </div>

        {value !== null && ref && (
          <div>
            {isHigh ? (
              <Tag color="orange" className="!m-0 inline-flex items-center gap-1 rounded-full px-3 py-1 font-jakarta text-xs font-bold">
                <AlertCircle size={12} /> Cao hơn mức giữa {over}%
              </Tag>
            ) : (
              <Tag color="green" className="!m-0 inline-flex items-center gap-1 rounded-full px-3 py-1 font-jakarta text-xs font-bold">
                <CheckCircle2 size={12} /> Giá cạnh tranh tốt
              </Tag>
            )}
          </div>
        )}
      </div>

      {/* Suggested range & median */}
      {suggestion && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span>Khoảng tham khảo:</span>
            <span className="font-bold tabular-nums text-stone-900">
              {vnd(suggestion.low)} – {vnd(suggestion.high)}
            </span>
          </div>

          <PriceRange price={value} low={suggestion.low} mid={ref} high={suggestion.high} />
        </div>
      )}

      {/* Guidance box */}
      <div
        className={`mt-5 rounded-xl border p-3.5 text-xs leading-relaxed ${
          isHigh
            ? 'border-amber-200/80 bg-amber-50/60 text-amber-900'
            : 'border-emerald-200/80 bg-emerald-50/60 text-emerald-900'
        }`}
      >
        <p className="m-0 font-medium">
          {isHigh
            ? 'Nếu sản phẩm làm thủ công tinh xảo hoặc dùng chất liệu cao cấp, hãy nhấn mạnh rõ trong mô tả và chụp cận cảnh để khách hàng cảm nhận được giá trị xứng đáng.'
            : 'Giá của bạn đang nằm trong khoảng tối ưu, phần điểm giá đã đạt tiêu chuẩn tối đa.'}
        </p>
      </div>

      {/* Reference meta footer */}
      <p className="m-0 mt-3 flex items-center gap-1 text-[11px] text-stone-400">
        <Info size={12} className="shrink-0" />
        <span>
          {reference?.source && `Ước tính từ ${SOURCE_TEXT[reference.source]}. `}
          Khoảng tham khảo mang tính định hướng, không bắt buộc.
        </span>
      </p>
    </Section>
  );
}
