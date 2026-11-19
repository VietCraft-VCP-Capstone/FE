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
  coverage?: HealthCoverage | null;
  blockers?: HealthBlocker[];
  top_recommendation?: HealthRecommendation | null;
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
  status: HealthStatus | null;
  coverage: HealthCoverage | null;
  blockers: HealthBlocker[];
  top_todo: string | null;
  top_field: string | null;
  issue_fields: string[];
}

export interface HealthItem {
  type: 'todo' | 'warning' | 'info';
  field: string | null;
  message: string;
  current_value?: number | string | null;
  target?: number | string | null;
  impact: number;
}

export interface ListingHealth {
  product_id: string;
  title: string;
  thumbnail: string | null;
  date: string;
  score: number | null;
  status: HealthStatus | null;
  model_version: string;
  computed_at: string;
  axes: Record<HealthFactorKey, number | null>;
  axes_missing: string[];
  todos: HealthItem[];
  warnings: HealthItem[];
  coverage?: { evaluated: number; total: number } | null;
  factors?: HealthFactorV3[];
  blockers?: HealthBlocker[];
  recommendations?: HealthRecommendation[];
  content_snapshot?: ContentSnapshot | null;
  versions?: { score: string; siglip: string | null; relevance: string; benchmark: string | null };
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
  method?: 'model' | 'cold_start';
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

export type FactorState = 'scored' | 'seller_missing' | 'not_applicable' | 'technical_failure';

export type HealthMethod = 'rule' | 'heuristic' | 'ml_unvalidated' | 'weak_supervision';

export interface HealthFactorV3 {
  key: HealthFactorKey;
  label: string;
  weight: number;
  state: FactorState;
  points: number;
  sub_score: number | null;
  method: HealthMethod;
  reason: string;
  evidence: Record<string, unknown>;
}

export interface HealthBlocker {
  field: string;
  message: string;
}

export interface HealthCoverage {
  evaluated: number;
  total: number;
}

export interface HealthRecommendation {
  id: string;
  kind: 'blocker' | 'search' | 'image' | 'info' | 'price';
  title: string;
  why: string;
  action: string;
  field: string | null;
  effort: number;
  gain_points: number;
  method: HealthMethod;
  evidence: Record<string, unknown>;
}

export interface ContentSnapshot {
  title: string;
  tags: string[];
  n_images: number;
  desc_words: number;
  has_size: boolean;
  materials: string[];
  price: number | null;
}

export interface SearchQueryInsight {
  query: string;
  searches: number;
  covered: boolean;
  actual_rank: number | null;
  match_gain: number;
}

export interface ZeroResultQuery {
  query: string;
  searches: number;
  match_gain: number;
}

export interface SearchInsights {
  days: number;
  category: string | null;
  queries: SearchQueryInsight[];
  zero_result: ZeroResultQuery[];
}

export type ImpactStatus = 'no_revision' | 'collecting' | 'preliminary' | 'complete';

export interface ImpactRevision {
  date: string;
  changed: string[];
  price_changed: boolean;
}

export interface ListingImpact {
  product_id: string;
  status: ImpactStatus;
  reason: string | null;
  window_days: number | null;
  elapsed_days: number | null;
  revision: ImpactRevision | null;
  revisions: ImpactRevision[];
  mixed_changes: boolean;
  n_controls: number;
  views_per_day: { pre: number; post: number; control_pre: number; control_post: number; did: number } | null;
  cart_rate: { pre: number | null; post: number | null; post_ci: [number, number] | null } | null;
}
