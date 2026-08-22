import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';
import {
  LayoutGrid, Archive, Store, ShoppingCart, Package, Truck, Ticket,
  Wallet, BarChart2, LineChart, Flame, Tag, PieChart, Settings,
  Bell, Mail, PanelLeft, ExternalLink, LogOut, ChevronDown
} from 'lucide-react';

interface SellerLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: '/seller/dashboard', icon: LayoutGrid, label: 'Trang chủ' },
  { to: '/seller/catalog', icon: Archive, label: 'Danh mục sản phẩm' },
  { to: '/seller/storefront', icon: Store, label: 'Thông tin cửa hàng' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { to: '/seller/products', icon: Package, label: 'Quản lí sản phẩm' },
  { to: '/seller/shipping', icon: Truck, label: 'Vận chuyển' },
  { to: '/seller/promotions', icon: Ticket, label: 'Khuyến mãi' },
  { to: '/seller/revenue', icon: Wallet, label: 'Doanh thu cửa hàng' },
  { to: '/seller/product-status', icon: BarChart2, label: 'Trạng thái sản phẩm' },
  { to: '/seller/forecast', icon: LineChart, label: 'Dự báo nhu cầu' },
  { to: '/seller/golden-hour', icon: Flame, label: 'Danh mục & giờ vàng' },
  { to: '/seller/price-optimize', icon: Tag, label: 'Tối ưu giá bán' },
  { to: '/seller/market-share', icon: PieChart, label: 'Thị phần & đối thủ' },
];

export function SellerLayout({ children, user, onLogout }: SellerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const handleLogout = () => { onLogout(); navigate('/login'); };

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  return (
    <div className="seller-layout">
      <aside className={`seller-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="seller-sidebar-top">
          <button className="seller-collapse-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
            <PanelLeft size={18} />
          </button>
        </div>
        <nav className="seller-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`seller-nav-item ${location.pathname === to ? 'active' : ''}`} title={collapsed ? label : undefined}>
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>
        <div className="seller-sidebar-footer">
          <button className="seller-settings-btn" title="Cài đặt">
            <Settings size={19} />
          </button>
        </div>
      </aside>
      <div className="seller-main">
        <header className="seller-header">
          <div className="seller-logo-area">
            <span className="seller-logo-text select-none">
              <span style={{ color: '#1a6b1a' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span>
            </span>
          </div>
          <div className="seller-header-center">
            <button className="seller-trending-btn">Xu hướng mua sắm<Flame size={16} className="seller-fire-icon" /></button>
            <a href="#" className="seller-market-btn" target="_blank" rel="noopener noreferrer">Phân tích thị trường<ExternalLink size={14} /></a>
          </div>
          <div className="seller-header-actions">
            <button className="seller-icon-btn"><Mail size={19} /></button>
            <button className="seller-icon-btn seller-bell"><Bell size={19} /><span className="seller-bell-dot" /></button>
            <button className="seller-lang-badge">VN <ChevronDown size={13} /></button>
            <div className="seller-user-menu" ref={menuRef}>
              <button className="seller-avatar" onClick={() => setMenuOpen(o => !o)} title="Tài khoản">{user?.name?.[0]?.toUpperCase() || 'S'}</button>
              {menuOpen && (
                <div className="seller-user-dropdown">
                  <div className="seller-user-info">
                    <div className="seller-user-name">{user?.name || 'Người bán'}</div>
                    {user?.email && <div className="seller-user-email">{user.email}</div>}
                  </div>
                  <button className="seller-user-logout" onClick={handleLogout}><LogOut size={16} /><span>Đăng xuất</span></button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="seller-content">{children}</main>
      </div>
    </div>
  );
}
