import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../infrastructure/api/interceptors';
import { Scale, Store, User, AlertTriangle, Sparkles } from 'lucide-react';
import { returnService, type ReturnDetail, type ReturnRequest, type ReturnResolution, type FaultParty, type DisputeAuditProfile } from './services/returnService';
import { canConfirmReturnRefund, canDecideReturn, canRejectReturn, returnRefundMessage } from './return-workflow-policy';

const statuses = ['', 'PENDING_PRINTER', 'DISPUTED', 'AWAITING_ADMIN_REFUND', 'PRINTER_PROPOSED_FAULT_CHANGE', 'REJECTED', 'APPROVED', 'CONVERTED_TO_REFUND', 'ADMIN_REJECTED', 'COMPLETED'];
const labels: Record<string, string> = {
  SUBMITTED: 'Đã nộp yêu cầu',
  PENDING_PRINTER: 'Chờ xưởng in',
  DISPUTED: 'Đang tranh chấp',
  AWAITING_ADMIN_REFUND: 'Chờ xác nhận hoàn tiền',
  PRINTER_PROPOSED_FAULT_CHANGE: 'Đề xuất phân loại lỗi',
  REJECTED: 'Bị từ chối',
  APPROVED: 'Đã duyệt',
  CONVERTED_TO_REFUND: 'Đã duyệt hoàn tiền',
  ADMIN_REJECTED: 'Quản trị từ chối',
  COMPLETED: 'Hoàn tất',
  WAITING_BUYER_CHOICE: 'Chờ khách chọn',
  WAITING_STOCK: 'Chờ phôi in',
  REPLACEMENT_CREATED: 'Đã tạo đơn in bù 0đ',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
};

const tierLabels: Record<string, string> = {
  TRUSTED: 'Nghệ Nhân Uy Tín',
  NORMAL: 'Gian Hàng Tiêu Chuẩn',
  WARNING: 'Cảnh Báo Rủi Ro',
  RESTRICTED: 'Hạn Chế / Nguy Cơ Cao',
};

const faultPartyLabels: Record<string, string> = {
  PRINTER: 'Xưởng in (Printer)',
  SELLER: 'Người bán (Seller)',
  BUYER: 'Khách mua (Buyer)',
  CARRIER: 'Đơn vị vận chuyển (Carrier)',
  PLATFORM: 'Sàn bảo lãnh (Platform)',
};

const reasonTranslations: Record<string, string> = {
  'Buyer submitted POD return request.': 'Khách hàng gửi yêu cầu đổi/trả sản phẩm POD.',
  'Deadline expired; notify Admin, no automatic decision.': 'Đã hết hạn thời gian; chuyển Quản trị viên phân xử thủ công.',
  'Printer evidence request opened under P16.': 'Xưởng in yêu cầu khách bổ sung thêm video/ảnh minh chứng.',
  'Buyer submitted evidence requested under P16.': 'Khách hàng đã tải lên minh chứng bổ sung.',
};
const translateReason = (r: string) => reasonTranslations[r] || r;

const field = 'mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm';
const pageSize = 20;

