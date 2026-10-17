import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpDown,
  Check,
  Clock,
  Loader2,
  Pencil,
  Plus,
  SearchX,
  Tags,
  Trash2,
  RotateCcw,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { Paginated, Tag, TagStats } from '../types';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  CARD_HEADER,
  FIELD,
  FIELD_GROUP,
  FIELD_HINT,
  FIELD_LABEL,
  ICON_BTN,
  ICON_BTN_DANGER,
  MODAL_BODY,
  MONO,
  PAGE,
  TABLE,
  TOOLBAR,
  cx,
} from '../components/adminUi';
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  SearchField,
  SkeletonRows,
  StatStrip,
  StatusPill,
} from '../components/AdminPrimitives';

const PRESET_COLORS = [
  '#1a6b1a', '#2563eb', '#dc2626', '#9333ea',
  '#ea580c', '#ca8a04', '#0891b2', '#64748b',
  '#4d7c0f', '#e11d48', '#7c3aed', '#1d4ed8',
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function readableTextOn(hex: string): string {
  if (!HEX_RE.test(hex)) return '#ffffff';
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.45 ? '#16211a' : '#ffffff';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function TagChip({ name, color }: { name: string; color: string }) {
  const safe = HEX_RE.test(color) ? color : '#64748b';
  return (
    <span
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none"
      style={{ backgroundColor: safe, color: readableTextOn(safe) }}
    >
      <span className="truncate">{name || 'Tên thẻ'}</span>
    </span>
  );
}

function TagColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [draft, setDraft] = useState(color);
  const valid = HEX_RE.test(draft);

  useEffect(() => setDraft(color), [color]);

  const commit = (v: string) => {
    const next = v.startsWith('#') ? v : `#${v}`;
    setDraft(next);
    if (HEX_RE.test(next)) onChange(next.toLowerCase());
  };

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {PRESET_COLORS.map(c => {
          const active = c.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`Chọn màu ${c}`}
              aria-pressed={active}
              className={cx(
                'h-7 w-7 cursor-pointer rounded-lg border-2 p-0 transition-[border-color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand motion-reduce:transition-none',
                active
                  ? 'border-admin-ink shadow-[inset_0_0_0_2px_#fff]'
                  : 'border-transparent hover:shadow-[0_0_0_2px_rgba(16,33,26,0.14)]'
              )}
              style={{ backgroundColor: c }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? draft : '#64748b'}
          onChange={e => commit(e.target.value)}
          aria-label="Bộ chọn màu tuỳ ý"
          className="h-[38px] w-[46px] shrink-0 cursor-pointer rounded-admin border border-[#d5ddd5] bg-white p-1"
        />
        <input
          type="text"
          value={draft}
          onChange={e => commit(e.target.value)}
          onBlur={() => !valid && setDraft(color)}
          placeholder="#1a6b1a"
          maxLength={7}
          aria-label="Mã màu hex"
          aria-invalid={!valid}
          className={cx(FIELD, MONO, 'uppercase', !valid && 'border-admin-danger')}
        />
      </div>
      {!valid && <p className="mt-1.5 text-[12px] font-medium text-admin-danger">Mã màu phải có dạng #rrggbb.</p>}
    </div>
  );
}

/* =============================================================== trang === */

type SortKey = 'name' | 'products';

const EMPTY_STATS: TagStats = { total: 0, pending: 0, tagged: 0, unused: 0 };
const emptyPage = (limit: number): Paginated<Tag> => ({ items: [], total: 0, page: 1, limit, totalPages: 1 });

export function AdminTags() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pendingPageNo, setPendingPageNo] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('products');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [result, setResult] = useState<Paginated<Tag>>(emptyPage(20));
  const [pending, setPending] = useState<Paginated<Tag>>(emptyPage(8));
  const [stats, setStats] = useState<TagStats>(EMPTY_STATS);

  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#1a6b1a', slug: '' });
  const [slugTouched, setSlugTouched] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);
  const [pendingReject, setPendingReject] = useState<Tag | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [queueBusyId, setQueueBusyId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [rejected, setRejected] = useState<Paginated<Tag>>(emptyPage(8));
  const [rejectedPageNo, setRejectedPageNo] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadList = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await adminService.getTags({ page, limit, search: debouncedSearch.trim() || undefined, sort: sortKey });
      setResult(data);
      if (data.page !== page) setPage(data.page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải thẻ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch, sortKey]);

  const loadPending = useCallback(async () => {
    try {
      const data = await adminService.getPendingTags({ page: pendingPageNo });
      setPending(data);
      if (data.page !== pendingPageNo) setPendingPageNo(data.page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải thẻ chờ duyệt');
    }
  }, [pendingPageNo]);

  const loadRejected = useCallback(async () => {
    try {
      const data = await adminService.getRejectedTags({ page: rejectedPageNo });
      setRejected(data);
      if (data.page !== rejectedPageNo) setRejectedPageNo(data.page);
    } catch {
      // bỏ qua lỗi
    }
  }, [rejectedPageNo]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminService.getTagStats());
    } catch {
      setStats(EMPTY_STATS);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { loadRejected(); }, [loadRejected]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => { setPage(1); }, [debouncedSearch, sortKey]);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadList(), loadPending(), loadRejected(), loadStats()]);
  }, [loadList, loadPending, loadRejected, loadStats]);

  const handleApproveTag = async (tag: Tag) => {
    setQueueBusyId(tag._id);
    setError('');
    try {
      await adminService.approveTag(tag._id);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Duyệt thất bại');
    } finally {
      setQueueBusyId(null);
    }
  };

  const confirmReject = async () => {
    if (!pendingReject) return;
    setDialogBusy(true);
    setError('');
    try {
      await adminService.rejectProposedTag(pendingReject._id, rejectReason.trim() || undefined);
      setPendingReject(null);
      setRejectReason('');
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Từ chối thất bại');
      setPendingReject(null);
    } finally {
      setDialogBusy(false);
    }
  };

  const handleRestoreTag = async (tag: Tag) => {
    setQueueBusyId(tag._id);
    setError('');
    try {
      await adminService.restoreTag(tag._id);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Khôi phục thẻ thất bại');
    } finally {
      setQueueBusyId(null);
    }
  };

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({ name: '', color: '#1a6b1a', slug: '' });
    setSlugTouched(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color, slug: tag.slug });
    setSlugTouched(true);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setError('');
    try {
      const payload = { name: formData.name.trim(), color: formData.color };
      if (editingTag) {
        await adminService.updateTag(editingTag._id, payload);
      } else {
        await adminService.createTag(payload);
      }
      setShowModal(false);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDialogBusy(true);
    setError('');
    try {
      await adminService.deleteTag(pendingDelete._id);
      setPendingDelete(null);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xoá thất bại');
      setPendingDelete(null);
    } finally {
      setDialogBusy(false);
    }
  };

  const filtering = debouncedSearch.trim() !== '';
  const previewSlug = formData.slug || slugify(formData.name);
  const rowOffset = (result.page - 1) * result.limit;

  return (
    <div className={PAGE}>
      {/* Page Header Section */}
      <PageHeader
        title="Thẻ"
        description="Thẻ mô tả chất liệu, kỹ thuật và phong cách sản phẩm. Người bán có thể đề xuất thẻ mới — thẻ chỉ công khai sau khi được duyệt."
        actions={
          <button type="button" className={BTN_PRIMARY} onClick={openCreateModal}>
            <Plus size={17} aria-hidden /> Thêm thẻ
          </button>
        }
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

      {/* Tag Statistics Section */}
      <StatStrip
        loading={loading}
        items={[
          { label: 'Thẻ đã duyệt', value: stats.total },
          { label: 'Chờ duyệt', value: stats.pending, dot: stats.pending > 0 ? '#ea580c' : '#cbd5d0' },
          { label: 'Lượt gắn sản phẩm', value: stats.tagged },
          { label: 'Chưa dùng', value: stats.unused, dot: '#cbd5d0' },
        ]}
      />

      {/* Tab Navigation */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-admin-line">
        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={cx(
            'flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-bold transition-all border-b-2 -mb-[2px] cursor-pointer',
            activeTab === 'approved'
              ? 'border-admin-brand text-admin-brand bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-admin-muted hover:text-admin-ink'
          )}
        >
          <Tags size={16} />
          <span>Thẻ đã duyệt</span>
          <span
            className={cx(
              'ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
              activeTab === 'approved' ? 'bg-admin-brand text-white' : 'bg-stone-100 text-stone-600'
            )}
          >
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={cx(
            'flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-bold transition-all border-b-2 -mb-[2px] cursor-pointer',
            activeTab === 'pending'
              ? 'border-[#ea580c] text-[#ea580c] bg-orange-50/50 rounded-t-lg'
              : 'border-transparent text-admin-muted hover:text-admin-ink'
          )}
        >
          <Clock size={16} />
          <span>Chờ xem xét</span>
          {stats.pending > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ea580c] text-white animate-pulse">
              {stats.pending}
            </span>
          ) : (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600">
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={cx(
            'flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-bold transition-all border-b-2 -mb-[2px] cursor-pointer',
            activeTab === 'rejected'
              ? 'border-rose-600 text-rose-700 bg-rose-50/50 rounded-t-lg'
              : 'border-transparent text-admin-muted hover:text-admin-ink'
          )}
        >
          <Ban size={16} />
          <span>Đã từ chối / Cấm</span>
          <span
            className={cx(
              'ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
              activeTab === 'rejected' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600'
            )}
          >
            {stats.rejected || rejected.total}
          </span>
        </button>
      </div>

      {/* TAB 1: THẺ ĐÃ DUYỆT */}
      {activeTab === 'approved' && (
        <>
          {/* Search and Sort Toolbar Section */}
          <div className={TOOLBAR}>
            <SearchField label="Tìm kiếm thẻ" placeholder="Tìm theo tên hoặc slug..." value={search} onChange={setSearch} />
            <button
              type="button"
              className={cx(BTN_SECONDARY, 'shrink-0')}
              onClick={() => setSortKey(k => (k === 'products' ? 'name' : 'products'))}
              aria-label={`Đang sắp xếp theo ${sortKey === 'products' ? 'số sản phẩm' : 'tên thẻ'}. Bấm để đổi.`}
            >
              <ArrowUpDown size={15} aria-hidden />
              {sortKey === 'products' ? 'Nhiều sản phẩm nhất' : 'Theo tên A–Z'}
            </button>
          </div>

          {/* Approved Tags Table Section */}
          <div className={CARD}>
            <div className={CARD_HEADER}>
              <span className="text-[12.5px] font-semibold text-admin-muted">
                {loading ? 'Đang tải…' : filtering ? `${result.total} kết quả` : `${stats.total} thẻ đã duyệt`}
              </span>
            </div>

            {loading ? (
              <SkeletonRows rows={7} columns={['28px', '30%', '22%', '84px', '112px']} />
            ) : result.items.length === 0 ? (
              filtering ? (
                <EmptyState
                  icon={SearchX}
                  title="Không có thẻ nào khớp"
                  description={`Không tìm thấy thẻ nào chứa “${debouncedSearch.trim()}”.`}
                  action={
                    <button type="button" className={BTN_SECONDARY} onClick={() => setSearch('')}>
                      Xoá từ khoá
                    </button>
                  }
                />
              ) : (
                <EmptyState
                  icon={Tags}
                  title="Chưa có thẻ nào"
                  description="Thẻ giúp người mua lọc sản phẩm theo chất liệu và kỹ thuật. Tạo vài thẻ phổ biến để bắt đầu."
                  action={
                    <button type="button" className={BTN_PRIMARY} onClick={openCreateModal}>
                      <Plus size={17} aria-hidden /> Tạo thẻ đầu tiên
                    </button>
                  }
                />
              )
            ) : (
              <>
                <div className={cx('overflow-x-auto transition-opacity duration-150 motion-reduce:transition-none', refreshing && 'opacity-55')}>
                  <table className={cx(TABLE, 'min-w-[860px] table-fixed')} aria-busy={refreshing}>
                    <caption className="sr-only">Danh sách thẻ đã duyệt</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="w-[56px]">
                          STT
                        </th>
                        <th scope="col">Thẻ</th>
                        <th scope="col" className="w-[260px]">Slug</th>
                        <th scope="col" className="w-[130px]">Màu</th>
                        <th scope="col" className="w-[130px] text-right">
                          Sản phẩm
                        </th>
                        <th scope="col" className="w-[116px] text-right">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((tag, i) => (
                        <tr key={tag._id} className="group">
                          <td className="tabular-nums text-admin-muted">{rowOffset + i + 1}</td>
                          <td>
                            <TagChip name={tag.name} color={tag.color} />
                          </td>
                          <td className={cx('truncate text-[12.5px] text-admin-muted', MONO)} title={tag.slug}>
                            {tag.slug}
                          </td>
                          <td className={cx('text-[12.5px] uppercase text-admin-muted', MONO)}>{tag.color}</td>
                          <td className="text-right">
                            {tag.product_count ? (
                              <span className="font-semibold tabular-nums text-admin-ink">{tag.product_count}</span>
                            ) : (
                              <StatusPill tone="neutral">Chưa dùng</StatusPill>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-70 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none">
                              <button
                                type="button"
                                className={ICON_BTN}
                                onClick={() => openEditModal(tag)}
                                aria-label={`Sửa thẻ ${tag.name}`}
                                title="Sửa"
                              >
                                <Pencil size={15} aria-hidden />
                              </button>
                              <button
                                type="button"
                                className={ICON_BTN_DANGER}
                                onClick={() => setPendingDelete(tag)}
                                aria-label={`Xoá thẻ ${tag.name}`}
                                title="Xoá"
                              >
                                <Trash2 size={15} aria-hidden />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  total={result.total}
                  limit={result.limit}
                  itemLabel="thẻ"
                  disabled={refreshing}
                  onPageChange={setPage}
                  limitOptions={[10, 20, 50, 100]}
                  onLimitChange={n => {
                    setLimit(n);
                    setPage(1);
                  }}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* TAB 2: CHỜ XEM XÉT */}
      {activeTab === 'pending' && (
        <div className={CARD}>
          <div className={CARD_HEADER}>
            <div>
              <span className="text-[13px] font-bold text-admin-ink">
                Hàng đợi kiểm duyệt thẻ đề xuất ({pending.total})
              </span>
              <p className="m-0 mt-0.5 text-[12px] text-admin-muted">
                Thẻ do người bán đề xuất trong lúc tạo sản phẩm. Bạn có thể duyệt để chuyển thành thẻ chính thức hoặc Từ chối / Cấm.
              </p>
            </div>
          </div>

          {pending.items.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Không có thẻ nào chờ duyệt"
              description="Tất cả các đề xuất thẻ mới từ người bán đã được xử lý xong."
            />
          ) : (
            <>
              <ul className="list-none divide-y divide-admin-line-soft p-0 m-0">
                {pending.items.map(t => (
                  <li key={t._id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-3 hover:bg-stone-50/50 transition-colors">
                    <span className="min-w-0 flex-1 basis-[180px]">
                      <TagChip name={t.name} color={t.color} />
                      {t.proposed_by && (
                        <div className="text-[11px] text-amber-800/90 mt-1">
                          Đề xuất bởi:{' '}
                          {t.proposed_by.shop_name ? (
                            <>
                              Shop <b className="text-stone-900 font-semibold">{t.proposed_by.shop_name}</b>
                              <span className="text-stone-500 font-normal">
                                {' '}({t.proposed_by.full_name || (t.proposed_by as any).name || t.proposed_by.email})
                              </span>
                            </>
                          ) : (
                            <b>{t.proposed_by.full_name || (t.proposed_by as any).name || t.proposed_by.email || 'Người bán'}</b>
                          )}
                        </div>
                      )}
                    </span>
                    <span className={cx('truncate text-[12.5px] text-admin-muted xl:w-[240px] xl:shrink-0', MONO)}>
                      /{t.slug}
                    </span>
                    <span className="text-[12px] tabular-nums text-stone-600 xl:w-[120px] xl:shrink-0">
                      <b>{t.product_count}</b> sản phẩm
                    </span>
                    <div className="ml-auto flex shrink-0 items-center justify-end gap-2 md:w-[100px]">
                      <button
                        type="button"
                        className={cx(
                          ICON_BTN,
                          'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                        )}
                        onClick={() => handleApproveTag(t)}
                        disabled={queueBusyId === t._id}
                        aria-label={`Duyệt thẻ ${t.name}`}
                        title="Duyệt thành thẻ chính thức"
                      >
                        {queueBusyId === t._id ? (
                          <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />
                        ) : (
                          <Check size={16} aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        className={ICON_BTN_DANGER}
                        onClick={() => {
                          setRejectReason('');
                          setPendingReject(t);
                        }}
                        disabled={queueBusyId === t._id}
                        aria-label={`Từ chối thẻ ${t.name}`}
                        title="Từ chối / Cấm thẻ này"
                      >
                        <Ban size={15} aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                page={pending.page}
                totalPages={pending.totalPages}
                total={pending.total}
                limit={pending.limit}
                itemLabel="đề xuất"
                onPageChange={setPendingPageNo}
              />
            </>
          )}
        </div>
      )}

      {/* TAB 3: ĐÃ TỪ CHỐI / CẤM */}
      {activeTab === 'rejected' && (
        <div className={CARD}>
          <div className={CARD_HEADER}>
            <div>
              <span className="text-[13px] font-bold text-admin-ink">
                Danh sách thẻ đã từ chối / cấm ({stats.rejected || rejected.total})
              </span>
              <p className="m-0 mt-0.5 text-[12px] text-admin-muted">
                Các thẻ đã bị vô hiệu hóa và gỡ khỏi sản phẩm. Bạn có thể khôi phục lại bất kỳ lúc nào hoặc xóa vĩnh viễn.
              </p>
            </div>
          </div>

          {rejected.items.length === 0 ? (
            <EmptyState
              icon={Ban}
              title="Không có thẻ nào bị từ chối / cấm"
              description="Chưa có thẻ nào nằm trong danh sách cấm hoặc bị từ chối."
            />
          ) : (
            <>
              <ul className="list-none divide-y divide-admin-line-soft p-0 m-0">
                {rejected.items.map(t => (
                  <li
                    key={t._id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-3 bg-rose-50/20 hover:bg-rose-50/40 transition-colors"
                  >
                    <span className="min-w-0 flex-1 basis-[180px]">
                      <div className="flex items-center gap-2">
                        <TagChip name={t.name} color={t.color} />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                          Đã từ chối
                        </span>
                      </div>
                      {t.proposed_by && (
                        <div className="text-[11px] text-stone-600 mt-1">
                          Người đề xuất:{' '}
                          {t.proposed_by.shop_name ? (
                            <>
                              Shop <b>{t.proposed_by.shop_name}</b> ({t.proposed_by.full_name || t.proposed_by.email})
                            </>
                          ) : (
                            <b>{t.proposed_by.full_name || t.proposed_by.email || 'Người bán'}</b>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-rose-700 mt-1">
                        Lý do: <b>{t.reject_reason || 'Không phù hợp'}</b>
                        {t.rejected_at && (
                          <span className="text-stone-400 font-normal">
                            {' '}• {new Date(t.rejected_at).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </span>
                    <span className={cx('truncate text-[12.5px] text-admin-muted xl:w-[240px] xl:shrink-0', MONO)}>
                      /{t.slug}
                    </span>
                    <div className="ml-auto flex shrink-0 items-center justify-end gap-2 md:w-[130px]">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                        onClick={() => handleRestoreTag(t)}
                        disabled={queueBusyId === t._id}
                        title="Khôi phục lại thẻ này"
                      >
                        {queueBusyId === t._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RotateCcw size={13} />
                        )}
                        <span>Khôi phục</span>
                      </button>
                      <button
                        type="button"
                        className={ICON_BTN_DANGER}
                        onClick={() => setPendingDelete(t)}
                        title="Xóa vĩnh viễn khỏi hệ thống"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                page={rejected.page}
                totalPages={rejected.totalPages}
                total={rejected.total}
                limit={rejected.limit}
                itemLabel="thẻ bị từ chối"
                onPageChange={setRejectedPageNo}
              />
            </>
          )}
        </div>
      )}

      {/* Tag Edit/Create Modal Section */}
      <Modal
        open={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editingTag ? 'Sửa thẻ' : 'Tạo thẻ mới'}
        description={editingTag ? `Đang chỉnh sửa “${editingTag.name}”` : undefined}
        footer={
          <>
            <button type="button" className={BTN_SECONDARY} onClick={() => setShowModal(false)} disabled={saving}>
              Huỷ
            </button>
            <button type="submit" form="tag-form" className={BTN_PRIMARY} disabled={saving || !formData.name.trim()}>
              {saving && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
              {editingTag ? 'Lưu thay đổi' : 'Tạo thẻ'}
            </button>
          </>
        }
      >
        <form id="tag-form" onSubmit={handleSubmit} className={MODAL_BODY}>
          <div className={FIELD_GROUP}>
            <label className={FIELD_LABEL} htmlFor="tag-name">
              Tên thẻ <span className="text-admin-danger">*</span>
            </label>
            <input
              id="tag-name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  name: e.target.value,
                  slug: slugTouched ? prev.slug : slugify(e.target.value),
                }))
              }
              placeholder="Ví dụ: Thủ công, Sơn mài, Cotton"
              className={FIELD}
              required
            />
          </div>

          <div className={FIELD_GROUP}>
            <label className={FIELD_LABEL} htmlFor="tag-slug">
              Slug
            </label>
            <input
              id="tag-slug"
              type="text"
              value={formData.slug}
              onChange={e => {
                setSlugTouched(true);
                setFormData({ ...formData, slug: slugify(e.target.value) });
              }}
              placeholder={slugify(formData.name) || 'tu-dong-tao-tu-ten'}
              className={cx(FIELD, MONO)}
            />
            <p className={FIELD_HINT}>Để trống để hệ thống tự tạo: /{previewSlug || '…'}</p>
          </div>

          <div className={FIELD_GROUP}>
            <span className={FIELD_LABEL}>Màu thẻ</span>
            <TagColorPicker color={formData.color} onChange={c => setFormData({ ...formData, color: c })} />
          </div>

          <div className={cx(FIELD_GROUP, 'rounded-admin border border-admin-line bg-[#fafcfa] px-[13px] py-3')}>
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.04em] text-admin-muted">
              Xem trước
            </span>
            <TagChip name={formData.name} color={formData.color} />
          </div>
        </form>
      </Modal>

      {/* Delete Tag Confirmation Dialog */}
      <ConfirmDialog
        open={pendingDelete !== null}
        busy={dialogBusy}
        title="Xoá thẻ?"
        message={
          <>
            Thẻ <strong className="font-semibold text-admin-ink">{pendingDelete?.name}</strong> sẽ bị xoá vĩnh viễn
            {pendingDelete?.product_count ? (
              <> và gỡ khỏi {pendingDelete.product_count} sản phẩm đang dùng nó.</>
            ) : (
              <>.</>
            )}
          </>
        }
        confirmLabel="Xoá thẻ"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Reject Pending Tag Modal with Reason */}
      <Modal
        open={pendingReject !== null}
        onClose={() => !dialogBusy && setPendingReject(null)}
        title="Từ chối / Cấm thẻ đề xuất"
        description="Thẻ sẽ bị vô hiệu hoá và tự động gỡ khỏi toàn bộ sản phẩm liên quan"
        maxWidth="520px"
        footer={
          <>
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => setPendingReject(null)}
              disabled={dialogBusy}
            >
              Hủy
            </button>
            <button
              type="button"
              className={cx(
                BTN_DANGER,
                'border-rose-600 bg-rose-600 hover:bg-rose-700 hover:shadow-[0_4px_12px_rgba(225,29,72,0.25)]'
              )}
              onClick={confirmReject}
              disabled={dialogBusy}
            >
              {dialogBusy ? (
                <Loader2 size={15} className="animate-spin motion-reduce:animate-none" />
              ) : (
                <Ban size={15} />
              )}
              <span>Xác nhận từ chối / Cấm</span>
            </button>
          </>
        }
      >
        <div className={MODAL_BODY}>
          {pendingReject && (
            <div className="space-y-4">
              {/* Tag information chip card */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TagChip name={pendingReject.name} color={pendingReject.color} />
                  <span className={cx('truncate text-xs text-stone-500', MONO)}>
                    /{pendingReject.slug}
                  </span>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <span className="font-semibold text-stone-800 tabular-nums">
                    {pendingReject.product_count || 0}
                  </span>{' '}
                  <span className="text-stone-500">sản phẩm</span>
                </div>
              </div>

              {/* Warning note */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950 m-0">Ảnh hưởng của thao tác:</p>
                  <p className="m-0 text-amber-900/90">
                    Thẻ sẽ được chuyển vào mục <b>"Đã từ chối / Cấm"</b> và tự động gỡ khỏi tất cả sản phẩm đang gắn. Bạn vẫn có thể khôi phục lại thẻ này bất kỳ lúc nào.
                  </p>
                </div>
              </div>

              {/* Reason input with quick suggestion chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="tag-reject-reason" className={FIELD_LABEL}>
                    Lý do từ chối <span className="font-normal text-stone-400 text-xs">(tùy chọn)</span>
                  </label>
                  {rejectReason && (
                    <button
                      type="button"
                      onClick={() => setRejectReason('')}
                      className="text-[11px] text-stone-400 hover:text-stone-600 underline cursor-pointer"
                    >
                      Xóa lý do
                    </button>
                  )}
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                  <span className="text-[11px] font-medium text-stone-400 mr-0.5">Gợi ý:</span>
                  {[
                    'Tên thẻ không phù hợp',
                    'Spam / Lặp từ khóa',
                    'Trùng lặp với thẻ có sẵn',
                    'Sai chính tả / Vô nghĩa',
                  ].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={cx(
                        'cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                        rejectReason === reason
                          ? 'border-rose-400 bg-rose-50 text-rose-700 font-semibold'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <textarea
                  id="tag-reject-reason"
                  rows={3}
                  className={cx(
                    FIELD,
                    'resize-none focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]'
                  )}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Tên thẻ không phù hợp với danh mục hàng thủ công, spam từ khóa..."
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
