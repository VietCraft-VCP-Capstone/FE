import { useState } from 'react';
import { useEnterMotion } from '../../../../shared/hooks/useMotion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_INK } from '../../../../shared/components/charts/chartTheme';
import { fullDate, shortDate } from '../../format';
import type { HealthSummaryPoint } from '../../healthTypes';
import type { InsightState } from '../../hooks/useInsight';
import type { HealthStatus } from '../../types';
import { InfoTip, InsightCard, Note, Skeleton } from '../ui';
import { HEALTH_BANDS } from '../HealthParts';
import { BAND_COLOR, bandOf } from './healthStats';

export const TREND_DAYS = [30, 90] as const;

const STACK: { key: HealthStatus; label: string }[] = HEALTH_BANDS.map(b => ({ key: b.status, label: b.label }));

const INFO = 'Mỗi ngày có bao nhiêu phần trăm sản phẩm ở mức Tốt (xanh), Nên sửa thêm (vàng), Cần sửa gấp (đỏ). Sửa theo gợi ý thì phần xanh rộng ra.';

function DaysToggle({ days, onChange }: { days: number; onChange: (d: number) => void }) {
  return (
    <div role="group" aria-label="Khoảng thời gian" className="inline-flex rounded-md bg-stone-100 p-0.5">
      {TREND_DAYS.map(d => (
        <button
          key={d}
          type="button"
          aria-pressed={days === d}
          onClick={() => onChange(d)}
          className={`cursor-pointer rounded border-none px-2.5 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] motion-reduce:transition-none ${
            days === d ? 'bg-white text-stone-900' : 'bg-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          {d} ngày
        </button>
      ))}
    </div>
  );
}

interface Row { label: string; date: string; good: number; needs_improvement: number; poor: number }

function DayTooltip({ active, payload }: { active?: boolean; payload?: { payload?: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2 text-xs">
      <div className="mb-1 font-bold text-stone-900">{fullDate(row.date)}</div>
      {[...STACK].reverse().map(s => (
        <div key={s.key} className="flex items-center gap-2 text-stone-600">
          <span className="h-2 w-2 rounded-sm" style={{ background: BAND_COLOR[s.key] }} />
          {s.label}: <strong className="tabular-nums text-stone-900">{row[s.key]}</strong>
        </div>
      ))}
    </div>
  );
}

function Change({ label, now, before, goodWhenUp }: { label: string; now: number; before: number; goodWhenUp: boolean }) {
  const d = now - before;
  const tone = d === 0 ? 'text-stone-500' : (d > 0) === goodWhenUp ? 'text-[#005B00]' : 'text-red-700';
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] text-stone-500">{label}</dt>
      <dd className="m-0 text-sm font-bold tabular-nums text-stone-900">
        {now} <span className={`text-xs font-semibold ${tone}`}>{d === 0 ? '±0' : d > 0 ? `+${d}` : d}</span>
      </dd>
    </div>
  );
}

function ShareArea({ rows }: { rows: Row[] }) {
  const last = rows[rows.length - 1];
  return (
    <div role="img" aria-label={`Tỉ lệ sản phẩm theo mức, ngày ${fullDate(last.date)}: Tốt ${last.good}, Nên sửa thêm ${last.needs_improvement}, Cần sửa gấp ${last.poor}`} style={{ height: 210 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} stackOffset="expand" margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
          <YAxis tickFormatter={v => `${Math.round(v * 100)}%`} ticks={[0, 0.5, 1]} tickLine={false} axisLine={false} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
          <Tooltip content={<DayTooltip />} />
          {STACK.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stackId="band"
              stroke={BAND_COLOR[s.key]} fill={BAND_COLOR[s.key]} fillOpacity={0.85} isAnimationActive={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Body({ state, days }: { state: InsightState<HealthSummaryPoint[]>; days: number }) {
  if (state.kind === 'loading') return <Skeleton className="h-[200px] w-full" />;
  if (state.kind === 'insufficient') return <Note>Chưa có điểm nào trong {days} ngày qua. Điểm được chấm lại mỗi ngày.</Note>;
  if (state.kind !== 'ready') return <Note>Chưa đọc được số liệu theo ngày.</Note>;

  const rows: Row[] = state.data.map(p => ({ label: shortDate(p.date), date: p.date, good: p.good, needs_improvement: p.needs_improvement, poor: p.poor }));
  const first = rows[0];
  const last = rows[rows.length - 1];

  return (
    <div className="space-y-3">
      <ShareArea rows={rows} />
      <dl className="m-0 grid grid-cols-3 gap-3 border-t border-stone-100 pt-3">
        <Change label={`Tốt (so với ${first.label})`} now={last.good} before={first.good} goodWhenUp />
        <Change label="Nên sửa thêm" now={last.needs_improvement} before={first.needs_improvement} goodWhenUp={false} />
        <Change label="Cần sửa gấp" now={last.poor} before={first.poor} goodWhenUp={false} />
      </dl>
    </div>
  );
}

const BUCKETS = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i === 9 ? 100 : i * 10 + 9 }));

function ScoreHistogram({ scores }: { scores: number[] }) {
  const data = BUCKETS.map(b => ({
    label: `${b.from}–${b.to}`,
    n: scores.filter(sc => sc >= b.from && (b.to === 100 ? sc <= 100 : sc < b.from + 10)).length,
    color: BAND_COLOR[bandOf(b.from)],
  }));
  return (
    <div role="img" aria-label={`Phân bố điểm: ${data.filter(d => d.n).map(d => `${d.n} sản phẩm ${d.label} điểm`).join(', ')}`} style={{ height: 210 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
          <Tooltip cursor={{ fill: 'rgba(16,33,26,0.04)' }} formatter={(v: number) => [`${v} sản phẩm`, 'Số lượng']} labelFormatter={l => `${l} điểm`} />
          <Bar dataKey="n" maxBarSize={44} radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map(d => <Cell key={d.label} fill={d.color} />)}
            <LabelList dataKey="n" position="top" formatter={(v: number) => (v ? v : '')} style={{ fill: '#1c1917', fontSize: 11, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type Mode = 'now' | 'trend';

function ModeToggle({ mode, onChange, trendReady }: { mode: Mode; onChange: (m: Mode) => void; trendReady: boolean }) {
  const btn = (m: Mode, label: string, disabled = false) => (
    <button
      type="button"
      aria-pressed={mode === m}
      disabled={disabled}
      onClick={() => onChange(m)}
      className={`cursor-pointer rounded border-none px-2.5 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${
        mode === m ? 'bg-white text-stone-900' : 'bg-transparent text-stone-600 hover:text-stone-900'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Kiểu biểu đồ" className="inline-flex items-center rounded-md bg-stone-100 p-0.5">
      {btn('now', 'Hôm nay')}
      {btn('trend', 'Theo ngày', !trendReady)}
      {!trendReady && <span className="px-1.5"><InfoTip text="Điểm được lưu mỗi ngày. Từ ngày thứ hai sẽ xem được xu hướng." label="Vì sao chưa xem theo ngày" /></span>}
    </div>
  );
}

export function ShopTrend({ state, scores, days, onDaysChange, className }: {
  state: InsightState<HealthSummaryPoint[]>;
  scores: number[];
  days: number;
  onDaysChange: (d: number) => void;
  className?: string;
}) {
  const trendReady = state.kind === 'ready' && state.data.length >= 2;
  const [picked, setMode] = useState<Mode>('now');
  const mode: Mode = trendReady ? picked : 'now';
  const bodyRef = useEnterMotion<HTMLDivElement>([mode]);
  return (
    <InsightCard
      title="Điểm của các sản phẩm"
      info={mode === 'now'
        ? 'Mỗi cột là số sản phẩm trong một khoảng điểm. Xanh là Tốt (từ 80), vàng là Nên sửa thêm (50–79), đỏ là Cần sửa gấp (dưới 50). Cột xanh càng cao càng tốt.'
        : INFO}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'trend' && <DaysToggle days={days} onChange={onDaysChange} />}
          <ModeToggle mode={mode} onChange={setMode} trendReady={trendReady} />
        </div>
      }
      className={className}
      bodyClassName="px-4 py-3"
    >
      <div ref={bodyRef}>{mode === 'now' ? <ScoreHistogram scores={scores} /> : <Body state={state} days={days} />}</div>
    </InsightCard>
  );
}
