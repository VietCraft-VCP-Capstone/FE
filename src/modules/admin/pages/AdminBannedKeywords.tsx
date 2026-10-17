import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  SearchX,
  Info,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { BannedKeyword, BannedKeywordStats, Paginated } from '../types';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  FIELD,
  FIELD_GROUP,
  FIELD_HINT,
  FIELD_LABEL,
  ICON_BTN_DANGER,
  MODAL_BODY,
  PAGE,
  TABLE,
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
} from '../components/AdminPrimitives';

function emptyPage<T>(limit = 20): Paginated<T> {
  return { items: [], total: 0, page: 1, limit, totalPages: 1 };
}

const COMMON_REASONS = [
  'Chất gây nghiện / Ma túy',
  'Nội dung 18+ / Đồi trụy / Khiêu dâm',
  'Vũ khí / Chất nổ / Bạo lực',
  'Cờ bạc / Cá cược / Tệ nạn',
  'Động vật hoang dã cấm buôn bán',
  'Tục tĩu / Xúc phạm / Chửi thề',
  'Hàng giả / Nhái / Vi phạm bản quyền',
  'Vi phạm chính sách sàn',
];

export function AdminBannedKeywords() {
  const [stats, setStats] = useState<BannedKeywordStats>({ total: 0, customCount: 0, systemCount: 0 });
  const [scope, setScope] = useState<'all' | 'custom' | 'system'>('all');
  const [page, setPage] = useState<Paginated<BannedKeyword>>(emptyPage(20));
  const [pageNo, setPageNo] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  // Modal thêm từ cấm
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReason, setNewReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  // Modal xác nhận xóa
  const [pendingDelete, setPendingDelete] = useState<BannedKeyword | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Nạp thống kê
  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getBannedKeywordStats();
      if (data) setStats(data);
    } catch {
      // bỏ qua lỗi stats
    }
  }, []);

  // Nạp danh sách
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getBannedKeywords({
        search: debouncedSearch,
        page: pageNo,
        limit: 20,
        scope,
      });
      setPage(data);
      if (data.page !== pageNo) setPageNo(data.page);
    } catch (err: any) {
      setBanner({ kind: 'error', text: err.response?.data?.error || err.message || 'Không thể tải danh sách từ cấm' });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, pageNo, scope]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Reset về trang 1 khi gõ tìm kiếm hoặc đổi scope
  useEffect(() => {
    setPageNo(1);
  }, [debouncedSearch, scope]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    setCreateBusy(true);
    try {
      const finalReason = newReason === 'Khác' ? (customReason.trim() || 'Vi phạm chính sách sàn') : newReason;
      await adminService.createBannedKeyword({ keyword: kw, reason: finalReason });
      setCreateModalOpen(false);
      setNewKeyword('');
      setCustomReason('');
      setBanner({ kind: 'info', text: `Đã thêm từ khóa cấm: "${kw}"` });
      loadStats();
      loadList();
    } catch (err: any) {
      setBanner({ kind: 'error', text: err.response?.data?.error || err.message || 'Không thể thêm từ cấm' });
    } finally {
      setCreateBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    try {
      await adminService.deleteBannedKeyword(pendingDelete._id);
      setBanner({ kind: 'info', text: `Đã xóa từ cấm: "${pendingDelete.keyword}"` });
      setPendingDelete(null);
      loadStats();
      loadList();
    } catch (err: any) {
      setBanner({ kind: 'error', text: err.response?.data?.error || err.message || 'Không thể xóa từ cấm' });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleSeed = async () => {
    try {
      const res = await adminService.seedBannedKeywords();
      setBanner({ kind: 'info', text: res.added > 0 ? `Đã đồng bộ ${res.added} từ khóa hệ thống vào danh sách quản lý!` : 'Tất cả từ khóa mẫu đã có trong danh sách.' });
      loadStats();
      loadList();
    } catch (err: any) {
      setBanner({ kind: 'error', text: err.response?.data?.error || err.message || 'Không thể đồng bộ từ khóa mẫu' });
    }
  };

  return (
    <div className={PAGE}>
      <PageHeader
        title="Quản lý từ khóa cấm"
        description="Thiết lập danh sách từ ngữ bị cấm trên sàn. Người bán sẽ bị chặn ngay lập tức nếu đề xuất danh mục hoặc thẻ vi phạm các từ khóa này."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={handleSeed}
              title="Khởi tạo từ khóa hệ thống mẫu"
            >
              <RefreshCw size={15} />
              <span>Đồng bộ từ mẫu</span>
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => { setCreateModalOpen(true); }}
            >
              <Plus size={16} />
              <span>Thêm từ cấm</span>
            </button>
          </div>
        }
      />

      {banner && (
        <Alert
          tone={banner.kind === 'error' ? 'danger' : 'success'}
          onDismiss={() => setBanner(null)}
        >
          {banner.text}
        </Alert>
      )}

      {/* Thống kê */}
      <StatStrip
        items={[
          { label: 'Tổng từ khóa đang lọc', value: stats.total, dot: '#dc2626' },
          { label: 'Từ khóa Admin thêm', value: stats.customCount, dot: '#2563eb' },
          { label: 'Quy chuẩn sàn tích hợp', value: stats.systemCount, dot: '#1a6b1a' },
        ]}
      />

      <div className="flex items-center gap-2.5 p-3.5 mb-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
        <Info size={16} className="shrink-0 text-amber-700" />
        <div>
          Toàn bộ danh sách <b>{stats.systemCount} từ khóa quy chuẩn sàn</b> (chống ma túy, vũ khí, khiêu dâm, cờ bạc, hàng cấm...) và các từ khóa do Admin bổ sung đều hiển thị đầy đủ bên dưới. Bạn có thể tra cứu hoặc thêm mới bất kỳ lúc nào.
        </div>
      </div>

      {/* Danh sách */}
      <div className={CARD}>
        <div className="flex flex-col gap-3 p-4 border-b border-admin-line sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs bộ lọc */}
          <div className="flex items-center gap-1.5 p-1 bg-admin-canvas rounded-xl border border-admin-line">
            <button
              type="button"
              onClick={() => { setScope('all'); setPageNo(1); }}
              className={cx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border',
                scope === 'all'
                  ? 'bg-white text-admin-ink shadow-xs border-admin-line font-bold'
                  : 'bg-transparent text-admin-muted border-transparent hover:text-admin-ink'
              )}
            >
              <span>Tất cả</span>
              <span className={cx(
                'px-1.5 py-0.5 rounded-full text-[10.5px]',
                scope === 'all' ? 'bg-rose-100 text-rose-800' : 'bg-admin-line-soft text-admin-muted'
              )}>
                {stats.total}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setScope('custom'); setPageNo(1); }}
              className={cx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border',
                scope === 'custom'
                  ? 'bg-white text-admin-ink shadow-xs border-admin-line font-bold'
                  : 'bg-transparent text-admin-muted border-transparent hover:text-admin-ink'
              )}
            >
              <span>Admin thêm</span>
              <span className={cx(
                'px-1.5 py-0.5 rounded-full text-[10.5px]',
                scope === 'custom' ? 'bg-blue-100 text-blue-800' : 'bg-admin-line-soft text-admin-muted'
              )}>
                {stats.customCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setScope('system'); setPageNo(1); }}
              className={cx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border',
                scope === 'system'
                  ? 'bg-white text-admin-ink shadow-xs border-admin-line font-bold'
                  : 'bg-transparent text-admin-muted border-transparent hover:text-admin-ink'
              )}
            >
              <ShieldCheck size={13} className={scope === 'system' ? 'text-emerald-600' : 'text-admin-muted'} />
              <span>Quy chuẩn sàn</span>
              <span className={cx(
                'px-1.5 py-0.5 rounded-full text-[10.5px]',
                scope === 'system' ? 'bg-emerald-100 text-emerald-800' : 'bg-admin-line-soft text-admin-muted'
              )}>
                {stats.systemCount}
              </span>
            </button>
          </div>

          <div className="w-full sm:w-[280px]">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Tìm kiếm từ cấm hoặc phân loại..."
              label="Tìm kiếm từ cấm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className="w-[300px]">Từ khóa cấm</th>
                <th>Phân loại / Lý do</th>
                <th className="w-[200px]">Người thêm</th>
                <th className="w-[160px]">Thời gian</th>
                <th className="w-[100px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <SkeletonRows columns={['140px', '220px', '140px', '120px', '60px']} />
                  </td>
                </tr>
              ) : page.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      icon={debouncedSearch ? SearchX : ShieldAlert}
                      title={debouncedSearch ? 'Không tìm thấy từ cấm phù hợp' : 'Chưa có từ cấm nào'}
                      description={
                        debouncedSearch
                          ? `Không có từ khóa nào khớp với "${debouncedSearch}". Thử từ khóa khác.`
                          : 'Hiện chưa có từ cấm nào trong danh mục này.'
                      }
                      action={
                        debouncedSearch ? undefined : (
                          <button
                            type="button"
                            className={BTN_PRIMARY}
                            onClick={() => setCreateModalOpen(true)}
                          >
                            <Plus size={15} /> Thêm từ cấm
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                page.items.map((item) => (
                  <tr key={item._id} className="hover:bg-admin-canvas/50 transition-colors">
                    <td className="font-medium text-admin-ink">
                      <div className="flex items-center gap-2">
                        <span className={cx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-xs font-semibold",
                          item.is_system
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        )}>
                          {item.is_system ? (
                            <ShieldCheck size={12} className="text-emerald-600" />
                          ) : (
                            <ShieldAlert size={12} className="text-rose-600" />
                          )}
                          {item.keyword}
                        </span>
                        {item.is_system ? (
                          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100/70 text-emerald-800">
                            Quy chuẩn
                          </span>
                        ) : (
                          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100/70 text-blue-800">
                            Tùy chỉnh
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-admin-ink text-xs">
                      {item.reason || 'Vi phạm chính sách sàn'}
                    </td>
                    <td className="text-xs">
                      {item.is_system ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          Hệ thống (Mặc định)
                        </span>
                      ) : (
                        <span className="text-admin-ink font-medium">
                          {item.created_by?.full_name || item.created_by?.email || 'Quản trị viên'}
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-admin-muted">
                      {item.is_system ? (
                        <span className="italic text-admin-muted">Tích hợp sẵn</span>
                      ) : item.created_at ? (
                        new Date(item.created_at).toLocaleDateString('vi-VN')
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-right">
                      {item.is_system ? (
                        <span className="inline-block text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-not-allowed select-none" title="Từ khóa mặc định được hệ thống bảo vệ">
                          Cố định
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={ICON_BTN_DANGER}
                          onClick={() => setPendingDelete(item)}
                          title="Xóa khỏi danh sách cấm"
                          aria-label={`Xóa từ khóa ${item.keyword}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {page.totalPages > 1 && (
          <div className="p-4 border-t border-admin-line">
            <Pagination
              page={page.page}
              totalPages={page.totalPages}
              total={page.total}
              limit={page.limit}
              onPageChange={setPageNo}
            />
          </div>
        )}
      </div>

      {/* Modal Thêm từ cấm */}
      <Modal
        open={createModalOpen}
        onClose={() => { if (!createBusy) setCreateModalOpen(false); }}
        title="Thêm từ khóa cấm mới"
        maxWidth="520px"
        footer={
          <>
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => setCreateModalOpen(false)}
              disabled={createBusy}
            >
              Hủy
            </button>
            <button
              type="submit"
              form="create-banned-keyword-form"
              className={BTN_PRIMARY}
              disabled={createBusy || !newKeyword.trim()}
            >
              {createBusy && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" />}
              Thêm từ cấm
            </button>
          </>
        }
      >
        <form id="create-banned-keyword-form" onSubmit={handleCreate} className={MODAL_BODY}>
          <div className={FIELD_GROUP}>
            <label htmlFor="banned-keyword-input" className={FIELD_LABEL}>
              Từ hoặc cụm từ cấm <span className="text-rose-600">*</span>
            </label>
            <input
              id="banned-keyword-input"
              type="text"
              className={FIELD}
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Ví dụ: súng bắn, cỏ mỹ, cá độ online..."
              required
            />
            <p className={FIELD_HINT}>
              Hệ thống tự động kiểm tra không phân biệt chữ hoa/thường, không phân biệt có dấu hay không dấu.
            </p>
          </div>

          <div className={FIELD_GROUP}>
            <label htmlFor="banned-reason-select" className={FIELD_LABEL}>
              Phân loại / Lý do cấm
            </label>
            <select
              id="banned-reason-select"
              className={FIELD}
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
            >
              {COMMON_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Khác">Lý do khác...</option>
            </select>
          </div>

          {newReason === 'Khác' && (
            <div className={FIELD_GROUP}>
              <label htmlFor="custom-reason-input" className={FIELD_LABEL}>
                Nhập lý do cụ thể
              </label>
              <input
                id="custom-reason-input"
                type="text"
                className={FIELD}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do vi phạm..."
              />
            </div>
          )}
        </form>
      </Modal>

      {/* Modal xác nhận xóa */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => { if (!deleteBusy) setPendingDelete(null); }}
        onConfirm={handleDelete}
        title="Gỡ bỏ từ khóa cấm?"
        message={
          <>
            Từ khóa <strong className="font-semibold text-admin-ink">"{pendingDelete?.keyword}"</strong> sẽ bị gỡ khỏi danh sách cấm. Sau khi gỡ, người bán có thể sử dụng lại từ khóa này.
          </>
        }
        confirmLabel="Xác nhận gỡ"
        tone="danger"
        busy={deleteBusy}
      />
    </div>
  );
}
export default AdminBannedKeywords;
