import { Link } from 'react-router-dom';

interface Props { orderId: string; item: { order_item_id?: string; quantity?: number }; isPodOrder: boolean }

export function BuyerReturnItemAction({ orderId, item, isPodOrder }: Props) {
  if (!item.order_item_id) return isPodOrder ? <span className="mt-2 block text-xs text-amber-800">Chưa thể yêu cầu: API chưa trả order_item_id</span> : null;
  if (!isPodOrder) return <span className="mt-2 block text-xs text-gray-500">Chưa hỗ trợ sản phẩm NORMAL</span>;
  const query = new URLSearchParams({ orderId, orderItemId: item.order_item_id, quantity: String(item.quantity || 1) });
  return <Link to={`/returns/new?${query}`} className="mt-2 inline-flex rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">Yêu cầu đổi/trả</Link>;
}
