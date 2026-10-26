import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { productsService } from '../../../product/services/productsService';
import { favoritesService } from '../../../product/services/favoritesService';
import { isLoggedIn } from '../../../../infrastructure/api/interceptors';
import { getRecentSearches } from '../search/recentSearchStorage';

const LIMIT = 8;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1603006905393-c910e859b89f?auto=format&fit=crop&w=300';

const BADGE_POS = { position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', zIndex: 3 } as const;
const PCT_STYLE = { backgroundColor: 'rgba(0, 0, 0, 0.75)', color: '#fef08a', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)' };

export function ForYouSection({ deals }: { deals: Map<string, any> }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    productsService.getForYou(LIMIT, getRecentSearches())
      .then((list) => { if (alive) setItems(list); })
      .finally(() => { if (alive) setLoading(false); });
    if (isLoggedIn()) {
      favoritesService.getFavoriteIds().then((ids) => { if (alive) setFavIds(ids); });
    }
    return () => { alive = false; };
  }, [visible]);

  if (!loading && items.length === 0) return null;

  const toggleFav = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    try {
      const res = await favoritesService.toggleFavorite(id);
      setFavIds((prev) => (res.isFavorite ? [...prev, id] : prev.filter((x) => x !== id)));
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      console.error('toggleFavorite failed', err);
    }
  };

  return (
    <section ref={ref} className="buyer-section" style={{ marginTop: 40 }}>
      <div className="section-head" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#330033' }}>✨ Gợi ý từ AI dựa trên sở thích của bạn</h2>
      </div>
      <div className="buyer-grid-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="buyer-card animate-pulse" style={{ height: 260, background: '#f5f5f4' }} />
            ))
          : items.map((p: any) => {
              const isFav = favIds.includes(p.id);
              const deal = deals.get(String(p.id || p._id));
              const isFlashSale = deal?.badge === 'FLASH SALE';
              return (
                <div key={p.id} className="buyer-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="card-media">
                    <img src={p.images?.[0] || FALLBACK_IMG} alt={p.title} />
                    {deal && (
                      <div style={BADGE_POS}>
                        {isFlashSale
                          ? <span className="flash-sale-badge">⚡ FLASH SALE</span>
                          : <span className="discount-tag" style={{ position: 'static' }}>{deal.badge || 'ƯU ĐÃI'}</span>}
                        {deal.discount && <span style={PCT_STYLE}>{deal.discount}</span>}
                      </div>
                    )}
                    <button
                      className="fav-overlay"
                      onClick={(e) => toggleFav(p.id, e)}
                      style={{ color: isFav ? '#e11d48' : '#888' }}
                    >
                      <Heart size={14} fill={isFav ? '#e11d48' : 'none'} />
                    </button>
                  </div>
                  <div className="card-info">
                    <h3>{p.title || p.name}</h3>
                    <div className="price-row">
                      <span className="new-price" style={{ color: '#008000', fontWeight: 800 }}>{((deal ? deal.price : p.price) || 0).toLocaleString('vi-VN')}đ</span>
                      {deal && deal.oldPrice > deal.price && (
                        <span className="old-price" style={{ textDecoration: 'line-through', color: '#a8a29e' }}>{deal.oldPrice.toLocaleString('vi-VN')}đ</span>
                      )}
                    </div>
                    {p.reason && (
                      <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '1px 6px', borderRadius: 4, width: 'fit-content', marginTop: 4 }}>
                        {p.reason}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
