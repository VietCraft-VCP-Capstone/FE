import { Fragment, useState, useEffect, useMemo, useCallback, type MouseEvent, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import { productsService, absImg, FeaturedCategory, HomeStats } from '../../product/services/productsService';
import { shopService } from '../../product/services/shopService';
import { promotionService } from '../../promotion/services/promotionService';
import { favoritesService } from '../../product/services/favoritesService';
import { isLoggedIn } from '../../../infrastructure/api/interceptors';
import { useVoucherWallet } from '../../promotion/hooks/useVoucherWallet';
import { ForYouSection } from '../components/home/ForYouSection';
import { HomeHero, type HeroProduct } from '../components/home/HomeHero';
import { HomeProductCard, HomeProductSkeleton } from '../components/home/HomeProductCard';
import { VoucherTicketStrip, type HomeVoucher } from '../components/home/VoucherTicketStrip';
import { ShopShelf, type ShelfShop } from '../components/home/ShopShelf';
import { CategoryShelf } from '../components/home/CategoryShelf';
import { toDeal, type Deal } from '../components/deals/buildDeals';
import { useDealLookup } from '../hooks/useDealLookup';
import '../components/home/home.css';

/** Giữ dữ liệu khi người dùng chuyển trang rồi quay lại, tránh tải lại và nhảy bố cục. */
let homeDataCache: {
  products: any[];
  productPage: number;
  productPages: number;
  stats: HomeStats;
  heroProducts: any[];
  dealItems: any[];
  dealTotal: number;
  shops: any[];
  suggestedShops: any[];
  categories: FeaturedCategory[];
  keywords: string[];
  coupons: any[];
} | null = null;

/** Mỗi lần "Xem thêm" tải thêm một trang từ server (3 hàng x 4 cột). */
const PAGE = 12;
const DEALS_ON_HOME = 10;
const num = (v: any) => parseFloat(typeof v === 'object' && v?.$numberDecimal ? v.$numberDecimal : v || 0) || 0;
const shopIdOf = (s: any) => String(s?._id || s?.id || '');

function toVoucher(v: any): HomeVoucher {
  const val = num(v.discount_value);
  const minVal = num(v.min_order_value);
  const maxVal = num(v.max_discount_amount);
  const k = (n: number) => `${(n / 1000).toLocaleString('vi-VN')}K`;
  let value: string;
  if (v.discount_type === 'PERCENTAGE') value = `Giảm ${val}%${maxVal > 0 ? `, tối đa ${k(maxVal)}` : ''}`;
  else if (v.discount_type === 'FREE_SHIPPING') value = val > 0 ? `Freeship ${k(val)}` : 'Miễn phí vận chuyển';
  else if (v.discount_type === 'FLASH_SALE') value = val <= 100 ? `Flash sale ${val}%` : `Flash sale ${k(val)}`;
  else value = val >= 1_000_000 ? `Giảm ${(val / 1_000_000).toLocaleString('vi-VN')} triệu` : `Giảm ${k(val)}`;
  return {
    id: String(v._id || v.id),
    code: v.code,
    value,
    condition: minVal > 0 ? `Đơn từ ${minVal >= 1_000_000 ? `${(minVal / 1_000_000).toLocaleString('vi-VN')} triệu` : k(minVal)}` : 'Mọi đơn hàng',
    is_platform: v.is_platform ?? !v.shop_id,
    shop_name: v.shop_name || 'Gian hàng',
    applicable_scope: v.applicable_scope || 'ALL',
    applicable_products_count: v.applicable_product_ids?.length || 0,
    end_date: v.end_date,
  };
}

function SectionHead({ title, note, action }: { title: string; note?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="vc-display m-0 text-[20px] font-semibold leading-tight text-[#330033] sm:text-[22px]">{title}</h2>
        {note && <p className="m-0 mt-1.5 text-[13.5px] text-stone-500">{note}</p>}
      </div>
      {action}
    </div>
  );
}

function TextAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="whitespace-nowrap text-[13.5px] font-semibold text-[#007700] underline-offset-4 hover:underline">
      {children}
    </button>
  );
}

