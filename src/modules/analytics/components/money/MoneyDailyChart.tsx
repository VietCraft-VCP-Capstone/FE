import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { CartesianGrid, ComposedChart, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { compactMoney } from '../../../../shared/utils/format';
import { CHART_INK } from '../../../../shared/components/charts/chartTheme';
import { useWheelZoom } from '../../hooks/useWheelZoom';
import { useSmoothWindow } from '../../hooks/useSmoothWindow';
import { DailyHoverTip } from './DailyTooltip';
import { DailyMiniMap } from './DailyMiniMap';
import { PickBar } from './PickBar';
import { cumSeries, daySeries } from './dailySeries';
import type { MoneyReport } from '../../moneyTypes';
import { bucketOf, panBy, signedAxis, tickIndices, toPoints, zoomAt, type ChartMode } from './dailyData';

const PAD_L = 40;
const PAD_R = 8;
const TICK = { fill: CHART_INK.axis, fontSize: 11 };
const BUCKET_TEXT = { day: 'Theo ngày', week: 'Theo tuần', month: 'Theo tháng' } as const;

interface Props { byDay: MoneyReport['by_day']; avg: number; mode: ChartMode; onPick: (from: string, to: string) => void }

export function MoneyDailyChart({ byDay, avg, mode, onPick }: Props) {
  const days = useMemo(() => toPoints(byDay, 'day'), [byDay]);
  const n = days.length;
  const zoomable = n > 2;
  const minSpan = Math.min(4, n - 1);
  const { view, target, setTarget, reset } = useSmoothWindow(n, minSpan);
  const span = view.e - view.s;
  const zoomed = span < n - 1 - 0.01;
  const bucket = bucketOf(span + 1);
  const points = useMemo(() => toPoints(byDay, bucket), [byDay, bucket]);
  const labelAt = useMemo(() => new Map(points.map(p => [p.i, p.label])), [points]);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [brush, setBrush] = useState<{ a: number; b: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);

  const plotW = () => Math.max(1, (ref.current?.getBoundingClientRect().width ?? 0) - PAD_L - PAD_R);
  const fracAt = (x: number) => {
    const left = (ref.current?.getBoundingClientRect().left ?? 0) + PAD_L;
    return Math.min(1, Math.max(0, (x - left) / plotW()));
  };
  const hoverAt = (x: number) => Math.min(n - 1, Math.max(0, Math.round(view.s + fracAt(x) * span)));
  const groupAt = (d: number) => points.findIndex(p => p.s <= d && d <= p.e);

  useWheelZoom(ref, zoomable, e => {
    const k = e.deltaMode === 1 ? 33 : 1;
    const dx = e.deltaX * k;
    const dy = e.deltaY * k;
    const t = target.current;
    if (Math.abs(dx) > Math.abs(dy)) setTarget(panBy(t, n, minSpan, (dx / plotW()) * (t.e - t.s)));
    else setTarget(zoomAt(t, n, minSpan, fracAt(e.clientX), Math.exp(dy * 0.0015)));
  });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!zoomable) return;
    const t = target.current;
    const step = Math.max(1, (t.e - t.s) * 0.1);
    if (e.key === 'ArrowLeft') setTarget(panBy(t, n, minSpan, -step));
    else if (e.key === 'ArrowRight') setTarget(panBy(t, n, minSpan, step));
    else if (e.key === '+' || e.key === '=') setTarget(zoomAt(t, n, minSpan, 0.5, 0.8));
    else if (e.key === '-') setTarget(zoomAt(t, n, minSpan, 0.5, 1.25));
    else if (e.key === '0') reset();
    else return;
    e.preventDefault();
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!zoomable || e.button !== 0 || e.detail > 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // chưa phóng to: kéo để khoanh một đoạn; đã phóng to: kéo để di chuyển
    if (!zoomed) { const i = hoverAt(e.clientX); setBrush({ a: i, b: i }); return; }
    lastX.current = e.clientX;
    setDragging(true);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (brush) { setBrush({ ...brush, b: hoverAt(e.clientX) }); return; }
    if (lastX.current === null) { setHover(groupAt(hoverAt(e.clientX))); return; }
    const t = target.current;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setTarget(panBy(t, n, minSpan, (-dx / plotW()) * (t.e - t.s)), true);
  };
  const onUp = () => {
    if (brush && Math.abs(brush.b - brush.a) >= 1) setTarget({ s: Math.min(brush.a, brush.b), e: Math.max(brush.a, brush.b) });
    setBrush(null);
    lastX.current = null;
    setDragging(false);
  };

  const visible = points.filter(p => p.e >= view.s && p.s <= view.e).length;
  const hp = hover !== null && hover >= 0 ? points[hover] : undefined;
  const axis = signedAxis(points.map(p => (mode === 'cum' ? p.cum : p.net)));
  const cursor = zoomed ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : zoomable ? 'cursor-crosshair' : '';

  return (
    <div>
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label="Biểu đồ thực nhận theo ngày, dùng phím + và - để phóng to, mũi tên để di chuyển, 0 để xem toàn bộ"
        onKeyDown={onKeyDown}
        onDoubleClick={reset}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={() => setHover(null)}
        className={`relative rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] ${cursor}`}
      >
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={points} margin={{ top: 24, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
            <XAxis
              type="number" dataKey="i" domain={[view.s - 0.5, view.e + 0.5]} allowDataOverflow
              ticks={tickIndices(points, view)} tickFormatter={i => labelAt.get(Number(i)) ?? ''}
              interval={0} tickLine={false} axisLine={false} tick={TICK} dy={4}
            />
            <YAxis
              tickLine={false} axisLine={false} allowDecimals={false} width={52}
              domain={axis?.domain} ticks={axis?.ticks} tick={TICK}
              tickFormatter={v => (Number(v) === 0 ? '0' : compactMoney(Number(v)))}
            />
            {brush && <ReferenceArea x1={Math.min(brush.a, brush.b) - 0.5} x2={Math.max(brush.a, brush.b) + 0.5} fill="#007700" fillOpacity={0.15} stroke="#007700" strokeOpacity={0.4} ifOverflow="hidden" />}
            {hp && <ReferenceArea x1={hp.s - 0.5} x2={hp.e + 0.5} fill="#007700" fillOpacity={0.06} stroke="none" ifOverflow="hidden" />}
            {mode === 'cum'
              ? cumSeries({ point: hp })
              : daySeries({ avg: bucket === 'day' ? avg : 0, hover: hp?.i ?? null, values: visible <= 12, barSize: Math.round(Math.min(140, Math.max(4, (plotW() / (span + 1)) * (n / points.length) * 0.72))) })}
          </ComposedChart>
        </ResponsiveContainer>
        {hp && !dragging && <DailyHoverTip point={hp} mode={mode} rel={(hp.i - view.s + 0.5) / (span + 1)} />}
        <span className="pointer-events-none absolute left-12 top-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">{BUCKET_TEXT[bucket]}</span>
      </div>
      {zoomable && (
        <>
          <DailyMiniMap
            points={days} view={view}
            onPan={d => setTarget(panBy(target.current, n, minSpan, d), true)}
            onJump={c => setTarget({ s: c - span / 2, e: c + span / 2 })}
          />
          <PickBar points={days} view={view} zoomed={zoomed} onReset={reset} onPick={onPick} />
        </>
      )}
    </div>
  );
}
