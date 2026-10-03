import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { ordersService } from '../order/services/ordersService';
import { BuyerReturnItemAction } from './BuyerReturnItemAction';

interface OrderItem { order_item_id?: string; item_snapshot?: { cohort?: string }; title?: string; quantity?: number }
interface OrderData { items?: OrderItem[]; isPod?: boolean; orderType?: string }

export function BuyerReturnItemList({ orderId, delivered }: { orderId: string; delivered: boolean }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!delivered) return;
    void ordersService.getById(orderId).then(data => setOrder(data as unknown as OrderData)).catch(e => setError(getApiErrorMessage(e)));
  }, [orderId, delivered]);
  if (!delivered) return null;
  if (error) return <p role="alert" className="text-sm text-rose-700">{error}</p>;
  if (!order) return <p className="text-sm text-gray-500">Đang kiểm tra sản phẩm có hỗ trợ Return v3…</p>;
  const podOrder = order.isPod === true || order.orderType === 'POD';
  return <div className="mt-3 space-y-2 border-t pt-3"><h4 className="text-sm font-bold">Yêu cầu đổi/trả</h4>
    {(order.items || []).map((item, index) => {
      const itemId = item.order_item_id;
      const unsupported = item.item_snapshot?.cohort === 'NORMAL' || !podOrder;
      return <div key={itemId || index} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm">
        <span>{item.title || `Sản phẩm ${index + 1}`} · SL {item.quantity || 1}</span>
        {unsupported ? <span className="text-gray-500">Chưa hỗ trợ sản phẩm NORMAL</span> : <BuyerReturnItemAction orderId={orderId} item={item} isPodOrder={podOrder} />}
      </div>;
    })}
  </div>;
}
