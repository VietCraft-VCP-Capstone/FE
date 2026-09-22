/**
 * Kiểu dữ liệu đơn hàng phía NGƯỜI BÁN — khớp 1-1 với seller-orders.dto.ts của BE.
 *
 * Đừng nhầm với `OrderResponse` trong modules/order: đó là đơn người dùng ĐI MUA,
 * trạng thái đã bị gộp còn 5 nhãn. Người bán làm việc thẳng với trạng thái gốc trong
 * DB vì mỗi trạng thái ứng với một việc khác nhau phải làm.
 */

export type SellerOrderStatus =
  | 'ORDERED'
  | 'PENDING_DESIGN'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED';

export const SELLER_ORDER_STATUSES: SellerOrderStatus[] = [
  'ORDERED',
  'PENDING_DESIGN',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
];

export interface SellerOrderItem {
  productId: string;
  variantId: string;
  title: string;
  sku?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  /** Giá vốn phôi — dùng để tính lãi thật, không hiện cho người mua. */
  baseCost: number;
  image?: string;
  /** Có giá trị nghĩa là dòng hàng này phải in theo yêu cầu. */
  designFileUrl?: string;
}

export interface SellerOrder {
  id: string;
  orderCode: string;
  status: SellerOrderStatus;
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  fulfillmentStatus?: string;
  supplierOrderId?: string;
  printerInfo?: {
    printerId?: string;
    printerName?: string;
    supplierOrderId?: string;
    printerStatus?: string;
    dispatchedAt?: string;
    rejectionReason?: string;
  };
  canApprove?: boolean;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentMethod: 'VNPAY' | 'MOMO' | 'COD';
  createdAt: string;
  updatedAt: string;
  buyer: { id: string; name: string };
  shippingAddress: { recipientName: string; phone: string; addressDetail: string };
  shipping: { carrier?: string; trackingNumber?: string; fee: number };
  items: SellerOrderItem[];
  /** Tổng số lượng sản phẩm, không phải số dòng hàng. */
  itemCount: number;
  financials: {
    subtotal: number;
    shippingFee: number;
    discount: number;
    platformFee: number;
    payout: number;
    baseCost: number;
  };
  statusHistory: { status: SellerOrderStatus; changedAt: string; note?: string }[];
}

export type SellerOrderCounts = Record<SellerOrderStatus | 'all' | 'PENDING_APPROVAL', number>;

export interface SellerOrderList {
  items: SellerOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: SellerOrderCounts;
  revenue: { settled: number; pending: number };
}

export type SellerOrderSort = 'newest' | 'oldest' | 'highest' | 'lowest';

/**
 * Giá trị lọc trạng thái. Ngoài 6 trạng thái thật còn các nhóm:
 * 'ALL' (không lọc), 'PENDING_APPROVAL' (chờ duyệt in) và 'TODO' (mọi đơn còn chờ tay người bán).
 */
export type SellerOrderStatusFilter = SellerOrderStatus | 'ALL' | 'TODO' | 'PENDING_APPROVAL';

export interface SellerOrderFilter {
  status: SellerOrderStatusFilter;
  search: string;
  sort: SellerOrderSort;
  page: number;
  pageSize: number;
}
