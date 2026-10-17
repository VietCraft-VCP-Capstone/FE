import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Store,
  Star,
  Package,
  MapPin,
  ArrowLeft,
  ExternalLink,
  UserMinus,
  UserPlus,
  Search,
  Ticket,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { shopService, ShopDetail } from '../../product/services/shopService';
import { productsService } from '../../product/services/productsService';
import { promotionService, CouponDTO } from '../../promotion/services/promotionService';
import { useToast } from '../../../shared/components/Toast';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

export function SellerCompetitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<CouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);

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

        const [productsData, couponsData] = await Promise.all([
          productsService.getAll({ shopId: resolvedShopId, pageSize: 100 } as any).catch(() => ({ items: [] })),
          promotionService.getAvailableCoupons({ shopId: resolvedShopId }).catch(async () => {
            const all = await promotionService.getAll().catch(() => []);
            return all.filter((c: any) => {
              const sId = typeof c.shop_id === 'object' ? (c.shop_id?._id || c.shop_id?.id) : c.shop_id;
              return String(sId) === String(resolvedShopId) || String(sId) === String(id);
            });
          })
        ]);

        if (!alive) return;
        if (shopDetail) {
          setShop(shopDetail as ShopDetail);
          setIsFollowing(Boolean(shopDetail.isFollowing));
        }
        setProducts(productsData.items || []);
        // Chỉ tính voucher do chính gian hàng đối thủ phát hành, bỏ voucher toàn sàn
        setVouchers(Array.isArray(couponsData) ? couponsData.filter((c: CouponDTO) => !(c.is_platform ?? !c.shop_id)) : []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const handleUnfollow = async () => {
    if (!shop || followPending) return;
    const shopId = shop.id || shop._id || id || '';
    try {
      setFollowPending(true);
      await shopService.unfollow(shopId);
      showToast(`Đã dừng theo dõi gian hàng "${shop.name || shop.shopName}".`, 'info');
      navigate('/seller/competitors');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể dừng theo dõi gian hàng này.'), 'error');
    } finally {
      setFollowPending(false);
    }
  };

  // Seller mở xem trước từ trang F32 rồi theo dõi ngay tại đây; BE chặn khi đã đủ 10 shop (BR-201)
  const handleFollow = async () => {
    if (!shop || followPending) return;
    const shopId = shop.id || shop._id || id || '';
    try {
      setFollowPending(true);
      await shopService.follow(shopId);
      setIsFollowing(true);
      showToast(`Đã theo dõi gian hàng "${shop.name || shop.shopName}".`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể theo dõi gian hàng này.'), 'error');
    } finally {
      setFollowPending(false);
    }
  };

  // Price analysis metrics
  const prices = useMemo(() => {
    return products
      .map(p => Number(p.base_price || p.price || p.regular_price || p.variants?.[0]?.retail_price || 0))
      .filter(p => p > 0);
  }, [products]);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => (p.title || p.name || '').toLowerCase().includes(q));
    }

    switch (sortOption) {
      case 'price_asc':
        list.sort((a, b) => {
          const pa = Number(a.base_price || a.price || 0);
          const pb = Number(b.base_price || b.price || 0);
          return pa - pb;
        });
        break;
      case 'price_desc':
        list.sort((a, b) => {
          const pa = Number(a.base_price || a.price || 0);
          const pb = Number(b.base_price || b.price || 0);
          return pb - pa;
        });
        break;
      case 'rating':
        list.sort((a, b) => (b.average_rating || b.rating || 0) - (a.average_rating || a.rating || 0));
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
    }

    return list;
  }, [products, searchTerm, sortOption]);

  const shopDisplayName = shop?.name || shop?.shopName || 'Gian hàng đối thủ';
  const shopSlugOrId = shop?.slug || shop?.id || shop?._id || id;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-6 bg-stone-200 rounded w-48 mb-4" />
        <div className="h-64 bg-stone-200 rounded-3xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-24 bg-stone-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
          <button
            onClick={() => navigate('/seller/competitors')}
            className="hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 text-stone-600"
          >
            <ArrowLeft size={14} />
            <span>Đối thủ đang theo dõi</span>
          </button>
          <ChevronRight size={12} className="text-stone-400" />
          <span className="text-stone-900 font-bold truncate max-w-xs">{shopDisplayName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/shop/${shopSlugOrId}`, '_blank')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="Mở gian hàng này trên giao diện người mua"
          >
            <ExternalLink size={14} />
            <span>Xem giao diện Người mua</span>
          </button>
          {isFollowing ? (
            <button
              disabled={followPending}
              onClick={handleUnfollow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <UserMinus size={14} />
              <span>{followPending ? 'Đang bỏ...' : 'Dừng theo dõi'}</span>
            </button>
          ) : (
            <button
              disabled={followPending || !shop}
              onClick={handleFollow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <UserPlus size={14} />
              <span>{followPending ? 'Đang theo dõi...' : 'Theo dõi'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="h-44 sm:h-56 w-full relative bg-stone-900 overflow-hidden">
          {shop?.banner ? (
            <img src={shop.banner} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#1c2e1e] via-[#2d4a30] to-[#15803d]/80 flex items-center justify-center">
              <Store className="w-16 h-16 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        </div>

        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 sm:-mt-14 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-md shrink-0">
                {shop?.logo ? (
                  <img src={shop.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-2xl">
                    <Store size={32} />
                  </div>
                )}
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                    {shopDisplayName}
                  </h1>
                  {isFollowing && (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Đối thủ đang theo dõi
                    </span>
                  )}
                </div>
                {(shop?.slogan || shop?.description) && (
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl line-clamp-2 italic">
                    "{shop.slogan || shop.description}"
                  </p>
                )}
              </div>
            </div>

            {(shop?.city || shop?.province || shop?.address) && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 self-start md:self-end">
                <MapPin size={14} className="text-stone-400 shrink-0" />
                <span>{shop.city || shop.province || shop.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sản phẩm đang bán</span>
            <Package size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{products.length}</div>
          <div className="text-[11px] text-stone-400 mt-0.5 font-medium">Toàn bộ danh mục đối thủ</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Đánh giá khách hàng</span>
            <Star size={18} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {(shop?.averageRating || shop?.rating || 5.0).toFixed(1)} / 5.0
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5 font-medium">
            {shop?.ratingCount || 0} lượt đánh giá thực tế
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Mức giá trung bình</span>
            <DollarSign size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {avgPrice.toLocaleString('vi-VN')}đ
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5 font-medium">
            Biên độ: {minPrice.toLocaleString('vi-VN')}đ - {maxPrice.toLocaleString('vi-VN')}đ
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Khuyến mãi đang chạy</span>
            <Ticket size={18} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{vouchers.length}</div>
          <div className="text-[11px] text-stone-400 mt-0.5 font-medium">
            {vouchers.length > 0 ? 'Mã giảm giá đang kích hoạt' : 'Hiện chưa tạo mã giảm'}
          </div>
        </div>
      </div>

      {vouchers.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-extrabold text-stone-900">
              Chính sách khuyến mãi của đối thủ ({vouchers.length} mã)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vouchers.map(vc => (
              <div
                key={vc.id || vc.code}
                className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 flex flex-col justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-purple-700 bg-purple-100/90 px-2.5 py-1 rounded-lg border border-purple-200/80">
                      {vc.code}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">
                      {vc.discount_type === 'PERCENTAGE'
                        ? `Giảm ${vc.discount_value}%`
                        : `Giảm ${Number(vc.discount_value || 0).toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-800 mt-2 line-clamp-1">
                    {vc.title || 'Mã giảm giá gian hàng'}
                  </h4>
                  {vc.description && (
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {vc.description}
                    </p>
                  )}
                </div>
                {vc.min_order_value ? (
                  <div className="text-[11px] text-stone-400 pt-2 border-t border-purple-100/80">
                    Đơn tối thiểu: {Number(vc.min_order_value).toLocaleString('vi-VN')}đ
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-stone-900">
              Danh mục sản phẩm ({filteredProducts.length} mặt hàng)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Theo dõi biến động giá và sản phẩm mới của gian hàng đối thủ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm tên sản phẩm..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-emerald-500 focus:outline-none text-stone-700 cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến cao</option>
              <option value="price_desc">Giá: Cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs font-semibold">
            Không tìm thấy sản phẩm nào của đối thủ khớp với từ khóa.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => {
              const pId = p.id || p._id;
              const pPrice = Number(p.base_price || p.price || p.regular_price || p.variants?.[0]?.retail_price || 0);
              const pImg = p.images?.[0] || p.thumbnail || p.image || '/image-not-found.jpg';
              const pRating = typeof p.average_rating === 'number' ? p.average_rating : (p.rating || 5);
              const pSold = p.sold_count || p.total_sold || 0;

              return (
                <div
                  key={pId}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square w-full bg-stone-100 overflow-hidden relative">
                      <img
                        src={pImg}
                        alt={p.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          (e.target as HTMLImageElement).src = '/image-not-found.jpg';
                        }}
                      />
                    </div>
                    <div className="p-3.5">
                      <h4 className="font-bold text-xs text-stone-900 line-clamp-2 leading-snug" title={p.title}>
                        {p.title || 'Sản phẩm đối thủ'}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-2">
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          {pRating.toFixed(1)}
                        </span>
                        {pSold > 0 && (
                          <>
                            <span>•</span>
                            <span>Đã bán {pSold}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 pt-0 flex items-center justify-between border-t border-stone-100 mt-2">
                    <span className="font-extrabold text-sm text-emerald-700">
                      {pPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <button
                      onClick={() => window.open(`/product/${pId}`, '_blank')}
                      className="text-[11px] font-bold text-stone-500 hover:text-emerald-700 p-1 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Xem sản phẩm trên sàn"
                    >
                      <span>Xem</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerCompetitorDetailPage;
