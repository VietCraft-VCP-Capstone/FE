import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Star, ArrowRight, CheckCircle2, Info, Ticket, Flame } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { promotionService } from '../../promotion/services/promotionService';
import { favoritesService } from '../../product/services/favoritesService';
import { isLoggedIn } from '../../../infrastructure/api/interceptors';
import '../../../shared/components/layouts.css';

// Bộ nhớ đệm cấp module: giữ lại sản phẩm và voucher khi người dùng chuyển trang
let homeDataCache: {
  products: any[];
  shops: any[];
  coupons: any[];
  timestamp: number;
} | null = null;

export function BuyerDashboard({ user: _user }: { user?: any; onLogout?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const outletContext = useOutletContext<any>() || {};
  const search = outletContext.search || '';

  const [allProducts, setAllProducts] = useState<any[]>(() => homeDataCache?.products || []);
  const [shopList, setShopList] = useState<any[]>(() => homeDataCache?.shops || []);
  const [couponList, setCouponList] = useState<any[]>(() => homeDataCache?.coupons || []);
  const [favoritedProductIds, setFavoritedProductIds] = useState<string[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(() => !homeDataCache);
  const [currentPage, setCurrentPage] = useState(1);

  // Tự động cuộn đến section tương ứng khi URL là /collections, /gifts
  useEffect(() => {
    if (location.pathname === '/collections' || location.hash === '#collections-section') {
      setTimeout(() => {
        document.getElementById('collections-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else if (location.pathname === '/gifts' || location.hash === '#gifts-section') {
      setTimeout(() => {
        document.getElementById('kham-pha')?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setFavoritedProductIds([]);
    } else {
      favoritesService.getFavoriteIds()
        .then((ids) => {
          setFavoritedProductIds(ids);
          localStorage.setItem('vietcraft_favorites', JSON.stringify(ids));
        })
        .catch(() => {
          try {
            const stored = localStorage.getItem('vietcraft_favorites');
            if (stored) setFavoritedProductIds(JSON.parse(stored));
          } catch {}
        });
    }
    const vls = localStorage.getItem('vietcraft_saved_vouchers');
    if (vls) {
      try { setSavedVouchers(JSON.parse(vls)); } catch (e) {}
    }

    // Chỉ bật loading spinner nếu chưa có cache sẵn trong RAM
    if (!homeDataCache) {
      setIsLoading(true);
    }

    Promise.all([
      productsService.getAll({ pageSize: 100 }).catch((err) => { console.error('Failed to fetch products', err); return { items: [] as any[], total: 0, page: 1, limit: 6, totalPages: 1 }; }),
      productsService.getFeaturedShops().catch((err) => { console.error('Failed to fetch shops', err); return []; }),
      promotionService.getAll().catch((err) => { console.error('Failed to fetch coupons', err); return []; }),
    ]).then(([products, shops, coupons]) => {
      const productList = Array.isArray(products) ? products : (products as any)?.items || [];
      setAllProducts(productList);
      setShopList(shops || []);
      setCouponList(coupons || []);
      homeDataCache = {
        products: productList,
        shops: shops || [],
        coupons: coupons || [],
        timestamp: Date.now()
      };
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFavorite = async (productId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    try {
      const res = await favoritesService.toggleFavorite(productId);
      const isFav = res.isFavorite;
      setFavoritedProductIds(prev =>
        isFav ? [...prev, productId] : prev.filter(id => id !== productId)
      );
      triggerToast(
        isFav ? `Đã thêm "${title}" vào danh sách yêu thích` : `Đã xóa "${title}" khỏi danh sách yêu thích`,
        isFav ? 'success' : 'info'
      );
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      console.error('toggleFavorite failed', err);
      triggerToast('Không thể cập nhật yêu thích, vui lòng thử lại.', 'info');
    }
  };

  const toggleVoucher = (voucherCode: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated: string[];
    if (savedVouchers.includes(voucherCode)) {
      updated = savedVouchers.filter(code => code !== voucherCode);
      triggerToast(`Đã hủy lưu mã ${voucherCode}`, 'info');
    } else {
      updated = [...savedVouchers, voucherCode];
      navigator.clipboard?.writeText(voucherCode);
      triggerToast(`Lưu mã ưu đãi ${voucherCode} thành công! Đã sao chép mã.`, 'success');
    }
    setSavedVouchers(updated);
    localStorage.setItem('vietcraft_saved_vouchers', JSON.stringify(updated));
  };

  const vouchers = useMemo(() => {
    return couponList.map((v: any) => {
      const val = typeof v.discount_value === 'object' && v.discount_value?.$numberDecimal
        ? parseFloat(v.discount_value.$numberDecimal)
        : parseFloat(v.discount_value || 0);
      const minVal = typeof v.min_order_value === 'object' && v.min_order_value?.$numberDecimal
        ? parseFloat(v.min_order_value.$numberDecimal)
        : parseFloat(v.min_order_value || 0);
      const maxVal = typeof v.max_discount_amount === 'object' && v.max_discount_amount?.$numberDecimal
        ? parseFloat(v.max_discount_amount.$numberDecimal)
        : parseFloat(v.max_discount_amount || 0);

      let displayValue = '';
      if (v.discount_type === 'PERCENTAGE') {
        displayValue = `GIẢM ${val}%${maxVal > 0 ? ` (Tối đa ${(maxVal / 1000).toLocaleString('vi-VN')}K)` : ''}`;
      } else if (v.discount_type === 'FREE_SHIPPING') {
        displayValue = val > 0 ? `FREESHIP ${(val / 1000).toLocaleString('vi-VN')}K` : 'FREESHIP 100%';
      } else if (v.discount_type === 'FLASH_SALE') {
        displayValue = val <= 100 ? `FLASH SALE ${val}%` : `FLASH SALE ${(val / 1000).toLocaleString('vi-VN')}K`;
      } else {
        displayValue = val >= 1000000 ? `GIẢM ${(val / 1000000).toLocaleString('vi-VN')} TR` : `GIẢM ${(val / 1000).toLocaleString('vi-VN')}K`;
      }

      let conditionLabel = 'Mọi đơn hàng';
      if (minVal > 0) {
        conditionLabel = minVal >= 1000000 ? `Đơn tối thiểu ${minVal / 1000000} triệu` : `Đơn tối thiểu ${(minVal / 1000)}K`;
      }

      return {
        id: v._id || v.id,
        code: v.code,
        title: v.title,
        discount_type: v.discount_type,
        discount_value: val,
        min_order_value: minVal,
        max_discount_amount: maxVal,
        is_platform: v.is_platform ?? !v.shop_id,
        shop_name: v.shop_name || (v.shop_id ? 'Gian hàng' : 'VietCraft'),
        applicable_scope: v.applicable_scope || 'ALL',
        applicable_products_count: v.applicable_product_ids?.length || 0,
        end_date: v.end_date,
        value: displayValue,
        condition: conditionLabel
      };
    });
  }, [couponList]);

  // Lấy sản phẩm có ưu đãi thật / Flash Sale thật từ database và voucher đang chạy
  const flashDeals = useMemo(() => {
    const now = new Date();
    const activePromotions = couponList.filter((c: any) => {
      if (!c.is_active) return false;
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      return start <= now && end >= now;
    });

    const flashSaleCoupons = activePromotions.filter((c: any) => c.discount_type === 'FLASH_SALE');
    const otherCoupons = activePromotions.filter((c: any) => c.discount_type !== 'FLASH_SALE');

    const deals: Array<{
      id: string;
      title: string;
      price: number;
      oldPrice: number;
      discount: string;
      image: string;
      badge?: string;
      couponCode?: string;
      couponTitle?: string;
    }> = [];

    const addedProductIds = new Set<string>();

    // 1. Sản phẩm thuộc chương trình FLASH SALE thật
    for (const coupon of flashSaleCoupons) {
      const discountVal = typeof coupon.discount_value === 'object' && coupon.discount_value?.$numberDecimal
        ? parseFloat(coupon.discount_value.$numberDecimal)
        : parseFloat(coupon.discount_value || 0);

      if (coupon.applicable_scope === 'SPECIFIC_PRODUCTS' && Array.isArray(coupon.applicable_product_ids)) {
        for (const prodId of coupon.applicable_product_ids) {
          const idStr = (prodId?._id || prodId)?.toString();
          if (!idStr || addedProductIds.has(idStr)) continue;
          const p = allProducts.find((item: any) => (item.id === idStr || item._id?.toString() === idStr));
          if (p && p.price > 0) {
            const basePrice = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price;
            let dealPrice = basePrice;
            let discountText = '';
            if (discountVal <= 100) {
              dealPrice = Math.round(basePrice * (1 - discountVal / 100));
              discountText = `-${discountVal}%`;
            } else {
              dealPrice = Math.max(0, basePrice - discountVal);
              discountText = `-${Math.round((discountVal / basePrice) * 100)}%`;
            }
            deals.push({
              id: p.id || p._id,
              title: p.title || p.name,
              price: dealPrice,
              oldPrice: basePrice,
              discount: discountText,
              image: p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300',
              badge: 'FLASH SALE',
              couponCode: coupon.code,
              couponTitle: coupon.title
            });
            addedProductIds.add(idStr);
          }
        }
      } else if (coupon.applicable_scope === 'ALL') {
        const matchingProds = coupon.shop_id
          ? allProducts.filter((p: any) => (p.sellerId === coupon.shop_id || p.shop_id === coupon.shop_id))
          : allProducts;
        for (const p of matchingProds.slice(0, 4)) {
          const idStr = (p.id || p._id)?.toString();
          if (!idStr || addedProductIds.has(idStr)) continue;
          const basePrice = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price;
          let dealPrice = basePrice;
          let discountText = '';
          if (discountVal <= 100) {
            dealPrice = Math.round(basePrice * (1 - discountVal / 100));
            discountText = `-${discountVal}%`;
          } else {
            dealPrice = Math.max(0, basePrice - discountVal);
            discountText = `-${Math.round((discountVal / basePrice) * 100)}%`;
          }
          deals.push({
            id: p.id || p._id,
            title: p.title || p.name,
            price: dealPrice,
            oldPrice: basePrice,
            discount: discountText,
            image: p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300',
            badge: 'FLASH SALE',
            couponCode: coupon.code,
            couponTitle: coupon.title
          });
          addedProductIds.add(idStr);
        }
      }
    }

    // 2. Sản phẩm thuộc các voucher giảm giá chỉ định khác
    for (const coupon of otherCoupons) {
      if (coupon.applicable_scope === 'SPECIFIC_PRODUCTS' && Array.isArray(coupon.applicable_product_ids)) {
        const discountVal = typeof coupon.discount_value === 'object' && coupon.discount_value?.$numberDecimal
          ? parseFloat(coupon.discount_value.$numberDecimal)
          : parseFloat(coupon.discount_value || 0);

        for (const prodId of coupon.applicable_product_ids) {
          const idStr = (prodId?._id || prodId)?.toString();
          if (!idStr || addedProductIds.has(idStr)) continue;
          const p = allProducts.find((item: any) => (item.id === idStr || item._id?.toString() === idStr));
          if (p && p.price > 0) {
            const basePrice = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price;
            let dealPrice = basePrice;
            let discountText = '';
            if (coupon.discount_type === 'PERCENTAGE') {
              dealPrice = Math.round(basePrice * (1 - discountVal / 100));
              discountText = `-${discountVal}%`;
            } else {
              dealPrice = Math.max(0, basePrice - discountVal);
              discountText = `-${Math.round((discountVal / basePrice) * 100)}%`;
            }
            deals.push({
              id: p.id || p._id,
              title: p.title || p.name,
              price: dealPrice,
              oldPrice: basePrice,
              discount: discountText,
              image: p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300',
              badge: 'ƯU ĐÃI',
              couponCode: coupon.code,
              couponTitle: coupon.title
            });
            addedProductIds.add(idStr);
          }
        }
      }
    }

    // 3. Sản phẩm có giảm giá thật trực tiếp (originalPrice > price)
    for (const p of allProducts) {
      const idStr = (p.id || p._id)?.toString();
      if (!idStr || addedProductIds.has(idStr)) continue;
      if (p.originalPrice && p.originalPrice > p.price) {
        const discountPct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
        if (discountPct >= 5) {
          deals.push({
            id: p.id || p._id,
            title: p.title || p.name,
            price: p.price,
            oldPrice: p.originalPrice,
            discount: `-${discountPct}%`,
            image: p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300',
            badge: 'GIẢM GIÁ'
          });
          addedProductIds.add(idStr);
        }
      }
    }

    return deals;
  }, [allProducts, couponList]);

  const aiSuggestions = allProducts.slice(1, 5).map((p: any) => {
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      rating: 5,
      image: p.images?.[0] || 'https://images.unsplash.com/photo-1603006905393-c910e859b89f?auto=format&fit=crop&w=300'
    };
  });

  const subbedShops = shopList.length > 0 ? shopList.map((shop: any) => {
    const shopProds = allProducts.filter((p: any) => p.sellerId === shop._id?.toString() || p.sellerId === shop.id).slice(0, 3);
    const thumbnails = shopProds.map((p: any) => p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150');
    while (thumbnails.length < 3) {
      thumbnails.push('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=150');
    }
    return {
      name: shop.shop_name,
      caption: `Đã thêm ${shop.listing_count || 5} sản phẩm mới`,
      image: shop.logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200',
      thumbnails
    };
  }) : [];

  const searchedProducts = allProducts.filter((p: any) =>
    (p.title || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const displayProducts = searchedProducts;
  const itemsPerPage = 8;
  const totalPages = Math.ceil(displayProducts.length / itemsPerPage);
  const paginatedProducts = displayProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const flashSaleProductMap = useMemo(() => {
    const map = new Map<string, any>();
    flashDeals.forEach((fd: any) => {
      if (fd.badge === 'FLASH SALE') {
        map.set(fd.id?.toString(), fd);
      }
    });
    return map;
  }, [flashDeals]);


  return (
    <div className="buyer-wrapper" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#fff',
          borderLeft: '4px solid #008000',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 9999,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toast.type === 'success'
            ? <CheckCircle2 size={20} color="#008000" strokeWidth={2.5} />
            : <Info size={20} color="#6366f1" strokeWidth={2.5} />
          }
          <span style={{ fontSize: 14, fontWeight: 600, color: '#330033' }}>{toast.message}</span>
        </div>
      )}

      {/* Unique Vouchers Voucher Section - Đẩy lên trên đầu trang */}
      <section id="vouchers-section" className="buyer-section" style={{ marginTop: 20 }}>
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Ticket className="text-[#008000]" size={22} />
              Ưu Đãi & Voucher Dành Cho Bạn
            </h2>
            <p style={{ fontSize: 13, color: '#78716c', margin: '4px 0 0 0' }}>
              Lưu mã khuyến mãi toàn sàn và gian hàng để tự động trừ tiền khi thanh toán
            </p>
          </div>
          <button
            onClick={() => navigate('/vouchers')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#008000',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: 50,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,128,0,0.2)',
              transition: 'all 0.2s'
            }}
          >
            <Ticket size={16} />
            Xem tất cả Voucher ({vouchers.length})
          </button>
        </div>

        {vouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: '#fafaf9', borderRadius: 16, color: '#78716c' }}>
            <Ticket size={32} style={{ margin: '0 auto 8px', color: '#a8a29e' }} />
            <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Hiện chưa có mã ưu đãi công khai nào đang mở.</p>
          </div>
        ) : (
          <div className="buyer-grid-4">
            {vouchers.slice(0, 8).map((v, i) => {
              const isSaved = savedVouchers.includes(v.code);
              return (
                <div key={i} className="voucher-card" style={{
                  backgroundColor: isSaved ? '#f0fdf4' : '#fff8f8',
                  borderColor: isSaved ? '#86efac' : '#fca5a5',
                  height: 'auto',
                  minHeight: 125,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 14
                }}>
                  <div className="voucher-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                      <span className="font-mono" style={{ fontSize: 11, fontWeight: 900, backgroundColor: isSaved ? '#dcfce7' : '#fee2e2', color: isSaved ? '#166534' : '#991b1b', padding: '2px 6px', borderRadius: 4 }}>
                        {v.code}
                      </span>
                      {v.is_platform ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#008000' }}>Toàn Sàn</span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#57534e', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.shop_name}</span>
                      )}
                    </div>
                    <span className="voucher-title" style={{ color: isSaved ? '#15803d' : '#cc1111', fontSize: 15, fontWeight: 800 }}>{v.value}</span>
                    <span className="voucher-desc" style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{v.condition}</span>
                    {v.applicable_scope === 'SPECIFIC_PRODUCTS' && (
                      <span style={{ fontSize: 10, color: '#d97706', fontWeight: 600, display: 'block', marginTop: 3 }}>
                        • {v.applicable_products_count} sản phẩm chỉ định
                      </span>
                    )}
                  </div>
                  <button
                    className="voucher-btn"
                    onClick={(e) => toggleVoucher(v.code, e)}
                    style={{
                      backgroundColor: isSaved ? '#008000' : '#cc1111',
                      color: '#fff',
                      transition: 'all 0.2s',
                      fontWeight: 700,
                      marginTop: 8,
                      padding: '5px 0'
                    }}
                  >
                    {isSaved ? '✓ Đã lưu' : 'Lưu mã'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Flash Deals Section - Sản phẩm Flash Sale với badge nhảy nhảy */}
      <section className="buyer-section" style={{ marginTop: 36 }}>
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={22} className="text-amber-500 fill-amber-500 animate-pulse" />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033', margin: 0 }}>
              ⚡ Ưu Đãi Chớp Nhoáng & Flash Sale
            </h2>
            {flashDeals.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 20 }}>
                {flashDeals.length} sản phẩm giảm giá
              </span>
            )}
          </div>
        </div>

        {flashDeals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', background: '#fafaf9', borderRadius: 16, color: '#78716c', border: '1px dashed #e7e5e4' }}>
            <Flame size={32} style={{ margin: '0 auto 8px', color: '#f59e0b' }} />
            <p style={{ fontWeight: 700, fontSize: 14, color: '#44403c', margin: 0 }}>
              Hiện chưa có sản phẩm Flash Sale chớp nhoáng nào đang mở.
            </p>
            <p style={{ fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 12 }}>
              Các gian hàng sẽ sớm tung ra khung giờ vàng giá sốc. Bạn hãy lưu voucher trước để sẵn sàng săn sale nhé!
            </p>
            <button
              onClick={() => navigate('/vouchers')}
              style={{
                backgroundColor: '#008000',
                color: '#fff',
                padding: '6px 16px',
                borderRadius: 20,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Mở Kho Voucher
            </button>
          </div>
        ) : (
          <div className="buyer-grid-5">
            {flashDeals.map((fd) => {
              const isFav = favoritedProductIds.includes(fd.id);
              const isFlash = fd.badge === 'FLASH SALE';
              return (
                <div key={fd.id} className="buyer-card" onClick={() => navigate(`/product/${fd.id}`)}>
                  <div className="card-media">
                    <img src={fd.image} alt={fd.title} />
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      alignItems: 'flex-start',
                      zIndex: 3
                    }}>
                      {isFlash ? (
                        <span className="flash-sale-badge">
                          ⚡ FLASH SALE
                        </span>
                      ) : (
                        <span className="discount-tag" style={{ position: 'static' }}>
                          {fd.badge || 'ƯU ĐÃI'}
                        </span>
                      )}
                      {fd.discount && (
                        <span style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          color: '#fef08a',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backdropFilter: 'blur(4px)'
                        }}>
                          {fd.discount}
                        </span>
                      )}
                    </div>
                    <button
                      className="fav-overlay"
                      onClick={(e) => toggleFavorite(fd.id, fd.title, e)}
                      style={{ color: isFav ? '#e11d48' : '#888' }}
                    >
                      <Heart size={14} fill={isFav ? '#e11d48' : 'none'} />
                    </button>
                  </div>
                  <div className="card-info">
                    <h3>{fd.title}</h3>
                    <div className="price-row">
                      <span className="new-price" style={{ color: '#008000', fontWeight: 800 }}>
                        {fd.price.toLocaleString('vi-VN')}đ
                      </span>
                      {fd.oldPrice > fd.price && (
                        <span className="old-price" style={{ textDecoration: 'line-through', color: '#a8a29e' }}>
                          {fd.oldPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    {fd.couponCode && (
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: 4 }}>
                          ⚡ {fd.couponCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Discover Grid */}
      <section id="kham-pha" className="buyer-section" style={{ marginTop: 40 }}>
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033' }}>Tiếp tục khám phá</h2>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
            {displayProducts.length} kết quả
          </span>
        </div>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
            <p style={{ fontWeight: 650 }}>Đang tải sản phẩm...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
            <p style={{ fontWeight: 650 }}>Không tìm thấy sản phẩm phù hợp.</p>
          </div>
        ) : (
          <>
            <div className="buyer-grid-4">
              {paginatedProducts.map((p: any) => {
                const isFav = favoritedProductIds.includes(p.id);
                const flashDeal = flashSaleProductMap.get((p.id || p._id)?.toString());
                const isFlashSale = !!flashDeal;
                return (
                  <div key={p.id} className="buyer-card" onClick={() => navigate(`/product/${p.id}`, { state: { initialProduct: p } })}>
                    <div className="card-media">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300'} alt={p.title} />
                      {isFlashSale && (
                        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 3 }}>
                          <span className="flash-sale-badge">
                            ⚡ FLASH SALE
                          </span>
                        </div>
                      )}
                      <button
                        className="fav-overlay"
                        onClick={(e) => toggleFavorite(p.id, p.title || p.name, e)}
                        style={{ color: isFav ? '#e11d48' : '#888' }}
                      >
                        <Heart size={14} fill={isFav ? '#e11d48' : 'none'} />
                      </button>
                    </div>
                    <div className="card-info">
                      <h3>{p.title || p.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#007700' }}>
                          {(flashDeal ? flashDeal.price : p.price).toLocaleString('vi-VN')}đ
                        </p>
                        {flashDeal && flashDeal.oldPrice > flashDeal.price && (
                          <span style={{ fontSize: 11, textDecoration: 'line-through', color: '#a8a29e' }}>
                            {flashDeal.oldPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                        {!flashDeal && p.originalPrice && p.originalPrice > p.price && (
                          <span style={{ fontSize: 11, textDecoration: 'line-through', color: '#a8a29e' }}>
                            {p.originalPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </div>
                      {flashDeal?.couponCode && (
                        <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: 4, width: 'fit-content', marginTop: 3 }}>
                          ⚡ {flashDeal.couponCode}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16,
                marginTop: 28,
                marginBottom: 12
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: '1px solid #e7e5e4',
                    backgroundColor: '#fff',
                    color: currentPage === 1 ? '#a8a29e' : '#1c1917',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  &larr; Trước
                </button>

                <span style={{ fontSize: 13, fontWeight: 700, color: '#44403c' }}>
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: '1px solid #e7e5e4',
                    backgroundColor: '#fff',
                    color: currentPage === totalPages ? '#a8a29e' : '#1c1917',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  Sau &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* AI Recommendation Section */}
      <section className="buyer-section" style={{ marginTop: 40 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033' }}>✨ Gợi ý từ AI dựa trên sở thích của bạn</h2>
        </div>
        <div className="buyer-grid-4">
          {aiSuggestions.map((ai) => {
            const isFav = favoritedProductIds.includes(ai.id);
            return (
              <div key={ai.id} className="buyer-card" onClick={() => navigate(`/product/${ai.id}`)}>
                <div className="card-media">
                  <img src={ai.image} alt={ai.title} />
                  <button
                    className="fav-overlay"
                    onClick={(e) => toggleFavorite(ai.id, ai.title, e)}
                    style={{ color: isFav ? '#e11d48' : '#888' }}
                  >
                    <Heart size={14} fill={isFav ? '#e11d48' : 'none'} />
                  </button>
                </div>
                <div className="card-info">
                  <h3>{ai.title}</h3>
                  <div className="stars-row" style={{ display: 'flex', gap: 2, margin: '4px 0' }}>
                    {[...Array(ai.rating)].map((_, s) => (
                      <Star key={s} size={12} className="star-icon" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                    ))}
                  </div>
                  <p className="price-tag">{ai.price.toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Followed Shop Updates Section */}
      <section className="buyer-section" style={{ marginTop: 40 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033' }}>Cập nhật từ gian hàng bạn theo dõi</h2>
        </div>
        <div className="buyer-grid-3">
          {subbedShops.map((shop, i) => (
            <div key={i} className="shop-update-card">
              <div className="shop-head" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={shop.image} alt={shop.name} className="shop-avatar" style={{ border: '1px solid #ebd0eb' }} />
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{shop.name}</h3>
                  <p style={{ fontSize: 11, color: '#666', margin: 0 }}>{shop.caption}</p>
                </div>
              </div>
              <div className="shop-thumbnails">
                {shop.thumbnails.map((t, idx) => (
                  <img key={idx} src={t} alt="thumbnail" />
                ))}
              </div>
              <button
                className="shop-view-btn"
                onClick={() => navigate('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>Xem bộ sưu tập mới</span>
                <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Styles Discovery Section */}
      <section id="collections-section" className="buyer-section pb-12" style={{ marginTop: 40, marginBottom: 40 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033' }}>Khám phá các phong cách mới</h2>
        </div>
        <div className="buyer-grid-3">
          <div className="style-card text-card-1" onClick={() => navigate('/')}>
            <img src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400" alt="Vẻ Đẹp Đương Đại" />
            <div className="style-overlay">
              <h3>Vẻ Đẹp Đương Đại</h3>
            </div>
          </div>
          <div className="style-card text-card-2" onClick={() => navigate('/')}>
            <img src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400" alt="Góc Làm Việc Tối Giản" />
            <div className="style-overlay">
              <h3>Góc Làm Việc Tối Giản</h3>
            </div>
          </div>
          <div className="style-card text-card-3" onClick={() => navigate('/')}>
            <img src="https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=400" alt="Nghệ Thuật Đường Phố" />
            <div className="style-overlay">
              <h3>Nghệ Thuật Đường Phố</h3>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BuyerDashboard;
