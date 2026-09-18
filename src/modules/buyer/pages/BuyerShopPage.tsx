import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  MapPin
} from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { shopService, ShopDetail } from '../../product/services/shopService';
import { isLoggedIn, getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { useToast } from '../../../shared/components/Toast';

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
}

export function BuyerShopPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [shop, setShop] = useState<ShopHeader | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);

    Promise.all([
      productsService.getAll({ shopId: id, pageSize: 60 } as any),
      shopService.getById(id).catch(() => null)
    ])
      .then(([data, shopDetail]) => {
        if (!alive) return;
        const items = data.items || [];
        setProducts(items);

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
            isFollowing: Boolean(detail.isFollowing)
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
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [id]);

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

  const money = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-600 transition-colors hover:text-[#15803d]"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      {/* SHOP PROFILE HEADER: Banner, Avatar Overlap, Slogan, Badges, UserPlus/UserCheck buttons */}
      <header className="mb-8 rounded-2xl border border-stone-200/80 bg-white overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div className="h-44 md:h-52 w-full relative bg-stone-900 overflow-hidden">
          {shop?.banner ? (
            <img
              src={shop.banner}
              alt={shop?.name || 'Shop banner'}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-[#2c3e2d] via-[#384b39] to-[#4e6851] flex items-center justify-center">
              <div className="text-white/20 flex flex-col items-center">
                <Store className="w-16 h-16" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Header Content with Overlap Avatar */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-14 mb-4">
            {/* Avatar & Title & Slogan */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl md:rounded-3xl border-4 border-white bg-white overflow-hidden shadow-md shrink-0 relative z-10">
                {shop?.logo ? (
                  <img src={shop.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-50 text-[#15803d] flex items-center justify-center font-bold text-2xl">
                    <Store className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h1 className="m-0 truncate text-2xl md:text-3xl font-black text-gray-900">
                    {shop?.name || 'Gian hàng'}
                  </h1>
                  <span className="bg-emerald-50 text-[#15803d] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Xưởng thủ công
                  </span>
                </div>

                {/* Slogan / Description */}
                {(shop?.slogan || shop?.description) && (
                  <p className="mt-1 text-xs md:text-sm text-stone-600 italic font-medium line-clamp-2 max-w-2xl">
                    "{shop?.slogan || shop?.description}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions: Follow Button & Chat */}
            <div className="flex items-center gap-2.5 shrink-0 mt-2 md:mt-0">
              <button
                disabled={isSubmittingFollow}
                onClick={handleToggleFollow}
                className={`inline-flex cursor-pointer items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed ${
                  isFollowing
                    ? 'border border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200'
                    : 'border border-transparent bg-[#15803d] text-white hover:bg-[#166534] hover:shadow-sm'
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
                onClick={() => {
                  if (!isLoggedIn()) {
                    navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
                    return;
                  }
                  window.dispatchEvent(new CustomEvent('vietcraft-open-chat', {
                    detail: { shopId: id }
                  }));
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-stone-200"
                title="Bắt đầu chat với gian hàng này"
              >
                <MessageCircle className="h-4 w-4 text-stone-600" />
                <span>Chat với Shop</span>
              </button>
            </div>
          </div>

          {/* Badges: Rating, Products, Followers, Location */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-stone-100 text-xs font-semibold text-stone-600">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200/60">
              <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
              <span>{(shop?.rating ?? 5).toFixed(1)} / 5.0 {shop?.ratingCount ? `(${shop.ratingCount} đánh giá)` : ''}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg">
              <Package className="h-3.5 w-3.5 text-stone-500" />
              <span>{loading ? '—' : `${products.length} sản phẩm`}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg">
              <Users className="h-3.5 w-3.5 text-stone-500" />
              <span>{followersCount} người theo dõi</span>
            </span>

            {(shop?.address || shop?.city || shop?.province) && (
              <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg">
                <MapPin className="h-3.5 w-3.5 text-stone-500" />
                <span>{shop.city || shop.province || shop.address}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Product Listing */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-stone-100 bg-white">
              <div className="aspect-[4/3] animate-pulse bg-stone-100 motion-reduce:animate-none" />
              <div className="space-y-2 p-4">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-stone-100 motion-reduce:animate-none" />
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-stone-100 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center shadow-xs">
          <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
            <PackageSearch className="h-5 w-5" />
          </span>
          <p className="m-0 text-base font-bold text-[#330033]">Gian hàng chưa có sản phẩm nào</p>
          <p className="m-0 max-w-[42ch] text-sm text-stone-500">
            Người bán chưa đăng sản phẩm, hoặc sản phẩm đang tạm ẩn khỏi marketplace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const prodId = p.id || p._id;
            return (
              <Link
                key={prodId}
                to={`/product/${prodId}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white no-underline transition-all duration-300 hover:border-stone-300 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
                  <img
                    src={p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400'}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <span className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-[#15803d] transition-colors">{p.title || p.name}</span>
                  <span className="mt-auto text-base font-extrabold text-[#15803d]">{money(p.price)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BuyerShopPage;
