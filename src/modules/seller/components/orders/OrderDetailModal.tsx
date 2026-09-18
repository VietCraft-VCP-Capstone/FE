/**
 * Chi tiết một đơn hàng, mở từ bảng danh sách.
 *
 * Bố cục hai cột theo đúng thứ tự người bán cần: BÊN TRÁI là thứ phải gói (hàng gì, mấy
 * cái, file in ở đâu), BÊN PHẢI là thứ phải điền vào phiếu gửi (ai nhận, ở đâu) rồi mới
 * tới tiền. Nhật ký trạng thái nằm cuối vì nó trả lời câu "vì sao đơn đang ở đây", chỉ
 * cần khi có gì đó bất thường.
 */

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
  const [printerMsg, setPrinterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!order) return null;

  const f = order.financials;
  const buyerPaid = f.subtotal + f.shippingFee - f.discount;
  const actions = NEXT_ACTIONS[order.status] || [];
  const hasDesign = order.items.some(it => it.designFileUrl);

  const handleDispatchPrinter = async () => {
    setDispatchingPrinter(true);
    setPrinterMsg(null);
    try {
      const res = await sellerOrdersService.dispatchToPrinter(order.orderCode);
      setPrinterMsg({ type: 'success', text: res.message || 'Đã chuyển đơn sang xưởng in thành công!' });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setPrinterMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Lỗi khi gửi xưởng in.' });
    } finally {
      setDispatchingPrinter(false);
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
              <StatusBadge status={order.status} />
            </div>
            <p className="m-0 mt-1 text-[12.5px] text-stone-500">
              Đặt lúc {dateTime(order.createdAt)} · {STATUS_META[order.status].hint}
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
                        Tải file in
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

            {!hasDesign && (
              <p className="mb-0 mt-2 flex items-center gap-1.5 text-[11.5px] text-stone-400">
                <Package size={12} aria-hidden />
                Đơn này không có hàng in theo yêu cầu.
              </p>
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
            <div className={`w-full text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 ${
              printerMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {printerMsg.type === 'success' && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
              <span>{printerMsg.text}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12px] text-stone-500">
              {actions.length === 0
                ? 'Đơn đã kết thúc — không còn thao tác nào.'
                : 'Bước tiếp theo bạn có thể thực hiện:'}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {['ORDERED', 'PENDING_DESIGN', 'PROCESSING'].includes(order.status) && (
                <button
                  type="button"
                  disabled={loading || dispatchingPrinter}
                  onClick={handleDispatchPrinter}
                  className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-violet-600 bg-violet-50 hover:bg-violet-100 text-violet-700 px-4 py-2 text-[13.5px] font-bold transition-colors disabled:opacity-50"
                  title="Chuyển dữ liệu và file in sang hệ thống Printing Shop"
                >
                  {dispatchingPrinter ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  Gửi xưởng in (POD)
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-stone-600 transition-colors hover:bg-stone-100 motion-reduce:transition-none"
              >
                Đóng
              </button>
            {actions.map(action => (
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
