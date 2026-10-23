import { Tooltip } from 'antd';
import { Sparkles, Layers, Info } from 'lucide-react';
import type { ListingHealth } from '../../healthTypes';

export function FactorBreakdownCard({
  data,
  selectedFactor = 'images',
}: {
  data: ListingHealth;
  selectedFactor?: string;
}) {
  const imgFactor = data.breakdown.find(f => f.key === 'image');
  const descFactor = data.breakdown.find(f => f.key === 'description');
  const priceFactor = data.breakdown.find(f => f.key === 'price');
  const matFactor = data.breakdown.find(f => f.key === 'material');
  const revFactor = data.breakdown.find(f => f.key === 'review');

  const imgScore = Math.min(99, Math.round(imgFactor?.sub_score ?? 64));
  const descScore = Math.min(99, Math.round(descFactor?.sub_score ?? 91));
  const matScore = Math.min(99, Math.round(matFactor?.sub_score ?? 97));
  const priceScore = Math.min(99, Math.round(priceFactor?.sub_score ?? 82));
  const revScore = Math.min(99, Math.round(revFactor?.sub_score ?? 78));

  // Dynamic configuration based on selected factor
  let factorTitle = 'Hình ảnh & Mockup';
  let scorePct = imgScore;
  let ringLabel = 'Chuẩn Studio';
  let ringSub = '300 DPI · 5+ góc';
  let ringColor = '#D9822B';
  let tiers = [
    { label: '5+ ảnh đạt chuẩn (300 DPI)', count: 84, pct: 64, color: 'bg-[#346538]' },
    { label: '3-4 ảnh tiêu chuẩn', count: 31, pct: 23, color: 'bg-[#5B8C5A]' },
    { label: '1-2 ảnh tối thiểu', count: 15, pct: 11, color: 'bg-[#D9822B]' },
    { label: 'Độ phân giải thấp (<1000px)', count: 2, pct: 2, color: 'bg-[#E26D68]' },
  ];
  let aiAdvice = 'Bổ sung mockup đời thực để tăng 24% tỉ lệ click-through.';

  if (selectedFactor === 'content') {
    factorTitle = 'Nội dung & SEO';
    scorePct = descScore;
    ringLabel = 'Chuẩn SEO';
    ringSub = 'Đầy đủ từ khoá';
    ringColor = '#346538';
    tiers = [
      { label: 'Tiêu đề chứa 3+ từ khoá hot', count: 112, pct: 85, color: 'bg-[#346538]' },
      { label: 'Mô tả chi tiết > 500 ký tự', count: 98, pct: 74, color: 'bg-[#346538]' },
      { label: 'Gắn đủ 13/13 thẻ tag ngành', count: 120, pct: 91, color: 'bg-[#5B8C5A]' },
      { label: 'Thiếu thông số chất liệu/size', count: 14, pct: 10, color: 'bg-[#E26D68]' },
    ];
    aiAdvice = 'Nội dung xuất sắc. Hãy cập nhật từ khoá mùa vụ đón đầu tìm kiếm.';
  } else if (selectedFactor === 'conversion') {
    factorTitle = 'Tỉ lệ chuyển đổi';
    scorePct = 68;
    ringLabel = 'Chuyển đổi';
    ringSub = '3.8% đơn/click';
    ringColor = '#346538';
    tiers = [
      { label: 'Lượt xem sản phẩm (30 ngày)', count: 410, pct: 75, color: 'bg-[#346538]' },
      { label: 'Tỉ lệ thêm giỏ hàng (Cart)', count: 38, pct: 45, color: 'bg-[#5B8C5A]' },
      { label: 'Tỉ lệ thanh toán hoàn tất', count: 12, pct: 28, color: 'bg-[#D9822B]' },
      { label: 'Giỏ hàng bỏ quên chưa mua', count: 26, pct: 32, color: 'bg-[#E26D68]' },
    ];
    aiAdvice = 'Tỉ lệ bỏ giỏ cao. Kích hoạt voucher khi khách xem lần 2 để chốt đơn.';
  } else if (selectedFactor === 'pricing') {
    factorTitle = 'Vị thế giá bán';
    scorePct = priceScore;
    ringLabel = 'Định vị giá';
    ringSub = '-21% vs đối thủ';
    ringColor = '#346538';
    tiers = [
      { label: 'Giá rẻ hơn đối thủ (>15%)', count: 42, pct: 55, color: 'bg-[#346538]' },
      { label: 'Giá ngang bằng trung vị sàn', count: 68, pct: 35, color: 'bg-[#5B8C5A]' },
      { label: 'Giá cao hơn trung vị sàn', count: 18, pct: 15, color: 'bg-[#D9822B]' },
      { label: 'Chưa tạo combo mua kèm deal sốc', count: 22, pct: 20, color: 'bg-[#E26D68]' },
    ];
    aiAdvice = 'Lợi thế giá tốt (-21%). Tận dụng tạo combo 2 sản phẩm tăng AOV.';
  } else if (selectedFactor === 'production') {
    factorTitle = 'Giao hàng đúng hẹn';
    scorePct = matScore;
    ringLabel = 'Vận hành';
    ringSub = '99% đúng hẹn';
    ringColor = '#346538';
    tiers = [
      { label: 'Xuất kho và giao trong 24h', count: 128, pct: 97, color: 'bg-[#346538]' },
      { label: 'Phôi in sẵn sàng tại xưởng', count: 130, pct: 98, color: 'bg-[#346538]' },
      { label: 'Giao chậm do đơn vị vận chuyển', count: 3, pct: 2, color: 'bg-[#D9822B]' },
      { label: 'Huỷ đơn do hết mẫu vải', count: 1, pct: 1, color: 'bg-[#E26D68]' },
    ];
    aiAdvice = 'Cung ứng xuất sắc. Shop chuẩn SLA được ưu tiên hiển thị Organic.';
  } else if (selectedFactor === 'returns') {
    factorTitle = 'Đánh giá & Hoàn trả';
    scorePct = revScore;
    ringLabel = 'Hài lòng';
    ringSub = '2.4% hoàn hàng';
    ringColor = '#E26D68';
    tiers = [
      { label: 'Đánh giá 5 sao từ khách mua thật', count: 95, pct: 82, color: 'bg-[#346538]' },
      { label: 'Đánh giá 4 sao hài lòng', count: 18, pct: 12, color: 'bg-[#5B8C5A]' },
      { label: 'Đổi trả do chọn nhầm kích cỡ (size)', count: 4, pct: 4, color: 'bg-[#D9822B]' },
      { label: 'Khiếu nại màu in lệch so với ảnh', count: 2, pct: 2, color: 'bg-[#E26D68]' },
    ];
    aiAdvice = 'Bổ sung bảng đo chiều cao/cân nặng vào ảnh thứ 4 giảm nhầm size.';
  }

  const r = 36;
  const c = 2 * Math.PI * r;
  const strokeOffset = c * (1 - scorePct / 100);

  return (
    <div className="space-y-3.5">
      {/* Tray Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-stone-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Phân tích:
          </span>
          <span className="text-xs font-bold text-[#111111]">{factorTitle}</span>
        </div>

        <Tooltip title="Tỉ lệ đạt chuẩn theo tiêu chuẩn kỹ thuật thuật toán sàn">
          <span className="cursor-help rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-700 flex items-center gap-1">
            <span>{scorePct}% ĐẠT CHUẨN</span>
            <Info size={10} className="text-stone-400" />
          </span>
        </Tooltip>
      </div>

      {/* Content Layout: Ring + Tiers + AI Advice */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left: Compact Circular Ring (3 cols) */}
        <div className="md:col-span-3 flex items-center justify-center gap-3">
          <div className="relative flex shrink-0 items-center justify-center">
            <svg viewBox="0 0 90 90" className="h-20 w-20">
              <circle cx="45" cy="45" r={r} fill="none" stroke="#F1F1EF" strokeWidth="5" />
              <circle
                cx="45"
                cy="45"
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 45 45)"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-jakarta text-base font-black text-[#111111] tabular-nums">
                {scorePct}%
              </span>
              <span className="text-[9px] text-stone-400">84/132 sp</span>
            </div>
          </div>

          <div className="text-left text-xs">
            <div className="font-bold text-stone-800">{ringLabel}</div>
            <div className="text-[11px] text-stone-500">{ringSub}</div>
          </div>
        </div>

        {/* Middle: Tier Progress Bars (5 cols) */}
        <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-stone-100 pt-3 md:pt-0 md:pl-5">
          {tiers.map(tier => (
            <div key={tier.label} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-stone-600 font-medium truncate">{tier.label}</span>
                <span className="font-mono font-semibold text-stone-800 shrink-0 ml-2">
                  {tier.count} <span className="text-[10px] text-stone-400">({tier.pct}%)</span>
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-stone-100 overflow-hidden">
                <div className={`h-full rounded-full ${tier.color}`} style={{ width: `${tier.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Right: AI Directive (4 cols) */}
        <div className="md:col-span-4 rounded-lg bg-[#FBF3DB] border border-[#F2E4B8] p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#956400]">
            <Sparkles size={12} className="text-[#956400]" />
            <span>Gợi ý từ AI</span>
          </div>
          <p className="m-0 mt-1 text-[11px] leading-relaxed text-[#784D06]">
            {aiAdvice}
          </p>
        </div>
      </div>
    </div>
  );
}
