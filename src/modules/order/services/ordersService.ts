import api from '../../../infrastructure/api/interceptors';

export interface OrderItemResponse {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  title?: string;
  color?: string;
  size?: string;
  image?: string;
  is_reviewed?: boolean;
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
  is_reviewed?: boolean;
  shippingAddress?: {
    recipient_name: string;
    phone: string;
    address_detail: string;
  };
}

export const ordersService = {
  create: async (orderData: any): Promise<OrderResponse> => {
    const res = await api.post('/orders', orderData);
    return res.data;
  },
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
