/**
 * Các khối giao diện của trang Đơn hàng người bán.
 *
 * Bám đúng ngôn ngữ sẵn có của khu người bán (xem SellerDashboardUi): nền trắng, viền
 * stone-200, #007700 là màu nhấn duy nhất. Màu ở đây chỉ dùng để PHÂN BIỆT trạng thái,
 * và mọi chỗ dùng màu đều có chữ đi kèm: người không phân biệt được màu vẫn đọc được
 * đơn đang ở đâu.
 *
 * Bo góc theo một quy tắc: khung 16px (rounded-2xl), nút/ô nhập/ảnh 8px (rounded-lg),
 * huy hiệu bo tròn hẳn. Thêm khối mới thì theo đúng ba mức này.
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
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-semibold ${meta.badge} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-0.5 text-[11.5px]'
      }`}
    >
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
        className={`text-[12.5px] font-semibold ${
          refunded ? 'text-stone-500' : paid ? 'text-[#007700]' : 'text-amber-700'
        }`}
      >
        {PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
      </span>
      <span className="text-[11.5px] text-stone-500">{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</span>
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
        className="inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-white bg-stone-100 text-stone-400"
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
      className="shrink-0 rounded-lg border-2 border-white bg-stone-100 object-cover shadow-[0_0_0_1px_rgba(214,211,209,0.9)]"
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
      className="-mb-px flex gap-0.5 overflow-x-auto [scrollbar-width:none]"
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
            className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-b-2 bg-transparent px-3 pb-3 pt-3.5 text-[13px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#007700] motion-reduce:transition-none ${
              active
                ? 'border-b-[#007700] font-semibold text-stone-900'
                : 'border-b-transparent font-medium text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
            <span
              className={`text-[12px] font-semibold tabular-nums ${
                active ? 'text-[#007700]' : tab.count > 0 ? 'text-stone-500' : 'text-stone-300'
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

const TH = 'whitespace-nowrap px-4 py-3 text-left text-[12px] font-medium text-stone-500';
const TD = 'px-4 py-3.5 align-middle';

const isPodOrder = (order: SellerOrder) =>
  Boolean(order.isPod || order.orderType === 'POD' || order.items?.some(it => it.designFileUrl));
const isPendingApproval = (order: SellerOrder) =>
  order.approvalStatus === 'PENDING_APPROVAL' || order.fulfillmentStatus === 'PENDING_APPROVAL';
/** Đơn trả trước chưa nhận tiền: BE không cho duyệt, nên bảng cũng không mời bấm. */
const isAwaitingBuyerPayment = (order: SellerOrder) =>
  order.paymentMethod !== 'COD' && order.paymentStatus === 'PENDING';

