import type { ReactNode } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { scoreText, shortDate } from '../../format';
import type { IntelTimelinePoint } from '../../intelTypes';
import { Section } from '../health/Section';

type Scored = IntelTimelinePoint & { score: number };

function bestRun(points: Scored[]): Scored[] {
  const max = Math.max(...points.map(p => p.score));
  const start = points.findIndex(p => p.score >= max - 0.5);
  const end = points.findIndex((p, i) => i > start && p.score < max - 0.5);
  return points.slice(start, end === -1 ? points.length : end);
}

function sentence(points: Scored[], run: Scored[]): string {
  const from = run[0];
  const to = run[run.length - 1];
  const events = [...new Set(run.flatMap(p => p.events))];
  const dip = events.length ? `, dịp ${events.join(', ')}` : '';
  if (from === points[0]) {
    return `Ngay từ tuần này đã là giai đoạn bán tốt nhất trong 8 tuần tới${to !== from ? `, kéo dài đến tuần ${shortDate(to.week_start)}` : ''}${dip}.`;
  }
  if (from === to) return `Tuần bán tốt nhất trong 8 tuần tới là tuần ${shortDate(from.week_start)}${dip}. Chuẩn bị hàng trước tuần đó.`;
  return `Giai đoạn bán tốt nhất trong 8 tuần tới: từ tuần ${shortDate(from.week_start)} đến tuần ${shortDate(to.week_start)}${dip}. Chuẩn bị hàng trước tuần ${shortDate(from.week_start)}.`;
}

function TipBox({ active, payload }: { active?: boolean; payload?: { payload: Scored }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded border border-stone-200 bg-white px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-semibold">Tuần {shortDate(p.week_start)}: {scoreText(p.score)} điểm</div>
      {p.events.length > 0 && <div className="text-stone-600">Dịp {p.events.join(', ')}</div>}
    </div>
  );
}

export function SeasonPanel({ points, children }: { points: IntelTimelinePoint[]; children?: ReactNode }) {
  const scored = points.filter((p): p is Scored => p.score !== null);
  if (scored.length < 2) {
    return <Section title="Thời điểm bán tốt" extra={children}><p className="m-0 text-sm text-stone-500">Chưa có dữ liệu theo tuần.</p></Section>;
  }
  const run = bestRun(scored);
  return (
    <Section title="Thời điểm bán tốt" extra={children}>
      <p className="m-0 text-sm text-stone-800">{sentence(scored, run)}</p>
      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={scored} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="#f5f5f4" />
            <XAxis dataKey="week_start" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
            <ReferenceArea x1={run[0].week_start} x2={run[run.length - 1].week_start} fill="#007700" fillOpacity={0.08} />
            <Tooltip content={<TipBox />} />
            <Area type="monotone" dataKey="score" stroke="#007700" strokeWidth={2} fill="#007700" fillOpacity={0.06} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="m-0 mt-1 text-xs text-stone-500">8 tuần tính từ {shortDate(scored[0].week_start)}. Vùng tô xanh là giai đoạn bán tốt nhất.</p>
    </Section>
  );
}
