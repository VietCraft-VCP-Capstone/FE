export type NotificationType =
  | 'ORDER_UPDATE'
  | 'LOW_STOCK'
  | 'ANALYTICS_ALERT'
  | 'PROMOTION'
  | 'NEW_MESSAGE'
  | 'PRODUCT_UNPUBLISHED'
  | 'PRODUCT_REPUBLISHED';

export interface NotificationItem {
  id: string;
  _id?: string;
  user_id: string;
  title: string;
  content: string;
  type: NotificationType;
  link?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
