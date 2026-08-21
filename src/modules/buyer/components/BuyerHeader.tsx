import { Search, Heart, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../../../shared/components/layouts.css';

interface BuyerHeaderProps {
  user: any;
  cartCount?: number;
}

export function BuyerHeader({ user, cartCount = 0 }: BuyerHeaderProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const name = user?.full_name || user?.name || 'Nhi';

  return (
    <header className="buyer-header-nav">
      <div className="buyer-header-container">
        <div className="buyer-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="logo-green">Viet</span><span className="logo-purple">Craft</span>
        </div>
        <nav className="buyer-nav-menu">
          <a onClick={() => navigate('/')}>Khám Phá</a>
          <a onClick={() => navigate('/orders')}>Đơn hàng</a>
          <a onClick={() => navigate('/profile')}>Hồ sơ</a>
          <a href="#duoi-100k">Dưới 100k</a>
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
          <button className="buyer-avatar" onClick={() => navigate('/profile')} title="Hồ sơ">
            {name[0].toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}

export default BuyerHeader;
