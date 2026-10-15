import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  PackageCheck,
  Scale,
  ShieldAlert,
  UploadCloud,
  Video,
  X,
  XCircle,
  ZoomIn
} from 'lucide-react';
import { returnService, type ReturnDetail, type ReturnEvidence, type ReturnResolution } from './services/returnService';
import { allowedReturnResolutions, returnRefundMessage } from './return-workflow-policy';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'REJECTED':
    case 'ADMIN_REJECTED':
      return {
        badgeClass: 'border-rose-200 bg-rose-50 text-rose-800',
        dotClass: 'bg-rose-600',
      };
    case 'DISPUTED':
    case 'PRINTER_PROPOSED_FAULT_CHANGE':
      return {
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
        dotClass: 'bg-amber-500',
      };
    case 'PENDING_PRINTER':
      return {
        badgeClass: 'border-blue-200 bg-blue-50 text-blue-900',
        dotClass: 'bg-blue-500',
      };
    case 'APPROVED':
    case 'REPLACEMENT_CREATED':
    case 'COMPLETED':
    case 'CONVERTED_TO_REFUND':
      return {
        badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        dotClass: 'bg-emerald-600',
      };
    default:
      return {
        badgeClass: 'border-slate-200 bg-slate-50 text-slate-800',
        dotClass: 'bg-slate-500',
      };
  }
};

