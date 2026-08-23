import api from '../../../infrastructure/api/interceptors';
import { ProductItem, ProductFormData, ProductFilterState, PaginatedProductsResult } from '../types/product';

export const productsService = {
  getAll: async (filter?: Partial<ProductFilterState>): Promise<PaginatedProductsResult> => {
    try {
      const res = await api.get('/products', { params: filter });
      if (res.data && Array.isArray(res.data.items)) {
        return res.data;
      }
      if (Array.isArray(res.data)) {
        return {
          items: res.data,
          total: res.data.length,
          page: 1,
          limit: res.data.length || 6,
          totalPages: 1,
        };
      }
      return { items: [], total: 0, page: 1, limit: 6, totalPages: 1 };
    } catch (err) {
      console.error('Error fetching products from API:', err);
      return { items: [], total: 0, page: 1, limit: 6, totalPages: 1 };
    }
  },

  getFeaturedShops: async () => {
    try {
      const res = await api.get('/products/featured-shops');
      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      return [];
    }
  },

  getById: async (id: string): Promise<ProductItem | undefined> => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  create: async (productData: ProductFormData): Promise<ProductItem> => {
    const res = await api.post('/products', productData);
    return res.data;
  },

  update: async (id: string, productData: Partial<ProductFormData>): Promise<ProductItem> => {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  batchDelete: async (ids: string[]): Promise<void> => {
    await api.post('/products/batch-delete', { ids });
  },

  updateStatus: async (ids: string[], status: ProductItem['status']): Promise<void> => {
    await api.patch('/products/batch-status', { ids, status });
  },

  resetDefaults: (): ProductItem[] => {
    return [];
  }
};
export default productsService;
