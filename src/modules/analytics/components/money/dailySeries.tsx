import { Area, Bar, Line, ReferenceDot, Rectangle, ReferenceLine } from 'recharts';
import { BRAND } from '../ui';
import { compactMoney } from '../../../../shared/utils/format';
import type { DayPoint } from './dailyData';

const RED = '#DC2626';

interface BarShapeProps { x: number; y: number; width: number; height: number; payload: DayPoint }

// Plain functions, not components: recharts only recognises its own element types among children.
export function daySeries({ avg, hover, barSize }: { avg: number; hover: number | null; barSize: number }) {
  const opacity = (i: number) => (hover === null ? 0.85 : hover === i ? 1 : 0.35);
  return [
    avg > 0 && (
      <ReferenceLine key="avg" y={avg} stroke="#a8a29e" strokeDasharray="4 4" label={{ value: `TB ${compactMoney(avg)}`, position: 'insideTopRight', fill: '#78716c', fontSize: 11 }} />
    ),
    <Bar
      key="bar"
      dataKey="net" radius={[4, 4, 0, 0]} isAnimationActive={false} barSize={barSize}
      minPointSize={v => (Number(v) < 0 ? 6 : 0)}
      shape={(p: unknown) => {
        const s = p as BarShapeProps;
        return <Rectangle {...s} fill={s.payload.net < 0 ? RED : BRAND} fillOpacity={opacity(s.payload.i)} style={{ transition: 'fill-opacity 150ms' }} />;
      }}
    />,
    <Line key="empty" dataKey="empty" stroke="none" dot={{ r: 3, fill: '#d6d3d1', stroke: 'none' }} activeDot={false} isAnimationActive={false} legendType="none" />,
  ];
}

export function cumSeries({ points, hover }: { points: DayPoint[]; hover: number | null }) {
  return [
    <Area
      key="cum"
      type="monotone" dataKey="cum" stroke={BRAND} strokeWidth={2} fill={BRAND} fillOpacity={0.08}
      dot={false} activeDot={false} isAnimationActive={false}
    />,
    hover !== null && (
      <ReferenceDot
        key="cum-dot"
        x={hover} y={points[hover].cum} r={4} fill={BRAND} stroke="#fff" strokeWidth={2} ifOverflow="hidden"
      />
    ),
  ];
}
