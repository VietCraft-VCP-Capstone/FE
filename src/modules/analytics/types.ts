/**
 * Kiểu dữ liệu của 16 tính năng Product Analytics (F26–F41).
 *
 * Dựng theo JSON THẬT mà service AI trả qua cổng BE /api/seller/analytics, không theo
 * bản nháp trong API_CONTRACT.md (hai bên lệch nhau ở vài trường). Trường nào có thể
 * null thì khai báo null: màn hình phải hiện "chưa có", không được hiện 0.
 */

export type InsightStatus = 'ok' | 'partial' | 'insufficient_data';

/** live: dữ liệu thật · seed_demo: dữ liệu mô phỏng · derived: suy ra từ cả hai. */
export type SourceMode = 'live' | 'seed_demo' | 'derived';

/**
 * Tiến độ mở khoá một tính năng đang `insufficient_data`/`partial` vì thiếu dữ liệu
 * sàn thật — "đang có bao nhiêu / cần bao nhiêu" để vẽ thanh tiến độ (plan §9.2).
 */
export interface InsightUnlock {
  requirement: string;
  current: number;
  target: number;
  unit: string;
}

export interface InsightMeta {
  status: InsightStatus;
  reason?: string;
  computed_at: string;
  model_version: string;
  scope: string;
  scope_id?: string | null;
  source: {
    database: string;
    collection: string | null;
    mode: SourceMode;
    attributed_to_live_shop: boolean;
  };
  quality: {
    sample_size: number | null;
    identity_linked: boolean;
    confidence: string;
  };
  unlock?: InsightUnlock | null;
}

/** Ai đang xem và đang xem số liệu của shop nào (BE gắn vào mọi phản hồi). */
export interface InsightViewer {
  live_shop_id: string | null;
  shop_name: string | null;
  analysed_shop_id: string | null;
  demo: boolean;
}

export interface InsightContext extends InsightViewer {
  ai_reachable: boolean;
}

export interface InsightEnvelope<T> {
  data: T | null;
  meta: InsightMeta;
  error: null;
  viewer?: InsightViewer;
}

export type TimeRange = '7d' | '30d' | '90d';
export type AlertPeriod = TimeRange | 'all';
export type ForecastWindow = '30' | '60' | '90';

/* ------------------------------------------------------------ F26 -------- */

export interface Kpi {
  value: number | null;
  pop_pct: number | null;
}

export interface ShopOverview {
  range: TimeRange;
  from: string;
  to: string;
  anchored_to_latest_data: boolean;
  compare_from: string;
  compare_to: string;
  kpi: {
    views: Kpi;
    orders: Kpi;
    revenue_vnd: Kpi;
    conversion_pct: Kpi;
  };
  /** views null nghĩa là CHƯA ĐO ĐƯỢC (sàn chưa bật theo dõi hành vi), không phải 0. */
  series: { date: string; views: number | null; orders: number; revenue_vnd: number }[];
  top_products: { listing_id: string; title: string; orders: number; revenue_vnd: number }[];
  recent_feedback: unknown[];
  /** Chỉ có ở shop thật: tổng số đơn mọi thời, để đối chiếu với số đơn trong kỳ. */
  orders_all_time?: number;
  limitation?: string | null;
}

/* ------------------------------------------------------------ F27 -------- */

export type TrendDirection = 'up' | 'down' | 'flat';

export interface ListingTimeseries {
  listing_id: string;
  title: string | null;
  category_id: string | null;
  from: string;
  to: string;
  series: { date: string; views: number; carts: number; orders: number; revenue_vnd: number }[];
  category_median: { date: string; views: number }[];
  totals: { views: number; carts: number; orders: number; revenue_vnd: number; conversion_pct: number | null };
  trend: {
    views: TrendDirection | null;
    orders: TrendDirection | null;
    views_slope_pct_per_day: number | null;
    orders_slope_pct_per_day: number | null;
    threshold_pct: number;
  } | null;
}

/* ------------------------------------------------------------ F28 -------- */

