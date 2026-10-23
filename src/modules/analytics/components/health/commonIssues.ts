import type { ListingHealthItem } from '../../healthTypes';
import { MIN_IMPACT } from './visibleTodos';

export interface ShopIssue {
  code: string;
  message: string;
  count: number;
}

const LABEL: Record<string, string> = {
  image: 'Thêm ảnh rõ nét',
  description: 'Viết mô tả dài và chi tiết hơn',
  tags: 'Gắn thêm tag phù hợp',
  material: 'Ghi rõ chất liệu',
  review: 'Mời khách để lại đánh giá',
  price: 'Xem lại giá so với sản phẩm tương tự',
};

export function commonIssues(items: ListingHealthItem[], limit = 3): ShopIssue[] {
  const count = new Map<string, number>();
  for (const item of items) {
    const fields = item.todos.filter(t => (t.impact ?? 0) >= MIN_IMPACT).map(t => t.field);
    for (const field of new Set(fields)) {
      if (field && LABEL[field]) count.set(field, (count.get(field) ?? 0) + 1);
    }
  }
  return [...count]
    .map(([code, n]) => ({ code, message: LABEL[code], count: n }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
