import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  Eye,
  EyeOff,
  Folder,
  FolderOpen,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  SearchX,
  Trash2,
  RotateCcw,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { Category, CategoryOption, CategoryStats, CategoryStatusFilter, CategoryTreePage, Paginated } from '../types';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SECONDARY_SM,
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
  SegmentedControl,
  SkeletonRows,
  StatStrip,
  StatusPill,
  Toggle,
} from '../components/AdminPrimitives';

/* --------------------------------------------------------------- Utilities */

function generateSlug(text: string): string {
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

function collectIds(nodes: Category[], out: string[] = []): string[] {
  for (const n of nodes) {
    out.push(n._id);
    collectIds(n.children || [], out);
  }
  return out;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-[#fef3c7] px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/* ----------------------------------------------------------- Category Item */

const COL_SLUG = 'hidden w-[220px] shrink-0 xl:block';
const COL_KIDS = 'hidden w-[124px] shrink-0 xl:block';
const COL_STATUS = 'shrink-0 xl:w-[104px]';
const COL_ACTIONS = 'shrink-0 md:w-[120px]';
const COL_NAME_OFFSET = 'pl-[88px]';


function CategoryNode({
  node,
  level,
  query,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleActive,
  busyId,
}: {
  node: Category;
  level: number;
  query: string;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggleActive: (cat: Category) => void;
  busyId: string | null;
}) {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isOpen = hasChildren && expanded.has(node._id);
  const busy = busyId === node._id;

  return (
    <li>
      <div
        // flex-wrap: dưới ~640px, cụm trạng thái + thao tác rơi xuống dòng thứ hai
        // thay vì bóp tên danh mục về 0px rồi tràn nút ra ngoài mép phải.
        className="group flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-admin-line-soft py-2.5 pr-3 transition-colors duration-[120ms] hover:bg-[#fafdfa] motion-reduce:transition-none"
        style={{ paddingLeft: `${14 + level * 22}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node._id)}
            aria-expanded={isOpen}
            aria-label={isOpen ? `Thu gọn ${node.name}` : `Mở rộng ${node.name}`}
            className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-admin-muted transition-colors duration-150 hover:bg-admin-brand-050 hover:text-admin-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-brand motion-reduce:transition-none"
          >
            {isOpen ? <ChevronDown size={15} aria-hidden /> : <ChevronRight size={15} aria-hidden />}
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" aria-hidden />
        )}

        <span
          className={cx(
            'inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg',
            node.is_active ? 'bg-admin-brand-050 text-admin-brand' : 'bg-admin-line-soft text-[#94a3a0]'
          )}
          aria-hidden
        >
          {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
        </span>

        <div className="flex min-w-0 flex-1 basis-[170px] flex-col gap-y-0.5">
          <span
            className={cx(
              'truncate text-[14px] font-semibold',
              node.is_active ? 'text-admin-ink' : 'text-[#8a9690]'
            )}
          >
            <Highlight text={node.name} query={query} />
          </span>
          <span className="flex min-w-0 items-baseline gap-x-2.5 text-[12.5px] text-admin-muted xl:hidden">
            <span className={cx('truncate', MONO)}>/{node.slug}</span>
            {hasChildren && (
              <span className="shrink-0 text-[12px] tabular-nums text-[#9aa6a0]">{children.length} mục con</span>
            )}
          </span>
        </div>

        <span className={cx(COL_SLUG, 'truncate text-[12.5px] text-admin-muted', MONO)}>/{node.slug}</span>
        <span className={cx(COL_KIDS, 'text-[12.5px] tabular-nums text-[#9aa6a0]')}>
          {hasChildren ? `${children.length} mục con` : '—'}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <span className={COL_STATUS}>
            <StatusPill tone={node.is_active ? 'brand' : 'neutral'}>{node.is_active ? 'Hoạt động' : 'Đang ẩn'}</StatusPill>
          </span>

          <div className={cx(COL_ACTIONS, 'flex items-center justify-end gap-1.5 opacity-70 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none')}>
          <button
            type="button"
            className={ICON_BTN}
            onClick={() => onToggleActive(node)}
            disabled={busy}
            aria-label={node.is_active ? `Ẩn danh mục ${node.name}` : `Hiển thị danh mục ${node.name}`}
            title={node.is_active ? 'Ẩn danh mục' : 'Hiển thị danh mục'}
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />
            ) : node.is_active ? (
              <EyeOff size={15} aria-hidden />
            ) : (
              <Eye size={15} aria-hidden />
            )}
          </button>
          <button
            type="button"
            className={ICON_BTN}
            onClick={() => onEdit(node)}
            aria-label={`Sửa danh mục ${node.name}`}
            title="Sửa"
          >
            <Pencil size={15} aria-hidden />
          </button>
          <button
            type="button"
            className={ICON_BTN_DANGER}
            onClick={() => onDelete(node)}
            aria-label={`Xoá danh mục ${node.name}`}
            title="Xoá"
          >
            <Trash2 size={15} aria-hidden />
          </button>
          </div>
        </div>
      </div>

      {hasChildren && isOpen && (
        <ul className="relative list-none p-0">
          <span
            aria-hidden
            className="absolute bottom-0 top-0 z-[1] w-px bg-admin-line"
            style={{ left: `${14 + level * 22 + 12}px` }}
          />
          {children.map(child => (
            <CategoryNode
              key={child._id}
              node={child}
              level={level + 1}
              query={query}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              busyId={busyId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ----------------------------------------------------------- Admin Categories Page */

const EMPTY_FORM = { name: '', slug: '', description: '', icon: '', parent_id: '', sort_order: 0, is_active: true };
const EMPTY_STATS: CategoryStats = { total: 0, active: 0, hidden: 0, roots: 0, pending: 0 };
const EMPTY_TREE: CategoryTreePage = { items: [], total: 0, page: 1, limit: 15, totalPages: 1, totalNodes: 0 };
const emptyPendingPage = (limit: number): Paginated<Category> => ({ items: [], total: 0, page: 1, limit, totalPages: 1 });

export function AdminCategories() {
  /* Yêu cầu gửi lên máy chủ. */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pendingPageNo, setPendingPageNo] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CategoryStatusFilter>('all');
  // Lọc đã chuyển xuống máy chủ, nên phải chờ người dùng gõ xong mới gọi.
  const debouncedSearch = useDebouncedValue(search, 300);

  /* Kết quả từ máy chủ. */
  const [tree, setTree] = useState<CategoryTreePage>(EMPTY_TREE);
  const [pending, setPending] = useState<Paginated<Category>>(emptyPendingPage(8));
  const [stats, setStats] = useState<CategoryStats>(EMPTY_STATS);
  // Ô chọn danh mục cha phải thấy MỌI danh mục, kể cả mục nằm ngoài trang đang xem.
  const [options, setOptions] = useState<CategoryOption[]>([]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Nhánh nào đã từng tự mở thì thôi, không mở lại — nếu không mỗi lần tải lại
  // sau một thao tác là mọi nhánh người dùng vừa thu gọn lại bung ra hết.
  const autoExpandedRef = useRef<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [pendingRejectCat, setPendingRejectCat] = useState<Category | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingQueueBusyId, setPendingQueueBusyId] = useState<string | null>(null);
  const [rejectingBusy, setRejectingBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'tree' | 'pending' | 'rejected'>('tree');
  const [rejected, setRejected] = useState<Paginated<Category>>(emptyPendingPage(8));
  const [rejectedPageNo, setRejectedPageNo] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTree = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await adminService.getCategoryTree({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        status,
      });
      setTree(data);
      // BE ghim trang về khoảng hợp lệ; bám theo trang thật nó trả về.
      if (data.page !== page) setPage(data.page);

      setExpanded(prev => {
        const next = new Set(prev);
        for (const id of collectIds(data.items)) {
          if (!autoExpandedRef.current.has(id)) {
            autoExpandedRef.current.add(id);
            next.add(id);
          }
        }
        return next;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch, status]);

  const loadPending = useCallback(async () => {
    try {
      const data = await adminService.getPendingCategories({ page: pendingPageNo, limit: 8 });
      setPending(data);
      if (data.page !== pendingPageNo) setPendingPageNo(data.page);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải danh mục chờ duyệt');
    }
  }, [pendingPageNo]);

  const loadRejected = useCallback(async () => {
    try {
      const data = await adminService.getRejectedCategories({ page: rejectedPageNo, limit: 8 });
      setRejected(data);
      if (data.page !== rejectedPageNo) setRejectedPageNo(data.page);
    } catch {
      // Bỏ qua lỗi
    }
  }, [rejectedPageNo]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminService.getCategoryStats());
    } catch {
      // Số liệu tổng quan hỏng thì dải thống kê về 0, cây vẫn dùng được bình thường.
      setStats(EMPTY_STATS);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      setOptions(await adminService.getCategoryOptions());
    } catch {
      setOptions([]);
    }
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);
  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { loadRejected(); }, [loadRejected]);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  // Đổi từ khoá hay bộ lọc thì tập kết quả khác hẳn — ở lại trang 4 là vô nghĩa.
  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadTree(), loadPending(), loadRejected(), loadStats(), loadOptions()]);
  }, [loadTree, loadPending, loadRejected, loadStats, loadOptions]);

  const filtering = debouncedSearch.trim() !== '' || status !== 'all';

  // Khi đang lọc, mọi nhánh còn lại đều được mở — người dùng đã nói rõ họ tìm gì.
  const effectiveExpanded = useMemo(
    () => (filtering ? new Set(collectIds(tree.items)) : expanded),
    [filtering, tree.items, expanded]
  );

  const pageIds = useMemo(() => collectIds(tree.items), [tree.items]);
  const allExpanded = pageIds.length > 0 && pageIds.every(id => expanded.has(id));

  const toggleExpand = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* -------------------------------------------------------------- biểu mẫu */

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ ...EMPTY_FORM, sort_order: stats.roots });
    setSlugTouched(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
      parent_id: cat.parent_id || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setSlugTouched(true);
    setError('');
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    // Slug bám theo tên cho tới khi người dùng tự sửa slug — sau đó tôn trọng lựa chọn của họ.
    setFormData(prev => ({ ...prev, name, slug: slugTouched ? prev.slug : generateSlug(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        icon: formData.icon,
        parent_id: formData.parent_id || undefined,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };
      if (editingCategory) {
        await adminService.updateCategory(editingCategory._id, payload);
      } else {
        await adminService.createCategory({ ...payload, slug: formData.slug || generateSlug(formData.name) });
      }
      setShowModal(false);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    setTogglingId(cat._id);
    setError('');
    try {
      await adminService.updateCategory(cat._id, { is_active: !cat.is_active });
      await Promise.all([loadTree(), loadStats()]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Cập nhật thất bại');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    try {
      await adminService.deleteCategory(pendingDelete._id);
      setPendingDelete(null);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xoá thất bại');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleApproveCategory = async (cat: Category) => {
    setPendingQueueBusyId(cat._id);
    setError('');
    try {
      await adminService.approveCategory(cat._id);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Duyệt thất bại');
    } finally {
      setPendingQueueBusyId(null);
    }
  };

  const confirmRejectCategory = async () => {
    if (!pendingRejectCat) return;
    setRejectingBusy(true);
    setError('');
    try {
      await adminService.rejectCategory(pendingRejectCat._id, rejectReason.trim() || undefined);
      setPendingRejectCat(null);
      setRejectReason('');
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Từ chối thất bại');
      setPendingRejectCat(null);
    } finally {
      setRejectingBusy(false);
    }
  };

  const handleRestoreCategory = async (cat: Category) => {
    setPendingQueueBusyId(cat._id);
    setError('');
    try {
      await adminService.restoreCategory(cat._id);
      await reloadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Khôi phục danh mục thất bại');
    } finally {
      setPendingQueueBusyId(null);
    }
  };

  /* ------------------------------------------------------------------ UI Render */

  const deleteChildCount = pendingDelete
    ? options.filter(c => (c.parent_id ?? null) === pendingDelete._id).length
    : 0;

  return (
    <div className={PAGE}>
      {/* Header Section */}
      <PageHeader
        title="Danh mục"
        description="Cây danh mục sản phẩm của sàn. Danh mục ẩn vẫn giữ nguyên sản phẩm nhưng không hiển thị cho người mua."
        actions={
          <button type="button" className={BTN_PRIMARY} onClick={openCreateModal}>
            <Plus size={17} aria-hidden /> Thêm danh mục
          </button>
        }
      />

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}

      {/* Stat Strip Section */}
      <StatStrip
        loading={loading}
        items={[
          { label: 'Tổng danh mục', value: stats.total },
          { label: 'Chờ duyệt', value: stats.pending || 0, dot: (stats.pending || 0) > 0 ? '#ea580c' : '#cbd5d0' },
          { label: 'Đang hoạt động', value: stats.active, dot: '#1a6b1a' },
          { label: 'Đang ẩn', value: stats.hidden, dot: '#cbd5d0' },
          { label: 'Đã từ chối', value: stats.rejected || 0, dot: (stats.rejected || 0) > 0 ? '#dc2626' : '#cbd5d0' },
          { label: 'Danh mục gốc', value: stats.roots },
        ]}
      />

      {/* Tab Navigation */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-admin-line">
        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={cx(
            'flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-bold transition-all border-b-2 -mb-[2px] cursor-pointer',
            activeTab === 'tree'
              ? 'border-admin-brand text-admin-brand bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-admin-muted hover:text-admin-ink'
          )}
        >
          <FolderTree size={16} />
          <span>Cây danh mục</span>
          <span
            className={cx(
              'ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
              activeTab === 'tree' ? 'bg-admin-brand text-white' : 'bg-stone-100 text-stone-600'
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
          {(stats.pending || pending.total) > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ea580c] text-white animate-pulse">
              {stats.pending || pending.total}
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

      {/* TAB 2: CHỜ XEM XÉT */}
      {activeTab === 'pending' && (
        <div className={CARD}>
          <div className={CARD_HEADER}>
            <div>
              <span className="text-[13px] font-bold text-admin-ink">
                Hàng đợi kiểm duyệt danh mục đề xuất ({pending.total})
              </span>
              <p className="m-0 mt-0.5 text-[12px] text-admin-muted">
                Danh mục do người bán đề xuất trong lúc tạo sản phẩm. Bạn có thể duyệt để chuyển thành danh mục chính thức hoặc Từ chối / Cấm.
              </p>
            </div>
          </div>

          {pending.items.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Không có danh mục nào chờ duyệt"
              description="Tất cả các đề xuất danh mục mới từ người bán đã được xử lý xong."
            />
          ) : (
            <>
              <ul className="list-none divide-y divide-admin-line-soft p-0 m-0">
                {pending.items.map((cat: any) => {
                  const parentName =
                    options.find(o => o._id === (typeof cat.parent_id === 'object' ? cat.parent_id?._id : cat.parent_id))?.name ||
                    (typeof cat.parent_id === 'object' && cat.parent_id?.name ? cat.parent_id.name : null);

                  return (
                    <li key={cat._id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-3 hover:bg-stone-50/50 transition-colors">
                      <div className="min-w-0 flex-1 basis-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900 text-sm">{cat.name}</span>
                          {cat.slug && <span className={cx('text-[12px] text-admin-muted', MONO)}>/{cat.slug}</span>}
                        </div>
                        {cat.description && (
                          <p className="text-xs text-stone-500 mt-0.5 line-clamp-1 m-0">{cat.description}</p>
                        )}
                        {cat.proposed_by && (
                          <p className="text-[11px] text-amber-800/90 mt-1 m-0">
                            Đề xuất bởi:{' '}
                            {cat.proposed_by.shop_name ? (
                              <>
                                Shop <b className="text-stone-900 font-semibold">{cat.proposed_by.shop_name}</b>
                                <span className="text-stone-500 font-normal">
                                  {' '}({cat.proposed_by.full_name || (cat.proposed_by as any).name || cat.proposed_by.email})
                                </span>
                              </>
                            ) : (
                              <b>{cat.proposed_by.full_name || (cat.proposed_by as any).name || cat.proposed_by.email || 'Người bán'}</b>
                            )}
                          </p>
                        )}
                      </div>
                      {parentName && (
                        <span className="text-[12px] text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-md font-medium">
                          Thuộc: {parentName}
                        </span>
                      )}
                      <div className="ml-auto flex shrink-0 items-center justify-end gap-2 md:w-[100px]">
                        <button
                          type="button"
                          className={cx(
                            ICON_BTN,
                            'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                          )}
                          onClick={() => handleApproveCategory(cat)}
                          disabled={pendingQueueBusyId === cat._id}
                          aria-label={`Duyệt danh mục ${cat.name}`}
                          title="Duyệt thành danh mục chính thức"
                        >
                          {pendingQueueBusyId === cat._id ? (
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
                            setPendingRejectCat(cat);
                          }}
                          disabled={pendingQueueBusyId === cat._id}
                          aria-label={`Từ chối danh mục ${cat.name}`}
                          title="Từ chối / Cấm danh mục này"
                        >
                          <Ban size={15} aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
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
                Danh sách danh mục đã từ chối / cấm ({stats.rejected || rejected.total})
              </span>
              <p className="m-0 mt-0.5 text-[12px] text-admin-muted">
                Các danh mục đã bị vô hiệu hóa và ẩn khỏi marketplace. Bạn có thể khôi phục lại bất kỳ lúc nào hoặc xóa vĩnh viễn.
              </p>
            </div>
          </div>

          {rejected.items.length === 0 ? (
            <EmptyState
              icon={Ban}
              title="Không có danh mục nào bị từ chối / cấm"
              description="Chưa có danh mục nào nằm trong danh sách cấm hoặc bị từ chối."
            />
          ) : (
            <>
              <ul className="list-none divide-y divide-admin-line-soft p-0 m-0">
                {rejected.items.map((cat: any) => (
                  <li
                    key={cat._id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-3 bg-rose-50/20 hover:bg-rose-50/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1 basis-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 text-sm line-through text-stone-500">
                          {cat.name}
                        </span>
                        {cat.slug && <span className={cx('text-[12px] text-admin-muted', MONO)}>/{cat.slug}</span>}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                          Đã từ chối / Cấm
                        </span>
                      </div>
                      {cat.proposed_by && (
                        <p className="text-[11px] text-stone-600 mt-1 m-0">
                          Người đề xuất:{' '}
                          {cat.proposed_by.shop_name ? (
                            <>
                              Shop <b>{cat.proposed_by.shop_name}</b> ({cat.proposed_by.full_name || cat.proposed_by.email})
                            </>
                          ) : (
                            <b>{cat.proposed_by.full_name || cat.proposed_by.email || 'Người bán'}</b>
                          )}
                        </p>
                      )}
                      <p className="text-[11px] text-rose-700 mt-1 m-0">
                        Lý do: <b>{cat.reject_reason || 'Không phù hợp'}</b>
                        {cat.rejected_at && (
                          <span className="text-stone-400 font-normal">
                            {' '}• {new Date(cat.rejected_at).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center justify-end gap-2 md:w-[130px]">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                        onClick={() => handleRestoreCategory(cat)}
                        disabled={pendingQueueBusyId === cat._id}
                        title="Khôi phục lại danh mục này"
                      >
                        {pendingQueueBusyId === cat._id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RotateCcw size={13} />
                        )}
                        <span>Khôi phục</span>
                      </button>
                      <button
                        type="button"
                        className={ICON_BTN_DANGER}
                        onClick={() => setPendingDelete(cat)}
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
                itemLabel="danh mục bị từ chối"
                onPageChange={setRejectedPageNo}
              />
            </>
          )}
        </div>
      )}

      {/* TAB 1: CÂY DANH MỤC */}
      {activeTab === 'tree' && (
        <>
          {/* Toolbar Section */}
          <div className={TOOLBAR}>
        <SearchField
          label="Tìm kiếm danh mục"
          placeholder="Tìm theo tên hoặc slug..."
          value={search}
          onChange={setSearch}
        />
        <SegmentedControl
          label="Lọc theo trạng thái"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Tất cả', count: stats.total },
            { value: 'active', label: 'Hoạt động', count: stats.active },
            { value: 'hidden', label: 'Đang ẩn', count: stats.hidden },
          ]}
        />
      </div>

      {/* Category Tree Table Section */}
      <div className={CARD}>
        <div className={CARD_HEADER}>
          <span className="text-[12.5px] font-semibold text-admin-muted">
            {loading ? 'Đang tải…' : filtering ? `${tree.totalNodes} kết quả` : `${stats.total} danh mục`}
          </span>
          <button
            type="button"
            className={BTN_SECONDARY_SM}
            onClick={() => setExpanded(allExpanded ? new Set() : new Set(pageIds))}
            disabled={loading || filtering || tree.items.length === 0}
            title={filtering ? 'Khi đang lọc, mọi nhánh luôn được mở' : undefined}
          >
            {allExpanded ? <ChevronsDownUp size={15} aria-hidden /> : <ChevronsUpDown size={15} aria-hidden />}
            {allExpanded ? 'Thu gọn tất cả' : 'Mở rộng tất cả'}
          </button>
        </div>

        {!loading && tree.items.length > 0 && (
          <div
            className={cx(
              COL_NAME_OFFSET,
              'hidden items-center gap-x-2.5 border-b border-admin-line bg-[#fdfefd] py-2 pr-3 text-[11.5px] font-bold uppercase tracking-[0.04em] text-admin-muted xl:flex'
            )}
            aria-hidden
          >
            <span className="flex-1">Danh mục</span>
            <span className={COL_SLUG}>Đường dẫn</span>
            <span className={COL_KIDS}>Cấp con</span>
            <span className={COL_STATUS}>Trạng thái</span>
            <span className={cx(COL_ACTIONS, 'text-right')}>Thao tác</span>
          </div>
        )}

        {loading ? (
          <SkeletonRows rows={6} columns={['30px', '38%', '18%', '76px', '112px']} />
        ) : tree.items.length === 0 ? (
          filtering ? (
            <EmptyState
              icon={SearchX}
              title="Không có danh mục nào khớp"
              description="Thử đổi từ khoá hoặc bỏ bộ lọc trạng thái."
              action={
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                  }}
                >
                  Xoá bộ lọc
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={FolderTree}
              title="Chưa có danh mục nào"
              description="Danh mục giúp người mua duyệt sản phẩm theo nhóm. Hãy bắt đầu bằng vài danh mục gốc."
              action={
                <button type="button" className={BTN_PRIMARY} onClick={openCreateModal}>
                  <Plus size={17} aria-hidden /> Tạo danh mục đầu tiên
                </button>
              }
            />
          )
        ) : (
          <>
            <ul
              className={cx(
                'list-none p-0 transition-opacity duration-150 [&>li:last-child>div:first-child]:border-b-0 motion-reduce:transition-none',
                refreshing && 'opacity-55'
              )}
              aria-busy={refreshing}
            >
              {tree.items.map(node => (
                <CategoryNode
                  key={node._id}
                  node={node}
                  level={0}
                  query={debouncedSearch}
                  expanded={effectiveExpanded}
                  onToggleExpand={toggleExpand}
                  onEdit={openEditModal}
                  onDelete={setPendingDelete}
                  onToggleActive={handleToggleStatus}
                  busyId={togglingId}
                />
              ))}
            </ul>

            <Pagination
              page={tree.page}
              totalPages={tree.totalPages}
              total={tree.total}
              limit={tree.limit}
              itemLabel="danh mục gốc"
              disabled={refreshing}
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
    </>
  )}

      {/* Category Modal Form Section */}

      <Modal
        open={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editingCategory ? 'Sửa danh mục' : 'Tạo danh mục mới'}
        description={editingCategory ? `Đang chỉnh sửa “${editingCategory.name}”` : undefined}
        maxWidth="520px"
        footer={
          <>
            <button type="button" className={BTN_SECONDARY} onClick={() => setShowModal(false)} disabled={saving}>
              Huỷ
            </button>
            <button type="submit" form="category-form" className={BTN_PRIMARY} disabled={saving || !formData.name.trim()}>
              {saving && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden />}
              {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className={MODAL_BODY}>
          <div className={FIELD_GROUP}>
            <label className={FIELD_LABEL} htmlFor="cat-name">
              Tên danh mục <span className="text-admin-danger">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              value={formData.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Ví dụ: Gốm sứ Bát Tràng"
              className={FIELD}
              required
            />
          </div>

          <div className={FIELD_GROUP}>
            <label className={FIELD_LABEL} htmlFor="cat-slug">
              Slug
            </label>
            <input
              id="cat-slug"
              type="text"
              value={formData.slug}
              onChange={e => {
                setSlugTouched(true);
                setFormData({ ...formData, slug: generateSlug(e.target.value) });
              }}
              placeholder="gom-su-bat-trang"
              className={cx(FIELD, MONO)}
            />
            <p className={FIELD_HINT}>Tự sinh từ tên. Sửa tay nếu cần — slug là phần xuất hiện trên đường dẫn.</p>
          </div>

          <div className={FIELD_GROUP}>
            <label className={FIELD_LABEL} htmlFor="cat-desc">
              Mô tả
            </label>
            <textarea
              id="cat-desc"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Mô tả ngắn hiển thị ở trang duyệt danh mục..."
              className={cx(FIELD, 'resize-y')}
            />
          </div>

          <div className={cx(FIELD_GROUP, 'grid grid-cols-1 gap-4 sm:grid-cols-2')}>
            <div>
              <label className={FIELD_LABEL} htmlFor="cat-parent">
                Danh mục cha
              </label>
              <select
                id="cat-parent"
                value={formData.parent_id}
                onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                className={cx(FIELD, 'cursor-pointer')}
              >
                <option value="">— Danh mục gốc —</option>
                {options
                  .filter(c => c._id !== editingCategory?._id)
                  .map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={FIELD_LABEL} htmlFor="cat-order">
                Thứ tự hiển thị
              </label>
              <input
                id="cat-order"
                type="number"
                min={0}
                value={formData.sort_order}
                onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                className={cx(FIELD, 'tabular-nums')}
              />
            </div>
          </div>

          <div className={FIELD_GROUP}>
            <label className={FIELD_LABEL} htmlFor="cat-icon">
              Biểu tượng
            </label>
            <input
              id="cat-icon"
              type="text"
              value={formData.icon}
              onChange={e => setFormData({ ...formData, icon: e.target.value })}
              placeholder="tag, users, settings…"
              className={cx(FIELD, MONO)}
            />
            <p className={FIELD_HINT}>Tên biểu tượng trong bộ Lucide.</p>
          </div>

          <div className={FIELD_GROUP}>
            <Toggle
              checked={formData.is_active}
              onChange={v => setFormData({ ...formData, is_active: v })}
              label="Hiển thị công khai"
              description="Tắt để tạm ẩn danh mục khỏi trang người mua mà không xoá dữ liệu."
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog Section */}
      <ConfirmDialog
        open={pendingDelete !== null}
        busy={deleting}
        title="Xoá danh mục?"
        message={
          <>
            Danh mục <strong className="font-semibold text-admin-ink">{pendingDelete?.name}</strong> sẽ bị xoá vĩnh viễn.
            {deleteChildCount > 0 && (
              <span className="mt-2 block rounded-admin border border-[#fdba74] bg-[#fff7ed] px-3 py-2 text-[12.5px] text-[#9a3412]">
                Danh mục này còn {deleteChildCount} danh mục con. Hãy chuyển hoặc xoá chúng trước.
              </span>
            )}
          </>
        }
        confirmLabel="Xoá danh mục"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Reject Proposed Category Modal with Reason */}
      <Modal
        open={pendingRejectCat !== null}
        onClose={() => !rejectingBusy && setPendingRejectCat(null)}
        title="Từ chối / Cấm đề xuất danh mục"
        description="Danh mục sẽ bị vô hiệu hoá và tự động gỡ liên kết khỏi toàn bộ sản phẩm liên quan"
        maxWidth="520px"
        footer={
          <>
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => setPendingRejectCat(null)}
              disabled={rejectingBusy}
            >
              Hủy
            </button>
            <button
              type="button"
              className={cx(
                BTN_DANGER,
                'border-rose-600 bg-rose-600 hover:bg-rose-700 hover:shadow-[0_4px_12px_rgba(225,29,72,0.25)]'
              )}
              onClick={confirmRejectCategory}
              disabled={rejectingBusy}
            >
              {rejectingBusy ? (
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
          {pendingRejectCat && (
            <div className="space-y-4">
              {/* Category info card */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs font-semibold text-sm">
                    {pendingRejectCat.icon ? pendingRejectCat.icon : <Folder size={16} className="text-amber-600" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate m-0">
                      {pendingRejectCat.name}
                    </p>
                    <p className={cx('truncate text-xs text-stone-500 m-0', MONO)}>
                      /{pendingRejectCat.slug}
                    </p>
                  </div>
                </div>
                {pendingRejectCat.proposed_by && (
                  <div className="shrink-0 text-right text-xs text-stone-600">
                    <span className="text-stone-400">Đề xuất bởi:</span>{' '}
                    <b className="text-stone-800">
                      {pendingRejectCat.proposed_by.shop_name || pendingRejectCat.proposed_by.full_name || 'Người bán'}
                    </b>
                  </div>
                )}
              </div>

              {/* Warning note */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950 m-0">Ảnh hưởng của thao tác:</p>
                  <p className="m-0 text-amber-900/90">
                    Danh mục sẽ được chuyển vào mục <b>"Đã từ chối / Cấm"</b> và ẩn khỏi marketplace. Toàn bộ sản phẩm đã gắn danh mục này sẽ tự động được gỡ liên kết. Bạn có thể xem lại hoặc khôi phục danh mục này bất cứ lúc nào.
                  </p>
                </div>
              </div>

              {/* Reason input with quick suggestion chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="cat-reject-reason" className={FIELD_LABEL}>
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
                    'Tên danh mục trùng lặp',
                    'Không đúng ngành hàng sàn',
                    'Tên danh mục không rõ nghĩa',
                    'Vi phạm quy định đặt tên',
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
                  id="cat-reject-reason"
                  rows={3}
                  className={cx(
                    FIELD,
                    'resize-none focus:border-rose-500 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]'
                  )}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Tên danh mục trùng lặp với danh mục hiện có, không phù hợp ngành hàng thủ công..."
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
