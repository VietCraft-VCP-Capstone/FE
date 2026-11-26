import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Search, ShoppingBag, Star, Store } from 'lucide-react';
import { favoritesService } from '../../product/services/favoritesService';
import { cartService } from '../../order/services/cartService';
import { SelectVariantModal } from '../components/SelectVariantModal';
import { useProductDeals } from '../hooks/useDealLookup';
import { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';
import { CommerceToast, useCommerceToast } from '../components/commerce/CommerceToast';
import { mediaUrl, onImgError, PLACEHOLDER_IMG, toNumber, vnd } from '../components/commerce/format';
import '../components/commerce/commerce.css';

type SortKey = 'newest' | 'oldest' | 'price_asc' | 'price_desc';
type FilterKey = 'all' | 'available' | 'deal' | 'unavailable';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Mới lưu gần đây' },
  { value: 'oldest', label: 'Lưu lâu nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
];

const PAGE = 20;

interface WishCard {
  id: string;
  order: number;
  product: any;
  title: string;
  price: number;
  shopId: string;
  shopName: string;
  image: string;
  rating: number;
  ratingCount: number;
  isPod: boolean;
  unavailable: string | null;
}

const productIdOf = (item: any): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  const id = item.product_id || item.productId || item._id || item.id || item.product?._id || item.product?.id;
  return id ? String(id) : '';
};

const toCard = (item: any, index: number): WishCard => {
  const p = item?.product || (item && typeof item === 'object' ? item : {});
  const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
  const stock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const isPod = p.product_type === 'POD_TEMPLATE';
  const discontinued = Boolean(p.listing_status) && p.listing_status !== 'ACTIVE';
  // Hàng in theo yêu cầu không giữ tồn kho nên không coi là hết hàng.
  const soldOut = !isPod && variants.length > 0 && stock <= 0;
  const image = mediaUrl(p.image || p.thumbnail)
    || (Array.isArray(p.images) ? p.images.map(mediaUrl).find(Boolean) : '')
    || mediaUrl(variants[0]?.mockupImage || variants[0]?.mockup_image)
    || PLACEHOLDER_IMG;
  return {
    id: productIdOf(item),
    order: index,
    product: p,
    title: p.title || p.name || 'Sản phẩm thủ công',
    price: toNumber(p.price ?? p.retail_price ?? variants[0]?.price ?? variants[0]?.retail_price),
    shopId: p.shopInfo?.id || '',
    shopName: p.shopInfo?.name || p.shopName || 'VietCraft Selection',
    image,
    rating: Number(p.average_rating) || 0,
    ratingCount: Number(p.rating_count) || 0,
    isPod,
    unavailable: discontinued ? 'Ngừng bán' : soldOut ? 'Hết hàng' : null,
  };
};

