import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { refundService, type RefundRequest } from '../../order/services/refundService';
import { AdminRefundDecisionForm } from '../components/refunds/AdminRefundDecisionForm';
import { AdminRefundDetail } from '../components/refunds/AdminRefundDetail';
import { PageHeader, SearchField, SegmentedControl, StatusPill } from '../components/AdminPrimitives';

type Filter = 'ALL' | 'NORMAL' | 'POD';
const REASONS: Record<string, string> = { DAMAGED: 'Hư hỏng', WRONG_DESCRIPTION: 'Không đúng mô tả', PRINT_DEFECT: 'Lỗi in', MISSING_ITEM: 'Thiếu sản phẩm', OTHER: 'Lý do khác' };
const statusText: Record<string, string> = { DISPUTED: 'Chờ Admin', TIMEOUT_ESCALATED: 'Quá SLA', ADMIN_APPROVED: 'Đã chấp thuận', ADMIN_REJECTED: 'Đã từ chối' };

export function AdminRefundRequests() {
  const [items, setItems] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [decisionItem, setDecisionItem] = useState<RefundRequest | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await refundService.adminList()); }
    catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => items.filter(item => {
    const order = typeof item.order_id === 'object' ? item.order_id : null;
    const buyer = typeof item.buyer_id === 'object' ? item.buyer_id : null;
    const query = search.trim().toLowerCase();
    const matchesFilter = filter === 'ALL' || item.product_type === filter;
    const searchable = [order?.order_code, buyer?.full_name, buyer?.email, item.description, item.reason_category, item._id].join(' ').toLowerCase();
    return matchesFilter && (!query || searchable.includes(query));
  }), [items, filter, search]);

  const resolve = async (payload: Parameters<typeof refundService.adminResolve>[1]) => {
    if (!decisionItem) return;
    setBusy(decisionItem._id); setError('');
    try {
      await refundService.adminResolve(decisionItem._id, payload);
      setDecisionItem(null); setSelected(null);
      await load();
    } catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(''); }
  };

  return <div className="p-5 lg:p-8">
    <PageHeader title="Tranh chấp hoàn tiền" description="Danh sách yêu cầu đang chờ Admin phân xử. Chọn một yêu cầu để xem toàn bộ chi tiết và lịch sử trước khi quyết định cuối." actions={<button onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-admin border border-admin-line bg-white px-3 text-sm font-semibold text-admin-ink"><RefreshCw size={15} /> Tải lại</button>} />
    {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><SearchField value={search} onChange={setSearch} placeholder="Tìm mã đơn, Buyer, lý do..." label="Tìm tranh chấp" /><SegmentedControl value={filter} onChange={setFilter} label="Lọc theo loại sản phẩm" options={[{ value: 'ALL', label: 'Tất cả', count: items.length }, { value: 'NORMAL', label: 'Thường', count: items.filter(item => item.product_type === 'NORMAL').length }, { value: 'POD', label: 'POD', count: items.filter(item => item.product_type === 'POD').length }]} /></div>
    <div className="overflow-hidden rounded-xl border border-admin-line bg-admin-surface">
      <div className="border-b border-admin-line px-4 py-3 text-[12.5px] font-semibold text-admin-muted">{loading ? 'Đang tải danh sách…' : `${visibleItems.length} tranh chấp`}</div>
      {loading ? <div className="divide-y divide-admin-line-soft">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-[68px] animate-pulse bg-admin-canvas/50" />)}</div> : visibleItems.length === 0 ? <div className="p-10 text-center"><p className="m-0 font-semibold text-admin-ink">{items.length ? 'Không tìm thấy tranh chấp phù hợp' : 'Chưa có tranh chấp cần xử lý'}</p><p className="mb-0 mt-1 text-sm text-admin-muted">{items.length ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Các dispute cần Admin phân xử sẽ xuất hiện tại đây.'}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-[13px] [&_td]:border-b [&_td]:border-admin-line-soft [&_td]:px-4 [&_td]:py-3 [&_th]:border-b [&_th]:border-admin-line [&_th]:px-4 [&_th]:py-3 [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-admin-muted">
        <thead><tr><th>Đơn hàng / lý do</th><th>Buyer</th><th>Loại</th><th>Yêu cầu</th><th>Trạng thái</th><th><span className="sr-only">Chi tiết</span></th></tr></thead>
        <tbody>{visibleItems.map(item => {
          const order = typeof item.order_id === 'object' ? item.order_id : null;
          const buyer = typeof item.buyer_id === 'object' ? item.buyer_id : null;
          const testOrder = String(order?.order_code || '').startsWith('TEST-REFUND');
          return <tr key={item._id} tabIndex={0} onClick={() => setSelected(item)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(item); } }} className="cursor-pointer hover:bg-admin-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-admin-brand">
            <td><p className="m-0 font-bold text-admin-ink">#{order?.order_code || String(item.order_id).slice(-12)}{testOrder && <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-800">TEST</span>}</p><p className="mb-0 mt-1 max-w-[320px] truncate text-xs text-admin-muted">{REASONS[item.reason_category] || item.reason_category} · {item.description}</p></td>
            <td className="text-admin-ink">{buyer?.full_name || buyer?.email || '—'}</td><td>{item.product_type === 'POD' ? 'POD' : 'Thường'}</td>
            <td className="font-semibold tabular-nums text-admin-ink">{item.refund_type === 'FULL' ? 'Toàn bộ' : `${Number(item.refund_amount || 0).toLocaleString('vi-VN')} ₫`}</td>
            <td><StatusPill tone="warn">{statusText[item.status] || item.status}</StatusPill></td><td className="text-right font-semibold text-admin-brand">Xem chi tiết →</td>
          </tr>;
        })}</tbody>
      </table></div>}
    </div>
    {selected && !decisionItem && <AdminRefundDetail item={selected} onClose={() => setSelected(null)} onDecide={() => setDecisionItem(selected)} />}
    {decisionItem && <AdminRefundDecisionForm item={decisionItem} busy={busy === decisionItem._id} error={error} onClose={() => setDecisionItem(null)} onSubmit={payload => void resolve(payload)} />}
  </div>;
}
