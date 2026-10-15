import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { refundService } from '../order/services/refundService';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';

export function LegacyRefundRedirect() {
  const { requestId } = useParams();
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setTarget(''); setError('');
    if (!requestId) return;
    void refundService.get(requestId).then(request => {
      const order = request.order_id;
      const orderId = typeof order === 'object' && order !== null ? order.order_code || order._id : order;
      if (!orderId) throw new Error('Không tìm thấy đơn hàng của yêu cầu hoàn tiền.');
      if (!cancelled) setTarget(`/orders/${encodeURIComponent(String(orderId))}?refundRequestId=${encodeURIComponent(requestId)}`);
    }).catch(e => { if (!cancelled) setError(getApiErrorMessage(e)); });
    return () => { cancelled = true; };
  }, [requestId]);

  if (target) return <Navigate to={target} replace />;
  return <main className="mx-auto max-w-5xl px-4 py-8"><p role={error ? 'alert' : 'status'}>{error || 'Đang mở yêu cầu hoàn tiền…'}</p></main>;
}
