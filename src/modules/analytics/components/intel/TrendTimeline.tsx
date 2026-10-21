import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { decimal, shortDate } from '../../format';
import type { IntelTimelinePoint } from '../../intelTypes';
import { DataTable, InsightCard, Note } from '../ui';

export function TrendTimeline({ points }: { points: IntelTimelinePoint[] }) {
  const marked = points.filter(p => p.events.length > 0);
  return (
    <InsightCard
      title="Điểm theo thời điểm"
      info="Điểm tổng thay đổi theo mùa vụ và đà tăng của từ khoá. Đường dọc đánh dấu tuần có sự kiện bán hàng."
    >
      {points.length === 0 ? (
        <Note>Chưa có dữ liệu theo tuần.</Note>
      ) : (
        <div className="space-y-3">
          <div role="img" aria-label="Biểu đồ điểm theo tuần" className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 16, right: 12, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
                <XAxis dataKey="week_start" tickFormatter={shortDate} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
                <Tooltip labelFormatter={(v: any) => `Tuần ${shortDate(String(v))}`} formatter={(v: any) => [v == null ? '—' : decimal(Number(v), 0), 'Điểm']} />
                {marked.map((p, i) => (
                  <ReferenceLine key={p.week_start} x={p.week_start} stroke={SERIES.red} strokeDasharray="3 3" label={{ value: String(i + 1), fontSize: 10, fontWeight: 700, fill: CHART_INK.axis, position: 'top' }} />
                ))}
                <Line type="monotone" dataKey="score" stroke={SERIES.green} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {marked.length > 0 && (
            <ol className="m-0 grid list-none gap-1 p-0 text-xs text-stone-600" aria-label="Sự kiện trên biểu đồ">
              {marked.map((p, i) => (
                <li key={p.week_start}>
                  <span className="mr-1.5 inline-block w-4 text-center font-bold text-stone-800">{i + 1}</span>
                  {p.events.join(', ')} <span className="text-stone-500">(tuần {shortDate(p.week_start)})</span>
                </li>
              ))}
            </ol>
          )}
          <DataTable
            caption="Điểm và hệ số nhu cầu theo tuần"
            head={<><th scope="col">Tuần</th><th scope="col" className="text-right">Điểm</th><th scope="col" className="text-right">Hệ số nhu cầu</th><th scope="col">Sự kiện</th></>}
          >
            {points.map(p => (
              <tr key={p.week_start}>
                <td>{shortDate(p.week_start)}</td>
                <td className="text-right font-bold tabular-nums">{decimal(p.score, 0)}</td>
                <td className="text-right tabular-nums">{p.demand_factor === null ? '—' : `×${decimal(p.demand_factor, 2)}`}</td>
                <td className="text-stone-600">{p.events.join(', ') || '—'}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </InsightCard>
  );
}
