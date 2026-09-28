import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { refundService, type RefundRequest, type RefundStatus } from '../../order/services/refundService';
import { useToast } from '../../../shared/components/Toast';
import { SellerRefundRequestCard } from '../components/refunds/SellerRefundRequestCard';
import { filterRefundRequests } from '../components/refunds/filterRefundRequests';

const TABS: { value: 'ALL' | RefundStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' }, { value: 'PENDING_SELLER', label: 'Chờ xử lý' },
  { value: 'PENDING_PRINTER', label: 'Chờ Printer' }, { value: 'DISPUTED', label: 'Tranh chấp' },
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
  const { showToast } = useToast();
  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError('');
    try { setItems(await refundService.sellerList('ALL')); }
    catch (cause) { setError(getApiErrorMessage(cause, 'Không tải được yêu cầu hoàn tiền.')); }
    finally { setLoading(false); setRefreshing(false); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => filterRefundRequests(items, status, search), [items, status, search]);
  const pendingCount = items.filter(item => item.status === 'PENDING_SELLER').length;
  const disputeCount = items.filter(item => item.status === 'DISPUTED' || item.status === 'TIMEOUT_ESCALATED').length;

  return <main className="mx-auto w-full max-w-[1500px] space-y-5 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E2] text-[#007700]"><ShieldCheck size={20} /></span><h1 className="m-0 text-2xl font-extrabold tracking-tight text-stone-900">Trả hàng / Hoàn tiền</h1></div><p className="mb-0 mt-2 max-w-[68ch] text-sm leading-relaxed text-stone-600">Xem yêu cầu, bằng chứng và hạn phản hồi. Với đơn POD, hãy phân loại trách nhiệm trước khi quyết định.</p></div>
      <button type="button" onClick={() => void load(true)} disabled={loading || refreshing} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Làm mới</button>
    </header>

    <section aria-label="Tổng quan yêu cầu" className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-stone-200 bg-white p-4"><p className="m-0 text-xs font-semibold text-stone-500">Tổng yêu cầu</p><p className="mb-0 mt-2 text-2xl font-extrabold text-stone-900">{items.length}</p></div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="m-0 text-xs font-semibold text-amber-900">Chờ bạn xử lý</p><p className="mb-0 mt-2 text-2xl font-extrabold text-amber-950">{pendingCount}</p></div>
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4"><p className="m-0 text-xs font-semibold text-indigo-900">Tranh chấp / quá hạn</p><p className="mb-0 mt-2 text-2xl font-extrabold text-indigo-950">{disputeCount}</p></div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 px-4 pt-3"><div role="tablist" aria-label="Lọc yêu cầu theo trạng thái" className="flex gap-1 overflow-x-auto">{TABS.map(tab => <button key={tab.value} type="button" role="tab" aria-selected={status === tab.value} onClick={() => setStatus(tab.value)} className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] ${status === tab.value ? 'border-[#007700] text-[#007700]' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>{tab.label}</button>)}</div></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4"><label className="relative min-w-0 flex-1 sm:max-w-md"><span className="sr-only">Tìm yêu cầu</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm mã đơn, tên/email khách, nội dung..." className="h-11 w-full rounded-xl border border-stone-200 pl-9 pr-3 text-sm outline-none focus:border-[#007700] focus:ring-2 focus:ring-emerald-100" /></label><span className="text-xs text-stone-500">{visible.length} yêu cầu</span></div>
      {error && <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}<button type="button" onClick={() => void load()} className="ml-3 underline">Thử lại</button></div>}
      {loading ? <div className="space-y-3 p-5" aria-label="Đang tải">{[0, 1, 2].map(key => <div key={key} className="h-40 animate-pulse rounded-xl bg-stone-100" />)}</div> : visible.length ? <div className="space-y-4 bg-stone-50/60 p-4 sm:p-5">{visible.map(item => <SellerRefundRequestCard key={item._id} item={item} onUpdated={() => { showToast('Đã cập nhật yêu cầu.'); void load(true); }} />)}</div> : !error && <div className="flex flex-col items-center px-6 py-14 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500"><ShieldCheck size={22} /></span><h2 className="mb-0 mt-4 text-base font-bold text-stone-900">{search ? 'Không tìm thấy yêu cầu phù hợp' : status === 'ALL' ? 'Chưa có yêu cầu hoàn tiền' : 'Không có yêu cầu ở trạng thái này'}</h2><p className="mb-0 mt-1 max-w-md text-sm leading-relaxed text-stone-600">{search ? 'Thử từ khóa khác hoặc xóa ô tìm kiếm.' : 'Yêu cầu mới của khách hàng sẽ xuất hiện tại đây. Hãy làm mới nếu vừa nhận được thông báo.'}</p></div>}
    </section>
  </main>;
}
