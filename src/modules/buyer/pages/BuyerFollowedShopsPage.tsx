import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, Heart } from 'lucide-react';
import { shopService, ShopDetail } from '../../product/services/shopService';
import { useToast } from '../../../shared/components/Toast';
import { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';
import { ShopCard } from '../../../shared/components/ShopCard';

export function BuyerFollowedShopsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [shops, setShops] = useState<ShopDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFollowedShops();
  }, []);

  const fetchFollowedShops = async () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const data = await shopService.getFollowedShops();
      setShops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching followed shops:', err);
      showToast(getApiErrorMessage(err, 'Không thể tải danh sách gian hàng đang theo dõi.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (shopId: string, shopName: string) => {
    if (unfollowingId) return;
    try {
      setUnfollowingId(shopId);
      await shopService.unfollow(shopId);
      setShops(prev => prev.filter(s => s.id !== shopId && s._id !== shopId));
      showToast(`Đã hủy theo dõi gian hàng "${shopName}".`, 'info');
      window.dispatchEvent(new CustomEvent('shop-follow-updated'));
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể hủy theo dõi gian hàng này.'), 'error');
    } finally {
      setUnfollowingId(null);
    }
  };

  return (
    <div className="w-full bg-[#fdfbf7] min-h-[calc(100vh-160px)] py-8 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#15803d] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          <button
            onClick={() => navigate('/favorites')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-rose-600 bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Xem sản phẩm yêu thích</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#15803d] border border-emerald-100 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Gian hàng đang theo dõi
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                {loading
                  ? 'Đang tải danh sách xưởng và nghệ nhân thủ công...'
                  : `Bạn đang theo dõi ${shops.length} gian hàng thủ công.`}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-28 bg-gray-100" />
                <div className="p-5 pt-0 relative">
                  <div className="w-16 h-16 rounded-full bg-gray-200 -mt-8 border-4 border-white mb-3" />
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                  <div className="h-10 bg-gray-100 rounded-xl w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-stone-200/80 p-12 text-center max-w-2xl mx-auto my-8 shadow-xs">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#15803d] border border-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Store className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">
              Chưa theo dõi gian hàng nào
            </h2>
            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-8 max-w-md mx-auto">
              Bạn chưa theo dõi gian hàng nào. Hãy khám phá các xưởng thủ công yêu thích để nhận thông báo sản phẩm mới nhất!
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#15803d] hover:bg-[#166534] text-white text-sm font-bold shadow-sm transition-all hover:scale-105 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              Khám phá xưởng thủ công
            </button>
          </div>
        ) : (
          /* Grid of Followed Shops */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map(shop => (
              <ShopCard
                key={shop.id || shop._id}
                shop={shop}
                mode="buyer"
                onUnfollow={handleUnfollow}
                isUnfollowing={unfollowingId === (shop.id || shop._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerFollowedShopsPage;
