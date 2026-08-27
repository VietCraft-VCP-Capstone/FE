/**
 * Đơn hàng của gian hàng.
 *
 * Trang này trả lời đúng một câu hỏi mỗi lần mở: "hôm nay tôi phải gói những đơn nào".
 * Vì vậy tab mặc định KHÔNG phải "Tất cả" mà là nhóm đơn đang chờ xử lý, và cột nổi
 * bật nhất trong bảng là số tiền người bán thực nhận chứ không phải số khách trả.
 *
 * Dữ liệu lấy từ GET /seller/orders — lọc theo shop_id suy từ token. Không dùng
 * GET /orders: endpoint đó lọc theo buyer_id nên với tài khoản seller nó trả về đơn mà
 * họ ĐI MUA (xem ghi chú trong sellerOrdersService.ts).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Search, X } from 'lucide-react';

import { StatCard } from '../components/dashboard/SellerDashboardUi';
import {
  OrdersPagination,
  OrdersTable,
  StatusTabs,
  type StatusTab,
} from '../components/orders/SellerOrdersUi';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { UpdateStatusModal, type StatusSubmitPayload } from '../components/orders/UpdateStatusModal';
import { STATUS_META, type StatusAction } from '../components/orders/orderStatusMeta';
import { sellerOrdersService } from '../services/sellerOrdersService';
import type {
  SellerOrder,
  SellerOrderFilter,
  SellerOrderList,
  SellerOrderSort,
  SellerOrderStatusFilter,
} from '../types/order';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { useToast } from '../../../shared/components/Toast';
import { compactMoney, count as fmtCount, money, timeAgo } from '../../../shared/utils/format';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';

const PAGE_SIZE = 20;

const INITIAL_FILTER: SellerOrderFilter = {
  // Mở trang là thấy ngay việc phải làm; "Tất cả" chỉ hữu ích khi đi tra cứu.
  status: 'TODO',
  search: '',
  sort: 'newest',
  page: 1,
  pageSize: PAGE_SIZE,
};

const EMPTY: SellerOrderList = {
  items: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 0,
  counts: { all: 0, ORDERED: 0, PENDING_DESIGN: 0, PROCESSING: 0, SHIPPING: 0, DELIVERED: 0, CANCELLED: 0 },
  revenue: { settled: 0, pending: 0 },
};

const TAB_ORDER: SellerOrderStatusFilter[] = [
  'TODO',
  'ORDERED',
  'PENDING_DESIGN',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'ALL',
];

const SORT_OPTIONS: { value: SellerOrderSort; label: string }[] = [
  { value: 'newest', label: 'Mới nhất trước' },
  { value: 'oldest', label: 'Cũ nhất trước' },
  { value: 'highest', label: 'Giá trị cao nhất' },
  { value: 'lowest', label: 'Giá trị thấp nhất' },
];

/** Trạng thái nào cũng có chỗ trống riêng — "không có đơn nào" nói gì tuỳ tab đang mở. */
function emptyCopy(status: SellerOrderStatusFilter, searching: boolean) {
  if (searching) {
    return {
      title: 'Không tìm thấy đơn nào khớp',
      hint: 'Thử tìm bằng mã đơn, tên người nhận, số điện thoại hoặc mã vận đơn.',
    };
  }
  if (status === 'ALL') {
    return {
      title: 'Gian hàng chưa có đơn nào',
      hint: 'Đơn sẽ xuất hiện ở đây ngay khi có khách đặt mua sản phẩm của bạn.',
    };
  }
  if (status === 'TODO') {
    return {
      title: 'Không còn đơn nào chờ xử lý',
      hint: 'Mọi đơn đều đã bàn giao vận chuyển hoặc đã kết thúc. Đơn mới sẽ hiện ngay tại đây.',
    };
  }
  return {
    title: `Không có đơn ở trạng thái "${STATUS_META[status].label}"`,
    hint: STATUS_META[status].hint,
  };
}

