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

  const name = user?.full_name || user?.name || 'Nhi';

  const isActive = (path: string) => location.pathname.startsWith(path);

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
          <button className="icon-btn" onClick={() => navigate('/orders')} title="Đơn hàng">
            <Heart size={20} />
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
