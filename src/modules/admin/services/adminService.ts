import api from '../../../infrastructure/api/client';
import type {
  Category,
  Tag,
  ModerateProduct,
  ModerationAction,
  ModerationStats,
  PendingProductsResponse,
} from '../types';

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

  async getCategories(filter?: string): Promise<Category[]> {
    const { data } = await api.get(`${ADMIN_BASE}/categories`, {
      params: filter ? { filter } : undefined,
      headers: authHeader(),
    });
    return data.data;
  },

  async getCategoryTree(): Promise<Category[]> {
    const { data } = await api.get(`${ADMIN_BASE}/categories/tree`, {
      headers: authHeader(),
    });
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

  async getTags(): Promise<Tag[]> {
    const { data } = await api.get(`${ADMIN_BASE}/tags`, {
      headers: authHeader(),
    });
    return data.data;
  },

  async getPendingTags(): Promise<Tag[]> {
    const { data } = await api.get(`${ADMIN_BASE}/tags/pending`, { headers: authHeader() });
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
    const d = data.data;
    return Array.isArray(d?.products) ? { ...d, products: d.products.map(resolveImages) } : d;
  },

  async unpublishProduct(productId: string, reason?: string): Promise<ModerateProduct> {
    const { data } = await api.post(
      `${ADMIN_BASE}/moderation/${productId}/unpublish`,
      { reason },
      { headers: authHeader() }
    );
    return data.data;
  },

  async republishProduct(productId: string, notes?: string): Promise<ModerateProduct> {
    const { data } = await api.post(
      `${ADMIN_BASE}/moderation/${productId}/republish`,
      { notes },
      { headers: authHeader() }
    );
    return data.data;
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
