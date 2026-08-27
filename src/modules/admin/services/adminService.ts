import api from '../../../infrastructure/api/client';
import type {
  Category,
  CategoryOption,
  CategoryStats,
  CategoryStatusFilter,
  CategoryTreePage,
  Paginated,
  Tag,
  TagSortKey,
  TagStats,
  ModerateProduct,
  ModerationAction,
  ModerationStats,
  PendingProductsResponse,
} from '../types';

/** Tham số phân trang chung. Bỏ trống thì dùng mặc định của BE. */
export interface ListParams {
  page?: number;
  limit?: number;
}

export interface CategoryListParams extends ListParams {
  search?: string;
  status?: CategoryStatusFilter;
}

export interface TagListParams extends ListParams {
  search?: string;
  sort?: TagSortKey;
}

/**
 * Phong bì phân trang phòng thủ.
 *
 * Nếu BE lỡ trả về mảng trần (endpoint cũ, proxy cache, bản deploy lệch), FE vẫn
 * dựng được một trang hợp lệ thay vì ném lỗi `undefined.map` giữa màn hình.
 */
function asPage<T>(raw: any, fallbackLimit = 20): Paginated<T> {
  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length, page: 1, limit: raw.length || fallbackLimit, totalPages: 1 };
  }
  const items: T[] = Array.isArray(raw?.items) ? raw.items : [];
  const limit = Number(raw?.limit) || fallbackLimit;
  return {
    items,
    total: Number(raw?.total) || items.length,
    page: Number(raw?.page) || 1,
    limit,
    totalPages: Number(raw?.totalPages) || 1,
  };
}

const ADMIN_BASE = '/admin';
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

// ponytail: mockup lưu path tương đối /uploads/... trên BE (8080), FE chạy 3000.
// Ghép origin tại API boundary để ảnh POD hiển thị đúng ở trang kiểm duyệt.
const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const absImg = (u: any) => (typeof u === 'string' && u && !u.startsWith('http') ? ORIGIN + u : u);
const resolveImages = (p: any) => (p && Array.isArray(p.images) ? { ...p, images: p.images.map(absImg) } : p);

