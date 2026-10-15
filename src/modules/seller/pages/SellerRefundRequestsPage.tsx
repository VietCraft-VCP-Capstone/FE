import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Eye, RefreshCw, Search, ShieldCheck } from 'lucide-react';

import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { refundService, type RefundRequest, type RefundStatus } from '../../order/services/refundService';
import { useToast } from '../../../shared/components/Toast';
import { timeAgo } from '../../../shared/utils/format';
import { SellerAntd } from '../components/SellerAntd';
import { SellerRefundRequestDrawer } from '../components/refunds/SellerRefundRequestDrawer';
import { filterRefundRequests } from '../components/refunds/filterRefundRequests';
import {
  EXECUTION_LABEL,
  REASON_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  buyerOf,
  dateTimeText,
  deadlineOf,
  executionOf,
  orderOf,
  refundAmountText,
} from '../components/refunds/refundMeta';

const TABS: { value: 'ALL' | RefundStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' }, { value: 'PENDING_SELLER', label: 'Chờ xử lý' },
  { value: 'PENDING_PRINTER', label: 'Chờ xưởng in' }, { value: 'PRINTER_REJECTED', label: 'Xưởng in từ chối' }, { value: 'PRINTER_APPROVED', label: 'Xưởng in chấp thuận' }, { value: 'DISPUTED', label: 'Tranh chấp' },
  { value: 'SELLER_APPROVED', label: 'Đã duyệt' }, { value: 'SELLER_REJECTED', label: 'Đã từ chối' },
  { value: 'TIMEOUT_ESCALATED', label: 'Quá hạn' },
];

