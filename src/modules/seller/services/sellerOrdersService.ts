/**
 * Đơn BÁN được của gian hàng.
 *
 * Gọi vào `/seller/orders` chứ KHÔNG phải `/orders`: `/orders` lọc theo buyerId của
 * người đang gọi, nên với tài khoản seller nó trả về đơn họ đi mua. BE tự suy shop từ
 * token nên FE không bao giờ phải (và không được) gửi kèm shopId.
 */

import api from '../../../infrastructure/api/interceptors';
import type {
  SellerOrder,
  SellerOrderFilter,
  SellerOrderList,
  SellerOrderStatus,
} from '../types/order';

export interface UpdateOrderStatusPayload {
  status: SellerOrderStatus;
  /** Bắt buộc khi chuyển sang SHIPPING. */
  trackingNumber?: string;
  carrier?: 'ghn' | 'ghtk';
  note?: string;
}

export const sellerOrdersService = {
  async list(filter: Partial<SellerOrderFilter>): Promise<SellerOrderList> {
    const res = await api.get('/seller/orders', {
      params: {
        // 'ALL' là quy ước riêng của FE nên không gửi; 'TODO' thì có — BE hiểu nó là
        // nhóm ORDERED + PENDING_DESIGN + PROCESSING.
        status: filter.status && filter.status !== 'ALL' ? filter.status : undefined,
        search: filter.search?.trim() || undefined,
        sort: filter.sort,
        page: filter.page,
        pageSize: filter.pageSize,
      },
    });
    return res.data;
  },

  async getById(orderCode: string): Promise<SellerOrder> {
    const res = await api.get(`/seller/orders/${encodeURIComponent(orderCode)}`);
    return res.data;
  },

  /** BE tự chặn bước chuyển không hợp lệ và trả 400 kèm { error }. */
  async updateStatus(orderCode: string, payload: UpdateOrderStatusPayload): Promise<SellerOrder> {
    const res = await api.patch(`/seller/orders/${encodeURIComponent(orderCode)}/status`, payload);
    return res.data;
  },
};

export default sellerOrdersService;
