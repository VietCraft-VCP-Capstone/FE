import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { refundService, type RefundRequest } from '../../order/services/refundService';
import { DisputeReasonModal } from './refund/DisputeReasonModal';
import { RefundFormModal } from './refund/RefundFormModal';

const labels: Record<string, string> = {
  PENDING_SELLER: 'Chờ người bán phản hồi',
  SELLER_APPROVED: 'Đã duyệt, đang hoàn tiền',
  SELLER_REJECTED: 'Người bán từ chối',
  PENDING_PRINTER: 'Đang chờ xưởng in phản hồi',
  PRINTER_APPROVED: 'Xưởng in chấp thuận, đang hoàn tiền',
  PRINTER_REJECTED: 'Xưởng in từ chối, xem lý do và mở dispute',
  DISPUTED: 'Đang tranh chấp',
  ADMIN_APPROVED: 'Quản trị viên chấp thuận, đang hoàn tiền',
  ADMIN_REJECTED: 'Quản trị viên từ chối',
  REFUNDED: 'Đã hoàn tiền',
  TIMEOUT_ESCALATED: 'Quá hạn, có thể mở tranh chấp',
};

interface RefundRequestPanelProps {
  orderId: string;
  refundOrderId: string;
  orderStatus: string;
}

export function RefundRequestPanel({ orderId, refundOrderId, orderStatus }: RefundRequestPanelProps) {
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<RefundRequest | null>(null);

  const canRequest = orderStatus === 'completed' && !request;
  const canDispute = !!request && (
    (request.product_type === 'POD' && request.status === 'PRINTER_REJECTED') ||
    (request.product_type === 'NORMAL' && ['SELLER_REJECTED', 'PRINTER_APPROVED', 'PRINTER_REJECTED'].includes(request.status)) ||
    request.status === 'TIMEOUT_ESCALATED'
  );

  useEffect(() => {
    const load = () => {
      const requestId = searchParams.get('refundRequestId');
      const result = requestId ? refundService.get(requestId) : refundService.getForOrder(orderId);
      result.then(setRequest).catch(e => setError(getApiErrorMessage(e)));
    };
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [orderId, searchParams]);

  const submitDispute = async (reasonText: string) => {
    if (!request) return;
    setBusy(true);
    setError('');
    try {
      setRequest(await refundService.dispute(request._id, reasonText));
      setDisputeOpen(false);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const sellerOutcome = request?.printer_response
    ? `Xưởng in ${request.printer_response.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}${request.printer_response.note ? `: ${request.printer_response.note}` : ''}`
    : request?.seller_response
    ? `Seller ${request.seller_response.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}${request.seller_response.note ? `: ${request.seller_response.note}` : ''}`
    : request?.status === 'TIMEOUT_ESCALATED'
    ? 'Bên xử lý quá thời hạn phản hồi'
    : 'Chưa có phản hồi';

  // Sau khi được duyệt, tiến trình chuyển tiền thật nằm ở execution_status.
  const approvedMessage = request?.status === 'REFUNDED' || request?.execution_status === 'SUCCEEDED'
    ? 'Tiền đã được hoàn về tài khoản bạn dùng để thanh toán.'
    : request?.execution_status === 'FAILED' || request?.execution_status === 'NOT_STARTED'
    ? 'Yêu cầu được chấp thuận nhưng chưa chuyển được tiền hoàn. Người bán hoặc quản trị viên đang xử lý lại.'
    : 'Yêu cầu được chấp thuận. Hệ thống đang chuyển tiền hoàn về tài khoản bạn dùng để thanh toán.';

  const requestOrderCode = typeof request?.order_id === 'object' ? request.order_id.order_code : undefined;

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${request ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
              <span aria-hidden="true" className="text-lg font-bold">↺</span>
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900">Hoàn tiền theo đơn hàng</h3>
              {request ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Mã yêu cầu <span className="font-mono font-semibold text-slate-700">{request._id.slice(-8)}</span>
                  {requestOrderCode ? ` · Đơn ${requestOrderCode}` : ''}
                </p>
              ) : (
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  Biểu mẫu này tạo yêu cầu hoàn tiền theo đơn hàng.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {request && (
              <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold ${
                request.status.includes('REJECTED') || request.status === 'ADMIN_REJECTED'
                  ? 'bg-rose-50 text-rose-800'
                  : ['PENDING_PRINTER', 'PENDING_SELLER', 'DISPUTED', 'TIMEOUT_ESCALATED'].includes(request.status)
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-emerald-50 text-emerald-800'
              }`}>
                {request.status.endsWith('APPROVED') && (request.execution_status === 'FAILED' || request.execution_status === 'NOT_STARTED')
                  ? 'Đã duyệt, chưa hoàn được tiền'
                  : request.execution_status === 'SUCCEEDED' ? 'Đã hoàn tiền' : labels[request.status] || request.status}
              </span>
            )}

            {canRequest && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="min-h-10 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Tạo yêu cầu hoàn tiền
              </button>
            )}

            {canDispute && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setDisputeOpen(true)}
                className="min-h-10 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-rose-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
              >
                Mở tranh chấp
              </button>
            )}
          </div>
        </div>

        {request && (
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            {request.product_type === 'POD'
              ? request.status === 'PENDING_PRINTER'
                ? 'Yêu cầu đã được gửi trực tiếp đến xưởng in. Người bán chỉ theo dõi tiến trình.'
                : request.status === 'PRINTER_REJECTED'
                ? 'Xưởng in đã từ chối. Xem lý do bên dưới; bạn có thể mở tranh chấp nếu cần.'
                : request.status === 'PRINTER_APPROVED' || request.status === 'ADMIN_APPROVED'
                ? approvedMessage
                : request.status === 'DISPUTED'
                ? 'Tranh chấp đã được chuyển đến quản trị viên để xem xét.'
                : 'Yêu cầu đang được xử lý theo quy trình POD.'
              : request.status === 'PENDING_SELLER'
              ? 'Người bán đang xem xét yêu cầu. Bạn sẽ thấy cập nhật tại đây.'
              : request.status === 'DISPUTED'
              ? 'Tranh chấp đã được chuyển đến quản trị viên để xem xét.'
              : request.status.includes('APPROVED')
              ? approvedMessage
              : 'Yêu cầu đang được xử lý.'}
          </div>
        )}

        {request && request.evidence?.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">Minh chứng đã gửi</p>
            <div className="flex flex-wrap gap-3">
              {request.evidence.map((url, index) => {
                const isVideo = /\.(mp4|webm|mov)(?:\?|$)/i.test(url);
                return isVideo ? (
                  <video key={url} src={url} controls preload="metadata" className="h-28 max-w-[220px] rounded-lg bg-black" aria-label={`Video minh chứng ${index + 1}`} />
                ) : (
                  <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh minh chứng ${index + 1}`}>
                    <img src={url} alt={`Ảnh minh chứng ${index + 1}`} className="h-24 w-24 rounded-lg border border-slate-200 object-cover transition hover:opacity-80" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {request?.product_type === 'POD' && request.status === 'PRINTER_REJECTED' && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900">
            <strong className="block text-xs uppercase tracking-wide">Lý do từ xưởng in</strong>
            <span className="mt-1 block">{request.printer_response?.note || 'Xưởng in chưa cung cấp ghi chú.'}</span>
          </div>
        )}

        {request?.admin_decision && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            Quyết định quản trị viên:{' '}
            <strong>
              {request.admin_decision.decision === 'APPROVE'
                ? `${request.admin_decision.refund_type === 'FULL' ? 'chấp thuận hoàn toàn bộ' : `chấp thuận hoàn ${Number(request.refund_amount || 0).toLocaleString('vi-VN')} ₫`} · bên chịu phí: ${request.admin_decision.cost_bearer}`
                : 'không chấp thuận'}
            </strong>
            <br />
            {request.admin_decision.note}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}
      </section>

      {/* Modal Dialog for Refund Form */}
      {open && (
        <RefundFormModal
          isOpen={open}
          orderId={refundOrderId}
          orderCode={requestOrderCode}
          onClose={() => setOpen(false)}
          onSuccess={newRequest => {
            setRequest(newRequest);
            setOpen(false);
          }}
        />
      )}

      {/* Dispute Modal */}
      {disputeOpen && request && (
        <DisputeReasonModal
          orderCode={requestOrderCode || orderId}
          requestReason={request.description}
          sellerOutcome={sellerOutcome}
          loading={busy}
          error={error}
          onClose={() => setDisputeOpen(false)}
          onSubmit={submitDispute}
        />
      )}
    </>
  );
}
