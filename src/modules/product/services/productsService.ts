import api, { isLoggedIn } from '../../../infrastructure/api/interceptors';
import {
  ProductItem,
  ProductFormData,
  ProductFilterState,
  PaginatedProductsResult,
  SearchFilterState,
  SuggestResult
} from '../types/product';
import { invalidateInsights } from '../../analytics/hooks/useInsight';
import { getSessionId } from '../../buyer/services/eventService';

export interface VideoAdQuota {
  enabled: boolean;
  durationSec: number;
  used: number;
  limit: number;
  remaining: number;
}

export interface VideoAdJobResult {
  jobId: string;
  status: 'pending' | 'done' | 'failed';
  videoUrl?: string;
  error?: string;
  quota?: VideoAdQuota;
}

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
export const absImg = (u: any) => (typeof u === 'string' && u.startsWith('/') ? ORIGIN + u : u);
const resolveImages = (p: any) =>
  p && Array.isArray(p.images)
    ? { ...p, images: p.images.map(absImg), thumbnail: absImg(p.thumbnail) }
    : p;

const toPaginated = (data: any): PaginatedProductsResult => {
  if (data && Array.isArray(data.items)) {
    return { ...data, items: data.items.map(resolveImages) };
  }
  if (Array.isArray(data)) {
    return {
      items: data.map(resolveImages),
      total: data.length,
      page: 1,
      limit: data.length || 6,
      totalPages: 1,
    };
  }
  return { items: [], total: 0, page: 1, limit: 6, totalPages: 1 };
};

/** Giá tốt với mã — BE tính bằng đúng công thức thanh toán (có trần giảm tối đa). */
export interface ProductDeal {
  productId: string;
  couponId: string;
  couponCode: string;
  couponTitle: string;
  badge: 'FLASH_SALE' | 'VOUCHER';
  basePrice: number;
  finalPrice: number;
  savings: number;
  label: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number;
  minOrder: number;
}

/**
 * Số tiền một mã giảm cho tiền hàng — bản sao đúng của calcCouponDiscount ở BE (promotion/coupon-math.ts),
 * để giá hiển thị theo phân loại khách chọn khớp số tiền khi thanh toán.
 */
export function couponDiscount(type: string, value: number, maxDiscount: number, subtotal: number): number {
  const base = Math.max(0, subtotal);
  if (type === 'FREE_SHIPPING') return 0;
  const isPercent = type === 'PERCENTAGE' || ((type === 'FLASH_SALE' || type === 'BUNDLE') && value <= 100);
  let raw = isPercent ? base * (value / 100) : value;
  if (isPercent && maxDiscount > 0) raw = Math.min(raw, maxDiscount);
  return Math.max(0, Math.min(Math.round(raw), base));
}

export interface HomeStats {
  totalProducts: number;
  newThisWeek: number;
}

export interface FeaturedCategory {
  _id: string;
  name: string;
  slug: string;
  product_count: number;
  cover_image: string | null;
}

export interface MockupColorPreview {
  color: string;
  color_hex?: string;
  images: string[];
}

export interface PreviewMockupResult {
  images: string[];
  byColor: MockupColorPreview[];
}

