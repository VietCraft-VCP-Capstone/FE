import { useState, useEffect } from 'react';
import { Search, Heart, Bell, ShoppingBag, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';
import { chatService } from '../../chat/services/chatService';
import { notificationService } from '../../notification/services/notificationService';
import { HeaderNotificationDropdown } from '../../notification/components/HeaderNotificationDropdown';
import { favoritesService } from '../../product/services/favoritesService';
import { isLoggedIn } from '../../../infrastructure/api/interceptors';

interface BuyerHeaderProps {
  user: any;
  cartCount?: number;
  search: string;
  setSearch: (val: string) => void;
}

export function BuyerHeader({ user, cartCount = 0, search, setSearch }: BuyerHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(user);
  const [favCount, setFavCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
    if (!user?.avatar && isLoggedIn()) {
      userService.getProfile()
        .then((prof) => {
          if (prof) {
            setCurrentUser((prev: any) => ({ ...prev, ...prof }));
          }
        })
        .catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      if (e?.detail) {
        setCurrentUser((prev: any) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('vietcraft-user-updated', handleUserUpdate);
    return () => window.removeEventListener('vietcraft-user-updated', handleUserUpdate);
  }, []);

  const name = currentUser?.full_name || currentUser?.name || '';
  const initial = name.charAt(0).toUpperCase() || '';
  const avatarUrl = currentUser?.avatar;

  const isActive = (path: string) => location.pathname.startsWith(path);

  const refreshFavCount = () => {
    if (!isLoggedIn()) {
      setFavCount(0);
      return;
    }
    favoritesService.getFavorites()
      .then((res) => setFavCount(Array.isArray(res?.product_ids) ? res.product_ids.length : 0))
      .catch(() => setFavCount(0));
  };

  const refreshChatUnread = () => {
    if (!isLoggedIn()) {
      setUnreadChatCount(0);
      return;
    }
    chatService.getUnreadCount()
      .then((count) => setUnreadChatCount(count))
      .catch(() => setUnreadChatCount(0));
  };

  const refreshNotifUnread = () => {
    if (!isLoggedIn()) {
      setUnreadNotifCount(0);
      return;
    }
    notificationService.getUnreadCount()
      .then((count) => setUnreadNotifCount(count))
      .catch(() => setUnreadNotifCount(0));
  };

  useEffect(() => {
    refreshFavCount();
    refreshChatUnread();
    refreshNotifUnread();

    const handleChatUpdate = (e: any) => {
      if (typeof e.detail?.unreadCount === 'number') {
        setUnreadChatCount(e.detail.unreadCount);
      } else {
        refreshChatUnread();
      }
    };

    const handleNotifUpdate = (e: any) => {
      if (typeof e.detail?.unreadCount === 'number') {
        setUnreadNotifCount(e.detail.unreadCount);
      } else {
        refreshNotifUnread();
      }
    };

    window.addEventListener('wishlist-updated', refreshFavCount);
    window.addEventListener('vietcraft-chat-unread-updated', handleChatUpdate);
    window.addEventListener('vietcraft-message-received', refreshChatUnread);
    window.addEventListener('vietcraft-notification-unread-updated', handleNotifUpdate);
    window.addEventListener('vietcraft-notification-received', handleNotifUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', refreshFavCount);
      window.removeEventListener('vietcraft-chat-unread-updated', handleChatUpdate);
      window.removeEventListener('vietcraft-message-received', refreshChatUnread);
      window.removeEventListener('vietcraft-notification-unread-updated', handleNotifUpdate);
      window.removeEventListener('vietcraft-notification-received', handleNotifUpdate);
    };
  }, []);

  const handleNav = (target: 'home' | 'gifts' | 'collections' | 'vouchers') => {
    if (target === 'home') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
      return;
    }

    if (target === 'vouchers') {
      if (location.pathname === '/' || location.pathname === '/vouchers') {
        const el = document.getElementById('vouchers-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/vouchers');
        }
      } else {
        navigate('/vouchers');
      }
      return;
    }

    if (target === 'collections') {
      if (location.pathname === '/' || location.pathname === '/collections') {
        const el = document.getElementById('collections-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/collections');
        }
      } else {
        navigate('/collections');
      }
      return;
    }

    if (target === 'gifts') {
      if (location.pathname === '/' || location.pathname === '/gifts') {
        const el = document.getElementById('gifts-section') || document.getElementById('kham-pha');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/gifts');
        }
      } else {
        navigate('/gifts');
      }
      return;
    }
  };

  const displayCartCount = cartCount;

  return (
    <header className="buyer-header-nav">
      <div className="buyer-header-container">
        {/* Logo */}
        <div className="buyer-logo" onClick={() => handleNav('home')} style={{ cursor: 'pointer' }}>
          <span className="logo-green">Viet</span><span className="logo-purple">Craft</span>
        </div>

        {/* Navigation Menu */}
        <nav className="buyer-nav-menu">
          <a onClick={() => handleNav('home')} className={location.pathname === '/' ? 'nav-active' : ''} style={{ cursor: 'pointer' }}>Khám phá</a>
          <a onClick={() => handleNav('gifts')} className={isActive('/gifts') ? 'nav-active' : ''} style={{ cursor: 'pointer' }}>Quà tặng</a>
          <a onClick={() => handleNav('collections')} className={isActive('/collections') ? 'nav-active' : ''} style={{ cursor: 'pointer' }}>Bộ sưu tập</a>
          <a onClick={() => handleNav('vouchers')} className={isActive('/vouchers') ? 'nav-active' : ''} style={{ cursor: 'pointer' }}>Voucher</a>
          <a
            onClick={() => navigate(user?.role?.toLowerCase() === 'seller' ? '/seller' : '/seller/register')}
            className={location.pathname.startsWith('/seller') ? 'nav-active text-[#007700] font-bold' : 'text-[#007700] font-semibold hover:text-[#005B00]'}
            style={{ cursor: 'pointer' }}
          >
            Kênh Người Bán
          </a>
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

        {/* Action Icons (Đã dời Thông báo sang bên phải, cạnh Avatar và Chat) */}
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
          <button
            type="button"
            className="icon-btn relative"
            title="Tin nhắn"
            onClick={() => window.dispatchEvent(new CustomEvent('vietcraft-open-chat', { detail: { toggle: true } }))}
          >
            <MessageCircle size={22} className="text-gray-600 hover:text-gray-900 transition-colors" />
            {unreadChatCount > 0 && (
              <span className="badge bg-red-600 text-white animate-pulse">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Notifications Icon (Dời sang bên phía tay phải cạnh Avatar, tránh bị che giữa màn hình) */}
          <div className="relative">
            <button
              type="button"
              className="icon-btn relative"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              title="Thông báo"
            >
              <Bell
                size={22}
                className={
                  isNotifOpen
                    ? 'text-[#15803d] stroke-[2.5] transition-colors'
                    : 'text-gray-600 stroke-[1.8] hover:text-gray-900 transition-colors'
                }
              />
              {unreadNotifCount > 0 && (
                <span className="badge bg-red-600 text-white animate-pulse">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            <HeaderNotificationDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onUnreadCountChange={(count) => setUnreadNotifCount(count)}
              className="right-0 sm:right-[-40px]"
            />
          </div>

          {/* User Avatar */}
          <button
            type="button"
            className="buyer-avatar bg-[#007700] text-white font-bold text-base w-9 h-9 rounded-full flex items-center justify-center border border-stone-200/60 shadow-sm hover:opacity-90 transition-opacity overflow-hidden shrink-0 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/profile');
            }}
            title="Hồ sơ"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover rounded-full" />
            ) : (
              initial
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default BuyerHeader;
