import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { returnService, type ReturnDetail, type ReturnRequest, type ReturnResolution, type FaultParty } from './services/returnService';
import { canConfirmReturnRefund, canDecideReturn, canRejectReturn, returnRefundMessage } from './return-workflow-policy';

const statuses = ['', 'PENDING_PRINTER', 'DISPUTED', 'AWAITING_ADMIN_REFUND', 'PRINTER_PROPOSED_FAULT_CHANGE', 'REJECTED', 'APPROVED', 'CONVERTED_TO_REFUND', 'ADMIN_REJECTED', 'COMPLETED'];
const labels: Record<string, string> = { PENDING_PRINTER: 'Chờ xưởng in', DISPUTED: 'Đang tranh chấp', AWAITING_ADMIN_REFUND: 'Chờ xác nhận hoàn tiền', PRINTER_PROPOSED_FAULT_CHANGE: 'Đề xuất phân loại', REJECTED: 'Bị từ chối', APPROVED: 'Đã duyệt', CONVERTED_TO_REFUND: 'Đã duyệt hoàn tiền', ADMIN_REJECTED: 'Quản trị từ chối', COMPLETED: 'Hoàn tất' };
const field = 'mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm';
const printerToolsEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_RETURN_TOOLS === 'true';
const pageSize = 20;

