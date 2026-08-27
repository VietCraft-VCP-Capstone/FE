import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Star, ShoppingCart, Zap,
  ChevronDown, ChevronUp, Truck, Shield, CheckCircle2, Info, Store
} from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { userService } from '../../user/services/userService';
import { cartService } from '../../order/services/cartService';
import { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Variant { id: string; name: string; color?: string; size?: string; material?: string; price: number; stock: number; mockupImage?: string; }
interface Product {
  id: string; title: string; description: string; category: string;
  tags: string[]; allowCustomization: boolean; customizationType: string;
  price: number; images?: string[]; variants: Variant[];
  shopInfo?: { id: string; name: string; logo?: string; rating: number };
}

// ─── Mock reviews (until a reviews endpoint exists) ───────────────────────────
const MOCK_REVIEWS = [
  { id: '1', name: 'Trần Ngọc M.', date: '13/04/2024', rating: 5, avatar: 'https://randomuser.me/api/portraits/women/68.jpg', text: 'Áo rất đẹp, đúng màu, chất vải cotton chuẩn 100%. Đường may tỉ mỉ, không bị xổ. Sẽ ủng hộ shop dài dài!', images: [] },
  { id: '2', name: 'Nguyễn Văn T.', date: '10/04/2024', rating: 5, avatar: 'https://randomuser.me/api/portraits/men/45.jpg', text: 'Giao hàng nhanh, đóng gói cẩn thận. Sản phẩm đúng mô tả, mặc vừa size M. Chất lượng tốt cho mức giá này.', images: [] },
  { id: '3', name: 'Lê Thanh D.', date: '08/03/2024', rating: 4, avatar: 'https://randomuser.me/api/portraits/women/32.jpg', text: 'Giao nhanh 2 ngày, chất lượng ổn. Màu sắc đẹp như hình, size đúng. Tuy nhiên giặt lần đầu hơi phai màu một chút.', images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=80', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=80'] },
];

const AVG_RATING = 4.8;
const REVIEW_COUNT = 62;

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

