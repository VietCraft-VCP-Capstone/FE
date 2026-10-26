import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { OrderItemResponse } from '../../order/services/ordersService';
import type { ReturnEligibilityItem } from '../../returns/services/returnService';

interface Props {
  orderId: string;
  item: OrderItemResponse;
  eligibility?: ReturnEligibilityItem;
  reviewable: boolean;
  onReview: (productId: string) => void;
  onReorder: (item: OrderItemResponse) => void;
  refund: NormalRefund;
}

export interface NormalRefund { blocked: string | null; open: () => void }

const isNormal = (eligibility?: ReturnEligibilityItem) =>
  eligibility?.reasonIfNot?.code === 'NORMAL_UNSUPPORTED' || eligibility?.reasonIfNot?.code === 'MISSING_ORDER_ITEM_ID';

const buttonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2';

export function OrderItemEligibilityNote({ eligibility }: { eligibility?: ReturnEligibilityItem }) {
  if (!eligibility) return <p className="mt-1 text-xs text-slate-500">Đang kiểm tra điều kiện hỗ trợ</p>;
  if (isNormal(eligibility)) return <p className="mt-1 text-xs leading-5 text-slate-500">Hoàn tiền áp dụng cho cả đơn hàng</p>;
  return <div className="mt-1 space-y-0.5 text-xs leading-5">
    {eligibility.deadline && <p className="text-slate-500">Gửi yêu cầu trước {new Date(eligibility.deadline).toLocaleString('vi-VN')}</p>}
    {eligibility.activeRequestId && <p className="font-medium text-indigo-700">Đang xử lý yêu cầu đổi/trả</p>}
    {eligibility.reasonIfNot && <p className="text-amber-800">{eligibility.reasonIfNot.label}</p>}
    {eligibility.eligible && !eligibility.deadline && <p className="text-emerald-700">Đủ điều kiện gửi yêu cầu</p>}
  </div>;
}

export function OrderItemActions({ orderId, item, eligibility, reviewable, onReview, onReorder, refund }: Props) {
  const query = new URLSearchParams({ orderId, quantity: String(eligibility?.remainingQuantity ?? item.quantity ?? 1) });
  if (item.order_item_id) query.set('orderItemId', item.order_item_id);
  if (item.title) query.set('title', item.title);
  if (item.image) query.set('image', item.image);
  if (item.color) query.set('color', item.color);
  if (item.size) query.set('size', item.size);
  if (eligibility?.deadline) query.set('deadline', eligibility.deadline);

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      {reviewable && <>
      <button
        type="button"
        onClick={() => onReview(item.productId)}
        className={`${buttonClass} border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100`}
        title={item.is_reviewed ? 'Xem hoặc chỉnh sửa đánh giá' : 'Đánh giá sản phẩm'}
      >
        <Star size={13} className={item.is_reviewed ? 'fill-amber-500 text-amber-500' : ''} />
        <span>{item.is_reviewed ? 'Chỉnh sửa đánh giá' : 'Đánh giá'}</span>
      </button>
      <button
        type="button"
        onClick={() => onReorder(item)}
        className={`${buttonClass} border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50`}
      >
        Mua lại
      </button>
      </>}
      {isNormal(eligibility) ? (
        <button type="button" disabled={!!refund.blocked} title={refund.blocked || 'Gửi yêu cầu hoàn tiền'} onClick={refund.open}
          className={`${buttonClass} border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500`}>
          Đổi/trả hàng
        </button>
      ) : eligibility?.activeRequestId ? (
        <Link to={`/returns/${encodeURIComponent(eligibility.activeRequestId)}`} className={`${buttonClass} border-indigo-700 bg-indigo-700 text-white hover:bg-indigo-800`}>
          Theo dõi yêu cầu
        </Link>
      ) : !eligibility || !eligibility.eligible ? (
        <button type="button" disabled title={eligibility ? eligibility.reasonIfNot?.label || 'Chưa đủ điều kiện' : 'Đang kiểm tra điều kiện'} className={`${buttonClass} cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500`}>
          Đổi/trả hàng
        </button>
      ) : (
        <Link to={`/returns/new?${query.toString()}`} className={`${buttonClass} border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900`}>
          Đổi/trả hàng
        </Link>
      )}
    </div>
  );
}
