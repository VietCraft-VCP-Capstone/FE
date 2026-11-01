import React, { useMemo, useState } from 'react';
import { HelpCircle, Lightbulb, Sparkles } from 'lucide-react';
import type { OccasionTraitItem } from '../../types/evidence';
import { ConfidenceBadge } from '../evidence/ConfidenceBadge';
import { EvidenceTrigger } from '../evidence/EvidenceTrigger';

const TRAIT_ACTIONABLE_ADVICE: Record<string, string> = {
  ordersGrowth: 'Lượng đơn mỗi ngày tăng mạnh. Cần chủ động tăng tồn kho sản phẩm chủ lực và bố trí người đóng gói để tránh trễ hạn giao.',
  higherSpending: 'Giá trị trung bình mỗi đơn tăng so với ngày thường. Hãy tạo combo đóng gói đẹp mắt hoặc bán kèm phụ kiện để tối ưu giỏ hàng.',
  earlyOrder: 'Khách có thói quen mua sớm trước dịp. Cần đăng bài, chụp ảnh và thu thập 3-5 đánh giá đầu tiên từ trước ngày lễ 3-4 tuần.',
  peakClustering: 'Đơn hàng tập trung dồn vào 3 ngày cao điểm nhất. Cần in sẵn tem vận chuyển và chuẩn bị sẵn thùng hộp trước để tránh nghẽn giao hàng.',
  comboPurchase: 'Khách mua nhiều món trong một đơn tăng vọt. Nên kích hoạt tính năng "Mua kèm deal sốc" hoặc combo giảm 5-10% để chốt đơn.',
  voucherSensitivity: 'Khách hàng chủ động săn mã giảm giá trước khi mua. Hãy thiết lập voucher riêng của shop (5k - 20k) để tăng tỷ lệ chuyển đổi.',
};

interface Props {
  occasionName: string;
  categoryName?: string;
  measuredCycles?: number;
  sampleSizeN?: number;
  traits: OccasionTraitItem[];
  onOpenEvidence: (evidence: any) => void;
  className?: string;
}

