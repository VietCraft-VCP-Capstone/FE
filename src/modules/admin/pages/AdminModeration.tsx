import { useState, useEffect, useCallback } from 'react';
import { EyeOff, FileText, Inbox, Loader2, RotateCcw, Store } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { ModerateProduct, ModerationStats } from '../types';
import {
  BTN_DANGER,
  BTN_DANGER_SOFT_SM,
  BTN_SECONDARY,
  BTN_SECONDARY_SM,
  CARD,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  MODAL_BODY,
  PAGE,
  TABLE,
  TOOLBAR,
  cx,
} from '../components/adminUi';
import {
  Alert,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  SegmentedControl,
  StatusPill,
} from '../components/AdminPrimitives';

type Filter = 'ALL' | 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT';

const STATUS_TONE: Record<ModerateProduct['status'], { label: string; tone: 'brand' | 'danger' | 'neutral' }> = {
  PUBLISHED: { label: 'Đang bán', tone: 'brand' },
  UNPUBLISHED: { label: 'Đã gỡ', tone: 'danger' },
  DRAFT: { label: 'Nháp', tone: 'neutral' },
};

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PUBLISHED', label: 'Đang bán' },
  { value: 'UNPUBLISHED', label: 'Đã gỡ' },
  { value: 'DRAFT', label: 'Nháp' },
];

const EMPTY_COPY: Record<Filter, { title: string; desc: string }> = {
  ALL: { title: 'Chưa có sản phẩm nào', desc: 'Khi người bán đăng sản phẩm, chúng sẽ xuất hiện ở đây.' },
  PUBLISHED: { title: 'Không có sản phẩm đang bán', desc: 'Chưa sản phẩm nào được hiển thị trên marketplace.' },
  UNPUBLISHED: { title: 'Không có sản phẩm bị gỡ', desc: 'Chưa có sản phẩm nào bị gỡ khỏi marketplace.' },
  DRAFT: { title: 'Không có bản nháp', desc: 'Người bán chưa để sản phẩm nào ở trạng thái nháp.' },
};

