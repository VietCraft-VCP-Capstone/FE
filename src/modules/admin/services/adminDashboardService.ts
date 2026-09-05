import { authService } from '../../auth/services/authService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { adminService } from './adminService';
import type { ModerationStats } from '../types';

const PRODUCT_PAGE_SIZE = 100;
const MAX_PRODUCT_PAGES = 3;
const WIDEST_WINDOW_DAYS = 90;

export interface AdminUserRow {
  _id: string;
  email?: string;
  full_name?: string;
  role?: string;
  is_locked?: boolean;
  created_at?: string;
}

export interface AdminProductRow {
  id: string;
  title?: string;
  shop_name?: string;
  seller_id?: string;
  status?: 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT';
  created_at?: string;
  images?: string[];
}

export interface AdminOverviewData {
  users: AdminUserRow[];
  products: AdminProductRow[];
  productsLoaded: number;
  productsTotal: number;
  stats: ModerationStats | null;
  pendingTagCount: number;
  failures: string[];
}

const EMPTY: AdminOverviewData = {
  users: [],
  products: [],
  productsLoaded: 0,
  productsTotal: 0,
  stats: null,
  pendingTagCount: 0,
  failures: [],
};

async function loadRecentProducts(): Promise<{ rows: AdminProductRow[]; total: number }> {
  const cutoff = Date.now() - WIDEST_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const rows: AdminProductRow[] = [];
  let total = 0;

  for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
    const res = await adminService.getProducts(undefined, page, PRODUCT_PAGE_SIZE);
    const batch = (res?.items || []) as unknown as AdminProductRow[];
    total = Number(res?.total) || total;
    rows.push(...batch);

    if (batch.length < PRODUCT_PAGE_SIZE || rows.length >= total) break;

    const oldest = batch[batch.length - 1]?.created_at;
    if (oldest && new Date(oldest).getTime() < cutoff) break;
  }

  return { rows, total };
}

export const adminDashboardService = {
  async loadOverview(): Promise<AdminOverviewData> {
    const [usersRes, productsRes, statsRes, pendingTagsRes] = await Promise.allSettled([
      authService.getUsers(),
      loadRecentProducts(),
      adminService.getModerationStats(),
      adminService.getPendingTags({ limit: 1 }),
    ]);

    const failures: string[] = [];
    const note = (label: string, r: PromiseSettledResult<unknown>) => {
      if (r.status === 'rejected') failures.push(`${label}: ${getApiErrorMessage(r.reason)}`);
    };

    note('Người dùng', usersRes);
    note('Sản phẩm', productsRes);
    note('Thống kê kiểm duyệt', statsRes);
    note('Thẻ chờ duyệt', pendingTagsRes);

    const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)
      ? (usersRes.value as AdminUserRow[])
      : EMPTY.users;

    const products = productsRes.status === 'fulfilled' ? productsRes.value.rows : EMPTY.products;
    const productsTotal = productsRes.status === 'fulfilled' ? productsRes.value.total : 0;

    return {
      users,
      products,
      productsLoaded: products.length,
      productsTotal,
      stats: statsRes.status === 'fulfilled' ? statsRes.value : null,
      pendingTagCount: pendingTagsRes.status === 'fulfilled' ? Number(pendingTagsRes.value.total) || 0 : 0,
      failures,
    };
  },
};

export function normalizeRole(role?: string): 'admin' | 'seller' | 'buyer' {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'admin';
  if (r === 'seller') return 'seller';
  return 'buyer';
}

export interface ShopActivity {
  name: string;
  total: number;
  published: number;
}

export function rankShops(products: AdminProductRow[], limit = 5): ShopActivity[] {
  const map = new Map<string, ShopActivity>();
  for (const p of products) {
    const name = p.shop_name || 'Không rõ gian hàng';
    const entry = map.get(name) || { name, total: 0, published: 0 };
    entry.total++;
    if (p.status === 'PUBLISHED') entry.published++;
    map.set(name, entry);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}
