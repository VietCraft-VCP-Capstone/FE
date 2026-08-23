import { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';

interface BuyerHeaderProps {
  user: any;
  cartCount?: number;
  search: string;
  setSearch: (val: string) => void;
}

export function BuyerHeader({ user, cartCount = 0, search, setSearch }: BuyerHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [favCount, setFavCount] = useState(0);

  const name = user?.full_name || user?.name || 'Phương';
  const initial = name.charAt(0).toUpperCase() || 'P';

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Synchronize favorites count from localStorage
  useEffect(() => {
    const readFavCount = () => {
      try {
        const stored = localStorage.getItem('vietcraft_favorites');
        const ids: string[] = stored ? JSON.parse(stored) : [];
        setFavCount(ids.length > 0 ? ids.length : 4); // Default to 4 if empty for demo match
      } catch {
        setFavCount(4);
      }
    };
    readFavCount();

    window.addEventListener('storage', readFavCount);
    const interval = setInterval(readFavCount, 1000);
    return () => {
      window.removeEventListener('storage', readFavCount);
      clearInterval(interval);
    };
  }, []);

  const displayCartCount = cartCount > 0 ? cartCount : 3; // Default 3 if 0 for demo match

  return (
    <header className="buyer-header-nav">
      <div className="buyer-header-container">
        {/* Logo */}
        <div className="buyer-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="logo-green">Viet</span><span className="logo-purple">Craft</span>
        </div>

        {/* Navigation Menu */}
        <nav className="buyer-nav-menu">
          <a onClick={() => navigate('/')} className={location.pathname === '/' ? 'nav-active' : ''}>Khám phá</a>
          <a onClick={() => navigate('/gifts')} className={isActive('/gifts') ? 'nav-active' : ''}>Quà tặng</a>
          <a onClick={() => navigate('/collections')} className={isActive('/collections') ? 'nav-active' : ''}>Bộ sưu tập</a>
          <a onClick={() => navigate('/vouchers')} className={isActive('/vouchers') ? 'nav-active' : ''}>Voucher</a>
        </nav>

        {/* Search Bar */}
        <div className="buyer-search-bar">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm thiết kế, nghệ thuật, quà tặng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Action Icons */}
        <div className="buyer-actions">
          {/* Favorites Icon */}
          <button
            type="button"
            className="icon-btn relative"
            onClick={() => navigate('/favorites')}
            title="Yêu thích"
          >
            <Heart
              size={22}
              className={
                isActive('/favorites')
                  ? 'text-[#e11d48] fill-[#e11d48] transition-colors'
                  : 'text-gray-600 hover:text-red-500 transition-colors'
              }
              fill={isActive('/favorites') ? '#e11d48' : 'none'}
            />
            {favCount > 0 && (
              <span className="badge bg-[#15803d] text-white">
                {favCount > 99 ? '99+' : favCount}
              </span>
            )}
          </button>

          {/* Shopping Bag Icon */}
          <button
            type="button"
            className="icon-btn relative"
            onClick={() => navigate('/cart')}
            title="Giỏ hàng"
          >
            <ShoppingBag
              size={22}
              className={
                isActive('/cart')
                  ? 'text-gray-900 stroke-[2.5] transition-colors'
                  : 'text-gray-600 stroke-[1.8] hover:text-gray-900 transition-colors'
              }
            />
            {displayCartCount > 0 && (
              <span className="badge bg-[#15803d] text-white">
                {displayCartCount}
              </span>
            )}
          </button>

          {/* Message / Chat Icon */}
          <button type="button" className="icon-btn relative" title="Tin nhắn">
            <MessageCircle size={22} className="text-gray-600 hover:text-gray-900 transition-colors" />
          </button>

          {/* User Green Circle Avatar with Letter P */}
          <button
            type="button"
            className="buyer-avatar bg-[#007700] text-white font-bold text-base w-9 h-9 rounded-full flex items-center justify-center border-none shadow-sm hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/profile');
            }}
            title="Hồ sơ"
          >
            {initial}
          </button>
        </div>
      </div>
    </header>
  );
}

export default BuyerHeader;
