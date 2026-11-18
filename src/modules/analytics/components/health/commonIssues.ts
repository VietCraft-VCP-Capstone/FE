import type { ListingHealthItem } from '../../healthTypes';
import { MIN_IMPACT } from './visibleTodos';

export const URGENT = 'urgent';

export interface ShopIssue {
  code: string;
  message: string;
  count: number;
  gain: number | null;
}

const LABEL: Record<string, string> = {
  image: 'Thêm ảnh cho đủ các góc',
  description: 'Viết mô tả chi tiết hơn',
  tags: 'Gắn thêm từ khoá',
  material: 'Ghi rõ chất liệu',
  price: 'Xem lại giá bán',
  review: 'Mời khách để lại đánh giá',
};

const isUrgent = (item: ListingHealthItem) => item.warnings.some(w => w.type === 'warning');

export function commonIssues(items: ListingHealthItem[], limit = 3): ShopIssue[] {
  const byField = new Map<string, { count: number; total: number }>();
  for (const item of items) {
    const perItem = new Map<string, number>();
    for (const t of item.todos) {
      const impact = t.impact ?? 0;
      if (impact < MIN_IMPACT || !t.field || !LABEL[t.field]) continue;
      perItem.set(t.field, (perItem.get(t.field) ?? 0) + impact);
    }
    for (const [field, impact] of perItem) {
      const cur = byField.get(field) ?? { count: 0, total: 0 };
      byField.set(field, { count: cur.count + 1, total: cur.total + impact });
    }
  }
  const rank = (code: string, total: number) => (code === 'review' ? -1 : total);
  const fixes = [...byField]
    .sort((a, b) => rank(b[0], b[1].total) - rank(a[0], a[1].total))
    .map(([code, v]) => ({ code, message: LABEL[code], count: v.count, gain: Math.round(v.total / v.count) }));
  const urgent = items.filter(isUrgent).length;
  const head: ShopIssue[] = urgent ? [{ code: URGENT, message: 'Sửa lỗi đang khoá điểm ở 79', count: urgent, gain: null }] : [];
  return [...head, ...fixes].slice(0, limit);
}