/** Trạng thái + một dòng phụ giải thích, cùng một nhịp cho mọi loại đơn. */
function StatusCell({ order }: { order: SellerOrder }) {
  const printer = order.printerInfo?.printerStatus ? PRINTER_STATUS_META[order.printerInfo.printerStatus] : undefined;
  const showPrinter = order.status === 'PROCESSING' && printer
    && order.printerInfo?.printerStatus !== 'SHIPPED' && order.printerInfo?.printerStatus !== 'DELIVERED';

  let badge: React.ReactNode = <StatusBadge status={order.status} />;
  let note: string | null = null;
  let noteClass = 'text-stone-500';

  if (order.status === 'DELIVERED') {
    if (order.isPod) note = order.printerInfo?.supplierOrderId ? `Xưởng #${order.printerInfo.supplierOrderId}` : 'Xưởng hoàn tất';
  } else if (order.status === 'CANCELLED') {
    // chỉ huy hiệu
  } else if (isPendingApproval(order)) {
    badge = <StatusBadge status="PENDING_APPROVAL" />;
    if (isAwaitingBuyerPayment(order)) {
      note = 'Chờ khách thanh toán';
      noteClass = 'font-medium text-amber-700';
    }
  } else if (order.status === 'SHIPPING') {
    // Mã vận đơn đã nằm ở cột Đơn hàng; ở đây chỉ nói bước tiếp theo.
    note = 'Chờ khách nhận';
  } else if (showPrinter && printer) {
    badge = (
      <span
        title={printer.hint}
        className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${printer.badge}`}
      >
        {printer.label}
      </span>
    );
    note = order.printerInfo?.supplierOrderId ? `Mã xưởng ${order.printerInfo.supplierOrderId}` : 'Xưởng in xử lý';
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {badge}
      {note && <span className={`text-[11.5px] ${noteClass}`}>{note}</span>}
    </div>
  );
}

/** Khung xương đúng hình một hàng của bảng, để lúc tải không bị nhảy bố cục. */
function TableSkeleton() {
  const bar = 'animate-pulse rounded-md bg-stone-100 motion-reduce:animate-none';
  return (
    <div aria-hidden className="divide-y divide-stone-100">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="grid grid-cols-[1.3fr_1fr_1.4fr_1fr_0.9fr_1fr_0.8fr] items-center gap-6 px-4 py-4">
          <div className="space-y-2"><div className={`${bar} h-3.5 w-36`} /><div className={`${bar} h-3 w-24`} /></div>
          <div className="space-y-2"><div className={`${bar} h-3.5 w-24`} /><div className={`${bar} h-3 w-20`} /></div>
          <div className="flex items-center gap-3"><div className={`${bar} h-8 w-8 rounded-lg`} /><div className={`${bar} h-3.5 w-28`} /></div>
          <div className="space-y-2"><div className={`${bar} h-3.5 w-24`} /><div className={`${bar} h-3 w-20`} /></div>
          <div className="space-y-2 justify-self-end"><div className={`${bar} ml-auto h-3.5 w-16`} /><div className={`${bar} h-3 w-20`} /></div>
          <div className={`${bar} h-5 w-20 rounded-full`} />
          <div className="space-y-2 justify-self-end"><div className={`${bar} ml-auto h-3.5 w-16`} /><div className={`${bar} h-3 w-14`} /></div>
        </div>
      ))}
    </div>
  );
}

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
  if (loading) return <TableSkeleton />;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-20 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
          <Package size={20} aria-hidden />
        </span>
        <p className="m-0 mt-1 text-sm font-semibold text-stone-900">{emptyTitle}</p>
        <p className="m-0 max-w-[46ch] text-[13px] leading-relaxed text-stone-500">{emptyHint}</p>
      </div>
    );
  }

  return (
    // Bảng rộng tự cuộn ngang trong khung của nó, không để cả trang trôi ngang.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] border-collapse">
        <thead>
          <tr className="border-b border-stone-100">
            <th scope="col" className={TH}>Đơn hàng</th>
            <th scope="col" className={TH}>Khách nhận</th>
            <th scope="col" className={TH}>Sản phẩm</th>
            <th scope="col" className={TH}>Thanh toán</th>
            <th scope="col" className={`${TH} text-right`}>Thực nhận</th>
            <th scope="col" className={TH}>Trạng thái</th>
            <th scope="col" className={`${TH} text-right`}>Đặt lúc</th>
            <th scope="col" className={`${TH} w-[120px]`}><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const pod = isPodOrder(order);
            const canApprove = Boolean(onQuickApprove) && isPendingApproval(order) && !isAwaitingBuyerPayment(order)
              && order.status !== 'CANCELLED' && order.status !== 'DELIVERED';
            return (
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
                className="group cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-b-0 hover:bg-stone-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#007700] motion-reduce:transition-none"
              >
                <td className={TD}>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold tabular-nums tracking-tight text-stone-900">{order.orderCode}</span>
                    {pod && (
                      <span className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-px text-[10.5px] font-semibold text-stone-600">
                        POD
                      </span>
                    )}
                  </div>
                  {order.shipping.trackingNumber ? (
                    <span className="mt-1 flex items-center gap-1 text-[11.5px] tabular-nums text-stone-500">
                      <Truck size={12} aria-hidden />
                      {order.shipping.trackingNumber}
                    </span>
                  ) : (
                    <span className="mt-1 block text-[11.5px] text-stone-500">
                      {CARRIER_LABEL[order.shipping.carrier || ''] || 'Chưa chọn đơn vị vận chuyển'}
                    </span>
                  )}
                </td>

                <td className={TD}>
                  <span className="block max-w-[180px] truncate text-[13px] font-medium text-stone-900">
                    {order.shippingAddress.recipientName || order.buyer.name}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] tabular-nums text-stone-500">
                    {order.shippingAddress.phone || 'Chưa có SĐT'}
                  </span>
                </td>

                <td className={TD}>
                  <span className="flex items-center gap-3">
                    <span className="flex -space-x-2.5">
                      {order.items.slice(0, 3).map((it, i) => (
                        <ItemThumb key={`${it.variantId}-${i}`} src={it.image} alt={it.title} size={34} />
                      ))}
                    </span>
                    <span className="min-w-0">
                      <span className="block max-w-[200px] truncate text-[13px] text-stone-800">
                        {order.items[0]?.title || 'Sản phẩm'}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] tabular-nums text-stone-500">
                        {order.items.length > 1
                          ? `${order.items.length} loại, ${fmtCount(order.itemCount)} sản phẩm`
                          : `${fmtCount(order.itemCount)} sản phẩm`}
                      </span>
                    </span>
                  </span>
                </td>

                <td className={TD}>
                  <PaymentBadge order={order} />
                </td>

                <td className={`${TD} text-right`}>
                  {/* Người bán quan tâm tiền VỀ TAY mình, nên số chính là payout;
                      tổng khách trả để nhỏ bên dưới cho khỏi nhầm hai con số. */}
                  <span className="block text-[13.5px] font-semibold tabular-nums text-stone-900">
                    {money(order.financials.payout)}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] tabular-nums text-stone-500">
                    khách trả {money(order.financials.subtotal + order.financials.shippingFee - order.financials.discount)}
                  </span>
                </td>

                <td className={TD}>
                  <StatusCell order={order} />
                </td>

                <td className={`${TD} text-right`}>
                  <span className="block whitespace-nowrap text-[12.5px] text-stone-700" title={dateTime(order.createdAt)}>
                    {timeAgo(order.createdAt)}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] tabular-nums text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </td>

                <td className={`${TD} text-right`}>
                  {canApprove ? (
                    <button
                      type="button"
                      onClick={e => onQuickApprove!(order, e)}
                      title={pod ? 'Duyệt đơn và chuyển file in sang xưởng in' : 'Duyệt đơn và bắt đầu chuẩn bị hàng'}
                      className="inline-flex h-8 cursor-pointer items-center whitespace-nowrap rounded-lg border-0 bg-[#007700] px-3 text-[12.5px] font-semibold text-white transition duration-150 hover:bg-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] active:scale-[0.98] motion-reduce:transition-none"
                    >
                      {pod ? 'Duyệt in' : 'Duyệt đơn'}
                    </button>
                  ) : (
                    <ChevronRight
                      size={16}
                      aria-hidden
                      className="ml-auto text-stone-300 transition-colors duration-150 group-hover:text-stone-500 motion-reduce:transition-none"
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------- phân trang ----- */

const PAGE_BTN =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition duration-150 hover:bg-stone-50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none';

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
        Hiển thị {from}-{to} trên {fmtCount(total)} đơn
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
          <span className="min-w-[64px] text-center text-[12.5px] tabular-nums text-stone-600">
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

/** Một cặp nhãn và giá trị, dùng trong ngăn chi tiết. */
export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-[12px] text-stone-500">{label}</span>
      <span className="min-w-0 text-right text-[12.5px] font-semibold text-stone-900">{value}</span>
    </div>
  );
}
