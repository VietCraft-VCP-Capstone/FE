import { Tooltip } from 'antd';
import { DollarSign, Info, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { vnd } from '../../format';
import type { HealthFactor, ListingHealth } from '../../healthTypes';

type Source = NonNullable<NonNullable<HealthFactor['reference']>['source']>;

const SOURCE_TEXT: Record<Source, string> = {
  category: 'sản phẩm cùng danh mục trên VietCraft',
  group: 'sản phẩm cùng nhóm hàng trên VietCraft',
  model: 'sản phẩm tương tự, ước tính từ tên sản phẩm',
  tiki: 'sản phẩm cùng nhóm trên sàn thị trường',
};

export function PriceAdvice({ data }: { data: ListingHealth }) {
  const row = data.breakdown.find(r => r.key === 'price');
  if (!row || (row.value === null && !row.suggestion)) return null;

  const { value, suggestion, reference } = row;
  const ref = reference?.price ?? null;
  const over = value !== null && ref ? Math.round((value / ref - 1) * 100) : 0;
  const isHigh = over > 0;

  return (
    <div className="border border-stone-200 bg-white rounded-lg p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-stone-100 text-stone-700">
            <DollarSign size={14} />
          </div>
          <div>
            <h3 className="m-0 font-jakarta text-xs font-bold text-[#111111]">
              Giá bán so với thị trường
            </h3>
            <p className="m-0 mt-0.5 text-[11px] text-stone-400">
              Đối sánh giá niêm yết với mặt bằng sản phẩm cùng nhóm trên sàn
            </p>
          </div>
        </div>
        <Tooltip title="So sánh mức giá để bạn cân đối khả năng cạnh tranh và giá trị thực tế của sản phẩm.">
          <Info size={12} className="text-stone-300 hover:text-stone-600 cursor-help" />
        </Tooltip>
      </div>

      {/* 3 Metric Comparison in flat divided grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-100 border border-stone-200/90 rounded-md overflow-hidden">
        {/* Card 1: Your Price */}
        <div className="p-3.5 bg-stone-50/40 hover:bg-stone-50/80 transition-colors duration-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Giá niêm yết của bạn
          </span>
          <div className="mt-1 font-jakarta text-2xl font-black text-[#111111] tabular-nums">
            {value !== null ? vnd(value) : 'Chưa có giá'}
          </div>
          <div className="mt-2">
            {isHigh ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 transition-transform hover:scale-105">
                <AlertCircle size={11} />
                <span>Cao hơn mức phổ biến {over}%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#EAF0E2] text-[#007700] transition-transform hover:scale-105">
                <CheckCircle2 size={11} />
                <span>Giá cạnh tranh tốt</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Market Median */}
        <div className="p-3.5 bg-white hover:bg-stone-50/50 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Mức giá phổ biến
            </span>
            <Tooltip title="Mức giá đứng giữa của các sản phẩm tương tự trên sàn mà khách thường đặt mua.">
              <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help transition-colors" />
            </Tooltip>
          </div>
          <div className="mt-1 font-jakarta text-2xl font-black text-stone-900 tabular-nums">
            {ref ? vnd(ref) : 'Đang cập nhật'}
          </div>
          <p className="m-0 mt-2 text-[11px] text-stone-500">
            Mức giữa của các sản phẩm cùng nhóm hàng
          </p>
        </div>

        {/* Card 3: Suggested Range */}
        {suggestion ? (
          <div className="p-3.5 bg-white hover:bg-stone-50/50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Khoảng giá gợi ý
              </span>
              <Tooltip title="Khung giá từ thấp đến cao được gợi ý phù hợp với dòng sản phẩm này.">
                <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help transition-colors" />
              </Tooltip>
            </div>
            <div className="mt-1 font-jakarta text-lg font-black text-stone-900 tabular-nums pt-1">
              {vnd(suggestion.low)} – {vnd(suggestion.high)}
            </div>
            <p className="m-0 mt-2 text-[11px] text-stone-500">
              Khung giá người mua dễ chốt đơn nhất
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-white flex flex-col justify-center text-center">
            <span className="text-xs text-stone-400">Đang cập nhật khoảng giá thị trường</span>
          </div>
        )}
      </div>

      {/* E-commerce Seller Guidance Callout */}
      <div className={`mt-3.5 py-2.5 px-3 border-l-2 text-xs leading-relaxed flex items-start gap-2.5 transition-colors duration-200 ${
        isHigh
          ? 'border-amber-500 bg-amber-50/50 text-amber-900'
          : 'border-[#007700] bg-[#EAF0E2]/40 text-[#171D15]'
      }`}>
        <Lightbulb size={14} className={`shrink-0 mt-0.5 transition-transform duration-300 hover:rotate-12 cursor-pointer ${isHigh ? 'text-amber-700' : 'text-[#007700]'}`} />
        <p className="m-0">
          {isHigh
            ? `Giá niêm yết của shop đang cao hơn mức phổ biến trên sàn ${over}%. Mẹo tăng đơn: Tạo thêm Mã giảm giá (Voucher) hoặc Combo khuyến mãi để kích thích khách mua nhanh mà không cần hạ giá niêm yết.`
            : 'Mức giá hiện tại của shop đang nằm đúng trong khung giá cạnh tranh nhất trên sàn, giúp sản phẩm có tỷ lệ chốt đơn rất tốt.'}
        </p>
      </div>

      {/* Reference Note */}
      <p className="m-0 mt-2.5 flex items-center gap-1 text-[11px] text-stone-400">
        <Info size={11} className="shrink-0" />
        <span>
          {reference?.source && `Tham khảo từ ${SOURCE_TEXT[reference.source]}. `}
          Khoảng giá tham khảo dựa trên các đơn hàng tương tự bán chạy trên sàn, shop hoàn toàn chủ động định giá theo chiến lược riêng.
        </span>
      </p>
    </div>
  );
}
