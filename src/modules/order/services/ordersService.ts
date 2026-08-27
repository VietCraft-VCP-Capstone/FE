import api from '../../../infrastructure/api/interceptors';

/**
 * Shape đơn hàng BE trả về (order.service.ts -> mapDbOrderToResponse).
 * `totalAmount`/`shippingFee` do BE tính từ giá trong DB — FE PHẢI hiển thị số này,
 * không dùng lại con số tự tính ở màn thanh toán.
 */
export interface OrderItemResponse {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  title?: string;
  color?: string;
  size?: string;
  image?: string;
}

export interface OrderResponse {
  id: string;
  buyerId: string;
  items: OrderItemResponse[];
  totalAmount: number;
  shippingFee?: number;
  status: 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled';
  paymentGateway: 'vnpay' | 'momo' | 'cod';
  paymentMethod?: string;
  shippingProvider: 'ghn' | 'ghtk';
  shippingCode?: string;
  shopName?: string;
  shopLogo?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: string;
  shippingAddress?: {
    recipient_name: string;
    phone: string;
    address_detail: string;
  };
}

export const ordersService = {
  /**
   * POST /orders — BE lấy giá, phí ship và shop TỪ DB theo productId/variantId;
   * `price`, `totalAmount`, `shippingFee`, `discount` FE gửi lên đều bị bỏ qua.
   * Lỗi trả về 400 kèm { error } (hết hàng, ngừng bán, đơn nhiều shop...).
   */
  create: async (orderData: any): Promise<OrderResponse> => {
    const res = await api.post('/orders', orderData);
    return res.data;
  },
  /** GET /orders — mảng thuần OrderResponse[]. */
  getByUser: async (status?: string): Promise<OrderResponse[]> => {
    const res = await api.get('/orders', {
      params: status && status !== 'all' ? { status } : undefined
    });
    return res.data;
  },
  getById: async (orderId: string): Promise<OrderResponse> => {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  },
  triggerCallback: async (orderId: string, status: 'success' | 'fail') => {
    const res = await api.post(`/orders/callback/${orderId}`, { status });
    return res.data;
  }
};

export default ordersService;
