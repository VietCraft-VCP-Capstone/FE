import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
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
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { Category, CategoryOption, CategoryStats, CategoryStatusFilter, CategoryTreePage } from '../types';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import {
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
const EMPTY_STATS: CategoryStats = { total: 0, active: 0, hidden: 0, roots: 0 };
const EMPTY_TREE: CategoryTreePage = { items: [], total: 0, page: 1, limit: 15, totalPages: 1, totalNodes: 0 };

export function AdminCategories() {
  /* Yêu cầu gửi lên máy chủ. */
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CategoryStatusFilter>('all');
  // Lọc đã chuyển xuống máy chủ, nên phải chờ người dùng gõ xong mới gọi.
  const debouncedSearch = useDebouncedValue(search, 300);

  /* Kết quả từ máy chủ. */
  const [tree, setTree] = useState<CategoryTreePage>(EMPTY_TREE);
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
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadOptions(); }, [loadOptions]);

  // Đổi từ khoá hay bộ lọc thì tập kết quả khác hẳn — ở lại trang 4 là vô nghĩa.
  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const reloadAll = useCallback(async () => {
    await Promise.all([loadTree(), loadStats(), loadOptions()]);
  }, [loadTree, loadStats, loadOptions]);

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
          { label: 'Đang hoạt động', value: stats.active, dot: '#1a6b1a' },
          { label: 'Đang ẩn', value: stats.hidden, dot: '#cbd5d0' },
          { label: 'Danh mục gốc', value: stats.roots },
        ]}
      />

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
    </div>
  );
}
