import { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingBag, ChevronLeft, ChevronRight, Search, Store, Star, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { favoritesService } from '../../product/services/favoritesService';
import { cartService } from '../../order/services/cartService';
import { SelectVariantModal } from '../components/SelectVariantModal';
import api, { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const DEFAULT_FAV_IMG = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400';

const absImg = (u: any): string => {
  if (!u || typeof u !== 'string') return '';
  const trimmed = u.trim();
  if (!trimmed || trimmed.startsWith('#')) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return ORIGIN + trimmed;
  return trimmed;
};

const resolveProductImage = (product: any): string => {
  const directImg = absImg(product.image || product.thumbnail);
  if (directImg) return directImg;
  const pImgs = Array.isArray(product.images) ? product.images : [];
  for (const img of pImgs) {
    const resolved = absImg(img);
    if (resolved) return resolved;
  }
  const vImg = absImg(product.variants?.[0]?.mockupImage || product.variants?.[0]?.mockup_image);
  if (vImg) return vImg;
  return DEFAULT_FAV_IMG;
};

const getFavoriteItemId = (item: any): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  const directId = item.product_id || item.productId || item._id || item.id;
  if (directId && typeof directId === 'string') return directId;
  if (directId && typeof directId === 'object' && directId.toString) return directId.toString();

  const nested = item.product;
  if (nested) {
    if (typeof nested === 'string') return nested;
    const nestedId = nested._id || nested.id || nested.product_id || nested.productId;
    if (nestedId && typeof nestedId === 'string') return nestedId;
    if (nestedId && typeof nestedId === 'object' && nestedId.toString) return nestedId.toString();
  }

  return '';
};

type SortKey = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Mới thêm gần đây' },
  { value: 'oldest', label: 'Thêm lâu nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 40];

const formatPrice = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)}₫`;

export function BuyerFavoritesPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [activeProductForCart, setActiveProductForCart] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const cards = useMemo(() => favorites
    .map((item, index) => {
      const product = item?.product || (typeof item === 'object' && item !== null ? item : {});
      const variants: any[] = Array.isArray(product.variants) ? product.variants : [];
      const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      const isPod = product.product_type === 'POD_TEMPLATE';
      const discontinued = Boolean(product.listing_status) && product.listing_status !== 'ACTIVE';
      // Hàng in theo yêu cầu không giữ tồn kho nên không coi là hết hàng
      const soldOut = !isPod && variants.length > 0 && totalStock <= 0;
      return {
        id: getFavoriteItemId(item),
        addedOrder: index, // API trả theo thứ tự lưu ($addToSet nối vào cuối)
        product,
        title: product.title || product.name || 'Sản phẩm thủ công',
        price: Number(product.price || product.retail_price || variants[0]?.price || variants[0]?.retail_price || 0),
        shopId: product.shopInfo?.id || '',
        shopName: product.shopInfo?.name || product.shopName || product.storeName || 'VietCraft Selection',
        image: resolveProductImage(product),
        rating: Number(product.average_rating) || 0,
        ratingCount: Number(product.rating_count) || 0,
        isPod,
        discontinued,
        soldOut,
      };
    })
    .filter((card) => card.id), [favorites]);

  const visibleCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? cards.filter((c) => c.title.toLowerCase().includes(term) || c.shopName.toLowerCase().includes(term))
      : [...cards];
    const compare: Record<SortKey, (a: typeof list[number], b: typeof list[number]) => number> = {
      newest: (a, b) => b.addedOrder - a.addedOrder,
      oldest: (a, b) => a.addedOrder - b.addedOrder,
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
    };
    return list.sort(compare[sortBy]);
  }, [cards, search, sortBy]);

  const totalItems = visibleCards.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  // Kẹp trang khi vừa bỏ yêu thích sản phẩm cuối cùng của trang cuối
  const page = Math.min(currentPage, totalPages);
  const paginatedCards = visibleCards.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handlePageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setCurrentPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    if (!isLoggedIn()) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await favoritesService.getFavorites();
      const items = Array.isArray(res?.product_ids) ? res.product_ids : [];
      setFavorites(items);
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu thích:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toast cùng kiểu với trang chủ (BuyerHomePage)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemoveFavorite = async (id: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    // Optimistic Update: cập nhật giao diện ngay lập tức
    const previous = favorites;
    const next = favorites.filter((item) => getFavoriteItemId(item) !== id);
    setFavorites(next);
    try {
      await favoritesService.removeFavorite(id);
      setFavorites(prev => prev.filter(item => getFavoriteItemId(item) !== id));
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      showToast(`Đã xóa "${title}" khỏi danh sách yêu thích`);
    } catch (err) {
      // Revert lại nếu có lỗi
      setFavorites(previous);
      showToast(getApiErrorMessage(err, 'Không thể bỏ yêu thích sản phẩm này.'), 'error');
    }
  };

  const handleOpenAddToCartModal = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    setActiveProductForCart(product);
    setVariantModalOpen(true);
  };

  const handleConfirmAddToCart = async (payload: { productId: string; variantId?: string; quantity: number }) => {
    try {
      await cartService.addToCart(payload);
      showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể thêm sản phẩm vào giỏ hàng.'), 'error');
      throw err;
    }
  };

  return (
    <div className="w-full bg-stone-50 text-gray-900 font-sans min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-stone-500">
          <Link to="/" className="hover:text-[#15803d] transition-colors">Trang chủ</Link>
          <span className="mx-1.5">/</span>
          <span className="font-semibold text-stone-800">Sản phẩm yêu thích</span>
        </nav>

        {/* Header + công cụ tìm kiếm, sắp xếp */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Sản phẩm yêu thích</h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {loading ? 'Đang tải danh sách...' : `${cards.length} sản phẩm đã lưu`}
              </p>
            </div>
          </div>

          {cards.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="relative block sm:w-72">
                <span className="sr-only">Tìm trong danh sách yêu thích</span>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  id="favorites-search"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên sản phẩm hoặc shop"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                <span className="whitespace-nowrap">Sắp xếp</span>
                <select
                  id="favorites-sort"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortKey);
                    setCurrentPage(1);
                  }}
                  className="flex-1 sm:flex-none bg-white border border-stone-200 text-stone-800 text-sm font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        {/* Trạng thái Loading / Danh sách sản phẩm */}
        {loading && favorites.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="w-full aspect-square bg-stone-100"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-stone-100 rounded-md w-full"></div>
                  <div className="h-3 bg-stone-100 rounded-md w-1/2"></div>
                  <div className="h-5 bg-stone-100 rounded-md w-1/3"></div>
                  <div className="h-8 bg-stone-100 rounded-xl w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Heart className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold text-gray-800">Chưa có sản phẩm yêu thích nào</p>
            <p className="text-sm text-stone-500 mt-1 mb-5 max-w-sm mx-auto leading-relaxed">
              Bấm vào biểu tượng trái tim ở sản phẩm bạn thích để lưu lại và mua sau.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl bg-[#15803d] text-white text-sm font-semibold hover:bg-[#166534] transition-colors cursor-pointer"
            >
              Khám phá sản phẩm
            </button>
          </div>
        ) : totalItems === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 py-16 px-6 text-center">
            <Search className="w-8 h-8 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-800">Không có sản phẩm nào khớp với “{search.trim()}”</p>
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-4 px-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {paginatedCards.map((card) => {
                const inactive = card.discontinued || card.soldOut;
                const productUrl = `/product/${card.id}`;

                return (
                  <article
                    key={card.id}
                    className="group bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col hover:shadow-lg hover:border-stone-300 transition-all duration-200"
                  >
                    {/* Ảnh + nhãn + nút bỏ yêu thích */}
                    <div className="relative aspect-square bg-stone-100 overflow-hidden">
                      <Link to={productUrl} aria-label={card.title} className="block w-full h-full">
                        <img
                          src={card.image}
                          alt={card.title}
                          loading="lazy"
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${inactive ? 'opacity-60 grayscale' : ''}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_FAV_IMG;
                          }}
                        />
                      </Link>

                      <div className="absolute top-2 left-2 flex flex-col items-start gap-1 pointer-events-none">
                        {card.discontinued ? (
                          <span className="bg-stone-800/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Ngừng bán</span>
                        ) : card.soldOut ? (
                          <span className="bg-stone-800/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Hết hàng</span>
                        ) : null}
                        {card.isPod && (
                          <span className="inline-flex items-center gap-1 bg-emerald-700/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            <Sparkles className="w-2.5 h-2.5" /> In theo yêu cầu
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveFavorite(card.id, card.title, e)}
                        title="Bỏ yêu thích"
                        aria-label={`Bỏ yêu thích ${card.title}`}
                        className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#15803d]"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </button>
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="p-3 flex flex-col flex-1 gap-1.5">
                      <Link
                        to={productUrl}
                        title={card.title}
                        className="text-sm text-gray-900 leading-5 line-clamp-2 min-h-[2.5rem] hover:text-[#15803d] transition-colors"
                      >
                        {card.title}
                      </Link>

                      {card.shopId ? (
                        <Link
                          to={`/shop/${card.shopId}`}
                          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#15803d] transition-colors min-w-0"
                        >
                          <Store className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{card.shopName}</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-stone-500 min-w-0">
                          <Store className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{card.shopName}</span>
                        </span>
                      )}

                      <div className="flex items-end justify-between gap-2 mt-auto pt-1">
                        <span className={`text-base font-bold ${inactive ? 'text-stone-400' : 'text-[#15803d]'}`}>
                          {formatPrice(card.price)}
                        </span>
                        {card.ratingCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-stone-500 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {card.rating.toFixed(1)} ({card.ratingCount})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={inactive}
                        onClick={(e) => handleOpenAddToCartModal(card.product, e)}
                        className="mt-1.5 w-full py-2 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-[#15803d] text-white hover:bg-[#166534] disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                        <span>{card.discontinued ? 'Ngừng bán' : card.soldOut ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-8 pt-5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-stone-500">
                Hiển thị{' '}
                <span className="font-semibold text-gray-900">
                  {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, totalItems)}
                </span>{' '}
                trên <span className="font-semibold text-gray-900">{totalItems}</span> sản phẩm
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    aria-label="Trang trước"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Trước</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      aria-current={page === pageNum ? 'page' : undefined}
                      className={`w-9 h-9 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${page === pageNum
                        ? 'bg-[#15803d] text-white'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    aria-label="Trang sau"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <span className="hidden sm:inline">Sau</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                <span>Hiển thị</span>
                <select
                  id="favorites-page-size"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 cursor-pointer"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n} / trang</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            maxWidth: 'calc(100vw - 48px)',
            backgroundColor: '#fff',
            borderLeft: `4px solid ${toast.type === 'success' ? '#008000' : '#dc2626'}`,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            borderRadius: 8,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 9999
          }}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={20} color="#008000" strokeWidth={2.5} className="shrink-0" />
            : <AlertCircle size={20} color="#dc2626" strokeWidth={2.5} className="shrink-0" />
          }
          <span style={{ fontSize: 14, fontWeight: 600, color: '#330033' }}>{toast.message}</span>
        </div>
      )}

      {/* Modal Chọn Variant & Số Lượng */}
      <SelectVariantModal
        isOpen={variantModalOpen}
        productId={getFavoriteItemId(activeProductForCart) || null}
        initialProduct={activeProductForCart}
        onClose={() => {
          setVariantModalOpen(false);
          setActiveProductForCart(null);
        }}
        onAddToCart={handleConfirmAddToCart}
      />
    </div>
  );
}

export default BuyerFavoritesPage;
