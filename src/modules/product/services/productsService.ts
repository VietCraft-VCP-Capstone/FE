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

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const absImg = (u: any) => (typeof u === 'string' && u.startsWith('/') ? ORIGIN + u : u);
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

  search: async (params?: Partial<SearchFilterState>): Promise<PaginatedProductsResult> => {
    try {
      const res = await api.get('/products/search', { params });
      return toPaginated(res.data);
    } catch (err) {
      console.error('Error searching products from API:', err);
      return { items: [], total: 0, page: 1, limit: 12, totalPages: 1 };
    }
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

  getTags: async () => {
    const res = await api.get('/products/meta/tags');
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

  resetDefaults: (): ProductItem[] => {
    return [];
  }
};

export default productsService;
