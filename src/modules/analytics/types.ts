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

export type TimeRange = '7d' | '30d' | '90d' | '180d' | '365d';
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
/** health-1.0: trục thiếu dữ liệu bị loại khỏi phép tính, ghi trong axes_missing. */
export type HealthStatus = 'good' | 'needs_improvement' | 'poor';

export type HealthAxis = 'conversion' | 'rating' | 'content' | 'inventory' | 'freshness';

/** Mục do engine F29 sinh: 'todo' tăng điểm, 'warning' chỉ nhắc, không trừ điểm. */
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

/** GET /competitor-brief: việc nên làm tuần này, gom từ F32–F36. Chỉ có cho gian hàng thật. */
export interface CompetitorBrief {
  /** rules = lập theo luật; llm = mô hình ngôn ngữ viết lại, số đã đối chiếu với số liệu gốc. */
  source: 'rules' | 'llm';
  provider: string | null;
  actions: { action: string; why: string; link: string | null }[];
  facts_count: number;
  generated_at: string;
}

/** Sản phẩm của shop khác giống sản phẩm của bạn nhất (AI so nội dung, chỉ trong cùng loại hàng). */
export interface DirectRival {
  product_id: string;
  shop_id: string;
  shop_name: string | null;
  title: string | null;
  price_vnd: number | null;
  est_sales_90d: number;
  /** 0–1, độ giống nội dung. */
  similarity: number;
  /** Các từ hai sản phẩm cùng có, vd ["mèo", "cung hoàng đạo"]. */
  reasons: string[];
}

export interface Competitors {
  category_id: string;
  available_categories: string[];
  /** Chỉ có ở shop thật: mã danh mục -> tên. Danh mục của sàn không có trong bảng nhãn cứng. */
  category_names?: Record<string, string | null>;
  my_listings: {
    listing_id: string;
    title: string;
    price_vnd: number;
    est_sales_90d: number;
    rating_shrunk: number | null;
    n_reviews?: number;
    favorite_count?: number;
    /** Hạng theo số bán 90 ngày trong danh mục; hoà thì theo số đánh giá (BR-188). */
    rank_in_cat: number;
    n_in_cat: number;
    /** Chỉ có ở shop thật. */
    direct_rivals?: DirectRival[];
  }[];
  /** Shop trùng nhiều sản phẩm với bạn nhất (chỉ có ở shop thật). */
  direct_rival_shops?: { shop_id: string; shop_name: string | null; overlap: number; best_similarity: number }[];
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
    /** Chỉ có ở shop thật: mã shop để theo dõi ngay trên bảng. Dữ liệu mồi không trả trường này. */
    shop_id?: string;
  }[];
  my_position: {
    /** Phân vị so với sản phẩm của shop khác; null khi dưới 5 sản phẩm để so. */
    price_percentile: number | null;
    rating_percentile: number | null;
    my_avg_price_vnd: number | null;
    my_avg_rating: number | null;
  };
  note?: string;
}

/* ------------------------------------------------------------ F33 -------- */

/** Nhóm chiến lược: AI phân cụm (KMeans) các shop cùng danh mục, PCA để vẽ 2 chiều. */
export interface StrategicGroups {
  k: number;
  /** Độ tách nhóm, từ 0,25 là rõ. */
  silhouette: number;
  clear: boolean;
  features: string[];
  axes: { x: string; y: string | null };
  groups: { id: number; label: string; size: number; avg_price_vnd: number; avg_revenue_90d_vnd: number }[];
  points: { shop_id: string; shop_name: string | null; x: number; y: number; group: number; me: boolean }[];
  my_group: number;
  /** null khi sàn chưa có đơn để biết nhóm nào bán tốt hơn. */
  best_group: number | null;
  gaps: { feature: 'gia' | 'sao' | 'phan_hoi' | 'so_sp' | 'doanh_so'; name: string; mine: number; theirs: number }[];
  method: string;
}

export interface ShopComparison {
  segment: string;
  /** Chỉ có ở shop thật: tên danh mục của phân khúc. */
  segment_name?: string | null;
  segment_reason: string;
  axes: string[];
  axes_vi: string[];
  normalization: string;
  /** null = trục thiếu dữ liệu (ví dụ chưa đo được thời gian phản hồi), KHÔNG phải 0 điểm. */
  me: (number | null)[];
  me_raw: Record<string, number | null>;
  competitors: {
    shop_id: string;
    shop_name: string;
    values: (number | null)[];
    /** Số thật từng trục, cùng đơn vị với `me_raw`. */
    raw?: Record<string, number | null>;
  }[];
  /** Trục không có tốt/xấu (giá): 100 là đắt nhất, không phải tốt hơn. */
  neutral_axes?: string[];
  /** "reviews" khi sàn chưa có đơn nên 5 shop được chọn theo số đánh giá thay cho doanh thu. */
  ranked_by?: 'revenue' | 'reviews';
  shops_in_segment: number;
  /** Chỉ có ở shop thật. */
  strategic_groups?: StrategicGroups | null;
  strategic_groups_reason?: string | null;
  /** Trục của chính shop bạn đang thiếu dữ liệu. */
  axes_missing?: string[];
}

/* ------------------------------------------------------------ F34 -------- */

