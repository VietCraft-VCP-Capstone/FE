import { useState } from 'react';
import { AlertTriangle, ArrowUpRight, CalendarClock, CheckCircle2, Image as ImageIcon, Loader2, Package, Printer, RotateCcw, XCircle } from 'lucide-react';
import { refundService, type RefundRequest } from '../../../order/services/refundService';
import { getApiErrorMessage } from '../../../../infrastructure/api/interceptors';

const STATUS_LABEL: Record<string, string> = {
  PENDING_SELLER: 'Chờ bạn xử lý', SELLER_APPROVED: 'Đã duyệt', SELLER_REJECTED: 'Đã từ chối · buyer có thể tranh chấp',
  PENDING_PRINTER: 'Đang chờ xưởng in phản hồi', PRINTER_APPROVED: 'Xưởng in chấp thuận', PRINTER_REJECTED: 'Xưởng in từ chối · buyer có thể tranh chấp',
  DISPUTED: 'Đang tranh chấp với admin', ADMIN_APPROVED: 'Admin chấp thuận', ADMIN_REJECTED: 'Admin từ chối',
  REFUNDED: 'Đã hoàn tiền', TIMEOUT_ESCALATED: 'Quá hạn · buyer có thể tranh chấp',
};
const APPROVED = new Set(['SELLER_APPROVED', 'PRINTER_APPROVED', 'ADMIN_APPROVED']);
/** Trạng thái chuyển tiền hoàn thật (execution_status), tách khỏi quyết định duyệt. */
const EXECUTION_LABEL: Record<string, string> = {
  NOT_STARTED: 'chưa hoàn tiền', PROCESSING: 'đang hoàn tiền', FAILED: 'hoàn tiền lỗi',
};
const REASON_LABEL: Record<string, string> = { DAMAGED: 'Hàng bị hư hỏng', WRONG_DESCRIPTION: 'Không đúng mô tả', PRINT_DEFECT: 'Lỗi in ấn', MISSING_ITEM: 'Thiếu sản phẩm', OTHER: 'Lý do khác' };
const CLOSED = new Set(['SELLER_APPROVED', 'SELLER_REJECTED', 'PRINTER_APPROVED', 'PRINTER_REJECTED', 'DISPUTED', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'REFUNDED']);
const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

