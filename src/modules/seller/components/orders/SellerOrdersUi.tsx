/**
 * Các khối giao diện của trang Đơn hàng người bán.
 *
 * Bám đúng ngôn ngữ sẵn có của khu người bán (xem SellerDashboardUi): nền trắng, viền
 * stone-200, bo 16px, #007700 là màu nhấn duy nhất. Màu ở đây chỉ dùng để PHÂN BIỆT
 * trạng thái, và mọi chỗ dùng màu đều có chữ đi kèm — người không phân biệt được màu
 * vẫn đọc được đơn đang ở đâu.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Package, Truck } from 'lucide-react';

import { count as fmtCount, dateTime, money, timeAgo } from '../../../../shared/utils/format';
import type { SellerOrder, SellerOrderStatus, SellerOrderStatusFilter } from '../../types/order';
import { CARRIER_LABEL, PAYMENT_LABEL, PAYMENT_STATUS_LABEL, STATUS_META, PRINTER_STATUS_META } from './orderStatusMeta';

export const SELLER_BRAND = '#007700';

/* ------------------------------------------------------------ huy hiệu ----- */

export function StatusBadge({ status, size = 'md' }: { status: SellerOrderStatus | 'PENDING_APPROVAL'; size?: 'sm' | 'md' }) {
  const meta = STATUS_META[status] || STATUS_META.ORDERED;
  return (
    <span
      title={meta.hint}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-bold ${meta.badge} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11px]'
      }`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.dot }} aria-hidden />
      {meta.label}
    </span>
  );
}

/** Trạng thái tiền, tách khỏi trạng thái đơn: đơn đang giao vẫn có thể chưa thu tiền. */
export function PaymentBadge({ order }: { order: SellerOrder }) {
  const paid = order.paymentStatus === 'PAID';
  const refunded = order.paymentStatus === 'REFUNDED';
  return (
    <span className="flex flex-col gap-0.5">
      <span
        className={`text-[12px] font-bold ${
          refunded ? 'text-stone-500' : paid ? 'text-[#007700]' : 'text-amber-700'
        }`}
      >
        {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
      </span>
      <span className="text-[11px] text-stone-400">{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</span>
    </span>
  );
}

/* --------------------------------------------------------------- ảnh ------- */

/** Ảnh chết rơi về ô giữ chỗ, không để ảnh vỡ giữa bảng. */
export function ItemThumb({ src, alt, size = 36 }: { src?: string; alt?: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400"
        style={{ width: size, height: size }}
      >
        <Package size={Math.round(size * 0.42)} aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt || ''}
      loading="lazy"
      onError={() => setBroken(true)}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-lg border border-stone-200 object-cover"
    />
  );
}

/* ---------------------------------------------------------------- tab ------ */

export interface StatusTab {
  value: SellerOrderStatusFilter;
  label: string;
  count: number;
}

export function StatusTabs({
  value,
  tabs,
  onChange,
}: {
  value: SellerOrderStatusFilter;
  tabs: StatusTab[];
  onChange: (v: SellerOrderStatusFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Lọc theo trạng thái đơn hàng"
      className="-mb-px flex gap-1 overflow-x-auto"
    >
      {tabs.map(tab => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-0 border-b-2 bg-transparent px-3.5 py-2.5 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#007700] motion-reduce:transition-none ${
              active
                ? 'border-b-[#007700] text-[#007700]'
                : 'border-b-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums ${
                active ? 'bg-[#EAF0E2] text-[#005B00]' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {fmtCount(tab.count)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- bảng ------- */

const TH = 'px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-stone-500';
const TD = 'px-4 py-3 align-middle';

export function OrdersTable({
  orders,
  loading,
  onOpen,
  onQuickApprove,
  emptyTitle,
  emptyHint,
}: {
  orders: SellerOrder[];
  loading: boolean;
  onOpen: (order: SellerOrder) => void;
  onQuickApprove?: (order: SellerOrder, e: React.MouseEvent) => void;
  emptyTitle: string;
  emptyHint: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2.5 px-4 py-5">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-100 motion-reduce:animate-none" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <Package size={19} aria-hidden />
        </span>
        <p className="m-0 text-sm font-semibold text-stone-900">{emptyTitle}</p>
        <p className="m-0 max-w-[46ch] text-xs leading-relaxed text-stone-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    // Bảng rộng tự cuộn ngang trong khung của nó — không để cả trang trôi ngang.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[940px] border-collapse">
        <thead>
          <tr className="border-b border-stone-100 bg-stone-50/60">
            <th scope="col" className={TH}>Đơn hàng</th>
            <th scope="col" className={TH}>Khách nhận</th>
            <th scope="col" className={TH}>Sản phẩm</th>
            <th scope="col" className={`${TH} text-right`}>Thực nhận</th>
            <th scope="col" className={TH}>Thanh toán</th>
            <th scope="col" className={TH}>Trạng thái</th>
            <th scope="col" className={`${TH} text-right`}>Đặt lúc</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr
              key={order.id}
              tabIndex={0}
              role="button"
              onClick={() => onOpen(order)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(order);
                }
              }}
              className="cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-b-0 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#007700] motion-reduce:transition-none"
            >
              <td className={TD}>
                <div className="flex items-center gap-1.5">
                  <span className="block text-[13px] font-bold text-stone-900">{order.orderCode}</span>
                  {(order.isPod || order.orderType === 'POD' || order.items?.some(it => it.designFileUrl)) && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                      POD
                    </span>
                  )}
                </div>
                {order.shipping.trackingNumber ? (
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-500">
                    <Truck size={11} aria-hidden />
                    {order.shipping.trackingNumber}
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[11px] text-stone-400">
                    {CARRIER_LABEL[order.shipping.carrier || ''] || 'Chưa chọn đơn vị vận chuyển'}
                  </span>
                )}
              </td>

              <td className={TD}>
                <span className="block max-w-[180px] truncate text-[13px] font-semibold text-stone-900">
                  {order.shippingAddress.recipientName || order.buyer.name}
                </span>
                <span className="block text-[11.5px] tabular-nums text-stone-500">
                  {order.shippingAddress.phone || '—'}
                </span>
              </td>

              <td className={TD}>
                <span className="flex items-center gap-2">
                  <span className="flex -space-x-2">
                    {order.items.slice(0, 3).map((it, i) => (
                      <ItemThumb key={`${it.variantId}-${i}`} src={it.image} alt={it.title} size={32} />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[190px] truncate text-[12.5px] text-stone-700">
                      {order.items[0]?.title || '—'}
                    </span>
                    <span className="block text-[11px] text-stone-400">
                      {order.items.length > 1
                        ? `${order.items.length} loại · ${fmtCount(order.itemCount)} sản phẩm`
                        : `${fmtCount(order.itemCount)} sản phẩm`}
                    </span>
                  </span>
                </span>
              </td>

              <td className={`${TD} text-right`}>
                {/* Người bán quan tâm tiền VỀ TAY mình, nên cột chính là payout;
                    tổng khách trả để nhỏ bên dưới cho khỏi nhầm hai con số. */}
                <span className="block text-[13px] font-extrabold tabular-nums text-stone-900">
                  {money(order.financials.payout)}
                </span>
                <span className="block text-[11px] tabular-nums text-stone-400">
                  khách trả {money(order.financials.subtotal + order.financials.shippingFee - order.financials.discount)}
                </span>
              </td>

              <td className={TD}>
                <PaymentBadge order={order} />
              </td>

              <td className={TD}>
                {order.status === 'DELIVERED' ? (
                  <div className="flex flex-col gap-0.5 items-start">
                    <StatusBadge status="DELIVERED" />
                    {order.isPod && (
                      <span className="text-[10px] font-medium text-stone-400">
                        {order.printerInfo?.supplierOrderId ? `Xưởng #${order.printerInfo.supplierOrderId}` : 'Xưởng hoàn tất'}
                      </span>
                    )}
                  </div>
                ) : order.status === 'CANCELLED' ? (
                  <StatusBadge status="CANCELLED" />
                ) : order.approvalStatus === 'PENDING_APPROVAL' || order.fulfillmentStatus === 'PENDING_APPROVAL' ? (
                  <div className="flex flex-col gap-1.5 items-start">
                    <StatusBadge status="PENDING_APPROVAL" />
                    {order.paymentMethod !== 'COD' && order.paymentStatus === 'PENDING' ? (
                      <span className="text-[10.5px] font-semibold text-orange-600" title="Đơn trả trước: chỉ duyệt được khi khách đã thanh toán">
                        Chờ khách thanh toán
                      </span>
                    ) : onQuickApprove && (
                      <button
                        type="button"
                        onClick={(e) => onQuickApprove(order, e)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-xs transition-colors cursor-pointer ${
                          order.isPod || order.orderType === 'POD'
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-[#007700] hover:bg-[#005B00]'
                        }`}
                        title={
                          order.isPod || order.orderType === 'POD'
                            ? 'Duyệt đơn và chuyển file in sang xưởng in'
                            : 'Duyệt đơn hàng và bắt đầu chuẩn bị hàng'
                        }
                      >
                        {order.isPod || order.orderType === 'POD' ? 'Duyệt in ngay' : 'Duyệt đơn ngay'}
                      </button>
                    )}
                  </div>
                ) : order.status === 'SHIPPING' ? (
                  <div className="flex flex-col gap-0.5 items-start">
                    <StatusBadge status="SHIPPING" />
                    <span className="text-[10.5px] font-medium text-stone-400">
                      {order.shipping?.trackingNumber ? `Vận đơn: ${order.shipping.trackingNumber}` : 'Đang giao hàng'}
                    </span>
                  </div>
                ) : order.status === 'PROCESSING' && order.printerInfo?.printerStatus && PRINTER_STATUS_META[order.printerInfo.printerStatus] && order.printerInfo.printerStatus !== 'SHIPPED' && order.printerInfo.printerStatus !== 'DELIVERED' ? (
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      title={PRINTER_STATUS_META[order.printerInfo.printerStatus].hint}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${PRINTER_STATUS_META[order.printerInfo.printerStatus].badge}`}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: PRINTER_STATUS_META[order.printerInfo.printerStatus].dot }} aria-hidden />
                      {PRINTER_STATUS_META[order.printerInfo.printerStatus].label}
                    </span>
                    <span className="text-[10.5px] font-medium text-stone-400">
                      {order.printerInfo.supplierOrderId ? `Mã xưởng: ${order.printerInfo.supplierOrderId}` : 'Xưởng in xử lý'}
                    </span>
                  </div>
                ) : (
                  <StatusBadge status={order.status} />
                )}
              </td>

              <td className={`${TD} text-right`}>
                <span className="block text-[12.5px] text-stone-700" title={dateTime(order.createdAt)}>
                  {timeAgo(order.createdAt)}
                </span>
                <span className="block text-[11px] tabular-nums text-stone-400">
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------- phân trang ----- */

const PAGE_BTN =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors duration-150 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none';

export function OrdersPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  disabled?: boolean;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Phân trang đơn hàng"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3"
    >
      <span className="text-[12.5px] tabular-nums text-stone-500">
        Hiển thị {from}–{to} trên {fmtCount(total)} đơn
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={PAGE_BTN}
            aria-label="Trang trước"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <span className="text-[12.5px] tabular-nums text-stone-600">
            Trang {page}/{totalPages}
          </span>
          <button
            type="button"
            className={PAGE_BTN}
            aria-label="Trang sau"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------- linh tinh --- */

/** Một cặp nhãn — giá trị, dùng trong ngăn chi tiết. */
export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-[12px] text-stone-500">{label}</span>
      <span className="min-w-0 text-right text-[12.5px] font-semibold text-stone-900">{value}</span>
    </div>
  );
}
