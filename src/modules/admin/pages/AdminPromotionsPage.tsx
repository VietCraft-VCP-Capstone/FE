import React, { useState, useEffect, useMemo } from 'react';
import {
    Ticket, Plus, Search, Trash2, Flame, Truck, Percent,
    Coins, Check, Copy, X, AlertCircle, RefreshCw,
    Layers, ToggleLeft, ToggleRight, Store, ShieldCheck
} from 'lucide-react';

import { promotionService, CouponDTO, CreateCouponPayload, CouponDiscountType } from '../../promotion/services/promotionService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

const parseVal = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val.$numberDecimal) return Number(val.$numberDecimal) || 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

export function AdminPromotionsPage() {

    const [coupons, setCoupons] = useState<CouponDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [scopeFilter, setScopeFilter] = useState<'ALL' | 'PLATFORM' | 'SHOP'>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE'>('ALL');

    // Create Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const initialForm: CreateCouponPayload = {
        code: '',
        title: '',
        description: '',
        discount_type: 'PERCENTAGE',
        discount_value: 15,
        min_order_value: 200000,
        max_discount_amount: 100000,
        usage_limit: 500,
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        shop_id: null
    };
    const [formData, setFormData] = useState<CreateCouponPayload>(initialForm);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const fetchCoupons = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await promotionService.getAdminCoupons();
            setCoupons(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể tải danh sách khuyến mãi toàn sàn.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleToggleStatus = async (couponId: string) => {
        try {
            const updated = await promotionService.toggleAdminCoupon(couponId);
            setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, is_active: updated.is_active } : c));
            setSuccessMsg(`Đã ${updated.is_active ? 'kích hoạt' : 'tạm dừng'} mã voucher.`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể đổi trạng thái mã giảm giá.'));
        }
    };

    const handleDelete = async (coupon: CouponDTO) => {
        if ((coupon.used_count || 0) > 0) {
            alert(`Không thể xóa voucher toàn sàn "${coupon.code}" vì đã có ${coupon.used_count} đơn hàng sử dụng.\n\nĐể đảm bảo toàn vẹn dữ liệu đơn hàng và đối soát tài chính, bạn chỉ có thể TẮT mã thay vì xóa.`);
            return;
        }
        if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá toàn sàn "${coupon.code}" khỏi hệ thống?`)) return;
        try {
            await promotionService.deleteAdminCoupon(coupon.id);
            setCoupons(prev => prev.filter(c => c.id !== coupon.id));
            setSuccessMsg(`Đã xóa mã voucher "${coupon.code}" thành công.`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể xóa mã giảm giá.'));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        const cleanCode = (formData.code || '').trim().toUpperCase();

        if (!cleanCode) {
            errors.code = 'Vui lòng nhập mã voucher.';
        } else if (cleanCode.length < 3 || cleanCode.length > 20) {
            errors.code = 'Mã voucher phải từ 3 đến 20 ký tự.';
        } else if (!/^[A-Z0-9_]+$/.test(cleanCode)) {
            errors.code = 'Mã chỉ được chứa chữ hoa không dấu, chữ số và dấu gạch dưới (VD: VIETCRAFT50).';
        }

        const cleanTitle = (formData.title || '').trim();
        if (!cleanTitle) {
            errors.title = 'Vui lòng nhập tên chương trình ưu đãi.';
        } else if (cleanTitle.length < 3 || cleanTitle.length > 100) {
            errors.title = 'Tên chương trình phải từ 3 đến 100 ký tự.';
        }

        const discountVal = Number(formData.discount_value);
        if (isNaN(discountVal) || discountVal <= 0) {
            errors.discount_value = 'Mức giảm giá phải lớn hơn 0.';
        } else if (formData.discount_type === 'PERCENTAGE' && discountVal > 100) {
            errors.discount_value = 'Giảm giá theo % không thể vượt quá 100%.';
        } else if (formData.discount_type === 'FIXED_AMOUNT' && formData.min_order_value && discountVal >= Number(formData.min_order_value)) {
            errors.discount_value = 'Số tiền giảm cố định phải nhỏ hơn giá trị đơn hàng tối thiểu.';
        }

        if (!formData.start_date) {
            errors.start_date = 'Vui lòng chọn thời gian bắt đầu.';
        }
        if (!formData.end_date) {
            errors.end_date = 'Vui lòng chọn thời gian kết thúc.';
        } else if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            errors.end_date = 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.';
        }

        if (formData.usage_limit !== undefined && formData.usage_limit !== null && formData.usage_limit !== ('' as any)) {
            const limit = Number(formData.usage_limit);
            if (isNaN(limit) || limit < 1 || !Number.isInteger(limit)) {
                errors.usage_limit = 'Lượt sử dụng phải là số nguyên dương (>= 1).';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            const newCoupon = await promotionService.createAdminCoupon({
                ...formData,
                code: formData.code.trim().toUpperCase(),
                discount_value: Number(formData.discount_value),
                min_order_value: formData.min_order_value ? Number(formData.min_order_value) : undefined,
                max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : undefined,
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : undefined,
                shop_id: null
            });

            setCoupons(prev => [newCoupon, ...prev]);
            setShowModal(false);
            setFormData(initialForm);
            setFormErrors({});
            setSuccessMsg(`Đã tạo mã giảm giá toàn sàn ${newCoupon.code} thành công!`);
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể tạo mã giảm giá. Vui lòng kiểm tra lại.'));
        } finally {
            setSubmitting(false);
        }
    };

    const stats = useMemo(() => {
        const now = new Date();
        const total = coupons.length;
        const platformCount = coupons.filter(c => c.is_platform).length;
        const active = coupons.filter(c => c.is_active && new Date(c.start_date) <= now && new Date(c.end_date) >= now).length;
        const flashSaleCount = coupons.filter(c => c.discount_type === 'FLASH_SALE' && c.is_active).length;
        const totalUsed = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
        return { total, platformCount, active, flashSaleCount, totalUsed };
    }, [coupons]);

    const filteredCoupons = useMemo(() => {
        const now = new Date();
        return coupons.filter(c => {
            const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.shop_name && c.shop_name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesScope = scopeFilter === 'ALL'
                ? true
                : scopeFilter === 'PLATFORM' ? c.is_platform : !c.is_platform;

            const matchesType = typeFilter === 'ALL' || c.discount_type === typeFilter;

            const isExpired = new Date(c.end_date) < now;
            let matchesStatus = true;
            if (statusFilter === 'ACTIVE') matchesStatus = c.is_active && !isExpired && new Date(c.start_date) <= now;
            else if (statusFilter === 'EXPIRED') matchesStatus = isExpired;
            else if (statusFilter === 'INACTIVE') matchesStatus = !c.is_active;

            return matchesSearch && matchesScope && matchesType && matchesStatus;
        });
    }, [coupons, searchTerm, scopeFilter, typeFilter, statusFilter]);

    const getTypeBadge = (type: CouponDiscountType) => {
        switch (type) {
            case 'FLASH_SALE':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-600 border border-amber-200">
                        <Flame size={12} className="text-amber-500 fill-amber-500 animate-pulse" /> Flash Sale
                    </span>
                );
            case 'FREE_SHIPPING':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border border-sky-200">
                        <Truck size={12} /> Freeship Sàn
                    </span>
                );
            case 'PERCENTAGE':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-200">
                        <Percent size={12} /> Giảm %
                    </span>
                );
            case 'FIXED_AMOUNT':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <Coins size={12} /> Tiền cố định
                    </span>
                );
            case 'BUNDLE':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <Layers size={12} /> Combo Sàn
                    </span>
                );
        }
    };

    return (
        <div className="rounded-xl border border-admin-line bg-admin-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] font-sans space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="mt-0 mb-1 text-[22px] font-bold text-[#330033] flex items-center gap-2">
                        <Ticket className="text-admin-brand" size={26} />
                        Quản lý Chiến dịch Khuyến mãi & Voucher Toàn Sàn
                    </h2>
                    <p className="mt-0 text-[13px] text-[#666]">
                        Tạo mã ưu đãi sàn VietCraft (Mega Sale, Lễ hội làng nghề, Freeship) và giám sát mã khuyến mãi của các gian hàng.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 bg-admin-brand hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition"
                >
                    <Plus size={16} />
                    Tạo Voucher Toàn Sàn
                </button>
            </div>

            {/* Notification messages */}
            {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Check size={16} className="text-emerald-600" />
                    {successMsg}
                </div>
            )}
            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    {error}
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
                    <span className="mb-1 block text-[11px] font-bold text-[#777] uppercase tracking-wider">Tổng Voucher</span>
                    <span className="text-2xl font-black text-stone-900">{stats.total}</span>
                </div>
                <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
                    <span className="mb-1 block text-[11px] font-bold text-[#777] uppercase tracking-wider">Voucher Sàn</span>
                    <span className="text-2xl font-black text-admin-brand">{stats.platformCount}</span>
                </div>
                <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
                    <span className="mb-1 block text-[11px] font-bold text-[#777] uppercase tracking-wider">Đang hoạt động</span>
                    <span className="text-2xl font-black text-emerald-600">{stats.active}</span>
                </div>
                <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
                    <span className="mb-1 block text-[11px] font-bold text-[#777] uppercase tracking-wider">Flash Sale</span>
                    <span className="text-2xl font-black text-amber-500">{stats.flashSaleCount}</span>
                </div>
                <div className="rounded-lg border border-admin-line bg-admin-canvas p-4">
                    <span className="mb-1 block text-[11px] font-bold text-[#777] uppercase tracking-wider">Lượt áp dụng</span>
                    <span className="text-2xl font-black text-stone-900">{stats.totalUsed}</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b border-admin-line pb-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                    <input
                        type="text"
                        placeholder="Tìm theo mã, tên voucher hoặc shop..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-admin-line rounded-lg focus:outline-none focus:border-admin-brand"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                        value={scopeFilter}
                        onChange={(e) => setScopeFilter(e.target.value as any)}
                        className="text-xs border border-admin-line rounded-lg px-3 py-2 bg-white focus:outline-none"
                    >
                        <option value="ALL">Tất cả nguồn phát hành</option>
                        <option value="PLATFORM">Chỉ Voucher Sàn</option>
                        <option value="SHOP">Chỉ Voucher Shop</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-xs border border-admin-line rounded-lg px-3 py-2 bg-white focus:outline-none"
                    >
                        <option value="ALL">Tất cả loại ưu đãi</option>
                        <option value="PERCENTAGE">Giảm theo %</option>
                        <option value="FIXED_AMOUNT">Giảm tiền cố định</option>
                        <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
                        <option value="FLASH_SALE">Flash Sale</option>
                        <option value="BUNDLE">Mua theo combo</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="text-xs border border-admin-line rounded-lg px-3 py-2 bg-white focus:outline-none"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang diễn ra</option>
                        <option value="EXPIRED">Đã hết hạn</option>
                        <option value="INACTIVE">Đã tắt</option>
                    </select>

                    <button
                        onClick={fetchCoupons}
                        className="p-2 text-stone-500 hover:text-stone-900 border border-admin-line rounded-lg hover:bg-stone-50 transition"
                        title="Tải lại"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Coupons Table */}
            {loading ? (
                <div className="py-20 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin text-admin-brand" size={20} />
                    Đang tải danh sách voucher...
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="py-16 text-center text-stone-400 text-xs">
                    Không tìm thấy mã giảm giá nào phù hợp với bộ lọc.
                </div>
            ) : (
                <div className="overflow-x-auto border border-admin-line rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-admin-canvas border-b border-admin-line text-stone-500 font-bold">
                                <th className="p-3">Mã Voucher</th>
                                <th className="p-3">Chương trình</th>
                                <th className="p-3">Nguồn phát hành</th>
                                <th className="p-3">Loại ưu đãi</th>
                                <th className="p-3">Mức giảm / Điều kiện</th>
                                <th className="p-3">Lượt dùng</th>
                                <th className="p-3">Thời hạn</th>
                                <th className="p-3">Trạng thái</th>
                                <th className="p-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-admin-line bg-white">
                            {filteredCoupons.map((coupon) => {
                                const isExpired = new Date(coupon.end_date) < new Date();
                                return (
                                    <tr key={coupon.id} className="hover:bg-[#f9fbf9] transition">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-stone-900 text-xs bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                                    {coupon.code}
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(coupon.code)}
                                                    className="text-stone-400 hover:text-stone-700"
                                                    title="Copy"
                                                >
                                                    {copiedCode === coupon.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-3 font-semibold text-stone-900 max-w-[180px] truncate" title={coupon.title}>
                                            {coupon.title}
                                        </td>
                                        <td className="p-3">
                                            {coupon.is_platform ? (
                                                <span className="inline-flex items-center gap-1 font-bold text-admin-brand">
                                                    <ShieldCheck size={14} /> Toàn Sàn
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-stone-600">
                                                    <Store size={14} /> {coupon.shop_name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">{getTypeBadge(coupon.discount_type)}</td>
                                        <td className="p-3">
                                            <div className="text-stone-900 font-bold">
                                                {coupon.discount_type === 'PERCENTAGE'
                                                    ? `Giảm ${parseVal(coupon.discount_value)}% (Max ${coupon.max_discount_amount ? `${parseVal(coupon.max_discount_amount).toLocaleString('vi-VN')}đ` : '∞'})`
                                                    : coupon.discount_type === 'FIXED_AMOUNT'
                                                    ? `Giảm ${parseVal(coupon.discount_value).toLocaleString('vi-VN')}đ`
                                                    : coupon.discount_type === 'FREE_SHIPPING'
                                                    ? `Freeship ${coupon.discount_value ? `${parseVal(coupon.discount_value).toLocaleString('vi-VN')}đ` : '100%'}`
                                                    : `Giảm ${parseVal(coupon.discount_value) <= 100 ? `${parseVal(coupon.discount_value)}%` : `${parseVal(coupon.discount_value).toLocaleString('vi-VN')}đ`}`}
                                            </div>
                                            <div className="text-[10px] text-stone-400">
                                                {parseVal(coupon.min_order_value) > 0 ? `Đơn từ ${parseVal(coupon.min_order_value).toLocaleString('vi-VN')}đ` : 'Không giới hạn đơn'}
                                            </div>
                                        </td>

                                        <td className="p-3">
                                            <span className="font-bold text-stone-900">{coupon.used_count}</span>
                                            <span className="text-stone-400"> / {coupon.usage_limit || '∞'}</span>
                                        </td>
                                        <td className="p-3 text-[11px] text-stone-500 whitespace-nowrap">
                                            {new Date(coupon.start_date).toLocaleDateString('vi-VN')} - {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="p-3">
                                            {isExpired ? (
                                                <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Hết hạn</span>
                                            ) : coupon.is_active ? (
                                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Hoạt động</span>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Tắt</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(coupon.id)}
                                                    className="text-xs font-bold text-stone-500 hover:text-admin-brand"
                                                    title={coupon.is_active ? 'Tắt voucher' : 'Bật voucher'}
                                                >
                                                    {coupon.is_active ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} className="text-stone-400" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className={`p-1 rounded transition ${
                                                        (coupon.used_count || 0) > 0
                                                            ? 'text-stone-300 hover:text-stone-400 cursor-not-allowed'
                                                            : 'text-stone-400 hover:text-red-500'
                                                    }`}
                                                    title={(coupon.used_count || 0) > 0 ? `Đã dùng ${coupon.used_count} lượt (Không thể xóa - Chỉ có thể Tắt để bảo vệ dữ liệu đối soát)` : "Xóa voucher"}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Tạo Voucher Toàn Sàn */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                                <Ticket className="text-admin-brand" size={20} />
                                Tạo Voucher Toàn Sàn VietCraft
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setFormErrors({});
                                }}
                                className="text-stone-400 hover:text-stone-600 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoupon} className="space-y-3.5 mt-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Mã Voucher *</label>
                                    <input
                                        type="text"
                                        placeholder="VD: VIETCRAFT50"
                                        value={formData.code}
                                        onChange={(e) => {
                                            setFormData({ ...formData, code: e.target.value.toUpperCase() });
                                            if (formErrors.code) setFormErrors({ ...formErrors, code: '' });
                                        }}
                                        className={`w-full font-mono uppercase px-3 py-2 border rounded-lg font-bold transition ${
                                            formErrors.code ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-stone-200 focus:border-admin-brand'
                                        }`}
                                    />
                                    {formErrors.code && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.code}</p>}
                                </div>
                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Tên chương trình *</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Mega Sale Khai Xuân"
                                        value={formData.title}
                                        onChange={(e) => {
                                            setFormData({ ...formData, title: e.target.value });
                                            if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg transition ${
                                            formErrors.title ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-stone-200 focus:border-admin-brand'
                                        }`}
                                    />
                                    {formErrors.title && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.title}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-stone-700 mb-1">Loại ưu đãi sàn *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { type: 'PERCENTAGE', label: 'Giảm theo %', icon: Percent },
                                        { type: 'FIXED_AMOUNT', label: 'Tiền cố định', icon: Coins },
                                        { type: 'FREE_SHIPPING', label: 'Freeship Sàn', icon: Truck },
                                        { type: 'FLASH_SALE', label: 'Flash Sale', icon: Flame },
                                        { type: 'BUNDLE', label: 'Combo', icon: Layers },
                                    ].map(item => {
                                        const Icon = item.icon;
                                        const isSelected = formData.discount_type === item.type;
                                        return (
                                            <button
                                                type="button"
                                                key={item.type}
                                                onClick={() => {
                                                    setFormData({ ...formData, discount_type: item.type as any });
                                                    if (formErrors.discount_value) setFormErrors({ ...formErrors, discount_value: '' });
                                                }}
                                                className={`p-2 rounded-lg border font-bold flex flex-col items-center gap-1 transition ${
                                                    isSelected
                                                        ? 'border-admin-brand bg-[#e8f5e8] text-admin-brand'
                                                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                                                }`}
                                            >
                                                <Icon size={15} />
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">
                                        {formData.discount_type === 'PERCENTAGE' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (đ) *'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={formData.discount_type === 'PERCENTAGE' ? 100 : undefined}
                                        value={formData.discount_value}
                                        onChange={(e) => {
                                            setFormData({ ...formData, discount_value: Number(e.target.value) });
                                            if (formErrors.discount_value) setFormErrors({ ...formErrors, discount_value: '' });
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg transition ${
                                            formErrors.discount_value ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-stone-200 focus:border-admin-brand'
                                        }`}
                                    />
                                    {formErrors.discount_value && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.discount_value}</p>}
                                </div>
                                {formData.discount_type === 'PERCENTAGE' ? (
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Mức giảm tối đa (đ)</label>
                                        <input
                                            type="number"
                                            placeholder="VD: 100000"
                                            value={formData.max_discount_amount || ''}
                                            onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value ? Number(e.target.value) : undefined })}
                                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-admin-brand"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Đơn tối thiểu (đ)</label>
                                        <input
                                            type="number"
                                            placeholder="VD: 200000"
                                            value={formData.min_order_value || ''}
                                            onChange={(e) => {
                                                setFormData({ ...formData, min_order_value: e.target.value ? Number(e.target.value) : undefined });
                                                if (formErrors.discount_value) setFormErrors({ ...formErrors, discount_value: '' });
                                            }}
                                            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:border-admin-brand"
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block font-bold text-stone-700 mb-1">Giới hạn số lượt sử dụng toàn sàn</label>
                                <input
                                    type="number"
                                    placeholder="Để trống nếu không giới hạn ngân sách"
                                    value={formData.usage_limit || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, usage_limit: e.target.value ? Number(e.target.value) : undefined });
                                        if (formErrors.usage_limit) setFormErrors({ ...formErrors, usage_limit: '' });
                                    }}
                                    className={`w-full px-3 py-2 border rounded-lg transition ${
                                        formErrors.usage_limit ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-stone-200 focus:border-admin-brand'
                                    }`}
                                />
                                {formErrors.usage_limit && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.usage_limit}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Bắt đầu *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, start_date: e.target.value });
                                            if (formErrors.start_date || formErrors.end_date) setFormErrors({ ...formErrors, start_date: '', end_date: '' });
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg transition ${
                                            formErrors.start_date ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-stone-200 focus:border-admin-brand'
                                        }`}
                                    />
                                    {formErrors.start_date && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.start_date}</p>}
                                </div>
                                <div>
                                    <label className="block font-bold text-stone-700 mb-1">Kết thúc *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, end_date: e.target.value });
                                            if (formErrors.end_date) setFormErrors({ ...formErrors, end_date: '' });
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg transition ${
                                            formErrors.end_date ? 'border-red-400 bg-red-50/20 focus:border-red-500' : 'border-stone-200 focus:border-admin-brand'
                                        }`}
                                    />
                                    {formErrors.end_date && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.end_date}</p>}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-3 py-2 text-stone-500 hover:text-stone-800 font-bold"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-admin-brand hover:bg-emerald-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'Đang tạo...' : 'Xác nhận tạo Voucher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPromotionsPage;
