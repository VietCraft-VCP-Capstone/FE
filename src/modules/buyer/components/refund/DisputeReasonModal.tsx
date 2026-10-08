import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

type DisputeReasonModalProps = {
  orderCode: string;
  requestReason: string;
  sellerOutcome: string;
  loading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
};

export function DisputeReasonModal({ orderCode, requestReason, sellerOutcome, loading, error, onClose, onSubmit }: DisputeReasonModalProps) {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 5) {
      setValidationError('Vui lòng nhập ít nhất 5 ký tự để giải thích tranh chấp.');
      return;
    }
    setValidationError('');
    void onSubmit(reason.trim());
  };

  return <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !loading) onClose(); }}>
    <form role="dialog" aria-modal="true" aria-labelledby="dispute-title" onSubmit={submit} className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <header className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
        <div><h2 id="dispute-title" className="m-0 text-lg font-extrabold text-gray-900">Mở tranh chấp hoàn tiền</h2><p className="mb-0 mt-1 text-xs font-medium text-gray-500">Đơn hàng #{orderCode}</p></div>
        <button type="button" aria-label="Đóng" disabled={loading} onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"><X size={18} /></button>
      </header>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm"><p className="m-0 font-bold text-gray-800">Yêu cầu ban đầu</p><p className="mb-0 mt-1 text-gray-600">{requestReason}</p><p className="mb-0 mt-2 text-xs font-semibold text-amber-900">Phản hồi hiện tại: {sellerOutcome}</p></div>
        <label htmlFor="dispute-reason" className="block text-sm font-bold text-gray-800">Vì sao bạn không đồng ý với kết quả? <span className="text-red-600">*</span></label>
        <textarea id="dispute-reason" autoFocus required minLength={5} maxLength={1500} rows={5} value={reason} onChange={event => { setReason(event.target.value); setValidationError(''); }} placeholder="Mô tả rõ vấn đề còn chưa được giải quyết. Admin sẽ xem nội dung này cùng yêu cầu gốc, bằng chứng và phản hồi của Seller/Printer." className="w-full resize-y rounded-xl border border-gray-300 p-3 text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
        <div className="flex items-center justify-between text-xs text-gray-500"><span>Tối thiểu 5 ký tự · tối đa 1.500</span><span>{reason.length}/1500</span></div>
        {(validationError || error) && <p role="alert" className="m-0 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{validationError || error}</p>}
      </div>
      <footer className="mt-5 flex flex-col-reverse justify-end gap-2 border-t border-gray-100 pt-4 sm:flex-row">
        <button type="button" disabled={loading} onClick={onClose} className="min-h-11 rounded-xl border border-gray-300 px-5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Quay lại</button>
        <button type="submit" disabled={loading} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">{loading ? 'Đang gửi tranh chấp…' : 'Gửi Admin xem xét'}</button>
      </footer>
    </form>
  </div>;
}
