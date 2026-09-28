import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { refundService, type RefundRequest } from '../../order/services/refundService';
import { DisputeReasonModal } from './refund/DisputeReasonModal';

const reasons = [
  ['DAMAGED', 'Sản phẩm bị hư hỏng'], ['WRONG_DESCRIPTION', 'Không đúng mô tả'],
  ['PRINT_DEFECT', 'Lỗi in ấn'], ['MISSING_ITEM', 'Thiếu sản phẩm'], ['OTHER', 'Lý do khác'],
] as const;
const labels: Record<string, string> = {
  PENDING_SELLER: 'Chờ người bán phản hồi', SELLER_APPROVED: 'Đã duyệt — chờ xử lý hoàn tiền', SELLER_REJECTED: 'Người bán từ chối',
  PENDING_PRINTER: 'Đang chờ xưởng in (mock)', PRINTER_APPROVED: 'Xưởng in chấp thuận — bạn có thể mở tranh chấp nếu không đồng ý', PRINTER_REJECTED: 'Xưởng in từ chối — bạn có thể mở tranh chấp',
  DISPUTED: 'Đang tranh chấp', ADMIN_APPROVED: 'Quản trị viên chấp thuận — chờ xử lý hoàn tiền', ADMIN_REJECTED: 'Quản trị viên từ chối', REFUNDED: 'Đã hoàn tiền', TIMEOUT_ESCALATED: 'Quá hạn — có thể mở tranh chấp',
};

