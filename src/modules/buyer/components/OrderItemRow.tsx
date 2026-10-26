import type { OrderItemResponse } from '../../order/services/ordersService';
import type { ReturnEligibilityItem } from '../../returns/services/returnService';
import { OrderItemActions, OrderItemEligibilityNote, type NormalRefund } from './OrderItemActions';

interface Props {
  orderId: string;
  item: OrderItemResponse;
  completed: boolean;
  returnable: boolean;
  eligibility?: ReturnEligibilityItem;
  onReview: (productId: string) => void;
  onReorder: (item: OrderItemResponse) => void;
  refund: NormalRefund;
}

export function OrderItemRow({ orderId, item, completed, returnable, eligibility, onReview, onReorder, refund }: Props) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          <img
            src={item.image || '/image-not-found.jpg'}
            alt={item.title || 'Sản phẩm'}
            className="h-full w-full object-cover"
            onError={event => { (event.target as HTMLImageElement).src = '/image-not-found.jpg'; }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 text-sm font-extrabold leading-snug text-gray-900">{item.title}</h4>
          <p className="mt-1 text-[11px] text-gray-400">Phân loại: {item.color || 'Trắng'}{item.size ? ` · ${item.size}` : ''}</p>
          <p className="mt-0.5 text-xs font-semibold text-gray-500">x{item.quantity}</p>
          {returnable && <OrderItemEligibilityNote eligibility={eligibility} />}
        </div>
      </div>
      <div className="flex flex-col items-end gap-3 lg:max-w-[60%]">
        <span className="text-sm font-extrabold text-gray-900">{((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')}đ</span>
        {returnable && <OrderItemActions orderId={orderId} item={item} reviewable={completed} eligibility={eligibility} onReview={onReview} onReorder={onReorder} refund={refund} />}
      </div>
    </div>
  );
}
