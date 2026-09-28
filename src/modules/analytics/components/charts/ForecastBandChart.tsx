import { useId } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_INK, CHART_MARKS, SERIES } from '../../../../shared/components/charts/chartTheme';
import { compactMoney, money } from '../../../../shared/utils/format';
import { shortDate } from '../../format';

/**
 * Dự báo kèm dải tin cậy 95%: lịch sử là đường liền, dự báo là đường nét đứt, dải
 * lo95–hi95 là vùng mờ phía sau.
 *
 * BR-206 buộc luôn có dải tin cậy khi có dự báo — một đường đơn làm người bán tưởng
 * con số là chắc chắn. Nét liền / nét đứt là kênh phân biệt chính, không phải màu.
 */

export interface ForecastPoint {
  date: string;
  /** Doanh thu đã xảy ra. Bỏ trống ở phần tương lai. */
  actual?: number | null;
  /** Doanh thu dự báo. Bỏ trống ở phần quá khứ. */
  yhat?: number | null;
  lo95?: number | null;
  hi95?: number | null;
}

interface Row {
  label: string;
  actual: number | null;
  yhat: number | null;
  band: [number, number] | null;
}

function ForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row: Row | undefined = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 text-[12px] shadow-[0_6px_20px_rgba(16,33,26,0.12)]">
      <div className="mb-1 text-[11.5px] font-bold text-[#0b0b0b]">Ngày {label}</div>
      {row.actual != null && <div className="text-stone-700">Thực tế: <strong>{money(row.actual)}</strong></div>}
      {row.yhat != null && (
        <>
          <div className="text-stone-700">Dự báo: <strong>{money(row.yhat)}</strong></div>
          {row.band && (
            <div className="mt-0.5 text-stone-500">
              Khoảng tin cậy 95%: {compactMoney(row.band[0])} đến {compactMoney(row.band[1])}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ForecastBandChart({ points, height = 300, forecastFrom }: {
  points: ForecastPoint[];
  height?: number;
  /** Ngày bắt đầu phần dự báo, để vẽ vạch phân cách. */
  forecastFrom?: string | null;
}) {
  const id = useId();
  const rows: Row[] = points.map(p => ({
    label: shortDate(p.date),
    actual: p.actual ?? null,
    yhat: p.yhat ?? null,
    band: p.lo95 != null && p.hi95 != null ? [p.lo95, p.hi95] : null,
  }));
  const divider = forecastFrom ? shortDate(forecastFrom) : null;

  return (
    <div>
      <div role="img" aria-label="Biểu đồ dự báo doanh thu kèm dải tin cậy 95%" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.blue} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SERIES.blue} stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_INK.axis, fontSize: 11 }}
              stroke={CHART_INK.grid}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: CHART_INK.axis, fontSize: 11 }}
              stroke={CHART_INK.grid}
              tickFormatter={v => compactMoney(Number(v) || 0)}
              width={62}
            />
            <Tooltip content={<ForecastTooltip />} />
            {/* Dải tin cậy vẽ TRƯỚC để nằm dưới hai đường. */}
            <Area
              dataKey="band"
              stroke="none"
              fill={`url(#${id}-band)`}
              isAnimationActive={false}
              connectNulls
            />
            {divider && <ReferenceLine x={divider} stroke={CHART_INK.axis} strokeDasharray="3 3" />}
            <Line
              dataKey="actual"
              stroke={CHART_INK.axis}
              strokeWidth={CHART_MARKS.lineWidth}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              dataKey="yhat"
              stroke={SERIES.blue}
              strokeWidth={CHART_MARKS.lineWidth}
              strokeDasharray="5 4"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 text-xs text-stone-600">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded-full" style={{ background: CHART_INK.axis }} aria-hidden /> Thực tế
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-5 rounded-full"
            style={{ background: `repeating-linear-gradient(90deg, ${SERIES.blue} 0 5px, transparent 5px 9px)` }}
            aria-hidden
          />
          Dự báo (nét đứt)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded" style={{ background: SERIES.blue, opacity: 0.18 }} aria-hidden /> Khoảng tin cậy 95%
        </li>
      </ul>
    </div>
  );
}
