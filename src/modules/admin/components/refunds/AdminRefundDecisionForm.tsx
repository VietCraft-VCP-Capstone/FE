import { useState } from 'react';
import type React from 'react';
import { Check, X } from 'lucide-react';
import type { RefundRequest } from '../../../order/services/refundService';

type Decision = 'APPROVE' | 'REJECT';
type CostBearer = 'SELLER' | 'PRINTER' | 'PLATFORM';
type Props = {
  item: RefundRequest;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: { decision: Decision; cost_bearer: CostBearer; refund_amount?: number; note: string }) => void;
};

const COST_OPTIONS: { value: CostBearer; title: string; detail: string }[] = [
  { value: 'SELLER', title: 'Seller', detail: 'Người bán chịu chi phí hoàn.' },
  { value: 'PRINTER', title: 'Printer', detail: 'Đơn vị in chịu chi phí. Chỉ phù hợp với lỗi từ Printer.' },
  { value: 'PLATFORM', title: 'Platform', detail: 'Nền tảng chịu chi phí hoàn.' },
];

export function AdminRefundDecisionForm({ item, busy, error, onClose, onSubmit }: Props) {
  const [decision, setDecision] = useState<Decision>('APPROVE');
  const [amount, setAmount] = useState(String(item.refund_amount || ''));
  const [costBearer, setCostBearer] = useState<CostBearer>(item.product_type === 'POD' && item.triage_result === 'PRINTER_RESPONSIBILITY' ? 'PRINTER' : 'SELLER');
  const [note, setNote] = useState('');
  const orderCode = typeof item.order_id === 'object' ? item.order_id.order_code : '';
  const isTest = String(orderCode || '').startsWith('TEST-REFUND');
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (note.trim().length < 3 || (decision === 'APPROVE' && (!Number.isFinite(Number(amount)) || Number(amount) <= 0))) return;
    onSubmit({ decision, cost_bearer: costBearer, refund_amount: decision === 'APPROVE' ? Number(amount) : undefined, note: note.trim() });
  };

  return <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-[rgba(16,33,26,0.48)] p-3 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <form role="dialog" aria-modal="true" aria-labelledby="admin-decision-title" onSubmit={submit} className="my-auto w-full max-w-2xl overflow-hidden rounded-[14px] bg-white shadow-admin-lg">
      <header className="flex items-start justify-between gap-4 border-b border-admin-line px-5 py-4 sm:px-6 sm:py-5"><div><p className="m-0 text-xs font-bold uppercase tracking-wide text-admin-muted">Đơn #{orderCode || String(item.order_id).slice(-12)} · {item.product_type === 'POD' ? 'POD' : 'Sản phẩm thường'}</p><h2 id="admin-decision-title" className="mb-0 mt-1 text-lg font-extrabold text-admin-ink">Quyết định cuối cùng</h2><p className="mb-0 mt-1 text-sm text-admin-muted">Quyết định này kết thúc quy trình tranh chấp.</p></div><button type="button" aria-label="Đóng" onClick={onClose} disabled={busy} className="rounded-full p-2 text-admin-muted hover:bg-admin-canvas"><X size={18} /></button></header>
      <div className="max-h-[calc(100dvh-190px)] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        {isTest && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900"><strong>Đơn test Refund.</strong> Payment vẫn PENDING; thao tác này không chuyển tiền thật.</div>}
        <fieldset className="m-0 border-0 p-0"><legend className="mb-2 text-sm font-bold text-admin-ink">1. Kết quả quyết định</legend><div className="grid gap-2 sm:grid-cols-2">
          {[{ value: 'APPROVE' as const, label: 'Chấp thuận hoàn tiền', desc: 'Xác định số tiền được duyệt.' }, { value: 'REJECT' as const, label: 'Từ chối yêu cầu', desc: 'Không duyệt khoản hoàn tiền.' }].map(option => <button key={option.value} type="button" aria-pressed={decision === option.value} onClick={() => setDecision(option.value)} className={`rounded-lg border p-3 text-left transition-colors ${decision === option.value ? 'border-admin-brand bg-admin-brand-050 ring-1 ring-admin-brand' : 'border-admin-line hover:bg-admin-canvas'}`}><span className="flex items-center justify-between gap-2 text-sm font-bold text-admin-ink">{option.label}{decision === option.value && <Check size={16} className="text-admin-brand" />}</span><span className="mt-1 block text-xs text-admin-muted">{option.desc}</span></button>)}
        </div></fieldset>
        {decision === 'APPROVE' && <div><label htmlFor="refund-amount" className="mb-1.5 block text-sm font-bold text-admin-ink">2. Số tiền hoàn được duyệt</label><div className="flex overflow-hidden rounded-admin border border-[#d5ddd5] focus-within:border-admin-brand focus-within:ring-2 focus-within:ring-admin-brand/20"><input id="refund-amount" required type="number" min="1" max={item.order_id?.financial_breakdown ? Number(item.order_id.financial_breakdown.subtotal) + Number(item.order_id.financial_breakdown.shipping_fee) : undefined} value={amount} onChange={event => setAmount(event.target.value)} className="min-w-0 flex-1 border-0 px-3 py-2.5 text-sm outline-none" placeholder="Nhập số tiền" /><span className="border-l border-admin-line bg-admin-canvas px-3 py-2.5 text-sm font-semibold text-admin-muted">VND</span></div><p className="mb-0 mt-1.5 text-xs text-admin-muted">Đề nghị ban đầu: {item.refund_type === 'FULL' ? 'Hoàn toàn bộ' : `${Number(item.refund_amount || 0).toLocaleString('vi-VN')} ₫`} · Không vượt quá giá trị đơn hàng.</p></div>}
        <fieldset className="m-0 border-0 p-0"><legend className="mb-2 text-sm font-bold text-admin-ink">{decision === 'APPROVE' ? '3.' : '2.'} Bên chịu chi phí</legend><div className="grid gap-2 sm:grid-cols-3">{COST_OPTIONS.map(option => <button key={option.value} type="button" aria-pressed={costBearer === option.value} onClick={() => setCostBearer(option.value)} className={`rounded-lg border p-3 text-left ${costBearer === option.value ? 'border-admin-brand bg-admin-brand-050 ring-1 ring-admin-brand' : 'border-admin-line hover:bg-admin-canvas'}`}><span className="flex items-center justify-between font-bold text-admin-ink">{option.title}{costBearer === option.value && <Check size={15} className="text-admin-brand" />}</span><span className="mt-1 block text-xs leading-5 text-admin-muted">{option.detail}</span></button>)}</div></fieldset>
        <div><label htmlFor="admin-decision-note" className="mb-1.5 block text-sm font-bold text-admin-ink">{decision === 'APPROVE' ? '4.' : '3.'} Lý do quyết định <span className="font-normal text-red-700">(bắt buộc)</span></label><p id="decision-note-help" className="mb-2 mt-0 text-xs text-admin-muted">Nêu căn cứ dựa trên yêu cầu, bằng chứng và phản hồi của các bên. Nội dung này được lưu vào hồ sơ tranh chấp.</p><textarea id="admin-decision-note" required minLength={3} maxLength={1000} rows={4} value={note} onChange={event => setNote(event.target.value)} aria-describedby="decision-note-help decision-note-count" placeholder="Nhập lý do và căn cứ quyết định…" className="w-full resize-y rounded-admin border border-[#d5ddd5] px-3 py-2.5 text-sm leading-6 text-admin-ink outline-none placeholder:text-admin-muted focus:border-admin-brand focus:ring-2 focus:ring-admin-brand/20"/><p id="decision-note-count" className="mb-0 mt-1 text-right text-xs text-admin-muted">{note.length}/1000</p></div>
        {error && <p role="alert" className="m-0 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
      <footer className="flex flex-col-reverse gap-2 border-t border-admin-line bg-[#fafcfa] px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-admin border border-[#d5ddd5] bg-white px-4 text-sm font-semibold text-admin-ink hover:bg-admin-canvas">Hủy</button><button type="submit" disabled={busy || note.trim().length < 3 || (decision === 'APPROVE' && (!Number(amount) || Number(amount) <= 0))} className="min-h-11 rounded-admin border border-admin-brand bg-admin-brand px-5 text-sm font-bold text-white hover:bg-admin-brand-700 disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu quyết định cuối'}</button></footer>
    </form>
  </div>;
}