export interface ListingConversion {
  listing_id: string;
  title: string | null;
  funnel: { views: number; carts: number; orders: number };
  view_to_cart_pct: number | null;
  cart_to_order_pct: number | null;
  view_to_order_pct: number | null;
  category_avg_pct: number | null;
  category_id: string | null;
  cr_index: number | null;
  weakest_step: 'view_to_cart' | 'cart_to_order' | null;
  tips: { issue: string; action: string }[];
  window: { from: string; to: string };
}

/* ------------------------------------------------------------ F29 -------- */
/**
 * Hình dạng health-1.0 (plan v7 §4–§5): BE đọc thẳng `listing_health_scores`, không
 * còn qua AI gateway. Trục nào thiếu dữ liệu thì bị LOẠI khỏi phép tính (không phải
 * chấm 0) và liệt tên trong `axes_missing`.
 */
export type HealthStatus = 'good' | 'needs_improvement' | 'poor';

export type HealthAxis = 'conversion' | 'rating' | 'content' | 'inventory' | 'freshness';

/**
 * Một mục do engine F29 sinh ra (`vc-ai/AI-Analysic/app/core/f29/todos.py`, plan §4.3).
 *   type 'todo'    — việc tăng điểm, đã sắp theo lợi ích/công sức.
 *   type 'warning' — cần kiểm tra, KHÔNG trừ điểm (lỗ vốn, cân nặng mặc định, ...).
 */
export interface HealthTodo {
  type: 'todo' | 'warning' | string;
  message: string;
  /** Tên field trong trình soạn sản phẩm: "images" | "description" | "tags" | "stock_quantity" | ... */
  field?: string | null;
  current_value?: string | number | null;
  /** Mốc cần đạt. */
  target?: string | number | null;
  /** Số điểm tổng tăng thêm khi kéo đúng chỉ số này lên mốc (chấm lại thật, không ước chừng). */
  impact?: number | null;
}

/** Căn cứ của tiêu chí tỉ lệ mua: tiến độ lượt xem, mặt bằng so sánh, lý do chưa tính. */
export interface ConversionDetail {
  views_30d: number;
  orders_30d: number;
  min_views: number;
  conversion_rate: number | null;
  baseline_rate: number | null;
  baseline_scope: 'category' | 'platform' | null;
  reason: 'not_enough_views' | 'not_enough_peers' | 'no_orders_in_baseline' | null;
}

export interface ListingHealthDetail {
  product_id: string;
  title: string | null;
  score: number | null;
  status: HealthStatus | null;
  axes: Partial<Record<HealthAxis, number | null>>;
  axes_missing: string[];
  todos: HealthTodo[];
  conversion_detail?: ConversionDetail | null;
}

export interface ListingHealthItem {
  product_id: string;
  title: string;
  thumbnail: string | null;
  score: number | null;
  status: HealthStatus | null;
  axes_missing: string[];
  computed_at: string | null;
  top_todo?: HealthTodo | null;
  n_todos?: number;
  n_warnings?: number;
}

export interface ListingHealthList {
  items: ListingHealthItem[];
  total: number;
}

/* ------------------------------------------------------------ F30 -------- */

export interface AnomalyAlert {
  date: string;
  direction: 'spike' | 'drop';
  z: number;
  expected_vnd: number;
  actual_vnd: number;
  severity: 'low' | 'medium' | 'high' | string;
  calendar_sensitive: boolean;
  confidence: 'ok' | 'calendar_sensitive' | 'limited_few_cycles' | 'unreliable_high_rate' | string;
}

export interface AnomalyAlerts {
  shop_id: string;
  period: AlertPeriod;
  alerts: AnomalyAlert[];
  total: number;
  shop_was_analysed: boolean;
  threshold: { z: number; why: string };
  limitation: string | null;
}

/* ------------------------------------------------------------ F31 -------- */

export interface CategoryRevenue {
  range: TimeRange;
  from: string;
  to: string;
  by_product_type: {
    product_type_id: string;
    name_vi: string;
    revenue_vnd: number;
    orders: number;
    units: number;
    share_pct: number;
  }[];
  total_revenue_vnd: number;
  /** dow: 1 = Thứ Hai … 7 = Chủ Nhật, giờ Việt Nam (BR-185). */
  heatmap: { dow: number; hour: number; orders: number; revenue_vnd: number }[];
  heatmap_tz: string;
  peak_window: { dow: number; dow_vi: string; hour: number; orders: number; note: string } | null;
  heatmap_window: string;
  limitation: string | null;
}

