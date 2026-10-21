import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';
import { POD_CREATE_ENABLED, POD_CREATE_PATH } from '../featureFlags';
import {
  LayoutGrid, Archive, Store, ShoppingCart, Package, PlusCircle, Palette, Ticket,
  Wallet, Banknote, Rocket, Users,
  Settings, Bell, Mail, PanelLeft, LogOut, ChevronDown, MessageSquare
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { chatService } from '../../chat/services/chatService';
import { notificationService } from '../../notification/services/notificationService';
import { HeaderNotificationDropdown } from '../../notification/components/HeaderNotificationDropdown';
import { WorkspaceSwitcher, rememberSellerPath } from '../../analytics/components/WorkspaceSwitcher';

export interface SellerNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  feature?: string;
}

export interface SellerNavGroup {
  label?: string;
  hint?: string;
  items: SellerNavItem[];
}

interface SellerLayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  groups?: SellerNavGroup[];
}

const OPS_NAV: SellerNavItem[] = [
  { to: '/seller/dashboard', icon: LayoutGrid, label: 'Trang chủ' },
  { to: '/seller/catalog', icon: Archive, label: 'Danh mục sản phẩm' },
  { to: '/seller/storefront', icon: Store, label: 'Thông tin cửa hàng' },
  { to: '/seller/orders', icon: ShoppingCart, label: 'Đơn hàng' },
  { to: '/seller/refund-requests', icon: Package, label: 'Hoàn tiền' },
  { to: '/seller/chat', icon: MessageSquare, label: 'Tin nhắn khách hàng' },
  { to: '/seller/products', icon: Package, label: 'Quản lí sản phẩm' },
  { to: '/seller/products/new', icon: PlusCircle, label: 'Tạo sản phẩm POD' },
  { to: '/seller/designs', icon: Palette, label: 'Kho thiết kế' },
  { to: '/seller/promotions', icon: Ticket, label: 'Khuyến mãi' },
  { to: '/seller/competitors', icon: Users, label: 'Đối thủ đang theo dõi' },
  { to: '/seller/revenue', icon: Wallet, label: 'Doanh thu cửa hàng' },
  { to: '/seller/payouts', icon: Banknote, label: 'Đối soát & rút tiền' },
  { to: '/seller/onboarding', icon: Rocket, label: 'Thiết lập gian hàng' },
];

const OPS_GROUPS: SellerNavGroup[] = [
  { items: OPS_NAV.filter(item => POD_CREATE_ENABLED || item.to !== POD_CREATE_PATH) },
];

const SIDEBAR_COLLAPSED_KEY = 'vietcraft:seller-sidebar-collapsed';

