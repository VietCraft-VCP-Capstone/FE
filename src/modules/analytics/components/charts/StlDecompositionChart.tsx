import { useId, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_INK } from '../../../../shared/components/charts/chartTheme';
import { InfoTip } from '../ui';

interface StlDecompositionChartProps {
  decomposition: {
    trend: number[];
    seasonal: number[];
    residual: number[];
    window: string;
  };
  keyword: string;
  height?: number;
}

export function StlDecompositionChart({
  decomposition,
  keyword,
  height = 240,
}: StlDecompositionChartProps) {
  const id = useId();
  const [activeTab, setActiveTab] = useState<'seasonal' | 'trend'>('seasonal');

  const { trend, seasonal, window: winLabel } = decomposition;
  const n = Math.min(trend?.length || 0, seasonal?.length || 0);

  // Chuẩn hóa dữ liệu theo tuần (T-52 đến Tuần này)
  const rows = Array.from({ length: n }).map((_, i) => {
    const weekAgo = n - 1 - i;
    const label = weekAgo === 0 ? 'Hiện tại' : `-${weekAgo}w`;
    return {
      label,
      weekIndex: i + 1,
      seasonal: seasonal[i] != null ? Math.round(seasonal[i] * 10) / 10 : 0,
      trend: trend[i] != null ? Math.round(trend[i] * 10) / 10 : 0,
    };
  });

  return (
    <div className="rounded-md border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-900">
              Phân Rã Chuỗi Thời Gian Google Trends (STL Decomposition)
            </h4>
            <InfoTip
              text="Thuật toán STL (Seasonal and Trend decomposition using Loess) phân tích chuỗi tìm kiếm thực tế thành 3 thành phần: Sóng mùa vụ lặp lại hàng năm, Xu hướng tăng trưởng nền, và Nhiễu ngẫu nhiên. Giúp phân biệt nhu cầu mùa vụ thật với đột biến nhất thời."
              label="Giải thích STL Decomposition"
            />
          </div>
          <span className="block mt-0.5 text-[11.5px] text-stone-500">
            Từ khóa: <strong className="text-stone-800 font-semibold">{keyword}</strong> · Cửa sổ: {winLabel || '52 tuần gần nhất'}
          </span>
        </div>

        {/* Chuyển chế độ xem */}
        <div className="inline-flex rounded border border-stone-200 bg-stone-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('seasonal')}
            className={`rounded px-2.5 py-1 font-semibold transition-colors ${
              activeTab === 'seasonal'
                ? 'bg-white text-[#007700] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sóng mùa vụ (Seasonal)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`rounded px-2.5 py-1 font-semibold transition-colors ${
              activeTab === 'trend'
                ? 'bg-white text-[#007700] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Xu hướng nền (Trend)
          </button>
        </div>
      </div>

      <div className="mt-3" role="img" aria-label="Biểu đồ phân rã chuỗi thời gian" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={`${id}-seasonal`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#007700" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#007700" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_INK.axis, fontSize: 10 }}
              stroke={CHART_INK.grid}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: CHART_INK.axis, fontSize: 10 }}
              stroke={CHART_INK.grid}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="rounded border border-stone-200 bg-white p-2 text-xs shadow-sm">
                    <span className="font-bold text-stone-900 block mb-1">Mốc {d.label}</span>
                    {activeTab === 'seasonal' ? (
                      <span className="text-emerald-700 font-semibold">
                        Sóng mùa vụ: {d.seasonal > 0 ? `+${d.seasonal}` : d.seasonal} điểm
                      </span>
                    ) : (
                      <span className="text-sky-700 font-semibold">
                        Mức nền tăng trưởng: {d.trend} điểm
                      </span>
                    )}
                  </div>
                );
              }}
            />
            {activeTab === 'seasonal' ? (
              <Area
                type="monotone"
                dataKey="seasonal"
                stroke="#007700"
                strokeWidth={2}
                fill={`url(#${id}-seasonal)`}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#0284c7"
                strokeWidth={2.5}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
        <span>
          {activeTab === 'seasonal'
            ? 'Đỉnh sóng thể hiện tuần mà nhu cầu vượt trội nhất so với trung bình năm.'
            : 'Đường xu hướng dài hạn loại bỏ yếu tố thời vụ, phản ánh sức tăng trưởng tự nhiên của ngành.'}
        </span>
        <span className="text-stone-400">Nguồn: Google Trends VN</span>
      </div>
    </div>
  );
}
