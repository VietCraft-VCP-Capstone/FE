import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, ChevronRight, CreditCard, Loader2, PackageCheck, RotateCcw, Search, ShoppingBag, Star, Store, X } from 'lucide-react';
import { ordersService, type OrderItemResponse, type OrderResponse } from '../../order/services/ordersService';
import { cartService } from '../../order/services/cartService';
import { returnService, type ReturnRequest } from '../../returns/services/returnService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import ReorderModal from '../components/profile/ReorderModal';
import ReviewModal from '../components/profile/ReviewModal';
import { CommerceToast, useCommerceToast } from '../components/commerce/CommerceToast';
import { formatDateTime, mediaUrl, onImgError, PLACEHOLDER_IMG, vnd } from '../components/commerce/format';
import '../components/commerce/commerce.css';

type Order = OrderResponse;
type OrderTab = 'all' | 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled' | 'returns';

const TABS: { id: OrderTab; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'paid', label: 'Đang chuẩn bị' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'completed', label: 'Đã giao' },
  { id: 'cancelled', label: 'Đã hủy' },
  { id: 'returns', label: 'Đổi trả, hoàn tiền' },
];

const CANCEL_REASONS = [
  'Đổi ý không muốn mua nữa',
  'Muốn thay đổi địa chỉ hoặc số điện thoại nhận hàng',
  'Muốn đổi phân loại, kích thước hoặc màu sắc',
  'Tìm thấy giá tốt hơn ở nơi khác',
  'Khác',
];

const RETURN_STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: 'Đã gửi yêu cầu', tone: 'text-sky-800 bg-sky-50' },
  PENDING_PRINTER: { label: 'Chờ xưởng in thẩm định', tone: 'text-amber-800 bg-amber-50' },
  PRINTER_PROPOSED_FAULT_CHANGE: { label: 'Chờ quản trị xem xét', tone: 'text-[var(--c-plum)] bg-[var(--c-plum-wash)]' },
  APPROVED: { label: 'Đã duyệt yêu cầu', tone: 'text-[var(--c-green-deep)] bg-[var(--c-green-wash)]' },
  REJECTED: { label: 'Bị từ chối', tone: 'text-rose-800 bg-rose-50' },
  DISPUTED: { label: 'Đang khiếu nại', tone: 'text-orange-800 bg-orange-50' },
  AWAITING_ADMIN_REFUND: { label: 'Chờ hoàn tiền', tone: 'text-[var(--c-plum)] bg-[var(--c-plum-wash)]' },
  CONVERTED_TO_REFUND: { label: 'Đã duyệt hoàn tiền', tone: 'text-[var(--c-green-deep)] bg-[var(--c-green-wash)]' },
  REPLACEMENT_CREATED: { label: 'Đã tạo đơn in bù', tone: 'text-[var(--c-green-deep)] bg-[var(--c-green-wash)]' },
  COMPLETED: { label: 'Hoàn tất', tone: 'text-stone-700 bg-stone-100' },
  CANCELLED: { label: 'Đã hủy', tone: 'text-stone-500 bg-stone-100' },
};

const RETURN_REASONS: Record<string, string> = {
  R01: 'In sai, lệch, mờ hoặc sai màu',
  R01A: 'Vấn đề chất lượng cần kiểm tra',
  R02: 'Phôi sản phẩm bị lỗi',
  R03: 'Giao sai size, màu hoặc số lượng',
  R04: 'Thiếu sản phẩm trong kiện',
  R05: 'Sản phẩm hư hỏng khi giao',
  R06: 'Không nhận được hàng',
  R07: 'Vấn đề kỹ thuật cần xem xét',
  R08: 'Sai thông tin đơn hàng',
  R09: 'Vấn đề khác cần hỗ trợ',
  R13: 'Cần đội ngũ hỗ trợ phân loại',
};

/** Ảnh mặc định BE gán khi shop chưa có logo (order/types PLACEHOLDER_SHOP_LOGO): không hiển thị như logo thật. */
const PLACEHOLDER_SHOP_LOGO = 'photo-1513519245088-0e12902e5a38';

const LOCKED_FULFILLMENT =['SUBMITTED', 'RECEIVED', 'PRINTING', 'PACKAGED', 'SHIPPED', 'DELIVERED'];

