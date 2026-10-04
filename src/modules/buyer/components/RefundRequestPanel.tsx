import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { refundService, type RefundRequest } from '../../order/services/refundService';
import { DisputeReasonModal } from './refund/DisputeReasonModal';
import { BuyerReturnItemList } from '../../returns/BuyerReturnItemList';
import { OrderStatusSimulator } from './OrderStatusSimulator';
import { ImagePlus, Video, X } from 'lucide-react';

const reasons = [
  ['DAMAGED', 'Sản phẩm bị hư hỏng'], ['WRONG_DESCRIPTION', 'Không đúng mô tả'],
  ['PRINT_DEFECT', 'Lỗi in ấn'], ['MISSING_ITEM', 'Thiếu sản phẩm'], ['OTHER', 'Lý do khác'],
] as const;
const labels: Record<string, string> = {
  PENDING_SELLER: 'Chờ người bán phản hồi', SELLER_APPROVED: 'Đã duyệt — chờ xử lý hoàn tiền', SELLER_REJECTED: 'Người bán từ chối',
  PENDING_PRINTER: 'Đang chờ xưởng in phản hồi', PRINTER_APPROVED: 'Xưởng in chấp thuận — gateway hoàn tiền chưa tích hợp', PRINTER_REJECTED: 'Xưởng in từ chối — xem lý do và mở dispute',
  DISPUTED: 'Đang tranh chấp', ADMIN_APPROVED: 'Quản trị viên chấp thuận — chờ xử lý hoàn tiền', ADMIN_REJECTED: 'Quản trị viên từ chối', REFUNDED: 'Đã hoàn tiền', TIMEOUT_ESCALATED: 'Quá hạn — có thể mở tranh chấp',
};

