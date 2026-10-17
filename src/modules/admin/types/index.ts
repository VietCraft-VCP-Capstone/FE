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
  parent_id?: string | null | any;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  status?: 'active' | 'pending' | 'banned';
  review_status?: 'pending' | 'approved' | 'rejected' | 'banned';
  proposed_by?: { _id: string; full_name?: string; email?: string; shop_name?: string; shop_slug?: string } | null;
  rejected_at?: string | null;
  rejected_by?: { _id: string; full_name?: string; email?: string } | null;
  reject_reason?: string | null;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  is_active: boolean;
}


export interface CategoryTreePage extends Paginated<Category> {
  totalNodes: number;
}

export interface CategoryStats {
  total: number;
  active: number;
  hidden: number;
  roots: number;
  pending?: number;
  rejected?: number;
}

export interface TagStats {
  total: number;
  pending: number;
  rejected?: number;
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
  status?: 'active' | 'pending' | 'banned';
  review_status?: 'pending' | 'approved' | 'rejected' | 'banned';
  proposed_by?: { _id: string; full_name?: string; email?: string; shop_name?: string; shop_slug?: string } | null;
  rejected_at?: string | null;
  rejected_by?: { _id: string; full_name?: string; email?: string } | null;
  reject_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannedKeyword {
  _id: string;
  keyword: string;
  reason?: string;
  created_by?: { _id: string; full_name?: string; email?: string } | null;
  created_at: string;
  updated_at: string;
  is_system?: boolean;
}

export interface BannedKeywordStats {
  total: number;
  customCount: number;
  systemCount: number;
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

export type PendingProductsResponse = Paginated<ModerateProduct>;

/** Một lần admin đổi % hoa hồng sàn. */
export interface CommissionChange {
  percent: number;
  /** Mức trước đó; null với bản ghi cũ chưa có trường này. */
  previous: number | null;
  changedBy: string | null;
  changedByEmail: string | null;
  changedAt: string | null;
  /** Việc đã làm. Phạm vi để dạng id, màn hình tự ghép tên danh mục. */
  action: 'default' | 'rule-add' | 'rule-edit' | 'rule-delete';
  categoryId: string | null;
  productType: string | null;
}

/** Một luật hoa hồng kèm thông tin hiển thị. */
export interface CommissionRuleView {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  productType: string | null;
  percent: number;
  /** Số sản phẩm đang bán mà luật này là luật thắng. */
  productCount: number;
}

/**
 * Dữ liệu trang "Cấu hình lợi nhuận".
 *
 * `impact.netTotal` là tổng tiền người bán nhận trong kỳ. Hoa hồng tỉ lệ thuận với nó, nên
 * từ một con số này là chiếu ra được mức sàn thu ở bất kỳ % nào, ngay khi admin gõ.
 */
export interface CommissionOverview {
  /** Mức mặc định, áp khi không luật nào khớp. */
  percent: number;
  updatedAt: string | null;
  rules: CommissionRuleView[];
  /** Số sản phẩm đang rơi vào mức mặc định. */
  defaultProductCount: number;
  categories: { id: string; name: string; productCount: number }[];
  history: CommissionChange[];
  impact: {
    periodDays: number;
    orderCount: number;
    paidOrderCount: number;
    netTotal: number;
    feeTotal: number;
    activeProducts: number;
    activeShops: number;
  };
}

/** Các con số tiền của một kỳ, đơn vị đồng. */
export interface FinanceTotals {
  /** Số đơn ĐÃ THANH TOÁN — cơ sở của mọi con số còn lại (BR-141). */
  orders: number;
  /** Tiền hàng trước phí, chưa gồm vận chuyển (BR-115). */
  gmv: number;
  /** Hoa hồng sàn thu được — "thu nhập" của sàn. */
  commission: number;
  payout: number;
  shipping: number;
  discount: number;
}

/** Dữ liệu trang "Thống kê thu nhập" — SRS mục 3.11.4, màn Financial Commission Overview. */
export interface FinanceOverview {
  period: { days: number; from: string; to: string };
  current: FinanceTotals;
  /** Kỳ liền trước cùng độ dài, để tính biến động (BR-142). */
  previous: FinanceTotals;
  /** Một điểm mỗi ngày theo giờ VN, đã lấp ngày trống bằng 0 (BR-143). */
  daily: { date: string; gmv: number; commission: number; orders: number }[];
  topShops: { shopId: string; name: string; orders: number; gmv: number; commission: number }[];
  recent: {
    orderCode: string;
    createdAt: string;
    shopName: string;
    gmv: number;
    commission: number;
    payout: number;
    paymentStatus: string;
    orderStatus: string;
  }[];
  /** Đơn đã hoàn tiền trong kỳ — hoa hồng ở đây là mất, không phải thu. */
  refunded: { orders: number; gmv: number; commission: number };
  commissionPercent: number;
}