export function SellerLayout({ children, user, onLogout, groups }: SellerLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Sidebar chỉ đóng/mở khi người bán bấm, và giữ lựa chọn đó giữa các trang lẫn lần mở sau.
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'; } catch { return false; }
  });
  const toggleCollapsed = () => {
    setCollapsed(prev => {
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, prev ? '0' : '1'); } catch { /* storage bị chặn: chỉ không nhớ được */ }
      return !prev;
    });
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const handleLogout = () => { onLogout(); navigate('/login'); };

  useEffect(() => {
    chatService.getUnreadCount()
      .then(c => setUnreadChatCount(c))
      .catch(() => {});

    notificationService.getUnreadCount()
      .then(c => setUnreadNotifCount(c))
      .catch(err => console.warn('MSG134', err));

    const onUnreadUpdate = (e: any) => {
      if (typeof e.detail?.unreadCount === 'number') {
        setUnreadChatCount(e.detail.unreadCount);
      } else {
        chatService.getUnreadCount().then(c => setUnreadChatCount(c)).catch(() => {});
      }
    };

    const onNotifUpdate = (e: any) => {
      if (typeof e.detail?.unreadCount === 'number') {
        setUnreadNotifCount(e.detail.unreadCount);
      } else {
        notificationService.getUnreadCount().then(c => setUnreadNotifCount(c)).catch(() => {});
      }
    };

    window.addEventListener('vietcraft-chat-unread-updated', onUnreadUpdate);
    window.addEventListener('vietcraft-message-received', onUnreadUpdate);
    window.addEventListener('vietcraft-notification-unread-updated', onNotifUpdate);
    window.addEventListener('vietcraft-notification-received', onNotifUpdate);

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('vietcraft-chat-unread-updated', onUnreadUpdate);
      window.removeEventListener('vietcraft-message-received', onUnreadUpdate);
      window.removeEventListener('vietcraft-notification-unread-updated', onNotifUpdate);
      window.removeEventListener('vietcraft-notification-received', onNotifUpdate);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  useEffect(() => {
    rememberSellerPath(location.pathname, location.search);
  }, [location.pathname, location.search]);

  const currentPath = location.pathname === '/seller/product-listing' ? '/seller/products' : location.pathname;
  const navGroups = groups ?? OPS_GROUPS;
  const allNavItems = navGroups.flatMap(g => g.items);
  const activeNavTo = allNavItems
    .map(i => i.to)
    .filter(to => {
      if (currentPath === to) return true;
      if (to === '/seller/products' && currentPath.startsWith('/seller/products/new')) return false;
      return currentPath.startsWith(`${to}/`);
    })
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (to: string) => to === activeNavTo;

  return (
    <div className="seller-layout">
      {/* Sidebar Navigation */}
      <aside className={`seller-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="seller-sidebar-top">
          <button className="seller-collapse-btn" onClick={toggleCollapsed} title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
            <PanelLeft size={18} />
          </button>
        </div>
        <nav className="seller-nav">
          {navGroups.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`} className={gi > 0 ? 'mt-4' : undefined}>
              {group.label && !collapsed && (
                <p className="m-0 mb-1.5 px-3.5 text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                  {group.label}
                  {group.hint && <span className="ml-1 font-medium normal-case tracking-normal text-stone-400">· {group.hint}</span>}
                </p>
              )}
              {group.label && collapsed && gi > 0 && <span className="mx-auto mb-2 block h-px w-6 bg-stone-200" aria-hidden />}
              <div className="flex flex-col gap-1">
                {group.items.map(({ to, icon: Icon, label, feature }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`seller-nav-item ${isActive(to) ? 'active' : ''}`}
                    title={collapsed ? `${label}${feature ? ` (${feature})` : ''}` : undefined}
                    aria-current={isActive(to) ? 'page' : undefined}
                  >
                    <Icon size={19} />
                    {!collapsed && <span>{label}</span>}
                    {to === '/seller/chat' && unreadChatCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.2 text-[10px] font-bold bg-red-500 text-white rounded-full">
                        {unreadChatCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="seller-sidebar-footer">
          <Link to="/seller/settings" className="seller-settings-btn" title="Cài đặt cửa hàng">
            <Settings size={19} />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="seller-main">
        {/* Header Bar */}
        <header className="seller-header">
          <div className="seller-logo-area">
            <span className="seller-logo-text select-none">
              <span style={{ color: '#1a6b1a' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span>
            </span>
          </div>
          <div className="seller-header-center">
            <WorkspaceSwitcher />
          </div>
          <div className="seller-header-actions">
            <Link to="/seller/chat" className="seller-icon-btn relative" title="Tin nhắn khách hàng">
              <Mail size={19} />
              {unreadChatCount > 0 && <span className="seller-bell-dot" />}
            </Link>
            <div className="relative">
              <button
                type="button"
                className="seller-icon-btn seller-bell relative cursor-pointer"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                title="Thông báo"
              >
                <Bell size={19} />
                {unreadNotifCount > 0 && <span className="seller-bell-dot" />}
              </button>

              <HeaderNotificationDropdown
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onUnreadCountChange={(count) => setUnreadNotifCount(count)}
              />
            </div>
            <button className="seller-lang-badge">VN <ChevronDown size={13} /></button>
            <div className="seller-user-menu" ref={menuRef}>
              <button className="seller-avatar overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => setMenuOpen(o => !o)} title="Tài khoản">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || 'S'
                )}
              </button>
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

        {/* Main Body */}
        <main className={`seller-content ${location.pathname.includes('/chat') ? 'seller-chat-content' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
