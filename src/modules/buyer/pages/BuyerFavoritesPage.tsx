import { useState, useEffect } from 'react';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/client';
import { cartService } from '../../order/services/cartService';

const CACHE_KEY = 'vietcraft_favorites_cache';

function getCachedFavorites(): any[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function BuyerFavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>(() => getCachedFavorites());
  const [loading, setLoading] = useState(() => getCachedFavorites().length === 0);

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
      // Chỉ hiện skeleton nếu chưa có dữ liệu trong cache
      if (favorites.length === 0) {
        setLoading(true);
      }
      const res = await api.get('/favorites');
      const items = res.data?.data?.items || [];
      setFavorites(items);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(items));
        // Cập nhật số lượng yêu thích cho header
        localStorage.setItem('vietcraft_favorites', JSON.stringify(items.map((it: any) => it.id || it._id)));
      } catch {}
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (err) {
      console.error('Lỗi khi tải danh sách yêu thích:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    // Optimistic Update: cập nhật giao diện ngay lập tức
    const previous = favorites;
    const next = favorites.filter((item) => item._id !== id && item.id !== id);
    setFavorites(next);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      localStorage.setItem('vietcraft_favorites', JSON.stringify(next.map((it: any) => it.id || it._id)));
    } catch {}
    window.dispatchEvent(new CustomEvent('wishlist-updated'));

    try {
      await api.delete(`/favorites/${id}`);
    } catch (err) {
      // Revert lại nếu có lỗi
      setFavorites(previous);
      alert(getApiErrorMessage(err, 'Không thể bỏ yêu thích sản phẩm này.'));
    }
  };

  const handleAddToCart = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cartService.addToCart({ productId: product._id || product.id, quantity: 1 });
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể thêm sản phẩm vào giỏ hàng.'));
    }
  };

  return (
    <div className="w-full bg-white text-gray-900 font-sans min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Nút quay lại mua sắm */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#15803d] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
          </button>
        </div>

        {/* Header trang */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden shrink-0 bg-emerald-50 flex items-center justify-center text-[#15803d]">
              <Heart className="w-5 h-5 fill-[#15803d]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Sản phẩm yêu thích của bạn
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {favorites.length > 0 ? `${favorites.length} sản phẩm đã lưu` : 'Chưa có sản phẩm nào'}
              </p>
            </div>
          </div>
        </div>

        {/* Trạng thái Loading / Danh sách sản phẩm */}
        {loading && favorites.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex flex-col gap-2">
                <div className="w-full aspect-square bg-gray-100 rounded-[24px]"></div>
                <div className="h-4 bg-gray-100 rounded-md w-3/4 mt-2"></div>
                <div className="h-3 bg-gray-100 rounded-md w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded-md w-1/3 mt-1"></div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-24 text-center text-gray-500 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
              <Heart className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Chưa có sản phẩm yêu thích nào</p>
            <p className="text-xs text-gray-400 mt-1 mb-4 leading-relaxed">
              Hãy thả tim những món đồ thủ công độc đáo bạn yêu thích để dễ dàng tìm lại sau này.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2 rounded-full bg-[#15803d] text-white text-xs font-bold hover:bg-[#166534] transition-colors shadow-xs cursor-pointer"
            >
              Khám phá sản phẩm ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((item) => {
              const product = item.product || item;
              const prodId = product._id || product.id || item;
              const title = product.title || product.name || 'Sản phẩm thủ công';
              const imgUrl =
                product.image ||
                product.thumbnail ||
                product.images?.[0] ||
                'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400';
              const shopName = product.shopInfo?.name || product.shopName || product.storeName || 'VietCraft Studio';
              const price = product.retail_price || product.price || 0;

              return (
                <div
                  key={prodId}
                  onClick={() => navigate(`/product/${prodId}`)}
                  className="group flex flex-col cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-gray-100 shadow-xs">
                    <img
                      src={imgUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Heart Badge Button (Xóa khỏi yêu thích) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(prodId);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs shadow-md flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform z-10"
                      title="Bỏ yêu thích"
                    >
                      <Heart className="fill-rose-500 text-rose-500 w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mt-2.5 line-clamp-1 group-hover:text-[#15803d] transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {shopName}
                    </p>
                    <p className="text-sm font-bold text-[#15803d] mt-1">
                      {price.toLocaleString('vi-VN')}₫
                    </p>

                    {/* Pill Button: Thêm vào giỏ */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      className="w-full mt-2.5 py-1.5 px-3 rounded-full border border-[#15803d] text-[#15803d] bg-white hover:bg-[#15803d] hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShoppingBag size={13} />
                      <span>Thêm vào giỏ</span>
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

export default BuyerFavoritesPage;