const THUMB =
  'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-admin-line-soft bg-admin-canvas object-cover text-admin-muted';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function RowSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="divide-y divide-admin-line-soft" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-[18px] py-3">
          <div
            className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-admin-line-soft motion-reduce:animate-none"
            style={{ animationDelay: `${i * 60}ms` }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-3.5 w-[32%] animate-pulse rounded bg-admin-line-soft motion-reduce:animate-none" />
            <div className="h-3 w-[54%] animate-pulse rounded bg-admin-line-soft motion-reduce:animate-none" />
          </div>
          <div className="h-3.5 w-[140px] shrink-0 animate-pulse rounded bg-admin-line-soft motion-reduce:animate-none" />
          <div className="h-5 w-[84px] shrink-0 animate-pulse rounded-full bg-admin-line-soft motion-reduce:animate-none" />
          <div className="h-8 w-[104px] shrink-0 animate-pulse rounded-admin bg-admin-line-soft motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

export function AdminModeration() {
  const [stats, setStats] = useState<ModerationStats>({ published: 0, unpublished: 0, draft: 0, total: 0 });
  const [products, setProducts] = useState<ModerateProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<ModerateProduct | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');

  const closeReasonDialog = useCallback(() => setReasonFor(null), []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const [productsData, statsData] = await Promise.all([
        adminService.getProducts(status, page, limit),
        adminService.getModerationStats(),
      ]);
      setProducts(productsData.items);
      setTotal(productsData.total);
      setTotalPages(productsData.totalPages);
      if (productsData.page !== page) setPage(productsData.page);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, filter, limit]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [filter]);

  const confirmUnpublish = async () => {
    if (!reasonFor) return;
    setProcessing(reasonFor.id);
    try {
      await adminService.unpublishProduct(reasonFor.id, reason || undefined);
      setSuccess(`Đã gỡ: "${reasonFor.title}"`);
      setError('');
      setWarning('');
      setReason('');
      setReasonFor(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gỡ sản phẩm thất bại');
    } finally {
      setProcessing(null);
    }
  };

  const handleRepublish = async (product: ModerateProduct) => {
    setProcessing(product.id);
    try {
      const { warnings } = await adminService.republishProduct(product.id);
      setError('');
      if (warnings.length > 0) {
        setSuccess('');
        setWarning(`Đã khôi phục "${product.title}", nhưng tin đăng còn thiếu: ${warnings.join('; ')}`);
      } else {
        setWarning('');
        setSuccess(`Đã khôi phục: "${product.title}"`);
      }
      loadData();
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.errors ? `Không thể khôi phục: ${data.errors.join('; ')}` : (data?.error || 'Khôi phục thất bại'));
    } finally {
      setProcessing(null);
    }
  };

  const rangeFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const countFor = (key: Filter) =>
    key === 'ALL' ? stats.total : key === 'PUBLISHED' ? stats.published : key === 'UNPUBLISHED' ? stats.unpublished : stats.draft;

  const empty = EMPTY_COPY[filter];

  return (
    <div className={PAGE}>
      {/* Header Section */}
      <PageHeader
        title="Kiểm duyệt sản phẩm"
        description="Sản phẩm được đăng bán ngay, không chờ duyệt trước. Ở đây bạn gỡ sản phẩm vi phạm và khôi phục khi người bán đã sửa."
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert tone="success" onDismiss={() => setSuccess('')}>{success}</Alert>}
      {warning && <Alert tone="warn" onDismiss={() => setWarning('')}>{warning}</Alert>}

      {/* Filter Toolbar Section */}
      <div className={TOOLBAR}>
        <SegmentedControl
          label="Lọc theo trạng thái"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map(f => ({ ...f, count: countFor(f.value) }))}
        />
      </div>

      {/* Product Moderation Table Section */}
      <div className={CARD}>
        {loading ? (
          <RowSkeleton />
        ) : products.length === 0 ? (
          <EmptyState icon={Inbox} title={empty.title} description={empty.desc} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={cx(TABLE, 'min-w-[940px] table-fixed')}>
                <caption className="sr-only">Danh sách sản phẩm theo trạng thái kiểm duyệt</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-[56px]">#</th>
                    <th scope="col">Sản phẩm</th>
                    <th scope="col" className="w-[210px]">Gian hàng</th>
                    <th scope="col" className="w-[120px]">Ngày đăng</th>
                    <th scope="col" className="w-[220px]">Trạng thái</th>
                    <th scope="col" className="w-[152px] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, i) => {
                    const badge = STATUS_TONE[product.status] ?? STATUS_TONE.DRAFT;
                    const busy = processing === product.id;
                    return (
                      <tr key={product.id}>
                        <td className="tabular-nums text-admin-muted">{rangeFrom + i}</td>
                        <td>
                          <div className="flex items-center gap-3.5">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" loading="lazy" className={THUMB} />
                            ) : (
                              <div className={THUMB}><FileText size={17} aria-hidden /></div>
                            )}
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate font-semibold text-admin-ink">{product.title}</span>
                              <span className="truncate text-[12.5px] text-admin-muted">{product.description}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="flex items-center gap-1.5 text-[13px] text-admin-body">
                            <Store size={14} className="shrink-0 text-admin-muted" aria-hidden />
                            <span className="truncate">{product.shop_name}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-[13px] tabular-nums text-admin-muted">
                          {formatDate(product.created_at)}
                        </td>
                        <td>
                          <div className="flex flex-col items-start gap-1">
                            <StatusPill tone={badge.tone}>{badge.label}</StatusPill>
                            {product.status === 'UNPUBLISHED' && product.unpublish_reason && (
                              <span
                                className="max-w-full truncate text-[11.5px] leading-[1.4] text-admin-muted"
                                title={product.unpublish_reason}
                              >
                                {product.unpublish_reason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end">
                            {product.status === 'PUBLISHED' ? (
                              <button
                                type="button"
                                className={BTN_DANGER_SOFT_SM}
                                onClick={() => { setReasonFor(product); setReason(''); }}
                                disabled={busy}
                                aria-label={`Gỡ sản phẩm ${product.title}`}
                              >
                                {busy ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <EyeOff size={14} aria-hidden />}
                                Gỡ khỏi sàn
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={BTN_SECONDARY_SM}
                                onClick={() => handleRepublish(product)}
                                disabled={busy}
                                aria-label={`Khôi phục sản phẩm ${product.title}`}
                              >
                                {busy ? <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <RotateCcw size={14} aria-hidden />}
                                Khôi phục
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              itemLabel="sản phẩm"
              onPageChange={setPage}
              limitOptions={[10, 15, 30, 50]}
              onLimitChange={n => {
                setLimit(n);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {/* Unpublish Reason Modal Section */}

      <Modal
        open={reasonFor !== null}
        onClose={closeReasonDialog}
        title="Gỡ sản phẩm khỏi sàn"
        description={reasonFor?.title}
        maxWidth="480px"
        footer={
          <>
            <button type="button" className={BTN_SECONDARY} onClick={closeReasonDialog}>Huỷ</button>
            <button
              type="button"
              className={BTN_DANGER}
              onClick={confirmUnpublish}
              disabled={processing === reasonFor?.id}
            >
              {processing === reasonFor?.id
                ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />
                : <EyeOff size={16} aria-hidden />}
              Xác nhận gỡ
            </button>
          </>
        }
      >
        <div className={MODAL_BODY}>
          <p className="mb-3 mt-0 text-[12.5px] leading-[1.55] text-admin-muted">
            Sản phẩm bị ẩn khỏi marketplace ngay lập tức. Người bán nhận được thông báo kèm lý do bạn ghi dưới đây.
          </p>
          <label className={FIELD_LABEL} htmlFor="unpublish-reason">Lý do gỡ (tuỳ chọn)</label>
          <textarea
            id="unpublish-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Ví dụ: hình ảnh không phù hợp, mô tả sai lệch về chất liệu..."
            className={cx(FIELD, 'resize-y')}
          />
          <p className={FIELD_HINT}>Bỏ trống thì người bán chỉ thấy thông báo chung, không biết cần sửa gì.</p>
        </div>
      </Modal>
    </div>
  );
}
