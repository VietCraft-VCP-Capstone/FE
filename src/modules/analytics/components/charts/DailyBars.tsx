import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_INK, CHART_MARKS } from '../../../../shared/components/charts/chartTheme';
import { ChartTooltip } from '../../../../shared/components/charts/TrendChart';

export interface DailySeries {
  key: string;
  name: string;
  color: string;
  kind: 'bar' | 'line';
}

export function DailyBars({ data, series, height = 240, formatValue, ariaLabel }: {
  data: Record<string, string | number>[];
  series: DailySeries[];
  height?: number;
  formatValue: (n: number) => string;
  ariaLabel: string;
}) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2} barCategoryGap="18%">
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
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
          <Tooltip cursor={{ fill: 'rgba(16,33,26,0.05)' }} content={<ChartTooltip formatValue={formatValue} />} />
          {series.map(s =>
            s.kind === 'bar' ? (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={CHART_MARKS.maxBarWidth}
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={CHART_MARKS.lineWidth}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: CHART_MARKS.activeDotRadius, strokeWidth: CHART_MARKS.activeDotRing, stroke: CHART_INK.surface, fill: s.color }}
                isAnimationActive={false}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
