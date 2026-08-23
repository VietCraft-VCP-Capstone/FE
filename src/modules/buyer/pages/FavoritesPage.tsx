import React, { useState, useEffect } from 'react';
import { Heart, ChevronDown, ArrowLeft } from 'lucide-react';
import { favoritesService } from '../../product/services/favoritesService';
import { cartService } from '../../order/services/cartService';
import { LandingHeader } from '../../landing/components/LandingHeader';
import { useAuth } from '../../auth/hooks/useAuth';

export function FavoritesPage() {
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const userName = user?.name || 'Nhi';

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await favoritesService.getFavorites();
      if (res && Array.isArray(res.product_ids)) {
        setFavorites(res.product_ids);
      } else if (Array.isArray(res)) {
        setFavorites(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setFavorites(res.data);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await favoritesService.removeFavorite(id);
      setFavorites((prev) => prev.filter((item) => (item._id || item.id || item) !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      const productId = product._id || product.id || product;
      await cartService.addToCart({ productId, quantity: 1 });
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      <LandingHeader
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogin={() => {}}
        onLogout={logout}
        onSignup={() => {}}
        onHome={() => (window.location.href = '/')}
        onDashboard={() => (window.location.href = '/')}
      />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {/* Nút quay lại mua sắm */}
        <div className="mb-4">
          <button
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#15803d] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
          </button>
        </div>

        {/* Header trang */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#331b3b]">
              Sản phẩm yêu thích của {userName}
            </h1>
          </div>

          <div className="relative">
            <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2">
              Sắp xếp: Mới nhất <span className="text-xs">▾</span>
            </button>
          </div>
        </div>

        {/* Đường kẻ ngang ngăn cách mỏng */}
        <hr className="border-t border-gray-200 my-6" />

        {/* 5-Column Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-80 bg-gray-100 rounded-[24px]"></div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            Chưa có sản phẩm yêu thích nào.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((item) => {
              const product = item.product || item;
              const prodId = product._id || product.id || item;
              return (
                <div key={prodId} className="group flex flex-col">
                  {/* Image Container */}
                  <div className="relative w-full aspect-square rounded-[24px] overflow-hidden bg-gray-100">
                    <img
                      src={
                        product.image ||
                        product.thumbnail ||
                        product.images?.[0] ||
                        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400'
                      }
                      alt={product.title || product.name || 'Sản phẩm'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Heart Badge Button */}
                    <button
                      onClick={() => handleRemoveFavorite(prodId)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
                    >
                      <Heart className="fill-[#15803d] text-[#15803d] w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mt-3 line-clamp-1">
                      {product.title || product.name || 'Cốc Sứ Thủ Công'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {product.storeName || product.shopName || 'Gốm Mộc Studio'}
                    </p>
                    <p className="text-sm font-bold text-[#15803d] mt-1">
                      {new Intl.NumberFormat('vi-VN').format(
                        product.retail_price || product.price || 250000
                      )}{' '}
                      đ
                    </p>

                    {/* Pill Border Button */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full mt-3 py-2 rounded-full border border-[#15803d] text-[#15803d] bg-white hover:bg-[#15803d] hover:text-white transition-all text-xs font-semibold"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer tối giản 1 dòng chuẩn Figma */}
      <footer className="w-full py-8 text-center text-xs text-gray-400 bg-white border-t border-gray-100 mt-16">
        © 2026 VietCraft. Đã đăng ký bản quyền.
      </footer>
    </div>
  );
}

export default FavoritesPage;