export function AdminReturnsPage() {
  const [items, setItems] = useState<ReturnRequest[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [detail, setDetail] = useState<ReturnDetail | null>(null);
  const [auditProfile, setAuditProfile] = useState<DisputeAuditProfile | null>(null);
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
    setSelected(item); setDetail(null); setReason(''); setError(''); setAuditProfile(null);
    const id = returnService.idOf(item);
    void returnService.auditProfile(id).then(setAuditProfile).catch(() => setAuditProfile(null));
    try {
      const request = await refreshDetail(id);
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
      await refreshDetail(id).catch(() => { });
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
      await refreshDetail(id).catch(() => { });
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
    <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold">Đổi trả và hoàn tiền · Quản trị</h1></div>
    <label className="block max-w-xs text-sm">Lọc trạng thái<select className={field} value={status} onChange={e => { setStatus(e.target.value); setPage(1); setSelected(null); setDetail(null); }}>{statuses.map(value => <option key={value} value={value}>{value ? labels[value] || value : 'Tất cả trạng thái'}</option>)}</select></label>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!selected ? <>
      <section className="overflow-x-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Yêu cầu</th><th className="p-3">Đơn / item</th><th className="p-3">Lý do</th><th className="p-3">Trạng thái</th></tr></thead><tbody>{items.map(item => <tr key={returnService.idOf(item)} onClick={() => void select(item)} className="cursor-pointer border-t hover:bg-gray-50"><td className="p-3">{returnService.idOf(item)}</td><td>{item.order_id} / {item.order_item_id}</td><td>{item.reason_code}</td><td>{labels[item.status] || item.status}</td></tr>)}</tbody></table>{loading ? <p role="status" className="p-5 text-gray-500">Đang tải yêu cầu…</p> : !items.length && <p className="p-5 text-gray-500">Không có yêu cầu ở trạng thái này.</p>}</section>
      {totalPages > 1 && <nav aria-label="Trang yêu cầu đổi trả" className="flex items-center justify-end gap-4 text-sm"><button disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang trước</button><span>Trang {page}/{totalPages} · {total} yêu cầu</span><button disabled={loading || page >= totalPages} onClick={() => setPage(current => current + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Trang sau</button></nav>}
    </> : <section className="space-y-4 rounded-xl border bg-white p-5">
      <button disabled={busy} onClick={() => { setSelected(null); setDetail(null); setAuditProfile(null); }} className="text-sm font-semibold text-emerald-700">← Danh sách</button>
      <h2 className="text-lg font-bold">Chi tiết · {returnService.idOf(selected)}</h2>
      {!detail ? <p role="status">Đang tải chi tiết…</p> : <>
        <p>Trạng thái: {labels[detail.request.status] || detail.request.status}</p><p>Lý do: {detail.request.reason_code} — {detail.request.reason_description}</p><p>{detail.request.quantity} sản phẩm · phương án yêu cầu: {detail.request.requested_resolution === 'EXCHANGE' ? 'Đổi hàng (In bù 0đ)' : 'Hoàn tiền'}</p>

        {auditProfile && (
          <div className="my-3 rounded-2xl border border-stone-200 bg-white p-4 text-xs sm:text-sm shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
              <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Scale size={17} className="text-emerald-800" /> Hồ Sơ Đối Soát Tranh Chấp & Căn Cứ Phân Xử
              </h3>
              {auditProfile.shop && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${auditProfile.shop.reputation_tier === 'TRUSTED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  auditProfile.shop.reputation_tier === 'NORMAL' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                    auditProfile.shop.reputation_tier === 'WARNING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                  Phân cấp Shop: {tierLabels[auditProfile.shop.reputation_tier] || auditProfile.shop.reputation_tier}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Box Shop */}
              <div className="rounded-xl bg-stone-50/70 p-3.5 border border-stone-200/80 space-y-1.5">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <Store size={15} className="text-stone-700" /> Người bán: {auditProfile.shop?.shop_name || 'Gian hàng'}
                </p>
                <div className="flex justify-between text-stone-600">
                  <span>Điểm Uy Tín (SRS):</span>
                  <strong className="text-emerald-700 font-jakarta">{auditProfile.shop?.reputation_score ?? 80} / 100</strong>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Chuỗi đơn:</span>
                  <span>{auditProfile.shop?.clean_streak_orders ?? 0} / 10 đơn</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Khiếu nại trong 30 ngày:</span>
                  <span className={auditProfile.shop && auditProfile.shop.dispute_count_30d > 2 ? 'text-rose-600 font-bold' : ''}>
                    {auditProfile.shop?.dispute_count_30d ?? 0} đơn
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Điểm phạt tích lũy:</span>
                  <span className="text-stone-500">{auditProfile.shop?.penalty_points_30d ?? 0} điểm</span>
                </div>
              </div>

              {/* Box Buyer */}
              <div className="rounded-xl bg-stone-50/70 p-3.5 border border-stone-200/80 space-y-1.5">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <User size={15} className="text-stone-700" /> Khách mua hàng
                </p>
                <div className="flex justify-between text-stone-600">
                  <span>Đơn giao thành công:</span>
                  <strong>{auditProfile.buyer.total_delivered_orders} đơn</strong>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Yêu cầu đổi/hoàn:</span>
                  <span>{auditProfile.buyer.total_return_requests} lần</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Tỷ lệ hoàn trả:</span>
                  <span className={auditProfile.buyer.is_flagged_for_abuse ? 'text-rose-600 font-bold' : ''}>
                    {auditProfile.buyer.dispute_rate_pct}%
                  </span>
                </div>
                {auditProfile.buyer.is_flagged_for_abuse && (
                  <p className="mt-1 rounded bg-rose-50 p-2 text-xs text-rose-700 font-medium flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                    <span>
                      {auditProfile.buyer.total_delivered_orders === 0
                        ? 'Cảnh báo: Khách chưa có đơn hoàn tất nhưng đã mở nhiều yêu cầu đổi/hoàn trả.'
                        : 'Cảnh báo: Khách có tỷ lệ hoàn trả bất thường (>25%).'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {auditProfile.shop?.recommendation && (
              <div className="mt-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 text-xs text-emerald-950 flex items-start gap-2">
                <Sparkles size={16} className="text-emerald-700 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Gợi ý phân xử hệ thống: </span>
                  <span>{auditProfile.shop.recommendation}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <h3 className="font-semibold">Diễn biến</h3><ol>{detail.timeline.map((event, i) => <li key={event.event_id || i} className="border-l-2 border-emerald-300 py-1 pl-3">{event.created_at && new Date(event.created_at).toLocaleString('vi-VN')} · {event.from_status ? (labels[event.from_status] || event.from_status) : 'Khởi tạo'} → {labels[event.to_status || ''] || event.to_status} · {translateReason(event.reason)}</li>)}</ol>
        <h3 className="font-semibold">Minh chứng</h3><div className="flex flex-wrap gap-3">{detail.evidence.map(e => e.kind === 'VIDEO' ? <video key={e.evidence_id} src={e.storage_ref} controls className="max-h-48 max-w-xs" /> : <a key={e.evidence_id} href={e.storage_ref} target="_blank" rel="noreferrer"><img src={e.storage_ref} alt="Minh chứng" className="h-24 w-24 rounded object-cover" /></a>)}</div>
        {(canDecide || canConfirm) && <>
          {canDecide && <label className="block text-sm">Quyết định<select disabled={busy} className={field} value={resolution} onChange={e => setResolution(e.target.value as ReturnResolution | 'REJECT')}><option value="REFUND">Hoàn tiền</option>{request && canRejectReturn(request.status) && <><option value="EXCHANGE">Đổi hàng</option><option value="REJECT">Từ chối yêu cầu</option></>}</select></label>}
          {resolution !== 'REJECT' && <>
            <label className="block text-sm">Bên chịu lỗi<select disabled={busy || (!canDecide && savedRefund)} className={field} value={faultParty} onChange={e => setFaultParty(e.target.value as FaultParty)}>{['BUYER', 'SELLER', 'PRINTER', 'CARRIER', 'PLATFORM'].map(x => <option key={x} value={x}>{faultPartyLabels[x] || x}</option>)}</select></label>
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
