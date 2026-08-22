import api from '../../../infrastructure/api/interceptors';

export interface AddToCartPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  customNotes?: string;
}

const notifyCartUpdate = (cartData: any) => {
  let count = 0;
  if (cartData && Array.isArray(cartData.items)) {
    count = cartData.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
  }
  window.dispatchEvent(new CustomEvent('vietcraft-cart-updated', { detail: { count, cart: cartData } }));
};

export const cartService = {
  getCart: async () => {
    const res = await api.get('/cart');
    const data = res.data?.data || res.data;
    notifyCartUpdate(data);
    return data;
  },
  addToCart: async (payload: AddToCartPayload) => {
    const res = await api.post('/cart/items', payload);
    const data = res.data?.data || res.data;
    notifyCartUpdate(data);
    return data;
  },
  updateQuantity: async (itemId: string, quantity: number) => {
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    const data = res.data?.data || res.data;
    notifyCartUpdate(data);
    return data;
  },
  toggleSelect: async (itemId: string, isSelected: boolean) => {
    const res = await api.put(`/cart/items/${itemId}`, { isSelected });
    const data = res.data?.data || res.data;
    notifyCartUpdate(data);
    return data;
  },
  removeItem: async (itemId: string) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    const data = res.data?.data || res.data;
    notifyCartUpdate(data);
    return data;
  },
  clearCart: async () => {
    const res = await api.delete('/cart');
    const data = res.data?.data || res.data;
    notifyCartUpdate(data);
    return data;
  }
};
