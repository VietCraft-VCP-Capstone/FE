import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { CartesianGrid, ComposedChart, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { compactMoney } from '../../../../shared/utils/format';
import { CHART_INK } from '../../../../shared/components/charts/chartTheme';
import { useWheelZoom } from '../../hooks/useWheelZoom';
import { useSmoothWindow } from '../../hooks/useSmoothWindow';
import { DailyHoverTip } from './DailyTooltip';
import { DailyMiniMap } from './DailyMiniMap';
import { cumSeries, daySeries } from './dailySeries';
import { panBy, signedAxis, tickIndices, zoomAt, type ChartMode, type DayPoint } from './dailyData';

const PAD_L = 40;
const PAD_R = 8;
const TICK = { fill: CHART_INK.axis, fontSize: 11 };

export function MoneyDailyChart({ points, avg, mode }: { points: DayPoint[]; avg: number; mode: ChartMode }) {
  const n = points.length;
  const zoomable = n > 7;
  const minSpan = Math.min(4, n - 1);
  const { view, target, setTarget, reset } = useSmoothWindow(n, minSpan);
  const span = view.e - view.s;
  const zoomed = span < n - 1 - 0.01;
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastX = useRef<number | null>(null);

  const plotW = () => Math.max(1, (ref.current?.getBoundingClientRect().width ?? 0) - PAD_L - PAD_R);
  const fracAt = (x: number) => {
    const left = (ref.current?.getBoundingClientRect().left ?? 0) + PAD_L;
    return Math.min(1, Math.max(0, (x - left) / plotW()));
  };
  const hoverAt = (x: number) => Math.min(n - 1, Math.max(0, Math.round(view.s + fracAt(x) * span)));

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
    if (!zoomed || e.button !== 0 || e.detail > 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    lastX.current = e.clientX;
    setDragging(true);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (lastX.current === null) { setHover(hoverAt(e.clientX)); return; }
    const t = target.current;
    const dx = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setTarget(panBy(t, n, minSpan, (-dx / plotW()) * (t.e - t.s)), true);
  };
  const onUp = () => { lastX.current = null; setDragging(false); };

  const axis = signedAxis(points.map(p => (mode === 'cum' ? p.cum : p.net)));
  const cursor = zoomed ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : '';

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
          <ComposedChart data={points} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
            <XAxis
              type="number" dataKey="i" domain={[view.s - 0.5, view.e + 0.5]} allowDataOverflow
              ticks={tickIndices(view, n)} tickFormatter={i => points[Number(i)]?.label ?? ''}
              interval={0} tickLine={false} axisLine={false} tick={TICK} dy={4}
            />
            <YAxis
              tickLine={false} axisLine={false} allowDecimals={false} width={52}
              domain={axis?.domain} ticks={axis?.ticks} tick={TICK}
              tickFormatter={v => (Number(v) === 0 ? '0' : compactMoney(Number(v)))}
            />
            {hover !== null && <ReferenceArea x1={hover - 0.5} x2={hover + 0.5} fill="#007700" fillOpacity={0.06} stroke="none" ifOverflow="hidden" />}
            {mode === 'cum'
              ? cumSeries({ points, hover })
              : daySeries({ avg, hover, barSize: Math.round(Math.min(56, Math.max(4, (plotW() / (span + 1)) * 0.6))) })}
          </ComposedChart>
        </ResponsiveContainer>
        {hover !== null && !dragging && <DailyHoverTip point={points[hover]} mode={mode} rel={(hover - view.s + 0.5) / (span + 1)} />}
      </div>
      {zoomable && (
        <>
          <DailyMiniMap
            points={points} view={view}
            onPan={d => setTarget(panBy(target.current, n, minSpan, d), true)}
            onJump={c => setTarget({ s: c - span / 2, e: c + span / 2 })}
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-stone-500">Lăn chuột để phóng to / thu nhỏ, kéo biểu đồ hoặc thanh bên dưới để xem ngày khác, bấm đúp để xem toàn bộ.</p>
            {zoomed && (
              <button type="button" onClick={reset} className="shrink-0 text-xs font-semibold text-[#005B00] hover:underline">
                Xem toàn bộ
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
