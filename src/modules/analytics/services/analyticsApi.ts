import api from '../../../infrastructure/api/interceptors';
import type { HealthStatus, InsightContext, InsightEnvelope } from '../types';
import type { ListingHealthList } from '../healthTypes';
import type { HealthPreview, PreviewInputs } from '../healthTypes';
import type { IntelPreviewBody, ListingIntel } from '../intelTypes';
import type { QualityAuditData } from '../qualityTypes';

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

  /** F29 · danh sách sản phẩm thật của shop kèm điểm sức khoẻ mới nhất. */
  async listingsHealth(status?: HealthStatus, signal?: AbortSignal): Promise<InsightEnvelope<ListingHealthList>> {
    const res = await api.get(`${BASE}/listings/health`, { params: clean({ status }), signal });
    return res.data;
  },

  /** F29 · chấm thử điểm với giá trị giả định. Chỉ gửi lever người bán đã chỉnh. */
  async healthPreview(productId: string, body: PreviewInputs, signal?: AbortSignal): Promise<InsightEnvelope<HealthPreview>> {
    const res = await api.post(`${BASE}/listings/${productId}/health/preview`, body, { signal });
    return res.data;
  },

  async intelPreview(body: IntelPreviewBody, signal?: AbortSignal): Promise<InsightEnvelope<ListingIntel>> {
    const res = await api.post(`${BASE}/listings/intel/preview`, body, { signal });
    return res.data;
  },

  async listingQuality(productId: string, signal?: AbortSignal): Promise<InsightEnvelope<QualityAuditData>> {
    const res = await api.get(`${BASE}/listings/${productId}/quality`, { signal });
    return res.data;
  },

  async listingQualityAudit(productId: string, force = false, signal?: AbortSignal): Promise<InsightEnvelope<QualityAuditData>> {
    const res = await api.post(`${BASE}/listings/${productId}/quality/audit`, { force }, { signal });
    return res.data;
  },

  async listingQualityRecheck(productId: string, signal?: AbortSignal): Promise<InsightEnvelope<QualityAuditData>> {
    const res = await api.post(`${BASE}/listings/${productId}/quality/recheck`, {}, { signal });
    return res.data;
  },

  async trackCompetitor(shopId: string) {
    const res = await api.post(`${BASE}/competitor-tracking`, { shop_id: shopId });
    return res.data;
  },

  async untrackCompetitor(shopId: string) {
    const res = await api.delete(`${BASE}/competitor-tracking`, { data: { shop_id: shopId } });
    return res.data;
  },

  async getSmartProductSuggestion(params: {
    category_id?: string;
    category_name?: string;
    product_type?: string;
    keywords?: string;
    blank_cost?: number;
  }, signal?: AbortSignal) {
    const res = await api.post(`${BASE}/product/smart-suggestion`, params, { signal });
    return res.data?.data;
  },
};

export interface SmartProductSuggestionResult {
  category_detected: string;
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
  };
  trending_keywords: Array<{
    keyword: string;
    growth: string;
    demand_index: number;
    gap_score: number;
    is_hot: boolean;
    tag_id?: string;
  }>;
  suggested_tags: string[];
  seo_description: string;
}

/** Câu thông báo cho các mã lỗi riêng của khu phân tích (400 do AI trả về theo hợp đồng). */
export function analyticsErrorMessage(err: any, fallback = 'Không thực hiện được, vui lòng thử lại.'): string {
  const code = err?.response?.data?.error;
  const field = err?.response?.data?.field;
  const expected = err?.response?.data?.expected;
  if (code === 'tracking_limit_reached') return `Đã theo dõi tối đa ${err.response.data.limit ?? 10} shop. Bỏ bớt một shop để thêm shop mới.`;
  if (code === 'invalid_param' && expected === 'already_tracked') return 'Shop này đã có trong danh sách theo dõi.';
  if (code === 'invalid_param' && field === 'shop_id') return expected ? `Mã shop không hợp lệ: ${expected}.` : 'Mã shop không hợp lệ.';
  if (code === 'not_found') return 'Không tìm thấy shop này trong dữ liệu phân tích.';
  if (typeof code === 'string' && code) return fallback;
  return fallback;
}
