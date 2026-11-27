import api from '../../../infrastructure/api/interceptors';
import type { HealthStatus, InsightContext, InsightEnvelope, ShopSearchResult } from '../types';
import type { ListingHealthList } from '../healthTypes';
import type { HealthDraftBody, HealthPreview, ListingHealth, PreviewInputs } from '../healthTypes';

/**
 * Gọi 16 tính năng phân tích qua cổng BE /api/seller/analytics.
 *
 * FE không bao giờ gọi thẳng service AI: BE xác thực người bán, tra đúng shop rồi mới
 * chuyển tiếp. Vì vậy không có tham số shopId nào ở đây — shop luôn lấy từ phiên đăng nhập.
 */

const BASE = '/seller/analytics';

export type QueryParams = Record<string, string | number | undefined | null>;

function clean(params?: QueryParams): Record<string, string> | undefined {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value);
  }
  return out;
}

export const analyticsApi = {
  async get<T>(path: string, params?: QueryParams, signal?: AbortSignal): Promise<InsightEnvelope<T>> {
    const res = await api.get(`${BASE}${path}`, { params: clean(params), signal });
    return res.data;
  },

  async context(signal?: AbortSignal): Promise<InsightContext> {
    const res = await api.get(`${BASE}/context`, { signal });
    return res.data.data;
  },

  /** F29 · danh sách sản phẩm thật của shop kèm điểm tối ưu sản phẩm mới nhất. */
  async listingsHealth(status?: HealthStatus, signal?: AbortSignal): Promise<InsightEnvelope<ListingHealthList>> {
    const res = await api.get(`${BASE}/listings/health`, { params: clean({ status }), signal });
    return res.data;
  },

  /** F29 · chấm thử điểm với giá trị giả định. Chỉ gửi lever người bán đã chỉnh. */
  async healthPreview(productId: string, body: PreviewInputs, signal?: AbortSignal): Promise<InsightEnvelope<HealthPreview>> {
    const res = await api.post(`${BASE}/listings/${productId}/health/preview`, body, { signal });
    return res.data;
  },

  async recordHealthAction(productId: string, body: { recommendation_id: string; action: 'open' | 'apply' | 'dismiss'; kind?: string }): Promise<void> {
    await api.post(`${BASE}/listings/${productId}/health/actions`, body);
  },

  async healthDraft(body: HealthDraftBody, signal?: AbortSignal): Promise<InsightEnvelope<ListingHealth>> {
    const res = await api.post(`${BASE}/listings/health/draft`, body, { signal });
    return res.data;
  },

  async trackCompetitor(shopId: string) {
    const res = await api.post(`${BASE}/competitor-tracking`, { shop_id: shopId });
    return res.data;
  },

  async untrackCompetitor(shopId: string) {
    const res = await api.delete(`${BASE}/competitor-tracking/${encodeURIComponent(shopId)}`);
    return res.data;
  },

  /** F36 · tìm shop trên sàn theo tên và/hoặc danh mục cấp 1 để theo dõi (shop mẫu luôn nhận danh sách rỗng). */
  async searchShops(params: { q?: string; categoryId?: string }, signal?: AbortSignal): Promise<ShopSearchResult[]> {
    const res = await api.get(`${BASE}/competitor-tracking/search`, { params, signal });
    return res.data.data;
  },

  /** Danh mục cấp 1 đang hoạt động của sàn, cho ô chọn khi tìm shop theo danh mục. */
  async trackingCategories(): Promise<{ id: string; name: string }[]> {
    const res = await api.get(`${BASE}/competitor-tracking/categories`);
    return res.data.data;
  },

  async getSmartProductSuggestion(params: {
    category_id?: string;
    category_name?: string;
    product_type?: string;
    keywords?: string;
    material?: string;
    blank_cost?: number;
    /** Biên lãi mong muốn trên giá vốn, dạng tỉ lệ (0,3 = 30%) */
    target_margin?: number;
    /** % hoa hồng sàn: AI dùng để tính giá sàn không bán lỗ và tiền lời sau phí */
    commission_percent?: number;
  }, signal?: AbortSignal) {
    const res = await api.post(`${BASE}/product/smart-suggestion`, params, { signal });
    return res.data?.data;
  },

  /** Lưu hoặc bỏ lưu ý tưởng sản phẩm theo dịp vào database gian hàng */
  async saveSeasonalIdea(ideaId: string): Promise<{ success: boolean; saved_ideas: string[] }> {
    const res = await api.post(`${BASE}/forecast/seasonal/save-idea`, { idea_id: ideaId });
    return res.data;
  },

  /** Lưu bản chỉnh sửa trực tiếp của seller cho ý tưởng mùa vụ */
  async saveSeasonalIdeaDraft(payload: {
    idea_id: string;
    title: string;
    concept: string;
    price_vnd?: number;
    tags: string[];
  }): Promise<{ success: boolean; idea_drafts: Record<string, any>; saved_ideas?: string[] }> {
    const res = await api.post(`${BASE}/forecast/seasonal/idea-draft`, payload);
    return res.data;
  },

  /** Lưu đánh giá thành quả sau dịp của seller */
  async saveSeasonalReview(payload: {
    camp_id: string;
    rating: 'good' | 'neutral' | 'poor';
    note: string;
  }): Promise<{ success: boolean; occasion_reviews: Record<string, any> }> {
    const res = await api.post(`${BASE}/forecast/seasonal/review`, payload);
    return res.data;
  },

  /** Cập nhật tiến độ checklist mốc thời gian vào database gian hàng */
  async toggleSeasonalMilestone(milestoneIdx: number, isDone: boolean, campId?: string, ideaId?: string): Promise<{ success: boolean; checked_milestones: Record<string, boolean> }> {
    const res = await api.post(`${BASE}/forecast/seasonal/milestone`, { milestone_idx: milestoneIdx, is_done: isDone, camp_id: campId, idea_id: ideaId });
    return res.data;
  },

  /** Gắn thẻ từ khóa cơ hội trực tiếp vào các sản phẩm của shop */
  async attachSeasonalTag(tag: string, productIds: string[]): Promise<{ success: boolean; modified_count: number }> {
    const res = await api.post(`${BASE}/forecast/seasonal/attach-tag`, { tag, product_ids: productIds });
    return res.data;
  },

  /** Ảnh sản phẩm (tối đa 6 data URL đã thu nhỏ, cùng sản phẩm) → tên gợi ý, danh mục, chất liệu, các màu. */
  async recognizeProductImage(imageDataUrls: string[]): Promise<ImageRecognitionResult> {
    const res = await api.post(`${BASE}/product/recognize-image`, { images: imageDataUrls.slice(0, 6) }, { timeout: 50000 });
    return res.data?.data;
  },
};

