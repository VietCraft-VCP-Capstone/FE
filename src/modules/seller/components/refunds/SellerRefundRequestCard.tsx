import { useState } from 'react';
import { AlertCircle, ArrowUpRight, CalendarClock, CheckCircle2, Clock3, Image as ImageIcon, Package, Printer, XCircle } from 'lucide-react';
import { refundService, type RefundRequest } from '../../../order/services/refundService';

const STATUS_LABEL: Record<string, string> = {
  PENDING_SELLER: 'Chờ bạn xử lý', SELLER_APPROVED: 'Đã duyệt · gateway chưa tích hợp', SELLER_REJECTED: 'Đã từ chối · buyer có thể tranh chấp',
  PENDING_PRINTER: 'Đang chờ Printer mock', PRINTER_APPROVED: 'Printer chấp thuận · gateway chưa tích hợp', PRINTER_REJECTED: 'Printer từ chối · buyer có thể tranh chấp',
  DISPUTED: 'Đang tranh chấp với admin', ADMIN_APPROVED: 'Admin chấp thuận · gateway chưa tích hợp', ADMIN_REJECTED: 'Admin từ chối',
  REFUNDED: 'Đã hoàn tiền', TIMEOUT_ESCALATED: 'Quá hạn · buyer có thể tranh chấp',
};
const REASON_LABEL: Record<string, string> = { DAMAGED: 'Hàng bị hư hỏng', WRONG_DESCRIPTION: 'Không đúng mô tả', PRINT_DEFECT: 'Lỗi in ấn', MISSING_ITEM: 'Thiếu sản phẩm', OTHER: 'Lý do khác' };
const CLOSED = new Set(['SELLER_APPROVED', 'SELLER_REJECTED', 'PRINTER_APPROVED', 'PRINTER_REJECTED', 'DISPUTED', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'REFUNDED']);
const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const TRIAGE_CHECKS = [
  ['evidence_reviewed', 'Đã đối chiếu ảnh/video bằng chứng'],
  ['order_verified', 'Đã kiểm tra đơn và sản phẩm giao'],
  ['artwork_checked', 'Đã kiểm tra file thiết kế và thông số in'],
  ['seller_terms_checked', 'Đã đối chiếu mô tả và cam kết của Seller'],
] as const;

