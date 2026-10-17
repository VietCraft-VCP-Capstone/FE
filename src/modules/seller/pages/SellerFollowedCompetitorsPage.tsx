import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Star, Package, TrendingUp, RefreshCw, Sparkles } from 'lucide-react';
import { shopService, ShopDetail } from '../../product/services/shopService';
import { useToast } from '../../../shared/components/Toast';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { ShopCard } from '../../../shared/components/ShopCard';

export function SellerFollowedCompetitorsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [shops, setShops] = useState<ShopDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const data = await shopService.getFollowedShops();
      setShops(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load competitor shops:', err);
      showToast(getApiErrorMessage(err, 'Không thể tải danh sách đối thủ đang theo dõi.'), 'error');
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
      showToast(`Đã dừng theo dõi gian hàng "${shopName}".`, 'info');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể hủy theo dõi gian hàng này.'), 'error');
    } finally {
      setUnfollowingId(null);
    }
  };

  const totalListings = shops.reduce((acc, s) => acc + (s.listingCount || 0), 0);
  const avgRating = shops.length
    ? (shops.reduce((acc, s) => acc + (s.averageRating || s.rating || 5), 0) / shops.length).toFixed(1)
    : '0.0';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Đối thủ đang theo dõi
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {shops.length} gian hàng
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Bấm vào một gian hàng để xem sản phẩm, giá và khuyến mãi của họ.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Cùng danh sách follow; khu Phân tích có hàng mới của đối thủ, so sánh và giá. */}
          <button
            onClick={() => navigate('/seller/insights/tracking')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles size={14} />
            Phân tích chuyên sâu đối thủ
          </button>
          <button
            onClick={fetchCompetitors}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Store size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{shops.length}</div>
            <div className="text-xs font-semibold text-stone-500">Đối thủ đang theo dõi</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Star size={22} className="fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{avgRating} / 5.0</div>
            <div className="text-xs font-semibold text-stone-500">Đánh giá trung bình đối thủ</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{totalListings}</div>
            <div className="text-xs font-semibold text-stone-500">Tổng sản phẩm đang bán</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
              <div className="h-14 w-14 rounded-full bg-stone-200 mb-4" />
              <div className="h-5 bg-stone-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-stone-100 rounded w-1/2 mb-4" />
              <div className="h-9 bg-stone-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} />
          </div>
          <h3 className="text-lg font-bold text-stone-800 mb-1">
            Chưa theo dõi gian hàng đối thủ nào
          </h3>
          <p className="text-sm text-stone-500 leading-relaxed mb-6">
            Xem các gian hàng bán chạy cùng danh mục với bạn và bấm <strong>Theo dõi</strong> để so sánh và cập nhật xu hướng cạnh tranh.
          </p>
          {/* Trang F32: nhóm shop cùng danh mục có sẵn nút Theo dõi (dùng chung danh sách follow này) */}
          <button
            onClick={() => navigate('/seller/insights/competitors')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Store size={15} />
            Tìm đối thủ cùng danh mục
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map(shop => (
            <ShopCard
              key={shop.id || shop._id}
              shop={shop}
              mode="seller"
              onUnfollow={handleUnfollow}
              isUnfollowing={unfollowingId === (shop.id || shop._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerFollowedCompetitorsPage;
