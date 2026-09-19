import api, { isLoggedIn, getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { productsService } from '../../product/services/productsService';

export interface AddToCartPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  customNotes?: string;
}

export interface GuestCartEntry {
  productId: string;
  variantId?: string;
  quantity: number;
  customNotes?: string;
  isSelected?: boolean;
}

export interface MergeGuestCartResult {
  merged: number;
  skipped: Array<{ productId: string; reason: string }>;
}

export const GUEST_CART_KEY = 'vietcraft-guest-cart';

const notifyCartUpdate = (cartData: any) => {
  let count = 0;
  if (cartData && Array.isArray(cartData.items)) {
    count = cartData.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
  }
  window.dispatchEvent(new CustomEvent('vietcraft-cart-updated', { detail: { count, cart: cartData } }));
};

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const absImg = (u: any) => {
  if (typeof u !== 'string' || !u || u.startsWith('#')) return undefined;
  return !u.startsWith('http') && !u.startsWith('data:') ? ORIGIN + u : u;
};

const entryKey = (productId: string, variantId?: string) => `${productId}::${variantId || ''}`;

const guestItemId = (entry: GuestCartEntry) =>
  `guest-${entry.productId}-${entry.variantId || 'default'}`;

const readGuestCart = (): GuestCartEntry[] => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e: any) => e && typeof e.productId === 'string' && e.productId)
      .map((e: any) => ({
        productId: String(e.productId),
        variantId: e.variantId ? String(e.variantId) : undefined,
        quantity: Math.max(1, Number(e.quantity) || 1),
        customNotes: e.customNotes ? String(e.customNotes) : undefined,
        isSelected: e.isSelected === undefined ? true : Boolean(e.isSelected),
      }));
  } catch {
    return [];
  }
};

const writeGuestCart = (entries: GuestCartEntry[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
  } catch { }
};

const clearGuestStorage = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch { }
};

const buildGuestItem = (entry: GuestCartEntry, product: any) => {
  const variants: any[] = Array.isArray(product?.variants) ? product.variants : [];
  const variant = entry.variantId 
    ? variants.find((v: any) => String(v.id || v._id) === entry.variantId) 
    : (variants[0] || undefined);

  return {
    _id: guestItemId(entry),
    product_id: {
      _id: product?.id || product?._id || entry.productId,
      title: product?.title,
      images: Array.isArray(product?.images) ? product.images : [],
      thumbnail: product?.thumbnail,
      retail_price: product?.price || variant?.price || variant?.retail_price,
      price: product?.price || variant?.price || variant?.retail_price,
      shop_id: product?.shopInfo
        ? {
          _id: product.shopInfo.id,
          shop_name: product.shopInfo.name,
          logo: product.shopInfo.logo,
        }
        : undefined,
    },
    variant_id: variant
      ? {
        _id: variant.id || variant._id,
        name: variant.name,
        color: variant.color,
        size: variant.size,
        material: variant.material,
        retail_price: variant.price || variant.retail_price,
        price: variant.price || variant.retail_price,
        stock_quantity: variant.stock || variant.stock_quantity,
        mockup_image: absImg(variant.mockupImage || variant.mockup_image),
      }
      : undefined,
    quantity: entry.quantity,
    is_selected: entry.isSelected === undefined ? true : entry.isSelected,
    custom_notes: entry.customNotes,
    updated_at: new Date().toISOString(),
  };
};

const loadGuestCart = async () => {
  const entries = readGuestCart();
  if (entries.length === 0) return { _id: null, items: [], is_guest: true };

  const hydrated = await Promise.all(
    entries.map(async (entry) => {
      try {
        const product = await productsService.getById(entry.productId);
        if (!product) return null;
        return { entry, item: buildGuestItem(entry, product) };
      } catch {
        return null;
      }
    })
  );

  const ok = hydrated.filter(Boolean) as Array<{ entry: GuestCartEntry; item: any }>;
  if (ok.length !== entries.length) writeGuestCart(ok.map((r) => r.entry));

  return { _id: null, items: ok.map((r) => r.item), is_guest: true };
};

const mutateGuestCart = async (mutate: (entries: GuestCartEntry[]) => GuestCartEntry[]) => {
  writeGuestCart(mutate(readGuestCart()));
  const cart = await loadGuestCart();
  notifyCartUpdate(cart);
  return cart;
};

const matchesGuestItem = (entry: GuestCartEntry, itemId: string) =>
  guestItemId(entry) === itemId || entry.productId === itemId;

const LEGACY_CART_KEY = 'vietcraft_cart';

let legacyMigration: Promise<string[]> | null = null;

const runLegacyMigration = async (): Promise<string[]> => {
  const raw = localStorage.getItem(LEGACY_CART_KEY);
  if (!raw) return [];

  let parsed: any[] = [];
  try {
    const value = JSON.parse(raw);
    parsed = Array.isArray(value) ? value : [];
  } catch {
    localStorage.removeItem(LEGACY_CART_KEY);
    return [];
  }

  const failures: string[] = [];
  for (const item of parsed) {
    const productId = item?.productId || item?.id;
    if (!productId) continue;
    try {
      await cartService.addToCart({
        productId: String(productId),
        variantId: item.variantId && item.variantId !== 'default' ? String(item.variantId) : undefined,
        quantity: Math.max(1, Number(item.quantity) || 1),
      });
    } catch (err) {
      failures.push(getApiErrorMessage(err));
    }
  }

  localStorage.removeItem(LEGACY_CART_KEY);
  return failures;
};

