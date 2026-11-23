import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { ordersService } from '../../order/services/ordersService';
import type { RefundBankInfo } from '../../order/services/refundService';
import { EMPTY_BANK_INFO, RefundBankFields, isValidBankInfo } from '../../buyer/components/refund/RefundBankFields';
import { returnService } from '../services/returnService';

export function useCodOrder(orderId: string) {
  const [cod, setCod] = useState(false);
  useEffect(() => {
    if (!orderId) return;
    ordersService.getById(orderId).then((res: any) => {
      const order = res?.data ?? res;
      setCod(String(order?.paymentMethod ?? order?.payment_method ?? '').toUpperCase() === 'COD');
    }).catch(() => setCod(false));
  }, [orderId]);
  return cod;
}

/** Buyer xem/cập nhật tài khoản nhận tiền hoàn cho đơn COD khi yêu cầu được hoàn tiền. */
export function ReturnBankCard({ request, onSaved }: { request: any; onSaved: () => Promise<void> }) {
  const cod = useCodOrder(request.order_id);
  const [editing, setEditing] = useState(false);
  const [bank, setBank] = useState<RefundBankInfo>(request.refund_bank_info || EMPTY_BANK_INFO);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRefund = (request.final_resolution || request.requested_resolution) === 'REFUND';
  if (!cod || !isRefund) return null;
  const saved = request.refund_bank_info;
  const locked = request.linked_refund_status === 'REFUNDED';
  const save = async () => {
    setBusy(true); setError('');
    try { await returnService.updateBankInfo(returnService.idOf(request), bank); setEditing(false); await onSaved(); }
    catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  };
  if (saved && !editing) return <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
    <p className="font-bold text-slate-900">Tài khoản nhận tiền hoàn</p>
    <p className="mt-1 text-slate-700">{saved.bank_name} · {saved.account_holder} · <span className="tabular-nums">{saved.account_number}</span></p>
    {!locked && <button type="button" onClick={() => setEditing(true)} className="mt-2 text-xs font-bold text-emerald-800 underline">Đổi tài khoản</button>}
  </section>;
  if (locked) return null;
  return <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
    <RefundBankFields value={bank} onChange={setBank} />
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <button type="button" disabled={busy || !isValidBankInfo(bank)} onClick={() => void save()} className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Lưu tài khoản</button>
  </section>;
}
