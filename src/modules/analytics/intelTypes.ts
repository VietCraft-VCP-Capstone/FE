export type IntelAxisKey = 'image' | 'text' | 'tags' | 'market' | 'trend';
export type IntelEvidence = 'measured' | 'practice';
export type IntelDirection = 'up' | 'flat' | 'down';

export interface IntelIssue {
  code: string;
  message?: string;
}

export interface IntelAxis {
  score: number | null;
  evidence: IntelEvidence;
  metrics: Record<string, number | string | null>;
  issues: IntelIssue[];
  missing_reason?: string;
}

export interface IntelTimelinePoint {
  week_start: string;
  score: number | null;
  demand_factor: number | null;
  events: string[];
}

export interface IntelMaterial {
  declared: string[];
  detected: string[];
  required: boolean;
  missing: boolean;
}

export interface IntelKeyword {
  term: string;
  lift: number | null;
  trend: IntelDirection | null;
  in_title: boolean;
}

export type IntelTagVerdict = 'keep' | 'weak' | 'duplicate' | 'pending';

export interface IntelTag {
  tag: string;
  verdict: IntelTagVerdict;
  reason: string;
}

export interface IntelImage {
  url: string;
  metrics: Record<string, number | null>;
  issues: IntelIssue[];
  style: string | null;
  sim_title: number | null;
}

export interface IntelMarket {
  price_pct: number | null;
  neighbors: number;
  near_duplicates: number;
  median_price: number | null;
}

export interface IntelAdvice {
  axis: IntelAxisKey;
  code: string;
  message: string;
  evidence: IntelEvidence;
  effort: 1 | 2 | 3;
  impact: number | null;
}

export interface IntelModel {
  version: string;
  auc: number | null;
  auc_ci95: [number | null, number | null];
  best_baseline: { name: string; auc: number | null };
  trained_on: string;
}

export interface ListingIntel {
  score: number;
  base: number | null;
  demand_factor: number | null;
  score_timeline: IntelTimelinePoint[];
  axes: Record<IntelAxisKey, IntelAxis>;
  material: IntelMaterial;
  keywords: IntelKeyword[];
  tags: IntelTag[];
  suggested_tags: { tag: string; reason: string }[];
  images: IntelImage[];
  market: IntelMarket | null;
  advice: IntelAdvice[];
  peers: { group: string | null; size: number };
  model: IntelModel;
  title?: string;
  thumbnail?: string | null;
  product_id?: string;
  date?: string;
  capped_reason: 'no_images' | null;
}

export interface IntelListItem {
  product_id: string;
  title: string;
  thumbnail: string | null;
  score: number | null;
  axes: Record<IntelAxisKey, number | null>;
  trend_direction: IntelDirection | null;
  computed_at: string | null;
}

export interface IntelList {
  items: IntelListItem[];
  total: number;
}

export interface IntelCalendar {
  events: {
    key: string;
    name: string;
    date: string;
    prep_start: string;
    groups: string[];
    keywords: { term: string; momentum: number | null }[];
  }[];
}

export interface IntelPreviewBody {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  category: string;
  price?: number;
  image_urls: string[];
}

export type IntelDraft = Omit<IntelPreviewBody, 'image_urls'> & { images: string[] };
