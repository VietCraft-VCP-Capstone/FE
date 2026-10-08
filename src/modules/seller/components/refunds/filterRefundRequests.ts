import type { RefundRequest, RefundStatus } from '../../../order/services/refundService';

export function filterRefundRequests(items: RefundRequest[], status: 'ALL' | RefundStatus, search: string): RefundRequest[] {
  const term = search.trim().toLocaleLowerCase('vi');
  return items.filter(item => {
    if (status !== 'ALL' && item.status !== status) return false;
    if (!term) return true;
    const order = typeof item.order_id === 'object' ? item.order_id : null;
    const buyer = typeof item.buyer_id === 'object' ? item.buyer_id : null;
    return [order?.order_code, buyer?.name, buyer?.email, item.reason_category, item.description]
      .some(value => String(value || '').toLocaleLowerCase('vi').includes(term));
  });
}