/* ------------------------------------------------------------ F32 -------- */

export interface Competitors {
  category_id: string;
  available_categories: string[];
  my_listings: {
    listing_id: string;
    title: string;
    price_vnd: number;
    est_sales_90d: number;
    rating_shrunk: number | null;
    /** Với shop thật đây là PHÂN VỊ GIÁ, không phải hạng doanh số. Xem `note`. */
    rank_in_cat: number;
    n_in_cat: number;
    product_type_id?: string | null;
    type_source?: TypeSource;
  }[];
  competitors: {
    rank: number;
    listing_id: string;
    shop_name: string;
    title: string;
    price_vnd: number;
    est_sales_90d: number;
    rating_shrunk: number | null;
    n_reviews: number;
    favorite_count: number;
  }[];
  my_position: {
    price_percentile: number | null;
    rating_percentile: number | null;
    my_avg_price_vnd: number | null;
    my_avg_rating: number | null;
  };
  note?: string;
}

/* ------------------------------------------------------------ F33 -------- */

export interface ShopComparison {
  segment: string;
  segment_reason: string;
  axes: string[];
  axes_vi: string[];
  normalization: string;
  me: number[];
  me_raw: Record<string, number | null>;
  competitors: { shop_id: string; shop_name: string; values: number[]; est_revenue_90d_vnd: number }[];
  shops_in_segment: number;
}

/* ------------------------------------------------------------ F34 -------- */

export interface TagGap {
  category_id: string;
  available_categories: string[];
  competitors_scanned: number;
  my_tags: string[];
  missing_tags: {
    tag_id: string;
    name: string;
    used_by_competitors: number;
    competitor_share_pct: number;
    category_share_pct: number;
    lift: number;
    estimated_traffic_gain: { low_pct: number; high_pct: number; basis: string };
  }[];
  signal: {
    has_signal: boolean;
    max_lift: number | null;
    tags_tested: number;
    strong_count: number;
    weak_count: number;
    note: string;
  };
  note: string;
}

/* ------------------------------------------------------------ F35 -------- */

export type PriceBand = 'far_below' | 'below' | 'competitive' | 'premium' | 'far_above';

/** Mã loại phôi đến từ đâu. Máy đoán thì độ tin cậy thấp hơn người bán tự chọn. */
export type TypeSource = 'seller' | 'vi' | 'en' | 'handmade' | 'unknown' | 'seed';

/** Mặt bằng so sánh lấy từ đâu. */
export type PriceBasisKind = 'reference_catalog' | 'live_category' | 'seed_market';

/** Một sản phẩm thật của shop, dùng cho bộ chọn ở trang giá. */
export interface MyProduct {
  product_id: string;
  title: string;
  price_vnd: number | null;
  product_type_id: string | null;
  type_source: TypeSource;
  /** Tên sản phẩm có dấu hiệu hàng thủ công: mặt bằng POD chỉ để tham khảo. */
  handmade_hint: boolean;
}

export interface PricingAnalysis {
  product_type_id: string;
  available_product_types: string[];
  n_listings: number;
  basis: string;
  distribution: { min: number; max: number; p10: number; p25: number; p50: number; p75: number; p90: number };
  my_price: number | null;
  percentile: number | null;
  band: PriceBand | null;
  suggested_range: { low: number; high: number; basis: string; caveat: string } | null;
  /* Các trường dưới đây chỉ có khi phân tích shop THẬT trên sàn. */
  my_products?: MyProduct[];
  selected_product_id?: string | null;
  basis_kind?: PriceBasisKind;
  type_source?: TypeSource;
  type_source_note?: string;
  handmade_hint?: boolean;
  /** true khi chưa chọn sản phẩm nào, nên chưa có phán xét về giá. */
  needs_product_pick?: boolean;
  limitation?: string | null;
}

/* ------------------------------------------------------------ F36 -------- */

