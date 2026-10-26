import { Tooltip } from 'antd';
import { ArrowRight, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { scoreText } from '../../format';

export function HealthGauge({
  score,
  potential,
  productId: _productId,
  onExplainClick,
}: {
  score: number | null;
  potential: number | null;
  productId: string;
  onExplainClick?: () => void;
}) {
  const current = score ?? 0;
  const clamped = Math.max(0, Math.min(100, current));
  const cx = 140;
  const cy = 110;
  const r = 82;
  const arcLength = Math.PI * r;
  const strokeOffset = arcLength * (1 - clamped / 100);

  const scoreAngle = Math.PI * (1 - clamped / 100);
  const pointerX = cx + r * Math.cos(scoreAngle);
  const pointerY = cy - r * Math.sin(scoreAngle);

  const gain = potential !== null && potential > current ? potential - current : 0;

  const isGood = clamped >= 80;
  const isFair = clamped >= 50 && clamped < 80;
  const statusLabel = isGood ? 'Tốt' : isFair ? 'Cần cải thiện' : 'Cần chú ý';

  const statusBadge = isGood
    ? 'bg-[#EAF0E2] text-[#007700] border border-[#BECAB6]'
    : isFair
    ? 'bg-amber-50 text-amber-800 border border-amber-200'
    : 'bg-rose-50 text-[#BA1A1A] border border-rose-200';

  const statusTooltip = isGood
    ? 'Tin đăng đạt từ 80 điểm trở lên: Đầy đủ ảnh, mô tả, từ khoá và giá hợp lý.'
    : isFair
    ? 'Tin đăng đạt từ 50 đến 79 điểm: Cần bổ sung thêm một số thông tin để thu hút khách.'
    : 'Tin đăng dưới 50 điểm: Còn thiếu nhiều thông tin cơ bản, nên ưu tiên sửa ngay.';

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            {isGood ? (
              <ShieldCheck size={14} className="text-[#007700]" />
            ) : isFair ? (
              <AlertCircle size={14} className="text-amber-700" />
            ) : (
              <AlertCircle size={14} className="text-[#BA1A1A]" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Điểm chất lượng tin đăng
            </span>
            <Tooltip title="Đo lường độ chỉn chu của bài đăng qua 6 tiêu chuẩn: ảnh, mô tả, từ khoá, chất liệu, đánh giá và giá cả. Điểm càng cao thì sản phẩm càng dễ tiếp cận khách hàng và tăng cơ hội bán được hàng.">
              <Info size={11} className="text-stone-300 hover:text-stone-600 transition-colors cursor-help" />
            </Tooltip>
          </div>
          <span className="font-mono text-[11px] text-stone-400">Thang 100</span>
        </div>

        {/* Minimalist SVG Gauge */}
        <div className="relative mx-auto mt-4 w-full max-w-[270px]">
          <svg viewBox="0 0 280 145" className="w-full overflow-visible">
            <defs>
              <linearGradient id="gaugeGradientMinimal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E26D68" />
                <stop offset="45%" stopColor="#D9822B" />
                <stop offset="75%" stopColor="#B59F3B" />
                <stop offset="100%" stopColor="#438A5E" />
              </linearGradient>
            </defs>

            {/* Background track */}
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="#F4F4F3"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Active colored arc */}
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="url(#gaugeGradientMinimal)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-1000 ease-out"
            />

            {/* Indicator Bead */}
            {clamped > 0 && (
              <g
                transform={`translate(${pointerX}, ${pointerY})`}
                className="transition-all duration-1000 ease-out"
              >
                <circle
                  r="6"
                  fill="#FFFFFF"
                  stroke="#111111"
                  strokeWidth="2.5"
                  className="transition-transform duration-300 hover:scale-125 cursor-pointer filter drop-shadow-sm"
                />
              </g>
            )}

            {/* Scale markers */}
            <text x={cx - r} y={cy + 16} fontSize="10" fill="#A8A29E" fontWeight="500" textAnchor="middle">
              0
            </text>
            <text x={cx - 60} y={cy - 64} fontSize="10" fill="#A8A29E" fontWeight="500" textAnchor="middle">
              50
            </text>
            <text x={cx + 60} y={cy - 64} fontSize="10" fill="#A8A29E" fontWeight="500" textAnchor="middle">
              80
            </text>
            <text x={cx + r} y={cy + 16} fontSize="10" fill="#A8A29E" fontWeight="500" textAnchor="middle">
              100
            </text>
          </svg>

          {/* Center Score Readout */}
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center animate-slide-up">
            <div className="flex items-baseline justify-center transition-transform hover:scale-105 duration-200">
              <span className="font-jakarta text-5xl font-black tracking-tight text-[#111111] tabular-nums">
                {scoreText(score)}
              </span>
              <span className="ml-1 text-xs font-semibold text-stone-400">/ 100</span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              <Tooltip title={statusTooltip}>
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold cursor-help transition-all duration-200 hover:scale-105 active:scale-95 ${statusBadge}`}>
                  {statusLabel}
                </span>
              </Tooltip>

              {gain > 0 && (
                <Tooltip title={`Hoàn thành các gợi ý bên cạnh có thể nâng điểm lên khoảng ${Math.min(100, Math.round(potential ?? 100))}/100, giúp bài đăng hoàn thiện và uy tín hơn.`}>
                  <span className="cursor-help rounded bg-[#EAF0E2] px-2 py-0.5 text-[11px] font-semibold text-[#007700] border border-[#BECAB6] transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse-subtle">
                    Có thể đạt {Math.min(100, Math.round(potential ?? 100))}/100
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Explanation Link */}
      <div className="mt-4 pt-2.5 border-t border-stone-100 flex items-center justify-center">
        <button
          type="button"
          onClick={onExplainClick}
          className="group inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-400 transition-all duration-200 hover:text-[#007700] cursor-pointer"
        >
          <span>Cách tính điểm &amp; 6 tiêu chuẩn</span>
          <ArrowRight size={11} className="text-stone-400 group-hover:text-[#007700] transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
