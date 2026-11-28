import type { AnomalyAlert } from './types';

export interface AlertGroup {
  alert: AnomalyAlert;
  from: string;
  days: number;
  perDay: number | null;
}

const DAY_MS = 864e5;
const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const shift = (d: string, n: number) => new Date(toMs(d) + n * DAY_MS).toISOString().slice(0, 10);

/** A zero streak fires every day; fold consecutive days of one metric into a single row. */
export function groupAlerts(alerts: AnomalyAlert[]): AlertGroup[] {
  const out: AlertGroup[] = [];
  const open = new Map<string, AlertGroup>();
  for (const a of [...alerts].sort((x, y) => x.date.localeCompare(y.date))) {
    const run = a.run_days ?? 1;
    const perDay = a.rule !== 'zero_run' ? a.expected : a.run_days ? Math.round(a.expected / a.run_days) : null;
    const g = a.rule === 'zero_run' ? open.get(a.metric) : undefined;
    if (g && g.alert.date === shift(a.date, -1)) {
      Object.assign(g, { alert: a, perDay, days: (toMs(a.date) - toMs(g.from)) / DAY_MS + 1 });
      continue;
    }
    const next = { alert: a, from: shift(a.date, 1 - run), days: run, perDay };
    out.push(next);
    if (a.rule === 'zero_run') open.set(a.metric, next);
  }
  // A daily alert on a day already inside a zero streak of the same metric is the same incident.
  const inStreak = (g: AlertGroup) => g.alert.rule !== 'zero_run' && out.some(z => z.alert.rule === 'zero_run'
    && z.alert.metric === g.alert.metric && z.from <= g.alert.date && g.alert.date <= z.alert.date);
  return out.filter(g => !inStreak(g)).sort((x, y) => y.alert.date.localeCompare(x.alert.date) || x.alert.metric.localeCompare(y.alert.metric));
}
