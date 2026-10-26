export const reasons = [
  { code: 'R01', label: 'In sai, lệch, mờ hoặc sai màu' },
  { code: 'R01A', label: 'Vấn đề chất lượng cần kiểm tra' },
  { code: 'R02', label: 'Phôi sản phẩm bị lỗi' },
  { code: 'R03', label: 'Giao sai size, màu hoặc số lượng' },
  { code: 'R04', label: 'Thiếu sản phẩm trong kiện' },
  { code: 'R05', label: 'Sản phẩm hư hỏng khi giao' },
  { code: 'R06', label: 'Không nhận được hàng' },
  { code: 'R07', label: 'Vấn đề kỹ thuật cần xem xét' },
  { code: 'R08', label: 'Sai thông tin đơn hàng' },
  { code: 'R09', label: 'Vấn đề khác cần hỗ trợ' },
  { code: 'R13', label: 'Cần đội ngũ hỗ trợ phân loại' },
];

export const labels: Record<string, string> = { SUBMITTED: 'Đã gửi', PENDING_PRINTER: 'Chờ xưởng in', PRINTER_PROPOSED_FAULT_CHANGE: 'Chờ quản trị xem đề xuất', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối', DISPUTED: 'Đang tranh chấp', AWAITING_ADMIN_REFUND: 'Chờ quản trị xác nhận hoàn tiền', ADMIN_REJECTED: 'Quản trị từ chối', CONVERTED_TO_REFUND: 'Đã duyệt hoàn tiền', WAITING_BUYER_CHOICE: 'Chờ người mua chọn', WAITING_STOCK: 'Chờ hàng', REPLACEMENT_CREATED: 'Đã tạo đơn in bù 0đ', COMPLETED: 'Hoàn tất', EXPIRED: 'Hết hạn', CANCELLED: 'Đã hủy' };

export type Tone = 'rose' | 'amber' | 'blue' | 'emerald' | 'slate';

const TONE_BY_STATUS: Record<string, Tone> = {
  REJECTED: 'rose',
  ADMIN_REJECTED: 'rose',
  DISPUTED: 'amber',
  PRINTER_PROPOSED_FAULT_CHANGE: 'amber',
  PENDING_PRINTER: 'blue',
  APPROVED: 'emerald',
  REPLACEMENT_CREATED: 'emerald',
  COMPLETED: 'emerald',
  CONVERTED_TO_REFUND: 'emerald',
};

export const statusTone = (status?: string): Tone => TONE_BY_STATUS[status || ''] || 'slate';

export const BADGE_CLASS: Record<Tone, { badge: string; dot: string }> = {
  rose: { badge: 'border-rose-200 bg-rose-50 text-rose-800', dot: 'bg-rose-600' },
  amber: { badge: 'border-amber-200 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
  blue: { badge: 'border-blue-200 bg-blue-50 text-blue-900', dot: 'bg-blue-500' },
  emerald: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-900', dot: 'bg-emerald-600' },
  slate: { badge: 'border-slate-200 bg-slate-50 text-slate-800', dot: 'bg-slate-500' },
};

const BLUE_NODE = 'border-blue-300 bg-blue-50 text-blue-700 ring-4 ring-blue-50';
export const NODE_CLASS: Record<Tone, string> = {
  rose: 'border-rose-300 bg-rose-50 text-rose-600 ring-4 ring-rose-50',
  amber: 'border-amber-300 bg-amber-50 text-amber-700 ring-4 ring-amber-50',
  blue: BLUE_NODE,
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-50',
  slate: BLUE_NODE,
};

const REASON_TEXT: Record<string, string> = {
  'Buyer submitted POD return request.': 'Bạn đã gửi yêu cầu đổi/trả sản phẩm in POD.',
  'Printer rejected return request.': 'Xưởng in đã thẩm định kỹ thuật và từ chối yêu cầu.',
  'Buyer disputed rejection.': 'Bạn đã mở khiếu nại tranh chấp gửi lên Quản trị viên sàn VietCraft.',
  'Admin approved return request.': 'Quản trị viên đã phê duyệt yêu cầu đổi hàng.',
  'Admin rejected dispute.': 'Quản trị viên đã từ chối yêu cầu khiếu nại tranh chấp.',
};

export const translateTimelineReason = (reason = '') => {
  const trimmed = reason.trim();
  if (trimmed.startsWith('Admin decided: EXCHANGE')) return 'Quản trị viên đã phân xử: Chấp thuận đổi hàng và chỉ định xưởng in ấn bù 0đ.';
  if (trimmed.startsWith('Admin decided: REFUND')) return 'Quản trị viên đã phân xử: Chấp thuận hoàn tiền cho người mua.';
  return REASON_TEXT[trimmed] || trimmed;
};
