/**
 * Số liệu tổng của trang "Sức khoẻ sản phẩm", tính từ danh sách sản phẩm ở máy.
 */

import type { HealthAxis, HealthStatus } from '../../types';
import type { ListingHealthItem } from '../../healthTypes';

export const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700]';

/** Loại lỗi để lọc: field của todo, riêng `warning` là mọi cảnh báo. */
export const ISSUES: { key: string; label: string }[] = [
  { key: 'images', label: 'Thiếu ảnh' },
  { key: 'description', label: 'Mô tả ngắn' },
  { key: 'tags', label: 'Thiếu tag' },
  { key: 'stock_quantity', label: 'Hết hàng' },
  { key: 'warning', label: 'Cần kiểm tra' },
];

/** Màu của ba mức điểm. Vàng nằm giữa để xanh và đỏ không đứng cạnh nhau. */
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
  /** Điểm trung bình nếu làm hết việc cần làm. */
  avgAfter: number | null;
  bands: Record<HealthStatus, number>;
  unscored: number;
  nTodos: number;
  nWarnings: number;
  issues: { key: string; label: string; n: number }[];
  /** Trung bình từng tiêu chí trên những sản phẩm có tính tiêu chí đó. null = chưa sản phẩm nào tính được. */
  axes: { axis: HealthAxis; avg: number | null; n: number }[];
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
    issues: ISSUES.map(({ key, label }) => ({ key, label, n: items.filter(i => hasIssue(i, key)).length })),
    axes: axisOrder.map(axis => {
      const values = scored
        .filter(i => !i.axes_missing.includes(axis))
        .map(i => i.axes?.[axis])
        .filter((v): v is number => typeof v === 'number');
      return { axis, avg: mean(values), n: values.length };
    }),
  };
}
