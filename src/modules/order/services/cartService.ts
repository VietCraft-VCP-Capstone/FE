import api, { isLoggedIn, getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { productsService } from '../../product/services/productsService';

// Hợp đồng /api/cart/* (BE: cart.router.ts) — mọi response bọc { success, data }.
// BE nay validate CHẶT và trả 400 { success:false, error } khi:
//   - POST /cart/items      : product/variant không tồn tại, không active, hoặc quá tồn kho
//   - PUT  /cart/items/:id  : itemId sai, hoặc quantity <= 0
// Các hàm dưới cố tình KHÔNG nuốt lỗi: trang gọi phải catch và hiện
// getApiErrorMessage(err) cho người dùng.
//
// ── CHẾ ĐỘ KHÁCH VÃNG LAI ───────────────────────────────────────────────────
// /cart/* cần token; khách chưa đăng nhập gọi vào sẽ dính 401 và bị interceptor
// đá về /login. Nên khi `!isLoggedIn()`, MỌI hàm dưới đây thao tác trên
// localStorage thay vì gọi API, giữ NGUYÊN chữ ký và vẫn trả về đúng shape mà
// BuyerCartPage đang đọc (items[].product_id là object đã "populate").
// Giỏ tạm chỉ lưu khoá tham chiếu (productId/variantId/quantity/notes) — KHÔNG
// lưu giá/tên/ảnh, vì snapshot sẽ lệch khi seller đổi giá. Giá và ảnh luôn được
// hydrate lại bằng GET /products/:id (endpoint công khai).
// Khi đăng nhập, useAuth gọi cartService.mergeGuestCart() để đẩy lên giỏ server.

export interface AddToCartPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  customNotes?: string;
}

/** Một dòng trong giỏ tạm của khách. Chỉ khoá tham chiếu, không có dữ liệu hiển thị. */
export interface GuestCartEntry {
  productId: string;
  variantId?: string;
  quantity: number;
  customNotes?: string;
  /** Tương ứng item.is_selected của giỏ server; mặc định true như BE. */
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

// ── Kho giỏ tạm ─────────────────────────────────────────────────────────────

/** BE lưu mockup dạng path tương đối /uploads/... — ghép origin để ảnh hiện được. */
const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const absImg = (u: any) => (typeof u === 'string' && u && !u.startsWith('http') ? ORIGIN + u : u);

/** Khoá định danh một dòng giỏ: cùng sản phẩm + cùng biến thể thì gộp số lượng. */
const entryKey = (productId: string, variantId?: string) => `${productId}::${variantId || ''}`;

/**
 * `_id` giả, ổn định giữa các lần load, để nút sửa/xoá của BuyerCartPage hoạt động.
 * Trang chỉ dùng nó làm handle truyền ngược lại updateQuantity/toggleSelect/removeItem.
 */
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
    // JSON hỏng (người dùng sửa tay, quota lỗi) — coi như giỏ rỗng còn hơn vỡ trang.
    return [];
  }
};

const writeGuestCart = (entries: GuestCartEntry[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(entries));
  } catch {
    // Hết quota / chế độ riêng tư chặn ghi: không làm vỡ luồng đang chạy.
  }
};

const clearGuestStorage = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Dựng một item giỏ khách theo đúng shape giỏ server đã populate.
 * `product` là DTO của GET /products/:id (id/title/images/price/variants/shopInfo),
 * KHÔNG phải document Mongo thô — nên phải map ngược về tên field mà
 * BuyerCartPage.mapBackendCart đọc: product_id.title/.images/.shop_id.shop_name,
 * variant_id.retail_price/.mockup_image/.color/.size/.material.
 */
const buildGuestItem = (entry: GuestCartEntry, product: any) => {
  const variants: any[] = Array.isArray(product?.variants) ? product.variants : [];
  const variant = entry.variantId ? variants.find((v: any) => String(v.id) === entry.variantId) : undefined;

  return {
    _id: guestItemId(entry),
    product_id: {
      _id: product?.id || entry.productId,
      title: product?.title,
      images: Array.isArray(product?.images) ? product.images : [],
      thumbnail: product?.thumbnail,
      retail_price: product?.price,
      price: product?.price,
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
          _id: variant.id,
          name: variant.name,
          color: variant.color,
          size: variant.size,
          material: variant.material,
          retail_price: variant.price,
          price: variant.price,
          stock_quantity: variant.stock,
          mockup_image: absImg(variant.mockupImage),
        }
      : undefined,
    quantity: entry.quantity,
    is_selected: entry.isSelected === undefined ? true : entry.isSelected,
    custom_notes: entry.customNotes,
    updated_at: new Date().toISOString(),
  };
};

/**
 * Đọc giỏ tạm rồi hydrate bằng /products/:id (công khai) để có giá/ảnh tươi.
 * Sản phẩm đã bị gỡ → getById ném lỗi → loại đúng món đó khỏi giỏ và đi tiếp,
 * không làm hỏng cả giỏ.
 */
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
  // Dọn luôn những món không còn tồn tại để lần sau khỏi gọi lại vô ích.
  if (ok.length !== entries.length) writeGuestCart(ok.map((r) => r.entry));

  return { _id: null, items: ok.map((r) => r.item), is_guest: true };
};

