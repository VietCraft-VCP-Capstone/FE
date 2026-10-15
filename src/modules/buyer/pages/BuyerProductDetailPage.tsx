import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Heart, Star, ShoppingCart, Zap,
  ChevronDown, ChevronUp, Truck, Shield, CheckCircle2, Info, Store, MessageCircle, Ticket
} from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { favoritesService } from '../../product/services/favoritesService';
import { reviewService } from '../../product/services/reviewService';
import { cartService } from '../../order/services/cartService';
import { promotionService, CouponDTO } from '../../promotion/services/promotionService';
import { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Variant { id: string; name: string; color?: string; size?: string; material?: string; price: number; stock: number; mockupImage?: string; }
interface Product {
  id: string; title: string; description: string; category: string;
  tags: string[]; allowCustomization: boolean; customizationType: string;
  price: number; originalPrice?: number; images?: string[]; variants: Variant[];
  colors?: Array<{ name: string; hex: string }>;
  shopInfo?: { id: string; name: string; logo?: string; rating: number };
  rating?: number;
  reviews_count?: number;
  reviews?: Array<{ id: string; name: string; date: string; rating: number; avatar?: string; text: string; images?: string[] }>;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function fmtPrice(n: number) { return n.toLocaleString('vi-VN') + 'đ'; }

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} style={{ fill: s <= rating ? '#f59e0b' : '#e5e7eb', color: s <= rating ? '#f59e0b' : '#e5e7eb' }} />
      ))}
    </span>
  );
}

