/**
 * Biểu đồ cột cho các nhóm CÓ THỨ TỰ (khoảng giá, bậc thang, nhóm tuổi).
 *
 * Bỏ hẳn trục tung và lưới kẻ: chỉ vài cột nên ghi thẳng con số lên đầu cột đọc
 * nhanh hơn và sạch hơn nhiều so với việc bắt mắt dò từ đỉnh cột sang vạch trục.
 * Đổi lại, chỉ dùng được khi số cột còn ít (khoảng 8 trở xuống).
 */

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CHART_INK, CHART_MARKS } from './chartTheme';

export interface ColumnPoint {
  label: string;
  value: number;
  /** Mô tả đầy đủ hiện ở tooltip, ví dụ "150.000đ – 300.000đ". */
  detail?: string;
}

interface TooltipItem {
  payload?: ColumnPoint;
  value?: number;
}

function ColumnTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  unit: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 shadow-[0_6px_20px_rgba(16,33,26,0.12)]">
      <div className="text-[11.5px] font-bold text-[#0b0b0b]">{point.detail || point.label}</div>
      <div className="mt-0.5 text-[12px] text-[#52514e]">
        <span className="font-bold tabular-nums text-[#0b0b0b]">{point.value.toLocaleString('vi-VN')}</span> {unit}
      </div>
    </div>
  );
}

export function ColumnChart({
  data,
  color,
  height = 200,
  unit,
  ariaLabel,
}: {
  data: ColumnPoint[];
  color: string;
  height?: number;
  /** Đơn vị của giá trị, dùng ở tooltip: "sản phẩm", "đơn"… */
  unit: string;
  ariaLabel: string;
}) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: CHART_INK.axis, fontSize: 11 }}
            dy={4}
          />
          <Tooltip
            cursor={{ fill: 'rgba(16,33,26,0.04)' }}
            content={<ColumnTooltip unit={unit} />}
          />
          <Bar
            dataKey="value"
            fill={color}
            // Bo 4px ở đầu cột, vuông ở chân — chân cột phải nằm đúng trên đường 0.
            radius={[4, 4, 0, 0]}
            // Cột mảnh, phần thừa của ô để trống làm khoảng thở.
            maxBarSize={CHART_MARKS.maxBarWidth}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="value"
              position="top"
              offset={8}
              // Chữ dùng màu mực, KHÔNG mượn màu cột: cột đã mang danh tính rồi.
              fill="#0b0b0b"
              fontSize={12}
              fontWeight={700}
              formatter={(v: number) => (v > 0 ? v.toLocaleString('vi-VN') : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
