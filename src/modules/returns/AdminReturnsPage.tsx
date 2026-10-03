import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { returnService, type ReturnDetail, type ReturnRequest, type ReturnResolution, type FaultParty } from './services/returnService';

const statuses = ['', 'PENDING_PRINTER', 'DISPUTED', 'AWAITING_ADMIN_REFUND', 'PRINTER_PROPOSED_FAULT_CHANGE', 'REJECTED', 'APPROVED', 'CONVERTED_TO_REFUND', 'ADMIN_REJECTED'];
const labels: Record<string, string> = { PENDING_PRINTER: 'Chờ xưởng in', DISPUTED: 'Đang tranh chấp', AWAITING_ADMIN_REFUND: 'Chờ xác nhận hoàn tiền', PRINTER_PROPOSED_FAULT_CHANGE: 'Đề xuất phân loại', REJECTED: 'Bị từ chối', APPROVED: 'Đã duyệt', CONVERTED_TO_REFUND: 'Đã chuyển hồ sơ Refund', ADMIN_REJECTED: 'Quản trị từ chối' };
const field = 'mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm';
const printerToolsEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_RETURN_TOOLS === 'true';

export function AdminReturnsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [detail, setDetail] = useState<ReturnDetail | null>(null);
  const [resolution, setResolution] = useState<ReturnResolution>('REFUND');
  const [faultParty, setFaultParty] = useState<FaultParty>('PRINTER');
  const [reason, setReason] = useState('');
  const [amountMinor, setAmountMinor] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setItems(await returnService.list(status)); setError(''); }
    catch (e) { setError(getApiErrorMessage(e)); }
  };
  useEffect(() => { void load(); }, [status]);
  const select = async (item: ReturnRequest) => {
    setSelected(item); setReason(''); setError('');
    try { setDetail(await returnService.detail(returnService.idOf(item))); }
    catch (e) { setError(getApiErrorMessage(e)); }
  };
  const decide = async () => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      await returnService.adminDecision(returnService.idOf(selected), { resolution, faultParty, reason, amountMinor, currency: 'VND' });
      setSelected(null); setDetail(null); await load();
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  };
  const confirmRefund = async () => {
    if (!selected) return;
    setBusy(true); setError('');
    try {
      await returnService.adminConfirmRefund(returnService.idOf(selected), { amountMinor, currency: 'VND', faultParty });
      await select(selected); await load();
    } catch (e) { setError(getApiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  return <main className="space-y-4 p-5">
    <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">Return v3 · Quản trị</h1>{printerToolsEnabled && <a className="text-emerald-700 underline" href="/admin/returns/printer">Printer dev tool</a>}</div>
    <label className="block max-w-xs text-sm">Lọc trạng thái<select className={field} value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(value => <option key={value} value={value}>{value ? labels[value] || value : 'Tất cả trạng thái'}</option>)}</select></label>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!selected ? <section className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Yêu cầu</th><th className="p-3">Đơn / item</th><th className="p-3">Lý do</th><th className="p-3">Trạng thái</th></tr></thead><tbody>{items.map(item => <tr key={returnService.idOf(item)} onClick={() => void select(item)} className="cursor-pointer border-t hover:bg-gray-50"><td className="p-3">{returnService.idOf(item)}</td><td>{item.order_id} / {item.order_item_id}</td><td>{item.reason_code}</td><td>{labels[item.status || ''] || item.status}</td></tr>)}</tbody></table>{!items.length && <p className="p-5 text-gray-500">Không có yêu cầu ở trạng thái này.</p>}</section> : <section className="space-y-4 rounded-xl border bg-white p-5">
      <button onClick={() => { setSelected(null); setDetail(null); }} className="text-sm font-semibold text-emerald-700">← Danh sách</button>
      <h2 className="text-lg font-bold">Chi tiết · {returnService.idOf(selected)}</h2>
      {detail && <><p>Trạng thái: {labels[detail.request.status || ''] || detail.request.status}</p><p>Lý do: {detail.request.reason_code} — {detail.request.reason_description}</p><p>{detail.request.quantity} sản phẩm · phương án yêu cầu: {detail.request.requested_resolution}</p><h3 className="font-semibold">Timeline</h3><ol>{detail.timeline.map((event: any, i) => <li key={i} className="border-l-2 border-emerald-300 py-1 pl-3">{event.created_at && new Date(event.created_at).toLocaleString('vi-VN')} · {event.from_status || 'Mới'} → {event.to_status} · {event.reason}</li>)}</ol><h3 className="font-semibold">Minh chứng</h3><div className="flex flex-wrap gap-3">{detail.evidence.map((e: any) => { const uri = e.storage_ref || e.uri; return e.kind === 'VIDEO' ? <video key={e.evidence_id || uri} src={uri} controls className="max-h-48 max-w-xs" /> : <a key={e.evidence_id || uri} href={uri} target="_blank" rel="noreferrer"><img src={uri} alt="Minh chứng" className="h-24 w-24 rounded object-cover" /></a>; })}</div></>}
      <label className="block text-sm">Quyết định<select className={field} value={resolution} onChange={e => setResolution(e.target.value as ReturnResolution)}><option value="REFUND">Hoàn tiền</option><option value="EXCHANGE">Đổi hàng (demo)</option></select></label>
      <label className="block text-sm">Bên chịu lỗi<select className={field} value={faultParty} onChange={e => setFaultParty(e.target.value as FaultParty)}>{['BUYER', 'SELLER', 'PRINTER', 'CARRIER', 'PLATFORM'].map(x => <option key={x} value={x}>{x}</option>)}</select></label>
      <label className="block text-sm">Số tiền (đơn vị nhỏ nhất)<input type="number" min={0} className={field} value={amountMinor} onChange={e => setAmountMinor(Number(e.target.value))} /></label>
      <label className="block text-sm">Lý do quyết định<textarea required className={field} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <button disabled={busy || !reason.trim()} onClick={() => void decide()} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">Lưu quyết định</button>
      {selected.status === 'AWAITING_ADMIN_REFUND' && <button disabled={busy} onClick={() => void confirmRefund()} className="ml-2 rounded bg-amber-700 px-4 py-2 text-white disabled:opacity-50">Xác nhận Refund</button>}
      {selected.status === 'CONVERTED_TO_REFUND' && <p className="rounded bg-amber-50 p-3">Chờ tích hợp, tiền chưa được chuyển.</p>}
    </section>}
  </main>;
}