export function SellerRefundRequestCard({ item, onUpdated }: { item: RefundRequest; onUpdated: () => void }) {
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [triageNote, setTriageNote] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const deadline = item.sla_deadlines?.seller_deadline ? new Date(item.sla_deadlines.seller_deadline) : null;
  const overdue = deadline ? deadline.getTime() < Date.now() && item.status === 'PENDING_SELLER' : false;
  const order = typeof item.order_id === 'object' ? item.order_id : null;
  const buyer = typeof item.buyer_id === 'object' ? item.buyer_id : null;
  const statusStyle = CLOSED.has(item.status) ? 'border-stone-200 bg-stone-50 text-stone-700' : 'border-amber-200 bg-amber-50 text-amber-900';

  const run = async (action: () => Promise<RefundRequest>) => {
    setBusy(true); setError('');
    try { await action(); onUpdated(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không cập nhật được yêu cầu.'); }
    finally { setBusy(false); }
  };
  const decide = (decision: 'APPROVE' | 'REJECT') => {
    if (!note.trim()) { setError('Nhập ghi chú để người mua hiểu quyết định của bạn.'); return; }
    void run(() => refundService.sellerDecision(item._id, decision, note.trim()));
  };
  const triage = (result: 'SELLER_RESPONSIBILITY' | 'PRINTER_RESPONSIBILITY') => {
    const keys = TRIAGE_CHECKS.map(([key]) => key);
    if (!keys.every(key => checked[key]) || !triageNote.trim()) { setError('Hoàn thành checklist và ghi chú trước khi chuyển bước.'); return; }
    const checklist = { ...Object.fromEntries(keys.map(key => [key, true])), note: triageNote.trim() } as { evidence_reviewed: boolean; order_verified: boolean; artwork_checked: boolean; seller_terms_checked: boolean; note: string };
    void run(() => refundService.triage(item._id, result, checklist));
  };
  const disputePrinter = () => {
    if (!note.trim()) { setError('Ghi lý do không đồng ý với kết quả Printer.'); return; }
    void run(() => refundService.sellerDispute(item._id, note.trim()));
  };
  const printerDecided = item.product_type === 'POD' && item.triage_result === 'PRINTER_RESPONSIBILITY' && ['PRINTER_APPROVED', 'PRINTER_REJECTED'].includes(item.status);

  
  return <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 p-5">
      <div className="flex min-w-0 gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E2] text-[#007700]"><Package size={20} aria-hidden /></span>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-base font-extrabold text-stone-900">Đơn #{order?.order_code || String(item.order_id).slice(-10)}</h2><span className="rounded-md bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600">{item.product_type === 'POD' ? 'Sản phẩm POD' : 'Sản phẩm thường'}</span></div>
          <p className="mb-0 mt-1 text-sm text-stone-600">Khách hàng: <strong className="text-stone-800">{buyer?.full_name || buyer?.email || 'Người mua'}</strong></p></div>
      </div>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyle}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{STATUS_LABEL[item.status] || item.status}</span>
    </div>

    <div className="grid gap-5 p-5 md:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">Lý do yêu cầu</p><p className="m-0 font-bold text-stone-900">{REASON_LABEL[item.reason_category] || item.reason_category}</p><p className="mb-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{item.description}</p></div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><span><span className="text-stone-500">Mức hoàn đề nghị:</span> <strong className="text-stone-900">{item.refund_type === 'FULL' ? 'Toàn bộ' : money(Number(item.refund_amount))}</strong></span><span><span className="text-stone-500">Đơn:</span> <strong className="text-stone-800">{order?.order_status || '—'}</strong></span></div>
        {item.evidence?.length > 0 && <div><p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-500"><ImageIcon size={14} /> Bằng chứng ({item.evidence.length})</p><div className="flex flex-wrap gap-2">{item.evidence.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-[#006600] hover:bg-stone-50"><span>Bằng chứng {index + 1}</span><ArrowUpRight size={13} /></a>)}</div></div>}
        {item.product_type === 'POD' && item.triage_result && <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900"><Printer size={15} className="mr-1 inline" /> Phân loại: <strong>{item.triage_result === 'PRINTER_RESPONSIBILITY' ? 'Chuyển Printer xử lý' : 'Seller chịu trách nhiệm'}</strong>{item.triage_checklist?.note && <p className="mb-0 mt-1">Biên bản triage: {item.triage_checklist.note}</p>}</div>}
      </div>
      <aside className="rounded-xl bg-stone-50 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">Thời hạn phản hồi</p>
        <div className={`flex items-start gap-2 text-sm ${overdue ? 'text-red-700' : 'text-stone-800'}`}><CalendarClock size={17} className="mt-0.5 shrink-0" /><span>{deadline ? deadline.toLocaleString('vi-VN') : 'Chưa xác định'}{overdue && <strong className="mt-1 block">Đã quá hạn</strong>}</span></div>
        <p className="mb-0 mt-3 flex items-center gap-1.5 text-xs text-stone-500"><Clock3 size={13} /> SLA seller: 48 giờ</p>
      </aside>
    </div>

    {printerDecided && <div className="border-t border-stone-100 bg-stone-50/60 p-5"><label className="mb-2 block text-sm font-bold text-stone-800">Không đồng ý kết quả Printer? Mở tranh chấp cho Admin xem xét<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Ghi lý do tranh chấp..." className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-[#007700]" /></label><button type="button" disabled={busy} onClick={disputePrinter} className="min-h-11 rounded-xl bg-indigo-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Chuyển Admin phân xử</button>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div>}
    {item.status === 'PENDING_SELLER' && <div className="border-t border-stone-100 bg-stone-50/60 p-5">
      {item.product_type === 'POD' && !item.triage_result ? <><p className="mb-3 text-sm font-bold text-stone-800">Bước 1 · Checklist triage POD</p><div className="grid gap-2 sm:grid-cols-2">{TRIAGE_CHECKS.map(([key, label]) => <label key={key} className="flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-700"><input type="checkbox" checked={!!checked[key]} onChange={event => setChecked(current => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}</div><textarea value={triageNote} onChange={event => setTriageNote(event.target.value)} maxLength={1000} rows={2} placeholder="Ghi nhận căn cứ và kết luận triage..." className="mt-3 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm"/><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => triage('SELLER_RESPONSIBILITY')} className="min-h-11 rounded-xl border border-[#007700] bg-white px-4 py-2 text-sm font-bold text-[#006600] hover:bg-emerald-50 disabled:opacity-50">Seller chịu trách nhiệm</button><button type="button" disabled={busy} onClick={() => triage('PRINTER_RESPONSIBILITY')} className="min-h-11 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-800 hover:bg-indigo-50 disabled:opacity-50">Chuyển Printer mock</button></div></> : <><label className="mb-2 block text-sm font-bold text-stone-800">Ghi chú phản hồi <span className="font-normal text-stone-500">(bắt buộc)</span><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={2} placeholder="Giải thích ngắn gọn quyết định cho khách..." className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-100" /></label><div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 text-xs text-stone-500">Duyệt chỉ ghi nhận quyết định; gateway hoàn tiền chưa tích hợp.</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => setRejecting(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle size={16} /> Từ chối</button><button type="button" disabled={busy} onClick={() => decide('APPROVE')} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#007700] px-4 py-2 text-sm font-bold text-white hover:bg-[#006000] disabled:opacity-50"><CheckCircle2 size={16} /> Duyệt yêu cầu</button></div></div>{rejecting && <div role="alertdialog" aria-label="Xác nhận từ chối" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3"><p className="m-0 flex items-center gap-2 text-sm text-red-900"><AlertCircle size={16} /> Xác nhận từ chối yêu cầu này?</p><div className="flex gap-2"><button type="button" onClick={() => setRejecting(false)} className="min-h-10 rounded-lg border bg-white px-3 text-sm font-semibold">Quay lại</button><button type="button" disabled={busy} onClick={() => { setRejecting(false); decide('REJECT'); }} className="min-h-10 rounded-lg bg-red-700 px-3 text-sm font-bold text-white disabled:opacity-50">Xác nhận từ chối</button></div></div>}</>}
      {error && <p role="alert" className="mb-0 mt-3 text-sm font-medium text-red-700">{error}</p>}
    </div>}
  </article>;
}
