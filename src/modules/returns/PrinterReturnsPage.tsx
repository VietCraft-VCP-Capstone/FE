import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { returnService, type PrinterDecision, type ReturnRequest, type FaultParty } from './services/returnService';

const enabled = import.meta.env.DEV;
const field = 'mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm';
const actions: PrinterDecision['action'][] = ['APPROVE', 'REJECT', 'REQUEST_EVIDENCE', 'PROPOSE_FAULT_CHANGE'];
const actionNames: Record<PrinterDecision['action'], string> = { APPROVE: 'Duyệt', REJECT: 'Từ chối', REQUEST_EVIDENCE: 'Yêu cầu bổ sung minh chứng', PROPOSE_FAULT_CHANGE: 'Đề xuất đổi phân loại' };

export function PrinterReturnsPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [requestId, setRequestId] = useState('');
  const [action, setAction] = useState<PrinterDecision['action']>('APPROVE');
  const [reason, setReason] = useState('');
  const [fault, setFault] = useState<FaultParty>('PRINTER');
  const [classification, setClassification] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [clock, setClock] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setRequests(await returnService.list('PENDING_PRINTER')); }
    catch (e) { setMessage(getApiErrorMessage(e)); }
  };
  useEffect(() => {
    if (!enabled) return;
    void load();
    void returnService.clock().then(value => setClock(value.now)).catch(e => setMessage(getApiErrorMessage(e)));
  }, []);

  const submit = async () => {
    if (!requestId || !reason.trim()) return;
    setBusy(true); setMessage('');
    try {
      const payload: PrinterDecision = { action, reason: reason.trim() };
      if (action === 'PROPOSE_FAULT_CHANGE') {
        if (!evidenceUrl.trim() || !classification.trim()) throw new Error('Cần URL minh chứng đã tải lên và phân loại đề xuất.');
        payload.proposedFault = fault;
        payload.proposedClassification = classification.trim();
        (payload as PrinterDecision & { evidence: Array<{ id: string; kind: 'IMAGE'; uri: string }> }).evidence = [{ id: crypto.randomUUID(), kind: 'IMAGE', uri: evidenceUrl.trim() }];
      }
      await returnService.devPrinterAction(requestId, payload);
      setMessage('Đã gửi thao tác.'); setReason(''); setEvidenceUrl(''); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : getApiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  if (!enabled) return <main className="p-5"><h1 className="text-2xl font-bold">Printer dev tool không bật</h1><p>Chỉ khả dụng ở môi trường phát triển (Vite development).</p></main>;
  return <main className="mx-auto max-w-3xl space-y-4 p-5">
    <h1 className="text-2xl font-bold">Đổi trả POD · Xưởng in (Printer)</h1>
    <section className="rounded-xl border bg-amber-50 p-4 text-sm"><strong>Đồng hồ hiệu lực BE:</strong> {clock ? new Date(clock).toLocaleString('vi-VN') : 'Đang tải…'}<p className="mb-0">Để đổi offset, đặt DEV_CLOCK_OFFSET_HOURS ở BE rồi khởi động lại BE.</p></section>
    {message && <p role="status" className="rounded bg-red-50 p-3 text-sm">{message}</p>}
    <button onClick={() => void load()} className="rounded border px-3 py-2">Tải lại danh sách</button>
    <section className="space-y-4 rounded-xl border bg-white p-5">
      <label className="block text-sm">Yêu cầu đang chờ Printer<select className={field} value={requestId} onChange={e => setRequestId(e.target.value)}><option value="">Chọn yêu cầu</option>{requests.map(item => <option key={returnService.idOf(item)} value={returnService.idOf(item)}>{returnService.idOf(item)} · {item.reason_code} · {item.order_item_id}</option>)}</select></label>
      <label className="block text-sm">Thao tác<select className={field} value={action} onChange={e => setAction(e.target.value as PrinterDecision['action'])}>{actions.map(value => <option key={value} value={value}>{actionNames[value]}</option>)}</select></label>
      <label className="block text-sm">Lý do bắt buộc<textarea className={field} value={reason} onChange={e => setReason(e.target.value)} /></label>
      {action === 'PROPOSE_FAULT_CHANGE' && <>
        <label className="block text-sm">Bên chịu lỗi đề xuất<select className={field} value={fault} onChange={e => setFault(e.target.value as FaultParty)}>{['BUYER', 'SELLER', 'PRINTER', 'CARRIER', 'PLATFORM'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="block text-sm">Phân loại đề xuất<input className={field} value={classification} onChange={e => setClassification(e.target.value)} /></label>
        <label className="block text-sm">URL ảnh đã upload<input className={field} value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="URL từ minh chứng đã upload" /></label>
      </>}
      <button disabled={busy || !requestId || !reason.trim()} onClick={() => void submit()} className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Đang gửi…' : 'Thực hiện bằng vai Printer'}</button>
    </section>
  </main>;
}
