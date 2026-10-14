import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CheckCircle2,
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
  followersCount?: number;
  isFollowing?: boolean;
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const productsSectionRef = useRef<HTMLDivElement>(null);

  // Shop & Product Data
  const [products, setProducts] = useState<any[]>([]);
  const [shop, setShop] = useState<ShopHeader | null>(null);
  const [vouchers, setVouchers] = useState<CouponDTO[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('vietcraft_saved_vouchers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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

        const [data, couponsData] = await Promise.all([
          productsService.getAll({ shopId: resolvedShopId, pageSize: 100 } as any),
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
        const items = data.items || [];
        setProducts(items);

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
            rating: typeof detail.averageRating === 'number' ? detail.averageRating : (detail.rating || 5),
            ratingCount: detail.ratingCount || 0,
            followersCount: detail.followersCount || 0,
            isFollowing: Boolean(detail.isFollowing),
            reputation_score: detail.reputation_score,
            reputation_tier: detail.reputation_tier
          });
          setIsFollowing(Boolean(detail.isFollowing));
          setFollowersCount(detail.followersCount || 0);
        } else {
          const info = items[0]?.shopInfo;
          setShop(info ? {
            name: info.name,
            logo: info.logo,
            rating: info.rating ?? 5,
            followersCount: 0,
            isFollowing: false
          } : null);
        }

        // Set Vouchers
        if (Array.isArray(couponsData)) {
          setVouchers(couponsData);
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
        await shopService.unfollow(id);
        setIsFollowing(false);
        setFollowersCount(c => Math.max(0, c - 1));
        showToast('Đã hủy theo dõi gian hàng.', 'info');
      } else {
        await shopService.follow(id);
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
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
  const handleSaveVoucher = useCallback((code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedVouchers((prev) => {
      let updated: string[];
      if (prev.includes(code)) {
        updated = prev.filter(c => c !== code);
        showToast(`Đã bỏ lưu mã ${code}`, 'info');
      } else {
        updated = [...prev, code];
        showToast(`Đã lưu mã ${code}! Mã sẽ tự động gợi ý khi thanh toán.`, 'success');
      }
      try {
        localStorage.setItem('vietcraft_saved_vouchers', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to write saved vouchers to localStorage', err);
      }
      return updated;
    });
  }, [showToast]);

  // Lọc và sắp xếp sản phẩm (đã tối ưu hóa tính toán và sắp xếp)
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // 1. Tìm kiếm từ khóa nội bộ
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(p => {
        const title = (p.title || p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
        return title.includes(term) || cat.includes(term) || desc.includes(term) || tags.includes(term);
      });
    }

    // 2. Lọc theo tab
    if (selectedTab === 'promotions') {
      list = list.filter(p => Boolean(p.originalPrice && p.originalPrice > p.price));
    } else if (selectedTab === 'best_seller') {
      list.sort((a, b) => {
        const soldA = a.soldCount ?? a.sold_count ?? a.rank ?? 0;
        const soldB = b.soldCount ?? b.sold_count ?? b.rank ?? 0;
        return soldB - soldA;
      });
    } else if (selectedTab === 'newest') {
      list.sort((a, b) => {
        const tA = a._ts || (a._ts = new Date(a.createdAt || 0).getTime());
        const tB = b._ts || (b._ts = new Date(b.createdAt || 0).getTime());
        return tB - tA;
      });
    }

    // 3. Sắp xếp theo dropdown
    if (sortOption === 'price_asc') {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortOption === 'price_desc') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortOption === 'popular' && selectedTab !== 'best_seller') {
      list.sort((a, b) => {
        const rankA = a.soldCount ?? a.sold_count ?? a.rank ?? 0;
        const rankB = b.soldCount ?? b.sold_count ?? b.rank ?? 0;
        return rankB - rankA;
      });
    } else if (sortOption === 'newest' && selectedTab !== 'newest') {
      list.sort((a, b) => {
        const tA = a._ts || (a._ts = new Date(a.createdAt || 0).getTime());
        const tB = b._ts || (b._ts = new Date(b.createdAt || 0).getTime());
        return tB - tA;
      });
    }

    return list;
  }, [products, searchTerm, selectedTab, sortOption]);

  // Reset trang về 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTab, sortOption]);

  // Phân trang
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 font-sans">
      <SeoMeta
        title={shop?.name ? `${shop.name} - Nghệ nhân VietCraft` : 'Gian hàng VietCraft'}
        description={shop?.description || shop?.slogan || `Gian hàng thủ công chính hãng ${shop?.name || ''} trên sàn VietCraft. Đánh giá ${shop?.rating || 5} sao.`}
        ogImage={shop?.banner || shop?.logo}
        schema={shop ? {
          "@context": "https://schema.org",
          "@type": "Store",
          "name": shop.name,
          "description": shop.description || shop.slogan,
          "image": shop.logo || shop.banner,
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": shop.rating || 5,
            "reviewCount": shop.ratingCount || 1
          }
        } : undefined}
      />
      {/* Nút quay lại & Banner thông báo nếu là seller */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <button
          onClick={() => {
            if (isSeller) {
              navigate('/seller/competitors');
            } else {
              navigate(-1);
            }
          }}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-600 transition-colors hover:text-[#15803d]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isSeller ? 'Quay lại Quản lý đối thủ' : 'Quay lại'}</span>
        </button>

        {isSeller && (
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
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#15803d] text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d]" />
                    <span>Xưởng thủ công</span>
                  </span>
                  {shop?.reputation_tier === 'TRUSTED' && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0 shadow-2xs">
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
            </div>
          </div>

          {/* Dải chỉ số Stats Bar: Đánh giá, Số sản phẩm, Lượt theo dõi, Địa chỉ */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-stone-600">
            <div className="flex items-center gap-1.5 bg-amber-50/80 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200/60 font-semibold">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span>{(shop?.rating ?? 5).toFixed(1)} / 5.0</span>
              <span className="text-amber-700/80 font-normal">
                ({shop?.ratingCount || 0} đánh giá)
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-xl text-stone-700">
              <Package className="h-4 w-4 text-[#15803d]" />
              <span className="font-bold text-gray-900">{products.length}</span>
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
            { id: 'all', label: 'Tất cả sản phẩm', count: products.length },
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
      {loading ? (
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
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-stone-200 bg-white px-6 py-16 text-center shadow-xs">
          <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <PackageSearch className="h-6 w-6" />
          </span>
          <p className="m-0 text-base font-bold text-gray-900">
            {searchTerm ? 'Không tìm thấy sản phẩm phù hợp' : 'Gian hàng chưa có sản phẩm nào'}
          </p>
          <p className="m-0 max-w-[42ch] text-sm text-stone-500">
            {searchTerm
              ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ sản phẩm.'
              : 'Người bán chưa đăng sản phẩm, hoặc sản phẩm đang tạm ẩn khỏi marketplace.'}
          </p>
          {searchTerm && (
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
          {/* Vùng sản phẩm kết hợp 2 nút điều hướng bên trái và bên phải (không bao giờ đè lên sản phẩm) */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5">
            {/* Nút mũi tên chuyển trang bên TRÁI */}
            {totalPages > 1 && (
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`shrink-0 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
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
                  const soldCount = p.soldCount ?? p.sold_count ?? (p.rank ? p.rank * 14 + 10 : 8);

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
                            'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400'
                          }
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
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1.5">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="font-semibold text-stone-700 ml-0.5">
                                {(p.rating || 5).toFixed(1)}
                              </span>
                            </div>
                            <span>•</span>
                            <span>Đã bán {soldCount}</span>
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

            {/* Nút mũi tên chuyển trang bên PHẢI */}
            {totalPages > 1 && (
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`shrink-0 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-200 ${
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
            <div className="mt-8 flex flex-col items-center justify-center gap-2">
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
