import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Store, ArrowLeft, PackageSearch, Heart } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { shopService } from '../../product/services/shopService';
import { isLoggedIn } from '../../../infrastructure/api/interceptors';

interface ShopHeader {
  id?: string;
  name: string;
  logo?: string;
  banner?: string;
  rating: number;
  followersCount?: number;
  isFollowing?: boolean;
}

export function BuyerShopPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [shop, setShop] = useState<ShopHeader | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
          setShop({
            id: shopDetail.id,
            name: shopDetail.name || shopDetail.shopName,
            logo: shopDetail.logo,
            banner: shopDetail.banner,
            rating: shopDetail.rating || shopDetail.averageRating || 5,
            followersCount: shopDetail.followersCount || 0,
            isFollowing: shopDetail.isFollowing
          });
          setIsFollowing(Boolean(shopDetail.isFollowing));
          setFollowersCount(shopDetail.followersCount || 0);
        } else {
          const info = items[0]?.shopInfo;
          setShop(info ? { name: info.name, logo: info.logo, rating: info.rating ?? 5 } : null);
        }
      })
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [id]);

  const handleToggleFollow = async () => {
    if (!id) return;
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    try {
      if (isFollowing) {
        await shopService.unfollow(id);
        setIsFollowing(false);
        setFollowersCount(c => Math.max(0, c - 1));
      } else {
        await shopService.follow(id);
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
      }
    } catch (err) {
      console.error('Toggle follow failed', err);
    }
  };

  const money = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-600 transition-colors hover:text-[#007700]"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <header className="mb-8 flex items-center justify-between gap-5 rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-5">
          {shop?.logo ? (
            <img src={shop.logo} alt="" className="h-20 w-20 shrink-0 rounded-full border border-stone-200 object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <Store className="h-8 w-8" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="m-0 truncate text-2xl font-extrabold text-[#330033]">
              {shop?.name || 'Gian hàng'}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                <Star className="h-4 w-4 fill-current" /> {(shop?.rating ?? 5).toFixed(1)}
              </span>
              <span>{loading ? '—' : `${products.length} sản phẩm`}</span>
              {followersCount > 0 && (
                <span>• {followersCount} người theo dõi</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleToggleFollow}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              isFollowing
                ? 'border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100'
                : 'border border-transparent bg-[#008000] text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFollowing ? 'fill-rose-500 text-rose-500' : ''}`} />
            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button>
        </div>
      </header>

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
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center">
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
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white no-underline transition-all duration-300 hover:border-stone-200 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
                <img
                  src={p.thumbnail || p.images?.[0]}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <span className="line-clamp-2 text-sm font-bold text-[#330033]">{p.title}</span>
                <span className="mt-auto text-base font-extrabold text-[#007700]">{money(p.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuyerShopPage;