const getTimelineNodeConfig = (toStatus?: string) => {
  switch (toStatus) {
    case 'REJECTED':
    case 'ADMIN_REJECTED':
      return {
        icon: XCircle,
        nodeClass: 'border-rose-300 bg-rose-50 text-rose-600 ring-4 ring-rose-50',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'DISPUTED':
      return {
        icon: Scale,
        nodeClass: 'border-amber-300 bg-amber-50 text-amber-700 ring-4 ring-amber-50',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'PRINTER_PROPOSED_FAULT_CHANGE':
      return {
        icon: Clock3,
        nodeClass: 'border-amber-300 bg-amber-50 text-amber-700 ring-4 ring-amber-50',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'APPROVED':
    case 'REPLACEMENT_CREATED':
    case 'COMPLETED':
    case 'CONVERTED_TO_REFUND':
      return {
        icon: CheckCircle2,
        nodeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-50',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'PENDING_PRINTER':
    case 'SUBMITTED':
    default:
      return {
        icon: Clock3,
        nodeClass: 'border-blue-300 bg-blue-50 text-blue-700 ring-4 ring-blue-50',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      };
  }
};

const translateTimelineReason = (reason?: string) => {
  if (!reason) return '';
  const trimmed = reason.trim();
  if (trimmed === 'Buyer submitted POD return request.') {
    return 'Bạn đã gửi yêu cầu đổi/trả sản phẩm in POD.';
  }
  if (trimmed === 'Printer rejected return request.') {
    return 'Xưởng in đã thẩm định kỹ thuật và từ chối yêu cầu.';
  }
  if (trimmed === 'Buyer disputed rejection.') {
    return 'Bạn đã mở khiếu nại tranh chấp gửi lên Quản trị viên sàn VietCraft.';
  }
  if (trimmed.startsWith('Admin decided: EXCHANGE')) {
    return 'Quản trị viên đã phân xử: Chấp thuận đổi hàng và chỉ định xưởng in ấn bù 0đ.';
  }
  if (trimmed.startsWith('Admin decided: REFUND')) {
    return 'Quản trị viên đã phân xử: Chấp thuận hoàn tiền cho người mua.';
  }
  if (trimmed === 'Admin approved return request.') {
    return 'Quản trị viên đã phê duyệt yêu cầu đổi hàng.';
  }
  if (trimmed === 'Admin rejected dispute.') {
    return 'Quản trị viên đã từ chối yêu cầu khiếu nại tranh chấp.';
  }
  return trimmed;
};

const reasons = [
  { code: 'R01', label: 'In sai, lệch, mờ hoặc sai màu' },
  { code: 'R01A', label: 'Vấn đề chất lượng cần kiểm tra' },
  { code: 'R02', label: 'Phôi sản phẩm bị lỗi' },
  { code: 'R03', label: 'Giao sai size, màu hoặc số lượng' },
  { code: 'R04', label: 'Thiếu sản phẩm trong kiện' },
  { code: 'R05', label: 'Sản phẩm hư hỏng khi giao' },
  { code: 'R06', label: 'Không nhận được hàng' },
  { code: 'R07', label: 'Vấn đề kỹ thuật cần xem xét' },
  { code: 'R08', label: 'Sai thông tin đơn hàng' },
  { code: 'R09', label: 'Vấn đề khác cần hỗ trợ' },
  { code: 'R13', label: 'Cần đội ngũ hỗ trợ phân loại' },
];
const labels: Record<string, string> = { SUBMITTED: 'Đã gửi', PENDING_PRINTER: 'Chờ xưởng in', PRINTER_PROPOSED_FAULT_CHANGE: 'Chờ quản trị xem đề xuất', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối', DISPUTED: 'Đang tranh chấp', AWAITING_ADMIN_REFUND: 'Chờ quản trị xác nhận hoàn tiền', ADMIN_REJECTED: 'Quản trị từ chối', CONVERTED_TO_REFUND: 'Đã duyệt hoàn tiền', WAITING_BUYER_CHOICE: 'Chờ người mua chọn', WAITING_STOCK: 'Chờ hàng', REPLACEMENT_CREATED: 'Đã tạo đơn in bù 0đ', COMPLETED: 'Hoàn tất', EXPIRED: 'Hết hạn', CANCELLED: 'Đã hủy' };
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
  const [resolution, setResolution] = useState<ReturnResolution>('REFUND');
  const [evidence, setEvidence] = useState<ReturnEvidence[]>([]);
  const [disputeReason, setDisputeReason] = useState('');
  const [previewItem, setPreviewItem] = useState<{ uri: string; title: string; kind?: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const orderId = params.get('orderId') || '';
  const orderItemId = params.get('orderItemId') || '';
  const maxQuantity = Number(params.get('quantity')) || 1;
  const orderTitle = params.get('title') || '';
  const orderImage = params.get('image') || '';
  const orderColor = params.get('color') || '';
  const orderSize = params.get('size') || '';
  const backendDeadline = params.get('deadline');
  const allowedReasons = allowedReturnResolutions;
  const resolutionOptions = allowedReasons[reasonCode] || [];

  const load = async () => {
    if (!requestId) return;
    try { setDetail(await returnService.detail(requestId)); }
    catch (e) { setError(errorText(e)); }
  };
  useEffect(() => {
    void load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [requestId]);

  const upload = async (files: FileList | null) => {
    const selected = Array.from(files || []);
    const existing = requestId ? detail?.evidence || [] : [];
    if (existing.length + evidence.length + selected.length > 4 || existing.filter(x => x.kind === 'PHOTO').length + evidence.filter(x => x.kind === 'IMAGE').length + selected.filter(x => x.type.startsWith('image/')).length > 3 || existing.filter(x => x.kind === 'VIDEO').length + evidence.filter(x => x.kind === 'VIDEO').length + selected.filter(x => x.type.startsWith('video/')).length > 1) {
      setError('Mỗi yêu cầu có tối đa 3 ảnh và 1 video, gồm các tệp đã gửi.'); return;
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
    if (description.trim().length < 5) { setError('Mô tả cần ít nhất 5 ký tự.'); return; }
    if (!evidence.length) { setError('Cần ít nhất một ảnh hoặc video minh chứng.'); return; }
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

  const supplementEvidence = async () => {
    if (!detail || !evidence.length || uploading || busy) return;
    setBusy(true); setError('');
    try {
      await returnService.addEvidence(returnService.idOf(detail.request), evidence);
      setEvidence([]);
      await load();
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };

  if (requestId) {
    const request = detail?.request;
    const latestPrinterRejectReason = detail?.timeline?.slice().reverse().find((e: any) => e.to_status === 'REJECTED' && e.reason)?.reason || '';
    const latestDisputeReason = detail?.timeline?.slice().reverse().find((e: any) => e.to_status === 'DISPUTED' && e.reason)?.reason || '';
    const buyerEvidences = (detail?.evidence || []).filter((item: any) => !item.uploaded_by || item.uploaded_by === request?.buyer_id || item.uploaded_by === 'BUYER');
    const partnerEvidences = (detail?.evidence || []).filter((item: any) => item.uploaded_by && item.uploaded_by !== request?.buyer_id && item.uploaded_by !== 'BUYER');

    return <main className="min-h-[70vh] bg-[#f6f8f6] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-emerald-800 cursor-pointer" onClick={() => navigate('/orders?tab=returns')}><ArrowLeft size={17} /> Danh sách đổi/trả & đơn hàng</button>
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Hỗ trợ đơn hàng · POD</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Chi tiết yêu cầu</h1><p className="mt-1 text-sm text-slate-600">Theo dõi tiến độ xử lý và trao đổi với đội ngũ hỗ trợ.</p></div>
          {request && (() => {
            const badge = getStatusBadge(request.status || '');
            return (
              <span className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 text-sm font-bold ${badge.badgeClass}`}>
                <span className={`h-2 w-2 rounded-full ${badge.dotClass}`} />
                {labels[request.status || ''] || request.status}
              </span>
            );
          })()}
        </header>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
        {!request ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải yêu cầu…</div> : <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><FileText size={15} /> Mã yêu cầu</div><p className="mt-3 break-all font-mono text-sm font-semibold text-slate-900">{returnService.idOf(request)}</p></div>
            {request.deadline_at && <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><CalendarClock size={15} /> Hạn xử lý</div><p className="mt-3 text-sm font-semibold text-slate-900">{new Date(request.deadline_at).toLocaleString('vi-VN')}</p></div>}
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><PackageCheck size={15} /> Phương án</div><p className="mt-3 text-sm font-semibold text-slate-900">{request.requested_resolution === 'EXCHANGE' ? 'Đổi hàng' : 'Hoàn tiền'}</p><p className="mt-1 text-xs text-slate-500">Lý do {request.reason_code || '—'} · Số lượng {request.quantity ?? '—'}</p></div>
          </section>

          {/* Product Snapshot & Details Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={(request.item_snapshot as any)?.image || '/image-not-found.jpg'}
                alt={(request.item_snapshot as any)?.title || 'Sản phẩm'}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).src = '/image-not-found.jpg'; }}
              />
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate">
                  {(request.item_snapshot as any)?.title || 'Sản phẩm in ấn theo yêu cầu'}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  {(request.item_snapshot as any)?.color && <span>Màu: <b>{(request.item_snapshot as any).color}</b></span>}
                  {(request.item_snapshot as any)?.size && <span>Size: <b>{(request.item_snapshot as any).size}</b></span>}
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    SL khiếu nại: {request.quantity || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Lý do: <strong className="text-slate-800">{reasons.find(r => r.code === request.reason_code)?.label || request.reason_code}</strong>
                </p>
              </div>
            </div>
            {request.order_id && (
              <button
                type="button"
                onClick={() => navigate(`/orders/${encodeURIComponent(request.order_id)}`)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition border border-emerald-200 flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Xem đơn hàng #{request.order_id}</span>
                <ArrowLeft size={13} className="rotate-180" />
              </button>
            )}
          </section>

          {request.reason_description && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700 leading-relaxed shadow-2xs">
              <span className="font-bold text-slate-900 block mb-1">Mô tả phản ánh của bạn:</span>
              <p className="italic m-0">"{request.reason_description}"</p>
            </div>
          )}

          {/* Alert Banners according to Status */}
          {request.status === 'REJECTED' && (
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-rose-950 shadow-xs">
              <div className="flex items-start gap-3.5">
                <AlertTriangle className="mt-0.5 shrink-0 text-rose-700 bg-rose-200/80 rounded-full p-1.5" size={26} />
                <div className="space-y-1">
                  <p className="font-bold text-base text-rose-950">Yêu cầu đã bị xưởng in từ chối</p>
                  <p className="text-xs text-rose-900 leading-relaxed">
                    {latestPrinterRejectReason ? (
                      <>Lý do từ chối: <strong className="font-semibold text-rose-950">"{latestPrinterRejectReason}"</strong></>
                    ) : (
                      'Xưởng in đã thẩm định và xác nhận sản phẩm không đủ điều kiện đổi hàng/hoàn tiền theo chính sách.'
                    )}
                  </p>
                  <p className="text-xs text-rose-800">
                    Nếu bạn thấy kết quả này chưa thỏa đáng, bạn có thể gửi yêu cầu khiếu nại để Quản trị viên phân xử lại.
                  </p>
                </div>
              </div>
              <a
                href="#dispute-section"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 hover:bg-rose-800 px-5 text-xs font-bold text-white shadow-sm transition flex-shrink-0 cursor-pointer"
              >
                <Scale size={15} />
                <span>Mở tranh chấp</span>
              </a>
            </section>
          )}

          {request.status === 'DISPUTED' && (
            <section className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 sm:p-6 text-amber-950 shadow-xs space-y-3">
              <div className="flex items-start gap-3.5">
                <Scale className="mt-0.5 shrink-0 text-amber-700 bg-amber-200/80 rounded-full p-1.5" size={26} />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-base text-amber-950">Yêu cầu đang được Quản trị viên phân xử tranh chấp</h2>
                    <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900">Đang thụ lý</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Bạn đã gửi khiếu nại phản hồi lại quyết định từ chối của xưởng in. Đội ngũ Quản trị viên sàn VietCraft đang đối soát độc lập các bằng chứng (ảnh/video bạn gửi so với thông số in ấn) để đưa ra phán quyết công bằng nhất.
                  </p>
                </div>
              </div>
              {latestDisputeReason && (
                <div className="rounded-xl border border-amber-200/80 bg-white/80 p-3.5 text-xs text-slate-800">
                  <span className="font-bold text-slate-900 block mb-1">Lý do tranh chấp bạn đã gửi:</span>
                  <p className="italic text-slate-700 m-0">"{latestDisputeReason}"</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-medium text-amber-900 pt-1">
                <Clock3 size={14} className="text-amber-700" />
                <span>Thời gian xử lý dự kiến: trong vòng 24 - 48 giờ làm việc.</span>
              </div>
            </section>
          )}

          {request.status === 'PRINTER_PROPOSED_FAULT_CHANGE' && (
            <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={19} />
              <div>
                <p className="font-bold text-sm">Chờ Quản trị viên xem xét đề xuất từ xưởng in</p>
                <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                  Xưởng in đã phản hồi đề xuất điều chỉnh phân loại lỗi. Ban quản trị đang rà soát hồ sơ và sẽ chốt phương án xử lý cuối cùng sớm nhất.
                </p>
              </div>
            </section>
          )}

          {request.status === 'PENDING_PRINTER' && (
            <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <Clock3 className="mt-0.5 shrink-0 text-amber-600" size={19} />
              <div>
                <p className="font-bold text-sm">Yêu cầu đang chờ xưởng in thẩm định kỹ thuật</p>
                <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                  Đội ngũ kỹ thuật xưởng in đang kiểm tra đối soát ảnh/video minh chứng và thông số kỹ thuật in ấn để phê duyệt đơn in bù hoặc hoàn tiền cho bạn.
                </p>
              </div>
            </section>
          )}

          {request.status === 'CONVERTED_TO_REFUND' && <section className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><Clock3 className="mt-0.5 shrink-0" size={19} /><div><p className="font-bold">Tiến độ hoàn tiền</p><p className="mt-1 text-sm leading-6">{returnRefundMessage(request.linked_refund_status)}</p></div></section>}

          {request.status === 'REPLACEMENT_CREATED' && (
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 text-emerald-950 shadow-xs">
              <div className="flex items-start gap-3.5">
                <Check className="mt-0.5 shrink-0 text-emerald-700 bg-emerald-200/80 rounded-full p-1.5" size={26} />
                <div className="space-y-1">
                  <p className="font-bold text-base text-emerald-950">Đơn in bù 0đ đã được tạo thành công!</p>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    Yêu cầu đổi hàng đã được phê duyệt. Hệ thống đã tự động tạo đơn hàng in bù 0đ mã <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">{request.replacement_order_code || request.replacement_order_id}</strong> và chuyển vào hàng đợi in ấn.
                  </p>
                </div>
              </div>
              {(request.replacement_order_code || request.replacement_order_id) && (
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${encodeURIComponent(request.replacement_order_code || request.replacement_order_id || '')}`)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 px-5 text-xs font-bold text-white shadow-sm transition flex-shrink-0 cursor-pointer"
                >
                  <span>Theo dõi đơn in bù</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </section>
          )}

          {request.status === 'APPROVED' && request.requested_resolution === 'EXCHANGE' && (
            <section className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950 shadow-xs">
              <Check className="mt-0.5 shrink-0 text-emerald-700 bg-emerald-100 rounded-full p-1" size={22} />
              <div className="space-y-1">
                <p className="font-bold text-sm text-emerald-900">Yêu cầu đổi hàng (in bù) đã được phê duyệt thành công</p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Lỗi in ấn đã được xác nhận. Đơn in bù 0đ đã được chấp thuận sản xuất và đưa vào quy trình in lại để giao sản phẩm mới đến bạn.
                </p>
              </div>
            </section>
          )}

          {request.status === 'COMPLETED' && (
            <section className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950 shadow-xs">
              <Check className="mt-0.5 shrink-0 text-emerald-700 bg-emerald-100 rounded-full p-1" size={22} />
              <div className="space-y-1">
                <p className="font-bold text-sm text-emerald-900">Yêu cầu đã được xử lý hoàn tất</p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {request.final_resolution === 'REFUND' || request.requested_resolution === 'REFUND'
                    ? returnRefundMessage(request.linked_refund_status)
                    : 'Đơn hàng in bù thay thế đã được giao thành công đến bạn.'}
                </p>
              </div>
            </section>
          )}

          <div className="grid items-stretch gap-6 md:grid-cols-2">
            {/* Timeline Card */}
            <section className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 min-h-[58px]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                  <Clock3 size={19} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-950">Diễn biến</h2>
                  <p className="text-xs text-slate-500">Lịch sử cập nhật yêu cầu</p>
                </div>
              </div>

              <div className="flex-1 mt-5">
                {(detail?.timeline || []).length ? (
                  <ol className="relative space-y-0">
                    {(detail?.timeline || []).map((event: any, index: number) => {
                      const nodeConfig = getTimelineNodeConfig(event.to_status);
                      const NodeIcon = nodeConfig.icon;
                      const isLast = index === (detail?.timeline.length || 0) - 1;

                      return (
                        <li key={event.event_id || index} className="relative flex gap-3.5 pb-6 last:pb-0">
                          <div className="relative flex flex-col items-center">
                            <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${nodeConfig.nodeClass}`}>
                              <NodeIcon size={14} />
                            </span>
                            {!isLast && (
                              <span className="absolute top-7 bottom-0 w-0.5 bg-slate-200" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex flex-wrap items-baseline gap-2">
                              <p className="text-sm font-bold text-slate-900">
                                {labels[event.to_status] || event.to_status || 'Cập nhật'}
                              </p>
                              {event.created_at && (
                                <span className="text-xs text-slate-400">
                                  {new Date(event.created_at).toLocaleString('vi-VN')}
                                </span>
                              )}
                            </div>
                            {event.reason && (
                              <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-700">
                                {translateTimelineReason(event.reason)}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-slate-400">
                    Chưa có cập nhật mới.
                  </div>
                )}
              </div>
            </section>

            {/* Evidence Profile Card */}
            <section className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 min-h-[58px]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <ImagePlus size={19} />
                </span>
                <div>
                  <h2 className="font-bold text-slate-950">Hồ sơ minh chứng</h2>
                  <p className="text-xs text-slate-500">Ảnh và video đối soát</p>
                </div>
              </div>

              <div className="flex-1 mt-5 space-y-5">
                {/* Minh chứng Buyer gửi */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Minh chứng bạn đã cung cấp ({buyerEvidences.length})
                    </p>
                    <span className="text-[11px] text-slate-400">Từ người mua</span>
                  </div>
                  {buyerEvidences.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {buyerEvidences.map((item: any, idx: number) => {
                        const uri = item.storage_ref || item.uri;
                        const isVideo = item.kind === 'VIDEO';
                        return (
                          <div
                            key={item.evidence_id || uri || idx}
                            onClick={() => setPreviewItem({ uri, title: `Minh chứng bạn đã cung cấp #${idx + 1}`, kind: item.kind })}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 cursor-pointer shadow-xs transition hover:border-emerald-500 hover:shadow-md"
                          >
                            {isVideo ? (
                              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                                <Video size={24} className="opacity-80 group-hover:scale-110 transition" />
                              </div>
                            ) : (
                              <img
                                src={uri}
                                alt="Minh chứng bạn đã cung cấp"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-xs transition duration-200 group-hover:opacity-100">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm">
                                <ZoomIn size={16} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400 italic">
                      Chưa có tệp từ người mua.
                    </div>
                  )}
                </div>

                {/* Minh chứng Xưởng in đối chiếu gửi lên */}
                {partnerEvidences.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <div className="mb-2.5 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-600" />
                        Ảnh đối chiếu từ xưởng in ({partnerEvidences.length})
                      </p>
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                        Đối chiếu xưởng
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {partnerEvidences.map((item: any, idx: number) => {
                        const uri = item.storage_ref || item.uri;
                        const isVideo = item.kind === 'VIDEO';
                        return (
                          <div
                            key={item.evidence_id || uri || idx}
                            onClick={() => setPreviewItem({ uri, title: `Ảnh đối chiếu từ xưởng in #${idx + 1}`, kind: item.kind })}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-amber-300 ring-2 ring-amber-100 bg-slate-50 cursor-pointer shadow-xs transition hover:border-amber-500 hover:ring-amber-200 hover:shadow-md"
                          >
                            {isVideo ? (
                              <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                                <Video size={24} className="opacity-80 group-hover:scale-110 transition" />
                              </div>
                            ) : (
                              <img
                                src={uri}
                                alt="Ảnh đối chiếu từ xưởng in"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 backdrop-blur-xs transition duration-200 group-hover:opacity-100">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm">
                                <ZoomIn size={16} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {request.status === 'PENDING_PRINTER' && request.evidence_requested_at && request.evidence_deadline_at && !request.buyer_evidence_submitted_at && (
            <section className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 sm:p-6">
              <div><h2 className="font-bold text-slate-950">Bổ sung minh chứng theo yêu cầu xưởng in</h2><p className="mt-1 text-sm text-slate-600">Gửi một lần trước {new Date(request.evidence_deadline_at).toLocaleString('vi-VN')}. Tổng minh chứng của yêu cầu tối đa 3 ảnh và 1 video.</p></div>
              <input aria-label="Chọn minh chứng bổ sung" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" disabled={uploading || busy} onChange={event => { void upload(event.target.files); event.target.value = ''; }} />
              {evidence.length > 0 && <ul className="space-y-2">{evidence.map(item => <li key={item.id} className="flex items-center justify-between gap-3 text-sm"><a href={item.uri} target="_blank" rel="noreferrer" className="truncate text-emerald-800 underline">{item.kind === 'VIDEO' ? 'Video bổ sung' : 'Ảnh bổ sung'}</a><button type="button" disabled={busy || uploading} onClick={() => setEvidence(current => current.filter(entry => entry.id !== item.id))} className="text-rose-700">Xóa</button></li>)}</ul>}
              <button type="button" disabled={busy || uploading || !evidence.length} onClick={() => void supplementEvidence()} className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{uploading ? 'Đang tải tệp…' : busy ? 'Đang gửi…' : 'Gửi minh chứng bổ sung'}</button>
            </section>
          )}

          {/* Dispute Section */}
          {request.status === 'REJECTED' && (
            <section id="dispute-section" className="rounded-2xl border border-rose-200 bg-white p-5 sm:p-6 scroll-mt-6">
              <div className="flex gap-3">
                <Scale className="mt-0.5 text-rose-700" size={20} />
                <div>
                  <h2 className="font-bold text-slate-950">Bạn chưa đồng ý với kết quả?</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Gửi khiếu nại để Quản trị viên sàn VietCraft phân xử lại độc lập giữa bạn và xưởng in.
                  </p>
                </div>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-800">
                Lý do tranh chấp
                <textarea
                  className={`${field} min-h-24 rounded-xl border-slate-300`}
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder="Mô tả cụ thể vì sao bạn không đồng ý với lý do từ chối của xưởng in…"
                />
              </label>
              <button
                disabled={busy || !disputeReason.trim()}
                onClick={() => void dispute()}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-5 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <Scale size={16} />
                {busy ? 'Đang gửi…' : 'Gửi tranh chấp cho Quản trị viên'}
              </button>
            </section>
          )}

          {/* Lightbox Preview Modal */}
          {previewItem && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
              onClick={() => setPreviewItem(null)}
            >
              <div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{previewItem.title}</h3>
                  <div className="flex items-center gap-2">
                    <a
                      href={previewItem.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <ExternalLink size={14} /> Mở tab mới
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewItem(null)}
                      className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex max-h-[75vh] items-center justify-center bg-slate-950/5 p-4">
                  {previewItem.kind === 'VIDEO' ? (
                    <video src={previewItem.uri} controls autoPlay className="max-h-[70vh] max-w-full rounded-xl" />
                  ) : (
                    <img src={previewItem.uri} alt={previewItem.title} className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-sm" />
                  )}
                </div>
              </div>
            </div>
          )}
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
      {orderTitle && <section className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"><img src={orderImage || '/image-not-found.jpg'} alt={orderTitle} className="h-16 w-16 rounded-xl object-cover" /><div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-900">{orderTitle}</h2><p className="mt-1 text-xs text-slate-500">{orderColor}{orderSize ? ` · ${orderSize}` : ''} · Số lượng tối đa {maxQuantity}</p>{backendDeadline && <p className="mt-1 text-xs text-slate-500">Gửi yêu cầu trước {new Date(backendDeadline).toLocaleString('vi-VN')}</p>}</div></section>}
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_280px]">
        <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <section><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-900">01</span><div><h2 className="font-bold text-slate-950">Thông tin yêu cầu</h2><p className="mt-1 text-sm text-slate-500">Chọn lý do phù hợp và mô tả tình trạng nhận được.</p></div></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-800">Lý do<select className={`${field} min-h-11 rounded-xl border-slate-300 bg-white`} value={reasonCode} onChange={e => { const nextReason = e.target.value; setReasonCode(nextReason); const nextOptions = allowedReasons[nextReason] || []; if (nextOptions.length && !nextOptions.includes(resolution)) setResolution(nextOptions[0]); if (!nextOptions.length) setResolution('REFUND'); }}>{reasons.map(reason => <option key={reason.code} value={reason.code} disabled={!allowedReasons[reason.code]?.length}>{reason.label}{!allowedReasons[reason.code]?.length ? " (chưa hỗ trợ)" : ""}</option>)}</select></label><label className="text-sm font-semibold text-slate-800">Số lượng<input type="number" min={1} max={maxQuantity} required className={`${field} min-h-11 rounded-xl border-slate-300`} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label></div>
            <label className="mt-4 block text-sm font-semibold text-slate-800">Mô tả <span className="text-rose-600">*</span><textarea required minLength={5} maxLength={3000} className={`${field} min-h-28 rounded-xl border-slate-300`} value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Nêu rõ vấn đề bạn gặp phải…" /><span className="mt-1 block text-right text-xs font-normal text-slate-500">{description.length}/3000</span></label>
          </section>
          <section className="border-t border-slate-100 pt-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-900">02</span><div><h2 className="font-bold text-slate-950">Phương án mong muốn</h2><p className="mt-1 text-sm text-slate-500">Tùy lý do, một số phương án có thể không khả dụng.</p></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${resolution === 'REFUND' ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}><input type="radio" name="resolution" disabled={!resolutionOptions.includes('REFUND')} className="mt-1 accent-emerald-700 disabled:cursor-not-allowed" checked={resolution === 'REFUND'} onChange={() => setResolution('REFUND')} /><span><strong className="block text-sm text-slate-900">Hoàn tiền</strong><small className="mt-1 block text-xs leading-5 text-slate-600">Yêu cầu hoàn tiền theo kết quả xử lý.</small></span></label><label className={`flex items-start gap-3 rounded-xl border p-4 transition ${!resolutionOptions.includes('EXCHANGE') ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60' : resolution === 'EXCHANGE' ? 'cursor-pointer border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500' : 'cursor-pointer border-slate-200 hover:border-slate-300'}`}><input type="radio" name="resolution" disabled={!resolutionOptions.includes('EXCHANGE')} className="mt-1 accent-emerald-700" checked={resolution === 'EXCHANGE'} onChange={() => setResolution('EXCHANGE')} /><span><strong className="block text-sm text-slate-900">Đổi hàng</strong><small className="mt-1 block text-xs leading-5 text-slate-600">Áp dụng cho sản phẩm in ấn bị lỗi kỹ thuật.</small></span></label></div>
          </section>
          <section className="border-t border-slate-100 pt-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-extrabold text-emerald-900">03</span><div><h2 className="font-bold text-slate-950">Ảnh / video minh chứng <span className="text-rose-600">*</span></h2><p className="mt-1 text-sm text-slate-500">Ít nhất 1 tệp · tối đa 3 ảnh và 1 video.</p></div></div>
            <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-emerald-500 hover:bg-emerald-50/50"><UploadCloud className="mb-2 text-emerald-800" size={24} /><span className="text-sm font-bold text-slate-800">{uploading ? 'Đang tải tệp lên…' : 'Chọn ảnh hoặc video'}</span><span className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, MP4, WebM hoặc MOV</span><input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" disabled={uploading} onChange={e => { void upload(e.target.files); e.target.value = ''; }} /></label>
            {evidence.length > 0 && <ul className="mt-3 space-y-2">{evidence.map(item => <li key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">{item.kind === 'VIDEO' ? <Video size={17} /> : <ImagePlus size={17} />}</span><span className="min-w-0 flex-1"><strong className="block text-xs font-bold text-slate-800">{item.kind === 'VIDEO' ? 'Video minh chứng' : 'Ảnh minh chứng'}</strong><span className="block truncate text-xs text-slate-500">{item.uri}</span></span><Check size={17} className="shrink-0 text-emerald-700" /></li>)}</ul>}
          </section>
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Đơn <span className="font-mono text-slate-700">{orderId || '—'}</span> · sản phẩm <span className="font-mono text-slate-700">{orderItemId || '—'}</span></p><button disabled={busy || uploading || !orderItemId || evidence.length === 0 || !resolutionOptions.includes(resolution)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45">{busy || uploading ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}{busy ? 'Đang gửi…' : uploading ? 'Đang tải…' : 'Gửi yêu cầu'}</button></div>
        </form>
        <aside className="space-y-4 lg:sticky lg:top-6"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-bold text-slate-900">Trước khi gửi</h2><ul className="mt-3 space-y-3 text-sm leading-5 text-slate-600"><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-700" />Chọn đúng lý do để yêu cầu được phân luồng chính xác.</li><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-700" />Ảnh/video cần thể hiện rõ tình trạng sản phẩm.</li><li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-700" />Quyết định duyệt không đồng nghĩa tiền đã chuyển.</li></ul></section><section className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><ShieldAlert className="mt-0.5 shrink-0 text-emerald-800" size={18} /><p>Đây là yêu cầu hỗ trợ cho đơn POD. Trạng thái và hạn xử lý sẽ được cập nhật trong trang chi tiết.</p></section></aside>
      </div>
    </div>
  </main>;
}
