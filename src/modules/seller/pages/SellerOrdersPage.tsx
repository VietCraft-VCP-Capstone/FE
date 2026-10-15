import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Search, X } from 'lucide-react';

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
  counts: { all: 0, PENDING_APPROVAL: 0, POD_ORDERS: 0, ORDERED: 0, PENDING_DESIGN: 0, PROCESSING: 0, SHIPPING: 0, DELIVERED: 0, CANCELLED: 0 },
  revenue: { settled: 0, pending: 0 },
};

const TAB_ORDER: SellerOrderStatusFilter[] = [
  'PENDING_APPROVAL',
  'POD_ORDERS',
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

interface Kpi {
  label: string;
  value: string;
  hint: string;
  /** Bấm để lọc bảng theo đúng nhóm đơn mà con số đang đếm. */
  filter?: SellerOrderStatusFilter;
  /** Con số đòi người bán làm gì đó ngay: tô màu nhấn. */
  urgent?: boolean;
}

function KpiStrip({
  items,
  loading,
  activeFilter,
  onFilter,
}: {
  items: Kpi[];
  loading: boolean;
  activeFilter: SellerOrderStatusFilter;
  onFilter: (f: SellerOrderStatusFilter) => void;
}) {
  return (
    <section
      aria-label="Tổng quan đơn hàng"
      className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 lg:grid-cols-4"
    >
      {items.map(item => {
        const active = item.filter !== undefined && item.filter === activeFilter;
        const body = (
          <>
            <span className="text-[12.5px] font-medium text-stone-500">{item.label}</span>
            {loading ? (
              <span className="mt-1 block h-7 w-16 animate-pulse rounded-md bg-stone-100 motion-reduce:animate-none" />
            ) : (
              <span
                className={`mt-1 block text-[26px] font-bold leading-none tracking-tight tabular-nums ${
                  item.urgent ? 'text-[#007700]' : 'text-stone-900'
                }`}
              >
                {item.value}
              </span>
            )}
            <span className="mt-2 block text-[12px] leading-snug text-stone-500">{item.hint}</span>
          </>
        );
        return item.filter ? (
          <button
            key={item.label}
            type="button"
            aria-pressed={active}
            onClick={() => onFilter(item.filter!)}
            className={`flex cursor-pointer flex-col border-0 px-5 py-4 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#007700] motion-reduce:transition-none ${
              active ? 'bg-[#F3F8EF]' : 'bg-white hover:bg-stone-50'
            }`}
          >
            {body}
          </button>
        ) : (
          <div key={item.label} className="flex flex-col bg-white px-5 py-4">
            {body}
          </div>
        );
      })}
    </section>
  );
}

function emptyCopy(status: SellerOrderStatusFilter, searching: boolean) {
  if (searching) {
    return {
      title: 'Không tìm thấy đơn nào khớp',
      hint: 'Thử tìm bằng mã đơn, tên người nhận, số điện thoại hoặc mã vận đơn.',
    };
  }
  if (status === 'PENDING_APPROVAL') {
    return {
      title: 'Không có đơn nào chờ duyệt',
      hint: 'Mọi đơn hàng (đơn trong kho và đơn xưởng in) đều đã được duyệt xử lý.',
    };
  }
  if (status === 'POD_ORDERS') {
    return {
      title: 'Chưa có đơn xưởng in nào',
      hint: 'Các đơn hàng in ấn theo yêu cầu (POD) do Printing Shop phụ trách sẽ hiển thị tiến độ tại đây.',
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

  useEffect(() => {
    setFilter(f => (f.search === debouncedSearch ? f : { ...f, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

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
    setDetail(order);
    try {
      const fresh = await sellerOrdersService.getById(order.orderCode);
      setDetail(prev => (prev && prev.orderCode === fresh.orderCode ? fresh : prev));
    } catch {}
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
        void load(filter, true);
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Không cập nhật được trạng thái đơn hàng.'), 'error');
      } finally {
        setSaving(false);
      }
    },
    [detail, pendingAction, filter, load, showToast]
  );

  const handleQuickApprove = useCallback(
    async (order: SellerOrder, e: React.MouseEvent) => {
      e.stopPropagation();
      const isPod = Boolean(order.isPod || order.orderType === 'POD' || order.items.some(it => it.designFileUrl));
      try {
        showToast(`Đang duyệt đơn #${order.orderCode}...`, 'info');
        if (isPod) {
          const res = await sellerOrdersService.dispatchToPrinter(order.orderCode);
          showToast(res.message || 'Đã duyệt đơn và chuyển sang xưởng in!', 'success');
        } else {
          const res = await sellerOrdersService.approveOrder(order.orderCode);
          showToast(res.message || 'Đã duyệt đơn hàng thành công!', 'success');
        }
        void load(filter, true);
      } catch (err: any) {
        showToast(getApiErrorMessage(err, 'Lỗi khi duyệt đơn.'), 'error');
      }
    },
    [filter, load, showToast]
  );

  const searching = Boolean(filter.search.trim());
  const empty = emptyCopy(filter.status, searching);

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="m-0 font-jakarta text-[26px] font-bold tracking-tight text-stone-900">Đơn hàng</h1>
          <p className="mb-0 mt-1.5 text-[13.5px] leading-relaxed text-stone-500">
            {todoCount > 0
              ? `${fmtCount(todoCount)} đơn cần xử lý: nhận sản xuất, đóng gói và bàn giao vận chuyển.`
              : 'Không còn đơn nào chờ xử lý. Đơn mới sẽ hiện ngay tại đây.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loadedAt && !loading && (
            <span className="hidden text-[12px] text-stone-500 sm:inline">Cập nhật {timeAgo(loadedAt)}</span>
          )}
          <button
            type="button"
            onClick={() => void load(filter, true)}
            disabled={refreshing || loading}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 text-[13px] font-semibold text-stone-700 transition duration-150 hover:bg-stone-50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined}
              aria-hidden
            />
            Làm mới
          </button>
        </div>
      </header>

      <KpiStrip
        loading={loading}
        activeFilter={filter.status}
        onFilter={status => setFilter(f => ({ ...f, status, page: 1 }))}
        items={[
          {
            label: 'Chờ xử lý',
            value: fmtCount(todoCount),
            hint: `${fmtCount(data.counts.ORDERED)} đơn mới, ${fmtCount(data.counts.PROCESSING)} đang sản xuất`,
            filter: 'TODO',
            urgent: todoCount > 0,
          },
          {
            label: 'Đang giao',
            value: fmtCount(data.counts.SHIPPING),
            hint: 'Đã bàn giao, chờ khách nhận',
            filter: 'SHIPPING',
          },
          {
            label: 'Tiền đang treo',
            value: compactMoney(data.revenue.pending),
            hint: `${money(data.revenue.pending)} ở các đơn chưa giao xong`,
          },
          {
            label: 'Tiền đã chốt',
            value: compactMoney(data.revenue.settled),
            hint: `${fmtCount(data.counts.DELIVERED)} đơn đã giao thành công`,
            filter: 'DELIVERED',
          },
        ]}
      />

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-900"
        >
          <AlertTriangle size={16} className="mt-px shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Filter & Table Section */}
      <section className="mt-5 flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(41,37,36,0.04)]">
        {/* Status Tabs */}
        <div className="border-b border-stone-100 px-2">
          <StatusTabs
            value={filter.status}
            tabs={tabs}
            onChange={status => setFilter(f => ({ ...f, status, page: 1 }))}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
          <label className="relative min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">Tìm đơn hàng</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, SĐT, mã vận đơn"
              className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-8 text-[13px] text-stone-900 outline-none transition-colors duration-150 placeholder:text-stone-500 focus:border-[#007700] focus:ring-2 focus:ring-[#007700]/15 motion-reduce:transition-none"
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

          <label className="flex items-center gap-2 text-[12.5px] text-stone-500">
            Sắp xếp
            <select
              value={filter.sort}
              onChange={e => setFilter(f => ({ ...f, sort: e.target.value as SellerOrderSort, page: 1 }))}
              className="h-9 cursor-pointer rounded-lg border border-stone-200 bg-white pl-2.5 pr-1.5 text-[13px] font-medium text-stone-800 outline-none focus:border-[#007700] focus:ring-2 focus:ring-[#007700]/15"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Orders Table */}
        <div className={`transition-opacity duration-200 motion-reduce:transition-none ${refreshing ? 'opacity-60' : ''}`}>
          <OrdersTable
            orders={data.items}
            loading={loading}
            onOpen={order => void openDetail(order)}
            onQuickApprove={handleQuickApprove}
            emptyTitle={empty.title}
            emptyHint={empty.hint}
          />
        </div>

        {/* Pagination */}
        <OrdersPagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          disabled={loading || refreshing}
          onPageChange={page => setFilter(f => ({ ...f, page }))}
        />
      </section>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={detail}
        loading={saving}
        onClose={() => {
          setDetail(null);
          setPendingAction(null);
        }}
        onAction={setPendingAction}
        onRefresh={() => void load(filter, true)}
      />

      {/* Update Status Modal */}
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