export function RefundRequestPanel({ orderId, orderStatus }: { orderId: string; orderStatus: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [testBusy, setTestBusy] = useState(false);
  const [testConfirmOpen, setTestConfirmOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<Array<{ url: string; kind: 'image' | 'video'; name: string }>>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [partial, setPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<RefundRequest | null>(null);
  const canRequest = orderStatus === 'completed' && !request;
  const canDispute = !!request && ((request.product_type === 'POD' && request.status === 'PRINTER_REJECTED') || (request.product_type === 'NORMAL' && ['SELLER_REJECTED', 'PRINTER_APPROVED', 'PRINTER_REJECTED'].includes(request.status)) || request.status === 'TIMEOUT_ESCALATED');

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

  const uploadEvidenceFiles = async (files: FileList | null, kind: 'image' | 'video') => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    const currentCount = evidence.filter(item => item.kind === kind).length;
    const limit = kind === 'image' ? 3 : 1;
    if (currentCount + selected.length > limit) {
      setError(kind === 'image' ? 'Bạn chỉ có thể đính kèm tối đa 3 ảnh.' : 'Bạn chỉ có thể đính kèm tối đa 1 video.');
      return;
    }
    setError(''); setUploadingEvidence(true);
    try {
      const uploaded: Array<{ url: string; kind: 'image' | 'video'; name: string }> = [];
      for (const file of selected) {
        const validType = kind === 'image'
          ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
          : ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type);
        const maxBytes = kind === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (!validType) throw new Error(kind === 'image' ? 'Ảnh chỉ nhận JPG, PNG hoặc WebP.' : 'Video chỉ nhận MP4, WebM hoặc MOV.');
        if (file.size > maxBytes) throw new Error(kind === 'image' ? 'Ảnh tối đa 10MB mỗi tệp.' : 'Video tối đa 50MB.');
        const url = await refundService.uploadEvidence(file);
        uploaded.push({ url, kind, name: file.name });
      }
      setEvidence(prev => [...prev, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : getApiErrorMessage(uploadError, 'Tải minh chứng thất bại.'));
    } finally { setUploadingEvidence(false); }
  };
  const removeEvidence = (url: string) => setEvidence(prev => prev.filter(item => item.url !== url));
  const countImages = evidence.filter(item => item.kind === 'image').length;
  const hasVideo = evidence.some(item => item.kind === 'video');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!reason) { setError('Vui lòng chọn lý do yêu cầu hoàn tiền.'); return; }
    if (!description.trim()) { setError('Vui lòng mô tả lý do hoàn tiền.'); return; }
    if (evidence.length === 0) { setError('Vui lòng đính kèm ít nhất 1 ảnh hoặc video minh chứng.'); return; }
    if (uploadingEvidence) { setError('Chờ tải minh chứng lên xong rồi hãy gửi yêu cầu.'); return; }
    setBusy(true);
    try {
      const result = await refundService.create(orderId, {
        reason_category: reason, description: description.trim(),
        evidence: evidence.map(item => item.url),
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
  const sellerOutcome = request?.printer_response ? `Xưởng in ${request.printer_response.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}${request.printer_response.note ? `: ${request.printer_response.note}` : ''}` : request?.seller_response ? `Seller ${request.seller_response.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}${request.seller_response.note ? `: ${request.seller_response.note}` : ''}` : request?.status === 'TIMEOUT_ESCALATED' ? 'Bên xử lý quá thời hạn phản hồi' : 'Chưa có phản hồi';
  const requestOrderCode = typeof request?.order_id === 'object' ? request.order_id.order_code : undefined;

  return <>
  <section className={`rounded-2xl border p-4 sm:p-5 ${request ? 'border-slate-200 bg-white' : 'border-slate-200 bg-white'}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${request ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
          <span aria-hidden="true" className="text-lg font-bold">↺</span>
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-900">Hoàn tiền theo đơn hàng <span className="ml-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Refund hiện có</span></h3>
          {request ? <p className="mt-1 text-xs leading-5 text-slate-500">Mã yêu cầu <span className="font-mono font-semibold text-slate-700">{request._id.slice(-8)}</span>{requestOrderCode ? ` · Đơn ${requestOrderCode}` : ''}</p> : <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">Biểu mẫu này tạo yêu cầu hoàn tiền theo đơn hàng. Muốn đổi/trả một sản phẩm POD, dùng mục Return v3 riêng bên dưới.</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {request && <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold ${request.status.includes('REJECTED') || request.status === 'ADMIN_REJECTED' ? 'bg-rose-50 text-rose-800' : ['PENDING_PRINTER', 'PENDING_SELLER', 'DISPUTED', 'TIMEOUT_ESCALATED'].includes(request.status) ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>{labels[request.status] || request.status}</span>}
        <OrderStatusSimulator
          orderId={orderId}
          orderStatus={orderStatus}
          isSimulationOrder={orderId.startsWith('TEST-STATUS-')}
          onError={setError}
          onSimulated={async orderCode => {
            navigate(`/orders/${encodeURIComponent(orderCode)}`);
          }}
        />
        {orderStatus === 'pending' && <button type="button" disabled={testBusy} onClick={() => setTestConfirmOpen(true)} className="min-h-10 rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-50">{testBusy ? 'Đang tạo đơn test...' : 'Tạo flow Refund test'}</button>}
        {canRequest && <button type="button" onClick={() => setOpen(v => !v)} className="min-h-10 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{open ? 'Đóng biểu mẫu hoàn tiền' : 'Tạo yêu cầu hoàn tiền'}</button>}
        {canDispute && <button type="button" disabled={busy} onClick={() => setDisputeOpen(true)} className="min-h-10 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-rose-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2">Mở tranh chấp</button>}
      </div>
    </div>
    {request && <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
      {request.product_type === 'POD' ? request.status === 'PENDING_PRINTER' ? 'Yêu cầu đã được gửi trực tiếp đến xưởng in. Người bán chỉ theo dõi tiến trình.' : request.status === 'PRINTER_REJECTED' ? 'Xưởng in đã từ chối. Xem lý do bên dưới; bạn có thể mở tranh chấp nếu cần.' : request.status === 'PRINTER_APPROVED' || request.status === 'ADMIN_APPROVED' ? 'Yêu cầu được chấp thuận. Việc hoàn tiền thật chưa được thực hiện vì cổng thanh toán chưa tích hợp.' : request.status === 'DISPUTED' ? 'Tranh chấp đã được chuyển đến quản trị viên để xem xét.' : 'Yêu cầu đang được xử lý theo quy trình POD.' : request.status === 'PENDING_SELLER' ? 'Người bán đang xem xét yêu cầu. Bạn sẽ thấy cập nhật tại đây.' : request.status === 'DISPUTED' ? 'Tranh chấp đã được chuyển đến quản trị viên để xem xét.' : request.status.includes('APPROVED') ? 'Yêu cầu được chấp thuận. Việc hoàn tiền thật chưa được thực hiện vì cổng thanh toán chưa tích hợp.' : 'Yêu cầu đang được xử lý.'}
    </div>}
    {request && request.evidence?.length > 0 && <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">Minh chứng đã gửi</p><div className="flex flex-wrap gap-3">{request.evidence.map((url, index) => { const isVideo = /\.(mp4|webm|mov)(?:\?|$)/i.test(url); return isVideo ? <video key={url} src={url} controls preload="metadata" className="h-28 max-w-[220px] rounded-lg bg-black" aria-label={`Video minh chứng ${index + 1}`} /> : <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh minh chứng ${index + 1}`}><img src={url} alt={`Ảnh minh chứng ${index + 1}`} className="h-24 w-24 rounded-lg border border-slate-200 object-cover transition hover:opacity-80" /></a>; })}</div></div>}
    {request?.product_type === 'POD' && request.status === 'PRINTER_REJECTED' && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><strong className="block text-xs uppercase tracking-wide">Lý do từ xưởng in</strong><span className="mt-1 block">{request.printer_response?.note || 'Xưởng in chưa cung cấp ghi chú.'}</span></div>}
    {request?.admin_decision && <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">Quyết định quản trị viên: <strong>{request.admin_decision.decision === 'APPROVE' ? `${request.admin_decision.refund_type === 'FULL' ? 'chấp thuận hoàn toàn bộ' : `chấp thuận hoàn ${Number(request.refund_amount || 0).toLocaleString('vi-VN')} ₫`} · bên chịu phí: ${request.admin_decision.cost_bearer}` : 'không chấp thuận'}</strong><br />{request.admin_decision.note}</p>}
    {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {open && <form onSubmit={submit} className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 md:col-span-2"><p className="text-sm font-extrabold text-amber-950">Biểu mẫu hoàn tiền theo đơn hàng</p><p className="mt-1 text-xs leading-5 text-amber-900">Đây là luồng Refund hiện có. Nó không tạo yêu cầu đổi/trả Return v3 cho từng sản phẩm — dùng mục riêng bên dưới nếu cần đổi/trả một sản phẩm POD.</p></div>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Lý do yêu cầu <span className="text-rose-600">*</span><select required value={reason} onChange={e => setReason(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"><option value="" disabled>Chọn lý do</option>{reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Hình thức hoàn<select value={partial ? 'PARTIAL' : 'FULL'} onChange={e => setPartial(e.target.value === 'PARTIAL')} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"><option value="FULL">Hoàn toàn bộ</option><option value="PARTIAL">Hoàn một phần</option></select></label>
      {partial && <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Số tiền đề nghị (₫)<input required type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-medium focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" /></label>}
      <label className="grid gap-1.5 text-sm font-semibold text-slate-800 md:col-span-2">Mô tả chi tiết <span className="text-rose-600">*</span><textarea required minLength={5} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả vấn đề với sản phẩm hoặc đơn hàng..." className="min-h-24 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal leading-6 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100" rows={4} /><span className="text-right text-xs font-normal text-slate-500">{description.length}/3000 · tối thiểu 5 ký tự</span></label>
      <div className="grid gap-2 md:col-span-2">
        <div><p className="text-sm font-semibold text-slate-800">Ảnh / video minh chứng <span className="text-rose-600">*</span></p><p className="mt-1 text-xs leading-5 text-slate-500">Bắt buộc ít nhất 1 tệp · tối đa 3 ảnh và 1 video · ảnh tối đa 10MB, video tối đa 50MB.</p></div>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${countImages >= 3 || uploadingEvidence ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'}`}>
            <ImagePlus size={15} /> Thêm ảnh ({countImages}/3)
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={countImages >= 3 || uploadingEvidence} className="sr-only" onChange={event => { void uploadEvidenceFiles(event.target.files, 'image'); event.target.value = ''; }} />
          </label>
          <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${hasVideo || uploadingEvidence ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'}`}>
            <Video size={15} /> Thêm video ({hasVideo ? 1 : 0}/1)
            <input type="file" accept="video/mp4,video/webm,video/quicktime" disabled={hasVideo || uploadingEvidence} className="sr-only" onChange={event => { void uploadEvidenceFiles(event.target.files, 'video'); event.target.value = ''; }} />
          </label>
          {uploadingEvidence && <span role="status" className="inline-flex min-h-10 items-center text-xs font-semibold text-emerald-700">Đang tải minh chứng lên…</span>}
        </div>
        {evidence.length > 0 && <ul className="grid gap-2 sm:grid-cols-2">
          {evidence.map(item => <li key={item.url} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
            {item.kind === 'image' ? <img src={item.url} alt="Ảnh minh chứng" className="h-14 w-14 rounded-lg border border-slate-100 object-cover" /> : <video src={item.url} controls preload="metadata" className="h-14 w-20 rounded-lg bg-black object-cover" aria-label="Video minh chứng" />}
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{item.name}</span>
            <button type="button" onClick={() => removeEvidence(item.url)} aria-label={`Gỡ ${item.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"><X size={15} /></button>
          </li>)}
        </ul>}
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 md:col-span-2">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 md:col-span-2"><p className="text-xs text-slate-500"><span className="text-rose-600">*</span> Thông tin bắt buộc</p><button type="submit" disabled={busy || uploadingEvidence} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50">{busy ? 'Đang gửi yêu cầu…' : uploadingEvidence ? 'Đang tải minh chứng…' : 'Gửi yêu cầu hoàn tiền'}</button></div>
    </form>}
  </section>
  <BuyerReturnItemList orderId={orderId} delivered={orderStatus === 'completed'} />
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
