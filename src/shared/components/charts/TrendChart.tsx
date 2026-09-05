/**
 * Biểu đồ xu hướng theo thời gian (một hoặc nhiều chuỗi, cùng ĐƠN VỊ).
 *
 * Cố tình chỉ có MỘT trục giá trị. Hai chuỗi khác đơn vị (ví dụ "số đơn" và
 * "doanh thu") mà ép chung một khung thì tỉ lệ giữa hai trục là do người vẽ tự
 * đặt, và biểu đồ sẽ bịa ra một mối tương quan không có trong dữ liệu — trường
 * hợp đó phải tách thành hai biểu đồ.
 */

import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_INK, CHART_MARKS } from './chartTheme';

export interface TrendSeries {
  /** Tên trường trong mỗi phần tử `data`. */
  key: string;
  /** Nhãn hiển thị ở chú giải và tooltip. */
  name: string;
  color: string;
}

export interface TrendPoint {
  /** Nhãn trục hoành, ví dụ '12/08'. */
  label: string;
  [seriesKey: string]: string | number;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatValue: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 shadow-[0_6px_20px_rgba(16,33,26,0.12)]">
      <div className="mb-1.5 text-[11.5px] font-bold text-[#0b0b0b]">Ngày {label}</div>
      <div className="flex flex-col gap-1">
        {payload.map(item => (
          <div key={item.dataKey} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="text-[#52514e]">{item.name}</span>
            <span className="ml-auto pl-3 font-bold tabular-nums text-[#0b0b0b]">
              {formatValue(Number(item.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({
  data,
  series,
  height = 260,
  formatValue = (n: number) => n.toLocaleString('vi-VN'),
  /** Nhãn cho trình đọc màn hình — biểu đồ SVG không tự mô tả được nội dung. */
  ariaLabel,
}: {
  data: TrendPoint[];
  series: TrendSeries[];
  height?: number;
  formatValue?: (n: number) => string;
  ariaLabel: string;
}) {
  // Mỗi thực thể biểu đồ cần id gradient riêng, nếu không hai biểu đồ trên cùng
  // một trang sẽ dùng chung <defs> và cái sau đè màu cái trước.
  const uid = useId().replace(/:/g, '');

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={CHART_MARKS.areaOpacity * 1.6} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            // Cửa sổ 90 ngày có 90 nhãn: để recharts tự bỏ bớt cho tới khi hai
            // nhãn cách nhau tối thiểu 30px, thay vì chồng chữ lên nhau.
            minTickGap={30}
            interval="preserveStartEnd"
            tick={{ fill: CHART_INK.axis, fontSize: 11 }}
            dy={4}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={44}
            tick={{ fill: CHART_INK.axis, fontSize: 11 }}
            tickFormatter={v => formatValue(Number(v) || 0)}
          />

          <Tooltip
            cursor={{ stroke: '#c9cec9', strokeWidth: 1 }}
            content={<ChartTooltip formatValue={formatValue} />}
          />

          {series.map(s => (
            <Area
              key={s.key}
              // Nối thẳng, KHÔNG làm cong. Đây là số đếm theo từng ngày rời rạc;
              // nội suy cong sẽ vẽ ra những giá trị trung gian không hề tồn tại
              // (đường vọt lên 1,4 giữa hai ngày cùng bằng 1).
              type="linear"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={CHART_MARKS.lineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#${uid}-${s.key})`}
              // Không chấm ở mọi điểm: 90 điểm thì chấm nuốt mất đường.
              dot={false}
              // Tắt hiệu ứng vẽ dần. Khi người dùng đổi khoảng thời gian, trục
              // hoành nhảy sang miền ngày khác NGAY, còn đường thì bò dần từ hình
              // cũ sang hình mới — trong lúc đó biểu đồ hiển thị những giá trị
              // không thuộc kỳ nào cả. Vẽ thẳng một lần là trung thực hơn.
              isAnimationActive={false}
              activeDot={{
                r: CHART_MARKS.activeDotRadius,
                strokeWidth: CHART_MARKS.activeDotRing,
                stroke: CHART_INK.surface,
                fill: s.color,
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Chú giải: bắt buộc khi có từ 2 chuỗi trở lên. Kèm luôn TỔNG của mỗi chuỗi
 * trong kỳ — người đọc lấy được con số chính mà không phải rê chuột từng ngày.
 */
export function TrendLegend({
  items,
}: {
  items: { name: string; color: string; total: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
      {items.map(item => (
        <div key={item.name} className="flex items-center gap-2">
          <span
            className="h-[3px] w-4 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="text-[12.5px] text-[#52514e]">{item.name}</span>
          <span className="text-[12.5px] font-bold tabular-nums text-[#0b0b0b]">{item.total}</span>
        </div>
      ))}
    </div>
  );
}
