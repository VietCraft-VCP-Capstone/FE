import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { ArrowLeft, CalendarClock, Check, Clock3, FileText, ImagePlus, Loader2, PackageCheck, Scale, ShieldAlert, UploadCloud, Video } from 'lucide-react';
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
  const orderTitle=params.get('title')||''; const orderImage=params.get('image')||''; const orderColor=params.get('color')||''; const orderSize=params.get('size')||'';
  const devExchangeEnabled=import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_RETURN_TOOLS === 'true';
  const reasonOptions=[{code:'R01',label:'In sai, lệch, mờ hoặc sai màu'},{code:'R02',label:'Phôi sản phẩm bị lỗi'},{code:'R03',label:'Giao sai size, màu hoặc số lượng'},{code:'R04',label:'Thiếu sản phẩm trong kiện'},{code:'R05',label:'Sản phẩm hư hỏng khi giao'},{code:'R06',label:'Không nhận được hàng'},{code:'R01A',label:'Vấn đề chất lượng cần kiểm tra'},{code:'R07',label:'Vấn đề kỹ thuật cần xem xét'},{code:'R08',label:'Sai thông tin đơn hàng'},{code:'R09',label:'Vấn đề khác cần hỗ trợ'},{code:'R13',label:'Khác'}];

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
    const remainingHours = request?.deadline_at ? Math.max(0, Math.ceil((new Date(request.deadline_at).getTime() - Date.now()) / 3600000)) : null;
    return <main className="min-h-[70vh] bg-[#f6f8f6] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-emerald-800" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Quay lại</button>
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Hỗ trợ đơn hàng · POD</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Chi tiết yêu cầu</h1><p className="mt-1 text-sm text-slate-600">Theo dõi tiến độ xử lý và trao đổi với đội ngũ hỗ trợ.</p></div>
          {request && <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-900"><span className="h-2 w-2 rounded-full bg-emerald-600" />{labels[request.status || ''] || request.status}</span>}
        </header>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
        {!request ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải yêu cầu…</div> : <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><FileText size={15} /> Mã yêu cầu</div><p className="mt-3 break-all font-mono text-sm font-semibold text-slate-900">{returnService.idOf(request)}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><CalendarClock size={15} /> Hạn xử lý</div><p className="mt-3 text-sm font-semibold text-slate-900">{request.deadline_at ? new Date(request.deadline_at).toLocaleString('vi-VN') : 'Chưa xác định'}</p><p className="mt-1 text-xs text-slate-500">{remainingHours === null ? 'Có thể cần quản trị viên xem xét' : remainingHours > 0 ? `Còn khoảng ${remainingHours} giờ` : 'Đã quá hạn'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><PackageCheck size={15} /> Phương án</div><p className="mt-3 text-sm font-semibold text-slate-900">{request.requested_resolution === 'EXCHANGE' ? 'Đổi hàng' : 'Hoàn tiền'}</p><p className="mt-1 text-xs text-slate-500">Lý do {request.reason_code || '—'} · Số lượng {request.quantity ?? '—'}</p></div>
          </section>
          {(request.linked_refund_status === 'PENDING_INTEGRATION' || request.status === 'CONVERTED_TO_REFUND') && <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><Clock3 className="mt-0.5 shrink-0" size={19} /><div><p className="font-bold">Đã duyệt — tiền chưa được chuyển</p><p className="mt-1 text-sm leading-6">Hồ sơ hoàn tiền đang chờ tích hợp thanh toán (`PENDING_INTEGRATION`). Quyết định duyệt chưa đồng nghĩa giao dịch đã thực hiện.</p></div></section>}
          {request.status === 'APPROVED' && request.requested_resolution === 'EXCHANGE' && <section className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950"><PackageCheck className="mt-0.5 shrink-0" size={19} /><div><p className="font-bold">Yêu cầu đổi hàng đã được duyệt</p><p className="mt-1 text-sm">Demo: chưa có giao hàng thay thế.</p></div></section>}
          <div className="grid items-start gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Clock3 size={19} /></span><div><h2 className="font-bold text-slate-950">Diễn biến</h2><p className="text-xs text-slate-500">Lịch sử cập nhật yêu cầu</p></div></div>
              {(detail?.timeline || []).length ? <ol className="mt-5 space-y-0">{(detail?.timeline || []).map((event: any, index: number) => <li key={event.event_id || index} className="relative flex gap-4 pb-6 last:pb-0"><span className="relative z-10 mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800">{index === 0 ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}{index < (detail?.timeline.length || 0) - 1 && <span className="absolute top-6 h-full w-px bg-slate-200" />}</span><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{labels[event.to_status] || event.to_status || event.reason || 'Cập nhật'}</p><p className="mt-1 text-xs text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString('vi-VN') : ''}</p>{event.reason && <p className="mt-2 text-sm leading-6 text-slate-600">{event.reason}</p>}</div></li>)}</ol> : <p className="py-6 text-sm text-slate-500">Chưa có cập nhật mới.</p>}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><ImagePlus size={19} /></span><div><h2 className="font-bold text-slate-950">Minh chứng</h2><p className="text-xs text-slate-500">Tệp đã gửi cùng yêu cầu</p></div></div>
              <div className="mt-4 flex flex-wrap gap-3">{(detail?.evidence || []).map((item: any) => { const uri = item.storage_ref || item.uri; return item.kind === 'VIDEO' ? <video key={item.evidence_id || uri} src={uri} controls className="max-h-48 w-full rounded-xl bg-slate-950" /> : <a key={item.evidence_id || uri} href={uri} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-slate-200"><img src={uri} alt="Minh chứng đính kèm" className="h-28 w-28 object-cover transition hover:scale-105" /></a>; })}</div>
              {!(detail?.evidence || []).length && <p className="py-6 text-sm text-slate-500">Không có tệp minh chứng.</p>}
            </section>
          </div>
          {request.status === 'REJECTED' && <section className="rounded-2xl border border-rose-200 bg-white p-5 sm:p-6"><div className="flex gap-3"><Scale className="mt-0.5 text-rose-700" size={20} /><div><h2 className="font-bold text-slate-950">Bạn chưa đồng ý với kết quả?</h2><p className="mt-1 text-sm text-slate-600">Gửi lý do để quản trị viên xem xét lại yêu cầu.</p></div></div><label className="mt-4 block text-sm font-semibold text-slate-800">Lý do tranh chấp<textarea className={`${field} min-h-24 rounded-xl border-slate-300`} value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Mô tả ngắn gọn điều bạn muốn được xem xét…" /></label><button disabled={busy || !disputeReason.trim()} onClick={() => void dispute()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"><Scale size={16} />{busy ? 'Đang gửi…' : 'Gửi tranh chấp'}</button></section>}
        </>}
      </div>
    </main>;
  }

  return <main className="min-h-[70vh] bg-[#f6f8f6] px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-4xl space-y-6">
      <button className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-emerald-800" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Quay lại đơn hàng</button>
      <header className="border-b border-slate-200 pb-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Hỗ trợ đơn hàng · POD</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Yêu cầu đổi/trả</h1><p className="mt-1 text-sm text-slate-600">Chia sẻ vấn đề với sản phẩm và đính kèm minh chứng để chúng tôi hỗ trợ.</p></header>
      {!orderItemId && <p role="alert" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert className="mt-0.5 shrink-0" size={18} /><span>Mở biểu mẫu từ một sản phẩm POD đủ điều kiện trong đơn hàng.</span></p>}
      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_280px]">
        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <section><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-900">01</span><div><h2 className="font-bold text-slate-950">Thông tin yêu cầu</h2><p className="mt-1 text-sm text-slate-500">Chọn lý do phù hợp và mô tả tình trạng nhận được.</p></div></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-800">Lý do<select className={`${field} min-h-11 rounded-xl border-slate-300 bg-white`} value={reasonCode} onChange={e => { setReasonCode(e.target.value); if (refundOnly.includes(e.target.value)) setResolution('REFUND'); }}>{reasons.map(code => <option key={code} value={code}>{code}</option>)}</select></label><label className="text-sm font-semibold text-slate-800">Số lượng<input type="number" min={1} max={maxQuantity} required className={`${field} min-h-11 rounded-xl border-slate-300`} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label></div>
            <label className="mt-4 block text-sm font-semibold text-slate-800">Mô tả <span className="text-rose-600">*</span><textarea required minLength={1} maxLength={3000} className={`${field} min-h-28 rounded-xl border-slate-300`} value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Nêu rõ vấn đề bạn gặp phải…" /><span className="mt-1 block text-right text-xs font-normal text-slate-500">{description.length}/3000</span></label>
          </section>
          <section className="border-t border-slate-100 pt-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-900">02</span><div><h2 className="font-bold text-slate-950">Phương án mong muốn</h2><p className="mt-1 text-sm text-slate-500">Tùy lý do, một số phương án có thể không khả dụng.</p></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${resolution === 'REFUND' ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}><input type="radio" name="resolution" className="mt-1 accent-emerald-700" checked={resolution === 'REFUND'} onChange={() => setResolution('REFUND')} /><span><strong className="block text-sm text-slate-900">Hoàn tiền</strong><small className="mt-1 block text-xs leading-5 text-slate-600">Yêu cầu hoàn tiền theo kết quả xử lý.</small></span></label><label className={`flex items-start gap-3 rounded-xl border p-4 transition ${refundOnly.includes(reasonCode) ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60' : resolution === 'EXCHANGE' ? 'cursor-pointer border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500' : 'cursor-pointer border-slate-200 hover:border-slate-300'}`}><input type="radio" name="resolution" disabled={refundOnly.includes(reasonCode)} className="mt-1 accent-emerald-700" checked={resolution === 'EXCHANGE'} onChange={() => setResolution('EXCHANGE')} /><span><strong className="block text-sm text-slate-900">Đổi hàng</strong><small className="mt-1 block text-xs leading-5 text-slate-600">Demo: chưa có giao hàng thay thế.</small></span></label></div>
          </section>
          <section className="border-t border-slate-100 pt-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-900">03</span><div><h2 className="font-bold text-slate-950">Ảnh / video minh chứng <span className="text-rose-600">*</span></h2><p className="mt-1 text-sm text-slate-500">Ít nhất 1 tệp · tối đa 3 ảnh và 1 video.</p></div></div>
            <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-emerald-500 hover:bg-emerald-50/50"><UploadCloud className="mb-2 text-emerald-800" size={24} /><span className="text-sm font-bold text-slate-800">{uploading ? 'Đang tải tệp lên…' : 'Chọn ảnh hoặc video'}</span><span className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, MP4, WebM hoặc MOV</span><input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" disabled={uploading} onChange={e => { void upload(e.target.files); e.target.value = ''; }} /></label>
            {evidence.length > 0 && <ul className="mt-3 space-y-2">{evidence.map(item => <li key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">{item.kind === 'VIDEO' ? <Video size={17} /> : <ImagePlus size={17} />}</span><span className="min-w-0 flex-1"><strong className="block text-xs font-bold text-slate-800">{item.kind === 'VIDEO' ? 'Video minh chứng' : 'Ảnh minh chứng'}</strong><span className="block truncate text-xs text-slate-500">{item.uri}</span></span><Check size={17} className="shrink-0 text-emerald-700" /></li>)}</ul>}
          </section>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Đơn <span className="font-mono text-slate-700">{orderId || '—'}</span> · sản phẩm <span className="font-mono text-slate-700">{orderItemId || '—'}</span></p><button disabled={busy || uploading || !orderItemId || evidence.length === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45">{busy || uploading ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}{busy ? 'Đang gửi…' : uploading ? 'Đang tải…' : 'Gửi yêu cầu'}</button></div>
        </form>
        <aside className="space-y-4 lg:sticky lg:top-6"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold text-slate-900">Trước khi gửi</h2><ul className="mt-3 space-y-3 text-sm leading-5 text-slate-600"><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-700" />Chọn đúng lý do để yêu cầu được phân luồng chính xác.</li><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-700" />Ảnh/video cần thể hiện rõ tình trạng sản phẩm.</li><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-700" />Quyết định duyệt không đồng nghĩa tiền đã chuyển.</li></ul></section><section className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><ShieldAlert className="mt-0.5 shrink-0 text-emerald-800" size={18} /><p>Đây là yêu cầu hỗ trợ cho đơn POD. Trạng thái và hạn xử lý sẽ được cập nhật trong trang chi tiết.</p></section></aside>
      </div>
    </div>
  </main>;
}
