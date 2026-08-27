/**
 * Từ điển trạng thái đơn hàng cho khu người bán.
 *
 * Gom vào một chỗ vì cùng một trạng thái xuất hiện ở bốn nơi (tab lọc, huy hiệu trên
 * bảng, nhật ký trong ngăn chi tiết, nút hành động) — tách ra là kiểu gì cũng có chỗ
 * gọi tên khác chỗ kia.
 *
 * Bảng `NEXT_ACTIONS` phải khớp `ALLOWED_TRANSITIONS` trong seller-orders.service.ts
 * của BE. FE chỉ ẩn/hiện nút cho gọn mắt; người chốt vẫn là BE, nên lệch nhau thì
 * người bán gặp lỗi 400 chứ không phá được dữ liệu.
 */

import type { SellerOrderStatus } from '../../types/order';

export interface StatusMeta {
  label: string;
  /** Nghĩa của trạng thái, đọc dưới góc nhìn "tôi còn phải làm gì". */
  hint: string;
  /** Lớp Tailwind viết thẳng, không ghép chuỗi — JIT chỉ thấy class có mặt trong mã. */
  badge: string;
  dot: string;
}

export const STATUS_META: Record<SellerOrderStatus, StatusMeta> = {
  ORDERED: {
    label: 'Đơn mới',
    hint: 'Khách vừa đặt, chờ tiền về trước khi sản xuất.',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: '#B45309',
  },
  PENDING_DESIGN: {
    label: 'Chờ thiết kế',
    hint: 'Thiếu file in — bổ sung thiết kế rồi mới nhận sản xuất được.',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    dot: '#6D28D9',
  },
  PROCESSING: {
    label: 'Đang sản xuất',
    hint: 'Đang in / đóng gói, chờ bàn giao cho đơn vị vận chuyển.',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: '#0369A1',
  },
  SHIPPING: {
    label: 'Đang giao',
    hint: 'Đã bàn giao vận chuyển, chờ khách nhận hàng.',
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: '#4338CA',
  },
  DELIVERED: {
    label: 'Đã giao',
    hint: 'Giao thành công, tiền đã được chốt về gian hàng.',
    badge: 'bg-[#EAF0E2] text-[#005B00] border-[#c6d9bd]',
    dot: '#007700',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    hint: 'Đơn không còn hiệu lực, không phát sinh doanh thu.',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: '#BA1A1A',
  },
};

export interface StatusAction {
  to: SellerOrderStatus;
  label: string;
  /** Mô tả trong hộp thoại xác nhận, viết ở ngôi "bạn sắp làm gì". */
  description: string;
  /** Bước này bắt buộc phải có mã vận đơn. */
  requiresTracking?: boolean;
  /** Việc không đảo ngược được — vẽ nút màu cảnh báo. */
  destructive?: boolean;
}

const CANCEL: StatusAction = {
  to: 'CANCELLED',
  label: 'Huỷ đơn',
  description: 'Đơn sẽ bị huỷ vĩnh viễn và không tính vào doanh thu. Hãy ghi rõ lý do cho khách.',
  destructive: true,
};

export const NEXT_ACTIONS: Record<SellerOrderStatus, StatusAction[]> = {
  ORDERED: [
    {
      to: 'PROCESSING',
      label: 'Nhận sản xuất',
      description: 'Xác nhận bạn đã nhận đơn và bắt đầu in / đóng gói.',
    },
    CANCEL,
  ],
  PENDING_DESIGN: [
    {
      to: 'PROCESSING',
      label: 'Nhận sản xuất',
      description: 'File thiết kế đã sẵn sàng, chuyển đơn sang khâu sản xuất.',
    },
    CANCEL,
  ],
  PROCESSING: [
    {
      to: 'SHIPPING',
      label: 'Bàn giao vận chuyển',
      description: 'Nhập mã vận đơn đơn vị vận chuyển cấp để khách theo dõi được hành trình.',
      requiresTracking: true,
    },
    CANCEL,
  ],
  SHIPPING: [
    {
      to: 'DELIVERED',
      label: 'Xác nhận đã giao',
      description: 'Chỉ xác nhận khi khách đã thực sự nhận hàng. Đơn COD sẽ được ghi nhận là đã thu tiền.',
    },
  ],
  DELIVERED: [],
  CANCELLED: [],
};

export const PAYMENT_LABEL: Record<string, string> = {
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  COD: 'Thu hộ (COD)',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
};

export const CARRIER_LABEL: Record<string, string> = {
  ghn: 'Giao Hàng Nhanh',
  ghtk: 'Giao Hàng Tiết Kiệm',
};
