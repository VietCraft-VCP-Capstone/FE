import { useState, useEffect } from 'react';
import { Heart, ArrowLeft, ShoppingBag, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { favoritesService } from '../../product/services/favoritesService';
import { cartService } from '../../order/services/cartService';
import { useToast } from '../../../shared/components/Toast';
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

export function BuyerFavoritesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [activeProductForCart, setActiveProductForCart] = useState<any>(null);

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

  const handleRemoveFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    // Optimistic Update: cập nhật giao diện ngay lập tức
    const previous = favorites;
    const next = favorites.filter((item) => item._id !== id && item.id !== id);
    setFavorites(next);
    try {
      await favoritesService.removeFavorite(id);
      setFavorites(prev => prev.filter(item => (item._id || item.id) !== id));
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      showToast('Đã xóa khỏi danh sách yêu thích', 'info');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
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

          <button
            onClick={() => navigate('/followed-shops')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#15803d] bg-stone-100 hover:bg-emerald-50 px-3.5 py-2 rounded-full transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Store className="w-3.5 h-3.5 text-[#15803d]" />
            <span>Gian hàng đang theo dõi</span>
          </button>
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
              const price = Number(product.price || product.retail_price || product.variants?.[0]?.price || product.variants?.[0]?.retail_price || 0);
              const shopTitle = product.shopInfo?.name || product.shopName || product.storeName || 'VietCraft Selection';
              const imgUrl = resolveProductImage(product);

              return (
                <div 
                  key={prodId} 
                  onClick={() => navigate(`/products/${prodId}`)}
                  className="group flex flex-col cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-gray-100 shadow-xs">
                    <img
                      src={imgUrl}
                      alt={product.title || product.name || 'Sản phẩm'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_FAV_IMG;
                      }}
                    />
                    {/* Heart Badge Button (Xóa khỏi yêu thích) */}
                    <button
                      onClick={(e) => handleRemoveFavorite(prodId, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
                      title="Bỏ yêu thích"
                    >
                      <Heart className="fill-rose-500 text-rose-500 w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 justify-between mt-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-[#15803d] transition-colors">
                        {product.title || product.name || 'Sản phẩm sáng tạo'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {shopTitle}
                      </p>
                      <p className="text-sm font-bold text-[#15803d] mt-1">
                        {new Intl.NumberFormat('vi-VN').format(price)}{' '}đ
                      </p>
                    </div>

                    {/* Pill Button: Thêm vào giỏ */}
                    <button
                      onClick={(e) => handleOpenAddToCartModal(product, e)}
                      className="w-full mt-3 py-2 px-3 rounded-full border border-[#15803d] text-[#15803d] bg-white hover:bg-[#15803d] hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                      <span>Thêm vào giỏ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Chọn Variant & Số Lượng */}
      <SelectVariantModal
        isOpen={variantModalOpen}
        productId={activeProductForCart?._id || activeProductForCart?.id || null}
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
