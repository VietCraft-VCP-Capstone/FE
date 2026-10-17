import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { decimal } from '../../format';
import { DataTable } from '../ui';

/**
 * Radar so sánh nhiều trục. Radar khó đọc chính xác nên LUÔN kèm bảng số bên dưới —
 * đó cũng là điều kiện để người dùng trình đọc màn hình đọc được.
 *
 * Giới hạn 8 trục: quá số đó thì các cạnh chồng nhau và hình mất nghĩa.
 */

export interface RadarSeries {
  name: string;
  /** null = trục đó chưa có dữ liệu. Không vẽ thành 0; bảng số hiện "Chưa có". */
  values: (number | null)[];
  color: string;
  /** Đường của chính shop mình: tô đậm hơn để nổi giữa nhóm đối thủ. */
  primary?: boolean;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function RadarCompare({ axes, series, height = 320, unitHint }: {
  axes: string[];
  series: RadarSeries[];
  height?: number;
  unitHint?: string;
}) {
  const rows = axes.map((axis, i) => {
    const row: Record<string, string | number | null> = { axis };
    series.forEach(s => {
      row[s.name] = isNumber(s.values[i]) ? s.values[i] : null;
    });
    return row;
  });
  // Trục có shop thiếu số thì không vẽ lên radar: vẽ 0 là nói sai rằng shop đó kém nhất.
  // Bảng bên dưới vẫn liệt kê đủ mọi trục.
  const complete = axes.map((_, i) => series.every(s => isNumber(s.values[i])));
  const chartRows = rows.filter((_, i) => complete[i]);
  const hiddenAxes = axes.filter((_, i) => !complete[i]);

  return (
    <div className="space-y-4">
      {hiddenAxes.length > 0 && (
        <p className="m-0 text-xs leading-relaxed text-stone-500">
          Không vẽ trục {hiddenAxes.join(', ')} vì có shop chưa có dữ liệu ở trục này. Bảng bên dưới vẫn có đủ các trục.
        </p>
      )}
      {chartRows.length >= 3 ? (
        <div role="img" aria-label={`Biểu đồ radar so sánh ${chartRows.length} tiêu chí`} style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartRows} outerRadius="72%">
              <PolarGrid stroke={CHART_INK.grid} />
              <PolarAngleAxis dataKey="axis" tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: CHART_INK.axis, fontSize: 10 }} tickCount={3} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #e3e6e3', fontSize: 12 }}
                formatter={(v: any) => decimal(Number(v))}
              />
              {series.map(s => (
                <Radar
                  key={s.name}
                  name={s.name}
                  dataKey={s.name}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={s.primary ? 0.22 : 0.04}
                  strokeWidth={s.primary ? 2.5 : 1.25}
                  isAnimationActive={false}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="m-0 text-xs leading-relaxed text-stone-500">Chưa đủ 3 trục có dữ liệu để vẽ radar. Xem số trong bảng bên dưới.</p>
      )}

      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-xs text-stone-600">
        {series.map(s => (
          <li key={s.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            <span className={s.primary ? 'font-bold text-stone-800' : ''}>{s.name}</span>
          </li>
        ))}
      </ul>

      <DataTable
        caption="Bảng số của biểu đồ radar"
        head={
          <>
            <th scope="col">Tiêu chí{unitHint ? ` (${unitHint})` : ''}</th>
            {series.map(s => (
              <th key={s.name} scope="col" className="text-right">{s.name}</th>
            ))}
          </>
        }
      >
        {rows.map(row => (
          <tr key={String(row.axis)}>
            <td className="font-medium text-stone-700">{row.axis}</td>
            {series.map(s => (
              <td key={s.name} className={`text-right tabular-nums ${s.primary ? 'font-bold text-stone-900' : 'text-stone-600'}`}>
                {decimal(row[s.name] as number | null)}
              </td>
            ))}
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

export const RADAR_COLORS = [SERIES.blue, '#8b5cf6', '#0d9488', '#b45309', '#be185d'];
export const RADAR_ME_COLOR = SERIES.green;
