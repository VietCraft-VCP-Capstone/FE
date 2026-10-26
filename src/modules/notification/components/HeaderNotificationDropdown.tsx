import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ShoppingBag,
  Tag,
  Package,
  Store,
  CheckCheck,
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { NotificationItem } from '../types/notificationTypes';
import { isLoggedIn } from '../../../infrastructure/api/client';

interface HeaderNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  className?: string;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Hôm qua';
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return 'Gần đây';
  }
}

function getNotificationIcon(type: string, direction?: string) {
  switch (type) {
    case 'ORDER_UPDATE':
      return {
        icon: <ShoppingBag size={18} className="text-blue-600" />,
        bg: 'bg-blue-50 border-blue-100'
      };
    case 'PROMOTION':
      return {
        icon: <Tag size={18} className="text-amber-600" />,
        bg: 'bg-amber-50 border-amber-100'
      };
    case 'ANALYTICS_ALERT':
      return direction === 'drop'
        ? { icon: <TrendingDown size={18} className="text-rose-600" />, bg: 'bg-rose-50 border-rose-100' }
        : { icon: <TrendingUp size={18} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' };
    case 'LOW_STOCK':
    case 'PRODUCT_UNPUBLISHED':
    case 'PRODUCT_REPUBLISHED':
      return {
        icon: <Package size={18} className="text-orange-600" />,
        bg: 'bg-orange-50 border-orange-100'
      };
    case 'SELLER_APPLICATION_APPROVED':
    case 'SELLER_APPLICATION_REJECTED':
      return {
        icon: <Store size={18} className="text-emerald-600" />,
        bg: 'bg-emerald-50 border-emerald-100'
      };
    default:
      return {
        icon: <Bell size={18} className="text-[#15803d]" />,
        bg: 'bg-emerald-50 border-emerald-100'
      };
  }
}

export function HeaderNotificationDropdown({
  isOpen,
  onClose,
  onUnreadCountChange,
  className = 'right-0'
}: HeaderNotificationDropdownProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [unreadCount, setUnreadCount] = useState(0);

  // Tải danh sách thông báo từ API
  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn()) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 30 });
      // Lọc bỏ tin nhắn chat (ngoại trừ message ra)
      const validItems = (res.items || []).filter((n) => n.type !== ('NEW_MESSAGE' as any));
      setNotifications(validItems);

      const unread = validItems.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
      onUnreadCountChange?.(unread);
    } catch (err) {
      console.error('Lỗi tải thông báo header:', err);
    } finally {
      setLoading(false);
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Lắng nghe sự kiện thông báo realtime
  useEffect(() => {
    const handleNewNotif = (e: any) => {
      const newNotif = e.detail;
      if (!newNotif || newNotif.type === 'NEW_MESSAGE') return;

      setNotifications((prev) => {
        const id = newNotif.id || newNotif._id;
        const exists = prev.some((n) => (n.id || n._id) === id);
        if (exists) return prev;
        return [newNotif, ...prev];
      });

      setUnreadCount((c) => {
        const next = c + 1;
        onUnreadCountChange?.(next);
        return next;
      });
    };

    const handleUnreadUpdated = (e: any) => {
      if (typeof e.detail?.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
        onUnreadCountChange?.(e.detail.unreadCount);
      }
    };

    window.addEventListener('vietcraft-notification-received', handleNewNotif);
    window.addEventListener('vietcraft-notification-unread-updated', handleUnreadUpdated);

    return () => {
      window.removeEventListener('vietcraft-notification-received', handleNewNotif);
      window.removeEventListener('vietcraft-notification-unread-updated', handleUnreadUpdated);
    };
  }, [onUnreadCountChange]);

  // Đóng khi click bên ngoài dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Đánh dấu 1 thông báo đã đọc & điều hướng
  const handleClickItem = async (item: NotificationItem) => {
    const id = item.id || item._id;
    if (!id) return;

    if (!item.is_read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ((n.id || n._id) === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        onUnreadCountChange?.(next);
        return next;
      });

      notificationService.markAsRead(id).catch(() => {});
    }

    onClose();

    if (item.link) {
      navigate(item.link);
    }
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    onUnreadCountChange?.(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
    }
  };

  if (!isOpen) return null;

  const displayList =
    activeTab === 'UNREAD' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full mt-2.5 w-[380px] sm:w-[410px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden font-sans animate-fade-in text-stone-900 ${className}`}
    >
      {/* Header Dropdown phong cách Facebook */}
      <div className="p-4 pb-3 border-b border-stone-100 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-stone-900 tracking-tight">Thông báo</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 rounded-full">
              {unreadCount} mới
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs font-semibold text-[#15803d] hover:text-[#166534] hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            title="Đánh dấu tất cả là đã đọc"
          >
            <CheckCheck size={14} />
            <span>Đã đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Tabs lọc: Tất cả / Chưa đọc */}
      <div className="px-4 py-2 bg-stone-50/70 border-b border-stone-100 flex items-center gap-2 select-none">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-200/60 border border-stone-200'
          }`}
        >
          Tất cả
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UNREAD')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'UNREAD'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-200/60 border border-stone-200'
          }`}
        >
          <span>Chưa đọc</span>
          {unreadCount > 0 && (
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                activeTab === 'UNREAD' ? 'bg-white text-stone-900' : 'bg-red-500 text-white'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Danh sách thông báo */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100">
        {loading && notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
            <div className="w-5 h-5 border-2 border-[#15803d] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Đang tải thông báo...</span>
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-12 px-6 text-center text-stone-400 select-none">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-2 text-stone-400">
              <Bell size={22} />
            </div>
            <p className="text-xs font-semibold text-stone-700">
              {activeTab === 'UNREAD' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Cập nhật về đơn hàng, khuyến mãi và hoạt động mới sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          displayList.map((item) => {
            const id = item.id || item._id;
            const { icon, bg } = getNotificationIcon(item.type, item.metadata?.direction);
            const timeAgo = formatRelativeTime(item.created_at);

            return (
              <div
                key={id}
                onClick={() => handleClickItem(item)}
                className={`p-3.5 px-4 flex items-start gap-3 hover:bg-stone-50 cursor-pointer transition-colors relative group ${
                  !item.is_read ? 'bg-emerald-50/35' : 'bg-white'
                }`}
              >
                {/* Icon loại thông báo */}
                <div
                  className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border shadow-2xs ${bg}`}
                >
                  {icon}
                </div>

                {/* Nội dung thông báo */}
                <div className="flex-1 min-w-0 pr-4">
                  <h4
                    className={`text-xs leading-snug line-clamp-1 ${
                      !item.is_read ? 'font-bold text-stone-900' : 'font-semibold text-stone-800'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed mt-0.5 line-clamp-2">
                    {item.content}
                  </p>
                  <span className="text-[11px] text-stone-400 mt-1 block font-medium">
                    {timeAgo}
                  </span>
                </div>

                {/* Chấm tròn xanh chưa đọc */}
                {!item.is_read && (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 self-center absolute right-3"
                    title="Chưa đọc"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Dropdown */}
      <div className="p-2.5 bg-stone-50 border-t border-stone-100 text-center select-none">
        <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
          <Info size={12} />
          Thông báo được đồng bộ theo thời gian thực
        </p>
      </div>
    </div>
  );
}

export default HeaderNotificationDropdown;
