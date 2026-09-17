import api from '../../../infrastructure/api/client';
import { NotificationListResponse, NotificationItem } from '../types/notificationTypes';

export interface GetNotificationParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export const notificationService = {
  /**
   * Lấy danh sách thông báo phân trang của người dùng hiện tại
   */
  async getNotifications(params?: GetNotificationParams): Promise<NotificationListResponse> {
    const res = await api.get('/notifications', { params });
    return res.data?.data || { items: [], total: 0, unreadCount: 0, page: 1, limit: 20, totalPages: 0 };
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  async getUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data?.data?.unreadCount ?? 0;
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return Boolean(res.data?.success);
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(): Promise<number> {
    const res = await api.patch('/notifications/read-all');
    return res.data?.data?.updatedCount ?? 0;
  },

  /**
   * Xoá một thông báo
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    const res = await api.delete(`/notifications/${notificationId}`);
    return Boolean(res.data?.success);
  },

  /**
   * Tạo thông báo thử nghiệm (cho test)
   */
  async createTestNotification(payload: { title?: string; content?: string; type?: string; link?: string }): Promise<NotificationItem> {
    const res = await api.post('/notifications/test', payload);
    return res.data?.data;
  }
};

export default notificationService;
