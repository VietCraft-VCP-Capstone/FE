import { fullDate, shortDate } from '../../format';
import type { MoneyReport } from '../../moneyTypes';

type Day = MoneyReport['by_day'][number];

/** i: tâm cột tính theo chỉ số ngày; s..e: các ngày cột này gộp */
export interface DayPoint { i: number; s: number; e: number; key: string; end: string; label: string; full: string; net: number; cum: number; orders: number; empty: number | null }

export type Win = { s: number; e: number };
export type ChartMode = 'day' | 'cum';
export type Bucket = 'day' | 'week' | 'month';

/** Chọn độ gộp theo số ngày đang hiện trên biểu đồ. */
export const bucketOf = (days: number): Bucket => (days >= 28 ? 'month' : days >= 7 ? 'week' : 'day');

function keyOf(date: string, bucket: Bucket) {
  if (bucket === 'day') return date;
  if (bucket === 'month') return date.slice(0, 7);
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function labels(first: string, last: string, bucket: Bucket) {
  if (bucket === 'day') return { label: shortDate(first), full: fullDate(first) };
  if (bucket === 'week') return { label: shortDate(first), full: `Tuần ${shortDate(first)} – ${shortDate(last)}` };
  const [y, m] = first.split('-');
  const whole = first.endsWith('-01') && new Date(`${last}T00:00:00Z`).getUTCDate() === new Date(Date.UTC(+y, +m, 0)).getUTCDate();
  return { label: `T${Number(m)}/${y.slice(2)}`, full: `Tháng ${Number(m)}/${y}${whole ? '' : ` (${shortDate(first)} – ${shortDate(last)})`}` };
}

export function toPoints(byDay: Day[], bucket: Bucket): DayPoint[] {
  const groups: { s: number; days: Day[] }[] = [];
  byDay.forEach((d, idx) => {
    const g = groups[groups.length - 1];
    if (g && keyOf(g.days[0].date, bucket) === keyOf(d.date, bucket)) g.days.push(d);
    else groups.push({ s: idx, days: [d] });
  });
  let cum = 0;
  return groups.map(({ s, days }) => {
    const first = days[0].date;
    const last = days[days.length - 1].date;
    const orders = days.reduce((t, d) => t + d.orders, 0);
    const net = days.reduce((t, d) => t + d.net_vnd, 0);
    cum += net;
    const e = s + days.length - 1;
    return { i: (s + e) / 2, s, e, key: first, end: last, ...labels(first, last, bucket), net, cum, orders, empty: orders === 0 ? 0 : null };
  });
}

export function dailyStats(byDay: Day[]) {
  const active = byDay.filter(d => d.orders > 0);
  const sum = active.reduce((s, d) => s + d.net_vnd, 0);
  let best: { date: string; net: number } | null = null;
  for (const d of byDay) {
    if (d.net_vnd > 0 && (!best || d.net_vnd > best.net)) best = { date: d.date, net: d.net_vnd };
  }
  return { avg: active.length ? sum / active.length : 0, active: active.length, total: byDay.length, best };
}

/** Trục chỉ chia vạch phía dương; phần âm nhỏ không kéo trục xuống cả một bậc. */
export function signedAxis(values: number[]): { domain: [number, number]; ticks: number[] } | undefined {
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  if (max <= 0) return undefined;
  const pow = 10 ** Math.floor(Math.log10(max / 3));
  const step = Math.ceil(max / 3 / pow) * pow;
  const ticks = Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step);
  return { domain: [min, ticks[ticks.length - 1]], ticks };
}

export function clampWin(w: Win, n: number, minSpan: number): Win {
  const max = Math.max(0, n - 1);
  const span = Math.min(max, Math.max(minSpan, w.e - w.s));
  const s = Math.min(Math.max(0, w.s), max - span);
  return { s, e: s + span };
}

export function zoomAt(w: Win, n: number, minSpan: number, frac: number, factor: number): Win {
  const span = (w.e - w.s) * factor;
  const s = w.s + frac * (w.e - w.s) - frac * span;
  return clampWin({ s, e: s + span }, n, minSpan);
}

export function panBy(w: Win, n: number, minSpan: number, delta: number): Win {
  return clampWin({ s: w.s + delta, e: w.e + delta }, n, minSpan);
}

export function tickIndices(points: DayPoint[], w: Win): number[] {
  const vis = points.filter(p => p.i >= w.s - 0.5 && p.i <= w.e + 0.5);
  const k = Math.max(1, Math.ceil(vis.length / 8));
  return vis.filter((_, j) => j % k === 0).map(p => p.i);
}
