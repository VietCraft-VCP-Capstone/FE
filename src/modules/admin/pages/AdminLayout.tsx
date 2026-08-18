import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';
import {
  LayoutDashboard, Users, ClipboardCheck, Tag, Scale, Megaphone, Bell, Search
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/admin/users', icon: Users, label: 'Người dùng' },
  { to: '/admin/moderation', icon: ClipboardCheck, label: 'Kiểm duyệt' },
  { to: '/admin/categories', icon: Tag, label: 'Danh mục' },
  { to: '/admin/disputes', icon: Scale, label: 'Tranh chấp' },
  { to: '/admin/marketing', icon: Megaphone, label: 'Marketing' },
];

export function AdminLayout({ children, user, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const handleLogout = () => { onLogout(); navigate('/login'); };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <span className="admin-logo-text select-none font-bold text-2xl">
            <span className="text-[#007700]">Viet</span>
            <span className="text-[#330033]">Craft</span>
          </span>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`admin-nav-item ${location.pathname === to ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-search">
            <Search size={16} className="admin-search-icon" />
            <input type="text" placeholder="Tìm kiếm hệ thống..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-search-input" />
          </div>
          <div className="admin-header-actions">
            <button className="admin-icon-btn"><Bell size={20} /></button>
            <button className="admin-avatar" onClick={handleLogout} title="Đăng xuất">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </button>
          </div>
        </header>
        <main className="admin-content">{children}</main>
        <footer className="admin-footer">
          <span>© 2026 VietCraft. Bản quyền thuộc về nghệ nhân Việt Nam.</span>
          <div className="admin-footer-links">
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Liên hệ</a>
            <a href="#">Trợ giúp</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
