import type { HealthAxis, HealthStatus } from '../../types';
import type { ListingHealthItem } from '../../healthTypes';

export const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700]';

export const ISSUES: { key: string; label: string; hint: string }[] = [
  { key: 'images', label: 'Chưa đủ ảnh', hint: 'Khách nhìn ảnh đầu tiên, ít ảnh thì khó tin' },
  { key: 'description', label: 'Mô tả còn ngắn', hint: 'Khách chưa rõ chất liệu, kích thước' },
  { key: 'tags', label: 'Chưa gắn đủ tag', hint: 'Khách tìm kiếm khó thấy sản phẩm' },
  { key: 'stock_quantity', label: 'Hết hàng', hint: 'Khách muốn mua cũng không đặt được' },
  { key: 'warning', label: 'Bán chưa chạy', hint: 'Ít người xem, hoặc xem nhiều mà ít mua' },
];

export const MOC = { images: 5, description: 150, tags: 3, freshDays: 90, zeroDays: 365 };

export const AXIS_SHORT: Record<HealthAxis, { label: string; missing: string }> = {
  content: { label: 'Ảnh, mô tả, tag', missing: 'chưa có nội dung' },
  inventory: { label: 'Còn hàng', missing: 'hàng làm theo yêu cầu' },
  freshness: { label: 'Mới cập nhật', missing: 'chưa rõ lần sửa gần nhất' },
  rating: { label: 'Sao đánh giá', missing: 'chưa có đánh giá nào' },
  conversion: { label: 'Khách xem rồi mua', missing: 'cần ~100 lượt xem / 30 ngày' },
};

export const BAND_COLOR: Record<HealthStatus, string> = {
  good: '#1a6b1a',
  needs_improvement: '#c27803',
  poor: '#d03b3b',
};

export function bandOf(score: number): HealthStatus {
  if (score >= 80) return 'good';
  if (score >= 50) return 'needs_improvement';
  return 'poor';
}

export function hasIssue(item: ListingHealthItem, issue: string): boolean {
  return issue === 'warning' ? item.warnings.length > 0 : item.todos.some(t => t.field === issue);
}

export function axisValue(item: ListingHealthItem, axis: HealthAxis): number | null {
  const v = item.axes?.[axis];
  return item.axes_missing.includes(axis) || typeof v !== 'number' ? null : v;
}

export function needsWork(item: ListingHealthItem): boolean {
  return item.todos.length > 0 || item.warnings.length > 0;
}

export function gainOf(item: ListingHealthItem): number {
  return item.todos.reduce((g, t) => g + (t.impact ?? 0), 0);
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export interface ShopStats {
  scored: ListingHealthItem[];
  avg: number | null;
  avgAfter: number | null;
  bands: Record<HealthStatus, number>;
  unscored: number;
  nTodos: number;
  nWarnings: number;
  issues: { key: string; label: string; hint: string; n: number }[];
  axes: { axis: HealthAxis; avg: number | null; n: number; bands: Record<HealthStatus, number> }[];
}

export function shopStats(items: ListingHealthItem[], axisOrder: HealthAxis[]): ShopStats {
  const scored = items.filter(i => i.score !== null);
  const scores = scored.map(i => i.score as number);
  const bands: Record<HealthStatus, number> = { good: 0, needs_improvement: 0, poor: 0 };
  for (const i of scored) bands[i.status ?? bandOf(i.score as number)] += 1;

  return {
    scored,
    avg: mean(scores),
    avgAfter: mean(scored.map(i => Math.min(100, (i.score as number) + gainOf(i)))),
    bands,
    unscored: items.length - scored.length,
    nTodos: items.reduce((s, i) => s + i.todos.length, 0),
    nWarnings: items.reduce((s, i) => s + i.warnings.length, 0),
    issues: ISSUES.map(issue => ({ ...issue, n: items.filter(i => hasIssue(i, issue.key)).length })),
    axes: axisOrder.map(axis => {
      const values = scored.map(i => axisValue(i, axis)).filter((v): v is number => v !== null);
      const axisBands: Record<HealthStatus, number> = { good: 0, needs_improvement: 0, poor: 0 };
      for (const v of values) axisBands[bandOf(v)] += 1;
      return { axis, avg: mean(values), n: values.length, bands: axisBands };
    }),
  };
}
