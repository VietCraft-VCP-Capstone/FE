

import { useState } from 'react';
import { ExternalLink, Package, X, Printer, Loader2, CheckCircle2 } from 'lucide-react';

import { ModalOverlay } from '../../../../shared/components/ModalOverlay';
import { count as fmtCount, dateTime, money } from '../../../../shared/utils/format';
import type { SellerOrder } from '../../types/order';
import type { StatusAction } from './orderStatusMeta';
import { CARRIER_LABEL, NEXT_ACTIONS, PAYMENT_LABEL, PAYMENT_STATUS_LABEL, STATUS_META } from './orderStatusMeta';
import { DetailRow, ItemThumb, StatusBadge } from './SellerOrdersUi';
import { sellerOrdersService } from '../../services/sellerOrdersService';

const SECTION_TITLE = 'm-0 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500';

export function OrderDetailModal({
  order,
  loading = false,
  onClose,
  onAction,
  onRefresh,
}: {
  order: SellerOrder | null;
  loading?: boolean;
  onClose: () => void;
  onAction: (action: StatusAction) => void;
  onRefresh?: () => void;
}) {
  const [dispatchingPrinter, setDispatchingPrinter] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [printerMsg, setPrinterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!order) return null;

  const f = order.financials;
  const buyerPaid = f.subtotal + f.shippingFee - f.discount;
  const actions = NEXT_ACTIONS[order.status] || [];
  const hasDesign = order.items.some(it => it.designFileUrl);
  const isPodOrder = Boolean(order.isPod || order.orderType === 'POD' || hasDesign || order.supplierOrderId || order.printerInfo?.supplierOrderId);
  const isPendingApproval = order.approvalStatus === 'PENDING_APPROVAL' || (isPodOrder && order.fulfillmentStatus === 'PENDING_APPROVAL');

  const handleDispatchPrinter = async () => {
    setDispatchingPrinter(true);
    setPrinterMsg(null);
    try {
      const res = await sellerOrdersService.dispatchToPrinter(order.orderCode);
      setPrinterMsg({ type: 'success', text: res.message || 'Đã duyệt đơn và chuyển sang xưởng in thành công!' });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setPrinterMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Lỗi khi gửi xưởng in.' });
    } finally {
      setDispatchingPrinter(false);
    }
  };

  const handleApproveStockOrder = async () => {
    setApproving(true);
    setPrinterMsg(null);
    try {
      const res = await sellerOrdersService.approveOrder(order.orderCode);
      setPrinterMsg({ type: 'success', text: res.message || 'Đã duyệt đơn hàng thành công! Đơn chuyển sang chuẩn bị hàng.' });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setPrinterMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Lỗi khi duyệt đơn hàng.' });
    } finally {
      setApproving(false);
    }
  };

  const handleRejectOrder = async () => {
    const promptText = isPodOrder
      ? 'Nhập lý do từ chối đơn in này (ví dụ: File in bị vỡ, hết phôi):'
      : 'Nhập lý do từ chối đơn hàng này (ví dụ: Tạm hết hàng tồn kho):';
    const reason = window.prompt(promptText);
    if (!reason) return;
    setRejecting(true);
    setPrinterMsg(null);
    try {
      const res = await sellerOrdersService.rejectOrder(order.orderCode, reason);
      setPrinterMsg({ type: 'success', text: res.message || 'Đã từ chối đơn hàng.' });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setPrinterMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Lỗi khi từ chối đơn.' });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <ModalOverlay>
      <div className="flex max-h-[90vh] w-full max-w-4xl animate-scale-up flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        {/* ---------------------------------------------------------- đầu -- */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="m-0 text-lg font-extrabold text-stone-900 font-jakarta">{order.orderCode}</h2>
              {/* Phân loại hàng hóa gọn gàng */}
              {isPodOrder ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  <Printer size={12} />
                  Hàng POD
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
                  <Package size={12} />
                  Hàng kho
                </span>
              )}
              {/* Huy hiệu trạng thái duy nhất, chính xác */}
              {isPendingApproval ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {isPodOrder ? 'Chờ duyệt in' : 'Chờ duyệt đơn'}
                </span>
              ) : (
                <StatusBadge status={order.status} />
              )}
            </div>
            <p className="m-0 mt-1 text-[12.5px] text-stone-500">
              Đặt lúc {dateTime(order.createdAt)} · {isPodOrder ? 'Tiến độ được đồng bộ trực tiếp từ Printing Shop.' : STATUS_META[order.status]?.hint}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn hàng"
            className="shrink-0 cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 motion-reduce:transition-none"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* --------------------------------------------------------- thân -- */}
        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[1fr_320px]">
          {/* ---- Hàng phải gói ---- */}
          <div className="min-w-0">
            <h3 className={SECTION_TITLE}>
              Sản phẩm cần đóng gói ({fmtCount(order.itemCount)} sản phẩm)
            </h3>
            <ul className="m-0 list-none rounded-xl border border-stone-200 p-0">
              {order.items.map((it, i) => (
                <li
                  key={`${it.variantId}-${i}`}
                  className="flex items-start gap-3 border-b border-stone-100 px-3.5 py-3 last:border-b-0"
                >
                  <ItemThumb src={it.image} alt={it.title} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[13px] font-semibold leading-snug text-stone-900">{it.title}</p>
                    <p className="m-0 mt-0.5 text-[11.5px] text-stone-500">
                      {[it.sku, it.color, it.size].filter(Boolean).join(' · ') || 'Không có biến thể'}
                    </p>
                    {it.designFileUrl && (
                      <a
                        href={it.designFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#007700] no-underline hover:underline"
                      >
                        Xem file in gốc
                        <ExternalLink size={11} aria-hidden />
                      </a>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="m-0 text-[13px] font-bold tabular-nums text-stone-900">
                      {money(it.price * it.quantity)}
                    </p>
                    <p className="m-0 mt-0.5 text-[11.5px] tabular-nums text-stone-500">
                      {money(it.price)} × {fmtCount(it.quantity)}
                    </p>
                    {/* Giá vốn chỉ người bán thấy — đây là con số quyết định đơn này có lãi không. */}
                    <p className="m-0 mt-0.5 text-[11px] tabular-nums text-stone-400">
                      vốn {money(it.baseCost * it.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Khối hiển thị POD khi ĐANG CHỜ DUYỆT - Tinh gọn, rõ ràng */}
            {isPodOrder && isPendingApproval && (
              <div className="mt-4 rounded-xl border border-purple-200 bg-linear-to-r from-purple-50/70 via-white to-purple-50/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Printer size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-purple-950">
                        Đơn hàng POD chờ duyệt file & chuyển xưởng in
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Chưa gửi xưởng in
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-[12px] text-purple-900/80 leading-relaxed">
                      Sản phẩm yêu cầu in ấn theo file thiết kế. Bạn hãy kiểm tra file in bên trên, sau đó bấm <strong>"Duyệt đơn & Đẩy sang xưởng"</strong> bên dưới để hệ thống tự động gửi đơn sang Printing Shop xử lý.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Khối hiển thị POD khi ĐÃ DUYỆT - Theo dõi tiến độ xưởng in thực tế */}
            {isPodOrder && !isPendingApproval && (
              <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer size={16} className="text-purple-700" />
                    <span className="text-xs font-bold text-purple-950">
                      Tiến độ Xưởng In (POD Fulfillment)
                    </span>
                  </div>
                  {order.supplierOrderId || order.printerInfo?.supplierOrderId ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Mã xưởng: #{order.supplierOrderId || order.printerInfo?.supplierOrderId}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      Đã gửi xưởng in
                    </span>
                  )}
                </div>

                {/* Progress Stepper */}
                <div className="mt-3 grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    {
                      key: 'RECEIVED',
                      label: '1. Tiếp nhận',
                      done: Boolean(order.printerInfo?.printerStatus) || ['PROCESSING', 'SHIPPING', 'DELIVERED'].includes(order.status),
                    },
                    {
                      key: 'PRINTING',
                      label: '2. Đang in ấn',
                      done: ['PRINTING', 'PACKAGED', 'SHIPPED', 'DELIVERED'].includes(order.printerInfo?.printerStatus || '') || ['SHIPPING', 'DELIVERED'].includes(order.status),
                    },
                    {
                      key: 'PACKAGED',
                      label: '3. Đã đóng gói',
                      done: ['PACKAGED', 'SHIPPED', 'DELIVERED'].includes(order.printerInfo?.printerStatus || '') || ['SHIPPING', 'DELIVERED'].includes(order.status),
                    },
                    {
                      key: 'SHIPPED',
                      label: '4. Đã xuất kho',
                      done: ['SHIPPED', 'DELIVERED'].includes(order.printerInfo?.printerStatus || '') || ['SHIPPING', 'DELIVERED'].includes(order.status),
                    },
                  ].map(step => (
                    <div
                      key={step.key}
                      className={`text-center py-1.5 px-1 rounded-lg text-[10.5px] font-bold border transition-colors ${
                        step.done
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-white/80 text-stone-400 border-purple-100'
                      }`}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-xs text-purple-900/90 space-y-1">
                  <p className="m-0 flex items-center justify-between">
                    <span>Trạng thái xưởng: <strong className="text-purple-950">{order.status === 'DELIVERED' ? 'GIAO THÀNH CÔNG' : (order.printerInfo?.printerStatus || 'ĐÃ TIẾP NHẬN')}</strong></span>
                    {order.status === 'DELIVERED' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Đơn hoàn tất
                      </span>
                    )}
                  </p>
                  {order.printerInfo?.printerName && (
                    <p className="m-0 text-[11.5px] text-purple-700">
                      Đơn vị in: {order.printerInfo.printerName}
                    </p>
                  )}
                  {order.printerInfo?.rejectionReason && (
                    <p className="m-0 text-[11.5px] text-rose-700 font-bold">
                      Lý do xưởng báo lỗi: {order.printerInfo.rejectionReason}
                    </p>
                  )}
                  <p className="m-0 text-[11px] text-purple-800/80 italic pt-0.5">
                    * Đơn hàng này do xưởng in phụ trách sản xuất & vận chuyển. Trạng thái được đồng bộ trực tiếp.
                  </p>
                </div>
              </div>
            )}

            {!isPodOrder && (
              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 flex items-start gap-2.5">
                <Package size={16} className="text-stone-500 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-600">
                  <p className="m-0 font-bold text-stone-800">Đơn hàng có sẵn (Kho người bán)</p>
                  <p className="m-0 mt-0.5">Sản phẩm có sẵn trong kho của bạn. Bạn tự đóng gói và bấm "Cập nhật trạng thái" bên dưới khi bàn giao cho vận chuyển.</p>
                </div>
              </div>
            )}

            <h3 className={`${SECTION_TITLE} mt-6`}>Nhật ký trạng thái</h3>
            <ol className="m-0 list-none p-0">
              {[...order.statusHistory].reverse().map((h, i) => (
                <li key={`${h.status}-${h.changedAt}-${i}`} className="flex gap-3 py-1.5">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_META[h.status]?.dot || '#a8a29e' }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-stone-900">
                      {STATUS_META[h.status]?.label || h.status}
                    </span>
                    <span className="block text-[11.5px] text-stone-500">
                      {dateTime(h.changedAt)}
                      {h.note ? ` — ${h.note}` : ''}
                    </span>
                  </span>
                </li>
              ))}
              {order.statusHistory.length === 0 && (
                <li className="py-1.5 text-[12px] text-stone-400">Chưa ghi nhận thay đổi nào.</li>
              )}
            </ol>
          </div>

          {/* ---- Phiếu gửi & tiền ---- */}
          <div className="min-w-0 space-y-5">
            <section>
              <h3 className={SECTION_TITLE}>Người nhận</h3>
              <div className="rounded-xl border border-stone-200 px-3.5 py-3">
                <p className="m-0 text-[13px] font-bold text-stone-900">
                  {order.shippingAddress.recipientName || order.buyer.name}
                </p>
                <p className="m-0 mt-0.5 text-[12.5px] tabular-nums text-stone-600">
                  {order.shippingAddress.phone || '—'}
                </p>
                <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-stone-600">
                  {order.shippingAddress.addressDetail || 'Chưa có địa chỉ chi tiết'}
                </p>
              </div>
            </section>

            <section>
              <h3 className={SECTION_TITLE}>Vận chuyển & thanh toán</h3>
              <div className="rounded-xl border border-stone-200 px-3.5 py-2">
                <DetailRow
                  label="Đơn vị vận chuyển"
                  value={CARRIER_LABEL[order.shipping.carrier || ''] || 'Chưa chọn'}
                />
                <DetailRow
                  label="Mã vận đơn"
                  value={
                    order.shipping.trackingNumber || (
                      <span className="font-normal text-stone-400">Chưa bàn giao</span>
                    )
                  }
                />
                <DetailRow
                  label="Hình thức"
                  value={PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                />
                <DetailRow
                  label="Tình trạng tiền"
                  value={
                    <span className={order.paymentStatus === 'PAID' ? 'text-[#007700]' : 'text-amber-700'}>
                      {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
                    </span>
                  }
                />
              </div>
            </section>

            <section>
              <h3 className={SECTION_TITLE}>Dòng tiền của đơn</h3>
              <div className="rounded-xl border border-stone-200 px-3.5 py-2">
                <DetailRow label="Tiền hàng" value={money(f.subtotal)} />
                <DetailRow label="Phí vận chuyển" value={money(f.shippingFee)} />
                {f.discount > 0 && <DetailRow label="Giảm giá" value={`-${money(f.discount)}`} />}
                <DetailRow
                  label="Khách trả"
                  value={<span className="text-stone-900">{money(buyerPaid)}</span>}
                />
                <div className="my-1 border-t border-stone-100" />
                <DetailRow label="Phí sàn" value={`-${money(f.platformFee)}`} />
                <DetailRow label="Giá vốn phôi" value={`-${money(f.baseCost)}`} />
                <div className="flex items-baseline justify-between gap-4 border-t border-stone-100 pt-2">
                  <span className="text-[12px] font-semibold text-stone-700">Bạn thực nhận</span>
                  <span className="text-[15px] font-extrabold tabular-nums text-[#007700]">{money(f.payout)}</span>
                </div>
                {/* Phí sàn trừ vào tiền chuyển về ví, giá vốn thì đã chi trước đó cho
                    xưởng — hai khoản khác bản chất nên nói rõ, tránh bị cộng nhầm. */}
                <p className="mb-1 mt-1 text-[11px] leading-snug text-stone-400">
                  "Thực nhận" là số sàn chuyển về ví sau khi trừ phí sàn; giá vốn phôi bạn đã trả riêng
                  cho xưởng in.
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* --------------------------------------------------------- chân -- */}
        <div className="flex flex-col gap-2.5 border-t border-stone-100 bg-stone-50 px-6 py-4">
          {printerMsg && (
            <div className={`w-full text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 ${printerMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
              {printerMsg.type === 'success' && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
              <span>{printerMsg.text}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12px] text-stone-500">
              {isPendingApproval
                ? (isPodOrder
                    ? 'Đơn hàng POD đang chờ bạn duyệt file in để đẩy sang xưởng.'
                    : 'Đơn hàng đang chờ bạn duyệt để chuẩn bị xuất kho.')
                : order.status === 'SHIPPING'
                ? 'Đơn hàng đang giao. Bạn có thể xác nhận đã giao khi đơn vị vận chuyển hoàn tất.'
                : order.status === 'DELIVERED' || order.status === 'CANCELLED'
                ? 'Đơn đã kết thúc — không còn thao tác nào.'
                : isPodOrder
                ? 'Đơn hàng POD do xưởng in phụ trách sản xuất & vận chuyển — Bạn theo dõi tiến độ.'
                : 'Bước tiếp theo bạn có thể thực hiện:'}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {isPendingApproval ? (
                <>
                  <button
                    type="button"
                    disabled={loading || rejecting || dispatchingPrinter || approving}
                    onClick={handleRejectOrder}
                    className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 px-3.5 py-2 text-[13.5px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {rejecting ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    Từ chối duyệt
                  </button>
                  {isPodOrder ? (
                    <button
                      type="button"
                      disabled={loading || dispatchingPrinter || rejecting}
                      onClick={handleDispatchPrinter}
                      className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 text-[13.5px] font-bold transition-colors shadow-sm disabled:opacity-50"
                      title="Duyệt đơn và chuyển dữ liệu in sang xưởng in"
                    >
                      {dispatchingPrinter ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Duyệt đơn & Đẩy sang xưởng
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading || approving || rejecting}
                      onClick={handleApproveStockOrder}
                      className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl bg-[#007700] hover:bg-[#005B00] text-white px-4 py-2 text-[13.5px] font-bold transition-colors shadow-sm disabled:opacity-50"
                      title="Duyệt đơn hàng và bắt đầu chuẩn bị đóng gói hàng hóa"
                    >
                      {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Duyệt đơn hàng
                    </button>
                  )}
                </>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-stone-600 transition-colors hover:bg-stone-100 motion-reduce:transition-none"
              >
                Đóng
              </button>

              {/* Khi đơn đang SHIPPING, cả hàng POD và hàng kho đều có thể bấm xác nhận đã giao */}
              {!isPendingApproval && order.status === 'SHIPPING' && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    onAction({
                      to: 'DELIVERED',
                      label: 'Xác nhận đã giao',
                      description: 'Chỉ xác nhận khi khách đã thực sự nhận hàng. Đơn COD sẽ được ghi nhận là đã thu tiền và chuyển về số dư ví.',
                    })
                  }
                  className="cursor-pointer rounded-xl border border-[#007700] bg-[#007700] text-white px-4 py-2 text-[13.5px] font-bold transition-colors hover:bg-[#005B00] shadow-sm disabled:opacity-50"
                >
                  Xác nhận đã giao
                </button>
              )}

              {/* Các thao tác khác cho đơn kho (không phải POD) */}
              {!isPodOrder && !isPendingApproval && order.status !== 'SHIPPING' && actions.map(action => (
                <button
                  key={action.to}
                  type="button"
                  disabled={loading}
                  onClick={() => onAction(action)}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-[13.5px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none ${
                    action.destructive
                      ? 'border border-rose-200 bg-white text-[#BA1A1A] hover:bg-rose-50'
                      : 'border border-[#007700] bg-[#007700] text-white hover:bg-[#005B00]'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