export function SellerOrdersPage() {
  const { showToast } = useToast();

  const [filter, setFilter] = useState<SellerOrderFilter>(INITIAL_FILTER);
  const [data, setData] = useState<SellerOrderList>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const [detail, setDetail] = useState<SellerOrder | null>(null);
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [saving, setSaving] = useState(false);

  // Lượt tải sau đè lên lượt trước: gõ tìm kiếm nhanh thì phản hồi cũ về muộn
  // sẽ ghi đè kết quả mới nếu không đánh số lượt.
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (current: SellerOrderFilter, isRefresh = false) => {
      const requestId = ++requestIdRef.current;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const result = await sellerOrdersService.list(current);
        if (requestId !== requestIdRef.current) return;
        setData(result);
        setError('');
        setLoadedAt(new Date());
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(getApiErrorMessage(err, 'Không tải được danh sách đơn hàng.'));
        setData(EMPTY);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  // Ô tìm kiếm gõ tới đâu lọc tới đó, nhưng luôn kéo về trang 1: kết quả mới
  // gần như chắc chắn không còn tới trang cũ.
  useEffect(() => {
    setFilter(f => (f.search === debouncedSearch ? f : { ...f, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  /** Việc đang chờ tay người bán: đơn mới, chờ thiết kế và đang sản xuất.
   *  Phải khớp TODO_STATUSES trong seller-orders.service.ts của BE. */
  const todoCount = data.counts.ORDERED + data.counts.PENDING_DESIGN + data.counts.PROCESSING;

  const tabs: StatusTab[] = useMemo(
    () =>
      TAB_ORDER.map(value => {
        if (value === 'ALL') return { value, label: 'Tất cả', count: data.counts.all };
        if (value === 'TODO') return { value, label: 'Cần xử lý', count: todoCount };
        return { value, label: STATUS_META[value].label, count: data.counts[value] || 0 };
      }),
    [data.counts, todoCount]
  );

  const openDetail = useCallback(async (order: SellerOrder) => {
    // Mở ngay bằng dữ liệu đã có trong bảng rồi mới nạp lại bản mới nhất — chi tiết
    // hiện tức thì, và nếu người khác vừa đổi trạng thái thì vẫn được cập nhật.
    setDetail(order);
    try {
      const fresh = await sellerOrdersService.getById(order.orderCode);
      setDetail(prev => (prev && prev.orderCode === fresh.orderCode ? fresh : prev));
    } catch {
      /* Bản trong bảng vẫn dùng được; không làm phiền bằng thông báo lỗi. */
    }
  }, []);

  const submitStatus = useCallback(
    async (payload: StatusSubmitPayload) => {
      if (!detail || !pendingAction) return;
      setSaving(true);
      try {
        const updated = await sellerOrdersService.updateStatus(detail.orderCode, {
          status: pendingAction.to,
          ...payload,
        });
        setDetail(updated);
        setPendingAction(null);
        showToast(`Đơn ${updated.orderCode}: ${STATUS_META[updated.status].label}`, 'success');
        // Số đếm từng tab và doanh thu đều đổi theo — phải nạp lại cả danh sách.
        void load(filter, true);
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Không cập nhật được trạng thái đơn hàng.'), 'error');
      } finally {
        setSaving(false);
      }
    },
    [detail, pendingAction, filter, load, showToast]
  );

  const searching = Boolean(filter.search.trim());
  const empty = emptyCopy(filter.status, searching);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="m-0 text-2xl font-extrabold tracking-tight text-stone-900 font-jakarta">Đơn hàng</h1>
          <p className="mb-0 mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-stone-500">
            {todoCount > 0
              ? `${fmtCount(todoCount)} đơn đang chờ bạn xử lý — nhận sản xuất, đóng gói rồi bàn giao cho GHN / GHTK.`
              : 'Không còn đơn nào chờ xử lý. Đơn mới sẽ hiện ngay tại đây.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(filter, true)}
          disabled={refreshing || loading}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-stone-600 transition-colors duration-150 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none"
        >
          <RefreshCw
            size={15}
            className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined}
            aria-hidden
          />
          Làm mới
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          label="Chờ xử lý"
          accent={todoCount > 0 ? STATUS_META.ORDERED.dot : undefined}
          value={fmtCount(todoCount)}
          hint={`${fmtCount(data.counts.ORDERED)} đơn mới · ${fmtCount(data.counts.PROCESSING)} đang sản xuất`}
        />
        <StatCard
          loading={loading}
          label="Đang giao"
          accent={STATUS_META.SHIPPING.dot}
          value={fmtCount(data.counts.SHIPPING)}
          hint="đã bàn giao, chờ khách nhận"
        />
        <StatCard
          loading={loading}
          label="Tiền đang treo"
          value={compactMoney(data.revenue.pending)}
          hint={`${money(data.revenue.pending)} — đơn chưa giao xong`}
        />
        <StatCard
          loading={loading}
          label="Tiền đã chốt"
          accent={STATUS_META.DELIVERED.dot}
          value={compactMoney(data.revenue.settled)}
          hint={`${fmtCount(data.counts.DELIVERED)} đơn đã giao thành công`}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-900"
        >
          <AlertTriangle size={16} className="mt-px shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <section className="mt-4 flex flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 pt-2">
          <StatusTabs
            value={filter.status}
            tabs={tabs}
            onChange={status => setFilter(f => ({ ...f, status, page: 1 }))}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
          <label className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="sr-only">Tìm đơn hàng</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Mã đơn, tên khách, SĐT, mã vận đơn…"
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-8 text-[13px] text-stone-900 outline-none transition-colors duration-150 placeholder:text-stone-400 focus:border-[#007700] motion-reduce:transition-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Xoá từ khoá tìm kiếm"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md border-none bg-transparent p-1 text-stone-400 hover:text-stone-700"
              >
                <X size={14} aria-hidden />
              </button>
            )}
          </label>

          <div className="flex items-center gap-3">
            {loadedAt && !loading && (
              <span className="hidden text-xs text-stone-500 sm:inline">Số liệu lúc {timeAgo(loadedAt)}</span>
            )}
            <label className="flex items-center gap-1.5 text-[12.5px] text-stone-500">
              Sắp xếp
              <select
                value={filter.sort}
                onChange={e => setFilter(f => ({ ...f, sort: e.target.value as SellerOrderSort, page: 1 }))}
                className="cursor-pointer rounded-lg border border-stone-200 bg-white py-1.5 pl-2 pr-1 text-[12.5px] font-semibold text-stone-700 outline-none focus:border-[#007700]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Nạp lại thì làm mờ nội dung cũ thay vì thay bằng khung xương — bảng đang
            đọc dở không nên biến mất dưới mắt người dùng. */}
        <div className={refreshing ? 'opacity-60 transition-opacity duration-200' : undefined}>
          <OrdersTable
            orders={data.items}
            loading={loading}
            onOpen={order => void openDetail(order)}
            emptyTitle={empty.title}
            emptyHint={empty.hint}
          />
        </div>

        <OrdersPagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          disabled={loading || refreshing}
          onPageChange={page => setFilter(f => ({ ...f, page }))}
        />
      </section>

      <OrderDetailModal
        order={detail}
        loading={saving}
        onClose={() => {
          setDetail(null);
          setPendingAction(null);
        }}
        onAction={setPendingAction}
      />

      <UpdateStatusModal
        order={detail}
        action={pendingAction}
        loading={saving}
        onClose={() => setPendingAction(null)}
        onConfirm={payload => void submitStatus(payload)}
      />
    </div>
  );
}

export default SellerOrdersPage;
