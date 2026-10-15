import type React from 'react';
import { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';
import type { RefundRequest } from '../../../order/services/refundService';

type Props = { item: RefundRequest; onClose: () => void; onDecide: () => void };
type SelectedEvidence = { url: string; index: number; isVideo: boolean };

function EvidenceGallery({ evidence }: { evidence: string[] }) {
  const [selected, setSelected] = useState<SelectedEvidence | null>(null);

  useEffect(() => {
    if (!selected) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);

  if (!evidence.length) {
    return <p className="m-0 rounded-lg bg-admin-canvas p-3 text-sm text-admin-muted">Buyer chưa gửi ảnh hoặc video minh chứng.</p>;
  }
  return <>
    <div className="flex flex-wrap gap-3">
      {evidence.map((url, index) => {
        const isVideo = /\.(mp4|webm|mov)(?:[?#]|$)/i.test(url);
        return <button key={url} type="button" onClick={() => setSelected({ url, index, isVideo })}
          aria-label={`Phóng to ${isVideo ? 'video' : 'ảnh'} minh chứng ${index + 1}`}
          className="group relative h-24 w-28 overflow-hidden rounded-lg border border-admin-line bg-admin-canvas text-left shadow-sm transition hover:border-admin-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand sm:h-28 sm:w-36">
          {isVideo
            ? <video src={url} muted preload="metadata" className="h-full w-full bg-black object-cover" aria-hidden="true" />
            : <img src={url} alt={`Ảnh minh chứng thu nhỏ ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />}
          {isVideo && <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60"><Play size={18} fill="currentColor" /></span></span>}
          <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">{isVideo ? 'Video' : 'Ảnh'} {index + 1} · Xem lớn</span>
        </button>;
      })}
    </div>
    {selected && <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <section role="dialog" aria-modal="true" aria-label={`${selected.isVideo ? 'Video' : 'Ảnh'} minh chứng ${selected.index + 1}`} className="relative flex max-h-[92vh] max-w-[94vw] items-center justify-center">
        <button type="button" onClick={() => setSelected(null)} aria-label="Đóng ảnh/video phóng to" className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg hover:bg-slate-100"><X size={20} /></button>
        {selected.isVideo
          ? <video src={selected.url} controls autoPlay playsInline className="max-h-[88vh] max-w-[94vw] rounded-lg bg-black" />
          : <img src={selected.url} alt={`Ảnh minh chứng ${selected.index + 1} phóng to`} className="max-h-[88vh] max-w-[94vw] rounded-lg object-contain shadow-2xl" />}
      </section>
    </div>}
  </>;
}

export function AdminRefundDetail({ item, onClose, onDecide }: Props) {
  const order = typeof item.order_id === 'object' ? item.order_id : null;
  const buyer = typeof item.buyer_id === 'object' ? item.buyer_id : null;
  const seller = typeof item.seller_id === 'object' ? item.seller_id : null;
  const isPod = item.product_type === 'POD';
  const testOrder = String(order?.order_code || '').startsWith('TEST-REFUND');
  const status = item.status === 'DISPUTED' ? 'Đang chờ Admin' : item.status;
  const entry = (label: string, value?: React.ReactNode) => <div className="rounded-lg bg-admin-canvas p-3"><dt className="text-xs font-bold uppercase tracking-wide text-admin-muted">{label}</dt><dd className="mb-0 mt-1 whitespace-pre-wrap text-sm leading-6 text-admin-ink">{value || 'Chưa có thông tin'}</dd></div>;

  return <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="refund-detail-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7">
      <header className="flex items-start justify-between gap-4 border-b border-admin-line pb-4"><div><p className="m-0 text-xs font-bold uppercase text-admin-muted">{isPod ? 'POD' : 'Sản phẩm thường'} · Đơn #{order?.order_code || String(item.order_id).slice(-12)}</p><h2 id="refund-detail-title" className="mb-0 mt-1 text-xl font-extrabold text-admin-ink">Chi tiết tranh chấp</h2></div><button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="rounded-full p-2 text-admin-muted hover:bg-admin-canvas"><X size={18} /></button></header>
      {testOrder && <p className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">Đơn test Refund — payment vẫn PENDING; không phát sinh giao dịch tiền thật.</p>}
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {entry('Trạng thái', status)}{entry('Người mua', buyer?.full_name || buyer?.email)}{entry('Người bán', seller?.shop_name || seller?.full_name || seller?.email)}{entry('Loại sản phẩm', isPod ? 'POD' : 'Sản phẩm thường')}{entry('Lý do', item.reason_category)}{entry('Số tiền đề nghị', item.refund_type === 'FULL' ? 'Toàn bộ' : `${Number(item.refund_amount || 0).toLocaleString('vi-VN')} ₫`)}
        <div className="sm:col-span-2">{entry('Mô tả yêu cầu của Buyer', item.description)}</div>
        <div className="sm:col-span-2">{entry('Lý do mở tranh chấp', item.dispute?.reason)}</div>
        {isPod && entry('Phản hồi từ xưởng in', item.printer_response ? `${item.printer_response.decision === 'APPROVE' ? 'Chấp thuận' : 'Từ chối'}${item.printer_response.note ? ` — ${item.printer_response.note}` : ''}` : 'Chưa phản hồi / quá thời hạn')}
        {entry('Ngày gửi', item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—')}
      </dl>
      <section className="mt-5 border-t border-admin-line pt-4"><h3 className="mb-3 mt-0 text-sm font-bold text-admin-ink">Ảnh / video bằng chứng</h3><EvidenceGallery evidence={item.evidence || []} /></section>
      <footer className="mt-5 flex justify-end border-t border-admin-line pt-4"><button type="button" onClick={onDecide} className="min-h-11 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white">Ra quyết định cuối</button></footer>
    </section>
  </div>;
}
