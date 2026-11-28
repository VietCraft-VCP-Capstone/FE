import type { ListingHealthItem } from '../../healthTypes';
import { MIN_IMPACT } from './visibleTodos';

export const URGENT = 'urgent';

export interface ShopIssue {
  code: string;
  message: string;
  count: number;
}

const LABEL: Record<string, string> = {
  image: 'Thêm ảnh cho đủ các góc',
  description: 'Viết mô tả chi tiết hơn',
  tags: 'Gắn thêm từ khoá',
  material: 'Ghi rõ chất liệu',
  price: 'Xem lại giá bán',
  review: 'Mời khách để lại đánh giá',
};

const CODE: Record<string, string> = { images: 'image', materials: 'material' };

const codeOf = (field: string) => CODE[field] ?? field;

export function issueCodes(item: ListingHealthItem): string[] {
  const rec = item.top_recommendation;
  const fields: (string | null | undefined)[] = rec
    ? [rec.field]
    : item.todos.filter(t => (t.impact ?? 0) >= MIN_IMPACT).map(t => t.field);
  const codes = fields.filter((f): f is string => Boolean(f)).map(codeOf);
  return [...new Set(codes)].filter(c => LABEL[c]);
}

const isBlocked = (item: Pick<ListingHealthItem, 'blockers'>) => (item.blockers?.length ?? 0) > 0;

export function commonIssues(items: ListingHealthItem[], limit = 3): ShopIssue[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const code of issueCodes(item)) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const fixes = [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, message: LABEL[code], count }));
  const blocked = items.filter(isBlocked).length;
  const head: ShopIssue[] = blocked ? [{ code: URGENT, message: 'Sửa lỗi chặn bán', count: blocked }] : [];
  return [...head, ...fixes].slice(0, limit);
}