const awaitingPayment = (o: Order) => o.status === 'pending' && o.paymentMethod === 'PAYOS' && o.paymentStatus === 'PENDING';

/** Giống điều kiện BE cho phép người mua tự hủy (OrdersService.cancelOrderByBuyer). */
function canCancel(o: Order): boolean {
  if (o.status === 'cancelled' || o.status === 'shipping' || o.status === 'completed') return false;
  if (LOCKED_FULFILLMENT.includes(o.fulfillmentStatus || '')) return false;
  if (o.status === 'pending' || o.paymentStatus === 'PENDING') return true;
  if (o.isPod) return true;
  return o.sellerApprovalStatus === 'PENDING_APPROVAL';
}

function statusChip(o: Order): { label: string; tone: string } {
  if (awaitingPayment(o)) return { label: 'Chờ thanh toán', tone: 'text-[var(--c-rose)] bg-rose-50' };
  switch (o.status) {
    case 'pending': return { label: 'Chờ xác nhận', tone: 'text-amber-800 bg-amber-50' };
    case 'paid': return { label: 'Đang chuẩn bị', tone: 'text-[var(--c-plum)] bg-[var(--c-plum-wash)]' };
    case 'shipping': return { label: 'Đang giao', tone: 'text-[var(--c-green-deep)] bg-[var(--c-green-wash)]' };
    case 'completed': return { label: 'Đã giao', tone: 'text-[var(--c-green-deep)] bg-[var(--c-green-wash)]' };
    default: return { label: 'Đã hủy', tone: 'text-stone-500 bg-stone-100' };
  }
}

