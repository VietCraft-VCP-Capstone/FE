import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsService } from '../../../product/services/productsService';
import { getRecentSearches } from '../search/recentSearchStorage';
import { HomeProductCard, HomeProductSkeleton } from './HomeProductCard';
import { useDealLookup } from '../../hooks/useDealLookup';

const LIMIT = 8;

interface ForYouSectionProps {
  favIds: string[];
  onToggleFav: (id: string, title: string, e: MouseEvent) => void;
  /** Tiêu đề khối do trang chủ dựng để đồng bộ kiểu chữ. */
  renderHead: (title: string, note?: ReactNode) => ReactNode;
}

/** Gợi ý theo lịch sử xem / tìm kiếm của người dùng; chỉ tải khi cuộn tới gần. */
export function ForYouSection({ favIds, onToggleFav, renderHead }: ForYouSectionProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const deals = useDealLookup(items.map((p: any) => String(p.id || p._id)));

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
    return () => { alive = false; };
  }, [visible]);

  if (visible && !loading && items.length === 0) return null;

  return (
    <section ref={ref} className="mt-14" aria-label="Gợi ý cho bạn">
      {renderHead('Gợi ý cho bạn', 'Dựa trên sản phẩm bạn đã xem và tìm kiếm')}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <HomeProductSkeleton key={i} />)
          : items.map((p: any) => (
              <HomeProductCard
                key={p.id}
                product={p}
                deal={deals.get(String(p.id || p._id))}
                reason={p.reason}
                isFav={favIds.includes(p.id)}
                onToggleFav={(e) => onToggleFav(p.id, p.title || p.name, e)}
                onOpen={() => navigate(`/product/${p.id}`)}
              />
            ))}
      </div>
    </section>
  );
}
