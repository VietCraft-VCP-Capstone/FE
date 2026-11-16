export interface Deal {
  id: string;
  title: string;
  price: number;
  oldPrice: number;
  discount: string;
  image: string;
  badge: 'FLASH SALE' | 'ƯU ĐÃI';
  couponCode?: string;
  couponTitle?: string;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300';

const num = (v: any) => parseFloat(typeof v === 'object' && v?.$numberDecimal ? v.$numberDecimal : v || 0);
const idOf = (v: any): string | null => (typeof v === 'string' ? v : v?._id?.toString() || v?.id?.toString() || null);
const productShopId = (p: any) => idOf(p.shop_id) || idOf(p.shopInfo?.id || p.shopInfo?._id) || idOf(p.sellerId);

function discounted(base: number, val: number, percent: boolean) {
  if (percent) return { price: Math.round(base * (1 - val / 100)), text: `-${val}%` };
  return { price: Math.max(0, base - val), text: val >= 1000 ? `-${Math.round(val / 1000)}K` : `-${val}đ` };
}

/** Sản phẩm có flash sale / ưu đãi từ các voucher đang chạy. allScopeLimit: số sp tối đa mỗi voucher áp toàn shop. */
export function buildDeals(coupons: any[], products: any[], allScopeLimit = 8): Deal[] {
  const now = new Date();
  const active = coupons.filter((c) => c.is_active && new Date(c.start_date) <= now && new Date(c.end_date) >= now);
  const findProduct = (id: string) => products.find((p) => p.id === id || p._id?.toString() === id);
  const deals: Deal[] = [];
  const added = new Set<string>();

  const push = (p: any, c: any, badge: Deal['badge'], percent: boolean) => {
    const id = (p.id || p._id)?.toString();
    const minVal = num(c.min_order_value);
    if (!id || added.has(id) || (minVal > 0 && p.price < minVal)) return;
    const d = discounted(p.price, num(c.discount_value), percent);
    deals.push({ id, title: p.title || p.name, price: d.price, oldPrice: p.price, discount: d.text, image: p.images?.[0] || FALLBACK_IMG, badge, couponCode: c.code, couponTitle: c.title });
    added.add(id);
  };
  const specific = (c: any) => (c.applicable_product_ids || [])
    .map((x: any) => findProduct((x?._id || x)?.toString()))
    .filter((p: any) => p && p.price > 0);

  for (const c of active.filter((x) => x.discount_type === 'FLASH_SALE')) {
    const percent = num(c.discount_value) <= 100;
    if (c.applicable_scope === 'SPECIFIC_PRODUCTS' && Array.isArray(c.applicable_product_ids)) {
      specific(c).forEach((p: any) => push(p, c, 'FLASH SALE', percent));
    } else if (c.applicable_scope === 'ALL') {
      const shopId = idOf(c.shop_id);
      products.filter((p) => !shopId || productShopId(p) === shopId)
        .slice(0, allScopeLimit)
        .forEach((p) => push(p, c, 'FLASH SALE', percent));
    }
  }
  for (const c of active.filter((x) => x.discount_type !== 'FLASH_SALE' && x.applicable_scope === 'SPECIFIC_PRODUCTS')) {
    specific(c).forEach((p: any) => push(p, c, 'ƯU ĐÃI', c.discount_type === 'PERCENTAGE'));
  }
  return deals;
}
