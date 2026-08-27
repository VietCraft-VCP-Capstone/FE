import api from '../../../infrastructure/api/interceptors';
import { ProductItem, ProductFormData, ProductFilterState, PaginatedProductsResult } from '../types/product';

// ponytail: mockup lưu path tương đối /uploads/... trên BE (8080), FE chạy 3000.
// Ghép origin ngay tại API boundary → mọi nơi đọc p.images (bảng, drawer) hiển thị đúng.
const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
// Chỉ path gốc-tương-đối ('/uploads/...') mới cần ghép origin. Điều kiện cũ là
// `!startsWith('http')`, nên nó ghép origin vào cả 'data:image/...;base64,' và 'blob:'
// -> 'http://localhost:8080data:image/...' -> ảnh chết. Ảnh chọn từ máy ở form thêm
// sản phẩm được lưu dạng data URL, nên chúng biến mất hết ở bảng và drawer.
const absImg = (u: any) => (typeof u === 'string' && u.startsWith('/') ? ORIGIN + u : u);
const resolveImages = (p: any) =>
  p && Array.isArray(p.images)
    ? { ...p, images: p.images.map(absImg), thumbnail: absImg(p.thumbnail) }
    : p;

/** BE luôn trả {items,total,page,limit,totalPages}; chuẩn hoá phòng khi nhận mảng thuần. */
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

export const productsService = {
  /** Marketplace công khai — chỉ hàng đã PUBLISHED của mọi shop. */
  getAll: async (filter?: Partial<ProductFilterState>): Promise<PaginatedProductsResult> => {
    try {
      const res = await api.get('/products', { params: filter });
      return toPaginated(res.data);
    } catch (err) {
      console.error('Error fetching products from API:', err);
      return { items: [], total: 0, page: 1, limit: 6, totalPages: 1 };
    }
  },

  /**
   * Hàng của chính seller đang đăng nhập (BE: GET /products/mine, cần token + role seller).
   * Cố tình KHÔNG nuốt lỗi: 401/403 mà trả về danh sách rỗng thì seller sẽ tưởng mình
   * chưa có sản phẩm nào, trong khi thực ra là chưa đăng nhập / sai quyền.
   */
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
    return resolveImages(res.data);
  },

  update: async (id: string, productData: Partial<ProductFormData> | any): Promise<ProductItem | any> => {
    const res = await api.put(`/products/${id}`, productData);
    return resolveImages(res.data);
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

  // ===== Luồng POD: chọn phôi, tải design, xem trước mockup =====

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

  uploadDesign: async (file: File, name?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    const res = await api.post('/designs', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },

  previewMockup: async (blankId: string, designPlacements: any[]): Promise<string[]> => {
    const res = await api.post('/products/preview-mockup', { blankId, designPlacements });
    return (res.data.images as string[]).map(absImg);
  },

  resetDefaults: (): ProductItem[] => {
    return [];
  }
};

export default productsService;
