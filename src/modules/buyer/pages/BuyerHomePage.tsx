import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Heart, Star, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { promotionService } from '../../promotion/services/promotionService';
import { userService } from '../../user/services/userService';
import '../../../shared/components/layouts.css';

export function BuyerDashboard({ user }: { user: any; onLogout?: () => void }) {
  const navigate = useNavigate();
  const outletContext = useOutletContext<any>() || {};
  const search = outletContext.search || '';

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [shopList, setShopList] = useState<any[]>([]);
  const [couponList, setCouponList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'quan-tam' | 'gan-day' | 'theo-doi' | 'khuyen-mai' | 'Thinh-hanh'>('gan-day');
  const [favoritedProductIds, setFavoritedProductIds] = useState<string[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const name = user?.full_name || user?.name || '';

  // Load favorites from backend API (with localStorage fallback)
  useEffect(() => {
    userService.getWishlist()
      .then((ids) => {
        setFavoritedProductIds(ids);
        localStorage.setItem('vietcraft_favorites', JSON.stringify(ids));
      })
      .catch(() => {
        // Fallback: try localStorage
        try {
          const stored = localStorage.getItem('vietcraft_favorites');
          if (stored) setFavoritedProductIds(JSON.parse(stored));
        } catch {}
      });
    const vls = localStorage.getItem('vietcraft_saved_vouchers');
    if (vls) {
      try { setSavedVouchers(JSON.parse(vls)); } catch (e) {}
    }

    // Fetch products, shops, coupons in parallel
    setIsLoading(true);
    Promise.all([
      productsService.getAll().catch((err) => { console.error('Failed to fetch products', err); return []; }),
      productsService.getFeaturedShops().catch((err) => { console.error('Failed to fetch shops', err); return []; }),
      promotionService.getAll().catch((err) => { console.error('Failed to fetch coupons', err); return []; }),
    ]).then(([products, shops, coupons]) => {
      setAllProducts(products || []);
      setShopList(shops || []);
      setCouponList(coupons || []);
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
    try {
      let updated: string[];
      if (favoritedProductIds.includes(productId)) {
        updated = await userService.removeFromWishlist(productId);
        triggerToast(`Đã xóa "${title}" khỏi danh sách yêu thích`, 'info');
      } else {
        updated = await userService.addToWishlist(productId);
        triggerToast(`Đã thêm "${title}" vào danh sách yêu thích`, 'success');
      }
      setFavoritedProductIds(updated);
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      console.error('toggleFavorite failed', err);
      triggerToast('Không thể cập nhật yêu thích, vui lòng thử lại.', 'info');
    }
  };

  const toggleVoucher = (voucherCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated: string[];
    if (savedVouchers.includes(voucherCode)) {
      updated = savedVouchers.filter(code => code !== voucherCode);
      triggerToast(`Đã hủy lưu mã ${voucherCode}`, 'info');
    } else {
      updated = [...savedVouchers, voucherCode];
      triggerToast(`Lưu mã ưu đãi ${voucherCode} thành công!`, 'success');
    }
    setSavedVouchers(updated);
    localStorage.setItem('vietcraft_saved_vouchers', JSON.stringify(updated));
  };

  // Map vouchers from Backend Coupon documents
  const vouchers = couponList.map((v: any) => {
    const val = v.discount_value?.$numberDecimal ? parseFloat(v.discount_value.$numberDecimal) : parseFloat(v.discount_value || 0);
    const minVal = v.min_order_value?.$numberDecimal ? parseFloat(v.min_order_value.$numberDecimal) : parseFloat(v.min_order_value || 0);

    let displayValue = '';
    if (v.discount_type === 'PERCENTAGE') {
      displayValue = `GIẢM ${val}%`;
    } else {
      displayValue = val >= 1000000 ? `GIẢM ${(val / 1000000).toLocaleString('vi-VN')} TRƯ` : `GIẢM ${(val / 1000).toLocaleString('vi-VN')}K`;
      if (v.code === 'VCPFREE') {
        displayValue = 'FREESHIP';
      }
    }

    let conditionLabel = 'Mọi đơn hàng';
    if (minVal > 0) {
      conditionLabel = minVal >= 1000000 ? `Đơn tối thiểu ${minVal / 1000000} triệu` : `Đơn tối thiểu ${(minVal / 1000)}K`;
    }

    return {
      code: v.code,
      value: displayValue,
      condition: conditionLabel
    };
  });

  // Dynamic products for Flash Deals and AI Suggestions
  const flashDeals = allProducts.slice(0, 5).map((p: any, idx: number) => {
    const discountPct = 10 * (idx + 2); // e.g. -20%, -30%, -40%...
    const oldPrice = Math.round(p.price / (1 - discountPct / 100));
    return {
      id: p.id,
      title: p.title,
      price: p.price,
      oldPrice: oldPrice,
      discount: `-${discountPct}%`,
      image: p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300'
    };
  });

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

  // Filter based on Search query
  const searchedProducts = allProducts.filter((p: any) =>
    (p.title || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  // Filter based on Active Tab selector
  const getTabFilteredProducts = () => {
    switch (activeTab) {
      case 'quan-tam':
        // Filter by favorites
        const favItems = searchedProducts.filter((p: any) => favoritedProductIds.includes(p.id));
        return favItems;
      case 'gan-day':
        // Mock recently viewed
        return searchedProducts.slice(0, 5);
      case 'theo-doi':
        // Shuffled or specific products from followed shops
        return [...searchedProducts].reverse().slice(0, 5);
      case 'khuyen-mai':
        // Show flashDeals mapped to standard product format
        return flashDeals.map(fd => ({
          id: fd.id,
          title: fd.title,
          price: fd.price,
          images: [fd.image]
        }));
      case 'Thinh-hanh':
        const matches = searchedProducts.filter(p =>
          (p.title || '').toLowerCase().includes('thịnh hành') ||
          (p.title || '').toLowerCase().includes('gốm') ||
          (p.title || '').toLowerCase().includes('tranh')
        );
        return matches.length > 0 ? matches : searchedProducts.slice(1, 5);
      default:
        return searchedProducts;
    }
  };

  const displayProducts = getTabFilteredProducts();

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

      {/* Intro Banner */}
      <div className="buyer-intro-banner" style={{ background: 'transparent', textAlign: 'center', padding: '24px 0 12px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#330033' }}>Chào mừng trở lại, {name}!</h1>
      </div>

      {/* Tab Pills */}
      <div className="buyer-tab-pills" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
        <button
          className={activeTab === 'quan-tam' ? 'active' : ''}
          onClick={() => setActiveTab('quan-tam')}
          style={{
            padding: '8px 20px',
            borderRadius: 50,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'quan-tam' ? '#008000' : '#f5f5f4',
            color: activeTab === 'quan-tam' ? '#fff' : '#44403c',
            transition: 'all 0.2s'
          }}
        >
          Đã quan tâm
        </button>
        <button
          className={activeTab === 'gan-day' ? 'active' : ''}
          onClick={() => setActiveTab('gan-day')}
          style={{
            padding: '8px 20px',
            borderRadius: 50,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'gan-day' ? '#008000' : '#f5f5f4',
            color: activeTab === 'gan-day' ? '#fff' : '#44403c',
            transition: 'all 0.2s'
          }}
        >
          Đã xem gần đây
        </button>
        <button
          className={activeTab === 'theo-doi' ? 'active' : ''}
          onClick={() => setActiveTab('theo-doi')}
          style={{
            padding: '8px 20px',
            borderRadius: 50,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'theo-doi' ? '#008000' : '#f5f5f4',
            color: activeTab === 'theo-doi' ? '#fff' : '#44403c',
            transition: 'all 0.2s'
          }}
        >
          Shop đang theo dõi
        </button>
        <button
          className={activeTab === 'khuyen-mai' ? 'active' : ''}
          onClick={() => setActiveTab('khuyen-mai')}
          style={{
            padding: '8px 20px',
            borderRadius: 50,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'khuyen-mai' ? '#008000' : '#f5f5f4',
            color: activeTab === 'khuyen-mai' ? '#fff' : '#44403c',
            transition: 'all 0.2s'
          }}
        >
          Khuyến mãi
        </button>
        <button
          className={activeTab === 'Thinh-hanh' ? 'active' : ''}
          onClick={() => setActiveTab('Thinh-hanh')}
          style={{
            padding: '8px 20px',
            borderRadius: 50,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: activeTab === 'Thinh-hanh' ? '#008000' : '#f5f5f4',
            color: activeTab === 'Thinh-hanh' ? '#fff' : '#44403c',
            transition: 'all 0.2s'
          }}
        >
          Thịnh hành
        </button>
      </div>

      {/* Main Discover Grid */}
      <section className="buyer-section pt-4">
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
            <p style={{ fontWeight: 650 }}>Không tìm thấy sản phẩm phù hợp ở danh mục này.</p>
          </div>
        ) : (
          <div className="buyer-grid-5">
            {displayProducts.map((p: any) => {
              const isFav = favoritedProductIds.includes(p.id);
              return (
                <div key={p.id} className="buyer-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="card-media">
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300'} alt={p.title} />
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
                    <p style={{ margin: 0, fontWeight: 700, color: '#007700' }}>
                      {p.price.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Unique Vouchers Voucher Section */}
      <section className="buyer-section" style={{ marginTop: 40 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033' }}>Ưu đãi dành riêng cho bạn</h2>
        </div>
        <div className="buyer-grid-4">
          {vouchers.map((v, i) => {
            const isSaved = savedVouchers.includes(v.code);
            return (
              <div key={i} className="voucher-card" style={{
                backgroundColor: isSaved ? '#f5f5f4' : '#fff8f8',
                borderColor: isSaved ? '#e7e5e4' : '#fca5a5'
              }}>
                <div className="voucher-content">
                  <span className="voucher-title" style={{ color: isSaved ? '#57534e' : '#cc1111' }}>{v.value}</span>
                  <span className="voucher-desc">{v.condition}</span>
                </div>
                <button
                  className="voucher-btn"
                  onClick={(e) => toggleVoucher(v.code, e)}
                  style={{
                    backgroundColor: isSaved ? '#a8a29e' : '#cc1111',
                    color: '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSaved ? 'Đã lưu' : 'Lưu mã'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Flash Deals Section */}
      <section className="buyer-section" style={{ marginTop: 40 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033' }}>⚡ Ưu đãi chớp nhoáng</h2>
        </div>
        <div className="buyer-grid-5">
          {flashDeals.map((fd) => {
            const isFav = favoritedProductIds.includes(fd.id);
            return (
              <div key={fd.id} className="buyer-card" onClick={() => navigate(`/product/${fd.id}`)}>
                <div className="card-media">
                  <img src={fd.image} alt={fd.title} />
                  <span className="discount-tag">{fd.discount}</span>
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
                    <span className="new-price">{fd.price.toLocaleString('vi-VN')}đ</span>
                    <span className="old-price">{fd.oldPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
      <section className="buyer-section pb-12" style={{ marginTop: 40, marginBottom: 40 }}>
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
