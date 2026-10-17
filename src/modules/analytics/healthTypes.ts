/** Kiểu F29: lịch sử điểm và tính thử điểm. */

import type { HealthAxis, HealthStatus, HealthTodo, ListingHealthDetail } from './types';

export type HealthAxes = Partial<Record<HealthAxis, number | null>>;

/** Một ngày trong `listing_health_scores`, BE trả tăng dần theo ngày. */
export interface HealthHistoryPoint {
  date: string;
  score: number;
  status: HealthStatus | null;
  axes: HealthAxes;
}

/** Bốn chỉ số seller sửa được. Trần khớp BE `health-preview.ts` và AI `HealthPreviewBody`. */
export type PreviewLever = 'n_images' | 'description_length' | 'n_tags' | 'in_stock_ratio_pct';

export type PreviewInputs = Partial<Record<PreviewLever, number>>;

export interface HealthPreview {
  product_id: string;
  score: number | null;
  status: HealthStatus | null;
  axes: HealthAxes;
  axes_missing: string[];
  current_score: number | null;
  delta_vs_current: number | null;
  /** Giá trị đã dùng để chấm thử: lever không gửi lên thì là giá trị thật hiện tại. */
  inputs: Record<PreviewLever, number | null>;
  current_inputs: Record<PreviewLever, number | null>;
  /** Lever không áp được, vd. tồn kho với sản phẩm làm theo yêu cầu. */
  ignored: PreviewLever[];
}

/** Một dòng của `GET /listings/health`: mọi việc tăng điểm, mọi cảnh báo và tag đang gắn. */
export interface ListingHealthItem {
  product_id: string;
  title: string;
  thumbnail: string | null;
  score: number | null;
  status: HealthStatus | null;
  axes: HealthAxes;
  axes_missing: string[];
  computed_at: string | null;
  todos: HealthTodo[];
  n_todos: number;
  warnings: HealthTodo[];
  /** `pending` = tag chờ admin duyệt, chưa hiện với người mua. */
  tags: { name: string; pending: boolean }[];
  sales: ListingSales;
}

/** Số 30 ngày trên đơn thật không huỷ; 0 là số thật, không phải thiếu dữ liệu. */
export interface ListingSales {
  views_30d: number;
  orders_30d: number;
  units_30d: number;
  revenue_30d: number;
}

/** Giá trị thật đang dùng để chấm điểm (BE đọc từ sản phẩm, phân loại, tag, đánh giá). */
export interface HealthInputs {
  n_images: number;
  description_length: number;
  n_approved_tags: number;
  n_pending_tags: number;
  in_stock_ratio_pct: number | null;
  n_variants: number;
  n_variants_in_stock: number;
  days_since_content_change: number | null;
  n_reviews: number;
  avg_rating: number | null;
}

export interface ListingProductInfo {
  thumbnail: string | null;
  product_type: string | null;
  price_min: number | null;
  price_max: number | null;
  stock_total: number;
}

export interface ListingHealthDetailFull extends ListingHealthDetail {
  inputs: HealthInputs;
  product: ListingProductInfo;
  sales: ListingSales;
}

export interface ListingHealthList {
  items: ListingHealthItem[];
  total: number;
}

/** Một ngày của `GET /listings/health/summary`: điểm trung bình và số sản phẩm theo mức. */
export interface HealthSummaryPoint {
  date: string;
  avg_score: number;
  good: number;
  needs_improvement: number;
  poor: number;
  n: number;
}
