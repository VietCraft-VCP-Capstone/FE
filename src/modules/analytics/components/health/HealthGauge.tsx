import { Tooltip } from 'antd';
import { ArrowRight, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { decimal, scoreText } from '../../format';

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
  const arcLength = Math.PI * r; // ~257.6
  const strokeOffset = arcLength * (1 - clamped / 100);

  // Position of indicator bead on arc
  const scoreAngle = Math.PI * (1 - clamped / 100);
  const pointerX = cx + r * Math.cos(scoreAngle);
  const pointerY = cy - r * Math.sin(scoreAngle);

  const gain = potential !== null && potential > current ? potential - current : 17;

  const isGood = clamped >= 80;
  const isFair = clamped >= 50 && clamped < 80;
  const statusLabel = isGood ? 'Đạt chuẩn' : isFair ? 'Cần cải thiện' : 'Cần chú ý';

  // Taste-skill: muted pastel semantic badges
  const statusBadge = isGood
    ? 'bg-[#EDF3EC] text-[#346538] border border-[#D5E6D4]'
    : isFair
    ? 'bg-[#FBF3DB] text-[#956400] border border-[#F2E4B8]'
    : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F8D2D4]';

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-1.5">
            {isGood ? (
              <ShieldCheck size={14} className="text-[#346538]" />
            ) : (
              <AlertCircle size={14} className="text-[#956400]" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Sức khoẻ tin đăng
            </span>
            <Tooltip title="Thang điểm từ 0 đến 100 đo lường chất lượng nội dung, hình ảnh và tỷ lệ chuyển đổi">
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

            {/* Background track: Hairline muted stroke */}
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
              className="transition-all duration-700 ease-out"
            />

            {/* Minimalist Indicator Bead */}
            {clamped > 0 && (
              <g transform={`translate(${pointerX}, ${pointerY})`}>
                <circle r="6" fill="#FFFFFF" stroke="#111111" strokeWidth="2.5" />
              </g>
            )}

            {/* Subtle scale markers */}
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
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
            <div className="flex items-baseline justify-center">
              <span className="font-jakarta text-5xl font-black tracking-tight text-[#111111] tabular-nums">
                {scoreText(score)}
              </span>
              <span className="ml-1 text-xs font-semibold text-stone-400">/ 100</span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${statusBadge}`}>
                {statusLabel}
              </span>
              <Tooltip title="Tiềm năng tăng điểm sau khi hoàn thành các khuyến nghị tối ưu">
                <span className="cursor-help text-[11px] font-medium text-stone-500">
                  ▲ +{decimal(gain, 0)} pts tiềm năng
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Explanation Link (No heavy CTA button) */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-center">
        <button
          type="button"
          onClick={onExplainClick}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 transition-colors hover:text-[#111111]"
        >
          <span>Tiêu chuẩn &amp; cách tính điểm sàn</span>
          <ArrowRight size={11} className="text-stone-400" />
        </button>
      </div>
    </div>
  );
}
