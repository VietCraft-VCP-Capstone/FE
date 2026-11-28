import type { HealthAxis, HealthStatus, HealthTodo } from './types';

export type HealthAxes = Partial<Record<HealthAxis, number | null>>;

export type HealthFactorKey = HealthAxis;

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

export interface HealthCheck {
  id: string;
  pillar: 'print' | 'description' | 'image' | 'duplicate';
  severity: 'block' | 'warn' | 'info' | 'pass' | 'na';
  confidence: number;
  evidence: Record<string, unknown>;
  action: string;
  model_version: string;
  mode: 'live' | 'hint' | 'shadow';
}

export interface AiFinding {
  model: string;
  title: string;
  finding: string;
  status: 'pass' | 'warn' | 'info' | 'na';
  confidence: number | null;
  trained_on: string;
  metric: string;
}

export type FeedbackVerdict = 'ai_wrong' | 'ai_right';

export type ImageVerdict = 'ok' | 'mismatch' | 'duplicate' | 'not_learned' | 'unanalyzed';

export interface ImageAi {
  verdict: ImageVerdict;
  cos: number | null;
  counted: boolean;
}

export interface ImageEvidence {
  url: string;
  ai?: ImageAi;
}

export interface HealthFeedback {
  image_url: string;
  verdict: FeedbackVerdict;
  updated_at?: string;
}

export interface ScoreChange {
  from: number;
  to: number;
  reason: 'content' | 'market';
  factor: string | null;
  text: string;
}

export interface ListingHealth {
  ai?: AiFinding[];
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
  checks?: HealthCheck[];
  change?: ScoreChange | null;
  feedback?: HealthFeedback[];
  confidence?: { level: 'Cao' | 'Vừa' | 'Thấp'; factors: string; peers: number } | null;
  content_snapshot?: ContentSnapshot | null;
  versions?: { score: string; siglip: string | null; relevance: string; benchmark: string | null };
}

export type FactorState = 'scored' | 'seller_missing' | 'not_applicable' | 'technical_failure';

export type HealthMethod = 'rule' | 'learned' | 'heuristic' | 'ml_unvalidated' | 'weak_supervision';

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

export interface HealthDraftBody {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  category: string;
  price?: number;
  image_urls: string[];
}

export type HealthDraft = Omit<HealthDraftBody, 'image_urls'> & { images: string[] };