export const OccasionTraitChart: React.FC<Props> = ({
  occasionName,
  categoryName = 'Thời trang & Thủ công',
  measuredCycles = 2,
  sampleSizeN = 1840,
  traits,
  onOpenEvidence,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const numAxes = 6;
  const size = 380;
  const center = size / 2;
  const radius = 135;

  // Tính tọa độ các đỉnh của đa giác 6 trục (hình lục giác đều)
  const angleStep = (2 * Math.PI) / numAxes;
  // Bắt đầu từ góc -90 độ (đỉnh trên cùng)
  const startAngle = -Math.PI / 2;

  // Tọa độ các mốc lưới (25, 50, 75, 100)
  const gridLevels = [25, 50, 75, 100];

  const getCoordinates = (index: number, valuePct: number, rOffset = 0) => {
    const angle = startAngle + index * angleStep;
    const r = (valuePct / 100) * radius + rOffset;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Tọa độ các điểm dữ liệu của dịp hiện tại
  const dataPoints = useMemo(() => {
    return traits.map((trait, i) => getCoordinates(i, Math.max(10, Math.min(100, trait.percentileRank))));
  }, [traits]);

  const polygonPath = useMemo(() => {
    if (dataPoints.length === 0) return '';
    return dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
  }, [dataPoints]);

  // Tóm tắt tự động dựa trên số liệu thực tế cao nhất
  const topTrait = useMemo(() => {
    if (!traits || traits.length === 0) return null;
    return [...traits].sort((a, b) => b.percentileRank - a.percentileRank)[0];
  }, [traits]);

  return (
    <div className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-6 ${className}`}>
      {/* 1. Tiêu đề khối & Nguồn xác nhận */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-stone-900 text-base">
              Đặc điểm mua sắm của dịp {occasionName}
            </h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
              Quan sát thực tế
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            So với các dịp khác · Ngành {categoryName} · {measuredCycles} kỳ gần nhất · n = {sampleSizeN.toLocaleString('vi-VN')} đơn
          </p>
        </div>
      </div>

      {/* 2. Biểu đồ 6 trục cân đối */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible select-none">
            <defs>
              <linearGradient id="traitFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#007700" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.10" />
              </linearGradient>
            </defs>

            {/* Các vòng lưới đa giác (25, 50, 75, 100) */}
            {gridLevels.map(level => {
              const points = Array.from({ length: numAxes }, (_, i) => getCoordinates(i, level));
              const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
              return (
                <g key={level}>
                  <path
                    d={path}
                    fill={level === 100 ? '#fcfbf9' : 'none'}
                    stroke="#e7e5e4"
                    strokeWidth={level === 50 ? '1.5' : '1'}
                    strokeDasharray={level === 50 ? '3 3' : undefined}
                  />
                  {/* Nhãn mốc lưới 50% */}
                  {level === 50 && (
                    <text
                      x={center + 4}
                      y={center - (50 / 100) * radius + 11}
                      className="text-[9px] fill-stone-400 font-mono"
                    >
                      50%
                    </text>
                  )}
                </g>
              );
            })}

            {/* Các nan hoa trục từ tâm */}
            {traits.map((_, i) => {
              const tip = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={tip.x}
                  y2={tip.y}
                  stroke="#e7e5e4"
                  strokeWidth="1"
                />
              );
            })}

            {/* Vùng dữ liệu của dịp */}
            <path
              d={polygonPath}
              fill="url(#traitFillGradient)"
              stroke="#007700"
              strokeWidth="2.5"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Các điểm nút và nhãn trục */}
            {traits.map((trait, i) => {
              const pt = dataPoints[i];
              const labelPt = getCoordinates(i, 100, 24);
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={trait.key}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Hào quang phát sáng khi hover */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={14}
                      fill="#007700"
                      fillOpacity="0.2"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Điểm nút */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 7 : 4.5}
                    fill={isHovered ? '#007700' : '#16a34a'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />

                  {/* Tên trục xung quanh */}
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor={
                      Math.abs(labelPt.x - center) < 15
                        ? 'middle'
                        : labelPt.x > center
                        ? 'start'
                        : 'end'
                    }
                    dominantBaseline="central"
                    className={`text-[11px] font-semibold transition-colors ${
                      isHovered ? 'fill-[#007700] font-bold underline' : 'fill-stone-800'
                    }`}
                  >
                    {trait.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Dòng hướng dẫn chuẩn theo mục 9.2 */}
        <p className="text-center text-xs text-stone-500 max-w-lg mt-3 bg-stone-50 border border-stone-200/60 rounded-xl px-4 py-2.5 leading-relaxed">
          <strong className="text-stone-700">Cách đọc biểu đồ:</strong> Rê chuột vào từng trục để xem số liệu thật và gợi ý hành động. Vị trí 80 nghĩa là dịp này cao hơn 80% các dịp khác ở đặc điểm đó.
        </p>
      </div>

      {/* 2.5 Khối giải thích chi tiết khi rê chuột vào trục biểu đồ */}
      {(() => {
        const activeTrait = traits[hoveredIndex !== null ? hoveredIndex : (topTrait ? traits.indexOf(topTrait) : 0)] || traits[0];
        if (!activeTrait) return null;
        return (
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-stone-50 p-4 transition-all shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#007700] text-white">
                  <Sparkles size={14} />
                </span>
                <div>
                  <span className="text-xs font-bold text-stone-900">
                    {activeTrait.name} {hoveredIndex !== null ? '· Đang xem giải thích' : '· Đặc điểm nổi bật nhất'}
                  </span>
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-[#007700]">
                    Cao hơn {Math.round(activeTrait.percentileRank)}% các dịp khác
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                <span>Dịp {occasionName}:</span>
                <strong className="text-[#007700] font-black">{activeTrait.occasionValue} {activeTrait.unit}</strong>
                <span className="text-stone-300">|</span>
                <span className="text-stone-400">Ngày thường: {activeTrait.baselineValue} {activeTrait.unit}</span>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 text-stone-700">
                <HelpCircle size={15} className="mt-0.5 shrink-0 text-stone-400" />
                <div>
                  <strong className="text-stone-900">Ý nghĩa chỉ số:</strong> {activeTrait.question}
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Căn cứ: {activeTrait.evidence?.sources?.join(', ') || 'Đơn hàng thực tế trên sàn VietCraft'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-emerald-950 bg-white/80 rounded-lg p-2.5 border border-emerald-200/60 shadow-2xs">
                <Lightbulb size={15} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <strong className="text-emerald-900">Gợi ý người bán nên làm:</strong>{' '}
                  {TRAIT_ACTIONABLE_ADVICE[activeTrait.key] || 'Chuẩn bị sản phẩm và kế hoạch đăng bán sớm.'}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Bảng số thật so với ngày thường (Mục 9.2 & 9.5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
            Chi tiết số thật &amp; So sánh với ngày thường
          </h4>
          <span className="text-[11px] text-stone-500">
            Ngày thường = 8 tuần ngay trước dịp, không có sự kiện
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600">
              <tr>
                <th className="py-2.5 px-3">Đặc điểm</th>
                <th className="py-2.5 px-3">Ngày thường</th>
                <th className="py-2.5 px-3">Dịp {occasionName}</th>
                <th className="py-2.5 px-3">Chênh lệch</th>
                <th className="py-2.5 px-3">Vị trí giữa các dịp</th>
                <th className="py-2.5 px-3">Độ tin cậy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {traits.map((t, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <tr
                    key={t.key}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`transition-colors ${isHovered ? 'bg-emerald-50/50' : 'hover:bg-stone-50/50'}`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-stone-900">
                      <div>{t.name}</div>
                      <div className="text-[10px] text-stone-400 font-normal">{t.question}</div>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">
                      {typeof t.baselineValue === 'number'
                        ? t.baselineValue.toLocaleString('vi-VN')
                        : t.baselineValue}{' '}
                      <span className="text-stone-400">{t.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">
                      {typeof t.occasionValue === 'number'
                        ? t.occasionValue.toLocaleString('vi-VN')
                        : t.occasionValue}{' '}
                      <span className="text-stone-500 font-normal">{t.unit}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          {t.diffText}
                        </span>
                        <EvidenceTrigger
                          evidence={t.evidence}
                          onOpen={onOpenEvidence}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700">
                      <span className="font-bold text-stone-900">
                        Cao hơn {Math.round(t.percentileRank)}%
                      </span>{' '}
                      các dịp khác
                    </td>
                    <td className="py-2.5 px-3">
                      <ConfidenceBadge level={t.confidence} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tóm tắt tự động */}
        {topTrait && (
          <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-950 flex items-start gap-2">
            <span className="font-bold shrink-0">Tóm tắt tự động:</span>
            <span>
              Dịp <strong>{occasionName}</strong> có đặc tính nổi bật nhất là{' '}
              <strong>{topTrait.name.toLowerCase()}</strong> ({topTrait.diffText}), cao hơn{' '}
              <strong>{Math.round(topTrait.percentileRank)}%</strong> các dịp mua sắm khác trong năm.
              Khuyến nghị chuẩn bị nguồn hàng và kế hoạch đăng bán trước để tận dụng lợi thế này.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