export function RefundRequestPanel({ orderId, orderStatus }: { orderId: string; orderStatus: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [testBusy, setTestBusy] = useState(false);
  const [testConfirmOpen, setTestConfirmOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('DAMAGED');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<RefundRequest | null>(null);
  const canRequest = orderStatus === 'completed' && !request;
  const canDispute = !!request && ['SELLER_REJECTED', 'PRINTER_APPROVED', 'PRINTER_REJECTED', 'TIMEOUT_ESCALATED'].includes(request.status);

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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await refundService.create(orderId, {
        reason_category: reason, description,
        evidence: evidence.split(/\s*,\s*|\n/).map(x => x.trim()).filter(Boolean),
        refund_type: partial ? 'PARTIAL' : 'FULL', refund_amount: partial ? Number(amount) : undefined,
      });
      setRequest(result); setOpen(false);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  };
  const createTestFlow = async () => {
    setTestBusy(true); setError(''); setTestConfirmOpen(false);
    try {
      const result = await refundService.createTestFlow(orderId);
      navigate(`/orders/${encodeURIComponent(result.order_id)}?refundRequestId=${encodeURIComponent(result.refund_request_id)}`);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setTestBusy(false); }
  };
  const submitDispute = async (reasonText: string) => {
    if (!request) return;
    setBusy(true); setError('');
    try {
      setRequest(await refundService.dispute(request._id, reasonText));
      setDisputeOpen(false);
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  };
  const sellerOutcome = request?.seller_response ? `Seller ${request.seller_response.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}${request.seller_response.note ? `: ${request.seller_response.note}` : ''}` : request?.printer_response ? `Printer ${request.printer_response.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}${request.printer_response.note ? `: ${request.printer_response.note}` : ''}` : request?.status === 'TIMEOUT_ESCALATED' ? 'Seller quá thời hạn phản hồi' : 'Chưa có phản hồi';
  const requestOrderCode = typeof request?.order_id === 'object' ? request.order_id.order_code : undefined;

  return <>
  <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-bold text-gray-900">Trả hàng / Hoàn tiền</h3>
        {request ? <p className="mt-1 text-sm text-gray-700">{labels[request.status] || request.status} · mã {request._id.slice(-8)}</p> : <p className="mt-1 text-sm text-gray-600">Yêu cầu trong vòng 7 ngày sau khi đơn được giao.</p>}
      </div>
      {orderStatus === 'pending' && <button disabled={testBusy} onClick={() => setTestConfirmOpen(true)} className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50">{testBusy ? 'Đang tạo đơn test...' : 'Tạo flow Refund test'}</button>}
      {canRequest && <button onClick={() => setOpen(v => !v)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">{open ? 'Đóng' : 'Tạo yêu cầu'}</button>}
      {canDispute && <button disabled={busy} onClick={() => setDisputeOpen(true)} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Mở tranh chấp</button>}
    </div>
    {request?.admin_decision && <p className="mt-2 rounded-lg bg-white/80 p-3 text-sm text-gray-800">Admin quyết định: <strong>{request.admin_decision.decision === 'APPROVE' ? `${request.admin_decision.refund_type === 'FULL' ? 'hoàn toàn bộ' : `hoàn ${Number(request.refund_amount || 0).toLocaleString('vi-VN')} ₫`} · bên chịu phí: ${request.admin_decision.cost_bearer}` : 'không chấp thuận'}</strong><br />{request.admin_decision.note}</p>}
    {request && ['SELLER_APPROVED', 'PRINTER_APPROVED', 'ADMIN_APPROVED'].includes(request.status) && <p className="mt-2 text-sm text-amber-800">Quyết định đã ghi nhận; hoàn tiền chưa được thực hiện vì gateway đang để sau.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {open && <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">Lý do<select value={reason} onChange={e => setReason(e.target.value)} className="rounded-lg border border-gray-300 bg-white p-2">{reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Loại hoàn<select value={partial ? 'PARTIAL' : 'FULL'} onChange={e => setPartial(e.target.value === 'PARTIAL')} className="rounded-lg border border-gray-300 bg-white p-2"><option value="FULL">Toàn bộ</option><option value="PARTIAL">Một phần</option></select></label>
      {partial && <label className="grid gap-1 text-sm font-medium">Số tiền đề nghị (VND)<input required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-lg border border-gray-300 p-2" /></label>}
      <label className="grid gap-1 text-sm font-medium md:col-span-2">Mô tả<textarea required minLength={5} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} className="rounded-lg border border-gray-300 p-2" rows={3} /></label>
      <label className="grid gap-1 text-sm font-medium md:col-span-2">URL ảnh/video bằng chứng (phân cách bằng dấu phẩy){['DAMAGED','PRINT_DEFECT','MISSING_ITEM'].includes(reason) && <span className="text-xs text-red-600">Bắt buộc cho lý do này</span>}<input value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="https://..." className="rounded-lg border border-gray-300 p-2" /></label>
      <div className="md:col-span-2"><button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang gửi...' : 'Gửi yêu cầu'}</button></div>
    </form>}
  </section>
  {testConfirmOpen && <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setTestConfirmOpen(false); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="refund-test-title" aria-describedby="refund-test-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700"><span aria-hidden="true" className="text-xl font-bold">!</span></div>
      <h2 id="refund-test-title" className="m-0 text-lg font-bold text-slate-900">Tạo đơn Refund test?</h2>
      <p id="refund-test-description" className="mb-0 mt-2 text-sm leading-6 text-slate-600">Hệ thống sẽ tạo một bản sao của đơn hàng để thử luồng Refund. Đơn test giữ trạng thái thanh toán <strong>PENDING</strong>; không thu hoặc hoàn tiền thật.</p>
      <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row"><button type="button" onClick={() => setTestConfirmOpen(false)} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Huỷ</button><button type="button" onClick={() => void createTestFlow()} disabled={testBusy} className="min-h-11 rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-50">{testBusy ? 'Đang tạo...' : 'Tạo đơn test'}</button></div>
    </section>
  </div>}
  {disputeOpen && request && <DisputeReasonModal orderCode={requestOrderCode || orderId} requestReason={request.description} sellerOutcome={sellerOutcome} loading={busy} error={error} onClose={() => setDisputeOpen(false)} onSubmit={submitDispute} />}
  </>;
}
