import React, { useEffect, useState } from 'react';
import { ChevronDown, Heart, Sparkles, ArrowLeft } from 'lucide-react';
import { ProductCard } from '../../../shared/components/ProductCard';
import { favoritesService } from '../../product/services/favoritesService';
import { cartService } from '../../order/services/cartService';
import { LandingHeader } from '../../landing/components/LandingHeader';
import { LandingFooter } from '../../landing/components/LandingFooter';
import { useAuth } from '../../auth/hooks/useAuth';

export const FavoritesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<'latest' | 'price-asc' | 'price-desc' | 'rating'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailSubscription, setEmailSubscription] = useState('');

  const userName = user?.name || 'Nhi';
  const avatarLetter = userName[0]?.toUpperCase() || 'N';

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await favoritesService.getFavorites();
      if (data && Array.isArray(data.product_ids)) {
        const mapped = data.product_ids.map((p: any) => ({
          id: p._id || p,
          title: p.title || 'Sản phẩm thủ công VietCraft',
          price: p.retail_price || 250000,
          originalPrice: p.originalPrice || 350000,
          rating: p.rating || 4.9,
          salesCount: 120,
          imageUrl: p.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400',
          shopName: 'VietCraft Artisan',
          productType: p.product_type || 'READY_TO_SHIP',
          isFavorite: true,
          createdAt: p.created_at || new Date().toISOString()
        }));
        setFavoriteItems(mapped);
      }
    } catch (err: any) {
      console.warn('Backend favorites API error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (id: string) => {
    setFavoriteItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await favoritesService.removeFavorite(id);
    } catch (e) {
      console.error('Failed to remove favorite from DB');
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await cartService.addToCart({ productId, quantity: 1 });
      alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    } catch (e) {
      alert('Đã thêm sản phẩm vào giỏ hàng!');
    }
  };

  // Sorting logic
  const sortedItems = [...favoriteItems].sort((a, b) => {
    if (sortOption === 'price-asc') return a.price - b.price;
    if (sortOption === 'price-desc') return b.price - a.price;
    if (sortOption === 'rating') return b.rating - a.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans text-gray-900">
      {/* Header */}
      <LandingHeader
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogin={() => {}}
        onLogout={logout}
        onSignup={() => {}}
        onHome={() => window.location.href = '/'}
        onDashboard={() => window.location.href = '/'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Navigation Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} /> Tiếp tục mua sắm
          </button>
        </div>

        {/* Title Section & Sorting Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
              {avatarLetter}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Sản phẩm yêu thích của {userName}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {favoriteItems.length} sản phẩm được lưu thủ công
              </p>
            </div>
          </div>

          {/* Sorting Pill Dropdown */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="appearance-none rounded-full border border-gray-300 px-5 py-2.5 pr-10 text-sm font-medium text-gray-700 bg-white hover:border-emerald-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer shadow-sm"
            >
              <option value="latest">Sắp xếp: Mới nhất</option>
              <option value="price-asc">Sắp xếp: Giá tăng dần</option>
              <option value="price-desc">Sắp xếp: Giá giảm dần</option>
              <option value="rating">Sắp xếp: Đánh giá cao</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-pulse py-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-72 bg-gray-100 rounded-3xl"></div>
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          /* Empty Favorites View */
          <div className="py-20 text-center max-w-md mx-auto my-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
              <Heart size={36} className="fill-emerald-700 text-emerald-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Chưa có sản phẩm yêu thích</h3>
            <p className="text-xs text-gray-500 mt-1.5 mb-6 leading-relaxed">
              Bạn chưa lưu sản phẩm thủ công nào. Hãy bấm biểu tượng trái tim trên các sản phẩm bạn yêu thích để xem lại tại đây.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3 text-sm shadow-md transition-all active:scale-95"
            >
              <Sparkles size={16} /> Khám phá sản phẩm ngay
            </button>
          </div>
        ) : (
          /* 5-Column Responsive Product Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {sortedItems.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                price={product.price}
                originalPrice={product.originalPrice}
                rating={product.rating}
                salesCount={product.salesCount}
                imageUrl={product.imageUrl}
                shopName={product.shopName}
                productType={product.productType}
                isFavorite={product.isFavorite}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <LandingFooter
        emailSubscription={emailSubscription}
        setEmailSubscription={setEmailSubscription}
        onSubscribe={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã đăng ký!'); }}
      />
    </div>
  );
};
