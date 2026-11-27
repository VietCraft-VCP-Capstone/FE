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
  _id: string;
  buyerId: string;
  items: OrderItemResponse[];
  totalAmount: number;
  shippingFee?: number;
  discount?: number;
  couponCode?: string | null;
  status: 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled';
  paymentGateway: 'payos' | 'cod';
  paymentMethod?: string;
  shippingProvider: 'ghn' | 'ghtk';
  shippingCode?: string;
  shopId?: string;
  shopName?: string;
  shopLogo?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  /** Thời điểm cổng thanh toán xác nhận tiền về (null nếu chưa trả hoặc đơn cũ). */
  paidAt?: string | null;
  isStatusSimulation?: boolean;
  isPod?: boolean;
  orderType?: string;
  fulfillmentStatus?: string;
  sellerApprovalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  is_reviewed?: boolean;
  shippingAddress?: {
    recipient_name: string;
    phone: string;
    address_detail: string;
  };
}

export interface CheckoutLineInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface OrderQuote {
  shopId: string | null;
  shopName: string;
  shopLogo: string | null;
  items: Array<{
    productId: string;
    variantId: string;
    title: string;
    color: string | null;
    size: string | null;
    image: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shippingFee: number;
  shipping: { zoneLabel: string; zoneType: string; pricingType: string };
  productDiscount: number;
  shippingDiscount: number;
  total: number;
  coupons: {
    product: { code: string; isPlatform: boolean; title: string | null } | null;
    shipping: { code: string; isPlatform: boolean; title: string | null } | null;
  };
  couponErrors: Partial<Record<'PRODUCT' | 'SHIPPING', string>>;
  codAllowed: boolean;
}

export interface QuotePayload {
  items: CheckoutLineInput[];
  shippingAddress?: unknown;
  couponCode?: string;
  shippingCouponCode?: string;
}

export const ordersService = {
  /** Server tính lại toàn bộ tiền đơn (giá, phí ship, mã) mà chưa giữ kho: số hiển thị = số sẽ thu. */
  quote: async (payload: QuotePayload, signal?: AbortSignal): Promise<OrderQuote> => {
    const res = await api.post('/orders/quote', payload, { signal });
    return res.data;
  },
  calculateShipping: async (payload: { shopId?: string; address?: any }): Promise<{
    shippingFee: number;
    pricingType: 'FLAT_RATE' | 'ZONE_BASED';
    zoneType: 'intraProvince' | 'intraRegion' | 'interRegion' | 'flatRate';
    zoneLabel: string;
    shopProvince: string;
    destProvince: string;
  }> => {
    const res = await api.post('/orders/calculate-shipping', payload);
    return res.data;
  },
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
  /** Nhờ BE hỏi lại payOS trạng thái thanh toán của đơn (khi webhook chưa tới). */
  syncPayosPayment: async (orderId: string): Promise<{ paymentStatus: string }> => {
    const res = await api.post('/payment/payos/sync', { orderId });
    return res.data.data;
  },
  createPayosPayment: async (orderId: string): Promise<{ checkoutUrl: string }> => {
    const res = await api.post('/payment/payos/create', { orderId });
    return res.data.data;
  },
  confirmDelivery: async (orderId: string): Promise<{ success: boolean; message: string; order: any }> => {
    const res = await api.post(`/orders/${encodeURIComponent(orderId)}/confirm-delivery`);
    return res.data;
  },
  cancelOrder: async (orderId: string, reason?: string): Promise<OrderResponse> => {
    const res = await api.post(`/orders/${encodeURIComponent(orderId)}/cancel`, { reason });
    return res.data;
  }
};

export default ordersService;
