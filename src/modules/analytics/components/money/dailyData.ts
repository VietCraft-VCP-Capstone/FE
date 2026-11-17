import { fullDate, shortDate } from '../../format';
import type { MoneyReport } from '../../moneyTypes';

type Day = MoneyReport['by_day'][number];

export interface DayPoint { i: number; key: string; end: string; label: string; full: string; net: number; cum: number; orders: number; empty: number | null }

export type Win = { s: number; e: number };
export type ChartMode = 'day' | 'cum';
export type Bucket = 'day' | 'week' | 'month';

export const bucketOf = (days: number): Bucket => (days <= 45 ? 'day' : days <= 180 ? 'week' : 'month');

function groupBy(byDay: Day[], bucket: Bucket): Day[][] {
  if (bucket === 'day') return byDay.map(d => [d]);
  if (bucket === 'week') return Array.from({ length: Math.ceil(byDay.length / 7) }, (_, i) => byDay.slice(i * 7, i * 7 + 7));
  const months = new Map<string, Day[]>();
  for (const d of byDay) months.set(d.date.slice(0, 7), [...(months.get(d.date.slice(0, 7)) ?? []), d]);
  return [...months.values()];
}

function labels(first: string, last: string, bucket: Bucket) {
  if (bucket === 'day') return { label: shortDate(first), full: fullDate(first) };
  if (bucket === 'week') return { label: shortDate(first), full: `Tuần ${shortDate(first)} – ${shortDate(last)}` };
  const [y, m] = first.split('-');
  return { label: `T${Number(m)}/${y.slice(2)}`, full: `Tháng ${Number(m)}/${y}` };
}

export function toPoints(byDay: Day[], bucket: Bucket): DayPoint[] {
  const groups = groupBy(byDay, bucket);
  let cum = 0;
  return groups.map((g, i) => {
    const first = g[0].date;
    const last = g[g.length - 1].date;
    const orders = g.reduce((s, d) => s + d.orders, 0);
    const net = g.reduce((s, d) => s + d.net_vnd, 0);
    cum += net;
    return {
      i,
      key: first,
      end: last,
      ...labels(first, last, bucket),
      net,
      cum,
      orders,
      empty: orders === 0 ? 0 : null,
    };
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

export function tickIndices(w: Win, n: number): number[] {
  const k = Math.max(1, Math.ceil((w.e - w.s + 1) / 8));
  const out: number[] = [];
  for (let i = Math.ceil(w.s); i <= Math.min(n - 1, Math.floor(w.e)); i++) if (i % k === 0) out.push(i);
  return out;
}