export function AdminReturnsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [detail, setDetail] = useState<ReturnDetail | null>(null);
  const [resolution, setResolution] = useState<ReturnResolution | 'REJECT'>('REFUND');
  const [faultParty, setFaultParty] = useState<FaultParty>('PRINTER');
  const [reason, setReason] = useState('');
  const [amountMinor, setAmountMinor] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const result = await returnService.listPage(status, page, pageSize);
    setItems(result.items); setTotal(result.total);
  };
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    void returnService.listPage(status, page, pageSize).then(result => {
      if (!cancelled) { setItems(result.items); setTotal(result.total); }
    }).catch(e => { if (!cancelled) setError(getApiErrorMessage(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [status, page]);

  const refreshDetail = async (id: string) => {
    const next = await returnService.detail(id);
    setSelected(next.request); setDetail(next);
    if (next.request.refund_amount_minor != null) setAmountMinor(next.request.refund_amount_minor);
    if (next.request.fault_party) setFaultParty(next.request.fault_party);
    return next.request;
  };
  const select = async (item: ReturnRequest) => {
    setSelected(item); setDetail(null); setReason(''); setError('');
    try {
      const request = await refreshDetail(returnService.idOf(item));
      setResolution('REFUND');
      setFaultParty(request.fault_party || 'PRINTER');
      const price = Number(request.item_snapshot.unit_price ?? request.item_snapshot.price ?? request.item_snapshot.retail_price ?? 0);
      setAmountMinor(request.refund_amount_minor ?? price * request.quantity);
    } catch (e) { setError(getApiErrorMessage(e)); }
  };
  const decide = async () => {
    if (!selected || busy) return;
    const id = returnService.idOf(selected);
    setBusy(true); setError('');
    try {
      await returnService.adminDecision(id, {
        resolution: resolution === 'REJECT' ? null : resolution,
        faultParty: resolution === 'REJECT' ? null : faultParty,
        reason: reason.trim(),
        ...(resolution === 'REFUND' ? { amountMinor, currency: 'VND' } : {}),
      });
      await refreshDetail(id); await load();
    } catch (e) {
      await refreshDetail(id).catch(() => {});
      setError(getApiErrorMessage(e));
    } finally { setBusy(false); }
  };
  const confirmRefund = async () => {
    if (!selected || busy) return;
    const id = returnService.idOf(selected);
    setBusy(true); setError('');
    try {
      await returnService.adminConfirmRefund(id, {
        amountMinor: selected.refund_amount_minor ?? amountMinor,
        currency: selected.refund_currency || 'VND',
        faultParty: selected.fault_party || faultParty,
      });
      await refreshDetail(id); await load();
    } catch (e) {
      await refreshDetail(id).catch(() => {});
      setError(getApiErrorMessage(e));
    } finally { setBusy(false); }
  };
  const request = detail?.request;
  const canDecide = !!request && canDecideReturn(request.status);
  const canConfirm = !!request && canConfirmReturnRefund(request.status, request.linked_refund_status);
  const amountValid = Number.isSafeInteger(amountMinor) && amountMinor > 0;
  const savedRefund = request?.refund_amount_minor != null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return <main className="space-y-4 p-5">
    <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">Đổi trả và hoàn tiền · Quản trị</h1>{printerToolsEnabled && <a className="text-emerald-700 underline" href="/admin/returns/printer">Printer dev tool</a>}</div>
    <label className="block max-w-xs text-sm">Lọc trạng thái<select className={field} value={status} onChange={e => { setStatus(e.target.value); setPage(1); setSelected(null); setDetail(null); }}>{statuses.map(value => <option key={value} value={value}>{value ? labels[value] || value : 'Tất cả trạng thái'}</option>)}</select></label>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!selected ? <>
      <section className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Yêu cầu</th><th className="p-3">Đơn / item</th><th className="p-3">Lý do</th><th className="p-3">Trạng thái</th></tr></thead><tbody>{items.map(item => <tr key={returnService.idOf(item)} onClick={() => void select(item)} className="cursor-pointer border-t hover:bg-gray-50"><td className="p-3">{returnService.idOf(item)}</td><td>{item.order_id} / {item.order_item_id}</td><td>{item.reason_code}</td><td>{labels[item.status] || item.status}</td></tr>)}</tbody></table>{loading ? <p role="status" className="p-5 text-gray-500">Đang tải yêu cầu…</p> : !items.length && <p className="p-5 text-gray-500">Không có yêu cầu ở trạng thái này.</p>}</section>
      {totalPages > 1 && <nav aria-label="Trang yêu cầu đổi trả" className="flex items-center justify-end gap-4 text-sm"><button disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang trước</button><span>Trang {page}/{totalPages} · {total} yêu cầu</span><button disabled={loading || page >= totalPages} onClick={() => setPage(current => current + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang sau</button></nav>}
    </> : <section className="space-y-4 rounded-xl border bg-white p-5">
      <button disabled={busy} onClick={() => { setSelected(null); setDetail(null); }} className="text-sm font-semibold text-emerald-700">← Danh sách</button>
      <h2 className="text-lg font-bold">Chi tiết · {returnService.idOf(selected)}</h2>
      {!detail ? <p role="status">Đang tải chi tiết…</p> : <>
        <p>Trạng thái: {labels[detail.request.status] || detail.request.status}</p><p>Lý do: {detail.request.reason_code} — {detail.request.reason_description}</p><p>{detail.request.quantity} sản phẩm · phương án yêu cầu: {detail.request.requested_resolution}</p>
        <h3 className="font-semibold">Diễn biến</h3><ol>{detail.timeline.map((event, i) => <li key={event.event_id || i} className="border-l-2 border-emerald-300 py-1 pl-3">{event.created_at && new Date(event.created_at).toLocaleString('vi-VN')} · {event.from_status || 'Mới'} → {event.to_status} · {event.reason}</li>)}</ol>
        <h3 className="font-semibold">Minh chứng</h3><div className="flex flex-wrap gap-3">{detail.evidence.map(e => e.kind === 'VIDEO' ? <video key={e.evidence_id} src={e.storage_ref} controls className="max-h-48 max-w-xs" /> : <a key={e.evidence_id} href={e.storage_ref} target="_blank" rel="noreferrer"><img src={e.storage_ref} alt="Minh chứng" className="h-24 w-24 rounded object-cover" /></a>)}</div>
        {(canDecide || canConfirm) && <>
          {canDecide && <label className="block text-sm">Quyết định<select disabled={busy} className={field} value={resolution} onChange={e => setResolution(e.target.value as ReturnResolution | 'REJECT')}><option value="REFUND">Hoàn tiền</option>{request && canRejectReturn(request.status) && <><option value="EXCHANGE">Đổi hàng</option><option value="REJECT">Từ chối yêu cầu</option></>}</select></label>}
          {resolution !== 'REJECT' && <>
            <label className="block text-sm">Bên chịu lỗi<select disabled={busy || (!canDecide && savedRefund)} className={field} value={faultParty} onChange={e => setFaultParty(e.target.value as FaultParty)}>{['BUYER', 'SELLER', 'PRINTER', 'CARRIER', 'PLATFORM'].map(x => <option key={x} value={x}>{x}</option>)}</select></label>
            {(resolution === 'REFUND' || canConfirm) && <label className="block text-sm">Số tiền hoàn (VND)<input type="number" min={1} step={1} disabled={busy || (!canDecide && savedRefund)} className={field} value={amountMinor} onChange={e => setAmountMinor(Number(e.target.value))} /></label>}
          </>}
          {canDecide && <><label className="block text-sm">Lý do quyết định<textarea required disabled={busy} className={field} value={reason} onChange={e => setReason(e.target.value)} /></label><button disabled={busy || !reason.trim() || (resolution === 'REFUND' && !amountValid)} onClick={() => void decide()} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Lưu quyết định</button></>}
          {canConfirm && <button disabled={busy || (!savedRefund && !amountValid)} onClick={() => void confirmRefund()} className="rounded bg-amber-700 px-4 py-2 text-white disabled:opacity-50">{request?.linked_refund_status === 'PENDING' ? 'Kiểm tra kết quả hoàn tiền' : request?.linked_refund_status === 'FAILED' ? 'Thử lại hoàn tiền' : 'Xác nhận hoàn tiền'}</button>}
        </>}
        {(request?.status === 'CONVERTED_TO_REFUND' || request?.linked_refund_status) && <p role="status" className="rounded bg-amber-50 p-3">{returnRefundMessage(request.linked_refund_status)}{request.linked_refund_status === 'PENDING_INTEGRATION' && ' Phương thức thanh toán này chưa hỗ trợ hoàn tiền tự động; liên hệ bộ phận thanh toán để xử lý.'}</p>}
      </>}
    </section>}
  </main>;
}
