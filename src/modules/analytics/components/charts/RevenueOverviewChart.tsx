import { useId, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart2,
  LineChart as LineChartIcon,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { compactMoney, count, money } from '../../../../shared/utils/format';
import { fullDate, shortDate } from '../../format';

export type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type VisualType = 'combo' | 'bar' | 'area';

export interface RawSeriesPoint {
  date: string; // YYYY-MM-DD
  revenue_vnd: number;
  orders: number;
  views: number | null;
}

export interface AggregatedPoint {
  key: string;
  label: string;
  fullLabel: string;
  revenue: number;
  orders: number;
  views: number;
  avgOrderValue: number;
}

/** Trả về số tuần ISO trong năm */
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Trả về thứ Hai đầu tuần */
function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}

/** Trả về Chủ Nhật cuối tuần */
function getEndOfWeek(d: Date): Date {
  const start = getStartOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function formatDateDM(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function aggregateData(points: RawSeriesPoint[], granularity: Granularity): AggregatedPoint[] {
  if (!points || points.length === 0) return [];

  // Sắp xếp tăng dần theo ngày
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));

  if (granularity === 'day') {
    return sorted.map(p => ({
      key: p.date,
      label: shortDate(p.date),
      fullLabel: `Ngày ${fullDate(p.date)}`,
      revenue: p.revenue_vnd,
      orders: p.orders,
      views: p.views ?? 0,
      avgOrderValue: p.orders > 0 ? Math.round(p.revenue_vnd / p.orders) : 0,
    }));
  }

  const map = new Map<
    string,
    {
      key: string;
      label: string;
      fullLabel: string;
      revenue: number;
      orders: number;
      views: number;
      orderIndex: number;
    }
  >();

  sorted.forEach((p, index) => {
    const parts = p.date.split('-');
    if (parts.length !== 3) return;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1-12
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);

    let groupKey = '';
    let label = '';
    let fullLabel = '';

    if (granularity === 'week') {
      const weekNum = getWeekNumber(d);
      const startW = getStartOfWeek(d);
      const endW = getEndOfWeek(d);
      groupKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
      label = `T${weekNum}`;
      fullLabel = `Tuần ${weekNum} (${formatDateDM(startW)} – ${formatDateDM(endW)}/${year})`;
    } else if (granularity === 'month') {
      groupKey = `${year}-${String(month).padStart(2, '0')}`;
      label = `T${month}/${year}`;
      fullLabel = `Tháng ${month} năm ${year}`;
    } else if (granularity === 'quarter') {
      const q = Math.floor((month - 1) / 3) + 1;
      groupKey = `${year}-Q${q}`;
      label = `Q${q}/${year}`;
      const startM = (q - 1) * 3 + 1;
      const endM = q * 3;
      fullLabel = `Quý ${q}/${year} (Tháng ${startM} – ${endM})`;
    } else if (granularity === 'year') {
      groupKey = `${year}`;
      label = `Năm ${year}`;
      fullLabel = `Năm ${year}`;
    }

    const current = map.get(groupKey);
    if (current) {
      current.revenue += p.revenue_vnd;
      current.orders += p.orders;
      current.views += p.views ?? 0;
    } else {
      map.set(groupKey, {
        key: groupKey,
        label,
        fullLabel,
        revenue: p.revenue_vnd,
        orders: p.orders,
        views: p.views ?? 0,
        orderIndex: index,
      });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(item => ({
      key: item.key,
      label: item.label,
      fullLabel: item.fullLabel,
      revenue: item.revenue,
      orders: item.orders,
      views: item.views,
      avgOrderValue: item.orders > 0 ? Math.round(item.revenue / item.orders) : 0,
    }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  dataMap: Map<string, AggregatedPoint>;
}

function RevenueTooltip({ active, payload, label, dataMap }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const point = label ? dataMap.get(label) : null;
  const revItem = payload.find(p => p.dataKey === 'revenue');
  const ordItem = payload.find(p => p.dataKey === 'orders');

  const revenue = revItem?.value ?? point?.revenue ?? 0;
  const orders = ordItem?.value ?? point?.orders ?? 0;

  return (
    <div className="min-w-[220px] rounded-xl border border-stone-200/90 bg-white/98 p-3.5 shadow-xl backdrop-blur-md">
      <div className="mb-2 border-b border-stone-100 pb-2 text-[12px] font-semibold text-stone-800">
        {point?.fullLabel || label}
      </div>
      <div className="space-y-1.5 text-[12.5px]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-stone-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1a6b1a]" />
            Doanh thu:
          </span>
          <span className="font-bold text-[#15691a]">{money(Number(revenue))}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-stone-600">
            <span className="h-2 w-2 rounded-full bg-[#ea580c]" />
            Đơn hàng:
          </span>
          <span className="font-bold text-amber-900">{count(Number(orders))} đơn</span>
        </div>
        {point && point.orders > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-1 text-[11.5px] text-stone-400">
            <span>TB / đơn (AOV):</span>
            <span className="tabular-nums font-medium text-stone-600">
              {compactMoney(point.avgOrderValue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueOverviewChart({
  series,
  timeRangeLabel,
  onRangeSuggestion,
}: {
  series: RawSeriesPoint[];
  timeRangeLabel?: string;
  onRangeSuggestion?: (range: '90d' | '180d' | '365d') => void;
}) {
  const [granularity, setGranularity] = useState<Granularity>('day');
  // Mặc định dùng biểu đồ kết hợp (combo: Cột Doanh thu + Đường Đơn hàng) cho trực quan nhất
  const [visualType, setVisualType] = useState<VisualType>('combo');
  const gradientId = useId().replace(/:/g, '');

  const data = useMemo(() => aggregateData(series, granularity), [series, granularity]);

  const dataMap = useMemo(() => {
    const m = new Map<string, AggregatedPoint>();
    data.forEach(d => m.set(d.label, d));
    return m;
  }, [data]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    if (!data.length) return null;
    let totalRev = 0;
    let totalOrd = 0;
    let peak = data[0];
    let low = data[0];

    data.forEach(p => {
      totalRev += p.revenue;
      totalOrd += p.orders;
      if (p.revenue > peak.revenue) peak = p;
      if (p.revenue < low.revenue) low = p;
    });

    const avgRev = Math.round(totalRev / data.length);
    return {
      totalRevenue: totalRev,
      totalOrders: totalOrd,
      averageRevenue: avgRev,
      peakPoint: peak,
      lowPoint: low,
    };
  }, [data]);

  const granularityName = {
    day: 'ngày',
    week: 'tuần',
    month: 'tháng',
    quarter: 'quý',
    year: 'năm',
  }[granularity];

  // Gợi ý khi chọn xem theo tháng/quý/năm mà chuỗi ngày quá ngắn
  const showRangeHint =
    (granularity === 'month' || granularity === 'quarter' || granularity === 'year') &&
    series.length <= 31;

  return (
    <div className="space-y-4">
      {/* Thanh điều khiển trên đỉnh biểu đồ */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eaf4ea] text-[#15691a]">
            <TrendingUp size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold text-stone-900">
              Doanh thu &amp; Đơn hàng theo {granularityName}
            </div>
            <div className="text-xs text-stone-500">
              {data.length} mốc dữ liệu {timeRangeLabel ? `· ${timeRangeLabel}` : ''}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bộ chọn gộp thời gian: Ngày, Tuần, Tháng, Quý, Năm */}
          <div
            role="group"
            aria-label="Đơn vị hiển thị thời gian"
            className="inline-flex rounded-xl border border-stone-200 bg-stone-100/70 p-0.5 text-xs font-medium"
          >
            {(
              [
                { id: 'day', label: 'Ngày' },
                { id: 'week', label: 'Tuần' },
                { id: 'month', label: 'Tháng' },
                { id: 'quarter', label: 'Quý' },
                { id: 'year', label: 'Năm' },
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setGranularity(opt.id)}
                aria-pressed={granularity === opt.id}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  granularity === opt.id
                    ? 'bg-white font-semibold text-[#15691a] shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Bộ chuyển dạng hiển thị: Cột mix Đường (Combo) vs Cột (Bar) vs Vùng (Area) */}
          <div
            role="group"
            aria-label="Kiểu biểu đồ"
            className="inline-flex rounded-xl border border-stone-200 bg-stone-100/70 p-0.5 text-xs"
          >
            <button
              type="button"
              onClick={() => setVisualType('combo')}
              title="Biểu đồ cột doanh thu kết hợp đường đơn hàng (trực quan nhất)"
              aria-pressed={visualType === 'combo'}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                visualType === 'combo'
                  ? 'bg-white font-semibold text-[#15691a] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Cột mix Đường</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualType('bar')}
              title="Chỉ hiển thị biểu đồ cột"
              aria-pressed={visualType === 'bar'}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                visualType === 'bar'
                  ? 'bg-white font-semibold text-[#15691a] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart2 size={13} />
              <span>Chỉ Cột</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualType('area')}
              title="Biểu đồ diện tích / vùng xu hướng"
              aria-pressed={visualType === 'area'}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                visualType === 'area'
                  ? 'bg-white font-semibold text-[#15691a] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LineChartIcon size={13} />
              <span>Vùng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chú giải 2 trục cho dạng Cột mix Đường */}
      {visualType === 'combo' && (
        <div className="flex items-center gap-5 text-xs text-stone-600 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-3 w-3 rounded-sm bg-[#1a6b1a]" />
            Cột: Doanh thu (trục trái)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#ea580c]" />
            Đường: Đơn hàng (trục phải)
          </span>
        </div>
      )}

      {/* Gợi ý mở rộng khoảng thời gian nếu chuỗi ngày ngắn */}
      {showRangeHint && onRangeSuggestion && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-900">
          <span>
            💡 Đang xem theo <strong>{granularityName}</strong>: Khoảng thời gian hiện tại có {series.length} ngày. Để thấy sự so sánh rõ rệt hơn giữa các {granularityName}, bạn nên chọn khoảng thời gian dài hơn.
          </span>
          <div className="flex gap-1.5 shrink-0 ml-3">
            <button
              type="button"
              onClick={() => onRangeSuggestion('90d')}
              className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 shadow-sm border border-stone-200 hover:bg-stone-50"
            >
              90 ngày
            </button>
            <button
              type="button"
              onClick={() => onRangeSuggestion('180d')}
              className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 shadow-sm border border-stone-200 hover:bg-stone-50"
            >
              6 tháng
            </button>
            <button
              type="button"
              onClick={() => onRangeSuggestion('365d')}
              className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-stone-700 shadow-sm border border-stone-200 hover:bg-stone-50"
            >
              1 năm
            </button>
          </div>
        </div>
      )}

      {/* Khu vực vẽ biểu đồ Recharts */}
      <div className="h-[280px] w-full" role="img" aria-label={`Biểu đồ doanh thu theo ${granularityName}`}>
        <ResponsiveContainer width="100%" height="100%">
          {visualType === 'combo' ? (
            <ComposedChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={CHART_INK.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_INK.axis, fontSize: 11 }}
                axisLine={{ stroke: CHART_INK.grid }}
                tickLine={false}
              />
              {/* Trục trái: Doanh thu */}
              <YAxis
                yAxisId="rev"
                orientation="left"
                tick={{ fill: CHART_INK.axis, fontSize: 11 }}
                tickFormatter={compactMoney}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              {/* Trục phải: Đơn hàng */}
              <YAxis
                yAxisId="ord"
                orientation="right"
                tick={{ fill: '#ea580c', fontSize: 11 }}
                tickFormatter={count}
                axisLine={false}
                tickLine={false}
                width={35}
                allowDecimals={false}
              />
              <Tooltip content={<RevenueTooltip dataMap={dataMap} />} />
              <Bar
                yAxisId="rev"
                dataKey="revenue"
                name="Doanh thu"
                fill={SERIES.green}
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
              <Line
                yAxisId="ord"
                type="monotone"
                dataKey="orders"
                name="Đơn hàng"
                stroke="#ea580c"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#ea580c', stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 5.5, fill: '#ea580c', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          ) : visualType === 'bar' ? (
            <BarChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={CHART_INK.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_INK.axis, fontSize: 11 }}
                axisLine={{ stroke: CHART_INK.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_INK.axis, fontSize: 11 }}
                tickFormatter={compactMoney}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<RevenueTooltip dataMap={dataMap} />} />
              <Bar
                dataKey="revenue"
                name="Doanh thu"
                fill={SERIES.green}
                radius={[6, 6, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`revGrad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SERIES.green} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={SERIES.green} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_INK.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_INK.axis, fontSize: 11 }}
                axisLine={{ stroke: CHART_INK.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: CHART_INK.axis, fontSize: 11 }}
                tickFormatter={compactMoney}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<RevenueTooltip dataMap={dataMap} />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke={SERIES.green}
                strokeWidth={2.5}
                fill={`url(#revGrad-${gradientId})`}
                activeDot={{
                  r: 5,
                  fill: SERIES.green,
                  stroke: '#ffffff',
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Thẻ tóm tắt số liệu bên dưới biểu đồ */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-stone-50/80 p-3.5 sm:grid-cols-4 border border-stone-100">
          <div>
            <div className="text-[11px] font-medium text-stone-500">Tổng doanh thu kỳ này</div>
            <div className="mt-0.5 text-sm font-bold text-[#15691a]">
              {money(stats.totalRevenue)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-stone-500">
              Trung bình / {granularityName}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-stone-800">
              {compactMoney(stats.averageRevenue)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-stone-500">
              Đỉnh cao nhất ({stats.peakPoint.label})
            </div>
            <div className="mt-0.5 text-sm font-semibold text-emerald-700">
              {compactMoney(stats.peakPoint.revenue)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-stone-500">Tổng số đơn hàng</div>
            <div className="mt-0.5 text-sm font-semibold text-amber-900">
              {count(stats.totalOrders)} đơn
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