export interface ImageRecognitionResult {
  is_product: boolean;
  product_name: string;
  product_type: string;
  category: string | null;
  materials: string[];
  colors: { name: string; hex: string }[];
  brand: string | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

export interface SmartProductSuggestionResult {
  /** Kết quả AI lọc tiêu đề seller nhập: tiêu đề sạch, thuộc tính đã tách, cụm quảng cáo đã bỏ, điều nên sửa */
  input_analysis?: {
    raw_title: string;
    clean_title: string;
    pricing_query: string;
    quantity: number;
    condition: 'new' | 'used';
    attributes: Record<string, string>;
    removed: string[];
    issues: string[];
  };
  category_detected: string;
  category?: {
    resolved_id?: string;
    resolved_name?: string;
    source?: string;
    needs_confirmation?: boolean;
  };
  detected_material?: string;
  product_type: string;
  noun: string;
  suggested_titles: string[];
  pricing_insight: {
    recommended_price: number;
    recommended_markup: number;
    price_range: {
      low: number;
      median: number;
      high: number;
      premium: number;
    };
    market_sample_count: number;
    summary: string;
    method?: string;
    source_label?: string;
    confidence?: string;
    warnings?: string[];
    value_factors?: string[];
    comparables?: Array<{
      title: string;
      price: number;
      similarity?: number;
      source?: string;
      segment?: string;
    }>;
    market_signals?: string[];
    /** Có giá vốn: lãi và biên của từng mức giá, vị thế so với thị trường */
    cost_analysis?: {
      tiers: Record<'low' | 'rec' | 'high' | 'premium', { price: number; profit_vnd: number; margin_pct: number }>;
      position: 'below_p25' | 'p25_p50' | 'p50_p75' | 'above_p75' | null;
      verdict: 'ok' | 'tight' | 'uncompetitive' | 'loss' | 'no_market';
      verdict_text: string;
    } | null;
    demand_signal?: { keyword: string; momentum: number; direction: 'up' | 'down' | 'flat' } | null;
    evidence_stats?: {
      sample_size?: number;
      p25?: number;
      p50?: number;
      p75?: number;
      p90?: number;
      blank_cost?: number;
      profit?: number;
      profit_margin_pct?: number;
    };
    ai_engine_status?: {
      is_ai_live: boolean;
      engine: string;
      engine_label: string;
      pricing_method: string;
      source_label: string;
      market_sample_count: number;
      notice?: string;
    };
  };
  ai_engine_status?: {
    is_ai_live: boolean;
    engine: string;
    engine_label: string;
    pricing_method: string;
    source_label: string;
    market_sample_count: number;
    notice?: string;
  };
  trending_keywords: Array<{
    keyword: string;
    growth: string;
    demand_index: number;
    gap_score: number;
    is_hot: boolean;
    tag_id?: string;
    source?: string;
    frequency?: number;
  }>;
  suggested_tags: string[];
  seo_description: string;
}

/** Câu thông báo theo đúng bảng MSG của SRS mục 3.9; khoá là số MSG. */
export const MSG = {
  136: 'Không thể tải dữ liệu đối thủ cạnh tranh. Vui lòng thử lại.',
  137: 'Bạn chưa có sản phẩm đăng bán trong danh mục này.',
  138: 'Không thể tải dữ liệu so sánh shop. Vui lòng thử lại.',
  140: 'Không thể tải dữ liệu phân tích từ khóa. Vui lòng thử lại.',
  142: 'Không thể tải dữ liệu phân tích giá cạnh tranh. Vui lòng thử lại.',
  143: 'Bạn chỉ được theo dõi tối đa 10 shop đối thủ.',
  144: 'Shop đối thủ này đã có trong danh sách theo dõi của bạn.',
  145: 'Thêm shop đối thủ thất bại. Vui lòng thử lại.',
  146: 'Xóa shop đối thủ thất bại. Vui lòng thử lại.',
  147: 'Không thể tải danh sách shop đối thủ đang theo dõi.',
} as const;

/** Câu thông báo cho các mã lỗi riêng của khu phân tích (400 do AI trả về theo hợp đồng). */
export function analyticsErrorMessage(err: any, fallback = 'Không thực hiện được, vui lòng thử lại.'): string {
  const code = err?.response?.data?.error;
  const field = err?.response?.data?.field;
  const expected = err?.response?.data?.expected;
  if (code === 'tracking_limit_reached') return MSG[143];
  if (code === 'invalid_param' && expected === 'already_tracked') return MSG[144];
  if (code === 'invalid_param' && field === 'shop_id') return expected ? `Mã shop không hợp lệ: ${expected}.` : 'Mã shop không hợp lệ.';
  if (code === 'not_found') return 'Không tìm thấy shop này trong dữ liệu phân tích.';
  if (typeof code === 'string' && code) return fallback;
  return fallback;
}
