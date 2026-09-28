import type React from 'react';
import { X } from 'lucide-react';
import type { RefundRequest } from '../../../order/services/refundService';

type Props = { item: RefundRequest; onClose: () => void; onDecide: () => void };

export function AdminRefundDetail({ item, onClose, onDecide }: Props) {
  const order = typeof item.order_id === 'object' ? item.order_id : null;
  const buyer = typeof item.buyer_id === 'object' ? item.buyer_id : null;
  const seller = typeof item.seller_id === 'object' ? item.seller_id : null;
  const isPod = item.product_type === 'POD';
  const testOrder = String(order?.order_code || '').startsWith('TEST-REFUND');
  const status = item.status === 'DISPUTED' ? 'Đang chờ Admin' : item.status;
  const entry = (label: string, children: React.ReactNode) => <div className="rounded-lg bg-admin-canvas p-3"><dt className="text-xs font-bold uppercase tracking-wide text-admin-muted">{label}</dt><dd className="mb-0 mt-1 whitespace-pre-wrap text-sm text-admin-ink">{children || 'Chưa có thông tin'}</dd></div>;

  return <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="refund-detail-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
      <header className="flex items-start justify-between gap-4 border-b border-admin-line pb-4"><div><p className="m-0 text-xs font-bold uppercase text-admin-muted">{isPod ? 'POD' : 'Sản phẩm thường'} · Đơn #{order?.order_code || String(item.order_id).slice(-12)}</p><h2 id="refund-detail-title" className="mb-0 mt-1 text-xl font-extrabold text-admin-ink">Chi tiết tranh chấp</h2></div><button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="rounded-full p-2 text-admin-muted hover:bg-admin-canvas"><X size={18} /></button></header>
      {testOrder && <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">Đơn test Refund — payment vẫn PENDING; không phát sinh giao dịch tiền thật.</p>}
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">{entry('Trạng thái', status)}{entry('Người mua', buyer?.full_name || buyer?.email)}{entry('Người bán', seller?.shop_name || seller?.full_name || seller?.email)}{entry('Lý do', item.reason_category)}{entry('Yêu cầu Buyer', item.description)}{entry('Số tiền đề nghị', item.refund_type === 'FULL' ? 'Toàn bộ' : `${Number(item.refund_amount || 0).toLocaleString('vi-VN')} ₫`)}{entry('Seller response', item.seller_response ? `${item.seller_response.decision === 'APPROVE' ? 'Chấp thuận' : 'Từ chối'}${item.seller_response.note ? ` — ${item.seller_response.note}` : ''}` : 'Chưa phản hồi')}{entry('Seller triage', isPod ? `${item.triage_result === 'PRINTER_RESPONSIBILITY' ? 'Printer chịu trách nhiệm' : item.triage_result === 'SELLER_RESPONSIBILITY' ? 'Seller chịu trách nhiệm' : 'Chưa xác định'}${item.triage_checklist?.note ? ` — ${item.triage_checklist.note}` : ''}` : 'Không áp dụng: sản phẩm thường')}{entry('Printer response', isPod ? (item.printer_response ? `${item.printer_response.decision === 'APPROVE' ? 'Chấp thuận' : 'Từ chối'}${item.printer_response.note ? ` — ${item.printer_response.note}` : ''}` : 'Chưa phản hồi / timeout') : 'Không tham gia: sản phẩm thường')}{entry('Lý do tranh chấp', item.dispute?.reason)}{entry('Ngày gửi', item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—')}</dl>
      {item.evidence?.length > 0 && <section className="mt-4"><h3 className="text-sm font-bold text-admin-ink">Bằng chứng</h3><div className="flex flex-wrap gap-2">{item.evidence.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-admin-line px-3 py-2 text-sm font-semibold text-admin-brand">Mở bằng chứng {index + 1}</a>)}</div></section>}
      <footer className="mt-5 flex justify-end border-t border-admin-line pt-4"><button type="button" onClick={onDecide} className="min-h-11 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white">Ra quyết định cuối</button></footer>
    </section>
  </div>;
}
