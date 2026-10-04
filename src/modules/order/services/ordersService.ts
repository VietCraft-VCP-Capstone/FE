import api from '../../../infrastructure/api/interceptors';

export interface OrderItemResponse {
  order_item_id?: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  title?: string;
  color?: string;
  size?: string;
  image?: string;
  is_reviewed?: boolean;
  review?: {
    id?: string;
    rating?: number;
    comment?: string;
    images?: string[];
    createdAt?: string;
    updatedAt?: string;
  } | null;
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
  shopId?: string;
  shopName?: string;
  shopLogo?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  isStatusSimulation?: boolean;
  isPod?: boolean;
  orderType?: string;
  fulfillmentStatus?: string;
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
  },
  confirmDelivery: async (orderId: string): Promise<{ success: boolean; message: string; order: any }> => {
    const res = await api.post(`/orders/${encodeURIComponent(orderId)}/confirm-delivery`);
    return res.data;
  },
  simulateStatus: async (orderId: string, target: 'ORDERED' | 'SHIPPING' | 'DELIVERED'): Promise<{
    success: boolean;
    data: { order_id: string; order_code: string; order_status: string; payment_status: 'PENDING' };
  }> => {
    const res = await api.post(`/orders/${encodeURIComponent(orderId)}/status-simulation`, { target });
    return res.data;
  }
};

export default ordersService;