export const adminService = {
  // ==================== CATEGORIES ====================

  /** Danh sách phẳng, đã cắt trang. */
  async getCategories(params: CategoryListParams = {}): Promise<Paginated<Category>> {
    const { data } = await api.get(`${ADMIN_BASE}/categories`, {
      params,
      headers: authHeader(),
    });
    return asPage<Category>(data.data);
  },

  /**
   * Cây danh mục đã cắt trang theo nút GỐC — mỗi gốc luôn kèm đủ nhánh con.
   * BE trả về cây lồng sẵn; FE không dựng lại cây từ danh sách phẳng nữa.
   */
  async getCategoryTree(params: CategoryListParams = {}): Promise<CategoryTreePage> {
    const { data } = await api.get(`${ADMIN_BASE}/categories/tree`, {
      params,
      headers: authHeader(),
    });
    const page = asPage<Category>(data.data, 15);
    return { ...page, totalNodes: Number(data.data?.totalNodes) || page.total };
  },

  /** Không cắt trang: ô chọn danh mục cha phải thấy mọi mục, kể cả ngoài trang hiện tại. */
  async getCategoryOptions(): Promise<CategoryOption[]> {
    const { data } = await api.get(`${ADMIN_BASE}/categories/options`, { headers: authHeader() });
    return Array.isArray(data.data) ? data.data : [];
  },

  async getCategoryStats(): Promise<CategoryStats> {
    const { data } = await api.get(`${ADMIN_BASE}/categories/stats`, { headers: authHeader() });
    return data.data;
  },

  async getCategory(id: string): Promise<Category> {
    const { data } = await api.get(`${ADMIN_BASE}/categories/${id}`, {
      headers: authHeader(),
    });
    return data.data;
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const { data: result } = await api.post(`${ADMIN_BASE}/categories`, data, {
      headers: authHeader(),
    });
    return result.data;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const { data: result } = await api.put(`${ADMIN_BASE}/categories/${id}`, data, {
      headers: authHeader(),
    });
    return result.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`${ADMIN_BASE}/categories/${id}`, {
      headers: authHeader(),
    });
  },

  // ==================== TAGS ====================

  /** Chỉ thẻ ĐÃ DUYỆT, đã cắt trang. Thẻ chờ duyệt có lối đọc riêng bên dưới. */
  async getTags(params: TagListParams = {}): Promise<Paginated<Tag>> {
    const { data } = await api.get(`${ADMIN_BASE}/tags`, {
      params,
      headers: authHeader(),
    });
    return asPage<Tag>(data.data);
  },

  async getPendingTags(params: ListParams = {}): Promise<Paginated<Tag>> {
    const { data } = await api.get(`${ADMIN_BASE}/tags/pending`, {
      params,
      headers: authHeader(),
    });
    return asPage<Tag>(data.data, 8);
  },

  async getTagStats(): Promise<TagStats> {
    const { data } = await api.get(`${ADMIN_BASE}/tags/stats`, { headers: authHeader() });
    return data.data;
  },

  async approveTag(id: string): Promise<Tag> {
    const { data } = await api.post(`${ADMIN_BASE}/tags/${id}/approve`, null, { headers: authHeader() });
    return data.data;
  },

  async rejectProposedTag(id: string): Promise<void> {
    await api.post(`${ADMIN_BASE}/tags/${id}/reject`, null, { headers: authHeader() });
  },

  async getTag(id: string): Promise<Tag> {
    const { data } = await api.get(`${ADMIN_BASE}/tags/${id}`, {
      headers: authHeader(),
    });
    return data.data;
  },

  async createTag(data: Partial<Tag>): Promise<Tag> {
    const { data: result } = await api.post(`${ADMIN_BASE}/tags`, data, {
      headers: authHeader(),
    });
    return result.data;
  },

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const { data: result } = await api.put(`${ADMIN_BASE}/tags/${id}`, data, {
      headers: authHeader(),
    });
    return result.data;
  },

  async deleteTag(id: string): Promise<void> {
    await api.delete(`${ADMIN_BASE}/tags/${id}`, {
      headers: authHeader(),
    });
  },

  async attachTagToProduct(tagId: string, productId: string): Promise<void> {
    await api.post(`${ADMIN_BASE}/tags/${tagId}/attach/${productId}`, null, {
      headers: authHeader(),
    });
  },

  async detachTagFromProduct(tagId: string, productId: string): Promise<void> {
    await api.post(`${ADMIN_BASE}/tags/${tagId}/detach/${productId}`, null, {
      headers: authHeader(),
    });
  },

  // ==================== MODERATION ====================

  async getProducts(status?: string, page: number = 1, limit: number = 20): Promise<PendingProductsResponse> {
    const { data } = await api.get(`${ADMIN_BASE}/moderation/products`, {
      params: { status, page, limit },
      headers: authHeader(),
    });
    const d = asPage<ModerateProduct>(data.data, limit);
    return { ...d, items: d.items.map(resolveImages) };
  },

  async unpublishProduct(productId: string, reason?: string): Promise<ModerateProduct> {
    const { data } = await api.post(
      `${ADMIN_BASE}/moderation/${productId}/unpublish`,
      { reason },
      { headers: authHeader() }
    );
    return data.data;
  },

  /**
   * `warnings` là những chỗ tin đăng chưa đạt chuẩn — sản phẩm VẪN được khôi phục.
   * Không phải lỗi, nên đừng ném; nhưng cũng đừng nuốt, admin cần biết để nhắc người bán.
   */
  async republishProduct(productId: string, notes?: string): Promise<{ product: ModerateProduct; warnings: string[] }> {
    const { data } = await api.post(
      `${ADMIN_BASE}/moderation/${productId}/republish`,
      { notes },
      { headers: authHeader() }
    );
    return { product: data.data, warnings: Array.isArray(data.warnings) ? data.warnings : [] };
  },

  async getModerationHistory(productId: string): Promise<ModerationAction[]> {
    const { data } = await api.get(`${ADMIN_BASE}/moderation/${productId}/history`, {
      headers: authHeader(),
    });
    return data.data;
  },

  async getModerationStats(): Promise<ModerationStats> {
    const { data } = await api.get(`${ADMIN_BASE}/moderation/stats`, {
      headers: authHeader(),
    });
    return data.data;
  },
};
