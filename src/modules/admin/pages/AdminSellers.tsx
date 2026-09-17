import React, { useState, useEffect, useCallback } from 'react';
import {
    Store, CheckCircle2, Eye, Check, AlertTriangle,
    ExternalLink, RefreshCw, XCircle, FileText
} from 'lucide-react';
import { adminSellerService, AdminSellerApplicationItem } from '../services/adminSellerService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import {
    PAGE, CARD, CARD_HEADER, TOOLBAR, TABLE, BTN_PRIMARY, BTN_SECONDARY,
    BTN_DANGER, BTN_SECONDARY_SM, FIELD, FIELD_LABEL, MODAL_BODY, cx
} from '../components/adminUi';
import {
    PageHeader, StatStrip, SearchField, SegmentedControl, StatusPill,
    Alert, EmptyState, Pagination, Modal, ConfirmDialog
} from '../components/AdminPrimitives';

export function AdminSellers() {
    const [items, setItems] = useState<AdminSellerApplicationItem[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);

    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [processingAction, setProcessingAction] = useState(false);

    const loadApplications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminSellerService.getApplications({
                status: filterStatus === 'ALL' ? undefined : filterStatus,
                search: search || undefined,
                page,
                limit
            });
            setItems(data.items || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
            if (data.stats) setStats(data.stats);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể tải danh sách hồ sơ người bán.'));
        } finally {
            setLoading(false);
        }
    }, [filterStatus, search, page, limit]);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const handleOpenDetail = async (id: string) => {
        setSelectedId(id);
        setDetailLoading(true);
        setDetailData(null);
        try {
            const data = await adminSellerService.getApplicationDetail(id);
            setDetailData(data);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể tải chi tiết hồ sơ.'));
        } finally {
            setDetailLoading(false);
        }
    };

    const handleApproveConfirm = async () => {
        if (!selectedId) return;
        setProcessingAction(true);
        try {
            const res = await adminSellerService.approveApplication(selectedId);
            setActionMessage(res.message || 'Phê duyệt hồ sơ thành công.');
            setIsApproveDialogOpen(false);
            setSelectedId(null);
            await loadApplications();
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Phê duyệt hồ sơ thất bại.'));
        } finally {
            setProcessingAction(false);
        }
    };

    const handleRejectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId || !rejectReason.trim()) return;
        setProcessingAction(true);
        try {
            const res = await adminSellerService.rejectApplication(selectedId, rejectReason.trim());
            setActionMessage(res.message || 'Đã từ chối hồ sơ thành công.');
            setIsRejectDialogOpen(false);
            setRejectReason('');
            setSelectedId(null);
            await loadApplications();
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Từ chối hồ sơ thất bại.'));
        } finally {
            setProcessingAction(false);
        }
    };

    return (
        <div className={PAGE}>
            <PageHeader
                title="Quản lý & Duyệt Hồ sơ Người bán (KYC)"
                description="Định danh khách hàng (KYC), đối soát tài khoản ngân hàng và cấp quyền mở gian hàng theo Nghị định 52/2013 & Nghị định 85/2021."
                actions={
                    <button
                        type="button"
                        onClick={loadApplications}
                        disabled={loading}
                        className={BTN_SECONDARY_SM}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                }
            />

            {actionMessage && (
                <Alert tone="success" onDismiss={() => setActionMessage(null)}>
                    {actionMessage}
                </Alert>
            )}

            {error && (
                <Alert tone="danger" onDismiss={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <StatStrip
                items={[
                    { label: 'Tổng hồ sơ', value: stats.total },
                    { label: 'Chờ phê duyệt', value: stats.pending, dot: '#f59e0b', hint: 'Cần xử lý' },
                    { label: 'Đã phê duyệt', value: stats.approved, dot: '#10b981', hint: 'Đang hoạt động' },
                    { label: 'Bị từ chối', value: stats.rejected, dot: '#ef4444' },
                ]}
                loading={loading}
            />

            <div className={TOOLBAR}>
                <SearchField
                    value={search}
                    onChange={(v) => { setSearch(v); setPage(1); }}
                    placeholder="Tìm theo tên shop, người bán, email, SĐT..."
                    label="Tìm kiếm hồ sơ người bán"
                />

                <SegmentedControl
                    value={filterStatus}
                    onChange={(val) => { setFilterStatus(val); setPage(1); }}
                    label="Lọc theo trạng thái"
                    options={[
                        { value: 'ALL', label: 'Tất cả', count: stats.total },
                        { value: 'PENDING_APPROVAL', label: 'Chờ duyệt', count: stats.pending },
                        { value: 'APPROVED', label: 'Đã duyệt', count: stats.approved },
                        { value: 'REJECTED', label: 'Bị từ chối', count: stats.rejected },
                    ]}
                />
            </div>

            <div className={CARD}>
                <div className={CARD_HEADER}>
                    <span className="text-[13.5px] font-bold text-admin-ink">
                        Danh sách hồ sơ ({total})
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className={TABLE}>
                        <thead>
                            <tr>
                                <th>GIAN HÀNG</th>
                                <th>NGƯỜI BÁN / ĐẠI DIỆN</th>
                                <th>LOẠI HÌNH</th>
                                <th>TÀI KHOẢN NGÂN HÀNG</th>
                                <th>ĐỐI SOÁT TÊN</th>
                                <th>TRẠNG THÁI</th>
                                <th className="text-right">HÀNH ĐỘNG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-admin-muted">
                                        <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-admin-brand" />
                                        Đang tải dữ liệu hồ sơ người bán...
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8">
                                        <EmptyState
                                            icon={FileText}
                                            title="Không có hồ sơ nào"
                                            description={search ? 'Không tìm thấy hồ sơ phù hợp với từ khóa.' : 'Chưa có hồ sơ đăng ký người bán nào trong danh mục này.'}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                items.map((app) => (
                                    <tr key={app.id}>
                                        <td>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-brand-050 text-admin-brand">
                                                    <Store size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-admin-ink">{app.shop_name}</div>
                                                    <div className="text-[11.5px] text-admin-muted">{app.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-semibold text-admin-ink">{app.full_name}</div>
                                            <div className="text-[11.5px] text-admin-muted">{app.phone} • CCCD: {app.id_card_masked}</div>
                                        </td>
                                        <td>
                                            <StatusPill tone={app.seller_type === 'BUSINESS' ? 'brand' : 'neutral'}>
                                                {app.seller_type === 'BUSINESS' ? 'Doanh nghiệp' : 'Cá nhân'}
                                            </StatusPill>
                                        </td>
                                        <td>
                                            <div className="font-mono text-[12.5px] font-bold text-admin-ink">{app.account_number_masked}</div>
                                            <div className="text-[11.5px] text-admin-muted">{app.bank_name} • {app.account_holder}</div>
                                        </td>
                                        <td>
                                            {app.is_name_matched ? (
                                                <span className="inline-flex items-center gap-1 rounded bg-admin-brand-050 px-2 py-0.5 text-[11px] font-bold text-admin-brand">
                                                    <Check size={12} /> Trùng khớp
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded bg-admin-danger-050 px-2 py-0.5 text-[11px] font-bold text-[#b91c1c]">
                                                    <AlertTriangle size={12} /> Lệch tên
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {app.status === 'PENDING_APPROVAL' && (
                                                <StatusPill tone="warn">Chờ duyệt</StatusPill>
                                            )}
                                            {app.status === 'APPROVED' && (
                                                <StatusPill tone="brand">Đã duyệt</StatusPill>
                                            )}
                                            {app.status === 'REJECTED' && (
                                                <StatusPill tone="danger">Từ chối</StatusPill>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDetail(app.id)}
                                                className={BTN_SECONDARY_SM}
                                            >
                                                <Eye size={13} />
                                                Xem hồ sơ
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    limit={limit}
                    onPageChange={(p) => setPage(p)}
                    itemLabel="hồ sơ"
                />
            </div>

            <Modal
                open={!!selectedId}
                title="Chi tiết Hồ sơ Định danh Người bán (KYC)"
                description={selectedId ? `Mã hồ sơ: ${selectedId}` : undefined}
                onClose={() => setSelectedId(null)}
                maxWidth="760px"
                footer={
                    <div className="flex w-full items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setSelectedId(null)}
                            className={BTN_SECONDARY}
                        >
                            Đóng
                        </button>
                        {detailData && detailData.status === 'PENDING_APPROVAL' && (
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsRejectDialogOpen(true)}
                                    disabled={processingAction}
                                    className={BTN_DANGER}
                                >
                                    <XCircle size={15} />
                                    Từ chối hồ sơ
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsApproveDialogOpen(true)}
                                    disabled={processingAction}
                                    className={BTN_PRIMARY}
                                >
                                    <CheckCircle2 size={15} />
                                    Phê duyệt & Kích hoạt Shop
                                </button>
                            </div>
                        )}
                    </div>
                }
            >
                <div className={MODAL_BODY}>
                    {detailLoading ? (
                        <div className="py-12 text-center text-admin-muted">
                            <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-admin-brand" />
                            Đang tải và giải mã dữ liệu định danh an toàn...
                        </div>
                    ) : detailData ? (
                        <div className="space-y-5 text-[13px]">
                            <div className="rounded-admin border border-admin-line bg-admin-canvas p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-admin-line pb-2 font-bold text-admin-ink">
                                    <span>Thông tin Định danh (CCCD / GPKD)</span>
                                    <StatusPill tone={detailData.seller_type === 'BUSINESS' ? 'brand' : 'neutral'}>
                                        {detailData.seller_type === 'BUSINESS' ? 'Doanh nghiệp' : 'Cá nhân'}
                                    </StatusPill>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-admin-body">
                                    <div>Họ và tên: <strong className="text-admin-ink">{detailData.kyc_data?.full_name}</strong></div>
                                    <div>Số CCCD (Giải mã): <strong className="font-mono text-admin-ink">{detailData.kyc_data?.id_card_number}</strong></div>
                                    <div>Ngày sinh: <span>{detailData.kyc_data?.date_of_birth || 'Chưa cung cấp'}</span></div>
                                    <div>Ngày cấp CCCD: <span>{detailData.kyc_data?.id_issue_date || 'Chưa cung cấp'}</span></div>
                                    <div>Nơi cấp: <span>{detailData.kyc_data?.id_issue_place || 'Chưa cung cấp'}</span></div>
                                    <div>Mã số thuế: <span>{detailData.kyc_data?.tax_code || 'Chưa cung cấp'}</span></div>
                                </div>

                                {detailData.seller_type === 'BUSINESS' && (
                                    <div className="border-t border-admin-line pt-2.5 grid grid-cols-2 gap-3">
                                        <div className="col-span-2">Tên Doanh nghiệp: <strong className="text-admin-ink">{detailData.kyc_data?.company_name}</strong></div>
                                        <div>Mã số DN / MST: <strong className="font-mono text-admin-ink">{detailData.kyc_data?.business_license_number || 'Chưa có'}</strong></div>
                                        <div>Người đại diện: <strong className="text-admin-ink">{detailData.kyc_data?.legal_rep_name} ({detailData.kyc_data?.legal_rep_position})</strong></div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between font-bold text-admin-ink">
                                    <span>Tài liệu ảnh định danh (HMAC Presigned Token)</span>
                                    <span className="text-[11.5px] text-admin-brand font-semibold">Hiệu lực 10 phút</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {detailData.kyc_data?.front_id_url && (
                                        <div className="rounded-admin border border-admin-line bg-admin-canvas p-2 text-center space-y-1.5">
                                            <span className="text-[11.5px] font-bold text-admin-muted block">Mặt trước CCCD</span>
                                            <a href={detailData.kyc_data.front_id_url} target="_blank" rel="noreferrer" className="block relative group">
                                                <img src={detailData.kyc_data.front_id_url} alt="Mặt trước" className="h-24 w-full object-cover rounded-lg border border-admin-line group-hover:opacity-85" />
                                                <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 text-xs font-bold transition-opacity">
                                                    Phóng to
                                                </span>
                                            </a>
                                        </div>
                                    )}
                                    {detailData.kyc_data?.back_id_url && (
                                        <div className="rounded-admin border border-admin-line bg-admin-canvas p-2 text-center space-y-1.5">
                                            <span className="text-[11.5px] font-bold text-admin-muted block">Mặt sau CCCD</span>
                                            <a href={detailData.kyc_data.back_id_url} target="_blank" rel="noreferrer" className="block relative group">
                                                <img src={detailData.kyc_data.back_id_url} alt="Mặt sau" className="h-24 w-full object-cover rounded-lg border border-admin-line group-hover:opacity-85" />
                                                <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 text-xs font-bold transition-opacity">
                                                    Phóng to
                                                </span>
                                            </a>
                                        </div>
                                    )}
                                    {detailData.kyc_data?.portrait_url && (
                                        <div className="rounded-admin border border-admin-line bg-admin-canvas p-2 text-center space-y-1.5">
                                            <span className="text-[11.5px] font-bold text-admin-muted block">Ảnh chân dung</span>
                                            <a href={detailData.kyc_data.portrait_url} target="_blank" rel="noreferrer" className="block relative group">
                                                <img src={detailData.kyc_data.portrait_url} alt="Chân dung" className="h-24 w-full object-cover rounded-lg border border-admin-line group-hover:opacity-85" />
                                                <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-white opacity-0 group-hover:opacity-100 text-xs font-bold transition-opacity">
                                                    Phóng to
                                                </span>
                                            </a>
                                        </div>
                                    )}
                                    {detailData.kyc_data?.business_license_url && (
                                        <div className="col-span-2 sm:col-span-3 rounded-admin border border-admin-line bg-admin-canvas p-3 text-center space-y-1.5">
                                            <span className="text-[11.5px] font-bold text-admin-muted block">Giấy phép đăng ký kinh doanh</span>
                                            <a
                                                href={detailData.kyc_data.business_license_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={BTN_SECONDARY_SM}
                                            >
                                                <ExternalLink size={13} /> Mở file Giấy phép kinh doanh
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-admin border border-admin-line bg-admin-canvas p-4 space-y-3">
                                <div className="border-b border-admin-line pb-2 font-bold text-admin-ink">
                                    Gian hàng & Tài khoản Quyết toán Doanh thu
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-admin-body">
                                    <div>Tên gian hàng: <strong className="text-admin-ink">{detailData.shop_info?.shop_name}</strong></div>
                                    <div>Danh mục: <span>{detailData.shop_info?.main_category}</span></div>
                                    <div className="col-span-2">
                                        Địa chỉ lấy hàng: <span>{detailData.shop_info?.pickup_address?.address_detail}, {detailData.shop_info?.pickup_address?.ward_code}, {detailData.shop_info?.pickup_address?.district_id}, {detailData.shop_info?.pickup_address?.province_id}</span>
                                    </div>
                                    <div className="col-span-2 border-t border-admin-line pt-2">
                                        Ngân hàng: <strong className="text-admin-ink">{detailData.bank_info?.bank_name}</strong>
                                    </div>
                                    <div>Số tài khoản: <strong className="font-mono text-admin-ink">{detailData.bank_info?.account_number}</strong></div>
                                    <div>Chủ tài khoản: <strong className="uppercase text-admin-ink">{detailData.bank_info?.account_holder}</strong></div>
                                </div>

                                <div className={cx(
                                    'rounded-admin border p-2.5 text-xs font-bold flex items-center gap-2',
                                    detailData.bank_info?.is_name_matched
                                        ? 'border-[#b7e0b7] bg-admin-brand-050 text-admin-brand-700'
                                        : 'border-[#f6caca] bg-admin-danger-050 text-[#b91c1c]'
                                )}>
                                    {detailData.bank_info?.is_name_matched ? (
                                        <>✓ Tên chủ tài khoản khớp với tên giấy tờ định danh (Hợp lệ theo NĐ 52 & NĐ 85)</>
                                    ) : (
                                        <>⚠ Tên chủ tài khoản không khớp với tên trên giấy tờ định danh</>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-admin border border-admin-line bg-admin-canvas p-3.5 text-admin-muted space-y-1 text-[12px]">
                                <div>Chữ ký điện tử: <strong className="text-admin-ink">{detailData.compliance?.electronic_signature}</strong></div>
                                <div>Thời gian ký: {new Date(detailData.compliance?.signed_at).toLocaleString('vi-VN')}</div>
                                <div>Địa chỉ IP: {detailData.compliance?.ip_address}</div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </Modal>

            <ConfirmDialog
                open={isApproveDialogOpen}
                title="Xác nhận Phê duyệt Hồ sơ"
                message={`Bạn có chắc chắn muốn phê duyệt gian hàng "${detailData?.shop_info?.shop_name}"? Hệ thống sẽ cấp role SELLER, khởi tạo Shop và gửi thông báo/email chúc mừng cho người dùng.`}
                confirmLabel="Phê duyệt"
                cancelLabel="Quay lại"
                tone="brand"
                busy={processingAction}
                onConfirm={handleApproveConfirm}
                onCancel={() => setIsApproveDialogOpen(false)}
            />

            <Modal
                open={isRejectDialogOpen}
                title="Từ chối Hồ sơ Người bán"
                description="Vui lòng nhập lý do từ chối cụ thể để người dùng có thể điều chỉnh và nộp lại hồ sơ."
                onClose={() => setIsRejectDialogOpen(false)}
                maxWidth="460px"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsRejectDialogOpen(false)}
                            className={BTN_SECONDARY}
                            disabled={processingAction}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleRejectSubmit}
                            disabled={processingAction || !rejectReason.trim()}
                            className={BTN_DANGER}
                        >
                            {processingAction ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleRejectSubmit} className={MODAL_BODY}>
                    <label className={FIELD_LABEL}>
                        Lý do từ chối hồ sơ <span className="text-admin-danger">*</span>
                    </label>
                    <textarea
                        rows={4}
                        placeholder="VD: Ảnh CCCD mặt sau bị mờ / Tên chủ tài khoản ngân hàng không khớp với họ tên trên CCCD..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className={FIELD}
                        required
                    />
                </form>
            </Modal>
        </div>
    );
}

export default AdminSellers;
