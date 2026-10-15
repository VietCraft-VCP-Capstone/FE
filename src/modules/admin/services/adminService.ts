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
  CommissionOverview,
  FinanceOverview,
} from '../types';

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

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const absImg = (u: any) => (typeof u === 'string' && u && !u.startsWith('http') ? ORIGIN + u : u);
const resolveImages = (p: any) => (p && Array.isArray(p.images) ? { ...p, images: p.images.map(absImg) } : p);

export const adminService = {
  async getCategories(params: CategoryListParams = {}): Promise<Paginated<Category>> {
    const { data } = await api.get(`${ADMIN_BASE}/categories`, {
      params,
      headers: authHeader(),
    });
    return asPage<Category>(data.data);
  },

  async getCategoryTree(params: CategoryListParams = {}): Promise<CategoryTreePage> {
    const { data } = await api.get(`${ADMIN_BASE}/categories/tree`, {
      params,
      headers: authHeader(),
    });
    const page = asPage<Category>(data.data, 15);
    return { ...page, totalNodes: Number(data.data?.totalNodes) || page.total };
  },

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

  /** Mức hoa hồng đang áp dụng, lịch sử đổi, và số liệu ước lượng tác động — một lượt gọi. */
  async getCommission(): Promise<CommissionOverview> {
    const { data } = await api.get(`${ADMIN_BASE}/settings/commission`, {
      headers: authHeader(),
    });
    return data.data;
  },

  /** Số liệu thu nhập sàn trong `days` ngày gần nhất (tối đa 365 — BR-118). */
  async getFinanceOverview(days: number): Promise<FinanceOverview> {
    const { data } = await api.get(`${ADMIN_BASE}/finance/overview`, {
      params: { days },
      headers: authHeader(),
    });
    return data.data;
  },

  /** Thêm luật mới (bỏ trống `id`) hoặc sửa luật có sẵn. */
  async saveCommissionRule(rule: {
    id?: string;
    categoryId: string | null;
    productType: string | null;
    percent: number;
  }): Promise<void> {
    await api.put(`${ADMIN_BASE}/settings/commission/rules`, rule, { headers: authHeader() });
  },

  async deleteCommissionRule(id: string): Promise<void> {
    await api.delete(`${ADMIN_BASE}/settings/commission/rules/${id}`, { headers: authHeader() });
  },

  async updateCommission(percent: number): Promise<number> {
    const { data } = await api.put(
      `${ADMIN_BASE}/settings/commission`,
      { percent },
      { headers: authHeader() }
    );
    return data.data.percent;
  },
};
