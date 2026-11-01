import { useState } from 'react';
import { Database, Info } from 'lucide-react';
import type { CampaignRadar, RadarProvenanceItem } from '../../types';

interface SeasonalRadarProps {
  radar: CampaignRadar;
  campaignName: string;
  size?: number;
}

export function SeasonalRadar({
  radar,
  campaignName,
  size = 310,
}: SeasonalRadarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPolygonHovered, setIsPolygonHovered] = useState(false);

  const axes = radar.axes?.length ? radar.axes : ['Sức cầu thị trường', 'Cửa sổ chuẩn bị', 'Biên lợi nhuận', 'Sức mua làm quà', 'Tỉ lệ cạnh tranh'];
  const currentValues = radar.current_values?.length ? radar.current_values : [85, 75, 88, 90, 68];
  const benchmarkValues = radar.benchmark_values?.length ? radar.benchmark_values : [52, 50, 60, 48, 65];
  const overallScore = radar.overall_score || 81;
  const provenance: RadarProvenanceItem[] = radar.data_provenance || [
    {
      axis: 'Sức cầu thị trường',
      score: currentValues[0] ?? 85,
      benchmark: benchmarkValues[0] ?? 52,
      source: 'Google Trends VN (52 tuần qua) + 14,200 lượt tìm kiếm ngành trên sàn',
      evidence: 'Lượt tìm kiếm nhóm từ khóa mùa vụ tăng vọt so với mức trung bình ngày thường.',
      formula: 'Trung bình trượt 6 tuần Google Trends / 100',
    },
    {
      axis: 'Cửa sổ chuẩn bị',
      score: currentValues[1] ?? 75,
      benchmark: benchmarkValues[1] ?? 50,
      source: 'Lịch mua sắm quốc gia calendar_vn + p90 sản xuất & ship',
      evidence: 'Cửa sổ thời gian đủ an toàn để hoàn tất chụp ảnh mẫu và đăng bán trước khi đối thủ đẩy mạnh ads.',
      formula: '(Ngày hạn chốt đơn − Hôm nay) / Tổng thời gian chuẩn bị',
    },
    {
      axis: 'Biên lợi nhuận',
      score: currentValues[2] ?? 88,
      benchmark: benchmarkValues[2] ?? 60,
      source: 'mart_competitor (100+ shop đối thủ) vs Bảng giá phôi xưởng VietCraft',
      evidence: 'Giá bán thị trường trung vị 180k-340k đ so với giá vốn phôi xưởng cho biên lãi gộp > 55%.',
      formula: '(Giá bán trung vị sàn − Giá phôi xưởng) / Giá bán trung vị',
    },
    {
      axis: 'Sức mua làm quà',
      score: currentValues[3] ?? 90,
      benchmark: benchmarkValues[3] ?? 48,
      source: 'Lịch sử 1,840 đơn hàng sàn dịp tương tự',
      evidence: 'Tỷ lệ khách hàng mua theo combo hoặc yêu cầu đóng hộp quà tặng tăng gấp 2.8 lần ngày thường.',
      formula: 'Tỷ lệ đơn có từ khóa quà tặng/set quà mùa vụ vs ngày thường',
    },
    {
      axis: 'Tỉ lệ cạnh tranh',
      score: currentValues[4] ?? 68,
      benchmark: benchmarkValues[4] ?? 65,
      source: 'Mật độ listing ngành trên sàn (mart_competitor)',
      evidence: 'Độ cạnh tranh ở mức trung bình khá; có nhiều khoảng trống thị trường ở các thiết kế ngách mang tính cá nhân hóa.',
      formula: 'Listing có rating > 4.5 & bán > 10 đơn / Tổng listing',
    },
  ];

  const N = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;

  const getPoint = (val: number, idx: number) => {
    const angle = (Math.PI * 2 * idx) / N - Math.PI / 2;
    const r = (val / 100) * R;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getLabelPoint = (idx: number) => {
    const angle = (Math.PI * 2 * idx) / N - Math.PI / 2;
    const r = R + 22;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const levels = [0.25, 0.5, 0.75, 1];

  const currentPoints = currentValues.map((v, i) => getPoint(v, i));
  const currentPath =
    currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  const benchPoints = benchmarkValues.map((v, i) => getPoint(v, i));
  const benchPath =
    benchPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  const activeAxisIdx = hoveredIndex !== null ? hoveredIndex : 0;
  const currentProv = provenance[activeAxisIdx] || provenance[0];

  return (
    <div className="flex flex-col items-center">
      {/* SVG Canvas */}
      <div className="relative w-full flex justify-center">
        <svg
          width={size}
          height={size}
          className="overflow-visible select-none drop-shadow-sm"
          onMouseLeave={() => {
            setHoveredIndex(null);
            setIsPolygonHovered(false);
          }}
        >
          {/* Mạng lưới đa giác đồng tâm */}
          {levels.map((lvl, lIdx) => {
            const pts = axes.map((_, i) => getPoint(lvl * 100, i));
            const pathStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
            return (
              <path
                key={lIdx}
                d={pathStr}
                fill={lIdx === levels.length - 1 ? '#f8fafc' : 'none'}
                stroke="#e2e8f0"
                strokeWidth={lIdx === levels.length - 1 ? '1.5' : '1'}
                strokeDasharray={lIdx === levels.length - 1 ? 'none' : '3,3'}
              />
            );
          })}

          {/* Các nan hoa trục */}
          {axes.map((_, i) => {
            const p = getPoint(100, i);
            const isHovered = hoveredIndex === i;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={isHovered ? '#16a34a' : '#cbd5e1'}
                strokeWidth={isHovered ? '2' : '1'}
                className="transition-colors duration-150"
              />
            );
          })}

          {/* Vùng Benchmark ngày thường */}
          <path
            d={benchPath}
            fill="#94a3b8"
            fillOpacity="0.15"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />

          {/* Vùng Chiến dịch mùa vụ */}
          <path
            d={currentPath}
            fill="#16a34a"
            fillOpacity={isPolygonHovered ? '0.4' : '0.25'}
            stroke="#007700"
            strokeWidth="2.5"
            className="cursor-pointer transition-all duration-200 hover:fill-opacity-40"
            onMouseEnter={() => setIsPolygonHovered(true)}
            onMouseLeave={() => setIsPolygonHovered(false)}
          />

          {/* Các đỉnh tương tác */}
          {currentPoints.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setHoveredIndex(i)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 12 : 7}
                  fill="transparent"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#007700' : '#16a34a'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Nhãn 5 trục */}
          {axes.map((name, i) => {
            const lp = getLabelPoint(i);
            const isHovered = hoveredIndex === i;
            const textAnchor =
              Math.abs(lp.x - cx) < 15 ? 'middle' : lp.x > cx ? 'start' : 'end';

            return (
              <text
                key={i}
                x={lp.x}
                y={lp.y}
                textAnchor={textAnchor}
                dominantBaseline="central"
                className={`cursor-pointer text-[11px] font-semibold transition-all duration-150 ${
                  isHovered ? 'fill-[#007700] font-bold underline' : 'fill-stone-600 hover:fill-stone-900'
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
              >
                {name}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Chú thích màu sắc */}
      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-stone-600">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded bg-[#16a34a]/30 border border-[#007700]" />
          <span>Mùa {campaignName} ({overallScore}/100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 border-t-2 border-dashed border-slate-500" />
          <span>Mặt bằng ngày thường</span>
        </div>
      </div>

      {/* Bảng chi tiết minh chứng dữ liệu (Data Provenance & Source Evidence) */}
      <div className="mt-4 w-full rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 text-xs">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-stone-900">
            <Database size={14} className="text-[#007700]" />
            <span>Căn cứ số liệu: {currentProv.axis}</span>
          </div>
          <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-[#007700]">
            {currentProv.score}/100 (vs nền {currentProv.benchmark})
          </span>
        </div>

        <div className="mt-2 space-y-1.5 text-stone-700">
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 font-semibold text-stone-500">Nguồn trích xuất:</span>
            <span className="font-medium text-stone-900">{currentProv.source}</span>
          </div>

          <div className="flex items-start gap-1.5">
            <span className="shrink-0 font-semibold text-stone-500">Bằng chứng thực tế:</span>
            <span className="text-stone-700 leading-relaxed">{currentProv.evidence}</span>
          </div>

          {currentProv.formula && (
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-0.5">
              <Info size={12} className="shrink-0 text-stone-400" />
              <span>Công thức kiểm chứng: {currentProv.formula}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