// ─── Main component ───────────────────────────────────────────────────────────
export function BuyerProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();


  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [customText, setCustomText] = useState('');
  const [qty, setQty] = useState(1);
  const [descOpen, setDescOpen] = useState(true);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Load product ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setSelectedImage(0);

    Promise.all([
      productsService.getById(id),
      productsService.getRelated(id).catch(() => []),
      productsService.getAll().catch(() => []),
    ]).then(([prod, rel, all]) => {
      setProduct(prod);
      setRelated(rel.slice(0, 4));
      const relIds = new Set(rel.map((r: any) => r.id));
      const allList = Array.isArray(all) ? all : ((all as any)?.items || []);
      const pool = allList.filter((p: any) => p.id !== id && !relIds.has(p.id));
      setSuggestions(pool.slice(0, 4));

      // pre-select first variant values
      if (prod.variants?.length) {
        const v0 = prod.variants[0];
        setSelectedVariant(v0);
        if (v0.size) setSelectedSize(v0.size);
        if (v0.color) setSelectedColor(v0.color);
        if (v0.material) setSelectedMaterial(v0.material);
      }
    }).catch(() => {}).finally(() => setLoading(false));

    // check favorites from backend — /users/wishlist cần token.
    // Khách vãng lai bỏ qua hẳn: interceptor 401 sẽ đá về /login, mà trang chi tiết
    // sản phẩm phải xem được khi chưa đăng nhập.
    if (!isLoggedIn()) {
      setIsFav(false);
    } else {
      userService.getWishlist()
        .then((ids) => setIsFav(ids.includes(id!)))
        .catch(() => {
          try {
            const favs: string[] = JSON.parse(localStorage.getItem('vietcraft_favorites') || '[]');
            setIsFav(favs.includes(id!));
          } catch {}
        });
    }
  }, [id]);

  // Derive unique option sets from variants
  const colors = [...new Set((product?.variants || []).map(v => v.color).filter(Boolean))] as string[];
  const sizes  = [...new Set((product?.variants || []).map(v => v.size).filter(Boolean))] as string[];
  const materials = [...new Set((product?.variants || []).map(v => v.material).filter(Boolean))] as string[];

  // Resolve active variant by selected options
  const activeVariant = product?.variants.find(v =>
    (!selectedColor || v.color === selectedColor) &&
    (!selectedSize  || v.size  === selectedSize)  &&
    (!selectedMaterial || v.material === selectedMaterial)
  ) || selectedVariant || product?.variants[0] || null;

  const displayPrice = activeVariant?.price || product?.price || 0;
  const discountPct  = 15; // UI decoration only
  const strikePrice  = Math.round(displayPrice / (1 - discountPct / 100));

  // Images list
  const images = product?.images?.length ? product.images : [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600',
    'https://images.unsplash.com/photo-1556821840-3a63f15732ce?auto=format&fit=crop&w=600',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600',
  ];

  // ── Add to cart ──────────────────────────────────────────────────────────────
  const addToCart = async (): Promise<boolean> => {
    if (!product) return false;
    try {
      await cartService.addToCart({
        productId: product.id,
        variantId: activeVariant?.id,
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

  // Chỉ sang giỏ khi thêm THÀNH CÔNG, tránh đưa người dùng tới giỏ trống mà không rõ lý do.
  const buyNow = async () => {
    // "Mua ngay" dẫn thẳng tới luồng thanh toán → bắt đăng nhập tại đây.
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    const ok = await addToCart();
    if (ok) navigate('/cart');
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
      let updated: string[];
      if (isFav) {
        updated = await userService.removeFromWishlist(product.id);
        triggerToast(`Đã xóa khỏi yêu thích`, 'info');
      } else {
        updated = await userService.addToWishlist(product.id);
        triggerToast(`Đã thêm vào yêu thích!`, 'success');
      }
      setIsFav(updated.includes(product.id));
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch {
      // Fallback: toggle locally
      try {
        const favs: string[] = JSON.parse(localStorage.getItem('vietcraft_favorites') || '[]');
        const next = isFav ? favs.filter(i => i !== product.id) : [...favs, product.id];
        localStorage.setItem('vietcraft_favorites', JSON.stringify(next));
        setIsFav(!isFav);
        window.dispatchEvent(new CustomEvent('wishlist-updated'));
      } catch {}
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────────
  const S = {
    page: { fontFamily: "'Inter', system-ui, sans-serif", background: '#f9f9f9', minHeight: '100vh' } as React.CSSProperties,
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
    colorDot: (c: string, active: boolean) => ({ width: 28, height: 28, borderRadius: '50%', background: c, border: active ? '3px solid #008000' : '3px solid transparent', outline: '1px solid #ccc', cursor: 'pointer', transition: 'all 0.15s' } as React.CSSProperties),
    actionBar: { display: 'flex', gap: 12, marginTop: 24 } as React.CSSProperties,
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

  // ── Color name map (CSS color → label) ───────────────────────────────────────
  const COLOR_CSS: Record<string, string> = {
    'Trắng': 'white', 'Đen': '#222', 'Xanh': '#3b82f6', 'Đỏ': '#ef4444',
    'Vàng': '#fbbf24', 'Hồng': '#f472b6', 'Xám': '#9ca3af', 'Nâu': '#92400e',
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
              <div style={S.shopRow}>
                <Store size={14} color="#008000" />
                <span style={{ fontSize: 13, color: '#008000', fontWeight: 700 }}>{product.shopInfo.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                  <Star size={11} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                  <span style={{ fontSize: 12, color: '#555' }}>{product.shopInfo.rating?.toFixed(1) || '4.8'}</span>
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={S.price}>{fmtPrice(displayPrice)}</span>
              <span style={S.strike}>{fmtPrice(strikePrice)}</span>
              <span style={S.tag('#fff', '#e11d48')}>-{discountPct}%</span>
            </div>
            <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Giá đã bao gồm VAT</p>

            {/* Material tabs (if variants have material) */}
            {materials.length > 0 && (
              <>
                <p style={S.sectionLabel}>Loại sản phẩm</p>
                <div style={S.optionGroup}>
                  {materials.map(m => (
                    <button key={m} style={S.optionBtn(selectedMaterial === m)} onClick={() => setSelectedMaterial(m)}>{m}</button>
                  ))}
                </div>
              </>
            )}

            {/* Color swatches */}
            {colors.length > 0 && (
              <>
                <p style={S.sectionLabel}>Màu sắc: <span style={{ fontWeight: 400, color: '#555' }}>{selectedColor}</span></p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {colors.map(c => {
                    const css = COLOR_CSS[c] || c;
                    return (
                      <button key={c} title={c} style={S.colorDot(css, selectedColor === c)} onClick={() => setSelectedColor(c)} />
                    );
                  })}
                </div>
              </>
            )}

            {/* Size grid */}
            {sizes.length > 0 && (
              <>
                <p style={S.sectionLabel}>Kích cỡ</p>
                <div style={S.optionGroup}>
                  {sizes.map(sz => (
                    <button key={sz} style={S.optionBtn(selectedSize === sz)} onClick={() => setSelectedSize(sz)}>{sz}</button>
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
          <h2 style={S.sectionTitle}>Đánh giá sản phẩm</h2>
          <div style={S.reviewSummary}>
            <div style={{ textAlign: 'center', paddingRight: 24, borderRight: '1px solid #eee' }}>
              <div style={S.ratingBig}>{AVG_RATING}</div>
              <StarRow rating={5} size={18} />
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{REVIEW_COUNT} đánh giá</div>
            </div>
            <div style={{ flex: 1, paddingLeft: 16 }}>
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <StarRow rating={star} size={12} />
                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#f59e0b', borderRadius: 4, width: star === 5 ? '85%' : star === 4 ? '10%' : '3%' }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#888', width: 32 }}>{star === 5 ? '85%' : star === 4 ? '10%' : '2%'}</span>
                </div>
              ))}
            </div>
          </div>

          {MOCK_REVIEWS.map(rv => (
            <div key={rv.id} style={S.reviewCard}>
              <img src={rv.avatar} alt={rv.name} style={S.avatar} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{rv.name}</span>
                  <StarRow rating={rv.rating} size={12} />
                  <span style={{ fontSize: 12, color: '#aaa', marginLeft: 'auto' }}>{rv.date}</span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 13.5, color: '#444', lineHeight: 1.6 }}>{rv.text}</p>
                {rv.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {rv.images.map((img, i) => (
                      <img key={i} src={img} alt="review" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
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
