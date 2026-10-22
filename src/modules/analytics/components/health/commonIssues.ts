import type { ListingHealthItem } from '../../healthTypes';

export interface ShopIssue {
  code: string;
  message: string;
  count: number;
}

const LABEL: Record<string, string> = {
  image: 'Thêm ảnh rõ nét',
  description: 'Viết mô tả dài và chi tiết hơn',
  tags: 'Gắn thêm tag phù hợp',
  review: 'Mời khách để lại đánh giá',
  price: 'Xem lại giá so với sản phẩm tương tự',
};

export function commonIssues(items: ListingHealthItem[], limit = 3): ShopIssue[] {
  const count = new Map<string, number>();
  for (const item of items) {
    for (const field of new Set(item.todos.map(t => t.field))) {
      if (field && LABEL[field]) count.set(field, (count.get(field) ?? 0) + 1);
    }
  }
  return [...count]
    .map(([code, n]) => ({ code, message: LABEL[code], count: n }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