export interface TagGap {
  category_id: string;
  available_categories: string[];
  /** Chỉ có ở shop thật: mã danh mục -> tên. */
  category_names?: Record<string, string | null>;
  competitors_scanned: number;
  my_tags: string[];
  /** mã tag -> tên hiển thị, cho cả tag của shop mình. */
  tag_names?: Record<string, string>;
  /** Tag nhóm bán chạy hay dùng, kể cả tag shop mình đã có. */
  leader_tags?: { tag_id: string; used_by: number; mine: boolean }[];
  /** Chỉ có ở shop thật: AI gợi ý riêng cho từng sản phẩm (lai: sản phẩm giống + độ phổ biến cùng loại). */
  per_product?: {
    product_id: string;
    title: string | null;
    suggestions: { tag_id: string; score: number; used_by: number; better_sellers: number; popular_in_type: number }[];
  }[];
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

/** Giá của đối thủ trực tiếp (AI kNN), pha với mặt bằng cùng loại theo độ tin cậy. */
export interface AiPrice {
  suggested_vnd: number;
  low_vnd: number;
  high_vnd: number;
  confidence: 'high' | 'medium' | 'low';
  /** Tỉ trọng giá đối thủ trực tiếp trong con số đề xuất (phần còn lại là mặt bằng cùng loại). */
  rival_weight: number;
  n_neighbors: number;
  avg_similarity: number;
  rival_price_min_vnd: number;
  rival_price_max_vnd: number;
  neighbors: { product_id: string; shop_name: string | null; title: string | null; price_vnd: number; est_sales_90d: number; similarity: number }[];
  method: string;
}

export interface PricingAnalysis {
  product_type_id: string;
  available_product_types: string[];
  /** Chỉ có ở shop thật: "loại" là danh mục cấp 2 của sàn, kèm tên để hiển thị. */
  product_type_names?: Record<string, string | null>;
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
  ai_price?: AiPrice | null;
  ai_price_reason?: string | null;
}

/* ------------------------------------------------------------ F36 -------- */

/** AI chấm mức đe doạ của một sản phẩm mới của đối thủ. */
export interface Threat {
  score: number;
  level: 'high' | 'medium' | 'low';
  similarity: number;
  matched_product_id: string | null;
  matched_title: string | null;
  /** > 0: đối thủ rẻ hơn sản phẩm khớp của bạn bao nhiêu %. */
  price_gap_pct: number | null;
  shop_strength: number;
}

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
    /** Chỉ có ở shop thật: ngày đối thủ đăng sản phẩm lên sàn (ngày thật, không phải lúc soát). */
    listed_at?: string | null;
    product_id?: string | null;
    matched_category?: string | null;
    category_name?: string | null;
    /** Shop thật: danh mục lá trùng với ngách của bạn. */
    matched_type?: string | null;
    type_name?: string | null;
    threat?: Threat | null;
  }[];
  alerts_total: number;
  /** Chỉ có ở shop thật: shop đang theo dõi có tuần gần nhất bán vượt hẳn các tuần trước. */
  surging?: { shop_id: string; shop_name: string | null; last_week: number; baseline: number; ratio: number | null; z: number }[];
  my_niche_tags: string[];
  /** Chỉ có ở shop thật: slug tag -> tên hiển thị. */
  tag_names?: Record<string, string>;
  /** Chỉ có ở shop thật: lần quét gần nhất của job đêm. */
  alerts_computed_at?: string | null;
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

export interface ReadyToShipIdea {
  title: string;
  category: string;
  market_price_range: string;
  sourcing_tip: string;
  why_it_sells?: string;
  expected_profit_margin?: string;
  upsell_bundle_tip?: string;
  target_buyer?: string;
}

export interface PodBlankSuggestion {
  blank_type: string;
  title: string;
  category: string;
  suggested_theme: string;
  design_hook?: string;
  color_palette?: string;
  estimated_profit?: string;
  target_audience?: string;
  matched_blank?: {
    _id: string;
    title: string;
    category: string;
    default_image: string;
    base_cost: number;
    printer_name: string;
    is_connected: boolean;
  };
}

export interface MatchingShopProduct {
  _id: string;
  title: string;
  slug?: string;
  images?: string[];
  categories?: string[];
  product_type?: string;
  original_price?: number;
}

export interface SeasonalEvent {
  name: string;
  peak_week_of_year: number;
  amplitude: number;
  launch_window: { peak_week: string; peak_date: string; start: string; end: string; basis: string };
  ready_to_ship_ideas?: ReadyToShipIdea[];
  pod_blanks?: PodBlankSuggestion[];
  matching_shop_products?: MatchingShopProduct[];
}

export interface CampaignRadar {
  axes: string[];
  current_values: number[];
  benchmark_values: number[];
  takeaways?: string[];
  overall_score?: number;
}

export interface SeasonalCampaign {
  id: string;
  name: string;
  icon: string;
  badge: string;
  months: number[];
  peak_week: number;
  description: string;
  launch_window: { peak_week: string; peak_date: string; start: string; end: string; basis: string };
  timing: {
    status: 'active' | 'upcoming' | 'passed';
    label: string;
    badge_tone: 'good' | 'warn' | 'neutral';
    days_diff: number;
    is_current: boolean;
  };
  category_summary: string;
  search_keywords: string[];
  radar?: CampaignRadar;
}

export interface SeasonalForecast {
  keyword: string;
  tag_ids: string[];
  decomposition: { trend: number[]; seasonal: number[]; residual: number[]; window: string };
  amplitude: number;
  n_points: number;
  events: SeasonalEvent[];
  all_campaigns?: SeasonalCampaign[];
  active_campaign?: SeasonalCampaign;
  campaign_radar?: CampaignRadar;
  seller_shop_name?: string;
  seller_category?: { slug: string; name: string };
  is_live_shop?: boolean;
  ready_to_ship_ideas?: ReadyToShipIdea[];
  pod_blanks?: PodBlankSuggestion[];
  ai_model?: string;
  flat_keywords: string[];
  method: string;
  limitation: string | null;
  all_seller_blanks?: {
    _id: string;
    title: string;
    category: string;
    default_image: string;
    base_cost: number;
    printer_name?: string;
  }[];
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
