import { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, Star, MessageCircle } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import '../../../shared/components/layouts.css';

export function BuyerDashboard({ user }: { user: any; onLogout: () => void }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    productsService.getAll().then((data) => { setProducts(data.slice(0, 5)); });
  }, []);

  const name = user?.name || 'Nhi';

  const vouchers = [
    { value: 'GIẢM 50K', condition: 'Đơn tối thiểu 200K' },
    { value: 'FREESHIP', condition: 'Mọi đơn hàng' },
    { value: 'GIẢM 100K', condition: 'Đơn tối thiểu 1 triệu' },
    { value: 'ƯU ĐÃI 10%', condition: 'Mọi đơn hàng' },
  ];
  const flashDeals = [
    { id: 1, title: 'Áo Thun Typography', price: 200000, oldPrice: 350000, discount: '-42%', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300' },
    { id: 2, title: 'Túi Tote Vải Canvas', price: 120000, oldPrice: 220000, discount: '-45%', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300' },
    { id: 3, title: 'Ốp Lưng Macrame', price: 80000, oldPrice: 120000, discount: '-33%', image: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=300' },
    { id: 4, title: 'Mũ Lưỡi Trai Thêu', price: 150000, oldPrice: 300000, discount: '-50%', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300' },
    { id: 5, title: 'Tranh Canvas Mini', price: 240000, oldPrice: 480000, discount: '-50%', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=300' },
  ];
  const aiSuggestions = [
    { title: 'Set Nến Thơm Thư Giãn', price: 350000, rating: 5, image: 'https://images.unsplash.com/photo-1603006905393-c910e859b89f?auto=format&fit=crop&w=300' },
    { title: 'Bộ Tranh Decor Phòng Khách', price: 1200000, rating: 5, image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300' },
    { title: 'Bộ Ấm Chén Trà Men', price: 890000, rating: 5, image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300' },
    { title: 'Cặp Sổ Da Cao Cấp', price: 750000, rating: 5, image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300' },
  ];
  const subbedShops = [
    { name: 'Studio Gốm Mộc', caption: 'Đã thêm 5 sản phẩm mới', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=200', thumbnails: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=150', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=150', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=150'] },
    { name: 'Xưởng In Sài Gòn', caption: 'Đã thêm 3 sản phẩm mới', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=200', thumbnails: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=150', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=150', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=150'] },
    { name: 'Tiệm Tranh Ký Ức', caption: 'Đã thêm 6 sản phẩm mới', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200', thumbnails: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150'] },
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
          <section className="buyer-section pt-4">
            <div className="section-head"><h2>Tiếp tục khám phá</h2></div>
            <div className="buyer-grid-5">
              {products.length > 0 ? products.map((p: any) => (
                <div key={p.id} className="buyer-card">
                  <div className="card-media">
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300'} alt={p.title} />
                    <button className="fav-overlay"><Heart size={14} /></button>
                  </div>
                  <div className="card-info"><h3>{p.title}</h3><p>{p.price.toLocaleString('vi-VN')}đ</p></div>
                </div>
              )) : [1,2,3,4,5].map((idx) => (
                <div key={idx} className="buyer-card">
                  <div className="card-media">
                    <img src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300" alt="Sản phẩm" />
                    <button className="fav-overlay"><Heart size={14} /></button>
                  </div>
                  <div className="card-info"><h3>Sản phẩm mỹ nghệ #{idx}</h3><p>250.000đ</p></div>
                </div>
              ))}
            </div>
          </section>
          <section className="buyer-section">
            <div className="section-head"><h2>Ưu đãi dành riêng cho bạn</h2></div>
            <div className="buyer-grid-4">
              {vouchers.map((v, i) => (
                <div key={i} className="voucher-card">
                  <div className="voucher-content"><span className="voucher-title">{v.value}</span><span className="voucher-desc">{v.condition}</span></div>
                  <button className="voucher-btn">Lưu mã</button>
                </div>
              ))}
            </div>
          </section>
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
