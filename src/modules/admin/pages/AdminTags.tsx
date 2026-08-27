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
  X,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { Paginated, Tag, TagStats } from '../types';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import {
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

/* ============================================================ tiện ích ==== */

/** 12 màu đã kiểm tra tương phản với chữ trắng hoặc chữ đen tương ứng. */
const PRESET_COLORS = [
  '#1a6b1a', '#2563eb', '#dc2626', '#9333ea',
  '#ea580c', '#ca8a04', '#0891b2', '#64748b',
  '#4d7c0f', '#e11d48', '#7c3aed', '#1d4ed8',
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Chọn màu chữ đọc được trên nền màu thẻ. Không thể để quản trị viên chọn màu
 * vàng rồi thẻ hiện chữ trắng trên nền vàng ở trang người mua.
 */
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

/* ====================================================== chip xem trước ==== */

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

/* ======================================================= bộ chọn màu ===== */

function TagColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [draft, setDraft] = useState(color);
  const valid = HEX_RE.test(draft);

  // Đồng bộ khi màu được đổi từ nơi khác (bảng màu sẵn, mở lại hộp thoại).
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
              // Đổi viền thay vì phóng to: phóng to làm cả hàng nhảy chỗ.
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
  /* Yêu cầu gửi lên máy chủ. Tách khỏi kết quả trả về vì BE có quyền ghim trang:
     xoá nốt thẻ cuối của trang 3 thì trang 3 không còn tồn tại nữa. */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pendingPageNo, setPendingPageNo] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('products');
  // Lọc đã chuyển xuống máy chủ, nên phải chờ người dùng gõ xong mới gọi.
  const debouncedSearch = useDebouncedValue(search, 300);

  /* Kết quả từ máy chủ. */
  const [result, setResult] = useState<Paginated<Tag>>(emptyPage(20));
  const [pending, setPending] = useState<Paginated<Tag>>(emptyPage(8));
  const [stats, setStats] = useState<TagStats>(EMPTY_STATS);

  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#1a6b1a', slug: '' });
  const [slugTouched, setSlugTouched] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Tag | null>(null);
  const [pendingReject, setPendingReject] = useState<Tag | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [queueBusyId, setQueueBusyId] = useState<string | null>(null);

  // `loading` chỉ dành cho lần tải đầu. Các lần sau dùng `refreshing` để giữ
  // nguyên bảng cũ và làm mờ đi — nhấp nháy khung xương sau mỗi ký tự gõ vào ô
  // tìm kiếm còn khó đọc hơn là chờ.
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

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminService.getTagStats());
    } catch {
      // Số liệu tổng quan hỏng thì dải thống kê về 0, bảng vẫn dùng được bình thường.
      setStats(EMPTY_STATS);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Đổi từ khoá hay cách sắp xếp thì tập kết quả khác hẳn — ở lại trang 7 là vô nghĩa.
  useEffect(() => { setPage(1); }, [debouncedSearch, sortKey]);

  /** Mọi thao tác ghi đều đổi số liệu tổng quan lẫn nội dung trang đang xem. */
  const reloadAll = useCallback(async () => {
    await Promise.all([loadList(), loadPending(), loadStats()]);
  }, [loadList, loadPending, loadStats]);

  /* ------------------------------------------------------------ hàng chờ */

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
      await adminService.rejectProposedTag(pendingReject._id);
      setPendingReject(null);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Từ chối thất bại');
      setPendingReject(null);
    } finally {
      setDialogBusy(false);
    }
  };

  /* ------------------------------------------------------------ biểu mẫu */

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

  /* ------------------------------------------------------------------ view */

  const filtering = debouncedSearch.trim() !== '';
  const previewSlug = formData.slug || slugify(formData.name);
  // Số thứ tự phải chạy tiếp theo trang chứ không quay về 1 ở đầu mỗi trang.
  const rowOffset = (result.page - 1) * result.limit;

  return (
    <div className={PAGE}>
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

      {/* Số liệu lấy từ máy chủ, không cộng dồn trang đang xem — nếu tính từ trang
          thì "Tổng số thẻ" sẽ tụt xuống 20 ngay khi bảng được cắt trang. */}
      <StatStrip
        loading={loading}
        items={[
          { label: 'Thẻ đã duyệt', value: stats.total },
          { label: 'Chờ duyệt', value: stats.pending, dot: stats.pending > 0 ? '#ea580c' : '#cbd5d0' },
          { label: 'Lượt gắn sản phẩm', value: stats.tagged },
          { label: 'Chưa dùng', value: stats.unused, dot: '#cbd5d0' },
        ]}
      />

      {/* Hàng chờ duyệt đứng trên bảng vì đây là việc cần làm, không phải dữ liệu để tra cứu. */}
      {pending.total > 0 && (
        <section className={cx(CARD, 'mb-4 border-[#fdba74]')} aria-labelledby="pending-heading">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#fed7aa] bg-[#fff7ed] px-[18px] py-3">
            <Clock size={16} className="shrink-0 text-[#9a3412]" aria-hidden />
            <h2 id="pending-heading" className="m-0 text-[14px] font-bold text-[#9a3412]">
              Thẻ chờ duyệt ({pending.total})
            </h2>
            <span className="text-[12px] text-[#a16207]">Duyệt để công khai, từ chối để gỡ khỏi mọi sản phẩm</span>
          </div>
          <ul className="list-none divide-y divide-admin-line-soft p-0">
            {pending.items.map(t => (
              <li key={t._id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-2.5">
                <span className="min-w-0 flex-1 basis-[160px]">
                  <TagChip name={t.name} color={t.color} />
                </span>
                <span className={cx('truncate text-[12.5px] text-admin-muted xl:w-[240px] xl:shrink-0', MONO)}>
                  /{t.slug}
                </span>
                <span className="text-[12px] tabular-nums text-admin-muted xl:w-[110px] xl:shrink-0">
                  {t.product_count} sản phẩm
                </span>
                <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5 md:w-[84px]">
                  <button
                    type="button"
                    className={ICON_BTN}
                    onClick={() => handleApproveTag(t)}
                    disabled={queueBusyId === t._id}
                    aria-label={`Duyệt thẻ ${t.name}`}
                    title="Duyệt"
                  >
                    {queueBusyId === t._id ? (
                      <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />
                    ) : (
                      <Check size={15} aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    className={ICON_BTN_DANGER}
                    onClick={() => setPendingReject(t)}
                    disabled={queueBusyId === t._id}
                    aria-label={`Từ chối thẻ ${t.name}`}
                    title="Từ chối"
                  >
                    <X size={15} aria-hidden />
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
        </section>
      )}

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
            {/* Bảng dữ liệu tràn ngang trên màn hình hẹp thay vì làm vỡ bố cục trang. */}
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
                      {/* Chỉ mã hex: ô chip bên trái đã là mẫu màu thật, thêm ô vuông màu nữa là thừa. */}
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

          {/* Xem trước đúng cách thẻ hiển thị ở trang người mua, kèm màu chữ đã tính tương phản. */}
          <div className={cx(FIELD_GROUP, 'rounded-admin border border-admin-line bg-[#fafcfa] px-[13px] py-3')}>
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.04em] text-admin-muted">
              Xem trước
            </span>
            <TagChip name={formData.name} color={formData.color} />
          </div>
        </form>
      </Modal>

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

      <ConfirmDialog
        open={pendingReject !== null}
        busy={dialogBusy}
        title="Từ chối thẻ đề xuất?"
        message={
          <>
            Thẻ <strong className="font-semibold text-admin-ink">{pendingReject?.name}</strong> sẽ bị gỡ khỏi mọi sản
            phẩm và không xuất hiện với người mua.
          </>
        }
        confirmLabel="Từ chối thẻ"
        onConfirm={confirmReject}
        onCancel={() => setPendingReject(null)}
      />
    </div>
  );
}
