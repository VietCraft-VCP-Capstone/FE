import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import type { StrategicGroups } from '../../types';

export const GROUP_COLORS = [SERIES.blue, '#b45309', '#8b5cf6', '#0d9488', '#be185d'];

type Diem = StrategicGroups['points'][number] & { label: string };

/** Bản đồ nhóm chiến lược: mỗi chấm một shop, màu theo nhóm AI chia, shop bạn chấm to viền xanh. */
export function StrategyMap({ data }: { data: StrategicGroups }) {
  const nhan = Object.fromEntries(data.groups.map(g => [g.id, g.label]));
  return (
    <figure className="m-0">
      <div className="h-80 w-full" role="img" aria-label={`Bản đồ ${data.points.length} shop chia thành ${data.k} nhóm chiến lược`}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid stroke={CHART_INK.grid} />
            <XAxis type="number" dataKey="x" tick={false} axisLine={false}
              label={{ value: `← ít hơn · ${data.axes.x} · nhiều hơn →`, position: 'insideBottom', offset: -12, fontSize: 11, fill: '#78716c' }} />
            <YAxis type="number" dataKey="y" tick={false} axisLine={false} width={24}
              label={data.axes.y ? { value: data.axes.y, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#78716c' } : undefined} />
            <ZAxis type="number" dataKey="me" range={[70, 70]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                const p = payload?.[0]?.payload as Diem | undefined;
                return p ? (
                  <div className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs shadow-sm">
                    <strong className="block text-stone-900">{p.shop_name}{p.me ? ' (bạn)' : ''}</strong>
                    <span className="text-stone-600">{p.label}</span>
                  </div>
                ) : null;
              }}
            />
            {data.groups.map(g => (
              <Scatter
                key={g.id}
                name={g.label}
                data={data.points.filter(p => p.group === g.id).map(p => ({ ...p, label: g.label }))}
                fill={GROUP_COLORS[g.id % GROUP_COLORS.length]}
                shape={(props: { cx?: number; cy?: number; payload?: Diem; fill?: string }) => (
                  props.payload?.me
                    ? <circle cx={props.cx} cy={props.cy} r={9} fill={props.fill} stroke={SERIES.green} strokeWidth={3} />
                    : <circle cx={props.cx} cy={props.cy} r={5} fill={props.fill} fillOpacity={0.85} />
                )}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
        {data.groups.map(g => (
          <span key={g.id} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: GROUP_COLORS[g.id % GROUP_COLORS.length] }} aria-hidden />
            {nhan[g.id]} ({g.size} shop)
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-[3px]" style={{ borderColor: SERIES.green }} aria-hidden />
          Shop của bạn
        </span>
      </figcaption>
    </figure>
  );
}
