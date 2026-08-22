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

  const name = user?.full_name || user?.name || 'Nhi';

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Read favorites count from localStorage and update when changed
  useEffect(() => {
    const readFavCount = () => {
      try {
        const stored = localStorage.getItem('vietcraft_favorites');
        const ids: string[] = stored ? JSON.parse(stored) : [];
        setFavCount(ids.length);
      } catch {
        setFavCount(0);
      }
    };
    readFavCount();

    // Listen for storage events from other tabs
    window.addEventListener('storage', readFavCount);
    // Also poll every 1s to catch same-tab updates
    const interval = setInterval(readFavCount, 1000);
    return () => {
      window.removeEventListener('storage', readFavCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="buyer-header-nav">
      <div className="buyer-header-container">
        <div className="buyer-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="logo-green">Viet</span><span className="logo-purple">Craft</span>
        </div>
        <nav className="buyer-nav-menu">
          <a onClick={() => navigate('/')} className={location.pathname === '/' ? 'nav-active' : ''}>Khám phá</a>
          <a onClick={() => navigate('/gifts')} className={isActive('/gifts') ? 'nav-active' : ''}>Quà tặng</a>
          <a onClick={() => navigate('/collections')} className={isActive('/collections') ? 'nav-active' : ''}>Bộ sưu tập</a>
          <a onClick={() => navigate('/vouchers')} className={isActive('/vouchers') ? 'nav-active' : ''}>Voucher</a>
        </nav>
        <div className="buyer-search-bar">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm thiết kế, nghệ thuật, quà tặng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="buyer-actions">
          {/* Favorites icon with count badge */}
          <button
            type="button"
            className={`icon-btn relative ${isActive('/favorites') ? 'active-icon' : ''}`}
            onClick={() => navigate('/favorites')}
            title="Yêu thích"
            style={{ color: isActive('/favorites') ? '#e11d48' : undefined }}
          >
            <Heart size={20} fill={isActive('/favorites') ? '#e11d48' : 'none'} />
            {favCount > 0 && (
              <span className="badge" style={{ backgroundColor: '#e11d48' }}>
                {favCount > 99 ? '99+' : favCount}
              </span>
            )}
          </button>
          <button className="icon-btn relative" onClick={() => navigate('/cart')} title="Giỏ hàng">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
          <button className="icon-btn" title="Tin nhắn" onClick={() => navigate('/chat')}>
            <MessageCircle size={20} />
          </button>
          <button
            type="button"
            className="buyer-avatar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/profile');
            }}
            title="Hồ sơ"
          >
            {name[0].toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}

export default BuyerHeader;
