import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';
import {
  LayoutDashboard, Users, ClipboardCheck, Tag, Scale, Megaphone, Bell, Search, LogOut
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
  { to: '/admin/tags', icon: Tag, label: 'Thẻ' },
  { to: '/admin/disputes', icon: Scale, label: 'Tranh chấp' },
  { to: '/admin/marketing', icon: Megaphone, label: 'Marketing' },
];

export function AdminLayout({ children, user, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const handleLogout = () => { onLogout(); navigate('/login'); };

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-admin-canvas font-[system-ui,-apple-system,sans-serif]">
      {/* Sidebar Navigation */}
      <aside className="flex w-[200px] flex-shrink-0 flex-col border-r border-admin-line bg-admin-surface py-6">
        <div className="px-5 pb-6">
          <span className="select-none font-bold text-2xl tracking-[-0.5px]">
            <span className="text-[#007700]">Viet</span>
            <span className="text-[#330033]">Craft</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium no-underline transition-all duration-150 ${location.pathname === to ? 'bg-admin-brand text-white' : 'text-[#555] hover:bg-[#f0f7f0] hover:text-admin-brand'}`}
            >
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-[60px] flex-shrink-0 items-center border-b border-admin-line bg-admin-surface px-5 xl:px-8">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
          <div className="relative flex max-w-[400px] flex-1 items-center">
            <Search size={16} className="absolute left-3 text-[#999]" />
            <input type="text" placeholder="Tìm kiếm hệ thống..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-[#ddd] bg-admin-canvas py-2 pl-9 pr-3 text-[14px] text-[#333] outline-none transition-colors duration-150 focus:border-admin-brand" />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex cursor-pointer items-center rounded-md border-none bg-transparent p-1.5 text-[#666] transition-colors duration-150 hover:text-admin-brand"><Bell size={20} /></button>
            <div className="relative" ref={menuRef}>
              <button
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-admin-brand text-[14px] font-bold text-white [transition:transform_.1s,box-shadow_.15s] hover:shadow-[0_0_0_3px_#eef7ee] active:scale-95"
                onClick={() => setMenuOpen(o => !o)}
                title="Tài khoản"
              >
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%_+_8px)] z-50 min-w-[220px] animate-[adminDropIn_.14s_ease] overflow-hidden rounded-xl border border-[#e4e9ee] bg-admin-surface shadow-[0_8px_28px_-6px_rgba(15,23,42,0.22)]">
                  <div className="border-b border-[#eef1f4] px-4 py-[14px]">
                    <div className="text-[14px] font-bold text-admin-ink">{user?.name || 'Quản trị viên'}</div>
                    {user?.email && <div className="mt-0.5 overflow-hidden text-ellipsis text-[12px] text-admin-muted">{user.email}</div>}
                  </div>
                  <button
                    className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-4 py-3 text-[13.5px] font-semibold text-admin-danger transition-colors duration-[120ms] hover:bg-admin-danger-050"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} /><span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-5 py-6 xl:px-8 xl:py-7">{children}</main>

        {/* Footer */}
        <footer className="flex h-12 flex-shrink-0 items-center border-t border-admin-line bg-admin-surface px-5 text-[12px] text-[#888] xl:px-8">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
          <span>© 2026 VietCraft.</span>
          <div className="flex gap-4">
            <a href="#" className="text-[#888] no-underline hover:text-admin-brand">Điều khoản sử dụng</a>
            <a href="#" className="text-[#888] no-underline hover:text-admin-brand">Chính sách bảo mật</a>
            <a href="#" className="text-[#888] no-underline hover:text-admin-brand">Liên hệ</a>
            <a href="#" className="text-[#888] no-underline hover:text-admin-brand">Trợ giúp</a>
          </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
