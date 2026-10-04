import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { ordersService } from '../order/services/ordersService';
import { ArrowRight, BadgeCheck, Package, RotateCcw } from 'lucide-react';
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
  if (error) return <section role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Không tải được danh sách sản phẩm để kiểm tra hỗ trợ đổi/trả: {error}</section>;
  if (!order) return <section className="mt-5 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"><div className="h-4 w-48 rounded bg-slate-100" /><div className="mt-4 h-16 rounded-xl bg-slate-50" /></section>;
  const podOrder = order.isPod === true || order.orderType === 'POD';
  return <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><RotateCcw size={19} /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950">Đổi hoặc trả từng sản phẩm</h3><span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Return v3 · POD</span></div><p className="mt-0.5 text-xs text-slate-500">Chọn sản phẩm cần hỗ trợ đổi/trả</p></div></div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"><BadgeCheck size={14} /> Đơn đã giao</span>
    </header>
    <div className="divide-y divide-slate-100">
      {(order.items || []).map((item, index) => {
        const itemId = item.order_item_id;
        const unsupported = item.item_snapshot?.cohort === 'NORMAL' || !podOrder;
        return <div key={itemId || index} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500"><Package size={18} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.title || `Sản phẩm ${index + 1}`}</p><p className="mt-1 text-xs text-slate-500">Số lượng: {item.quantity || 1}</p></div></div>
          <div className="sm:shrink-0">{unsupported ? <span className="text-xs font-medium text-slate-500">Chưa hỗ trợ sản phẩm NORMAL</span> : <BuyerReturnItemAction orderId={orderId} item={item} isPodOrder={podOrder} />}</div>
        </div>;
      })}
      {!(order.items || []).length && <p className="px-5 py-6 text-sm text-slate-500">Không có sản phẩm trong đơn hàng này.</p>}
    </div>
    <footer className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6"><ArrowRight size={14} className="mt-0.5 shrink-0" /><p>Yêu cầu đổi/trả hiện hỗ trợ đơn POD đủ điều kiện. Mỗi sản phẩm sẽ được kiểm tra riêng.</p></footer>
  </section>;
}
