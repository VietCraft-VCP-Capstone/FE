import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  Ticket,
  TrendingUp,
  Settings,
  Bell,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  ChevronDown,
  Globe
} from 'lucide-react';

interface SellerLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { to: '/seller/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/seller/products', icon: Package, label: 'Sản phẩm' },
  { to: '/seller/orders', icon: Truck, label: 'Đơn hàng & Vận chuyển' },
  { to: '/seller/vouchers', icon: Ticket, label: 'Khuyến mãi & Voucher' },
  { to: '/seller/analytics', icon: TrendingUp, label: 'Phân tích thị trường' },
];

export function SellerLayout({ children, user, onLogout }: SellerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-[#F9FAFB] text-stone-800 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <aside
        className={`bg-white border-r border-stone-200 flex flex-col justify-between transition-all duration-300 z-30 flex-shrink-0 ${
          collapsed ? 'w-20' : 'w-60'
        }`}
      >
        {/* Sidebar Top */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-stone-100">
            {!collapsed ? (
              <div className="flex items-center gap-2 select-none">
                <span className="font-extrabold text-xl font-jakarta tracking-tight">
                  <span className="text-[#007700]">Viet</span>
                  <span className="text-[#330033]">Craft</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#EAF0E2] text-[#007700]">
                  Người bán
                </span>
              </div>
            ) : (
              <div className="mx-auto font-extrabold text-lg text-[#007700]">VC</div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-[#EAF0E2] text-[#007700] shadow-2xs font-bold'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                  title={collapsed ? label : undefined}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#007700]' : 'text-stone-400 group-hover:text-stone-700'
                    }`}
                  />
                  {!collapsed && <span className="truncate font-jakarta">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-100">
          <Link
            to="/seller/settings"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            title={collapsed ? 'Cài đặt cửa hàng' : undefined}
          >
            <Settings size={19} className="text-stone-400" />
            {!collapsed && <span className="font-jakarta">Cài đặt</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top App Bar (Header) */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-20">
          {/* Header Left */}
          <div className="flex items-center gap-3">
            <a
              href="/seller/analytics"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF0E2]/60 hover:bg-[#EAF0E2] text-[#007700] text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#BECAB6]/40 font-jakarta"
            >
              <span>Phân tích thị trường</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Header Right */}
          <div className="flex items-center gap-3.5">
            <button
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer relative"
              title="Tin nhắn"
            >
              <Mail size={18} />
            </button>

            <button
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer relative"
              title="Thông báo"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#BA1A1A] ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 cursor-pointer hover:bg-stone-100 transition-colors">
              <Globe size={14} className="text-stone-400" />
              <span>VN</span>
              <ChevronDown size={12} className="text-stone-400" />
            </div>

            <div className="w-px h-6 bg-stone-200" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer text-left"
              title="Đăng xuất"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#007700] to-[#94FC7E] text-white flex items-center justify-center font-bold text-sm shadow-xs font-jakarta">
                {user?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-stone-900 leading-tight font-jakarta">
                  {user?.name || 'Chủ xưởng Bát Tràng'}
                </p>
                <p className="text-[10px] text-stone-500">Kênh người bán</p>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFB]">
          {children}
        </main>
      </div>
    </div>
  );
}
