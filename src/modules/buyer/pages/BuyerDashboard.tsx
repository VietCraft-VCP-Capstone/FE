import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Star, MessageCircle } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { favoritesService } from '../../product/services/favoritesService';
import { cartService } from '../../order/services/cartService';
import { ProductCard } from '../../../shared/components/ProductCard';
import '../../../shared/components/layouts.css';

export function BuyerDashboard({ user, onLogout }: { user?: any; onLogout?: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    productsService.getAll().then((data) => {
      if (Array.isArray(data)) setProducts(data.slice(0, 8));
    }).catch(() => {});

    favoritesService.getFavorites().then((data) => {
      if (data && Array.isArray(data.product_ids)) {
        setFavoriteIds(data.product_ids.map((p: any) => p._id || p));
      }
    }).catch(() => {});

    cartService.getCart().then((data) => {
      if (data && Array.isArray(data.items)) {
        const totalQty = data.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(totalQty);
      }
    }).catch(() => {});

    const handleCartUpdate = (e: any) => {
      if (e.detail && typeof e.detail.count === 'number') {
        setCartCount(e.detail.count);
      }
    };

    window.addEventListener('vietcraft-cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('vietcraft-cart-updated', handleCartUpdate);
    };
  }, []);

  const handleToggleFavorite = async (productId: string) => {
    const isCurrentlyFav = favoriteIds.includes(productId);
    if (isCurrentlyFav) {
      setFavoriteIds((prev) => prev.filter((id) => id !== productId));
    } else {
      setFavoriteIds((prev) => [...prev, productId]);
    }

    try {
      await favoritesService.toggleFavorite(productId);
    } catch (e) {
      console.error('Failed to sync favorite to DB:', e);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await cartService.addToCart({ productId, quantity: 1 });
      alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    } catch (e) {
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    }
  };

  const name = user?.name || 'Nhi';

  const vouchers = [
    { value: 'GIẢM 50K', condition: 'Đơn tối thiểu 200K' },
    { value: 'FREESHIP', condition: 'Mọi đơn hàng' },
    { value: 'GIẢM 100K', condition: 'Đơn tối thiểu 1 triệu' },
    { value: 'ƯU ĐÃI 10%', condition: 'Mọi đơn hàng' },
  ];

  const demoProducts = [
    { id: '650000000000000000000101', title: 'Túi Tote Thêu Tay Họa Tiết Hoa Cúc', price: 250000, originalPrice: 350000, rating: 4.9, salesCount: 85, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400', productType: 'READY_TO_SHIP' },
    { id: '650000000000000000000102', title: 'Set Nến Thơm Tinh Dầu Thiên Nhiên', price: 350000, originalPrice: 420000, rating: 5.0, salesCount: 140, image: 'https://images.unsplash.com/photo-1603006905393-c910e859b89f?auto=format&fit=crop&w=400', productType: 'POD_TEMPLATE' },
    { id: '650000000000000000000103', title: 'Bộ Tranh Decor Đèn Gỗ Khắc Tên', price: 480000, originalPrice: 550000, rating: 4.8, salesCount: 62, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=400', productType: 'CUSTOM_DESIGN_REQUEST' },
    { id: '650000000000000000000104', title: 'Ốp Lưng Macrame Đan Thủ Công', price: 120000, originalPrice: 180000, rating: 4.7, salesCount: 95, image: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=400', productType: 'READY_TO_SHIP' },
  ];

  const flashDeals = [
    { id: 'fd1', title: 'Cốc Sứ Họa Tiết Hoa Sen', price: 150000, oldPrice: 200000, discount: '-25%', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400' },
    { id: 'fd2', title: 'Khăn Thêu Thổ Cẩm Sapa', price: 220000, oldPrice: 300000, discount: '-27%', image: 'https://images.unsplash.com/photo-1606760227091-3dd858d9721d?auto=format&fit=crop&w=400' },
  ];

  const aiSuggestions = [
    { title: 'Đèn Ngủ Gỗ Khắc Hoa Văn', rating: 5, price: 320000, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400' },
    { title: 'Tượng Gốm Chibi Trang Trí', rating: 5, price: 180000, image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=400' },
  ];

  const subbedShops = [
    { name: 'Gốm Mộc Studio', caption: 'Mới cập nhật 3 sản phẩm', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200', thumbnails: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=200', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200'] },
  ];

  return (
    <div className="buyer-dashboard-page">
      <header className="buyer-header-nav">
        <div className="buyer-header-container">
          <div className="buyer-logo">
            <span className="logo-green">Viet</span><span className="logo-purple">Craft</span>
          </div>
          <nav className="buyer-nav-menu">
            <a href="#kham-pha">Khám Phá</a>
            <a href="#qua-tang">Quà Tặng</a>
            <a href="#bo-suu-tap">Bộ Sưu Tập</a>
            <a href="#duoi-100k">Dưới 100k</a>
          </nav>
          <div className="buyer-search-bar">
            <Search className="search-icon" size={16} />
            <input type="text" placeholder="Tìm kiếm thiết kế, nghệ thuật, quà tặng..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="buyer-actions">
            <Link to="/favorites" className="icon-btn relative" title="Danh sách yêu thích">
              <Heart size={20} />
              {favoriteIds.length > 0 && <span className="badge">{favoriteIds.length}</span>}
            </Link>
            <Link to="/cart" className="icon-btn relative" title="Giỏ hàng">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
            <button className="icon-btn"><Heart size={20} /></button>
            <button className="icon-btn relative"><ShoppingBag size={20} /><span className="badge">0</span></button>
            <button className="icon-btn" title="Tin nhắn"><MessageCircle size={20} /></button>
            <button className="buyer-avatar" onClick={onLogout} title="Đăng xuất">{name[0].toUpperCase()}</button>
          </div>
        </div>
      </header>

      <main className="buyer-main-content">
        <div className="buyer-wrapper">
          <div className="buyer-intro-banner"><h1>Chào mừng trở lại, {name}!</h1></div>
          <div className="buyer-tab-pills">
            <button className="active">Đã quan tâm</button>
            <button>Đã xem gần đây</button>
            <button>Shop đang theo dõi</button>
            <button>Khuyến mãi</button>
            <button>Trầm hương</button>
          </div>

          {/* Section 1: Top Products Grid */}
          <section className="buyer-section pt-4">
            <div className="section-head"><h2>✨ Khám phá sản phẩm nổi bật</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(products.length > 0 ? products : demoProducts).map((p: any) => (
                <ProductCard
                  key={p.id || p._id}
                  id={p.id || p._id}
                  title={p.title}
                  price={p.price || p.retail_price || 250000}
                  originalPrice={p.originalPrice || 350000}
                  rating={p.rating || 4.9}
                  salesCount={p.salesCount || 120}
                  imageUrl={p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400'}
                  shopName="VietCraft Artisan"
                  productType={p.productType || 'READY_TO_SHIP'}
                  isFavorite={favoriteIds.includes(p.id || p._id)}
                  onToggleFavorite={handleToggleFavorite}
                  onAddToCart={() => handleAddToCart(p.id || p._id)}
                />
              ))}
            </div>
          </section>

          {/* Section 2: Vouchers */}
          <section className="buyer-section mt-8">
            <div className="section-head"><h2>🎁 Ưu đãi dành riêng cho bạn</h2></div>
            <div className="buyer-grid-4">
              {vouchers.map((v, i) => (
                <div key={i} className="voucher-card">
                  <div className="voucher-content"><span className="voucher-title">{v.value}</span><span className="voucher-desc">{v.condition}</span></div>
                  <button className="voucher-btn">Lưu mã</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
          <section className="buyer-section">
            <div className="section-head"><h2>⚡ Ưu đãi chớp nhoáng</h2></div>
            <div className="buyer-grid-5">
              {flashDeals.map((fd) => (
                <div key={fd.id} className="buyer-card">
                  <div className="card-media">
                    <img src={fd.image} alt={fd.title} />
                    <span className="discount-tag">{fd.discount}</span>
                    <button className="fav-overlay"><Heart size={14} /></button>
                  </div>
                  <div className="card-info">
                    <h3>{fd.title}</h3>
                    <div className="price-row"><span className="new-price">{fd.price.toLocaleString('vi-VN')}đ</span><span className="old-price">{fd.oldPrice.toLocaleString('vi-VN')}đ</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="buyer-section">
            <div className="section-head"><h2>✨ Gợi ý từ AI dựa trên sở thích của bạn</h2></div>
            <div className="buyer-grid-4">
              {aiSuggestions.map((ai, i) => (
                <div key={i} className="buyer-card">
                  <div className="card-media"><img src={ai.image} alt={ai.title} /></div>
                  <div className="card-info">
                    <h3>{ai.title}</h3>
                    <div className="stars-row">{[...Array(ai.rating)].map((_, s) => <Star key={s} size={12} className="star-icon fill-amber-500 text-amber-500" />)}</div>
                    <p className="price-tag">{ai.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="buyer-section">
            <div className="section-head"><h2>Cập nhật từ gian hàng bạn theo dõi</h2></div>
            <div className="buyer-grid-3">
              {subbedShops.map((shop, i) => (
                <div key={i} className="shop-update-card">
                  <div className="shop-head">
                    <img src={shop.image} alt={shop.name} className="shop-avatar" />
                    <div><h3>{shop.name}</h3><p>{shop.caption}</p></div>
                  </div>
                  <div className="shop-thumbnails">{shop.thumbnails.map((t, idx) => <img key={idx} src={t} alt="thumbnail" />)}</div>
                  <button className="shop-view-btn">Xem bộ sưu tập mới</button>
                </div>
              ))}
            </div>
          </section>
          <section className="buyer-section pb-12">
            <div className="section-head"><h2>Khám phá các phong cách mới</h2></div>
            <div className="buyer-grid-3">
              <div className="style-card text-card-1">
                <img src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400" alt="Vẻ Đẹp Đương Đại" />
                <div className="style-overlay"><h3>Vẻ Đẹp Đương Đại</h3></div>
              </div>
              <div className="style-card text-card-2">
                <img src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400" alt="Góc Làm Việc Tối Giản" />
                <div className="style-overlay"><h3>Góc Làm Việc Tối Giản</h3></div>
              </div>
              <div className="style-card text-card-3">
                <img src="https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=400" alt="Nghệ Thuật Đường Phố" />
                <div className="style-overlay"><h3>Nghệ Thuật Đường Phố</h3></div>
              </div>
            </div>
          </section>
    </div>
  );
}
