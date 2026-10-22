import type { HealthAxis, HealthStatus, HealthTodo, ListingHealthDetail } from './types';

export type HealthAxes = Partial<Record<HealthAxis, number | null>>;

export type HealthFactorKey = HealthAxis;

export interface HealthHistoryPoint {
  date: string;
  score: number;
  status: HealthStatus | null;
  axes: HealthAxes;
}

export type PreviewLever = 'n_images' | 'description_length' | 'n_tags' | 'price';

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

export interface HealthRow {
  product_id: string;
  title: string;
  thumbnail: string | null;
  score: number | null;
  top_todo: string | null;
}

export interface HealthFactor {
  key: HealthFactorKey;
  label: string;
  weight: number;
  sub_score: number;
  points: number;
  value: number | null;
  target: number | null;
  peer_median: number | null;
  missing: boolean;
  pending?: number;
  n_good?: number;
  reference?: { price: number | null; source: 'category' | 'group' | 'tiki' | null; n: number };
}

export interface HealthItem {
  type: 'todo' | 'warning' | 'info';
  code?: string;
  field: string | null;
  message: string;
  current_value: number | string | null;
  target: number | string | null;
  impact: number;
}

export interface ListingHealth {
  product_id: string;
  title: string;
  thumbnail: string | null;
  date: string;
  score: number | null;
  status: HealthStatus | null;
  model_version: 'health-2.0';
  computed_at: string;
  axes: Record<HealthFactorKey, number>;
  axes_missing: string[];
  breakdown: HealthFactor[];
  todos: HealthItem[];
  warnings: HealthItem[];
  basis: {
    weights: Record<HealthFactorKey, number>;
    trained_on: string;
    tiki_test_auc: number | null;
    equal_auc: number | null;
  };
}

export interface HealthSummaryPoint {
  date: string;
  avg_score: number;
  good: number;
  needs_improvement: number;
  poor: number;
  n: number;
}

export interface SellChanceAdvice {
  feature: string;
  current: number | null;
  target: number | null;
  gain: number;
}

export interface SellChance {
  product_id: string;
  score: number;
  probability: number;
  peer_group: { type: 'category' | 'platform'; name: string | null; size: number };
  advice: SellChanceAdvice[];
  compare: { feature: string; value: number | null; peer_median: number | null }[];
  model: {
    version: string;
    trained_on: string;
    horizon_days: number;
    test_auc: number;
    test_auc_ci95: [number, number];
    baseline_auc: Record<string, number>;
    delta_vs_best_baseline: { vs: string; auc: number; ci95: [number, number] };
    group_lift: Record<string, number>;
  };
}
