import { useState, useEffect, useRef } from 'react';
import { Search, Heart, Bell, ShoppingBag, MessageCircle, Sparkles, Store, Tag as TagIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../../shared/components/layouts.css';
import { chatService } from '../../chat/services/chatService';
import { notificationService } from '../../notification/services/notificationService';
import { HeaderNotificationDropdown } from '../../notification/components/HeaderNotificationDropdown';
import { favoritesService } from '../../product/services/favoritesService';
import { userService } from '../../user/services/userService';
import { productsService } from '../../product/services/productsService';
import { SuggestResult } from '../../product/types/product';
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
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestResult>({ products: [], shops: [], categories: [] });
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const POPULAR_SEARCHES = [
    'Gốm Bát Tràng',
    'Ví da thủ công',
    'Khay trà gỗ',
    'Bình hoa Wabi-Sabi',
    'Túi tote canvas',
    'Lụa Vạn Phúc'
  ];

  const handleExecuteSearch = (targetKeyword?: string) => {
    const kw = targetKeyword !== undefined ? targetKeyword : search;
    setIsSearchPopoverOpen(false);
    if (!kw || !kw.trim()) {
      navigate('/search');
    } else {
      navigate(`/search?q=${encodeURIComponent(kw.trim())}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!search || !search.trim()) {
      setSuggestions({ products: [], shops: [], categories: [] });
      setIsSuggestLoading(false);
      return;
    }

    setIsSuggestLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(() => {
      if (isComposingRef.current) {
        setIsSuggestLoading(false);
        return;
      }
      productsService.suggest(search, controller.signal)
        .then((res) => {
          setSuggestions(res);
        })
        .catch(() => {
          setSuggestions({ products: [], shops: [], categories: [] });
        })
        .finally(() => {
          setIsSuggestLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  useEffect(() => {
    setCurrentUser(user);
    if (!user?.avatar && isLoggedIn()) {
      userService.getProfile()
        .then((prof: any) => {
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
      navigate('/vouchers');
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

        {/* Search Bar with Live Suggestion Popover */}
        <div className="buyer-search-bar" ref={searchContainerRef} style={{ position: 'relative' }}>
          <Search
            className="search-icon"
            size={16}
            style={{ cursor: 'pointer' }}
            onClick={() => handleExecuteSearch()}
          />
          <input
            type="text"
            placeholder="Tìm kiếm thiết kế, nghệ thuật, quà tặng..."
            value={search}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsSearchPopoverOpen(true);
            }}
            onFocus={() => setIsSearchPopoverOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleExecuteSearch();
              } else if (e.key === 'Escape') {
                setIsSearchPopoverOpen(false);
              }
            }}
          />

          {/* Instant Search Popover Dropdown */}
          {isSearchPopoverOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e7e5e4',
                padding: '16px',
                zIndex: 9999,
                maxHeight: '440px',
                overflowY: 'auto'
              }}
            >
              {/* Trường hợp 1: Chưa gõ gì -> Hiện từ khoá thịnh hành */}
              {!search.trim() ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: '#44403c', fontSize: 13, fontWeight: 700 }}>
                    <Sparkles size={15} color="#eab308" />
                    <span>Tìm kiếm thịnh hành</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {POPULAR_SEARCHES.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearch(item);
                          handleExecuteSearch(item);
                        }}
                        style={{
                          backgroundColor: '#f5f5f4',
                          border: '1px solid #e7e5e4',
                          borderRadius: 20,
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#292524',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ecfdf5';
                          e.currentTarget.style.borderColor = '#a7f3d0';
                          e.currentTarget.style.color = '#007700';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f4';
                          e.currentTarget.style.borderColor = '#e7e5e4';
                          e.currentTarget.style.color = '#292524';
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : isSuggestLoading ? (
                /* Đang tải gợi ý */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8, color: '#78716c', fontSize: 13 }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang tìm kiếm gợi ý...</span>
                </div>
              ) : (
                /* Trường hợp 2: Đã có kết quả gợi ý */
                <div>
                  {/* Danh mục gợi ý nếu có */}
                  {suggestions.categories && suggestions.categories.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#78716c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <TagIcon size={13} />
                        <span>Danh mục gợi ý</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {suggestions.categories.map((c) => (
                          <span
                            key={c.id}
                            onClick={() => {
                              setIsSearchPopoverOpen(false);
                              navigate(`/search?category=${encodeURIComponent(c.name)}`);
                            }}
                            style={{
                              backgroundColor: '#f0fdf4',
                              color: '#166534',
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: 12,
                              cursor: 'pointer',
                              border: '1px solid #bbf7d0'
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gian hàng gợi ý nếu có */}
                  {suggestions.shops && suggestions.shops.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#78716c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Store size={13} />
                        <span>Gian hàng thủ công</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {suggestions.shops.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setIsSearchPopoverOpen(false);
                              navigate(`/shop/${s.slug || s.id}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img
                                src={s.logo || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=100'}
                                alt={s.name}
                                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e7e5e4' }}
                              />
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1c1917', display: 'block' }}>{s.name}</span>
                                <span style={{ fontSize: 11, color: '#78716c' }}>Điểm uy tín: {s.reputationScore}/100</span>
                              </div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#008000', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>
                              Xem Shop
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sản phẩm gợi ý */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#78716c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Sản phẩm phù hợp
                    </div>
                    {suggestions.products && suggestions.products.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {suggestions.products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setIsSearchPopoverOpen(false);
                              navigate(`/product/${p.slug || p.id}`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '6px 8px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <img
                              src={p.thumbnail || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=100'}
                              alt={p.title}
                              style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1c1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.title}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#008000' }}>
                                  {p.price > 0 ? `${p.price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
                                </span>
                                {p.average_rating > 0 && (
                                  <span style={{ fontSize: 11, color: '#d97706', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    ★ {p.average_rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: '#a8a29e', margin: '8px 0', fontStyle: 'italic' }}>
                        Không có gợi ý xem nhanh. Nhấn Enter để tìm kiếm toàn bộ sàn.
                      </p>
                    )}
                  </div>

                  {/* Nút xem toàn bộ kết quả */}
                  <div
                    onClick={() => handleExecuteSearch()}
                    style={{
                      marginTop: 14,
                      paddingTop: 10,
                      borderTop: '1px solid #f5f5f4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      color: '#008000',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>Xem tất cả kết quả cho "{search}"</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              )}
            </div>
          )}
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