export const productsService = {
  getAll: async (filter?: Partial<ProductFilterState>): Promise<PaginatedProductsResult> => {
    try {
      const res = await api.get('/products', { params: filter });
      return toPaginated(res.data);
    } catch (err) {
      console.error('Error fetching products from API:', err);
      return { items: [], total: 0, page: 1, limit: 6, totalPages: 1 };
    }
  },

  /** Như `getAll` nhưng ném lỗi khi API lỗi, để trang phân biệt "mất kết nối" với "chưa có sản phẩm". */
  getAllStrict: async (filter?: Partial<ProductFilterState>): Promise<PaginatedProductsResult> => {
    const res = await api.get('/products', { params: filter });
    return toPaginated(res.data);
  },

  search: async (params?: Partial<SearchFilterState>): Promise<PaginatedProductsResult> => {
    try {
      const res = await api.get('/products/search', { params });
      return toPaginated(res.data);
    } catch (err) {
      console.error('Error searching products from API:', err);
      return { items: [], total: 0, page: 1, limit: 12, totalPages: 1 };
    }
  },

  /** Như `search` nhưng ném lỗi khi API lỗi, để trang hiện "thử lại" thay vì giả như không có sản phẩm. */
  searchStrict: async (params: Record<string, any>): Promise<PaginatedProductsResult> => {
    const res = await api.get('/products/search', { params });
    return toPaginated(res.data);
  },

  trackSearchClick: (logId: string, productId: string, position: number): void => {
    api.post('/products/search/click', { logId, productId, position }).catch(() => {});
  },

  suggest: async (q: string, signal?: AbortSignal): Promise<SuggestResult> => {
    const empty = { keywords: [], shops: [], categories: [] };
    if (!q.trim()) return empty;
    try {
      const res = await api.get('/products/suggest', { params: { q: q.trim() }, signal });
      return res.data || empty;
    } catch {
      return empty;
    }
  },

  /** Từ khoá người dùng VietCraft thật sự tìm trong 30 ngày (lịch sử tìm kiếm), không phải xu hướng thị trường. */
  getPopularSearches: async (limit = 6): Promise<string[]> => {
    try {
      const res = await api.get('/products/meta/popular-searches', { params: { limit } });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getTrendingKeywords: async (limit = 8): Promise<string[]> => {
    try {
      const res = await api.get('/products/meta/trending-keywords', { params: { limit } });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },

  getForYou: async (limit: number, recentSearches: string[] = []): Promise<any[]> => {
    try {
      const res = await api.get('/products/meta/for-you', {
        params: { limit, sessionId: getSessionId(), q: isLoggedIn() ? [] : recentSearches.filter(Boolean).slice(0, 3) },
        paramsSerializer: { indexes: null },
      });
      return Array.isArray(res.data) ? res.data.map(resolveImages) : [];
    } catch {
      return [];
    }
  },

  getMine: async (filter?: Partial<ProductFilterState>): Promise<PaginatedProductsResult> => {
    const res = await api.get('/products/mine', { params: filter });
    return toPaginated(res.data);
  },

  getFeaturedShops: async (): Promise<any[]> => {
    try {
      const res = await api.get('/products/featured-shops');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      return [];
    }
  },

  /** Sản phẩm đang có giá tốt với mã, xếp theo % tiết kiệm; phân trang ở server. Ném lỗi khi API lỗi. */
  getDeals: async (page = 1, limit = 20): Promise<PaginatedProductsResult & { items: Array<ProductItem & { deal: ProductDeal }> }> => {
    const res = await api.get('/products/deals', { params: { page, limit } });
    return toPaginated(res.data) as any;
  },

  /** Giá tốt cho một nhóm sản phẩm đang hiển thị; lỗi thì coi như không có giá tốt (thẻ vẫn hiện giá gốc). */
  lookupDeals: async (ids: string[]): Promise<Record<string, ProductDeal>> => {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return {};
    try {
      const res = await api.get('/products/deals/lookup', { params: { ids: unique.slice(0, 100).join(',') } });
      return res.data && typeof res.data === 'object' ? res.data : {};
    } catch {
      return {};
    }
  },

  getHomeStats: async (): Promise<HomeStats> => {
    const res = await api.get('/products/meta/home-stats');
    return { totalProducts: Number(res.data?.totalProducts) || 0, newThisWeek: Number(res.data?.newThisWeek) || 0 };
  },

  /** Danh mục nổi bật (theo số sản phẩm đang bán thật), kèm ảnh bìa. Ném lỗi để trang tự hiện trạng thái lỗi. */
  getFeaturedCategories: async (limit = 6): Promise<FeaturedCategory[]> => {
    const res = await api.get('/products/meta/featured-categories', { params: { limit } });
    return Array.isArray(res.data)
      ? res.data.map((c: any) => ({ ...c, cover_image: absImg(c.cover_image) || null }))
      : [];
  },

  getById: async (id: string): Promise<ProductItem | any> => {
    const res = await api.get(`/products/${id}`);
    return resolveImages(res.data);
  },

  getRelated: async (id: string): Promise<any[]> => {
    try {
      const res = await api.get(`/products/${id}/related`);
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      return items.map(resolveImages);
    } catch (err) {
      try {
        const res = await api.get('/products');
        const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        return items.filter((p: any) => p.id !== id && p._id !== id).map(resolveImages);
      } catch {
        return [];
      }
    }
  },

  create: async (productData: ProductFormData | any): Promise<ProductItem | any> => {
    const res = await api.post('/products', productData);
    invalidateInsights('');
    return resolveImages(res.data);
  },

  update: async (id: string, productData: Partial<ProductFormData> | any): Promise<ProductItem | any> => {
    const res = await api.put(`/products/${id}`, productData);
    invalidateInsights('');
    return resolveImages(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
    invalidateInsights('');
  },

  batchDelete: async (ids: string[]): Promise<void> => {
    await api.post('/products/batch-delete', { ids });
    invalidateInsights('');
  },

  updateStatus: async (ids: string[], status: ProductItem['status']): Promise<void> => {
    await api.patch('/products/batch-status', { ids, status });
    invalidateInsights('');
  },

  getCategories: async () => {
    const res = await api.get('/products/meta/categories');
    return res.data;
  },

  /** Có `categoryId` thì mỗi thẻ kèm `related_count` (số SP cùng nhóm danh mục đang dùng). */
  getTags: async (categoryId?: string) => {
    const res = await api.get('/products/meta/tags', { params: categoryId ? { categoryId } : undefined });
    return res.data;
  },

  getBlanks: async () => {
    const res = await api.get('/products/meta/blanks');
    return res.data;
  },

  getMyDesigns: async () => {
    const res = await api.get('/designs/mine');
    return res.data;
  },

  /**
   * % hoa hồng áp cho ĐÚNG phạm vi sản phẩm đang tạo (danh mục + loại), để form hiện đúng
   * giá niêm yết mà BE sẽ lưu. Mức này khác nhau theo luật admin đặt, nên phải gọi lại mỗi
   * khi người bán đổi danh mục.
   */
  getCommissionPercent: async (categoryId?: string | null, productType?: string | null): Promise<number> => {
    const res = await api.get('/seller/settings/commission', {
      params: { categoryId: categoryId || undefined, productType: productType || undefined },
    });
    const percent = Number(res.data?.percent);
    if (!Number.isFinite(percent)) throw new Error('% hoa hồng không hợp lệ');
    return percent;
  },

  uploadDesign: async (file: File, name?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    const res = await api.post('/designs', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  deleteDesign: async (id: string) => {
    const res = await api.delete(`/designs/${id}`);
    return res.data;
  },


  previewMockup: async (
    blankId: string,
    designPlacements: any[],
    options?: { colorHex?: string; colors?: any[] }
  ): Promise<PreviewMockupResult> => {
    const res = await api.post('/products/preview-mockup', { blankId, designPlacements, ...options });
    const rawImages: string[] = Array.isArray(res.data?.images) ? res.data.images : [];
    const images = rawImages.map(absImg);
    const byColor: MockupColorPreview[] = Array.isArray(res.data?.byColor)
      ? res.data.byColor.map((c: any) => ({
          color: c.color,
          color_hex: c.color_hex,
          images: (Array.isArray(c.images) ? c.images : []).map(absImg)
        }))
      : [];
    return { images, byColor };
  },

  getVideoAdQuota: async (): Promise<VideoAdQuota> => {
    const res = await api.get('/products/video-ad/quota');
    return res.data;
  },

  /** TỐN TIỀN mỗi lần gọi thật — chỉ gọi khi người dùng bấm nút. */
  createVideoAd: async (imageUrl: string, title?: string): Promise<VideoAdJobResult> => {
    const res = await api.post('/products/video-ad', { imageUrl, title });
    return { ...res.data, videoUrl: absImg(res.data?.videoUrl) };
  },

  getVideoAdStatus: async (jobId: string): Promise<VideoAdJobResult> => {
    const res = await api.get(`/products/video-ad/${jobId}`);
    return { ...res.data, videoUrl: absImg(res.data?.videoUrl) };
  },

  resetDefaults: (): ProductItem[] => {
    return [];
  }
};

export default productsService;