export function BuyerDashboard({ user }: { user?: any; onLogout?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<any[]>(() => homeDataCache?.products || []);
  const [productPage, setProductPage] = useState(() => homeDataCache?.productPage || 1);
  const [productPages, setProductPages] = useState(() => homeDataCache?.productPages || 1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [stats, setStats] = useState<HomeStats>(() => homeDataCache?.stats || { totalProducts: 0, newThisWeek: 0 });
  const [heroSource, setHeroSource] = useState<any[]>(() => homeDataCache?.heroProducts || []);
  const [dealItems, setDealItems] = useState<any[]>(() => homeDataCache?.dealItems || []);
  const [dealTotal, setDealTotal] = useState(() => homeDataCache?.dealTotal || 0);
  const [shopList, setShopList] = useState<any[]>(() => homeDataCache?.shops || []);
  const [suggestedShopList, setSuggestedShopList] = useState<any[]>(() => homeDataCache?.suggestedShops || []);
  const [categories, setCategories] = useState<FeaturedCategory[]>(() => homeDataCache?.categories || []);
  const [keywords, setKeywords] = useState<string[]>(() => homeDataCache?.keywords || []);
  const [couponList, setCouponList] = useState<any[]>(() => homeDataCache?.coupons || []);
  const [shopProducts, setShopProducts] = useState<Record<string, any[]>>({});
  const [favIds, setFavIds] = useState<string[]>([]);
  const [followingShopId, setFollowingShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => !homeDataCache);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }, []);
  const wallet = useVoucherWallet((msg, type) => triggerToast(msg, type === 'success' ? 'success' : 'info'));

  // /collections và /gifts dùng chung trang này: cuộn tới đúng khối.
  useEffect(() => {
    const target = location.pathname === '/collections' || location.hash === '#collections-section'
      ? 'collections-section'
      : location.pathname === '/gifts' || location.hash === '#gifts-section' ? 'kham-pha' : null;
    if (!target) return;
    const t = window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 120);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash, isLoading]);

  useEffect(() => {
    if (!isLoggedIn()) { setFavIds([]); return; }
    favoritesService.getFavoriteIds().then(setFavIds).catch(() => setFavIds([]));
  }, []);

  useEffect(() => {
    let alive = true;
    if (!homeDataCache) setIsLoading(true);
    setLoadError(false);

    Promise.all([
      productsService.getAllStrict({ page: 1, pageSize: PAGE } as any),
      isLoggedIn() ? shopService.getFollowedShops().catch(() => []) : Promise.resolve([]),
      productsService.getFeaturedShops(),
      promotionService.getAll().catch(() => []),
      productsService.getFeaturedCategories(5).catch(() => [] as FeaturedCategory[]),
      productsService.getPopularSearches(6),
      productsService.getHomeStats().catch(() => null),
      productsService.searchStrict({ sort: 'best_seller', limit: 8 }).catch(() => ({ items: [] as any[] })),
      productsService.getDeals(1, DEALS_ON_HOME).catch(() => ({ items: [] as any[], total: 0 })),
    ]).then(([productRes, followed, featured, coupons, cats, kws, homeStats, bestRes, dealsRes]) => {
      if (!alive) return;
      const list = productRes.items || [];
      const followedShops = Array.isArray(followed) ? followed : [];
      const followedIds = new Set(followedShops.map(shopIdOf));
      const suggested = (Array.isArray(featured) ? featured : []).filter((s: any) => !followedIds.has(shopIdOf(s))).slice(0, 4);
      const nextStats = homeStats || { totalProducts: Number(productRes.total) || list.length, newThisWeek: 0 };
      const pages = Math.max(1, Number(productRes.totalPages) || 1);
      setProducts(list);
      setProductPage(1);
      setProductPages(pages);
      setStats(nextStats);
      setHeroSource(bestRes.items || []);
      setDealItems(dealsRes.items || []);
      setDealTotal(Number((dealsRes as any).total) || 0);
      setShopList(followedShops);
      setSuggestedShopList(suggested);
      setCouponList(Array.isArray(coupons) ? coupons : []);
      setCategories(cats);
      setKeywords(kws);
      homeDataCache = {
        products: list, productPage: 1, productPages: pages, stats: nextStats, heroProducts: bestRes.items || [],
        dealItems: dealsRes.items || [], dealTotal: Number((dealsRes as any).total) || 0,
        shops: followedShops, suggestedShops: suggested, categories: cats, keywords: kws,
        coupons: Array.isArray(coupons) ? coupons : [],
      };
    }).catch((err) => {
      console.error('Home: không tải được dữ liệu', err);
      if (alive && !homeDataCache) setLoadError(true);
    }).finally(() => {
      if (alive) setIsLoading(false);
    });
    return () => { alive = false; };
  }, [reloadKey]);

  // Kệ gian hàng: lấy đúng 3 sản phẩm bán chạy của từng shop (không phụ thuộc 100 sản phẩm mới nhất).
  const shelfSource = shopList.length > 0 ? shopList.slice(0, 4) : suggestedShopList;
  const shelfKey = shelfSource.map(shopIdOf).join(',');
  useEffect(() => {
    let alive = true;
    const ids = shelfKey ? shelfKey.split(',') : [];
    Promise.all(ids.map((id) =>
      productsService.searchStrict({ shopId: id, sort: 'best_seller', limit: 3 })
        .then((r) => [id, r.items || []] as const)
        .catch(() => [id, []] as const),
    )).then((rows) => { if (alive) setShopProducts(Object.fromEntries(rows)); });
    return () => { alive = false; };
  }, [shelfKey]);

  /** "Xem thêm": tải trang kế tiếp từ server và nối vào danh sách. */
  const loadMore = async () => {
    if (loadingMore || productPage >= productPages) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const next = productPage + 1;
      const res = await productsService.getAllStrict({ page: next, pageSize: PAGE } as any);
      const seen = new Set(products.map((p) => String(p.id)));
      const merged = [...products, ...(res.items || []).filter((p: any) => !seen.has(String(p.id)))];
      const pages = Math.max(next, Number(res.totalPages) || next);
      setProducts(merged);
      setProductPage(next);
      setProductPages(pages);
      if (homeDataCache) homeDataCache = { ...homeDataCache, products: merged, productPage: next, productPages: pages };
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFavorite = useCallback(async (productId: string, title: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    try {
      const res = await favoritesService.toggleFavorite(productId);
      setFavIds((prev) => (res.isFavorite ? [...prev, productId] : prev.filter((id) => id !== productId)));
      triggerToast(res.isFavorite ? `Đã thêm "${title}" vào yêu thích` : `Đã bỏ "${title}" khỏi yêu thích`, res.isFavorite ? 'success' : 'info');
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch {
      triggerToast('Không thể cập nhật yêu thích, vui lòng thử lại.', 'info');
    }
  }, [navigate, location.pathname, triggerToast]);

  const handleFollowShop = async (shopId: string, shopName: string) => {
    if (!isLoggedIn()) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!shopId || followingShopId) return;
    setFollowingShopId(shopId);
    try {
      await shopService.follow(shopId);
      const followedShop = suggestedShopList.find((s: any) => shopIdOf(s) === shopId);
      const nextFollowed = followedShop ? [...shopList, followedShop] : shopList;
      const nextSuggested = suggestedShopList.filter((s: any) => shopIdOf(s) !== shopId);
      setShopList(nextFollowed);
      setSuggestedShopList(nextSuggested);
      if (homeDataCache) homeDataCache = { ...homeDataCache, shops: nextFollowed, suggestedShops: nextSuggested };
      triggerToast(`Đã theo dõi "${shopName}"`, 'success');
    } catch (err: any) {
      triggerToast(err?.response?.data?.error || 'Không thể theo dõi gian hàng, vui lòng thử lại.', 'info');
    } finally {
      setFollowingShopId(null);
    }
  };

  const vouchers = useMemo(() => couponList.map(toVoucher), [couponList]);
  const toggleVoucher = (code: string) => {
    const coupon = couponList.find((c: any) => c.code === code);
    if (coupon) wallet.toggle(coupon);
  };

  // Giá tốt cho thẻ "Mới lên kệ": BE tra theo đúng các sản phẩm đang hiện.
  const lookedUp = useDealLookup(products.map((p) => String(p.id)));
  const dealMap = useMemo(() => {
    const m = new Map<string, Deal>(lookedUp);
    dealItems.forEach((p: any) => { if (p.deal) m.set(String(p.id), toDeal(p.deal)); });
    return m;
  }, [lookedUp, dealItems]);

  // Hero: hàng bán chạy trên toàn sàn (không chỉ trang đầu), số liệu đếm ở BE.
  // Chỉ gọi là "bán chạy" khi có lượt bán thật (đơn đã giao, trừ món hoàn tiền). Sàn chưa có đơn nào
  // giao thành công thì hiện hàng mới nhất với nhãn "Vừa lên kệ", không gắn nhãn sai.
  const toHero = (p: any): HeroProduct => ({
    id: String(p.id),
    title: p.title,
    image: p.images?.[0] || p.thumbnail,
    price: Number(p.price) || 0,
    soldCount: Number(p.soldCount) || 0,
    rating: Number(p.rating) || 0,
    ratingCount: Number(p.ratingCount) || 0,
    shopName: p.shopInfo?.name,
  });
  const { heroProducts, heroMode } = useMemo(() => {
    const withImg = (list: any[]) => list.filter((p: any) => p.images?.[0] || p.thumbnail);
    const sold = withImg(heroSource).filter((p: any) => Number(p.soldCount) > 0).slice(0, 5);
    if (sold.length > 0) return { heroProducts: sold.map(toHero), heroMode: 'best' as const };
    return { heroProducts: withImg(products).slice(0, 5).map(toHero), heroMode: 'new' as const };
  }, [heroSource, products]);

  const shelfShops: ShelfShop[] = useMemo(() => shelfSource.map((s: any) => {
    const id = shopIdOf(s);
    return {
      id,
      name: s.shop_name || s.name || s.shopName || 'Gian hàng',
      logo: absImg(s.logo) || '',
      productCount: Number(s.listing_count ?? s.listingCount) || 0,
      rating: Number(s.average_rating ?? s.averageRating ?? s.rating) || 0,
      ratingCount: Number(s.rating_count ?? s.ratingCount) || 0,
      products: (shopProducts[id] || [])
        .filter((p: any) => p.images?.[0] || p.thumbnail)
        .map((p: any) => ({ id: String(p.id), title: p.title, image: p.images?.[0] || p.thumbnail, price: Number(p.price) || 0 })),
    };
  }), [shelfSource, shopProducts]);

  const openProduct = (p: any) => navigate(`/product/${p.id}`, { state: { initialProduct: p } });
  const canShowMore = productPage < productPages;
  const followingMode = shopList.length > 0;

  return (
    <div className="vc-home mx-auto max-w-[1200px] px-4 pb-16 pt-5 sm:px-6">
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl border-l-4 border-[#007700] bg-white px-5 py-4 shadow-xl">
          {toast.type === 'success' ? <CheckCircle2 size={20} color="#007700" /> : <Info size={20} color="#6366f1" />}
          <span className="text-[14px] font-semibold text-[#330033]">{toast.message}</span>
        </div>
      )}

      <HomeHero
        name={user?.name || user?.full_name}
        newThisWeek={stats.newThisWeek}
        totalProducts={stats.totalProducts}
        products={heroProducts}
        mode={heroMode}
        savedVoucherCount={wallet.savedCodes.length}
        loading={isLoading}
        onOpenProduct={(id) => navigate(`/product/${id}`)}
        onExplore={() => document.getElementById('kham-pha')?.scrollIntoView({ behavior: 'smooth' })}
        onOpenVouchers={() => navigate('/vouchers')}
      />

      {keywords.length > 0 && (
        <p className="m-0 mt-4 px-1 text-[13.5px] leading-7 text-stone-500">
          Mọi người đang tìm{' '}
          {keywords.slice(0, 6).map((k, i, arr) => (
            <Fragment key={k}>
              <button
                type="button"
                onClick={() => navigate(`/search?q=${encodeURIComponent(k)}`)}
                className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-4 hover:text-[#007700] hover:decoration-[#007700]"
              >
                {k.toLocaleLowerCase('vi-VN')}
              </button>
              {i < arr.length - 1 ? ', ' : ''}
            </Fragment>
          ))}
        </p>
      )}

      {loadError && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-[14px] text-rose-900">
          <span>Không tải được sản phẩm. Kiểm tra kết nối mạng rồi thử lại.</span>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="rounded-full bg-white px-4 py-2 font-semibold text-rose-900 ring-1 ring-rose-200">
            Thử lại
          </button>
        </div>
      )}

      {vouchers.length > 0 && (
        <section id="vouchers-section" className="mt-12" aria-label="Voucher">
          <SectionHead
            title="Lưu mã trước khi mua"
            note="Mã đã lưu nằm trong ví của bạn và hiện đầu tiên ở bước thanh toán"
            action={<TextAction onClick={() => navigate('/vouchers')}>Xem tất cả {vouchers.length} mã</TextAction>}
          />
          <VoucherTicketStrip vouchers={vouchers.slice(0, 10)} isSaved={wallet.isSaved} pendingCode={wallet.pendingCode} onToggle={toggleVoucher} />
        </section>
      )}

      {categories.length > 0 && (
        <section id="collections-section" className="mt-12 scroll-mt-24" aria-label="Danh mục">
          <SectionHead
            title="Mua theo danh mục"
            action={<TextAction onClick={() => navigate('/search')}>Tất cả danh mục</TextAction>}
          />
          <CategoryShelf categories={categories} onSelect={(c) => navigate(`/search?category=${encodeURIComponent(c.name)}`)} />
        </section>
      )}

      {dealItems.length > 0 && (
        <section className="mt-14" aria-label="Giá tốt với mã">
          <SectionHead
            title="Giá tốt hơn với mã"
            note="Xếp theo mức tiết kiệm. Giá sau mã áp dụng khi bạn chọn mã ở bước thanh toán"
            action={<TextAction onClick={() => navigate('/deals')}>Xem tất cả {dealTotal} sản phẩm</TextAction>}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {dealItems.map((p: any) => (
              <HomeProductCard
                key={p.id}
                product={p}
                deal={toDeal(p.deal)}
                isFav={favIds.includes(p.id)}
                onToggleFav={(e) => toggleFavorite(p.id, p.title, e)}
                onOpen={() => openProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {shelfShops.length > 0 && (
        <section className="mt-14" aria-label="Gian hàng">
          <SectionHead
            title={followingMode ? 'Từ gian hàng bạn theo dõi' : 'Gian hàng nên theo dõi'}
            note={followingMode ? undefined : 'Theo dõi để thấy hàng mới của shop ngay tại đây'}
            action={followingMode ? <TextAction onClick={() => navigate('/followed-shops')}>Quản lý</TextAction> : undefined}
          />
          <ShopShelf
            shops={shelfShops}
            mode={followingMode ? 'following' : 'suggested'}
            followingId={followingShopId}
            onOpenShop={(id) => navigate(`/shop/${id}`)}
            onOpenProduct={(id) => navigate(`/product/${id}`)}
            onFollow={handleFollowShop}
          />
        </section>
      )}

      <section id="kham-pha" className="mt-14 scroll-mt-24" aria-label="Mới lên kệ">
        <SectionHead
          title="Mới lên kệ"
          note={stats.totalProducts > 0 ? `${stats.totalProducts.toLocaleString('vi-VN')} sản phẩm đang bán, mới nhất trước` : undefined}
          action={<TextAction onClick={() => navigate('/search?sort=newest')}>Lọc và sắp xếp</TextAction>}
        />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: PAGE }, (_, i) => <HomeProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-[14px] text-stone-500">
            Chưa có sản phẩm nào đang bán.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p: any) => (
                <HomeProductCard
                  key={p.id}
                  product={p}
                  deal={dealMap.get(String(p.id))}
                  isFav={favIds.includes(p.id)}
                  onToggleFav={(e) => toggleFavorite(p.id, p.title || p.name, e)}
                  onOpen={() => openProduct(p)}
                />
              ))}
            </div>
            {loadingMore && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => <HomeProductSkeleton key={i} />)}
              </div>
            )}
            <div className="mt-7 flex flex-col items-center gap-2">
              <p className="m-0 text-[13px] text-stone-500" aria-live="polite">
                Đã xem {products.length.toLocaleString('vi-VN')} / {Math.max(stats.totalProducts, products.length).toLocaleString('vi-VN')} sản phẩm
              </p>
              {moreError && <p className="m-0 text-[13px] text-rose-700">Không tải được thêm sản phẩm. Bấm để thử lại.</p>}
              {canShowMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-[#330033] px-7 py-3 text-[14px] font-semibold text-[#330033] hover:bg-[#330033] hover:text-white disabled:opacity-60"
                >
                  {loadingMore ? 'Đang tải...' : 'Xem thêm sản phẩm'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/search?sort=newest')}
                  className="text-[13.5px] font-semibold text-[#007700] underline-offset-4 hover:underline"
                >
                  Bạn đã xem hết. Tìm theo bộ lọc
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <ForYouSection
        favIds={favIds}
        onToggleFav={toggleFavorite}
        renderHead={(title, note) => <SectionHead title={title} note={note} />}
      />
    </div>
  );
}

export default BuyerDashboard;
