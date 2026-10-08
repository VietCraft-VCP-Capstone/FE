/**
 * Từ điển trạng thái yêu cầu hoàn tiền phía người bán, dùng chung cho bảng và ngăn chi tiết.
 *
 * Tách "quyết định" (status: duyệt / từ chối / tranh chấp) khỏi "tiền đã đi chưa"
 * (execution_status): một yêu cầu đã duyệt vẫn có thể chưa chuyển được tiền.
 */
import type { RefundRequest } from '../../../order/services/refundService';

export const STATUS_LABEL: Record<string, string> = {
  PENDING_SELLER: 'Chờ bạn xử lý',
  SELLER_APPROVED: 'Đã duyệt',
  SELLER_REJECTED: 'Đã từ chối',
  PENDING_PRINTER: 'Chờ xưởng in',
  PRINTER_APPROVED: 'Xưởng in chấp thuận',
  PRINTER_REJECTED: 'Xưởng in từ chối',
  DISPUTED: 'Đang tranh chấp',
  ADMIN_APPROVED: 'Admin chấp thuận',
  ADMIN_REJECTED: 'Admin từ chối',
  REFUNDED: 'Đã hoàn tiền',
  TIMEOUT_ESCALATED: 'Quá hạn',
};

/** Màu preset của antd Tag. Xanh chỉ dành cho kết quả tốt, đúng màu nhấn của khu người bán. */
export const STATUS_COLOR: Record<string, string> = {
  PENDING_SELLER: 'gold',
  PENDING_PRINTER: 'gold',
  SELLER_APPROVED: 'green',
  PRINTER_APPROVED: 'green',
  ADMIN_APPROVED: 'green',
  REFUNDED: 'green',
  SELLER_REJECTED: 'default',
  PRINTER_REJECTED: 'default',
  ADMIN_REJECTED: 'default',
  DISPUTED: 'volcano',
  TIMEOUT_ESCALATED: 'volcano',
};

export const REASON_LABEL: Record<string, string> = {
  DAMAGED: 'Hàng bị hư hỏng',
  WRONG_DESCRIPTION: 'Không đúng mô tả',
  PRINT_DEFECT: 'Lỗi in ấn',
  MISSING_ITEM: 'Thiếu sản phẩm',
  OTHER: 'Lý do khác',
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  ORDERED: 'Chờ xác nhận',
  PENDING_DESIGN: 'Chờ thiết kế',
  PROCESSING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ',
};

const APPROVED = new Set(['SELLER_APPROVED', 'PRINTER_APPROVED', 'ADMIN_APPROVED']);

export type RefundExecution = 'NOT_STARTED' | 'PROCESSING' | 'FAILED' | null;

/** Tiến trình chuyển tiền của một yêu cầu đã duyệt; null nếu chưa duyệt hoặc đã hoàn xong. */
export function executionOf(item: RefundRequest): RefundExecution {
  if (item.status === 'REFUNDED' || item.execution_status === 'SUCCEEDED') return null;
  if (!APPROVED.has(item.status)) return null;
  const s = item.execution_status || 'NOT_STARTED';
  return s === 'PROCESSING' || s === 'FAILED' ? s : 'NOT_STARTED';
}

export const EXECUTION_LABEL: Record<Exclude<RefundExecution, null>, string> = {
  NOT_STARTED: 'Chưa hoàn tiền',
  PROCESSING: 'Đang hoàn tiền',
  FAILED: 'Hoàn tiền lỗi',
};

export const orderOf = (item: RefundRequest) => (typeof item.order_id === 'object' && item.order_id ? item.order_id : null);
export const buyerOf = (item: RefundRequest) => (typeof item.buyer_id === 'object' && item.buyer_id ? item.buyer_id : null);

export const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export function refundAmountText(item: RefundRequest): string {
  return item.refund_type === 'FULL' ? 'Toàn bộ đơn' : money(Number(item.refund_amount));
}

/** Hạn phản hồi của bên đang phải xử lý (xưởng in với đơn POD, người bán với đơn thường). */
export function deadlineOf(item: RefundRequest): { date: Date | null; overdue: boolean } {
  const raw = item.product_type === 'POD' ? item.sla_deadlines?.printer_deadline : item.sla_deadlines?.seller_deadline;
  const date = raw ? new Date(raw) : null;
  const waiting = item.status === 'PENDING_SELLER' || item.status === 'PENDING_PRINTER';
  return { date, overdue: Boolean(date && waiting && date.getTime() < Date.now()) };
}

export const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(?:\?|$)/i.test(url);

export const dateTimeText = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chưa xác định';
