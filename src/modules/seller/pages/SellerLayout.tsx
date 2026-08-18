import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';
import {
  LayoutDashboard, BookOpen, Store, ShoppingCart, BarChart2,
  Wallet, List, Settings, Bell, Mail, ChevronLeft, ChevronRight,
  ExternalLink, Flame
} from 'lucide-react';

interface SellerLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/products', icon: BookOpen, label: 'Product Catalog' },
  { to: '/seller/storefront', icon: Store, label: 'Storefront' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/seller/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/seller/payouts', icon: Wallet, label: 'Payouts' },
  { to: '/seller/product-listing', icon: List, label: 'Product Listing' },
];

export function SellerLayout({ children, user, onLogout }: SellerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const handleLogout = () => { onLogout(); navigate('/login'); };

  return (
    <div className="seller-layout">
      <aside className={`seller-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <button className="seller-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <nav className="seller-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`seller-nav-item ${location.pathname === to ? 'active' : ''}`} title={collapsed ? label : undefined}>
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>
        <div className="seller-sidebar-footer">
          <button className="seller-settings-btn" onClick={handleLogout} title={collapsed ? 'Cài đặt' : undefined}>
            <Settings size={18} />
            {!collapsed && <span>Cài đặt</span>}
          </button>
        </div>
      </aside>
      <div className="seller-main">
        <header className="seller-header">
          <div className="seller-logo-area">
            <span className="seller-logo-text select-none font-bold text-2xl">
              <span className="text-[#007700]">Viet</span><span className="text-[#330033]">Craft</span>
            </span>
          </div>
          <div className="seller-header-center">
            <button className="seller-trending-btn"><Flame size={16} className="seller-fire-icon" />Xu hướng mua sắm</button>
            <a href="#" className="seller-market-btn" target="_blank" rel="noopener noreferrer">Phân tích thị trường<ExternalLink size={14} /></a>
          </div>
          <div className="seller-header-actions">
            <button className="seller-icon-btn"><Mail size={20} /></button>
            <button className="seller-icon-btn"><Bell size={20} /></button>
            <span className="seller-lang-badge">VN</span>
            <button className="seller-avatar" onClick={handleLogout} title="Đăng xuất">{user?.name?.[0]?.toUpperCase() || 'S'}</button>
          </div>
        </header>
        <main className="seller-content">{children}</main>
      </div>
    </div>
  );
}
