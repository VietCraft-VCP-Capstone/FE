import { Link } from 'react-router-dom';

interface Props { orderId: string; item: { order_item_id?: string; quantity?: number }; isPodOrder: boolean }

export function BuyerReturnItemAction({ orderId, item, isPodOrder }: Props) {
  if (!item.order_item_id) return isPodOrder ? <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Đơn này tạo trước khi hỗ trợ đổi/trả</span> : null;
  if (!isPodOrder) return <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">Chưa hỗ trợ sản phẩm NORMAL</span>;
  const query = new URLSearchParams({ orderId, orderItemId: item.order_item_id, quantity: String(item.quantity || 1) });
  return <Link to={`/returns/new?${query}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Yêu cầu đổi/trả <span aria-hidden="true">→</span></Link>;
}