export interface CompetitorTracking {
  tracked: { shop_id: string; shop_name: string | null; added_at: string | null; listings_total: number }[];
  slots_used: number;
  slots_limit: number;
  alerts: {
    shop_id: string;
    shop_name: string | null;
    listing_id: string;
    title: string | null;
    detected_at: string | null;
    in_my_niche: boolean;
    matched_tags: string[];
    est_sales_90d: number | null;
  }[];
  alerts_total: number;
  my_niche_tags: string[];
  limitation: string | null;
}

/* ------------------------------------------------------------ F37 -------- */

export interface RevenueForecast {
  scope: 'shop' | string;
  target_id: string;
  horizon_days: number;
  model: string;
  points: { date: string; yhat: number; lo95: number; hi95: number }[];
  total_forecast_vnd: number;
  validation: {
    metric: string;
    value: number | null;
    baseline: number | null;
    beats_baseline: boolean | null;
    holdout_days: number;
    note: string;
  };
  model_selection: {
    chosen: string;
    seasonal_naive_mase: number | null;
    arima_mase: number | null;
    lstm_mase: number | null;
    why: string;
  };
  limitation: string | null;
}

/* ------------------------------------------------------------ F38 -------- */

export interface SeasonalEvent {
  name: string;
  peak_week_of_year: number;
  amplitude: number;
  launch_window: { peak_week: string; peak_date: string; start: string; end: string; basis: string };
}

export interface SeasonalForecast {
  keyword: string;
  tag_ids: string[];
  decomposition: { trend: number[]; seasonal: number[]; residual: number[]; window: string };
  amplitude: number;
  n_points: number;
  events: SeasonalEvent[];
  flat_keywords: string[];
  method: string;
  limitation: string | null;
}

/* ------------------------------------------------------------ F39 -------- */

export type NicheQuadrant = 'opportunity' | 'crowded' | 'niche_quiet' | string;

export interface Niches {
  niches: {
    rank: number;
    keyword: string;
    tag_id: string;
    demand_pct: number;
    /** null ở shop thật: sàn chưa đủ listing thật gắn tag để so cung — xem meta.unlock. */
    supply_pct: number | null;
    gap_score: number | null;
    n_listings: number | null;
    demand_index: number;
    trend: TrendDirection | 'rising' | 'falling' | string;
    growth_pct: number | null;
    quadrant: NicheQuadrant;
    sparkline_7d: number[];
    /** true khi phần CUNG bị che vì chưa đủ listing thật (shop thật, xem meta.unlock). */
    supply_insufficient?: boolean;
  }[];
  total_niches: number;
  banned_filtered: number;
  banned_list_size: number;
  limitation: string | null;
}

/* ------------------------------------------------------------ F40 -------- */

export interface TrendRadar {
  week: string;
  top_tags: {
    rank: number;
    tag_id: string;
    name_vi: string;
    growth_pct: number;
    momentum: number;
    demand_index: number;
    supply_n_listings: number;
    trend: string;
    searches_per_week: number | null;
  }[];
  radar: { axes: string[]; values: number[]; values_raw: number[]; scale: string };
  limitation: string | null;
}

/* ------------------------------------------------------------ F41 -------- */

export interface Recommendations {
  shop_id: string;
  scope: 'shop' | 'platform';
  personalised: boolean;
  recommendations: {
    priority: number;
    /** scale: đẩy mạnh loại đang bán tốt · expand: mở rộng sang tag · explore: shop mới, gợi ý chung. */
    action: 'scale' | 'expand' | 'explore' | string;
    target: { type: 'product_type' | 'tag' | 'keyword' | string; id: string; name_vi?: string; keyword?: string; tag_id?: string };
    why: string[];
    expected: string;
    confidence: 'low' | 'medium' | 'high' | string;
  }[];
  /* Ba trường dưới chỉ có khi shop đã có lịch sử (scope 'shop'). Shop mới nhận gợi ý
     chung toàn sàn (scope 'platform') và service không trả chúng. */
  excluded_product_types?: string[];
  exclusion_reason?: string;
  my_listings_analysed?: number;
  validated: boolean;
  validation_note: string;
}
