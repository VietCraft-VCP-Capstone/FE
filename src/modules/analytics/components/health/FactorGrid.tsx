import { Tooltip } from 'antd';
import { ArrowUpRight, Info } from 'lucide-react';
import type { ListingHealth } from '../../healthTypes';

export interface DriverCardItem {
  id: string;
  title: string;
  value: string;
  pct: number;
  hasArrowUp?: boolean;
  impact: 'Trọng số cao' | 'Trọng số vừa' | 'Trọng số nhẹ';
  impactClass: string;
  barColor: string;
  desc: string;
}

export function FactorGrid({
  data,
  selectedFactor,
  onSelectFactor,
}: {
  data: ListingHealth;
  selectedFactor?: string;
  onSelectFactor?: (id: string) => void;
}) {
  const imgFactor = data.breakdown.find(f => f.key === 'image');
  const descFactor = data.breakdown.find(f => f.key === 'description');
  const priceFactor = data.breakdown.find(f => f.key === 'price');
  const materialFactor = data.breakdown.find(f => f.key === 'material');
  const reviewFactor = data.breakdown.find(f => f.key === 'review');

  const contentScore = Math.min(99, Math.round(descFactor?.sub_score ?? 91));
  const imageScore = Math.min(99, Math.round(imgFactor?.sub_score ?? 64));
  const matScore = Math.min(99, Math.round(materialFactor?.sub_score ?? 97));

  let priceDiff = '-4%';
  let pricePct = 78;
  if (priceFactor?.value && priceFactor.reference?.price) {
    const diff = Math.round((priceFactor.value / priceFactor.reference.price - 1) * 100);
    priceDiff = diff > 0 ? `+${diff}%` : `${diff}%`;
    pricePct = Math.max(20, Math.min(100, 100 - Math.abs(diff)));
  }

  const revRating = reviewFactor?.value ? `${reviewFactor.value}★` : '2.4%';

  const drivers: DriverCardItem[] = [
    {
      id: 'images',
      title: 'Hình ảnh & Mockup',
      value: `${imageScore}%`,
      pct: imageScore,
      impact: 'Trọng số cao',
      impactClass: 'bg-[#FBF3DB] text-[#956400]',
      barColor: 'bg-[#D9822B]',
      desc: 'Yêu cầu từ 5 ảnh trở lên, tỷ lệ 1:1, độ phân giải tối thiểu 300 DPI.',
    },
    {
      id: 'content',
      title: 'Nội dung & SEO',
      value: `${contentScore}%`,
      pct: contentScore,
      impact: 'Trọng số cao',
      impactClass: 'bg-[#EDF3EC] text-[#346538]',
      barColor: 'bg-[#346538]',
      desc: 'Tiêu đề chứa từ khoá tìm kiếm, mô tả chuẩn bố cục và đủ 13 thẻ tag.',
    },
    {
      id: 'conversion',
      title: 'Tỉ lệ chuyển đổi',
      value: '3.8%',
      pct: 68,
      hasArrowUp: true,
      impact: 'Trọng số cao',
      impactClass: 'bg-[#EDF3EC] text-[#346538]',
      barColor: 'bg-[#346538]',
      desc: 'Tỉ lệ khách đặt hàng trên tổng lượt truy cập xem sản phẩm 30 ngày.',
    },
    {
      id: 'pricing',
      title: 'Vị thế giá bán',
      value: priceDiff,
      pct: pricePct,
      impact: 'Trọng số vừa',
      impactClass: 'bg-[#EDF3EC] text-[#346538]',
      barColor: 'bg-[#346538]',
      desc: 'Độ chênh lệch giá niêm yết so với mức giá trung vị cùng phân khúc trên sàn.',
    },
    {
      id: 'production',
      title: 'Giao hàng đúng hẹn',
      value: `${matScore}%`,
      pct: matScore,
      impact: 'Trọng số vừa',
      impactClass: 'bg-[#EDF3EC] text-[#346538]',
      barColor: 'bg-[#346538]',
      desc: 'Tỉ lệ đơn sản xuất xuất kho và giao đúng cam kết SLA 24h.',
    },
    {
      id: 'returns',
      title: 'Đánh giá & Hoàn trả',
      value: revRating,
      pct: 82,
      hasArrowUp: true,
      impact: 'Trọng số nhẹ',
      impactClass: 'bg-[#FDEBEC] text-[#9F2F2D]',
      barColor: 'bg-[#E26D68]',
      desc: 'Tỉ lệ khách hàng khiếu nại chất lượng in, nhầm size hoặc yêu cầu hoàn đơn.',
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            6 Trụ cột quyết định điểm
          </span>
          <Tooltip title="6 chỉ số cốt lõi ảnh hưởng trực tiếp tới thứ hạng hiển thị theo thuật toán sàn">
            <Info size={12} className="text-stone-300 hover:text-stone-600 transition-colors cursor-help" />
          </Tooltip>
        </div>
        <span className="text-[11px] text-stone-400">Chọn để xem phân tích</span>
      </div>

      {/* Clean Bento Grid without text clutter */}
      <div className="mt-3.5 grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white overflow-hidden">
        {drivers.map(card => {
          const isSelected = selectedFactor === card.id || (!selectedFactor && card.id === 'images');

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectFactor?.(card.id)}
              className={`group flex flex-col justify-between p-3.5 text-left transition-all ${
                isSelected ? 'bg-stone-50/90 ring-1 ring-inset ring-stone-900/10' : 'bg-white hover:bg-stone-50/40'
              }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 min-w-0 pr-1">
                    <span className={`text-xs truncate ${isSelected ? 'font-bold text-[#111111]' : 'font-medium text-stone-700'}`}>
                      {card.title}
                    </span>
                    <Tooltip title={card.desc} placement="top">
                      <span className="cursor-help text-stone-300 hover:text-stone-600">
                        <Info size={11} />
                      </span>
                    </Tooltip>
                  </div>

                  <ArrowUpRight
                    size={12}
                    className={`shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isSelected ? 'text-[#111111]' : 'text-stone-300'
                    }`}
                  />
                </div>

                <div className="mt-2.5 flex items-baseline justify-between gap-1">
                  <div className="font-jakarta text-xl font-black tracking-tight text-[#111111] tabular-nums">
                    {card.value}
                    {card.hasArrowUp && <span className="ml-0.5 text-xs font-bold text-stone-700">▲</span>}
                  </div>
                  <Tooltip title={`Trọng số đóng góp: ${card.impact}`} placement="top">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide cursor-help ${card.impactClass}`}>
                      {card.impact}
                    </span>
                  </Tooltip>
                </div>

                {/* 3px indicator line */}
                <div className="mt-2 h-1 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div className={`h-full rounded-full ${card.barColor}`} style={{ width: `${card.pct}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