const migrateLegacyCart = (): Promise<string[]> => {
  if (!legacyMigration) {
    legacyMigration = runLegacyMigration().finally(() => { legacyMigration = null; });
  }
  return legacyMigration;
};

export const cartService = {
  migrateLegacyCart,

  getCart: async () => {
    await migrateLegacyCart().catch(() => []);

    if (!isLoggedIn()) {
      const cart = await loadGuestCart();
      notifyCartUpdate(cart);
      return cart;
    }
    const res = await api.get('/cart');
    const data = res.data?.data ?? res.data;
    notifyCartUpdate(data);
    return data;
  },
  addToCart: async (payload: AddToCartPayload) => {
    if (!isLoggedIn()) {
      const quantity = Math.max(1, Number(payload.quantity) || 1);
      return mutateGuestCart((entries) => {
        const key = entryKey(payload.productId, payload.variantId);
        const existing = entries.find((e) => entryKey(e.productId, e.variantId) === key);
        if (existing) {
          existing.quantity += quantity;
          if (payload.customNotes) existing.customNotes = payload.customNotes;
          return entries;
        }
        return [
          ...entries,
          {
            productId: payload.productId,
            variantId: payload.variantId || undefined,
            quantity,
            customNotes: payload.customNotes,
            isSelected: true,
          },
        ];
      });
    }
    const res = await api.post('/cart/items', payload);
    const data = res.data?.data ?? res.data;
    notifyCartUpdate(data);
    return data;
  },
  updateQuantity: async (itemId: string, quantity: number) => {
    if (!isLoggedIn()) {
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 1) throw new Error('Số lượng phải lớn hơn 0');
      return mutateGuestCart((entries) => {
        const entry = entries.find((e) => matchesGuestItem(e, itemId));
        if (!entry) throw new Error('Sản phẩm không có trong giỏ hàng');
        entry.quantity = qty;
        return entries;
      });
    }
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    const data = res.data?.data ?? res.data;
    notifyCartUpdate(data);
    return data;
  },
  toggleSelect: async (itemId: string, isSelected: boolean) => {
    if (!isLoggedIn()) {
      return mutateGuestCart((entries) => {
        const entry = entries.find((e) => matchesGuestItem(e, itemId));
        if (!entry) throw new Error('Sản phẩm không có trong giỏ hàng');
        entry.isSelected = isSelected;
        return entries;
      });
    }
    const res = await api.put(`/cart/items/${itemId}`, { isSelected });
    const data = res.data?.data ?? res.data;
    notifyCartUpdate(data);
    return data;
  },
  removeByProduct: async (productId: string, variantId?: string) => {
    if (!productId) return null;
    const cart = await cartService.getCart();
    const items: any[] = Array.isArray(cart?.items) ? cart.items : [];

    const match = items.find((it: any) => {
      const pid = it?.product_id?._id ?? it?.product_id;
      if (String(pid || '') !== String(productId)) return false;
      const vid = it?.variant_id?._id ?? it?.variant_id;
      return String(vid || '') === String(variantId || '');
    });

    if (!match?._id) return null;
    return cartService.removeItem(String(match._id));
  },

  removeItem: async (itemId: string) => {
    if (!isLoggedIn()) {
      return mutateGuestCart((entries) => entries.filter((e) => !matchesGuestItem(e, itemId)));
    }
    const res = await api.delete(`/cart/items/${itemId}`);
    const data = res.data?.data ?? res.data;
    notifyCartUpdate(data);
    return data;
  },
  clearCart: async () => {
    if (!isLoggedIn()) {
      return mutateGuestCart(() => []);
    }
    const res = await api.delete('/cart');
    const data = res.data?.data ?? res.data;
    notifyCartUpdate(data);
    return data;
  },

  mergeGuestCart: async (): Promise<MergeGuestCartResult> => {
    const entries = readGuestCart();
    if (entries.length === 0) return { merged: 0, skipped: [] };
    if (!isLoggedIn()) return { merged: 0, skipped: [] };

    const skipped: Array<{ productId: string; reason: string }> = [];
    let merged = 0;
    let lastCart: any = null;

    for (const entry of entries) {
      try {
        const res = await api.post('/cart/items', {
          productId: entry.productId,
          variantId: entry.variantId || undefined,
          quantity: entry.quantity,
          customNotes: entry.customNotes,
        });
        lastCart = res.data?.data ?? res.data;
        merged += 1;
      } catch (err) {
        skipped.push({ productId: entry.productId, reason: getApiErrorMessage(err) });
      }
    }

    clearGuestStorage();
    if (lastCart) notifyCartUpdate(lastCart);
    return { merged, skipped };
  },
};