function resolveColorCss(colorName: string, productColors?: Array<{ name: string; hex: string }>): string {
  if (!colorName) return '#e5e7eb';
  const trimmed = colorName.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
    return trimmed;
  }

  // 1. Khớp mã hex từ danh sách colors của backend nếu có
  if (productColors && productColors.length > 0) {
    const match = productColors.find(pc => pc.name?.trim().toLowerCase() === trimmed.toLowerCase());
    if (match?.hex && (match.hex.startsWith('#') || match.hex.startsWith('rgb'))) {
      return match.hex;
    }
  }

  // 2. Bảng ánh xạ màu thủ công mỹ nghệ và tên màu tiếng Việt / tiếng Anh
  const lower = trimmed.toLowerCase();
  if (lower.includes('hỏa biến')) return 'linear-gradient(135deg, #1e3a8a, #d97706)';
  if (lower.includes('trắng ngà') || lower.includes('ngà') || lower.includes('men tro') || lower.includes('men mờ')) return '#F7F6EE';
  if (lower.includes('trắng') || lower.includes('white') || lower.includes('bạch') || lower.includes('sữa')) return '#FFFFFF';
  if (lower.includes('đen') || lower.includes('black') || lower.includes('mun') || lower.includes('huyền')) return '#1C1C1C';
  if (lower.includes('rạn ngọc') || lower.includes('ngọc')) return '#0D9488';
  if (lower.includes('xanh chàm') || lower.includes('chàm')) return '#1E3A8A';
  if (lower.includes('xanh lam') || lower.includes('lam') || lower.includes('navy') || lower.includes('xanh dương') || lower.includes('blue')) return '#1D4ED8';
  if (lower.includes('xanh lá') || lower.includes('xanh lục') || lower.includes('rêu') || lower.includes('chuối') || lower.includes('green')) return '#15803D';
  if (lower.includes('xanh')) return '#3B82F6';
  if (lower.includes('gỗ') || lower.includes('sồi') || lower.includes('óc chó') || lower.includes('wood')) return '#A16207';
  if (lower.includes('nâu') || lower.includes('cà phê') || lower.includes('hạt dẻ') || lower.includes('cánh gián') || lower.includes('bò') || lower.includes('brown')) return '#78350F';
  if (lower.includes('đất') || lower.includes('gốm') || lower.includes('mộc') || lower.includes('nâu cát')) return '#9A3412';
  if (lower.includes('kem') || lower.includes('be') || lower.includes('beige') || lower.includes('tự nhiên')) return '#EFE5D1';
  if (lower.includes('đỏ') || lower.includes('đô') || lower.includes('mận') || lower.includes('rượu') || lower.includes('red')) return '#DC2626';
  if (lower.includes('cam') || lower.includes('orange')) return '#EA580C';
  if (lower.includes('vàng') || lower.includes('chanh') || lower.includes('nghệ') || lower.includes('yellow') || lower.includes('gold')) return '#EAB308';
  if (lower.includes('hồng') || lower.includes('phấn') || lower.includes('sen') || lower.includes('pink')) return '#EC4899';
  if (lower.includes('tím') || lower.includes('purple') || lower.includes('violet')) return '#9333EA';
  if (lower.includes('xám') || lower.includes('tro') || lower.includes('ghi') || lower.includes('bạc') || lower.includes('gray') || lower.includes('grey') || lower.includes('silver')) return '#9CA3AF';
  if (lower.includes('đồng') || lower.includes('bronze')) return '#B45309';

  // 3. Fallback bằng mã màu pastel cố định theo hash chuỗi để luôn là CSS hợp lệ
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 65%)`;
}

// ─── Main component ───────────────────────────────────────────────────────────
// Cache sản phẩm chi tiết trong RAM để khi chuyển qua lại hiển thị tức thì
const productDetailCache = new Map<string, any>();
const relatedDetailCache = new Map<string, any[]>();
const suggestionsDetailCache = new Map<string, any[]>();

export function BuyerProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialProduct = (location.state as any)?.initialProduct;
  const initialMatches = initialProduct && (initialProduct.id === id || initialProduct._id === id);

  const [product, setProduct] = useState<Product | null>(() => {
    if (!id) return null;
    return productDetailCache.get(id) || (initialMatches ? initialProduct : null);
  });
  const [related, setRelated] = useState<any[]>(() => (id ? relatedDetailCache.get(id) || [] : []));
  const [suggestions, setSuggestions] = useState<any[]>(() => (id ? suggestionsDetailCache.get(id) || [] : []));
  const [loading, setLoading] = useState(() => {
    if (!id) return true;
    return !productDetailCache.has(id) && !initialMatches;
  });

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    const p = (id ? productDetailCache.get(id) : null) || (initialMatches ? initialProduct : null);
    return p?.variants?.[0] || null;
  });
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const p = (id ? productDetailCache.get(id) : null) || (initialMatches ? initialProduct : null);
    return p?.variants?.[0]?.size || '';
  });
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const p = (id ? productDetailCache.get(id) : null) || (initialMatches ? initialProduct : null);
    return p?.variants?.[0]?.color || '';
  });
  const [selectedMaterial, setSelectedMaterial] = useState<string>(() => {
    const p = (id ? productDetailCache.get(id) : null) || (initialMatches ? initialProduct : null);
    return p?.variants?.[0]?.material || '';
  });
  const [customText, setCustomText] = useState('');
  const [qty, setQty] = useState(1);
  const [descOpen, setDescOpen] = useState(true);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<CouponDTO[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vietcraft_saved_vouchers') || '[]');
    } catch {
      return [];
    }
  });

  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [avgRating, setAvgRating] = useState(5.0);
  const [reviewCount, setReviewCount] = useState(0);
  const [starBreakdown, setStarBreakdown] = useState<Record<string, { count: number; pct: string }>>({});

  const triggerToast = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSaveVoucher = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (savedVouchers.includes(code)) {
      updated = savedVouchers.filter(c => c !== code);
      triggerToast(`Đã bỏ lưu mã ${code}`, 'info');
    } else {
      updated = [...savedVouchers, code];
      triggerToast(`Đã lưu mã ${code}! Mã sẽ tự động gợi ý khi thanh toán.`, 'success');
    }
    setSavedVouchers(updated);
    localStorage.setItem('vietcraft_saved_vouchers', JSON.stringify(updated));
  };

  useEffect(() => {
    promotionService.getAll()
      .then(res => setAvailableCoupons(res || []))
      .catch(() => setAvailableCoupons([]));
  }, []);

  // ── Load product ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    // Load real reviews from API
    setIsLoadingReviews(true);
    reviewService.getProductReviews(id)
      .then((data: any) => {
        const items = data.items || [];
        setReviews(items);
        if (data.summary) {
          const avg = Number(data.summary.averageRating) || 5.0;
          const total = Number(data.summary.totalReviews ?? data.summary.reviewCount ?? items.length) || 0;
          setAvgRating(avg);
          setReviewCount(total);
          const breakdown: Record<string, { count: number; pct: string }> = {};
          [1, 2, 3, 4, 5].forEach(s => {
            const count = data.summary.breakdown?.[String(s)] || 0;
            const pct = data.summary.percentages?.[String(s)] || (total > 0 ? `${Math.round((count / total) * 100)}%` : '0%');
            breakdown[String(s)] = { count, pct };
          });
          setStarBreakdown(breakdown);
        } else {
          setReviewCount(items.length);
          if (items.length > 0) {
            const sum = items.reduce((acc: number, cur: any) => acc + (Number(cur.rating) || 5), 0);
            setAvgRating(sum / items.length);
          }
        }
      })
      .catch((err: any) => {
        console.warn('Could not load reviews:', err);
      })
      .finally(() => {
        setIsLoadingReviews(false);
      });

    if (productDetailCache.has(id)) {
      const cached = productDetailCache.get(id);
      setProduct(cached);
      setRelated(relatedDetailCache.get(id) || []);
      setSuggestions(suggestionsDetailCache.get(id) || []);
      setLoading(false);
      if (cached.variants?.length) {
        const v0 = cached.variants[0];
        setSelectedVariant(v0);
        if (v0.size) setSelectedSize(v0.size);
        if (v0.color) setSelectedColor(v0.color);
        if (v0.material) setSelectedMaterial(v0.material);
      }
    } else if (initialMatches) {
      setProduct(initialProduct);
      setLoading(false);
      if (initialProduct.variants?.length) {
        const v0 = initialProduct.variants[0];
        setSelectedVariant(v0);
        if (v0.size) setSelectedSize(v0.size);
        if (v0.color) setSelectedColor(v0.color);
        if (v0.material) setSelectedMaterial(v0.material);
      }
    } else {
      setLoading(true);
    }
    setSelectedImage(0);

    // 1. Fetch main product details first for instantaneous rendering
    productsService.getById(id)
      .then((prod) => {
        productDetailCache.set(id, prod);
        setProduct(prod);

        // pre-select first variant values
        if (prod.variants?.length) {
          const v0 = prod.variants[0];
          setSelectedVariant(v0);
          if (v0.size) setSelectedSize(v0.size);
          if (v0.color) setSelectedColor(v0.color);
          if (v0.material) setSelectedMaterial(v0.material);
        }
      })
      .catch((err) => {
        console.error('Failed to load product:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Fetch related & suggestions non-blockingly in background with small limit
    productsService.getRelated(id)
      .catch(() => [])
      .then((rel: any[]) => {
        const relSlice = (Array.isArray(rel) ? rel : []).slice(0, 4);
        relatedDetailCache.set(id, relSlice);
        setRelated(relSlice);
        const relIds = new Set(relSlice.map((r: any) => r.id));

        return productsService.getAll({ limit: 8 } as any)
          .catch(() => [])
          .then((all: any) => {
            const allList = Array.isArray(all) ? all : (all?.items || []);
            const pool = allList.filter((p: any) => p.id !== id && !relIds.has(p.id));
            const sugg = pool.slice(0, 4);
            suggestionsDetailCache.set(id, sugg);
            setSuggestions(sugg);
          });
      });

    // check favorites from backend — /users/wishlist cần token.
    // Khách vãng lai bỏ qua hẳn: interceptor 401 sẽ đá về /login, mà trang chi tiết
    // sản phẩm phải xem được khi chưa đăng nhập.
    if (!isLoggedIn()) {
      setIsFav(false);
    } else {
      favoritesService.getFavoriteIds()
        .then((ids) => setIsFav(ids.includes(id!)))
        .catch(() => {
          try {
            const favs: string[] = JSON.parse(localStorage.getItem('vietcraft_favorites') || '[]');
            setIsFav(favs.includes(id!));
          } catch { }
        });
    }
  }, [id]);

  // Derive unique option sets from variants
  const colors = [...new Set((product?.variants || []).map(v => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set((product?.variants || []).map(v => v.size).filter(Boolean))] as string[];
  const materials = [...new Set((product?.variants || []).map(v => v.material).filter(Boolean))] as string[];

  const hasColors = colors.length > 0;
  const hasSizes = sizes.length > 0;
  const hasMaterials = materials.length > 0;

  // Resolve active variant by selected options
  const activeVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    const exact = product.variants.find(v =>
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize) &&
      (!selectedMaterial || v.material === selectedMaterial)
    );
    if (exact) return exact;
    return selectedVariant || product.variants[0] || null;
  }, [product?.variants, selectedColor, selectedSize, selectedMaterial, selectedVariant]);

  const handleSelectColor = (c: string) => {
    setSelectedColor(c);
    const match = product?.variants?.find(v =>
      v.color === c &&
      (!selectedSize || v.size === selectedSize) &&
      (!selectedMaterial || v.material === selectedMaterial)
    ) || product?.variants?.find(v => v.color === c);
    if (match) {
      setSelectedVariant(match);
      if (match.size && !selectedSize) setSelectedSize(match.size);
      if (match.material && !selectedMaterial) setSelectedMaterial(match.material);
    }
  };

  const handleSelectSize = (sz: string) => {
    setSelectedSize(sz);
    const match = product?.variants?.find(v =>
      v.size === sz &&
      (!selectedColor || v.color === selectedColor) &&
      (!selectedMaterial || v.material === selectedMaterial)
    ) || product?.variants?.find(v => v.size === sz);
    if (match) {
      setSelectedVariant(match);
      if (match.color && !selectedColor) setSelectedColor(match.color);
      if (match.material && !selectedMaterial) setSelectedMaterial(match.material);
    }
  };

  const handleSelectMaterial = (m: string) => {
    setSelectedMaterial(m);
    const match = product?.variants?.find(v =>
      v.material === m &&
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize)
    ) || product?.variants?.find(v => v.material === m);
    if (match) {
      setSelectedVariant(match);
      if (match.color && !selectedColor) setSelectedColor(match.color);
      if (match.size && !selectedSize) setSelectedSize(match.size);
    }
  };

  const rawBasePrice = activeVariant?.price ?? (activeVariant as any)?.retail_price ?? product?.price ?? (product as any)?.retail_price ?? 0;
  const basePrice = typeof rawBasePrice === 'object' && rawBasePrice?.$numberDecimal
    ? parseFloat(rawBasePrice.$numberDecimal)
    : Number(rawBasePrice) || 0;

  // Active promotion: CHỈ áp dụng Flash Sale trực tiếp nếu đủ điều kiện đơn tối thiểu
  const activePromotion = useMemo(() => {
    if (!id || !availableCoupons.length || basePrice <= 0) return null;
    const now = new Date();

    const isActive = (c: any) => {
      if (!c.is_active) return false;
      if (new Date(c.start_date) > now || new Date(c.end_date) < now) return false;
      return true;
    };

    const getShopId = (obj: any): string | null => {
      if (!obj) return null;
      if (typeof obj === 'string') return obj;
      if (typeof obj === 'object') {
        return obj._id?.toString() || obj.id?.toString() || null;
      }
      return null;
    };

    const pAny = product as any;
    const currentProductShopId = getShopId(pAny?.shopInfo?.id) || getShopId(pAny?.shop_id) || getShopId(pAny?.sellerId);

    const appliesToProduct = (c: any): boolean => {
      if (c.applicable_scope === 'SPECIFIC_PRODUCTS') {
        return (c.applicable_product_ids || []).some((pid: any) => (pid?._id || pid)?.toString() === id);
      }
      if (c.applicable_scope === 'ALL') {
        const cShopId = getShopId(c.shop_id);
        if (cShopId) return currentProductShopId === cShopId;
        return true; // platform-wide
      }
      return false;
    };

    const parseVal = (raw: any) =>
      typeof raw === 'object' && raw?.$numberDecimal
        ? parseFloat(raw.$numberDecimal)
        : parseFloat(raw || 0);

    // Chỉ áp dụng Flash Sale trực tiếp vào giá sản phẩm nếu đạt đơn tối thiểu
    const flashSale = availableCoupons.find(c => {
      if (!isActive(c) || c.discount_type !== 'FLASH_SALE' || !appliesToProduct(c)) return false;
      const minVal = parseVal(c.min_order_value);
      if (minVal > 0 && basePrice < minVal) return false;
      return true;
    });

    if (flashSale) {
      return { type: 'FLASH_SALE' as const, coupon: flashSale, discountVal: parseVal(flashSale.discount_value) };
    }

    return null;
  }, [id, availableCoupons, product, basePrice]);

  let finalPrice = basePrice;
  let strikePrice = 0;
  let discountPct = 0;
  let discountBadgeText = '';
  let isFlashSale = false;

  if (activePromotion) {
    strikePrice = basePrice;
    const val = activePromotion.discountVal;
    isFlashSale = true;
    if (val <= 100) {
      // val là % giảm
      finalPrice = Math.round(basePrice * (1 - val / 100));
      discountPct = Math.round(val);
      discountBadgeText = `-${discountPct}%`;
    } else {
      // val là số tiền giảm (VNĐ)
      finalPrice = Math.max(0, basePrice - val);
      discountPct = Math.round((val / basePrice) * 100);
      discountBadgeText = val >= 1000 ? `-${Math.round(val / 1000)}K` : `-${val}đ`;
    }
  }

  const hasDiscount = strikePrice > finalPrice;
  const displayPrice = finalPrice;

  // Danh sách voucher áp dụng được cho sản phẩm hoặc shop này
  const productVouchers = useMemo(() => {
    if (!availableCoupons.length) return [];
    const now = new Date();
    const pAny = product as any;
    const currentProductShopId = pAny?.shopInfo?.id || pAny?.shop_id?._id?.toString() || pAny?.shop_id?.toString() || pAny?.sellerId?.toString();
    return availableCoupons.filter(c => {
      if (!c.is_active) return false;
      if (new Date(c.start_date) > now || new Date(c.end_date) < now) return false;
      if (c.applicable_scope === 'SPECIFIC_PRODUCTS') {
        return (c.applicable_product_ids || []).some((pid: any) => (pid?._id || pid)?.toString() === id);
      }
      if (c.is_platform || !c.shop_id) return true;
      const sId = c.shop_id as any;
      const cShopId = sId?._id?.toString() || sId?.id?.toString() || (typeof sId === 'string' ? sId : null);
      if (cShopId && currentProductShopId && cShopId === currentProductShopId) return true;
      return false;
    });
  }, [availableCoupons, id, product]);


  // Images list
  const images = product?.images?.length ? product.images : [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600',
    'https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=600',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600',
  ];

  // ── Validation chọn phân loại ───────────────────────────────────────────────
  const validateVariantSelection = (): boolean => {
    if (!product) return false;
    if (hasColors && !selectedColor) {
      triggerToast('Vui lòng chọn Màu sắc sản phẩm trước khi tiếp tục.', 'info');
      return false;
    }
    if (hasSizes && !selectedSize) {
      triggerToast('Vui lòng chọn Kích cỡ sản phẩm trước khi tiếp tục.', 'info');
      return false;
    }
    if (hasMaterials && !selectedMaterial) {
      triggerToast('Vui lòng chọn Loại sản phẩm / Chất liệu trước khi tiếp tục.', 'info');
      return false;
    }
    if (product.variants?.length > 0 && !activeVariant) {
      triggerToast('Vui lòng chọn phân loại sản phẩm hợp lệ.', 'info');
      return false;
    }
    return true;
  };

  // ── Add to cart ──────────────────────────────────────────────────────────────
  const addToCart = async (): Promise<boolean> => {
    if (!product) return false;
    if (!validateVariantSelection()) return false;

    const targetVariantId = activeVariant?.id || (activeVariant as any)?._id || selectedVariant?.id || (selectedVariant as any)?._id;

    try {
      await cartService.addToCart({
        productId: product.id || (product as any)._id,
        variantId: targetVariantId ? String(targetVariantId) : undefined,
        quantity: qty,
        customNotes: customText || undefined
      });
      triggerToast(`Đã thêm "${product.title}" vào giỏ hàng!`, 'success');
      return true;
    } catch (err) {
      // BE nay từ chối sản phẩm ngừng bán / vượt tồn kho kèm lý do cụ thể.
      triggerToast(getApiErrorMessage(err, 'Không thể thêm vào giỏ, vui lòng thử lại.'), 'info');
      return false;
    }
  };

  // "Mua ngay" chuyển thẳng tới trang /checkout với sản phẩm được chọn
  const buyNow = async () => {
    if (!product) return;
    if (!validateVariantSelection()) return;
    if (!isLoggedIn()) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const targetVariantId = activeVariant?.id || (activeVariant as any)?._id || selectedVariant?.id || (selectedVariant as any)?._id;
    const currentImg = (product.images && product.images[selectedImage]) || (product.variants && selectedVariant?.mockupImage) || (product as any)?.thumbnail || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600';
    const variantName = [selectedColor, selectedSize, selectedMaterial].filter(Boolean).join(' - ') || activeVariant?.name || 'Tiêu chuẩn';

    const checkoutItem = {
      productId: product.id || (product as any)._id,
      shopId: product.shopInfo?.id || (product as any)?.shop_id?._id || (product as any)?.shop_id,
      variantId: targetVariantId ? String(targetVariantId) : '',
      title: product.title || 'Sản phẩm VietCraft',
      shopName: product.shopInfo?.name || (product as any)?.shop_id?.shop_name || 'VietCraft Shop',
      variantName,
      price: basePrice,
      quantity: qty,
      image: currentImg,
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      productType: (product as any)?.product_type || 'NORMAL'
    };

    try {
      await cartService.addToCart({
        productId: product.id || (product as any)._id,
        variantId: targetVariantId ? String(targetVariantId) : undefined,
        quantity: qty,
        customNotes: customText || undefined
      });
    } catch (e) {
      console.warn('Sync buy-now item into cart background:', e);
    }

    localStorage.setItem('vietcraft_checkout', JSON.stringify([checkoutItem]));
    navigate('/checkout');
  };

  const handleChatWithSeller = () => {
    if (!isLoggedIn()) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const currentImg = (product?.images && product.images[selectedImage]) || (product?.variants && selectedVariant?.mockupImage) || '';
    window.dispatchEvent(new CustomEvent('vietcraft-open-chat', {
      detail: {
        shopId: product?.shopInfo?.id,
        productWidget: {
          product_id: product?.id,
          title: product?.title,
          price: displayPrice,
          image: currentImg
        }
      }
    }));
  };

  // ── Toggle favorite ──────────────────────────────────────────────────────────
  const toggleFav = async () => {
    if (!product) return;
    // Yêu thích cần tài khoản: đưa khách sang /login thay vì gọi API rồi dính 401.
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    try {
      const res = await favoritesService.toggleFavorite(product.id);
      setIsFav(res.isFavorite);
      triggerToast(res.isFavorite ? 'Đã thêm vào yêu thích!' : 'Đã xóa khỏi yêu thích', res.isFavorite ? 'success' : 'info');
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch {
      // Fallback: toggle locally
      try {
        const favs: string[] = JSON.parse(localStorage.getItem('vietcraft_favorites') || '[]');
        const next = isFav ? favs.filter(i => i !== product.id) : [...favs, product.id];
        localStorage.setItem('vietcraft_favorites', JSON.stringify(next));
        setIsFav(!isFav);
        window.dispatchEvent(new CustomEvent('wishlist-updated'));
      } catch { }
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────────
  const S = {
    page: { fontFamily: "'Inter', system-ui, sans-serif", background: '#fcfcfc', minHeight: '100vh' } as React.CSSProperties,
    container: { maxWidth: 1100, margin: '0 auto', padding: '24px 20px' } as React.CSSProperties,
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 14, fontWeight: 600, marginBottom: 20, padding: '6px 0' } as React.CSSProperties,
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, alignItems: 'start' } as React.CSSProperties,
    mainImg: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12, background: '#f0f0f0', display: 'block' } as React.CSSProperties,
    thumbRail: { display: 'flex', gap: 8, marginTop: 12 } as React.CSSProperties,
    thumb: (active: boolean) => ({ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: active ? '2px solid #008000' : '2px solid transparent', flexShrink: 0 } as React.CSSProperties),
    tag: (color: string, bg: string) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, color, background: bg } as React.CSSProperties),
    shopRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as React.CSSProperties,
    price: { fontSize: 28, fontWeight: 900, color: '#008000', lineHeight: 1 } as React.CSSProperties,
    strike: { fontSize: 15, color: '#aaa', textDecoration: 'line-through', marginLeft: 8 } as React.CSSProperties,
    sectionLabel: { fontSize: 13, fontWeight: 700, color: '#330033', marginBottom: 8, marginTop: 16 } as React.CSSProperties,
    optionGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
    optionBtn: (active: boolean) => ({ padding: '6px 16px', border: active ? '2px solid #008000' : '2px solid #ddd', borderRadius: 8, background: active ? '#e6f7e6' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: active ? '#005500' : '#333', transition: 'all 0.15s' } as React.CSSProperties),
    colorDot: (c: string, active: boolean) => ({
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: c,
      border: active ? '3px solid #008000' : '3px solid transparent',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)',
      outline: active ? 'none' : '1px solid #d6d3d1',
      cursor: 'pointer',
      transition: 'all 0.15s',
      flexShrink: 0
    } as React.CSSProperties),
    actionBar: { display: 'flex', gap: 10, marginTop: 24 } as React.CSSProperties,
    btnChat: { padding: '13px 18px', border: '2px solid #008000', borderRadius: 10, background: '#f0fdf4', color: '#008000', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', whiteSpace: 'nowrap' as const } as React.CSSProperties,
    btnOutline: { flex: 1, padding: '13px 0', border: '2px solid #008000', borderRadius: 10, background: '#fff', color: '#008000', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' } as React.CSSProperties,
    btnFill: { flex: 1, padding: '13px 0', border: 'none', borderRadius: 10, background: '#008000', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' } as React.CSSProperties,
    accordion: { border: '1px solid #eee', borderRadius: 10, marginTop: 12 } as React.CSSProperties,
    accordionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#330033' } as React.CSSProperties,
    accordionBody: { padding: '0 16px 14px', fontSize: 13.5, color: '#555', lineHeight: 1.7 } as React.CSSProperties,
    reviewSection: { marginTop: 48 } as React.CSSProperties,
    reviewSummary: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 } as React.CSSProperties,
    ratingBig: { fontSize: 52, fontWeight: 900, color: '#330033', lineHeight: 1 } as React.CSSProperties,
    reviewCard: { display: 'flex', gap: 14, padding: '20px 0', borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
    avatar: { width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 } as React.CSSProperties,
    sectionTitle: { fontSize: 20, fontWeight: 800, color: '#330033', marginBottom: 20 } as React.CSSProperties,
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 } as React.CSSProperties,
    card: { background: '#fff', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' } as React.CSSProperties,
    cardImg: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' } as React.CSSProperties,
    cardInfo: { padding: '10px 12px 14px' } as React.CSSProperties,
  };



  if (loading) return (
    <div style={{ ...S.page }}>
      <div style={{ ...S.container, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ display: 'inline-block', width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#008000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ ...S.page }}>
      <div style={{ ...S.container, textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: '#888', fontSize: 16 }}>Không tìm thấy sản phẩm.</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, padding: '10px 24px', background: '#008000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>← Quay lại</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: '#fff', borderLeft: `4px solid ${toast.type === 'success' ? '#008000' : '#6366f1'}`, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, zIndex: 9999 }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} color="#008000" /> : <Info size={18} color="#6366f1" />}
          <span style={{ fontSize: 14, fontWeight: 600, color: '#330033' }}>{toast.msg}</span>
        </div>
      )}

      <div style={S.container}>
        {/* Back */}
        <button style={S.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Quay lại
        </button>

        {/* ── Top: Gallery + Info ────────────────────────────────────────────── */}
        <div style={S.grid}>
          {/* Gallery */}
          <div>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
              <img src={images[selectedImage]} alt={product.title} style={S.mainImg} />
              <button onClick={toggleFav} style={{ position: 'absolute', top: 12, right: 12, background: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <Heart size={18} fill={isFav ? '#e11d48' : 'none'} color={isFav ? '#e11d48' : '#555'} />
              </button>
            </div>
            <div style={S.thumbRail}>
              {images.slice(0, 4).map((img, i) => (
                <img key={i} src={img} alt={`thumb-${i}`} style={S.thumb(selectedImage === i)} onClick={() => setSelectedImage(i)} />
              ))}
            </div>
          </div>

          {/* Info Panel */}
          <div>
            {/* Shop badge */}
            {product.shopInfo && (
              <div style={{ ...S.shopRow, justifyContent: 'space-between' }}>
                <div
                  onClick={() => product.shopInfo?.id && navigate(`/shop/${product.shopInfo.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  title="Xem trang gian hàng"
                >
                  <Store size={14} color="#008000" />
                  <span style={{ fontSize: 13, color: '#008000', fontWeight: 700 }}>{product.shopInfo.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                    <Star size={11} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    <span style={{ fontSize: 12, color: '#555' }}>{product.shopInfo.rating?.toFixed(1) || avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1f1f1f', margin: '0 0 12px', lineHeight: 1.3 }}>{product.title}</h1>

            {/* Tags (category) */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={S.tag('#fff', '#008000')}>{product.category}</span>
              {product.tags.slice(0, 3).map((t, i) => (
                <span key={i} style={S.tag('#555', '#f0f0f0')}>{t}</span>
              ))}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={S.price}>{fmtPrice(displayPrice)}</span>
              {hasDiscount && (
                <>
                  <span style={S.strike}>{fmtPrice(strikePrice)}</span>
                  {isFlashSale ? (
                    <span className="flash-sale-badge">
                      ⚡ FLASH SALE {discountBadgeText}
                    </span>
                  ) : (
                    <span style={S.tag('#fff', '#e11d48')}>{discountBadgeText}</span>
                  )}
                </>
              )}
              {activePromotion?.coupon?.code && (
                <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6 }}>
                  ⚡ Áp dụng mã: {activePromotion.coupon.code}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Giá đã bao gồm VAT</p>

            {/* Vouchers applicable */}
            {productVouchers.length > 0 && (
              <div style={{ marginTop: 14, padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Ticket size={14} /> Mã giảm giá có thể áp dụng ({productVouchers.length})
                  </span>
                  <button
                    onClick={() => navigate('/vouchers')}
                    style={{ fontSize: 11, fontWeight: 700, color: '#008000', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Kho voucher &rarr;
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {productVouchers.slice(0, 3).map(v => {
                    const isSaved = savedVouchers.includes(v.code);
                    return (
                      <div key={v.id || v.code} style={{
                        backgroundColor: '#fff',
                        border: isSaved ? '1px solid #86efac' : '1px solid #e7e5e4',
                        borderRadius: 8,
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        <div>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 900, color: '#1c1917' }}>{v.code}</span>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#008000' }}>{v.title || `Giảm ${v.discount_value}`}</div>
                        </div>
                        <button
                          onClick={(e) => handleSaveVoucher(v.code, e)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: 'none',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: isSaved ? '#dcfce7' : '#008000',
                            color: isSaved ? '#166534' : '#fff'
                          }}
                        >
                          {isSaved ? '✓ Đã lưu' : 'Lưu'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Material tabs (if variants have material) */}
            {materials.length > 0 && (
              <>
                <p style={S.sectionLabel}>
                  Loại sản phẩm: <span style={{ fontWeight: 600, color: selectedMaterial ? '#008000' : '#dc2626' }}>{selectedMaterial || '(Chưa chọn)'}</span>
                </p>
                <div style={S.optionGroup}>
                  {materials.map(m => (
                    <button key={m} style={S.optionBtn(selectedMaterial === m)} onClick={() => handleSelectMaterial(m)}>{m}</button>
                  ))}
                </div>
              </>
            )}

            {/* Color swatches */}
            {colors.length > 0 && (
              <>
                <p style={S.sectionLabel}>
                  Màu sắc: <span style={{ fontWeight: 600, color: selectedColor ? '#008000' : '#dc2626' }}>{selectedColor || '(Chưa chọn)'}</span>
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {colors.map(c => {
                    const css = resolveColorCss(c, product.colors);
                    return (
                      <button key={c} title={c} style={S.colorDot(css, selectedColor === c)} onClick={() => handleSelectColor(c)} />
                    );
                  })}
                </div>
              </>
            )}

            {/* Size grid */}
            {sizes.length > 0 && (
              <>
                <p style={S.sectionLabel}>
                  Kích cỡ: <span style={{ fontWeight: 600, color: selectedSize ? '#008000' : '#dc2626' }}>{selectedSize || '(Chưa chọn)'}</span>
                </p>
                <div style={S.optionGroup}>
                  {sizes.map(sz => (
                    <button key={sz} style={S.optionBtn(selectedSize === sz)} onClick={() => handleSelectSize(sz)}>{sz}</button>
                  ))}
                </div>
              </>
            )}

            {/* Customization */}
            {product.allowCustomization && (
              <div style={{ marginTop: 16 }}>
                <p style={{ ...S.sectionLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: '#008000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={10} color="#fff" />
                  </span>
                  Có thể tùy chỉnh nội dung (Tùy chọn)
                </p>
                <textarea
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="Nhập nội dung bạn muốn in lên sản phẩm..."
                  rows={3}
                  style={{ width: '100%', borderRadius: 8, border: '1.5px solid #c6e9c6', padding: '10px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                />
                <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Thêm đến 50 ký tự. Kiểm tra lỗi chính tả trước khi đặt hàng.</p>
              </div>
            )}

            {/* Qty + Ship info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>Số lượng:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 32, height: 34, border: 'none', background: '#f5f5f5', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>−</button>
                <span style={{ width: 36, textAlign: 'center', fontWeight: 700 }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(99, q + 1))} style={{ width: 32, height: 34, border: 'none', background: '#f5f5f5', fontSize: 18, cursor: 'pointer', fontWeight: 700 }}>+</button>
              </div>
              <span style={{ fontSize: 12, color: '#888' }}>Còn {activeVariant?.stock ?? 100} sản phẩm</span>
            </div>

            {/* Action Buttons */}
            <div style={S.actionBar}>
              <button style={S.btnChat} onClick={handleChatWithSeller} title="Chat với người bán">
                <MessageCircle size={18} /> Chat ngay
              </button>
              <button style={S.btnOutline} onClick={addToCart}>
                <ShoppingCart size={18} /> Thêm vào giỏ
              </button>
              <button style={S.btnFill} onClick={buyNow}>
                <Zap size={18} /> Mua ngay
              </button>
            </div>

            {/* Delivery accordion */}
            <div style={S.accordion}>
              <div style={S.accordionHead} onClick={() => setDescOpen(o => !o)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={15} color="#008000" /> Mô tả sản phẩm</span>
                {descOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {descOpen && (
                <div style={S.accordionBody}>
                  {product.description || 'Sản phẩm chất lượng cao, được làm thủ công từ nguyên liệu tự nhiên. Phù hợp làm quà tặng hoặc dùng cá nhân.'}
                </div>
              )}
            </div>
            <div style={S.accordion}>
              <div style={S.accordionHead} onClick={() => setShippingOpen(o => !o)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Shield size={15} color="#008000" /> Hướng dẫn bảo quản & đổi trả</span>
                {shippingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {shippingOpen && (
                <div style={S.accordionBody}>
                  <p style={{ margin: '0 0 6px' }}>• Giặt tay hoặc máy ở 30°C, không tẩy.</p>
                  <p style={{ margin: '0 0 6px' }}>• Phơi bóng râm, tránh ánh nắng trực tiếp.</p>
                  <p style={{ margin: '0 0 6px' }}>• Đổi trả trong 7 ngày nếu sản phẩm lỗi do nhà sản xuất.</p>
                  <p style={{ margin: 0 }}>• Liên hệ shop qua chat để được hỗ trợ.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Reviews ───────────────────────────────────────────────────────── */}
        <section style={S.reviewSection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ ...S.sectionTitle, marginBottom: 0 }}>Đánh giá sản phẩm</h2>
          </div>
          <div style={S.reviewSummary}>
            <div style={{ textAlign: 'center', paddingRight: 24, borderRight: '1px solid #eee' }}>
              <div style={S.ratingBig}>{reviewCount > 0 ? avgRating.toFixed(1) : '0.0'}</div>
              <StarRow rating={Math.round(avgRating)} size={18} />
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                {reviewCount > 0 ? `${reviewCount} đánh giá` : 'Chưa có đánh giá'}
              </div>
            </div>
            <div style={{ flex: 1, paddingLeft: 16 }}>
              {[5, 4, 3, 2, 1].map(star => {
                const pctStr = starBreakdown?.[String(star)]?.pct || '0%';
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <StarRow rating={star} size={12} />
                    <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#f59e0b', borderRadius: 4, width: pctStr }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#888', width: 32 }}>{pctStr}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {isLoadingReviews ? (
            <div style={{ padding: '36px 0', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid #e5e7eb', borderTopColor: '#008000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Đang tải đánh giá sản phẩm...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fafafa', borderRadius: 12, border: '1px dashed #e2e8f0', marginTop: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>Sản phẩm này chưa có đánh giá nào.</p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Hãy là người đầu tiên mua hàng và để lại nhận xét nhé!</p>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {reviews.map((rv, idx) => {
                const authorName = rv.name || rv.buyer?.name || 'Khách hàng ẩn danh';
                const authorAvatar = rv.avatar || rv.buyer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';
                const reviewDate = rv.date || (rv.createdAt ? new Date(rv.createdAt).toLocaleDateString('vi-VN') : '');
                const reviewText = rv.text || rv.comment || '';
                const reviewImages = Array.isArray(rv.images) ? rv.images : [];
                const ratingVal = typeof rv.rating === 'number' ? rv.rating : 5;

                return (
                  <div key={rv.id || rv._id || idx} style={S.reviewCard}>
                    <img src={authorAvatar} alt={authorName} style={S.avatar} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{authorName}</span>
                        <StarRow rating={ratingVal} size={12} />
                        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>{reviewDate}</span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: 13.5, color: '#444', lineHeight: 1.6 }}>{reviewText}</p>
                      {reviewImages.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {reviewImages.map((img: string, i: number) => (
                            <img key={i} src={img} alt={`review-img-${i}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Related products ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <h2 style={S.sectionTitle}>Sản phẩm cùng loại</h2>
            <div style={S.productGrid}>
              {related.map((p: any) => (
                <div key={p.id} style={S.card}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300'} alt={p.title} style={S.cardImg} />
                  <div style={S.cardInfo}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#008000' }}>{fmtPrice(p.price || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Suggestions ───────────────────────────────────────────────────── */}
        {suggestions.length > 0 && (
          <section style={{ marginTop: 40, marginBottom: 48 }}>
            <h2 style={S.sectionTitle}>Sản phẩm bạn có thể thích</h2>
            <div style={S.productGrid}>
              {suggestions.map((p: any) => (
                <div key={p.id} style={S.card}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  onClick={() => navigate(`/product/${p.id}`)}>
                  <div style={{ position: 'relative' }}>
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300'} alt={p.title} style={S.cardImg} />
                  </div>
                  <div style={S.cardInfo}>
                    <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#008000' }}>{fmtPrice(p.price || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default BuyerProductDetailPage;
