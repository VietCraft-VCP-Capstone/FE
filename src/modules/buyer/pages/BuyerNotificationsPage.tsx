import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Package, Tag, AlertTriangle,
  Info, CheckCircle2, ChevronRight
} from 'lucide-react';
import { notificationService } from '../../notification/services/notificationService';
import { NotificationItem, NotificationType } from '../../notification/types/notificationTypes';

type FilterTab = 'ALL' | 'UNREAD' | 'ORDER' | 'PROMO' | 'SYSTEM';

export function BuyerNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({
        limit: 50,
        unreadOnly: activeTab === 'UNREAD'
      });
      setNotifications(res.items || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Lỗi lấy danh sách thông báo:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications();

    const onRealtimeNotif = (e: any) => {
      const newNotif: NotificationItem = e.detail;
      setNotifications(prev => [newNotif, ...prev.filter(n => (n.id || n._id) !== (newNotif.id || newNotif._id))]);
      setUnreadCount(c => c + 1);
    };

    const onUnreadUpdate = (e: any) => {
      if (typeof e.detail?.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
      } else {
        notificationService.getUnreadCount().then(c => setUnreadCount(c)).catch(() => {});
      }
    };

    window.addEventListener('vietcraft-notification-received', onRealtimeNotif);
    window.addEventListener('vietcraft-notification-unread-updated', onUnreadUpdate);

    return () => {
      window.removeEventListener('vietcraft-notification-received', onRealtimeNotif);
      window.removeEventListener('vietcraft-notification-unread-updated', onUnreadUpdate);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => ((n.id || n._id) === id ? { ...n, is_read: true } : n)));
      setUnreadCount(c => Math.max(0, c - 1));
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi đánh dấu đọc tất cả:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => (n.id || n._id) !== id));
    } catch (err) {
      console.error('Lỗi xoá thông báo:', err);
    }
  };

  // Lọc theo tabs
  const filteredList = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.is_read;
    if (activeTab === 'ORDER') return n.type === 'ORDER_UPDATE';
    if (activeTab === 'PROMO') return n.type === 'PROMOTION';
    if (activeTab === 'SYSTEM') {
      return ['PRODUCT_UNPUBLISHED', 'PRODUCT_REPUBLISHED', 'ANALYTICS_ALERT', 'LOW_STOCK'].includes(n.type);
    }
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_UPDATE':
        return {
          icon: Package,
          bg: 'bg-emerald-50 text-[#0a5c15]',
          badge: 'Đơn hàng'
        };
      case 'PROMOTION':
        return {
          icon: Tag,
          bg: 'bg-amber-50 text-amber-600',
          badge: 'Ưu đãi'
        };
      case 'PRODUCT_UNPUBLISHED':
      case 'PRODUCT_REPUBLISHED':
      case 'LOW_STOCK':
      case 'ANALYTICS_ALERT':
        return {
          icon: AlertTriangle,
          bg: 'bg-rose-50 text-rose-600',
          badge: 'Hệ thống'
        };
      default:
        return {
          icon: Info,
          bg: 'bg-stone-100 text-stone-600',
          badge: 'Thông báo'
        };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Thông Báo */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0a5c15]/10 text-[#0a5c15] flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                  <span>Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-[#dc2626] text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  Cập nhật đơn hàng, ưu đãi và tin tức quan trọng từ VietCraft.
                </p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#0a5c15] bg-[#edf6ed] hover:bg-[#e0f0e0] rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <CheckCheck size={15} />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>

        {/* Thanh Tabs Lọc */}
        <div className="bg-white px-6 border-b border-stone-200 rounded-t-2xl flex items-center gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-stone-600">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'border-[#0a5c15] text-[#0a5c15] font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('UNREAD')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'UNREAD'
                ? 'border-[#0a5c15] text-[#0a5c15] font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ORDER')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ORDER'
                ? 'border-[#0a5c15] text-[#0a5c15] font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            Đơn hàng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PROMO')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'PROMO'
                ? 'border-[#0a5c15] text-[#0a5c15] font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            Khuyến mãi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SYSTEM')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'SYSTEM'
                ? 'border-[#0a5c15] text-[#0a5c15] font-bold'
                : 'border-transparent hover:text-stone-900'
            }`}
          >
            Hệ thống
          </button>
        </div>

        {/* Danh Sách Thông Báo */}
        <div className="bg-white rounded-b-2xl border border-t-0 border-stone-200/80 divide-y divide-stone-100 overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 text-center text-stone-400 text-xs">
              <div className="w-6 h-6 border-2 border-[#0a5c15] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Đang tải danh sách thông báo...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 px-6 text-center text-stone-400">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-300">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-sm font-bold text-stone-700">Không có thông báo nào</p>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                {activeTab === 'UNREAD'
                  ? 'Bạn đã đọc hết tất cả thông báo.'
                  : 'Các thông báo quan trọng sẽ hiển thị tại đây khi có phát sinh mới.'}
              </p>
            </div>
          ) : (
            filteredList.map(n => {
              const id = n.id || n._id || '';
              const iconInfo = getNotificationIcon(n.type);
              const IconComp = iconInfo.icon;

              return (
                <div
                  key={id}
                  onClick={() => handleMarkAsRead(id, n.link)}
                  className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer group ${
                    !n.is_read ? 'bg-[#f4f9f4]/60 hover:bg-[#edf6ed]' : 'bg-white hover:bg-stone-50'
                  }`}
                >
                  {/* Icon loại thông báo */}
                  <div className={`w-10 h-10 rounded-xl ${iconInfo.bg} flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                    <IconComp size={18} />
                  </div>

                  {/* Nội dung thông báo */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                        {iconInfo.badge}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {formatRelativeTime(n.created_at)}
                      </span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#0a5c15] shrink-0 inline-block ml-auto" />
                      )}
                    </div>

                    <h3 className={`text-sm ${!n.is_read ? 'font-extrabold text-stone-900' : 'font-semibold text-stone-800'}`}>
                      {n.title}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {n.content}
                    </p>

                    {n.link && (
                      <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-[#0a5c15] group-hover:underline">
                        <span>Xem chi tiết</span>
                        <ChevronRight size={13} />
                      </div>
                    )}
                  </div>

                  {/* Nút xoá */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, id)}
                    className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                    title="Xoá thông báo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default BuyerNotificationsPage;
