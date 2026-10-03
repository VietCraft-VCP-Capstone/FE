import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { returnService, type ReturnDetail, type ReturnEvidence, type ReturnResolution } from './services/returnService';

const reasons = ['R01', 'R01A', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R13'];
const labels: Record<string, string> = { SUBMITTED: 'Đã gửi', PENDING_PRINTER: 'Chờ xưởng in', PRINTER_PROPOSED_FAULT_CHANGE: 'Chờ quản trị xem đề xuất', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối', DISPUTED: 'Đang tranh chấp', AWAITING_ADMIN_REFUND: 'Chờ quản trị xác nhận hoàn tiền', ADMIN_REJECTED: 'Quản trị từ chối', CONVERTED_TO_REFUND: 'Đã duyệt hoàn tiền', WAITING_BUYER_CHOICE: 'Chờ người mua chọn', WAITING_STOCK: 'Chờ hàng', REPLACEMENT_CREATED: 'Đã tạo đổi hàng', COMPLETED: 'Hoàn tất', EXPIRED: 'Hết hạn', CANCELLED: 'Đã hủy' };
const refundOnly = ['R01A', 'R06', 'R07', 'R08', 'R09'];
const field = 'mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm';
const errorText = (error: unknown) => getApiErrorMessage(error, 'Không thể hoàn tất yêu cầu.');

export function BuyerReturnPage() {
  const { requestId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ReturnDetail | null>(null);
  const [reasonCode, setReasonCode] = useState('R01');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [resolution, setResolution] = useState<ReturnResolution>('EXCHANGE');
  const [evidence, setEvidence] = useState<ReturnEvidence[]>([]);
  const [disputeReason, setDisputeReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const orderId = params.get('orderId') || '';
  const orderItemId = params.get('orderItemId') || '';
  const maxQuantity = Number(params.get('quantity')) || 1;

  const load = async () => {
    if (!requestId) return;
    try { setDetail(await returnService.detail(requestId)); }
    catch (e) { setError(errorText(e)); }
  };
  useEffect(() => { void load(); }, [requestId]);

  const upload = async (files: FileList | null) => {
    const selected = Array.from(files || []);
    if (evidence.length + selected.length > 4 || evidence.filter(x => x.kind === 'IMAGE').length + selected.filter(x => x.type.startsWith('image/')).length > 3 || evidence.filter(x => x.kind === 'VIDEO').length + selected.filter(x => x.type.startsWith('video/')).length > 1) {
      setError('Tối đa 3 ảnh và 1 video.'); return;
    }
    setUploading(true); setError('');
    try {
      const added: ReturnEvidence[] = [];
      for (const file of selected) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error('Chỉ nhận ảnh hoặc video.');
        if ((file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) || (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024)) throw new Error('Ảnh tối đa 10MB, video tối đa 50MB.');
        added.push(await returnService.upload(file));
      }
      setEvidence(current => [...current, ...added]);
    } catch (e) { setError(errorText(e)); }
    finally { setUploading(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!orderId || !orderItemId) { setError('Thiếu mã đơn hoặc mã sản phẩm trong đơn.'); return; }
    if (!description.trim()) { setError('Mô tả là bắt buộc.'); return; }
    if (!evidence.length) { setError('Cần ít nhất một ảnh hoặc video minh chứng.'); return; }
    if (reasonCode === 'R13') { setError('R13 không cho phép chọn phương án đổi/trả trong chính sách hiện tại.'); return; }
    setBusy(true);
    try {
      const created = await returnService.create({ orderId, orderItemId, quantity, reasonCode, description: description.trim(), resolution, evidence });
      navigate(`/returns/${encodeURIComponent(returnService.idOf(created))}`);
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  const dispute = async () => {
    if (!detail || !disputeReason.trim()) return;
    setBusy(true); setError('');
    try { await returnService.dispute(returnService.idOf(detail.request), disputeReason); await load(); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  if (requestId) {
    const request = detail?.request;
    return <main className="mx-auto max-w-3xl space-y-4 p-5">
      <button className="text-sm font-semibold text-emerald-700" onClick={() => navigate(-1)}>← Quay lại</button>
      <h1 className="text-2xl font-bold">Chi tiết yêu cầu đổi/trả</h1>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!request ? <p>Đang tải yêu cầu…</p> : <section className="space-y-4 rounded-xl border bg-white p-5">
        <p><strong>Trạng thái:</strong> {labels[request.status || ''] || request.status}</p>
        <p><strong>Hạn xử lý:</strong> {request.deadline_at ? new Date(request.deadline_at).toLocaleString('vi-VN') : 'Chưa xác định / cần quản trị xem xét'}</p>
        {request.deadline_at && <p><strong>Còn lại:</strong> {Math.max(0, Math.ceil((new Date(request.deadline_at).getTime() - Date.now()) / 3600000))} giờ</p>}
        {request.status === 'APPROVED' && request.requested_resolution === 'EXCHANGE' && <p>Đã duyệt đổi hàng. Demo: chưa có giao hàng thay thế.</p>}
        {(request.linked_refund_status === 'PENDING_INTEGRATION' || request.status === 'CONVERTED_TO_REFUND') && <p className="rounded bg-amber-50 p-3 font-semibold text-amber-900">Chờ tích hợp, tiền chưa được chuyển.</p>}
        <h2 className="font-semibold">Diễn biến</h2><ol className="space-y-2">{(detail.timeline || []).map((event: any, index: number) => <li key={event.event_id || index} className="border-l-2 border-emerald-300 pl-3"><span>{labels[event.to_status] || event.to_status || event.reason}</span><small className="ml-2 text-gray-500">{event.created_at ? new Date(event.created_at).toLocaleString('vi-VN') : ''}</small><p className="text-sm text-gray-600">{event.reason}</p></li>)}</ol>
        <h2 className="font-semibold">Minh chứng</h2><div className="flex flex-wrap gap-3">{(detail.evidence || []).map((item: any) => { const uri = item.storage_ref || item.uri; return item.kind === 'VIDEO' ? <video key={item.evidence_id || uri} src={uri} controls className="max-h-48 max-w-xs" /> : <a key={item.evidence_id || uri} href={uri} target="_blank" rel="noreferrer"><img src={uri} alt="Minh chứng" className="h-24 w-24 rounded object-cover" /></a>; })}</div>
        {request.status === 'REJECTED' && <div className="space-y-2 border-t pt-4"><label className="block text-sm">Lý do tranh chấp<textarea className={field} value={disputeReason} onChange={e => setDisputeReason(e.target.value)} /></label><button disabled={busy || !disputeReason.trim()} onClick={() => void dispute()} className="rounded bg-rose-700 px-4 py-2 text-white">Tranh chấp</button></div>}
      </section>}
    </main>;
  }

  return <main className="mx-auto max-w-3xl p-5">
    <h1 className="text-2xl font-bold">Yêu cầu đổi/trả POD</h1>
    {!orderItemId && <p role="alert" className="my-3 rounded bg-amber-50 p-3 text-amber-900">Mở biểu mẫu từ một sản phẩm POD đủ điều kiện trong đơn hàng.</p>}
    {error && <p role="alert" className="my-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border bg-white p-5">
      <p className="text-sm text-gray-600">Đơn: {orderId || '—'} · Sản phẩm: {orderItemId || '—'}</p>
      <label className="block text-sm">Lý do<select className={field} value={reasonCode} onChange={e => { setReasonCode(e.target.value); if (refundOnly.includes(e.target.value)) setResolution('REFUND'); }}>
        {reasons.map(code => <option key={code} value={code}>{code}</option>)}
      </select></label>
      <label className="block text-sm">Mô tả bắt buộc<textarea required minLength={1} maxLength={3000} className={field} value={description} onChange={e => setDescription(e.target.value)} rows={4} /></label>
      <label className="block text-sm">Số lượng<input type="number" min={1} max={maxQuantity} required className={field} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label>
      <label className="block text-sm">Phương án<select className={field} value={resolution} onChange={e => setResolution(e.target.value as ReturnResolution)}><option value="REFUND">Hoàn tiền</option><option value="EXCHANGE" disabled={refundOnly.includes(reasonCode)}>Đổi hàng</option></select></label>
      {resolution === 'EXCHANGE' && <p className="rounded bg-blue-50 p-3 text-sm text-blue-900">Demo: chưa có giao hàng thay thế.</p>}
      <label className="block text-sm">Ảnh/video minh chứng (ít nhất 1; tối đa 3 ảnh + 1 video)<input className={field} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={e => { void upload(e.target.files); e.target.value = ''; }} /></label>
      <ul className="text-sm">{evidence.map(item => <li key={item.id}>{item.kind}: {item.uri}</li>)}</ul>
      <button disabled={busy || uploading || !orderItemId || evidence.length === 0} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Đang gửi…' : uploading ? 'Đang tải…' : 'Gửi yêu cầu'}</button>
    </form>
  </main>;
}
