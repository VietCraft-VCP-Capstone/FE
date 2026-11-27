import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  Store,
  ArrowLeft,
  PackageSearch,
  MessageCircle,
  UserPlus,
  UserCheck,
  Package,
  Users,
  MapPin,
  Ticket,
  Search,
  X,
  SlidersHorizontal,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { shopService, ShopDetail } from '../../product/services/shopService';
import { promotionService, CouponDTO } from '../../promotion/services/promotionService';
import { isLoggedIn, getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { useToast } from '../../../shared/components/Toast';
import { useAuth } from '../../auth/hooks/useAuth';
import { SeoMeta } from '../../../shared/components/SeoMeta';
import { useVoucherWallet } from '../../promotion/hooks/useVoucherWallet';

interface ShopHeader {
  id?: string;
  name: string;
  logo?: string;
  banner?: string;
  slogan?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  rating: number;
  ratingCount?: number;
  productCount?: number;
  followersCount?: number;
  isFollowing?: boolean;
  isOwner?: boolean;
  reputation_score?: number;
  reputation_tier?: string;
}

type TabType = 'all' | 'best_seller' | 'newest' | 'promotions';
type SortOption = 'newest' | 'popular' | 'price_asc' | 'price_desc';

const ITEMS_PER_PAGE = 8;
const currencyFormatter = new Intl.NumberFormat('vi-VN');
const money = (n: number) => currencyFormatter.format(Number(n) || 0) + 'đ';

export function BuyerShopPage() {
  const { user } = useAuth();
  const isSeller = user?.role?.toLowerCase() === 'seller';
  // Tài khoản quản trị chỉ xem gian hàng; theo dõi/chat là thao tác của người mua và người bán.
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  // Seller mở ở tab mới (không có lịch sử) thì mới về Quản lý đối thủ; còn lại lùi đúng trang trước.
  const veQuanLyDoiThu = isSeller && location.key === 'default';
  const productsSectionRef = useRef<HTMLDivElement>(null);

  // Shop & Product Data
  // Trang sản phẩm hiện tại — lọc, sắp xếp, phân trang đều chạy ở server (không giới hạn số sản phẩm của shop).
  const [products, setProducts] = useState<any[]>([]);
  const [resolvedShopId, setResolvedShopId] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [productsReload, setProductsReload] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [shop, setShop] = useState<ShopHeader | null>(null);
  const [vouchers, setVouchers] = useState<CouponDTO[]>([]);

  // State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);

  // Filter & Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (!id) return;
    let alive = true;
    setLoading(true);

    shopService.getById(id)
      .catch(() => null)
      .then(async (shopDetail) => {
        if (!alive) return;
        const resolvedShopId = shopDetail?.id || shopDetail?._id || id;

        setResolvedShopId(String(resolvedShopId));
        const [couponsData] = await Promise.all([
          isLoggedIn()
            ? promotionService.getAvailableCoupons({ shopId: resolvedShopId }).catch(async () => {
                // Fallback: lấy từ tất cả khuyến mãi công khai lọc theo shop_id
                const all = await promotionService.getAll().catch(() => []);
                return all.filter((c: any) => {
                  const sId = typeof c.shop_id === 'object' ? (c.shop_id?._id || c.shop_id?.id) : c.shop_id;
                  return String(sId) === String(resolvedShopId) || String(sId) === String(id);
                });
              })
            : promotionService.getAll().catch(() => []).then((all: any[]) =>
                all.filter((c: any) => {
                  const sId = typeof c.shop_id === 'object' ? (c.shop_id?._id || c.shop_id?.id) : c.shop_id;
                  return String(sId) === String(resolvedShopId) || String(sId) === String(id);
                })
              )
        ]);

        if (!alive) return;

        // Set Shop Info
        if (shopDetail) {
          const detail = shopDetail as ShopDetail;
          setShop({
            id: detail.id || detail._id,
            name: detail.name || detail.shopName || 'Gian hàng',
            logo: detail.logo,
            banner: detail.banner,
            slogan: detail.slogan,
            description: detail.description,
            address: detail.address,
            city: detail.city,
            province: detail.province,
            rating: Number(detail.averageRating ?? detail.rating ?? 0),
            ratingCount: detail.ratingCount || 0,
            productCount: Number(detail.listingCount) || 0,
            followersCount: detail.followersCount || 0,
            isFollowing: Boolean(detail.isFollowing),
            isOwner: Boolean((detail as any).isOwner),
            reputation_score: detail.reputation_score,
            reputation_tier: detail.reputation_tier
          });
          setIsFollowing(Boolean(detail.isFollowing));
          setFollowersCount(detail.followersCount || 0);
        } else {
          // Không có gian hàng này (sai link, shop đã đóng): hiện trạng thái "không tìm thấy", không dựng shop giả.
          setShop(null);
        }

        // Set Vouchers: chỉ hiển thị voucher do chính gian hàng phát hành (API trả kèm voucher toàn sàn)
        if (Array.isArray(couponsData)) {
          setVouchers(couponsData.filter((c: CouponDTO) => !(c.is_platform ?? !c.shop_id)));
        } else {
          setVouchers([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching shop detail', err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [id]);

  // Toggle Follow
  const handleToggleFollow = async () => {
    if (!id || isSubmittingFollow) return;
    if (!isLoggedIn()) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    try {
      setIsSubmittingFollow(true);
      if (isFollowing) {
        const res = await shopService.unfollow(id);
        setIsFollowing(false);
        setFollowersCount(c => (typeof res?.followersCount === 'number' ? res.followersCount : Math.max(0, c - 1)));
        showToast('Đã hủy theo dõi gian hàng.', 'info');
      } else {
        const res = await shopService.follow(id);
        setIsFollowing(true);
        setFollowersCount(c => (typeof res?.followersCount === 'number' ? res.followersCount : c + 1));
        showToast('Đã theo dõi gian hàng thành công!', 'success');
      }
      window.dispatchEvent(new CustomEvent('shop-follow-updated'));
    } catch (err: any) {
      console.error('Toggle follow failed', err);
      showToast(getApiErrorMessage(err, 'Không thể thực hiện thao tác theo dõi.'), 'error');
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  // Save Voucher
  const wallet = useVoucherWallet((msg, type) => showToast(msg, type));
  const savedVouchers = wallet.savedCodes;
  const handleSaveVoucher = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const coupon = vouchers.find((c: any) => c.code === code);
    if (coupon) wallet.toggle(coupon as any);
  };

  // Gõ tìm kiếm: đợi người dùng ngừng gõ 300ms rồi mới hỏi server.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset trang về 1 khi bộ lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedTab, sortOption]);

  // Tab "Bán chạy" / "Hàng mới" quyết định thứ tự; tab "Tất cả" / "Khuyến mãi" theo dropdown.
  const serverSort = selectedTab === 'best_seller' ? 'best_seller'
    : selectedTab === 'newest' ? 'newest'
    : sortOption === 'popular' ? 'best_seller'
    : sortOption === 'price_asc' ? 'price_asc'
    : sortOption === 'price_desc' ? 'price_desc'
    : debouncedSearch ? 'relevance' : 'newest';

  useEffect(() => {
    if (!resolvedShopId) return;
    let alive = true;
    setProductsLoading(true);
    setProductsError(false);
    productsService.searchStrict({
      shopId: resolvedShopId,
      q: debouncedSearch || undefined,
      sort: serverSort,
      onSale: selectedTab === 'promotions' || undefined,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    })
      .then((res) => {
        if (!alive) return;
        setProducts(res.items || []);
        setTotalItems(Number(res.total) || 0);
        setTotalPages(Math.max(1, Number(res.totalPages) || 1));
      })
      .catch((err) => {
        console.error('Error fetching shop products', err);
        if (alive) { setProducts([]); setProductsError(true); }
      })
      .finally(() => { if (alive) setProductsLoading(false); });
    return () => { alive = false; };
  }, [resolvedShopId, debouncedSearch, serverSort, selectedTab, currentPage, productsReload]);

  const paginatedProducts = products;
  const hasActiveFilter = Boolean(debouncedSearch) || selectedTab === 'promotions';

  // Chuyển trang mượt mà không bị giật màn hình
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);

    // Chỉ cuộn nhẹ nhàng nếu vị trí khu vực sản phẩm đã bị trượt khuất lên trên
    if (productsSectionRef.current) {
      const rect = productsSectionRef.current.getBoundingClientRect();
      if (rect.top < 30) {
        const targetY = window.scrollY + rect.top - 80;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth'
        });
      }
    }
  }, [totalPages, currentPage]);

  if (!loading && !shop) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center font-sans">
        <SeoMeta title="Không tìm thấy gian hàng · VietCraft" description="Gian hàng không tồn tại hoặc đã ngừng hoạt động." noindex={true} />
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <Store className="h-6 w-6" />
        </span>
        <p className="text-lg font-bold text-gray-900">Không tìm thấy gian hàng</p>
        <p className="mt-1 text-sm text-stone-500">Gian hàng không tồn tại hoặc đã ngừng hoạt động.</p>
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="mt-6 rounded-xl bg-[#15803d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#166534] cursor-pointer"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 font-sans">
      <SeoMeta
        title={shop?.name ? `${shop.name} · VietCraft` : 'Gian hàng VietCraft'}
        description={shop?.description || shop?.slogan || `Gian hàng ${shop?.name || ''} trên sàn VietCraft.${shop?.ratingCount ? ` Đánh giá ${shop.rating.toFixed(1)} sao.` : ''}`}
        ogImage={shop?.banner || shop?.logo}
        schema={shop ? {
          "@context": "https://schema.org",
          "@type": "Store",
          "name": shop.name,
          "description": shop.description || shop.slogan,
          "image": shop.logo || shop.banner,
          // Chỉ khai báo điểm khi có đánh giá thật
          ...(shop.ratingCount ? {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": shop.rating,
              "reviewCount": shop.ratingCount
            }
          } : {})
        } : undefined}
      />
      {/* Nút quay lại & Banner thông báo nếu là seller */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <button
          onClick={() => (veQuanLyDoiThu ? navigate('/seller/competitors') : navigate(-1))}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-600 transition-colors hover:text-[#15803d]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{veQuanLyDoiThu ? 'Quay lại Quản lý đối thủ' : 'Quay lại'}</span>
        </button>

        {isSeller && !shop?.isOwner && (
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto shadow-2xs">
            <Store size={12} className="text-amber-600" />
            Đang xem ở chế độ Cửa hàng công khai
          </span>
        )}
      </div>

      {/* 1. SHOP PROFILE HEADER: FLOATING CARD OVER BANNER */}
      <header className="mb-10">
        {/* Ảnh bìa Banner */}
        <div className="h-48 sm:h-64 md:h-72 w-full relative rounded-3xl overflow-hidden shadow-sm bg-stone-900">
          {shop?.banner ? (
            <img
              src={shop.banner}
              alt={shop?.name || 'Shop banner'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-[#1c2e1e] via-[#2d4a30] to-[#15803d]/80 flex items-center justify-center">
              <div className="text-white/20 flex flex-col items-center">
                <Store className="w-20 h-20" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </div>

        {/* Floating Card: Đè nhẹ lên mép dưới Banner */}
        <div className="relative -mt-16 sm:-mt-20 mx-3 sm:mx-6 md:mx-8 bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Cụm Avatar + Tên Shop + Badges + Bio */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0">
              {/* Avatar cố định kích thước, viền bo tròn sắc nét */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl md:rounded-3xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0 ring-1 ring-stone-100 flex items-center justify-center">
                {shop?.logo ? (
                  <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-50 text-[#15803d] flex items-center justify-center font-bold text-3xl">
                    <Store className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Tên Shop & Nhãn loại hình & Mô tả */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="m-0 text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight truncate">
                    {shop?.name || 'Gian hàng VietCraft'}
                  </h1>
                  {shop?.reputation_tier === 'TRUSTED' && (
                    <span
                      title="Gian hàng đạt điểm uy tín từ 90 trở lên nhờ chuỗi đơn hàng không khiếu nại"
                      className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Nghệ Nhân Uy Tín</span>
                    </span>
                  )}
                </div>

                {/* Slogan / Bio mô tả */}
                {(shop?.slogan || shop?.description) && (
                  <p className="mt-1.5 text-xs sm:text-sm text-stone-600 italic font-medium line-clamp-2 max-w-2xl leading-relaxed">
                    "{shop?.slogan || shop?.description}"
                  </p>
                )}
              </div>
            </div>

            {/* Nhóm nút hành động: Theo dõi & Chat với Shop */}
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-2 lg:pt-0">
              {shop?.isOwner ? (
                <button
                  type="button"
                  onClick={() => navigate('/seller/storefront')}
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold bg-[#15803d] text-white hover:bg-[#166534] shadow-xs cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Quản lý gian hàng</span>
                </button>
              ) : !isAdmin && (
              <>
              <button
                disabled={isSubmittingFollow}
                onClick={handleToggleFollow}
                className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs disabled:opacity-60 cursor-pointer ${
                  isFollowing
                    ? 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                    : 'border border-transparent bg-[#15803d] text-white hover:bg-[#166534] hover:shadow-md'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-1.5 text-[#15803d]" />
                    <span>Đang theo dõi</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1.5 text-white" />
                    <span>Theo dõi</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn()) {
                    navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
                    return;
                  }
                  window.dispatchEvent(new CustomEvent('vietcraft-open-chat', {
                    detail: { shopId: id }
                  }));
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer border border-stone-200"
                title="Bắt đầu chat với gian hàng này"
              >
                <MessageCircle className="h-4 w-4 text-stone-600" />
                <span>Chat với Shop</span>
              </button>
              </>
              )}
            </div>
          </div>

          {/* Dải chỉ số Stats Bar: Đánh giá, Số sản phẩm, Lượt theo dõi, Địa chỉ */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-stone-600">
            <div className="flex items-center gap-1.5 bg-amber-50/80 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200/60 font-semibold">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {shop?.ratingCount ? (
                <>
                  <span>{shop.rating.toFixed(1)} / 5.0</span>
                  <span className="text-amber-700/80 font-normal">({shop.ratingCount} đánh giá)</span>
                </>
              ) : (
                <span className="font-normal">Chưa có đánh giá</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl text-stone-700">
              <Package className="h-4 w-4 text-[#15803d]" />
              <span className="font-bold text-gray-900">{shop?.productCount ?? totalItems}</span>
              <span>Sản phẩm</span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl text-stone-700">
              <Users className="h-4 w-4 text-[#15803d]" />
              <span className="font-bold text-gray-900">{followersCount}</span>
              <span>Người theo dõi</span>
            </div>

            {(shop?.city || shop?.province || shop?.address) && (
              <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl text-stone-700">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span className="truncate max-w-xs">{shop.city || shop.province || shop.address}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. KHỐI VOUCHER CỦA SHOP (HIỂN THỊ CUỘN NGANG) */}
      {vouchers.length > 0 && (
        <section className="mb-10 bg-gradient-to-r from-emerald-50/80 via-stone-50 to-amber-50/40 rounded-3xl border border-emerald-100/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#15803d] text-white flex items-center justify-center shadow-xs">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                  Mã Giảm Giá Của Gian Hàng
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Lưu mã ngay để nhận ưu đãi trực tiếp khi đặt hàng tại shop
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#15803d] bg-white px-3 py-1 rounded-full border border-emerald-200 shrink-0 shadow-2xs">
              {vouchers.length} mã khả dụng
            </span>
          </div>

          {/* Danh sách thẻ Voucher cuộn ngang */}
          <div className="flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 custom-scrollbar scroll-smooth">
            {vouchers.map((v) => {
              const isSaved = savedVouchers.includes(v.code);
              const discountText =
                v.discount_type === 'PERCENTAGE'
                  ? `Giảm ${v.discount_value}%`
                  : v.discount_type === 'FREE_SHIPPING'
                  ? 'Free Ship'
                  : `Giảm ${money(v.discount_value)}`;
              const minOrderText =
                v.min_order_value && v.min_order_value > 0
                  ? `Đơn từ ${money(v.min_order_value)}`
                  : 'Mọi đơn hàng';
              const maxDiscountText =
                v.discount_type === 'PERCENTAGE' && v.max_discount_amount
                  ? ` (Tối đa ${money(v.max_discount_amount)})`
                  : '';

              return (
                <div
                  key={v.id || v.code}
                  className="group relative flex flex-col justify-between min-w-[260px] sm:min-w-[280px] bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all shrink-0"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-base font-black text-rose-600">
                        {discountText}
                      </span>
                      <span className="font-mono text-xs font-extrabold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                        {v.code}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                      {v.title || `Voucher ưu đãi từ ${shop?.name || 'Shop'}`}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {minOrderText}{maxDiscountText}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-stone-200 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium text-stone-400">
                      {v.end_date ? `HSD: ${new Date(v.end_date).toLocaleDateString('vi-VN')}` : 'Không thời hạn'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleSaveVoucher(v.code, e)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                        isSaved
                          ? 'bg-emerald-100 text-[#15803d] border border-emerald-300'
                          : 'bg-[#15803d] hover:bg-[#166534] text-white shadow-xs'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã lưu</span>
                        </>
                      ) : (
                        <span>Lưu mã</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. BỘ CÔNG CỤ TÌM KIẾM, LỌC VÀ SẮP XẾP SẢN PHẨM */}
      <div ref={productsSectionRef} className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Thanh tìm kiếm nội bộ */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm sản phẩm trong gian hàng này..."
              className="w-full pl-10 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:bg-white transition-all text-gray-900 placeholder:text-stone-400 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Sắp xếp */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SlidersHorizontal className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="text-xs font-semibold text-stone-500 shrink-0">Sắp xếp:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-white border border-stone-200 text-stone-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#15803d] cursor-pointer shadow-xs"
            >
              <option value="newest">Mới nhất</option>
              <option value="popular">Bán chạy nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Các tab chuyển đổi danh mục / nhóm sản phẩm */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {[
            { id: 'all', label: 'Tất cả sản phẩm', count: shop?.productCount ?? totalItems },
            { id: 'best_seller', label: 'Bán chạy nhất' },
            { id: 'newest', label: 'Hàng mới về' },
            { id: 'promotions', label: 'Khuyến mãi hot' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTab === tab.id
                  ? 'bg-[#15803d] text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    selectedTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. GRID HIỂN THỊ SẢN PHẨM & ĐIỀU HƯỚNG */}
      {loading || productsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-stone-100 bg-white">
              <div className="aspect-square animate-pulse bg-stone-100" />
              <div className="space-y-2 p-4">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-stone-100" />
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : productsError ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center shadow-xs">
          <p className="m-0 text-base font-bold text-gray-900">Không tải được sản phẩm của gian hàng</p>
          <button
            type="button"
            onClick={() => setProductsReload((n) => n + 1)}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-bold text-stone-700 hover:border-[#15803d] hover:text-[#15803d] cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center shadow-xs">
          <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <PackageSearch className="h-6 w-6" />
          </span>
          <p className="m-0 text-base font-bold text-gray-900">
            {hasActiveFilter ? 'Không tìm thấy sản phẩm phù hợp' : 'Gian hàng chưa có sản phẩm nào'}
          </p>
          <p className="m-0 max-w-[42ch] text-sm text-stone-500">
            {hasActiveFilter
              ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ sản phẩm.'
              : 'Người bán chưa đăng sản phẩm, hoặc sản phẩm đang tạm ẩn khỏi marketplace.'}
          </p>
          {hasActiveFilter && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTab('all');
              }}
              className="mt-2 text-xs font-bold text-[#15803d] hover:underline cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Vùng sản phẩm kết hợp 2 nút điều hướng bên trái và bên phải (từ sm trở lên) */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            {/* Nút mũi tên chuyển trang bên TRÁI (từ sm trở lên, trên mobile chuyển xuống cụm phân trang dưới để không đè/ép sản phẩm) */}
            {totalPages > 1 && (
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`hidden sm:flex shrink-0 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border items-center justify-center transition-all duration-200 ${
                  currentPage === 1
                    ? 'opacity-25 cursor-not-allowed bg-stone-100 text-stone-300 border-stone-200'
                    : 'bg-white text-stone-700 border-stone-200 shadow-md hover:bg-[#15803d] hover:text-white hover:border-[#15803d] hover:scale-105 active:scale-95 cursor-pointer shadow-stone-200/50'
                }`}
                title="Xem trang trước"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
            )}

            {/* Lưới 8 sản phẩm (2 hàng x 4 cột) với hiệu ứng chuyển trang mượt mà */}
            <div className="flex-1 min-w-0">
              <div
                key={`shop-page-${currentPage}`}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6 page-transition-grid"
              >
                {paginatedProducts.map((p) => {
                  const prodId = p.id || p._id;
                  const hasDiscount = Boolean(p.originalPrice && p.originalPrice > p.price);
                  const discountPct = hasDiscount
                    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                    : 0;
                  const soldCount = Number(p.soldCount ?? p.sold_count) || 0;

                  return (
                    <div
                      key={prodId}
                      onClick={() => navigate(`/products/${prodId}`)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition-all duration-300 hover:border-emerald-300 hover:shadow-lg cursor-pointer"
                    >
                      {/* Product Image & Badges */}
                      <div className="relative aspect-square overflow-hidden bg-stone-50">
                        <img
                          src={
                            p.thumbnail ||
                            p.images?.[0] ||
                            '/image-not-found.jpg'
                          }
                          onError={(e) => { if (!e.currentTarget.src.endsWith('/image-not-found.jpg')) e.currentTarget.src = '/image-not-found.jpg'; }}
                          alt={p.title || p.name || 'Sản phẩm'}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Nhãn % giảm giá */}
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-sm">
                            -{discountPct}%
                          </span>
                        )}
                      </div>

                      {/* Info Container */}
                      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                        <div>
                          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-[#15803d] transition-colors min-h-[2.5rem]">
                            {p.title || p.name}
                          </h3>

                          {/* Đánh giá sao & Đã bán */}
                          <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-stone-500 mt-1.5">
                            {(p.ratingCount ?? 0) > 0 ? (
                              <div className="flex items-center gap-0.5 text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="font-semibold text-stone-700 ml-0.5">
                                  {(p.rating ?? 0).toFixed(1)}
                                </span>
                              </div>
                            ) : (
                              <span className="italic text-stone-400">Chưa có đánh giá</span>
                            )}
                            {soldCount > 0 && (
                              <>
                                <span>•</span>
                                <span>Đã bán {soldCount.toLocaleString('vi-VN')}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Giá bán & Giá gốc */}
                        <div className="mt-3 flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-black text-[#15803d]">
                            {money(p.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-stone-400 line-through">
                              {money(p.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nút mũi tên chuyển trang bên PHẢI (từ sm trở lên) */}
            {totalPages > 1 && (
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`hidden sm:flex shrink-0 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border items-center justify-center transition-all duration-200 ${
                  currentPage === totalPages
                    ? 'opacity-25 cursor-not-allowed bg-stone-100 text-stone-300 border-stone-200'
                    : 'bg-white text-stone-700 border-stone-200 shadow-md hover:bg-[#15803d] hover:text-white hover:border-[#15803d] hover:scale-105 active:scale-95 cursor-pointer shadow-stone-200/50'
                }`}
                title="Xem trang sau"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Dấu chấm chuyển trang tinh tế và chỉ số trang phía dưới */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-3">
                {/* Trên màn hình nhỏ: nút chuyển trang đặt ở đây để không che hay ép sản phẩm */}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`sm:hidden w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    currentPage === 1
                      ? 'opacity-25 cursor-not-allowed bg-stone-100 text-stone-300 border-stone-200'
                      : 'bg-white text-stone-700 border-stone-200 shadow-sm active:scale-95 cursor-pointer'
                  }`}
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentPage === p
                          ? 'w-7 bg-[#15803d]'
                          : 'w-2 bg-stone-300 hover:bg-stone-400'
                      }`}
                      aria-label={`Trang ${p}`}
                      title={`Trang ${p}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`sm:hidden w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                    currentPage === totalPages
                      ? 'opacity-25 cursor-not-allowed bg-stone-100 text-stone-300 border-stone-200'
                      : 'bg-white text-stone-700 border-stone-200 shadow-sm active:scale-95 cursor-pointer'
                  }`}
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <span className="text-xs text-stone-400 font-medium">
                Trang {currentPage} / {totalPages} ({totalItems} sản phẩm)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BuyerShopPage;