function OrderTrack({ order }: { order: Order }) {
  const stage = { pending: 0, paid: 1, shipping: 2, completed: 4 }[order.status as 'pending'] ?? 0;
  const labels = [awaitingPayment(order) ? 'Chờ thanh toán' : 'Chờ xác nhận', 'Đang chuẩn bị', 'Đang giao', 'Đã nhận hàng'];
  return (
    <ol className="vc-track m-0 list-none p-0" aria-label="Tiến độ đơn hàng">
      {labels.map((label, i) => {
        const state = i < stage ? 'done' : i === stage ? 'current' : 'todo';
        return (
          <li key={label} className="vc-track-step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export function BuyerOrdersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { toast, show: showToast, dismiss } = useCommerceToast();

  const paramTab = params.get('tab') as OrderTab | null;
  const activeTab: OrderTab = paramTab && TABS.some((t) => t.id === paramTab) ? paramTab : 'all';

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState('');
  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);
  const [returnsError, setReturnsError] = useState('');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelOther, setCancelOther] = useState('');
  const [deliveryTarget, setDeliveryTarget] = useState<Order | null>(null);
  const [reorderOrder, setReorderOrder] = useState<Order | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewProductId, setReviewProductId] = useState<string | undefined>();

  const loadOrders = useCallback(async () => {
    setOrdersError('');
    try {
      const res = await ordersService.getByUser('all');
      setOrders(Array.isArray(res) ? res : ((res as any)?.items || []));
    } catch (err) {
      setOrdersError(getApiErrorMessage(err, 'Không tải được danh sách đơn hàng.'));
      setOrders((prev) => prev ?? []);
    }
  }, []);

  const loadReturns = useCallback(async () => {
    setReturnsError('');
    try {
      const list = await returnService.list();
      setReturns(Array.isArray(list) ? list : []);
    } catch (err) {
      setReturnsError(getApiErrorMessage(err, 'Không tải được yêu cầu đổi trả.'));
      setReturns((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    void loadReturns();
    // Quay lại tab (vd. sau khi thanh toán ở payOS): làm mới trạng thái.
    const onFocus = () => { void loadOrders(); void loadReturns(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadOrders, loadReturns]);

  const setTab = (id: OrderTab) => setParams(id === 'all' ? {} : { tab: id }, { replace: true });

  const activeReturnByOrder = useMemo(() => {
    const map = new Map<string, ReturnRequest>();
    for (const r of returns ?? []) {
      if (r.order_id && !map.has(String(r.order_id)) && !['COMPLETED', 'CANCELLED', 'EXPIRED', 'ADMIN_REJECTED'].includes(r.status)) {
        map.set(String(r.order_id), r);
      }
    }
    return map;
  }, [returns]);

  const counts = useMemo(() => {
    const c: Record<OrderTab, number> = { all: 0, pending: 0, paid: 0, shipping: 0, completed: 0, cancelled: 0, returns: returns?.length ?? 0 };
    for (const o of orders ?? []) {
      c.all += 1;
      c[o.status as OrderTab] = (c[o.status as OrderTab] || 0) + 1;
    }
    return c;
  }, [orders, returns]);

  const unpaid = (orders ?? []).filter(awaitingPayment);

  const q = query.trim().toLowerCase();
  const visibleOrders = (orders ?? []).filter((o) => {
    if (activeTab !== 'all' && o.status !== activeTab) return false;
    if (!q) return true;
    return o.shopName?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q) || (o.items || []).some((it) => it.title?.toLowerCase().includes(q));
  });
  const visibleReturns = (returns ?? []).filter((r) => {
    if (!q) return true;
    const snap = (r.item_snapshot || {}) as any;
    return [r.id, r._id, r.order_id, snap.title, r.reason_description, r.reason_code].some((v) => String(v || '').toLowerCase().includes(q));
  });

  /* ---------- Hành động ---------- */
  const payNow = async (o: Order) => {
    setBusy(o.id);
    try {
      const { checkoutUrl } = await ordersService.createPayosPayment(o._id || o.id);
      window.location.href = checkoutUrl;
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không mở được cổng thanh toán payOS.'), 'error');
      setBusy(null);
    }
  };

  const submitCancel = async () => {
    if (!cancelTarget) return;
    const o = cancelTarget;
    setBusy(o.id);
    try {
      const reason = cancelReason === 'Khác' ? (cancelOther.trim() || 'Lý do khác') : cancelReason;
      await ordersService.cancelOrder(o.id, reason);
      setCancelTarget(null);
      const prepaid = o.paymentStatus === 'PAID' && o.paymentMethod !== 'COD';
      showToast(prepaid ? 'Đã hủy đơn. Tiền sẽ được hoàn về tài khoản của bạn.' : 'Đã hủy đơn hàng.');
      await loadOrders();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không hủy được đơn hàng.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const submitDelivery = async () => {
    if (!deliveryTarget) return;
    const o = deliveryTarget;
    setBusy(o.id);
    try {
      await ordersService.confirmDelivery(o.id);
      setDeliveryTarget(null);
      showToast('Đã xác nhận nhận hàng. Đơn đã hoàn tất.');
      await loadOrders();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không xác nhận được.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const confirmReorder = async (selected: OrderItemResponse[]) => {
    const failures: string[] = [];
    for (const it of selected) {
      try {
        await cartService.addToCart({ productId: it.productId, variantId: it.variantId && it.variantId !== 'default' ? it.variantId : undefined, quantity: it.quantity });
      } catch (err) {
        failures.push(getApiErrorMessage(err));
      }
    }
    setReorderOrder(null);
    if (failures.length > 0 && failures.length === selected.length) {
      showToast(failures[0], 'error');
      return;
    }
    showToast(failures.length ? `Đã thêm ${selected.length - failures.length}/${selected.length} sản phẩm. ${failures[0]}` : 'Đã thêm vào giỏ hàng.', failures.length ? 'error' : 'success', { label: 'Xem giỏ', onClick: () => navigate('/cart') });
  };

  const onReviewed = () => {
    showToast('Đã lưu đánh giá. Cảm ơn bạn đã chia sẻ.');
    void loadOrders();
  };

  const toggleExpanded = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const btn = 'inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-50';
  const btnGhost = `${btn} border border-[var(--c-line-strong)] bg-white text-[var(--c-ink)] hover:border-[var(--c-ink)]`;
  const btnPrimary = `${btn} bg-[var(--c-green)] text-white hover:bg-[var(--c-green-deep)]`;

  const loading = activeTab === 'returns' ? returns === null : orders === null;
  const error = activeTab === 'returns' ? returnsError : ordersError;

  return (
    <div className="vc-commerce">
      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-5 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="vc-display m-0 text-[28px] font-semibold leading-tight text-[var(--c-plum)] sm:text-[34px]">Đơn hàng</h1>
            {orders && orders.length > 0 && <p className="m-0 mt-1 text-sm text-[var(--c-muted)]">{orders.length} đơn đã đặt</p>}
          </div>
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Tìm đơn hàng</span>
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--c-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === 'returns' ? 'Mã yêu cầu, mã đơn, tên sản phẩm' : 'Mã đơn, tên shop, tên sản phẩm'}
              className="h-11 w-full rounded-full border border-[var(--c-line-strong)] bg-white pl-10 pr-4 text-sm outline-none focus:border-[var(--c-green)]"
            />
          </label>
        </header>

        <nav className="vc-no-scrollbar -mx-4 mt-5 flex gap-1 overflow-x-auto border-b border-[var(--c-line)] px-4 sm:mx-0 sm:px-0" aria-label="Lọc theo trạng thái">
          {TABS.map((t) => {
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={on ? 'page' : undefined}
                className={`-mb-px shrink-0 border-b-2 px-3 pb-3 pt-2 text-[13.5px] font-semibold transition-colors ${on ? 'border-[var(--c-plum)] text-[var(--c-plum)]' : 'border-transparent text-[var(--c-muted)] hover:text-[var(--c-ink)]'}`}
              >
                {t.label}
                {counts[t.id] > 0 && <span className={`vc-num ml-1.5 font-normal ${on ? 'text-[var(--c-plum)]/70' : ''}`}>{counts[t.id]}</span>}
              </button>
            );
          })}
        </nav>

        {unpaid.length > 0 && activeTab !== 'returns' && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span className="flex items-center gap-2"><CreditCard size={16} /> {unpaid.length === 1 ? 'Có 1 đơn đang chờ thanh toán.' : `Có ${unpaid.length} đơn đang chờ thanh toán.`} Shop chỉ chuẩn bị hàng sau khi nhận tiền.</span>
            {unpaid.length === 1 ? (
              <button type="button" disabled={busy === unpaid[0].id} onClick={() => void payNow(unpaid[0])} className="font-semibold underline">Thanh toán ngay</button>
            ) : activeTab !== 'pending' && (
              <button type="button" onClick={() => setTab('pending')} className="font-semibold underline">Xem các đơn</button>
            )}
          </div>
        )}

        {error && (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span>{error}</span>
            <button type="button" onClick={() => void (activeTab === 'returns' ? loadReturns() : loadOrders())} className="font-semibold underline">Thử lại</button>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="vc-panel space-y-4 p-5" aria-busy="true">
                <div className="flex justify-between"><div className="vc-skel h-4 w-40" /><div className="vc-skel h-4 w-20" /></div>
                <div className="vc-skel h-3 w-full" />
                <div className="flex gap-4"><div className="vc-skel h-16 w-16 rounded-xl" /><div className="flex-1 space-y-2"><div className="vc-skel h-4 w-2/3" /><div className="vc-skel h-3 w-1/4" /></div></div>
              </div>
            ))
          ) : error && (activeTab === 'returns' ? !returns?.length : !orders?.length) ? null : activeTab === 'returns' ? (
            visibleReturns.length === 0 ? (
              <Empty
                icon={<RotateCcw size={28} strokeWidth={1.6} />}
                title={q ? 'Không có yêu cầu nào khớp tìm kiếm' : 'Chưa có yêu cầu đổi trả nào'}
                body="Khi bạn gửi yêu cầu đổi hàng hoặc hoàn tiền, tiến độ xử lý sẽ hiển thị tại đây."
                action={!q ? { label: 'Xem đơn đã giao', onClick: () => setTab('completed') } : undefined}
              />
            ) : visibleReturns.map((r) => {
              const rid = r.id || r._id || '';
              const snap = (r.item_snapshot || {}) as any;
              const st = RETURN_STATUS[r.status] || { label: r.status, tone: 'text-stone-700 bg-stone-100' };
              const exchange = (r.final_resolution || r.requested_resolution) === 'EXCHANGE';
              return (
                <article key={rid} className="vc-panel overflow-hidden">
                  <header className="vc-band flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                      <span className="font-semibold">{exchange ? 'Đổi hàng (in bù)' : 'Hoàn tiền'}</span>
                      <span className="vc-num text-[var(--c-muted)]">Yêu cầu {rid.slice(-8).toUpperCase()}</span>
                      <Link to={`/orders/${encodeURIComponent(r.order_id)}`} className="text-[var(--c-muted)] underline-offset-2 hover:text-[var(--c-green)] hover:underline">Đơn {r.order_id}</Link>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${st.tone}`}>{st.label}</span>
                  </header>
                  <div className="flex gap-4 px-5 py-4">
                    <img src={mediaUrl(snap.image) || PLACEHOLDER_IMG} alt="" onError={onImgError} className="h-16 w-16 shrink-0 rounded-xl border border-[var(--c-line)] object-cover" />
                    <div className="min-w-0 flex-1 text-[13.5px]">
                      <p className="m-0 line-clamp-1 font-medium">{snap.title || 'Sản phẩm'}</p>
                      <p className="m-0 mt-1 text-[var(--c-muted)]">{[snap.color, snap.size].filter(Boolean).join(', ')}{snap.color || snap.size ? '. ' : ''}Số lượng {r.quantity || 1}</p>
                      <p className="m-0 mt-1 text-[var(--c-body)]">{RETURN_REASONS[r.reason_code] || r.reason_code}</p>
                      {r.reason_description && <p className="m-0 mt-1 line-clamp-2 text-[var(--c-muted)]">{r.reason_description}</p>}
                    </div>
                  </div>
                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--c-line)] px-5 py-3.5">
                    <p className="m-0 text-[12.5px] text-[var(--c-muted)]">
                      Gửi lúc {formatDateTime(r.created_at)}
                      {r.deadline_at && <span className="font-semibold text-[var(--c-amber)]">. Hạn xử lý {formatDateTime(r.deadline_at)}</span>}
                    </p>
                    <button type="button" onClick={() => navigate(`/returns/${encodeURIComponent(rid)}`)} className={btnPrimary}>Theo dõi yêu cầu</button>
                  </footer>
                </article>
              );
            })
          ) : visibleOrders.length === 0 ? (
            <Empty
              icon={<ShoppingBag size={28} strokeWidth={1.6} />}
              title={q ? 'Không có đơn nào khớp tìm kiếm' : activeTab === 'all' ? 'Bạn chưa có đơn hàng nào' : 'Không có đơn ở trạng thái này'}
              body={activeTab === 'all' && !q ? 'Đơn bạn đặt sẽ hiển thị ở đây cùng tiến độ giao hàng.' : 'Thử chọn trạng thái khác hoặc đổi từ khoá tìm kiếm.'}
              action={activeTab === 'all' && !q ? { label: 'Bắt đầu mua sắm', onClick: () => navigate('/') } : undefined}
            />
          ) : visibleOrders.map((o) => {
            const chip = statusChip(o);
            const items = o.items || [];
            const open = expanded.has(o.id);
            const shownItems = open ? items : items.slice(0, 2);
            const activeReturn = activeReturnByOrder.get(o._id || o.id);
            const reviewed = o.is_reviewed || (items.length > 0 && items.every((it) => it.is_reviewed));
            const prepaid = o.status === 'pending' && o.paymentMethod !== 'COD' && o.paymentStatus === 'PAID';
            const isBusy = busy === o.id;
            const detail = `/orders/${encodeURIComponent(o.id)}`;

            return (
              <article key={o.id} className="vc-panel overflow-hidden">
                <div className="vc-band px-5 py-3.5">
                <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {o.shopLogo && !o.shopLogo.includes(PLACEHOLDER_SHOP_LOGO) ? (
                      <img src={mediaUrl(o.shopLogo)} alt="" className="h-7 w-7 rounded-full border border-[var(--c-line)] object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : <Store size={17} className="shrink-0 text-[var(--c-muted)]" />}
                    {o.shopId ? (
                      <Link to={`/shop/${o.shopId}`} className="truncate text-[15px] font-semibold hover:text-[var(--c-green)]">{o.shopName}</Link>
                    ) : <span className="truncate text-[15px] font-semibold">{o.shopName}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeReturn && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--c-plum-wash)] px-3 py-1 text-[12px] font-semibold text-[var(--c-plum)]"><ArrowRightLeft size={12} /> Đang đổi trả</span>}
                    {prepaid && <span className="rounded-full bg-[var(--c-green-wash)] px-3 py-1 text-[12px] font-semibold text-[var(--c-green-deep)]">Đã thanh toán</span>}
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${chip.tone}`}>{chip.label}</span>
                  </div>
                </header>
                <p className="vc-num m-0 mt-1 text-[12.5px] text-[var(--c-muted)]">Mã đơn {o.id}, đặt lúc {formatDateTime(o.createdAt)}</p>
                </div>

                {o.status !== 'cancelled' && (
                  <div className="px-5 pt-5"><OrderTrack order={o} /></div>
                )}

                <ul className="m-0 mt-2 list-none divide-y divide-[var(--c-line)] px-5">
                  {shownItems.map((it, idx) => (
                    <li key={`${it.productId}-${it.variantId}-${idx}`} className="flex gap-4 py-3.5">
                      <Link to={`/product/${it.productId}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--c-line)] bg-stone-50">
                        <img src={mediaUrl(it.image) || PLACEHOLDER_IMG} alt={it.title || ''} loading="lazy" onError={onImgError} className="h-full w-full object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/product/${it.productId}`} className="line-clamp-1 text-[14px] font-medium hover:text-[var(--c-green)]">{it.title}</Link>
                        <p className="m-0 mt-0.5 text-[12.5px] text-[var(--c-muted)]">{[it.color, it.size].filter(Boolean).join(', ') || 'Tiêu chuẩn'}</p>
                        <p className="vc-num m-0 mt-0.5 text-[12.5px] text-[var(--c-muted)]">{it.quantity} x {vnd(it.price)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="vc-num text-[14px] font-semibold">{vnd(it.price * it.quantity)}</span>
                        {o.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => { setReviewOrder(o); setReviewProductId(it.productId); }}
                            className="hidden items-center gap-1 text-[12.5px] font-semibold text-[var(--c-green)] hover:underline sm:inline-flex"
                          >
                            <Star size={12} className={it.is_reviewed ? 'fill-amber-400 text-amber-400' : ''} /> {it.is_reviewed ? 'Sửa đánh giá' : 'Đánh giá'}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {items.length > 2 && (
                  <button type="button" onClick={() => toggleExpanded(o.id)} className="mx-5 mb-1 text-[13px] font-semibold text-[var(--c-muted)] hover:text-[var(--c-ink)]">
                    {open ? 'Thu gọn' : `Xem thêm ${items.length - 2} sản phẩm`}
                  </button>
                )}

                <footer className="flex flex-col gap-3 border-t border-[var(--c-line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 flex items-baseline gap-2 text-sm">
                    <span className="text-[var(--c-muted)]">Thành tiền</span>
                    <span className="vc-display vc-num text-[19px] font-semibold text-[var(--c-plum)]">{vnd(o.totalAmount)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 max-sm:[&>*]:flex-1">
                    {activeReturn && (
                      <button type="button" onClick={() => navigate(`/returns/${encodeURIComponent(activeReturn.id || activeReturn._id || '')}`)} className={btnGhost}>Xem đổi trả</button>
                    )}
                    {canCancel(o) && (
                      <button type="button" disabled={isBusy} onClick={() => { setCancelReason(CANCEL_REASONS[0]); setCancelOther(''); setCancelTarget(o); }} className={`${btnGhost} hover:!border-[var(--c-rose)] hover:text-[var(--c-rose)]`}>Hủy đơn</button>
                    )}
                    <Link to={detail} className={btnGhost}>Chi tiết <ChevronRight size={14} /></Link>
                    {awaitingPayment(o) && (
                      <button type="button" disabled={isBusy} onClick={() => void payNow(o)} className={btnPrimary}>
                        {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />} Thanh toán ngay
                      </button>
                    )}
                    {o.status === 'shipping' && (
                      <button type="button" disabled={isBusy} onClick={() => setDeliveryTarget(o)} className={btnPrimary}><PackageCheck size={14} /> Đã nhận hàng</button>
                    )}
                    {o.status === 'completed' && (
                      <button type="button" onClick={() => { setReviewOrder(o); setReviewProductId(undefined); }} className={btnGhost}>
                        <Star size={14} className={reviewed ? 'fill-amber-400 text-amber-400' : ''} /> {reviewed ? 'Sửa đánh giá' : 'Đánh giá'}
                      </button>
                    )}
                    {(o.status === 'completed' || o.status === 'cancelled') && (
                      <button type="button" onClick={() => setReorderOrder(o)} className={btnPrimary}>Mua lại</button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      </div>

      {/* Hủy đơn */}
      {cancelTarget && (
        <Dialog title="Hủy đơn hàng này?" onClose={() => setCancelTarget(null)}>
          <p className="m-0 text-sm text-[var(--c-muted)]">
            Đơn {cancelTarget.id} của {cancelTarget.shopName}.
            {cancelTarget.paymentStatus === 'PAID' && cancelTarget.paymentMethod !== 'COD' ? ' Số tiền đã trả sẽ được hoàn tự động.' : ''}
          </p>
          <fieldset className="m-0 mt-4 space-y-2 border-0 p-0">
            <legend className="mb-2 text-[13px] font-semibold">Lý do hủy</legend>
            {CANCEL_REASONS.map((r) => (
              <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] ${cancelReason === r ? 'border-[var(--c-plum)] bg-[var(--c-plum-wash)]' : 'border-[var(--c-line)]'}`}>
                <input type="radio" name="cancel-reason" checked={cancelReason === r} onChange={() => setCancelReason(r)} className="h-4 w-4 accent-[var(--c-plum)]" />
                {r}
              </label>
            ))}
          </fieldset>
          {cancelReason === 'Khác' && (
            <textarea
              value={cancelOther}
              onChange={(e) => setCancelOther(e.target.value.slice(0, 300))}
              rows={3}
              placeholder="Cho shop biết lý do của bạn"
              aria-label="Lý do khác"
              className="mt-3 w-full rounded-xl border border-[var(--c-line-strong)] p-3 text-sm outline-none focus:border-[var(--c-plum)]"
            />
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setCancelTarget(null)} className="rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-stone-100">Giữ đơn</button>
            <button type="button" disabled={busy === cancelTarget.id} onClick={() => void submitCancel()} className="inline-flex items-center gap-2 rounded-full bg-[var(--c-rose)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
              {busy === cancelTarget.id && <Loader2 size={14} className="animate-spin" />} Hủy đơn
            </button>
          </div>
        </Dialog>
      )}

      {/* Xác nhận đã nhận hàng */}
      {deliveryTarget && (
        <Dialog title="Bạn đã nhận được hàng?" onClose={() => setDeliveryTarget(null)}>
          <p className="m-0 text-sm leading-relaxed text-[var(--c-muted)]">
            Xác nhận khi bạn đã nhận đủ hàng và kiểm tra sản phẩm. Sau khi xác nhận, đơn {deliveryTarget.id} sẽ hoàn tất và tiền được chuyển cho shop.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setDeliveryTarget(null)} className="rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-stone-100">Chưa nhận</button>
            <button type="button" disabled={busy === deliveryTarget.id} onClick={() => void submitDelivery()} className="inline-flex items-center gap-2 rounded-full bg-[var(--c-green)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--c-green-deep)] disabled:opacity-60">
              {busy === deliveryTarget.id && <Loader2 size={14} className="animate-spin" />} Đã nhận hàng
            </button>
          </div>
        </Dialog>
      )}

      {reorderOrder && (
        <ReorderModal
          isOpen
          onClose={() => setReorderOrder(null)}
          shopName={reorderOrder.shopName || ''}
          items={reorderOrder.items as any}
          onConfirm={(sel: any) => void confirmReorder(sel)}
        />
      )}

      {reviewOrder && (
        <ReviewModal
          isOpen
          onClose={() => { setReviewOrder(null); setReviewProductId(undefined); }}
          order={reviewOrder as any}
          initialProductId={reviewProductId}
          onSuccess={onReviewed}
        />
      )}

      <CommerceToast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function Empty({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: { label: string; onClick: () => void } }) {
  return (
    <section className="vc-panel px-6 py-14 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-dashed border-[var(--c-thread)] text-[var(--c-plum)]">{icon}</div>
      <h2 className="vc-display m-0 text-lg font-semibold text-[var(--c-plum)]">{title}</h2>
      <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-relaxed text-[var(--c-muted)]">{body}</p>
      {action && <button type="button" onClick={action.onClick} className="mt-6 rounded-full bg-[var(--c-green)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--c-green-deep)]">{action.label}</button>}
    </section>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/45 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="vc-sheet max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="vc-display m-0 text-lg font-semibold text-[var(--c-plum)]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-1.5 text-[var(--c-muted)] hover:bg-stone-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default BuyerOrdersPage;