export function SellerRefundRequestsPage() {
  const [items, setItems] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'ALL' | RefundStatus>('ALL');
  const [search, setSearch] = useState('');
  // Giữ id thay vì cả bản ghi: tải lại danh sách thì ngăn chi tiết tự hiện dữ liệu mới.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError('');
    try { setItems(await refundService.sellerList('ALL')); }
    catch (cause) { setError(getApiErrorMessage(cause, 'Không tải được yêu cầu hoàn tiền.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => filterRefundRequests(items, status, search), [items, status, search]);
  const selected = useMemo(() => items.find(item => item._id === selectedId) || null, [items, selectedId]);
  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const item of items) byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    return byStatus;
  }, [items]);
  const pendingCount = items.filter(item => item.product_type === 'NORMAL' && item.status === 'PENDING_SELLER').length;
  const disputeCount = (counts.DISPUTED || 0) + (counts.TIMEOUT_ESCALATED || 0);
  const unpaidCount = items.filter(item => { const e = executionOf(item); return e === 'FAILED' || e === 'NOT_STARTED'; }).length;

  const columns: ColumnsType<RefundRequest> = [
    {
      title: 'Đơn hàng',
      key: 'order',
      width: 230,
      render: (_, item) => (
        <div className="min-w-0">
          <div className="text-[13px] font-semibold tabular-nums tracking-tight text-stone-900">#{orderOf(item)?.order_code || String(item.order_id).slice(-10)}</div>
          <Tag className="mt-1" variant="filled">{item.product_type === 'POD' ? 'POD' : 'Sản phẩm thường'}</Tag>
        </div>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'buyer',
      width: 200,
      render: (_, item) => {
        const buyer = buyerOf(item);
        return (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-stone-900">{buyer?.full_name || buyer?.name || 'Người mua'}</div>
            {buyer?.email && <div className="truncate text-[12px] text-stone-500">{buyer.email}</div>}
          </div>
        );
      },
    },
    {
      title: 'Lý do',
      key: 'reason',
      render: (_, item) => (
        <div className="min-w-0 max-w-[280px]">
          <div className="text-[13px] font-medium text-stone-900">{REASON_LABEL[item.reason_category] || item.reason_category}</div>
          <div className="truncate text-[12px] text-stone-500" title={item.description}>{item.description}</div>
        </div>
      ),
    },
    {
      title: 'Mức hoàn',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (_, item) => <span className="text-[13px] font-semibold tabular-nums text-stone-900">{refundAmountText(item)}</span>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 170,
      render: (_, item) => {
        const execution = executionOf(item);
        return (
          <div className="flex flex-col items-start gap-1">
            <Tag color={STATUS_COLOR[item.status] || 'default'} className="m-0">{STATUS_LABEL[item.status] || item.status}</Tag>
            {execution && (
              <Tooltip title={item.execution_error}>
                <span className={`text-[12px] ${execution === 'FAILED' || execution === 'NOT_STARTED' ? 'font-medium text-red-700' : 'text-stone-500'}`}>
                  {EXECUTION_LABEL[execution]}
                </span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: 'Hạn phản hồi',
      key: 'deadline',
      width: 150,
      render: (_, item) => {
        const { date, overdue } = deadlineOf(item);
        return (
          <div className={`text-[12.5px] tabular-nums ${overdue ? 'font-semibold text-red-700' : 'text-stone-700'}`}>
            {dateTimeText(date)}
            {overdue && <div className="text-[12px] font-medium">Đã quá hạn</div>}
          </div>
        );
      },
    },
    {
      title: 'Gửi lúc',
      key: 'created',
      width: 120,
      align: 'right',
      render: (_, item) => (
        <div title={dateTimeText(item.created_at)}>
          <div className="whitespace-nowrap text-[12.5px] text-stone-700">{timeAgo(item.created_at)}</div>
          <div className="text-[12px] tabular-nums text-stone-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</div>
        </div>
      ),
    },
    {
      title: <span className="sr-only">Thao tác</span>,
      key: 'action',
      width: 90,
      align: 'right',
      fixed: 'right',
      render: (_, item) => (
        <Button
          size="small"
          icon={<Eye size={14} />}
          onClick={event => { event.stopPropagation(); setSelectedId(item._id); }}
        >
          Xem
        </Button>
      ),
    },
  ];

  const kpis = [
    { label: 'Tổng yêu cầu', value: items.length, hint: 'Mọi trạng thái' },
    { label: 'Chờ bạn xử lý', value: pendingCount, hint: 'Đơn thường cần quyết định', urgent: pendingCount > 0 },
    { label: 'Tranh chấp / quá hạn', value: disputeCount, hint: 'Đang chờ quản trị viên' },
    { label: 'Chưa hoàn được tiền', value: unpaidCount, hint: 'Đã duyệt nhưng chuyển tiền lỗi', alert: unpaidCount > 0 },
  ];

  return (
    <SellerAntd>
      <main className="mx-auto w-full max-w-[1600px]">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="m-0 font-jakarta text-[26px] font-bold tracking-tight text-stone-900">Trả hàng / Hoàn tiền</h1>
            <p className="mb-0 mt-1.5 text-[13.5px] leading-relaxed text-stone-500">
              Xem bằng chứng và quyết định yêu cầu của khách. Đơn POD do xưởng in xử lý, bạn theo dõi trạng thái.
            </p>
          </div>
          <Button icon={<RefreshCw size={15} className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined} />} onClick={() => void load(true)} disabled={loading || refreshing}>
            Làm mới
          </Button>
        </header>

        <section aria-label="Tổng quan yêu cầu" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 lg:grid-cols-4">
          {kpis.map(kpi => (
            <div key={kpi.label} className="flex flex-col bg-white px-5 py-4">
              <span className="text-[12.5px] font-medium text-stone-500">{kpi.label}</span>
              <span className={`mt-1 text-[26px] font-bold leading-none tracking-tight tabular-nums ${kpi.alert ? 'text-red-700' : kpi.urgent ? 'text-[#007700]' : 'text-stone-900'}`}>
                {loading ? <span className="block h-7 w-12 animate-pulse rounded-md bg-stone-100 motion-reduce:animate-none" /> : kpi.value}
              </span>
              <span className="mt-2 text-[12px] text-stone-500">{kpi.hint}</span>
            </div>
          ))}
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(41,37,36,0.04)]">
          <div className="border-b border-stone-100 px-2">
            <div role="tablist" aria-label="Lọc yêu cầu theo trạng thái" className="-mb-px flex gap-0.5 overflow-x-auto [scrollbar-width:none]">
              {TABS.map(tab => {
                const active = status === tab.value;
                const count = tab.value === 'ALL' ? items.length : counts[tab.value] || 0;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatus(tab.value)}
                    className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-0 border-b-2 bg-transparent px-3 pb-3 pt-3.5 text-[13px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#007700] motion-reduce:transition-none ${
                      active ? 'border-b-[#007700] font-semibold text-stone-900' : 'border-b-transparent font-medium text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-[12px] font-semibold tabular-nums ${active ? 'text-[#007700]' : count > 0 ? 'text-stone-500' : 'text-stone-300'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
            <Input
              allowClear
              value={search}
              onChange={event => setSearch(event.target.value)}
              prefix={<Search size={15} className="text-stone-400" />}
              placeholder="Tìm mã đơn, tên hoặc email khách, nội dung"
              className="max-w-sm"
              aria-label="Tìm yêu cầu hoàn tiền"
            />
            <span className="text-[12.5px] tabular-nums text-stone-500">{visible.length} yêu cầu</span>
          </div>

          {error && (
            <div role="alert" className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-800">
              {error}
              <Button size="small" onClick={() => void load()}>Thử lại</Button>
            </div>
          )}

          <Table<RefundRequest>
            rowKey="_id"
            columns={columns}
            dataSource={visible}
            loading={loading}
            scroll={{ x: 1180 }}
            pagination={{ pageSize: 10, hideOnSinglePage: true, showSizeChanger: false }}
            rowClassName={() => 'cursor-pointer'}
            onRow={item => ({ onClick: () => setSelectedId(item._id) })}
            locale={{
              emptyText: (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500"><ShieldCheck size={22} aria-hidden /></span>
                  <p className="mb-0 mt-4 text-sm font-semibold text-stone-900">
                    {search ? 'Không tìm thấy yêu cầu phù hợp' : status === 'ALL' ? 'Chưa có yêu cầu hoàn tiền' : 'Không có yêu cầu ở trạng thái này'}
                  </p>
                  <p className="mb-0 mt-1 max-w-md text-[13px] leading-relaxed text-stone-500">
                    {search ? 'Thử từ khóa khác hoặc xóa ô tìm kiếm.' : 'Yêu cầu mới của khách sẽ hiện ở đây. Bấm Làm mới nếu vừa nhận được thông báo.'}
                  </p>
                </div>
              ),
            }}
          />
        </section>

        <SellerRefundRequestDrawer
          item={selected}
          open={Boolean(selected)}
          onClose={() => setSelectedId(null)}
          onUpdated={message => { showToast(message); void load(true); }}
        />
      </main>
    </SellerAntd>
  );
}

export default SellerRefundRequestsPage;
