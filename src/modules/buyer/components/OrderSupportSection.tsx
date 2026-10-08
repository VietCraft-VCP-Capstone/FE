import { Link } from 'react-router-dom';
import { RefundRequestPanel } from './RefundRequestPanel';
import { OrderStatusSimulator } from './OrderStatusSimulator';

interface Props {
  orderId: string;
  refundOrderId: string;
  orderStatus: string;
  showLegacyRefund: boolean;
  isDevelopment: boolean;
  isSimulationOrder: boolean;
  onError: (message: string) => void;
  onSimulated: (orderCode: string) => Promise<void>;
}

export function OrderSupportSection({
  orderId,
  refundOrderId,
  orderStatus,
  showLegacyRefund,
  isDevelopment,
  isSimulationOrder,
  onError,
  onSimulated,
}: Props) {
  if (!showLegacyRefund && !isDevelopment) return null;

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Hỗ trợ đơn hàng</h3>
          {showLegacyRefund && <p className="mt-1 text-xs text-slate-500">Cần hỗ trợ hoàn tiền cho toàn bộ đơn hàng?</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isDevelopment && (
            <Link
              to={`/orders/${encodeURIComponent(orderId)}#dev-tools`}
              className="inline-flex min-h-10 items-center rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
            >
              Công cụ dev
            </Link>
          )}
        </div>
      </div>

      {showLegacyRefund && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <RefundRequestPanel orderId={orderId} refundOrderId={refundOrderId} orderStatus={orderStatus} />
        </div>
      )}

      {isDevelopment && (
        <div id="dev-tools" className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-amber-200 pt-4">
          <p className="text-xs font-bold text-amber-900">Mô phỏng đơn hàng (Dev):</p>
          <OrderStatusSimulator
            orderId={orderId}
            orderStatus={orderStatus}
            isSimulationOrder={isSimulationOrder}
            onError={onError}
            onSimulated={onSimulated}
          />
        </div>
      )}
    </section>
  );
}
