export type RankMetric = 'units' | 'revenue' | 'views' | 'cart_rate' | 'likes';

export interface Rank {
  rank: number;
  of: number;
}

export interface RankInsight {
  tone: 'good' | 'warn' | 'bad';
  title: string;
  action: string;
  field: string | null;
  next: 'pricing' | 'tags' | null;
}

export interface RankingItem {
  product_id: string;
  title: string;
  thumbnail: string | null;
  category: string;
  score: number | null;
  metrics: {
    views: number;
    carts: number;
    orders: number;
    units: number;
    revenue: number;
    likes: number;
    cart_rate: number | null;
    buy_rate: number | null;
    price: number | null;
  };
  prev: { units: number; orders: number; revenue: number; views: number; cart_rate: number | null };
  market: Record<RankMetric, Rank | null>;
  insights: RankInsight[];
}

export interface ListingRanking {
  window_days: number;
  categories: { name: string; n_mine: number; n_market: number }[];
  items: RankingItem[];
}