export function BuyerFavoritesPage() {
  const navigate = useNavigate();
  const authed = isLoggedIn();
  const { toast, show: showToast, dismiss } = useCommerceToast();

  const [items, setItems] = useState<any[] | null>(authed ? null : []);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [limit, setLimit] = useState(PAGE);
  const [variantProduct, setVariantProduct] = useState<any>(null);

  const load = useCallback(async () => {
    if (!authed) return;
    setLoadError('');
    try {
      const res = await favoritesService.getFavorites();
      setItems(Array.isArray(res?.product_ids) ? res.product_ids : []);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Không tải được danh sách yêu thích.'));
      setItems((prev) => prev ?? []);
    }
  }, [authed]);

  useEffect(() => { void load(); }, [load]);

  const cards = useMemo(() => (items ?? []).map(toCard).filter((c) => c.id), [items]);
  const deals = useProductDeals(cards.map((c) => c.id));

  const counts = useMemo(() => ({
    all: cards.length,
    available: cards.filter((c) => !c.unavailable).length,
    deal: cards.filter((c) => !c.unavailable && deals.has(c.id)).length,
    unavailable: cards.filter((c) => c.unavailable).length,
  }), [cards, deals]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = cards.filter((c) => {
      if (filter === 'available' && c.unavailable) return false;
      if (filter === 'deal' && (c.unavailable || !deals.has(c.id))) return false;
      if (filter === 'unavailable' && !c.unavailable) return false;
      return !term || c.title.toLowerCase().includes(term) || c.shopName.toLowerCase().includes(term);
    });
    const cmp: Record<SortKey, (a: WishCard, b: WishCard) => number> = {
      newest: (a, b) => b.order - a.order,
      oldest: (a, b) => a.order - b.order,
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
    };
    list = [...list].sort(cmp[sortBy]);
    return list;
  }, [cards, deals, filter, search, sortBy]);

  const shown = visible.slice(0, limit);

  const removeFavorite = async (card: WishCard) => {
    const previous = items;
    setItems((prev) => (prev ?? []).filter((it) => productIdOf(it) !== card.id));
    try {
      await favoritesService.removeFavorite(card.id);
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      showToast(`Đã bỏ "${card.title}" khỏi yêu thích.`, 'success', {
        label: 'Hoàn tác',
        onClick: () => {
          favoritesService.addFavorite(card.id)
            .then(() => { window.dispatchEvent(new CustomEvent('wishlist-updated')); return load(); })
            .catch((err) => showToast(getApiErrorMessage(err, 'Không khôi phục được.'), 'error'));
        },
      });
    } catch (err) {
      setItems(previous);
      showToast(getApiErrorMessage(err, 'Không bỏ yêu thích được.'), 'error');
    }
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'available', label: 'Còn hàng' },
    { key: 'deal', label: 'Đang có ưu đãi' },
    { key: 'unavailable', label: 'Không còn bán' },
  ];

  return (
    <div className="vc-commerce">
      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-5 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[13px] text-[var(--c-muted)]">
          <Link to="/" className="hover:text-[var(--c-green)]">Trang chủ</Link>
          <span className="mx-1.5" aria-hidden>/</span>
          <span className="text-[var(--c-ink)]">Yêu thích</span>
        </nav>

        <header className="mb-5 mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="vc-display m-0 text-[28px] font-semibold leading-tight text-[var(--c-plum)] sm:text-[34px]">Yêu thích</h1>
            {items !== null && cards.length > 0 && <p className="m-0 mt-1 text-sm text-[var(--c-muted)]">{cards.length} món bạn đã lưu</p>}
          </div>
          {cards.length > 0 && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <label className="relative block sm:w-72">
                <span className="sr-only">Tìm trong danh sách yêu thích</span>
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-muted)]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }}
                  placeholder="Tìm theo tên hoặc shop"
                  className="h-11 w-full rounded-full border border-[var(--c-line-strong)] bg-white pl-10 pr-4 text-sm outline-none focus:border-[var(--c-green)]"
                />
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[var(--c-muted)]">
                <span className="whitespace-nowrap">Sắp xếp</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortKey); setLimit(PAGE); }}
                  className="h-11 flex-1 cursor-pointer rounded-full border border-[var(--c-line-strong)] bg-white px-4 text-sm text-[var(--c-ink)] outline-none focus:border-[var(--c-green)] sm:flex-none"
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            </div>
          )}
        </header>

        {cards.length > 0 && (
          <div className="vc-no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Lọc danh sách yêu thích">
            {filters.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => { setFilter(f.key); setLimit(PAGE); }}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${on ? 'border-[var(--c-plum)] bg-[var(--c-plum)] text-white' : 'border-[var(--c-line-strong)] bg-white text-[var(--c-body)] hover:border-[var(--c-ink)]'}`}
                >
                  {f.label} <span className={`vc-num ml-0.5 font-normal ${on ? 'text-white/70' : 'text-[var(--c-muted)]'}`}>{counts[f.key]}</span>
                </button>
              );
            })}
          </div>
        )}

        {loadError && (
          <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span>{loadError}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">Thử lại</button>
          </div>
        )}

        {!authed ? (
          <EmptyState
            title="Đăng nhập để xem yêu thích"
            body="Danh sách yêu thích được lưu theo tài khoản, để bạn xem lại trên mọi thiết bị."
            cta={{ label: 'Đăng nhập', onClick: () => navigate(`/login?next=${encodeURIComponent('/favorites')}`) }}
          />
        ) : items === null ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="space-y-3"><div className="vc-skel aspect-[4/5] w-full rounded-2xl" /><div className="vc-skel h-4 w-4/5" /><div className="vc-skel h-4 w-1/3" /></div>
            ))}
          </div>
        ) : cards.length === 0 && loadError ? null : cards.length === 0 ? (
          <EmptyState
            title="Chưa lưu món nào"
            body="Chạm vào trái tim ở sản phẩm bạn thích để lưu lại. Khi có ưu đãi, bạn sẽ thấy ngay tại đây."
            cta={{ label: 'Khám phá sản phẩm', onClick: () => navigate('/') }}
          />
        ) : visible.length === 0 ? (
          <div className="vc-panel px-6 py-14 text-center">
            <p className="m-0 text-[15px] font-semibold">Không có món nào khớp bộ lọc</p>
            <button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className="mt-4 rounded-full border border-[var(--c-line-strong)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--c-ink)]">Xem tất cả</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.map((card) => {
                const deal = !card.unavailable ? deals.get(card.id) : undefined;
                const url = `/product/${card.id}`;
                return (
                  <article key={card.id} className="vc-card-box vc-wish flex flex-col">
                    <div className="relative aspect-[4/5] overflow-hidden border-b border-[var(--c-line)] bg-stone-100">
                      <Link to={url} aria-label={card.title} className="block h-full w-full">
                        <img src={card.image} alt={card.title} loading="lazy" onError={onImgError} className={`vc-wish-img h-full w-full object-cover ${card.unavailable ? 'grayscale opacity-60' : ''}`} />
                      </Link>
                      {(card.unavailable || card.isPod || deal) && (
                        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
                          {card.unavailable && <span className="rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">{card.unavailable}</span>}
                          {deal && <span className="rounded-full bg-[var(--c-rose)] px-2.5 py-1 text-[11px] font-semibold text-white">{deal.badge === 'FLASH_SALE' ? 'Flash sale' : `Giảm ${vnd(deal.savings)}`}</span>}
                          {card.isPod && !card.unavailable && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[var(--c-plum)]">In theo yêu cầu</span>}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => void removeFavorite(card)}
                        aria-label={`Bỏ yêu thích ${card.title}`}
                        title="Bỏ yêu thích"
                        className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[var(--c-rose)] shadow-sm hover:bg-white"
                      >
                        <Heart size={17} className="fill-current" />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <Link to={url} title={card.title} className="line-clamp-2 text-[14px] leading-5 text-[var(--c-ink)] hover:text-[var(--c-green)]">{card.title}</Link>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[12.5px] text-[var(--c-muted)]">
                        {card.shopId ? (
                          <Link to={`/shop/${card.shopId}`} className="inline-flex min-w-0 items-center gap-1 hover:text-[var(--c-green)]"><Store size={12} className="shrink-0" /><span className="truncate">{card.shopName}</span></Link>
                        ) : <span className="inline-flex min-w-0 items-center gap-1"><Store size={12} className="shrink-0" /><span className="truncate">{card.shopName}</span></span>}
                        {card.ratingCount > 0 && <span className="inline-flex shrink-0 items-center gap-0.5"><Star size={12} className="fill-amber-400 text-amber-400" />{card.rating.toFixed(1)}</span>}
                      </div>
                      <div className="mt-1.5">
                        {deal ? (
                          <p className="m-0 flex flex-wrap items-baseline gap-x-2">
                            <span className="vc-num text-[16px] font-semibold text-[var(--c-rose)]">{vnd(deal.finalPrice)}</span>
                            <span className="vc-num text-[12.5px] text-[var(--c-muted)] line-through">{vnd(deal.basePrice)}</span>
                          </p>
                        ) : (
                          <span className={`vc-num text-[16px] font-semibold ${card.unavailable ? 'text-[var(--c-muted)]' : 'text-[var(--c-plum)]'}`}>{vnd(card.price)}</span>
                        )}
                        {deal && <p className="m-0 mt-0.5 text-[12px] text-[var(--c-muted)]">với mã {deal.couponCode}</p>}
                      </div>
                      <div className="mt-auto pt-3">
                        {card.unavailable ? (
                          <button type="button" onClick={() => void removeFavorite(card)} className="h-10 w-full rounded-full border border-[var(--c-line-strong)] text-[13px] font-semibold text-[var(--c-body)] hover:border-[var(--c-rose)] hover:text-[var(--c-rose)]">
                            Bỏ khỏi danh sách
                          </button>
                        ) : (
                          <button type="button" onClick={() => setVariantProduct(card.product)} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[var(--c-green)] text-[13px] font-semibold text-white hover:bg-[var(--c-green-deep)]">
                            <ShoppingBag size={14} /> Thêm vào giỏ
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 text-[13px] text-[var(--c-muted)]">
              <span className="vc-num">Đang xem {shown.length} trên {visible.length} món</span>
              {shown.length < visible.length && (
                <button type="button" onClick={() => setLimit((n) => n + PAGE)} className="rounded-full border border-[var(--c-line-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--c-ink)] hover:border-[var(--c-ink)]">
                  Xem thêm
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <SelectVariantModal
        isOpen={Boolean(variantProduct)}
        productId={variantProduct ? productIdOf(variantProduct) || null : null}
        initialProduct={variantProduct}
        onClose={() => setVariantProduct(null)}
        onAddToCart={async (payload) => {
          try {
            await cartService.addToCart(payload);
            showToast('Đã thêm vào giỏ hàng.', 'success', { label: 'Xem giỏ', onClick: () => navigate('/cart') });
          } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thêm được vào giỏ hàng.'), 'error');
            throw err;
          }
        }}
      />

      <CommerceToast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta: { label: string; onClick: () => void } }) {
  return (
    <section className="vc-panel mx-auto max-w-xl px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--c-thread)] text-[var(--c-rose)]">
        <Heart size={28} strokeWidth={1.6} />
      </div>
      <h2 className="vc-display m-0 text-xl font-semibold text-[var(--c-plum)]">{title}</h2>
      <p className="mx-auto mb-6 mt-2 max-w-sm text-sm leading-relaxed text-[var(--c-muted)]">{body}</p>
      <button type="button" onClick={cta.onClick} className="rounded-full bg-[var(--c-green)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--c-green-deep)]">{cta.label}</button>
    </section>
  );
}

export default BuyerFavoritesPage;
