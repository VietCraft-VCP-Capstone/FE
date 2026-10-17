import type { HealthAxis, HealthStatus, HealthTodo, ListingHealthDetail } from './types';

export type HealthAxes = Partial<Record<HealthAxis, number | null>>;

export interface HealthHistoryPoint {
  date: string;
  score: number;
  status: HealthStatus | null;
  axes: HealthAxes;
}

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
  inputs: Record<PreviewLever, number | null>;
  current_inputs: Record<PreviewLever, number | null>;
  ignored: PreviewLever[];
}

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
  tags: { name: string; pending: boolean }[];
  sales: ListingSales;
}

export interface ListingSales {
  views_30d: number;
  carts_30d: number;
  orders_30d: number;
  units_30d: number;
  revenue_30d: number;
}

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
  variants: { label: string; stock: number }[];
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

export interface HealthSummaryPoint {
  date: string;
  avg_score: number;
  good: number;
  needs_improvement: number;
  poor: number;
  n: number;
}
