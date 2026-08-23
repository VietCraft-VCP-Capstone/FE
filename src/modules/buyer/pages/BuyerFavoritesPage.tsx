import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, ShoppingBag, XCircle, Search, SlidersHorizontal } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { userService } from '../../user/services/userService';
import '../../../shared/components/layouts.css';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

export function BuyerFavoritesPage() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Filter & sort state
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [maxPrice, setMaxPrice] = useState<number>(Infinity);
  const [showFilters, setShowFilters] = useState(false);

  const PRICE_FILTERS: { label: string; value: number }[] = [
    { label: 'Tất cả', value: Infinity },
    { label: 'Dưới 500K', value: 500000 },
    { label: 'Dưới 1 triệu', value: 1000000 },
    { label: 'Dưới 2 triệu', value: 2000000 },
  ];

  const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Mặc định', value: 'default' },
    { label: 'Giá tăng dần', value: 'price-asc' },
    { label: 'Giá giảm dần', value: 'price-desc' },
    { label: 'Tên A→Z', value: 'name-asc' },
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, ids] = await Promise.all([
          productsService.getAll(),
          userService.getWishlist()
        ]);
        const prodList = Array.isArray(productsRes) ? productsRes : ((productsRes as any)?.items || []);
        setAllProducts(prodList);
        setWishlistIds(ids);
        localStorage.setItem('vietcraft_favorites', JSON.stringify(ids));
      } catch (err) {
        console.error('Failed to load wishlist or products', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const favoriteProducts = useMemo(() => {
    let list = allProducts.filter((p: any) =>
      wishlistIds.includes(p.id) || wishlistIds.includes(p._id?.toString())
    );

    // Text search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((p: any) => (p.title || '').toLowerCase().includes(q));
    }

    // Price filter
    if (maxPrice !== Infinity) {
      list = list.filter((p: any) => (p.price || 0) <= maxPrice);
    }

    // Sort
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price-desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'name-asc') list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    return list;
  }, [allProducts, wishlistIds, searchText, maxPrice, sortBy]);

  const removeFavorite = async (productId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await userService.removeFromWishlist(productId);
      setWishlistIds(updated);
      localStorage.setItem('vietcraft_favorites', JSON.stringify(updated));
      showToast(`Đã xóa "${title}" khỏi yêu thích`);
    } catch (err) {
      console.error('removeFromWishlist failed', err);
    }
  };

  const totalFavCount = allProducts.filter((p: any) =>
    wishlistIds.includes(p.id) || wishlistIds.includes(p._id?.toString())
  ).length;

  return (
    <div className="buyer-wrapper" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '60vh' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          backgroundColor: '#fff', borderLeft: '4px solid #cc1111',
          padding: '12px 20px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <XCircle size={20} color="#cc1111" strokeWidth={2.5} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#444' }}>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#330033', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart size={22} fill="#e11d48" color="#e11d48" /> Sản phẩm yêu thích
        </h1>
        <span style={{ fontSize: 14, color: '#888' }}>({totalFavCount} sản phẩm)</span>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#fff', border: '1px solid #f0edf0', borderRadius: 12,
        padding: '12px 16px', marginBottom: 24, display: 'flex',
        alignItems: 'center', gap: 12, flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            placeholder="Tìm trong yêu thích..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: '1px solid #ebd0eb', borderRadius: 50,
              fontSize: 13, outline: 'none', background: '#fcfcfc',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Price filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRICE_FILTERS.map(f => (
            <button
              key={f.label}
              type="button"
              onClick={() => setMaxPrice(f.value)}
              style={{
                padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', border: 'none',
                backgroundColor: maxPrice === f.value ? '#008000' : '#f5f5f4',
                color: maxPrice === f.value ? '#fff' : '#555',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort toggle button */}
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', border: '1px solid #ebd0eb',
            backgroundColor: showFilters ? '#330033' : '#fff', color: showFilters ? '#fff' : '#330033',
            transition: 'all 0.2s'
          }}
        >
          <SlidersHorizontal size={13} /> Sắp xếp
        </button>

        {/* Sort options (shown when expanded) */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%' }}>
            {SORT_OPTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => { setSortBy(s.value); setShowFilters(false); }}
                style={{
                  padding: '6px 14px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  backgroundColor: sortBy === s.value ? '#330033' : '#f0edf0',
                  color: sortBy === s.value ? '#fff' : '#555',
                  transition: 'all 0.2s'
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
          <p style={{ fontSize: 16 }}>Đang tải sản phẩm yêu thích...</p>
        </div>
      ) : totalFavCount === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          border: '2px dashed #ebd0eb', borderRadius: 16, color: '#bbb'
        }}>
          <Heart size={48} style={{ marginBottom: 16, color: '#ebd0eb' }} />
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Chưa có sản phẩm yêu thích</p>
          <p style={{ fontSize: 14, marginBottom: 24 }}>Nhấn vào icon ❤️ trên sản phẩm để thêm vào danh sách yêu thích.</p>
          <button type="button" onClick={() => navigate('/')}
            style={{
              backgroundColor: '#008000', color: '#fff', border: 'none',
              borderRadius: 50, padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>
            Khám phá sản phẩm
          </button>
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
          <Search size={40} style={{ marginBottom: 12, color: '#ddd' }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>Không tìm thấy sản phẩm phù hợp</p>
          <p style={{ fontSize: 13 }}>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
            Hiển thị {favoriteProducts.length}/{totalFavCount} sản phẩm
          </p>
          <div className="buyer-grid-4">
            {favoriteProducts.map((p: any) => (
              <div
                key={p.id || p._id}
                className="buyer-card"
                onClick={() => navigate(`/product/${p.id || p._id}`)}
              >
                <div className="card-media">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400'}
                    alt={p.title}
                  />
                  <button
                    className="fav-overlay"
                    type="button"
                    onClick={(e) => removeFavorite(p.id || p._id, p.title, e)}
                    title="Xóa khỏi yêu thích"
                    style={{ color: '#e11d48' }}
                  >
                    <Heart size={14} fill="#e11d48" />
                  </button>
                </div>
                <div className="card-info">
                  <h3>{p.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span className="new-price">{(p.price || 0).toLocaleString('vi-VN')}đ</span>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); navigate('/cart'); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: '#008000', color: '#fff', border: 'none',
                        borderRadius: 50, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                      }}>
                      <ShoppingBag size={12} /> Thêm giỏ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default BuyerFavoritesPage;
