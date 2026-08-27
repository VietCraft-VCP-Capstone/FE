/**
 * Phong bì chung của mọi endpoint có phân trang.
 * BE trả đúng hình dạng này ở /admin/categories, /admin/tags và /admin/moderation/products.
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** BE dựng sẵn cây; FE không dựng lại nữa. Vắng mặt ở lối đọc phẳng. */
  children?: Category[];
}

/** Mục rút gọn cho ô chọn danh mục cha — luôn đủ mọi danh mục, không cắt trang. */
export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  is_active: boolean;
}

/**
 * Cây đã cắt trang. `total` đếm nút GỐC vì một trang là một tập cây gốc;
 * `totalNodes` đếm mọi cấp, dùng cho dòng "N danh mục".
 */
export interface CategoryTreePage extends Paginated<Category> {
  totalNodes: number;
}

export interface CategoryStats {
  total: number;
  active: number;
  hidden: number;
  roots: number;
}

export interface TagStats {
  /** Thẻ đã duyệt. Thẻ chờ duyệt đếm riêng ở `pending`. */
  total: number;
  pending: number;
  tagged: number;
  unused: number;
}

export type TagSortKey = 'name' | 'products';
export type CategoryStatusFilter = 'all' | 'active' | 'hidden';

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  color: string;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ModerateProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  shop_id: string;
  shop_name: string;
  seller_id: string;
  created_at: string;
  categories: Category[];
  tags: Tag[];
  status: 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT';
  unpublish_reason?: string;
}

export interface ModerationAction {
  id: string;
  product_id: string;
  reviewer_id: string;
  reviewer_name: string;
  action: 'approve' | 'reject' | 'unpublish' | 'republish';
  notes?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface ModerationStats {
  published: number;
  unpublished: number;
  draft: number;
  total: number;
}

/** Giữ tên cũ cho quen mắt, nhưng nay dùng chung phong bì với các endpoint khác. */
export type PendingProductsResponse = Paginated<ModerateProduct>;
