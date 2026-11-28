import type { PlaybookStep, PlaybookStepKey } from '../../types';

/** Vị trí lưu tick cố định của từng bước (khớp BE `PLAYBOOK_SLOTS`) */
export const PLAYBOOK_SLOTS: Record<PlaybookStepKey, number> = { listing: 0, test: 1, decide: 2, produce: 3, cutoff: 4 };
export const DEFAULT_TEST_ORDERS = 20;

/** Mã bước: lấy từ BE, nếu phản hồi cũ chưa có thì suy từ tên bước */
export function playbookStepKey(step: Pick<PlaybookStep, 'key' | 'task'>): PlaybookStepKey | null {
  if (step.key) return step.key;
  const t = step.task.toLowerCase();
  if (t.includes('listing') || t.includes('gắn tag')) return 'listing';
  if (t.includes('thử nhỏ')) return 'test';
  if (t.includes('nhân rộng')) return 'decide';
  if (t.includes('sản xuất') || t.includes('nhập hàng')) return 'produce';
  if (t.includes('chốt nhận đơn')) return 'cutoff';
  return null;
}

export function playbookStepSlot(step: PlaybookStep, fallbackIdx: number): number {
  if (typeof step.slot === 'number') return step.slot;
  const key = playbookStepKey(step);
  return key ? PLAYBOOK_SLOTS[key] : fallbackIdx;
}

export interface AutoStepStatus {
  /** Dữ liệu thật đã xác nhận bước này xong (khóa ô tick) */
  autoDone: boolean;
  /** Ghi chú hiển thị cạnh bước (kể cả khi mới đạt một phần) */
  note?: string;
}

/**
 * Bước nào tự ghi nhận từ dữ liệu thật:
 * - listing: ý tưởng đã có ≥ 1 sản phẩm gắn vào
 * - test: đơn hợp lệ trong kỳ dịp của ý tưởng ≥ số đơn mục tiêu (mặc định 20)
 * - produce: đã có sản phẩm đăng bán và ≥ 1 đơn hợp lệ (đã bán được nghĩa là đã có hàng)
 * Còn lại (quyết định, hạn chốt) không có tín hiệu dữ liệu → seller tự tick.
 */
export function autoStepStatus(
  step: PlaybookStep,
  ideaProducts: number,
  ideaOrders: number,
): AutoStepStatus {
  const key = playbookStepKey(step);
  if (key === 'listing' && ideaProducts > 0) {
    return { autoDone: true, note: `Đã có ${ideaProducts} sản phẩm của ý tưởng` };
  }
  if (key === 'produce' && ideaProducts > 0 && ideaOrders > 0) {
    return { autoDone: true, note: `Đang bán, đã có ${ideaOrders} đơn` };
  }
  if (key === 'test') {
    const target = step.target_orders ?? DEFAULT_TEST_ORDERS;
    if (ideaOrders >= target) return { autoDone: true, note: `Đã có ${ideaOrders}/${target} đơn trong kỳ dịp` };
    if (ideaOrders > 0) return { autoDone: false, note: `Mới có ${ideaOrders}/${target} đơn trong kỳ dịp` };
  }
  return { autoDone: false };
}
