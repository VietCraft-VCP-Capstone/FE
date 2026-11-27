import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as Crumb } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { favoritesService } from '../../product/services/favoritesService';
import { isLoggedIn } from '../../../infrastructure/api/interceptors';
import { useToast } from '../../../shared/components/Toast';
import { SeoMeta } from '../../../shared/components/SeoMeta';
import { HomeProductCard, HomeProductSkeleton } from '../components/home/HomeProductCard';
import { toDeal } from '../components/deals/buildDeals';
import '../components/home/home.css';

const PER_PAGE = 20;

/** Dãy số trang gọn: 1 … 4 5 6 … 12 */
function pageList(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | '…'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

export function BuyerDealsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    if (isLoggedIn()) favoritesService.getFavoriteIds().then(setFavIds).catch(() => setFavIds([]));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    productsService.getDeals(page, PER_PAGE)
      .then((res) => {
        if (!alive) return;
        setItems(res.items || []);
        setTotal(Number(res.total) || 0);
        setTotalPages(Math.max(1, Number(res.totalPages) || 1));
        // Trang vượt quá số trang thật (link cũ) thì về trang cuối.
        if (page > 1 && (res.items || []).length === 0 && Number(res.totalPages) >= 1) {
          setParams({ page: String(res.totalPages) }, { replace: true });
        }
      })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reload]);

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setParams(p === 1 ? {} : { page: String(p) });
  };

  const toggleFav = async (id: string, title: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate(`/login?next=${encodeURIComponent('/deals' + (page > 1 ? `?page=${page}` : ''))}`); return; }
    try {
      const res = await favoritesService.toggleFavorite(id);
      setFavIds((prev) => (res.isFavorite ? [...prev, id] : prev.filter((x) => x !== id)));
      showToast(res.isFavorite ? `Đã thêm "${title}" vào yêu thích` : `Đã bỏ "${title}" khỏi yêu thích`, res.isFavorite ? 'success' : 'info');
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch {
      showToast('Không thể cập nhật yêu thích, vui lòng thử lại.', 'error');
    }
  };

  return (
    <div className="vc-home mx-auto max-w-[1200px] px-4 pb-16 pt-5 sm:px-6">
      <SeoMeta title="Giá tốt với mã · VietCraft" description="Sản phẩm đang có mã giảm giá, xếp theo mức tiết kiệm." />

      <nav className="mb-5 flex items-center gap-1.5 text-[13px] text-stone-500" aria-label="Breadcrumb">
        <Link to="/" className="font-medium text-stone-600 hover:text-[#007700]">Trang chủ</Link>
        <Crumb size={14} />
        <span className="font-semibold text-stone-800">Giá tốt với mã</span>
      </nav>

      <header className="mb-7">
        <h1 className="vc-display m-0 text-[26px] font-semibold leading-tight text-[#330033] sm:text-[30px]">Giá tốt với mã</h1>
        <p className="m-0 mt-2 max-w-[62ch] text-[14px] text-stone-600">
          {total > 0 ? `${total.toLocaleString('vi-VN')} sản phẩm đang có mã giảm, xếp theo mức tiết kiệm. ` : ''}
          Giá sau mã áp dụng khi bạn chọn mã tương ứng ở bước thanh toán.
        </p>
      </header>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center text-[14px] text-rose-900">
          Không tải được danh sách. Kiểm tra kết nối mạng rồi thử lại.
          <button type="button" onClick={() => setReload((n) => n + 1)} className="rounded-full bg-white px-5 py-2 font-semibold ring-1 ring-rose-200">Thử lại</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => <HomeProductSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-14 text-center">
          <p className="m-0 text-[15px] font-semibold text-stone-800">Hiện chưa có sản phẩm nào đang giảm giá bằng mã</p>
          <p className="m-0 text-[13.5px] text-stone-500">Lưu sẵn voucher để dùng khi các shop mở đợt giảm giá mới.</p>
          <button type="button" onClick={() => navigate('/vouchers')} className="mt-1 rounded-full bg-[#007700] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#005B00]">
            Mở kho voucher
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {items.map((p: any) => (
              <HomeProductCard
                key={p.id}
                product={p}
                deal={p.deal ? toDeal(p.deal) : undefined}
                isFav={favIds.includes(p.id)}
                onToggleFav={(e) => toggleFav(p.id, p.title, e)}
                onOpen={() => navigate(`/product/${p.id}`, { state: { initialProduct: p } })}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang">
              <button type="button" onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Trang trước"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 disabled:opacity-40">
                <ChevronLeft size={18} />
              </button>
              {pageList(page, totalPages).map((n, i) => n === '…' ? (
                <span key={`gap-${i}`} className="px-1.5 text-stone-400">…</span>
              ) : (
                <button key={n} type="button" onClick={() => goTo(n)} aria-current={n === page ? 'page' : undefined}
                  className={`h-10 min-w-[40px] rounded-full px-3 text-[14px] font-semibold ${n === page ? 'bg-[#330033] text-white' : 'border border-stone-200 bg-white text-stone-700 hover:border-[#330033]'}`}>
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => goTo(page + 1)} disabled={page === totalPages} aria-label="Trang sau"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 disabled:opacity-40">
                <ChevronRight size={18} />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default BuyerDealsPage;
