import type { OrderItemResponse } from '../../order/services/ordersService';
import type { ReturnEligibilityItem } from '../../returns/services/returnService';
import { OrderItemRow } from './OrderItemRow';
import type { NormalRefund } from './OrderItemActions';

interface Props {
  orderId: string;
  items: OrderItemResponse[];
  eligibilityItems: ReturnEligibilityItem[];
  completed: boolean;
  returnable: boolean;
  onReview: (productId: string) => void;
  onReorder: (item: OrderItemResponse) => void;
  refund: NormalRefund;
}

export function OrderItemsList({ orderId, items, eligibilityItems, completed, returnable, onReview, onReorder, refund }: Props) {
  return (
    <div className="divide-y divide-gray-50 p-4">
      {items.map((item, index) => {
        const eligibility = eligibilityItems.find(entry => item.order_item_id
          ? entry.orderItemId === item.order_item_id
          : entry.orderItemId === null);
        return <OrderItemRow
          key={item.order_item_id || `${item.productId}-${index}`}
          orderId={orderId}
          item={item}
          completed={completed}
          returnable={returnable}
          eligibility={eligibility}
          onReview={onReview}
          onReorder={onReorder}
          refund={refund}
        />;
      })}
    </div>
  );
}
