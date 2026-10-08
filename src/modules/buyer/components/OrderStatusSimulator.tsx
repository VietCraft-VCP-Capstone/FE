import { useState } from 'react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { ordersService } from '../../order/services/ordersService';
import { getSimulationTarget, type SimulatableOrderStatus } from './order-status-simulation-policy';

type Props = {
  orderId: string;
  orderStatus: string;
  isSimulationOrder: boolean;
  onSimulated: (orderCode: string) => Promise<void>;
  onError: (message: string) => void;
};

const targetLabel: Partial<Record<SimulatableOrderStatus, string>> = {
  SHIPPING: 'Mô phỏng: Đang giao',
  DELIVERED: 'Mô phỏng: Đã giao (Kích hoạt Đổi/Trả & Hoàn tiền)',
};

export function OrderStatusSimulator({ orderId, orderStatus, isSimulationOrder, onSimulated, onError }: Props) {
  const [busy, setBusy] = useState(false);
  const target = getSimulationTarget(orderStatus, isSimulationOrder);

  if (!import.meta.env.DEV) return null;
  if (!target) {
    return (
      <span className="text-[11px] text-amber-800 bg-amber-100/70 border border-amber-200/80 px-2.5 py-1 rounded-md font-medium">
        ✓ Đơn đã ở trạng thái "Đã giao" (Đã đủ điều kiện tạo đổi trả/hoàn tiền)
      </span>
    );
  }

  const simulate = async () => {
    setBusy(true);
    try {
      const response = await ordersService.simulateStatus(orderId, target);
      await onSimulated(response.data.order_code);
    } catch (error) {
      onError(getApiErrorMessage(error, 'Không thể mô phỏng trạng thái đơn hàng.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={() => void simulate()}
        disabled={busy}
        aria-label={isSimulationOrder ? targetLabel[target] : 'Tạo đơn test và giữ trạng thái chưa xác nhận'}
        className="border border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:cursor-wait disabled:opacity-60 shadow-sm"
      >
        {busy ? 'Đang mô phỏng…' : isSimulationOrder ? targetLabel[target] : 'Tạo đơn test & mô phỏng'}
      </button>
      {isSimulationOrder && target === 'DELIVERED' && (
        <span className="text-[11px] text-amber-800 font-medium">
          ← Bấm nút này (hoặc nút <strong className="text-emerald-700">"Đã nhận được hàng"</strong> ở trên) để chuyển sang "Đã giao" và hiển thị nút Đổi/trả hàng.
        </span>
      )}
    </div>
  );
}