/** Áp một thay đổi lên giỏ tạm rồi trả về giỏ đã hydrate + phát event. */
const mutateGuestCart = async (mutate: (entries: GuestCartEntry[]) => GuestCartEntry[]) => {
  // Đọc-sửa-ghi phải xong TRƯỚC await đầu tiên: BuyerCartPage có chỗ gọi
  // Promise.all nhiều thao tác một lúc (toggle chọn tất cả, sync giỏ cũ),
  // nếu ghi sau await thì các lời gọi sẽ đè lên nhau và mất dữ liệu.
  writeGuestCart(mutate(readGuestCart()));
  const cart = await loadGuestCart();
  notifyCartUpdate(cart);
  return cart;
};

/** Khớp itemId của khách: chấp nhận cả `_id` giả lẫn productId trần (giống BE). */
const matchesGuestItem = (entry: GuestCartEntry, itemId: string) =>
  guestItemId(entry) === itemId || entry.productId === itemId;

/**
 * Khoá giỏ cũ từ thời chưa có giỏ phía server. Không còn ai GHI vào nữa; chỉ giữ hàm
 * rút cạn nó cho những trình duyệt còn dữ liệu tồn đọng, rút xong là xoá luôn.
 */
const LEGACY_CART_KEY = 'vietcraft_cart';

/** Một lần chạy dùng chung cho mọi lời gọi đồng thời, tránh đẩy trùng món. */
let legacyMigration: Promise<string[]> | null = null;

/**
 * Chuyển giỏ localStorage đời cũ sang giỏ hiện hành rồi xoá khoá cũ.
 * Đã đăng nhập thì đẩy lên server, chưa thì rơi vào giỏ khách — `addToCart` tự lo.
 * Trả về danh sách thông điệp lỗi của những món không chuyển được (hết hàng, đã bị gỡ).
 */
const runLegacyMigration = async (): Promise<string[]> => {
  const raw = localStorage.getItem(LEGACY_CART_KEY);
  if (!raw) return [];

  let parsed: any[] = [];
  try {
    const value = JSON.parse(raw);
    parsed = Array.isArray(value) ? value : [];
  } catch {
    // JSON hỏng thì không cứu được gì, dọn luôn cho khỏi thử lại mỗi lần vào trang.
    localStorage.removeItem(LEGACY_CART_KEY);
    return [];
  }

  const failures: string[] = [];
  // Tuần tự: BE cộng dồn số lượng theo từng lần gọi, chạy song song dễ lệch.
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

  // Xoá kể cả khi có món trượt: giữ lại sẽ báo lỗi lặp mỗi lần vào trang.
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
  /** Rút cạn giỏ localStorage đời cũ sang giỏ hiện hành. Trả về lỗi của món không chuyển được. */
  migrateLegacyCart,

  getCart: async () => {
    // Rút cạn giỏ đời cũ ở bất kỳ lối vào nào. Không còn dữ liệu tồn đọng thì đây là no-op.
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
  /**
   * Xoá theo (productId, variantId) thay vì theo _id của dòng giỏ.
   *
   * Cần thiết vì id dòng giỏ KHÔNG bền qua luồng khách vãng lai: khách bấm thanh toán
   * (snapshot mang id giỏ tạm 'guest-...') → bị đá sang đăng nhập → mergeGuestCart đẩy
   * hàng lên server và server sinh _id hoàn toàn mới → quay lại checkout mà xoá theo id cũ
   * thì không trúng dòng nào, hàng đã mua vẫn nằm lại trong giỏ.
   * Tra lại giỏ hiện tại rồi mới xoá nên đúng ở cả hai chế độ, và cũng miễn nhiễm với
   * trường hợp người dùng sửa giỏ ở tab khác.
   */
  removeByProduct: async (productId: string, variantId?: string) => {
    if (!productId) return null;
    const cart = await cartService.getCart();
    const items: any[] = Array.isArray(cart?.items) ? cart.items : [];

    const match = items.find((it: any) => {
      const pid = it?.product_id?._id ?? it?.product_id;
      if (String(pid || '') !== String(productId)) return false;
      const vid = it?.variant_id?._id ?? it?.variant_id;
      // Không chọn biến thể thì hai bên đều phải rỗng, tránh xoá nhầm dòng cùng sản phẩm.
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

  /**
   * Gộp giỏ tạm của khách vào giỏ server ngay sau khi đăng nhập.
   * Đẩy TỪNG món (tuần tự, để lỗi một món không kéo theo món khác và để BE
   * cộng dồn số lượng đúng thứ tự). Món bị BE từ chối (hết hàng, đã gỡ bán)
   * thì bỏ qua và ghi lại lý do — không huỷ cả lần gộp.
   * Bắt buộc gọi SAU khi token đã nằm trong localStorage.
   */
  mergeGuestCart: async (): Promise<MergeGuestCartResult> => {
    const entries = readGuestCart();
    if (entries.length === 0) return { merged: 0, skipped: [] };
    // Chưa có token thì POST /cart/items sẽ 401 và interceptor đá về /login.
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

    // Xoá giỏ tạm dù có món trượt: giữ lại sẽ báo lỗi lặp mỗi lần đăng nhập.
    clearGuestStorage();
    if (lastCart) notifyCartUpdate(lastCart);
    return { merged, skipped };
  },
};
