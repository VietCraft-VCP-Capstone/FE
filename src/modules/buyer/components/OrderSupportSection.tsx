import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RefundRequestPanel } from './RefundRequestPanel';
import { OrderStatusSimulator } from './OrderStatusSimulator';

interface Props {
  orderId: string;
  orderStatus: string;
  showLegacyRefund: boolean;
  isDevelopment: boolean;
  isSimulationOrder: boolean;
  onError: (message: string) => void;
  onSimulated: (orderCode: string) => Promise<void>;
}

export function OrderSupportSection({ orderId, orderStatus, showLegacyRefund, isDevelopment, isSimulationOrder, onError, onSimulated }: Props) {
  const [refundOpen, setRefundOpen] = useState(false);
  if (!showLegacyRefund && !isDevelopment) return null;

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Hỗ trợ đơn hàng</h3>
          {showLegacyRefund && <p className="mt-1 text-xs text-slate-500">Cần hỗ trợ hoàn tiền cho toàn bộ đơn hàng?</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showLegacyRefund && <button type="button" onClick={() => setRefundOpen(value => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50">
            {refundOpen ? 'Đóng yêu cầu hoàn tiền' : 'Hoàn tiền theo cả đơn hàng'}
            {refundOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>}
          {isDevelopment && <Link to={`/orders/${encodeURIComponent(orderId)}#dev-tools`} className="inline-flex min-h-10 items-center rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900">Công cụ dev</Link>}
        </div>
      </div>
      {showLegacyRefund && refundOpen && <div className="mt-4 border-t border-slate-100 pt-4">
        <RefundRequestPanel orderId={orderId} orderStatus={orderStatus} />
      </div>}
      {isDevelopment && <div id="dev-tools" className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-amber-200 pt-4">
        <p className="text-xs font-bold text-amber-900">Công cụ dev</p>
        <OrderStatusSimulator orderId={orderId} orderStatus={orderStatus} isSimulationOrder={isSimulationOrder} onError={onError} onSimulated={onSimulated} />
      </div>}
    </section>
  );
}
