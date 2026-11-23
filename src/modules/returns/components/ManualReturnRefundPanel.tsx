import { useState } from 'react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { returnService, type ReturnBankInfo } from '../services/returnService';

const VALID_REF = /^[A-Za-z0-9-]{6,40}$/;

export function ManualReturnRefundPanel({ requestId, amount, bank, onDone }: { requestId: string; amount?: number | null; bank?: ReturnBankInfo | null; onDone: () => Promise<void> }) {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true); setError('');
    try { await returnService.adminManualRefund(requestId, reference.trim(), note.trim()); await onDone(); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  };
  return <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
    <p className="font-semibold">Hoàn thủ công {amount ? `${amount.toLocaleString('vi-VN')}đ` : ''}</p>
    {bank
      ? <p>Chuyển khoản tới <b>{bank.bank_name}</b> · {bank.account_holder} · <b className="tabular-nums">{bank.account_number}</b>, rồi nhập mã giao dịch ngân hàng.</p>
      : <p>Khách chưa cung cấp tài khoản nhận tiền. Liên hệ khách hoặc chờ khách bổ sung trên trang yêu cầu.</p>}
    <input maxLength={40} disabled={busy} value={reference} onChange={e => setReference(e.target.value)} placeholder="Mã giao dịch" className="w-full rounded border p-2" />
    <p className="text-xs text-slate-500">6–40 ký tự chữ, số hoặc dấu gạch ngang. Mỗi mã chỉ dùng một lần.</p>
    <input disabled={busy} value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" className="w-full rounded border p-2" />
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button disabled={busy || !VALID_REF.test(reference.trim())} onClick={() => void submit()} className="rounded bg-amber-700 px-4 py-2 text-white disabled:opacity-50">Xác nhận đã chuyển khoản</button>
  </section>;
}
