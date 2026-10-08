export const allowedReturnResolutions: Record<string, readonly ('REFUND' | 'EXCHANGE')[]> = {
  R01: ['REFUND', 'EXCHANGE'], R01A: ['REFUND'], R02: ['REFUND', 'EXCHANGE'],
  R03: ['REFUND', 'EXCHANGE'], R04: ['REFUND', 'EXCHANGE'], R05: ['REFUND', 'EXCHANGE'],
  R06: ['REFUND'], R07: ['REFUND'], R08: ['REFUND'], R09: ['REFUND'],
};

export function canConfirmReturnRefund(status: string, executionStatus?: string | null): boolean {
  return ['AWAITING_ADMIN_REFUND', 'CONVERTED_TO_REFUND'].includes(status)
    && !['PROCESSING', 'REFUNDED'].includes(executionStatus || '');
}

export function canDecideReturn(status: string): boolean {
  return ['DISPUTED', 'PRINTER_PROPOSED_FAULT_CHANGE', 'APPROVED'].includes(status);
}

export function canRejectReturn(status: string): boolean {
  return ['DISPUTED', 'PRINTER_PROPOSED_FAULT_CHANGE'].includes(status);
}

export function returnRefundMessage(status?: string | null): string {
  if (status === 'REFUNDED') return 'Khoản hoàn tiền đã được cổng thanh toán xác nhận thành công.';
  if (status === 'FAILED') return 'Hoàn tiền chưa thành công. Quản trị viên cần kiểm tra và thử lại.';
  if (status === 'PROCESSING' || status === 'PENDING') return 'Cổng thanh toán đang xử lý khoản hoàn tiền. Chưa có xác nhận tiền đã được chuyển.';
  return 'Yêu cầu đã được duyệt. Khoản tiền chưa được cổng thanh toán xác nhận hoàn thành.';
}
