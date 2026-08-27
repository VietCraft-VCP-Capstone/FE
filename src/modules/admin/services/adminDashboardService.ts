/**
 * Gom dữ liệu cho trang Tổng quan của quản trị viên.
 *
 * BE hiện KHÔNG có endpoint thống kê riêng cho bảng điều khiển. Trang này vì vậy
 * dựng lại số liệu từ các endpoint quản trị đã có (`/auth/users`,
 * `/admin/moderation/*`, `/admin/categories`, `/admin/tags/pending`) và tự tính
 * phần tổng hợp ở FE. Nguyên tắc: mọi con số hiển thị đều bắt nguồn từ bản ghi
 * thật — chỗ nào BE chưa cung cấp thì để trống và nói rõ, tuyệt đối không chèn số
 * mô phỏng vào màn hình quản trị.
 *
 * Từng nguồn được gọi độc lập bằng allSettled: một endpoint hỏng (hoặc 403) chỉ
 * làm mất đúng khối của nó, không làm trắng cả trang.
 */

import { authService } from '../../auth/services/authService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { adminService } from './adminService';
import type { ModerationStats } from '../types';

/** Trần `limit` của GET /admin/moderation/products (BE tự kẹp về 100). */
const PRODUCT_PAGE_SIZE = 100;
/** Tải tối đa 3 trang. Đủ cho cửa sổ 90 ngày ở quy mô hiện tại, và chặn việc
 *  một shop có hàng chục nghìn sản phẩm kéo sập trang tổng quan. */
const MAX_PRODUCT_PAGES = 3;
/** Cửa sổ rộng nhất mà giao diện cho chọn — dừng tải khi đã lùi quá mốc này. */
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
  /** Sản phẩm mới nhất đã tải (created_at giảm dần), tối đa 300 bản ghi. */
  products: AdminProductRow[];
  productsLoaded: number;
  /** Tổng sản phẩm THẬT trên hệ thống — dùng để biết mẫu đã đủ hay chưa. */
  productsTotal: number;
  stats: ModerationStats | null;
  /** Tổng số thẻ đang chờ duyệt (lấy từ `total` của endpoint, không phải độ dài trang). */
  pendingTagCount: number;
  /** Mô tả các nguồn lỗi, hiển thị nguyên văn cho quản trị viên. */
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

/** Tải sản phẩm mới nhất, dừng sớm khi đã lùi quá cửa sổ rộng nhất. */
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

    // BE sắp xếp created_at giảm dần, nên bản ghi cuối trang là cũ nhất đã tải.
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
      // Chỉ cần CON SỐ. limit=1 để BE khỏi phải trả về cả trang thẻ mà trang này
      // không hiển thị; `total` vẫn là tổng thật của cả hàng chờ.
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

/* ------------------------------------------------------------- suy diễn ---- */

/** Chuẩn hoá vai trò: BE trả 'ADMIN'/'SELLER'/'BUYER', dữ liệu cũ có thể viết thường. */
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

/**
 * Xếp hạng gian hàng theo số sản phẩm ĐÃ TẢI, không phải toàn hệ thống.
 * Nơi gọi phải nói rõ điều đó khi mẫu chưa phủ hết (productsLoaded < productsTotal).
 */
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
