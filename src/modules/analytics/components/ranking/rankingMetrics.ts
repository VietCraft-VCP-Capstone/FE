import { count, money } from '../../../../shared/utils/format';
import type { RankMetric, RankingItem } from '../../rankingTypes';

export interface MetricDef {
  key: RankMetric;
  label: string;
  best: string;
  column: string;
  hint: string;
  share: string | null;
  format: (v: number) => string;
}

export const METRICS: MetricDef[] = [
  { key: 'units', label: 'Bán chạy', best: 'Bán chạy nhất shop', column: 'Đã bán (30 ngày)', hint: 'Số món bán được trong 30 ngày, giống "Đã bán" trên trang sản phẩm. Đơn huỷ không tính.', share: 'số món shop bán', format: v => `${count(v)} món` },
  { key: 'revenue', label: 'Doanh thu', best: 'Doanh thu cao nhất shop', column: 'Doanh thu (30 ngày)', hint: 'Tiền bán được trong 30 ngày, đơn huỷ không tính.', share: 'doanh thu shop', format: money },
  { key: 'views', label: 'Lượt xem', best: 'Được xem nhiều nhất shop', column: 'Lượt xem (30 ngày)', hint: 'Số lần khách mở trang sản phẩm trong 30 ngày.', share: 'lượt xem của shop', format: v => `${count(v)} lượt` },
  { key: 'cart_rate', label: 'Tương tác', best: 'Tương tác tốt nhất shop', column: 'Thêm vào giỏ', hint: 'Cứ 100 người xem thì bao nhiêu người thêm vào giỏ. Cần từ 20 lượt xem mới tính.', share: null, format: v => `${v}/100 người xem` },
  { key: 'likes', label: 'Yêu thích', best: 'Được thích nhiều nhất shop', column: 'Lượt thích', hint: 'Số người đang lưu sản phẩm vào danh sách yêu thích.', share: 'lượt thích của shop', format: v => `${count(v)} lượt thích` },
];

export const metricOf = (key: string) => METRICS.find(m => m.key === key) ?? METRICS[0];

export const valueOf = (item: RankingItem, key: RankMetric): number | null => item.metrics[key];

export function ranked(items: RankingItem[], key: RankMetric): RankingItem[] {
  return [...items].sort((a, b) => (valueOf(b, key) ?? -1) - (valueOf(a, key) ?? -1));
}

export function nextLink(item: RankingItem, next: 'pricing' | 'tags' | null): { to: string; label: string } | null {
  if (next === 'pricing') return { to: `/seller/insights/pricing?productId=${item.product_id}`, label: 'Xem mặt bằng giá' };
  if (next === 'tags') return { to: `/seller/insights/tag-gap?categoryId=${encodeURIComponent(item.category)}`, label: 'Xem tag còn thiếu' };
  return null;
}
