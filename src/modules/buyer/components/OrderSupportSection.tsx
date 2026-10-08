import { RefundRequestPanel } from './RefundRequestPanel';

interface Props {
  orderId: string;
  refundOrderId: string;
  orderStatus: string;
}

export function OrderSupportSection({ orderId, refundOrderId, orderStatus }: Props) {
  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Hỗ trợ đơn hàng</h3>
        <p className="mt-1 text-xs text-slate-500">Cần hỗ trợ hoàn tiền cho toàn bộ đơn hàng?</p>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <RefundRequestPanel orderId={orderId} refundOrderId={refundOrderId} orderStatus={orderStatus} />
      </div>
    </section>
  );
}