export function SellerRefundRequestCard({ item, onUpdated }: { item: RefundRequest; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const order = typeof item.order_id === 'object' ? item.order_id : null;
  const buyer = typeof item.buyer_id === 'object' ? item.buyer_id : null;
  const pod = item.product_type === 'POD';
  const deadlineValue = pod ? item.sla_deadlines?.printer_deadline : item.sla_deadlines?.seller_deadline;
  const deadline = deadlineValue ? new Date(deadlineValue) : null;
  const overdue = deadline ? deadline.getTime() < Date.now() && ['PENDING_SELLER', 'PENDING_PRINTER'].includes(item.status) : false;
  const statusStyle = CLOSED.has(item.status) ? 'border-stone-200 bg-stone-50 text-stone-700' : 'border-amber-200 bg-amber-50 text-amber-900';
  const approved = APPROVED.has(item.status);
  const refunded = item.status === 'REFUNDED' || item.execution_status === 'SUCCEEDED';
  const execution = approved && !refunded ? item.execution_status || 'NOT_STARTED' : null;
  const statusLabel = `${STATUS_LABEL[item.status] || item.status}${execution ? ` · ${EXECUTION_LABEL[execution] || execution}` : ''}`;
  const retry = async () => {
    setBusy(true); setError('');
    try { await refundService.sellerRetryExecution(item._id); onUpdated(); }
    catch (cause) { setError(getApiErrorMessage(cause, 'Chưa chạy lại được việc hoàn tiền. Vui lòng thử lại.')); }
    finally { setBusy(false); }
  };
  const decide = async (decision: 'APPROVE' | 'REJECT') => {
    if (!note.trim()) { setError('Nhập ghi chú để người mua hiểu quyết định của bạn.'); return; }
    setBusy(true); setError('');
    try { await refundService.sellerDecision(item._id, decision, note.trim()); onUpdated(); }
    catch (cause) { setError(getApiErrorMessage(cause, 'Không cập nhật được yêu cầu. Vui lòng thử lại.')); }
    finally { setBusy(false); setRejecting(false); }
  };

  return <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 p-5">
      <div className="flex min-w-0 gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E2] text-[#007700]"><Package size={20} aria-hidden /></span>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-base font-extrabold text-stone-900">Đơn #{order?.order_code || String(item.order_id).slice(-10)}</h2><span className="rounded-md bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600">{pod ? 'Sản phẩm POD' : 'Sản phẩm thường'}</span></div><p className="mb-0 mt-1 text-sm text-stone-600">Khách hàng: <strong className="text-stone-800">{buyer?.full_name || buyer?.email || 'Người mua'}</strong></p></div>
      </div><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle}`}>{statusLabel}</span>
    </div>
    <div className="grid gap-5 p-5 md:grid-cols-[1fr_240px]"><div className="space-y-4">
      <div><p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">Lý do yêu cầu</p><p className="m-0 font-bold text-stone-900">{REASON_LABEL[item.reason_category] || item.reason_category}</p><p className="mb-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{item.description}</p></div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><span><span className="text-stone-500">Mức hoàn đề nghị:</span> <strong className="text-stone-900">{item.refund_type === 'FULL' ? 'Toàn bộ' : money(Number(item.refund_amount))}</strong></span><span><span className="text-stone-500">Đơn:</span> <strong className="text-stone-800">{order?.order_status || '—'}</strong></span></div>
      {item.evidence?.length > 0 && <div><p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-500"><ImageIcon size={14} /> Bằng chứng ({item.evidence.length})</p><div className="flex flex-wrap gap-2">{item.evidence.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-[#006600] hover:bg-stone-50"><span>Bằng chứng {index + 1}</span><ArrowUpRight size={13} /></a>)}</div></div>}
      {pod && <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900"><Printer size={15} className="mr-1 inline" /> Yêu cầu POD được gửi trực tiếp tới xưởng in. Seller chỉ xem trạng thái và phản hồi của xưởng in.</div>}
      {pod && item.printer_response && <div className={`rounded-lg p-3 text-sm ${item.printer_response.decision === 'REJECT' ? 'bg-red-50 text-red-900' : 'bg-emerald-50 text-emerald-900'}`}><Printer size={15} className="mr-1 inline" /> Xưởng in {item.printer_response.decision === 'REJECT' ? 'từ chối' : 'chấp thuận'}: {item.printer_response.note || 'Không có ghi chú.'}</div>}
    </div><aside className="rounded-xl bg-stone-50 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">Thời hạn phản hồi</p><div className={`flex items-start gap-2 text-sm ${overdue ? 'text-red-700' : 'text-stone-800'}`}><CalendarClock size={17} className="mt-0.5 shrink-0" /><span>{deadline ? deadline.toLocaleString('vi-VN') : 'Chưa xác định'}{overdue && <strong className="mt-1 block">Đã quá hạn</strong>}</span></div><p className="mb-0 mt-3 text-xs text-stone-500">SLA {pod ? 'xưởng in' : 'seller'}: 48 giờ</p></aside></div>
    {!pod && item.status === 'PENDING_SELLER' && <div className="border-t border-stone-100 bg-stone-50/60 p-5"><label className="mb-2 block text-sm font-bold text-stone-800">Ghi chú phản hồi <span className="font-normal text-stone-500">(bắt buộc)</span><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Giải thích ngắn gọn quyết định cho khách..." className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-100" /></label>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 text-xs text-stone-500">Duyệt xong, hệ thống tự hoàn tiền về tài khoản khách đã dùng để thanh toán.</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => setRejecting(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle size={16} /> Từ chối</button><button type="button" disabled={busy} onClick={() => void decide('APPROVE')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#007700] px-4 py-2 text-sm font-bold text-white hover:bg-[#006000] disabled:opacity-50"><CheckCircle2 size={16} /> Duyệt yêu cầu</button></div></div>
      {rejecting && <div role="alertdialog" aria-label="Xác nhận từ chối" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3"><p className="m-0 text-sm text-red-900">Xác nhận từ chối yêu cầu này?</p><div className="flex gap-2"><button type="button" onClick={() => setRejecting(false)} className="min-h-10 rounded-lg border bg-white px-3 text-sm font-semibold">Quay lại</button><button type="button" disabled={busy} onClick={() => void decide('REJECT')} className="min-h-10 rounded-lg bg-red-700 px-3 text-sm font-bold text-white disabled:opacity-50">Xác nhận từ chối</button></div></div>}
      {error && <p role="alert" className="mb-0 mt-3 text-sm font-medium text-red-700">{error}</p>}
    </div>}
    {execution && <div className="flex flex-wrap items-start justify-between gap-3 border-t border-stone-100 bg-stone-50/60 p-5">
      <div className="flex min-w-0 items-start gap-2.5">
        {execution === 'PROCESSING'
          ? <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-stone-500 motion-reduce:animate-none" aria-hidden />
          : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />}
        <div className="min-w-0 text-sm">
          <p className="m-0 font-semibold text-stone-900">{execution === 'PROCESSING' ? 'Đang chuyển tiền hoàn cho khách' : 'Chưa chuyển được tiền hoàn cho khách'}</p>
          {item.execution_error && <p className="mb-0 mt-1 text-stone-600">{item.execution_error}</p>}
        </div>
      </div>
      {execution !== 'PROCESSING' && <button type="button" disabled={busy} onClick={() => void retry()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-stone-800 transition hover:bg-stone-50 active:scale-[0.98] disabled:opacity-50">
        {busy ? <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <RotateCcw size={15} aria-hidden />} Thử hoàn tiền lại
      </button>}
      {error && <p role="alert" className="mb-0 w-full text-sm font-medium text-red-700">{error}</p>}
    </div>}
  </article>;
}
