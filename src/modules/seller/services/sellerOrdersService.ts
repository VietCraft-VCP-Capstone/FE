import api from '../../../infrastructure/api/interceptors';
import type {
  SellerOrder,
  SellerOrderFilter,
  SellerOrderList,
  SellerOrderStatus,
} from '../types/order';

export interface UpdateOrderStatusPayload {
  status: SellerOrderStatus;
  trackingNumber?: string;
  carrier?: 'ghn' | 'ghtk';
  note?: string;
}

export const sellerOrdersService = {
  async list(filter: Partial<SellerOrderFilter>): Promise<SellerOrderList> {
    const res = await api.get('/seller/orders', {
      params: {
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

  async updateStatus(orderCode: string, payload: UpdateOrderStatusPayload): Promise<SellerOrder> {
    const res = await api.patch(`/seller/orders/${encodeURIComponent(orderCode)}/status`, payload);
    return res.data;
  },
};

export default sellerOrdersService;
