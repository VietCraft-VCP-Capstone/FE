import { mediaUrl, PLACEHOLDER_IMG, toNumber } from './format';

export interface CartLine {
  id: string;
  productId: string;
  variantId: string;
  shopId: string;
  shopName: string;
  shopLogo: string;
  title: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
  checked: boolean;
  productType?: string;
  /** null = không giới hạn / không rõ tồn kho */
  stock: number | null;
  /** Lý do không mua được (ngừng bán, hết hàng); null = mua được */
  unavailable: string | null;
  updatedAt: number;
}

export interface ShopGroup {
  shopId: string;
  shopName: string;
  shopLogo: string;
  lines: CartLine[];
  latest: number;
}

const resolveImage = (variant: any, prod: any): string => {
  const fromVariant = mediaUrl(variant?.mockup_image || variant?.mockupImage || variant?.image);
  if (fromVariant) return fromVariant;
  for (const img of Array.isArray(prod?.images) ? prod.images : []) {
    const u = mediaUrl(img);
    if (u) return u;
  }
  return mediaUrl(prod?.thumbnail || prod?.image) || PLACEHOLDER_IMG;
};

const variantLabel = (variant: any, item: any) => {
  const parts = [variant?.color, variant?.size, variant?.material].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (variant?.name) return String(variant.name);
  const fallback = [item?.color, item?.size].filter(Boolean);
  return fallback.length ? fallback.join(', ') : 'Tiêu chuẩn';
};

const linePrice = (variant: any, prod: any, item: any) => {
  for (const v of [variant?.retail_price, variant?.price, prod?.retail_price, prod?.price, item?.price]) {
    if (v !== undefined && v !== null) return toNumber(v);
  }
  const first = Array.isArray(prod?.variants) ? prod.variants[0] : null;
  return toNumber(first?.retail_price ?? first?.price ?? 0);
};

/** Dữ liệu giỏ từ BE (hoặc giỏ khách) → dòng hiển thị. Gộp dòng trùng sản phẩm + phân loại. */
export function mapCart(cartData: any): CartLine[] {
  if (!cartData || !Array.isArray(cartData.items)) return [];
  const out: CartLine[] = [];

  for (const item of cartData.items) {
    const prod = item.product_id && typeof item.product_id === 'object' ? item.product_id : {};
    const variant = item.variant_id && typeof item.variant_id === 'object' ? item.variant_id : {};
    const productId = String(prod._id || prod.id || item.product_id || '');
    const variantId = String(variant._id || variant.id || item.variant_id || '');
    if (!productId) continue;

    const dup = out.find((l) => l.productId === productId && l.variantId === variantId);
    if (dup) {
      dup.quantity += Number(item.quantity) || 1;
      continue;
    }

    const shop = prod.shop_id && typeof prod.shop_id === 'object' ? prod.shop_id : null;
    const stockRaw = variant.stock_quantity ?? variant.stock;
    const stock = typeof stockRaw === 'number' && Number.isFinite(stockRaw) ? stockRaw : null;
    const listing = String(prod.listing_status || '');

    let unavailable: string | null = null;
    if (listing === 'INACTIVE' || listing === 'EXPIRED') unavailable = 'Sản phẩm đã ngừng bán';
    else if (variant.is_active === false) unavailable = 'Phân loại này đã ngừng bán';
    else if (stock !== null && stock <= 0) unavailable = 'Đã hết hàng';

    out.push({
      id: String(item._id),
      productId,
      variantId,
      shopId: String(shop?._id || prod.shop_id || prod.sellerId || 'vietcraft'),
      shopName: shop?.shop_name || 'VietCraft Selection',
      shopLogo: mediaUrl(shop?.logo),
      title: prod.title || 'Sản phẩm VietCraft',
      variantName: variantLabel(variant, item),
      price: linePrice(variant, prod, item),
      quantity: Math.max(1, Number(item.quantity) || 1),
      image: resolveImage(variant, prod),
      checked: item.is_selected !== undefined ? Boolean(item.is_selected) : true,
      productType: prod.product_type,
      stock,
      unavailable,
      updatedAt: new Date(item.updated_at || 0).getTime() || 0,
    });
  }
  return out;
}

/** Nhóm theo shop, shop vừa thêm hàng gần nhất đứng đầu. */
export function groupByShop(lines: CartLine[]): ShopGroup[] {
  const map = new Map<string, ShopGroup>();
  for (const l of lines) {
    const g = map.get(l.shopId) || { shopId: l.shopId, shopName: l.shopName, shopLogo: l.shopLogo, lines: [], latest: 0 };
    g.lines.push(l);
    g.latest = Math.max(g.latest, l.updatedAt);
    map.set(l.shopId, g);
  }
  return [...map.values()].sort((a, b) => b.latest - a.latest);
}

export const isBuyable = (l: CartLine) => !l.unavailable;
export const isOverStock = (l: CartLine) => l.stock !== null && l.quantity > l.stock;

/**
 * Mỗi đơn chỉ thanh toán cho 1 shop (ràng buộc của BE). Chuẩn hoá lựa chọn lúc tải giỏ:
 * bỏ chọn dòng không mua được; nếu đang chọn ở nhiều shop thì giữ shop vừa thêm hàng gần nhất.
 * Trả về null nếu lựa chọn đã hợp lệ.
 */
export function normalizeSelection(lines: CartLine[]): string[] | null {
  const picked = lines.filter((l) => l.checked && isBuyable(l));
  const shops = new Set(picked.map((l) => l.shopId));
  let next = picked;
  if (shops.size > 1) {
    const keep = [...picked].sort((a, b) => b.updatedAt - a.updatedAt)[0].shopId;
    next = picked.filter((l) => l.shopId === keep);
  }
  const current = lines.filter((l) => l.checked).map((l) => l.id).sort().join(',');
  const wanted = next.map((l) => l.id).sort().join(',');
  return current === wanted ? null : next.map((l) => l.id);
}
