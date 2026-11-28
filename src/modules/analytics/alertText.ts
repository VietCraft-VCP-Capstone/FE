import { compactMoney, count } from '../../shared/utils/format';
import type { AlertGroup } from './alertGroups';
import { shortDate } from './format';

const METRIC = { revenue: 'Doanh thu', views: 'Lượt xem' } as const;
const DAY_MS = 864e5;

export const fmtValue = (g: AlertGroup, n: number) => (g.alert.metric === 'revenue' ? compactMoney(n) : count(n));

/** One plain sentence a seller reads in a glance, plus the numbers behind it. */
export function describe(g: AlertGroup): { headline: string; detail: string } {
  const a = g.alert;
  const when = a.rule === 'zero_run' ? `${shortDate(g.from)} – ${shortDate(a.date)}` : shortDate(a.date);
  const usual = g.perDay == null ? '' : `bình thường khoảng ${fmtValue(g, g.perDay)}`;
  if (a.rule === 'zero_run') {
    const headline = a.metric === 'revenue' ? `Không có đơn nào suốt ${g.days} ngày` : `Không ai xem shop suốt ${g.days} ngày`;
    return { headline, detail: usual ? `${when} · ${usual}/ngày` : when };
  }
  const ratio = a.expected > 0 ? a.actual / a.expected : 0;
  const change = a.direction === 'drop' ? `giảm ${Math.round(-a.change_pct)}%`
    : ratio >= 2 ? `tăng gấp ${Math.round(ratio)} lần` : `tăng ${Math.round(a.change_pct)}%`;
  const unit = a.metric === 'views' ? ' lượt xem' : '';
  return { headline: `${METRIC[a.metric]} ${change}`, detail: `Ngày ${when}: ${fmtValue(g, a.actual)}${unit}${usual ? `, ${usual}` : ''}` };
}

export function nextStep(g: AlertGroup): string {
  const a = g.alert;
  if (a.rule === 'zero_run') return a.metric === 'revenue'
    ? 'Nên xem lại: sản phẩm còn hiển thị, còn hàng và giá có hợp lý.'
    : 'Nên xem lại: sản phẩm có bị ẩn, bị khoá hay hết hàng.';
  return 'Xem sản phẩm giảm nhiều nhất ở danh sách bên dưới.';
}

/** Recent = ended within the last `days` days. */
export const isRecent = (g: AlertGroup, days = 7, now = Date.now()) =>
  now - Date.parse(`${g.alert.date}T00:00:00Z`) <= days * DAY_MS;

/** Worst first: zero streaks, then revenue, then longer/bigger. */
export function worst(groups: AlertGroup[]): AlertGroup | undefined {
  const score = (g: AlertGroup) => (g.alert.rule === 'zero_run' ? 2 : 0) + (g.alert.metric === 'revenue' ? 1 : 0);
  return [...groups].sort((x, y) => score(y) - score(x) || y.days - x.days)[0];
}
