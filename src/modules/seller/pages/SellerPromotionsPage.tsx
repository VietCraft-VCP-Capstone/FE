import React, { useState, useEffect, useMemo } from 'react';
import {
    Ticket, Plus, Search, Trash2, Tag, Flame, Truck, Percent,
    Coins, Calendar, Check, Copy, X, AlertCircle, RefreshCw,
    Layers, ToggleLeft, ToggleRight
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

export function SellerPromotionsPage() {

    const [coupons, setCoupons] = useState<CouponDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE'>('ALL');

    // Create Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Form data
    const initialForm: CreateCouponPayload = {
        code: '',
        title: '',
        description: '',
        discount_type: 'PERCENTAGE',
        discount_value: 10,
        min_order_value: 100000,
        max_discount_amount: 50000,
        usage_limit: 100,
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    };
    const [formData, setFormData] = useState<CreateCouponPayload>(initialForm);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const fetchCoupons = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await promotionService.getSellerCoupons();
            setCoupons(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể tải danh sách khuyến mãi của shop.'));
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
            const updated = await promotionService.toggleSellerCoupon(couponId);
            setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, is_active: updated.is_active } : c));
            setSuccessMsg(`Đã ${updated.is_active ? 'kích hoạt' : 'tạm dừng'} mã giảm giá.`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể đổi trạng thái mã giảm giá.'));
        }
    };

    const handleDelete = async (coupon: CouponDTO) => {
        if ((coupon.used_count || 0) > 0) {
            alert(`Không thể xóa mã "${coupon.code}" vì đã có ${coupon.used_count} đơn hàng sử dụng.\n\nĐể đảm bảo toàn vẹn dữ liệu đơn hàng và đối soát tài chính, bạn chỉ có thể TẮT (Tạm dừng) mã này thay vì xóa.`);
            return;
        }
        if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${coupon.code}"? Thao tác này không thể hoàn tác.`)) return;
        try {
            await promotionService.deleteSellerCoupon(coupon.id);
            setCoupons(prev => prev.filter(c => c.id !== coupon.id));
            setSuccessMsg(`Đã xóa mã giảm giá "${coupon.code}" thành công.`);
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
            errors.code = 'Mã chỉ được chứa chữ hoa không dấu, chữ số và dấu gạch dưới (VD: TET2026).';
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
            const newCoupon = await promotionService.createSellerCoupon({
                ...formData,
                code: formData.code.trim().toUpperCase(),
                discount_value: Number(formData.discount_value),
                min_order_value: formData.min_order_value ? Number(formData.min_order_value) : undefined,
                max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : undefined,
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : undefined,
            });

            setCoupons(prev => [newCoupon, ...prev]);
            setShowModal(false);
            setFormData(initialForm);
            setFormErrors({});
            setSuccessMsg(`Đã tạo mã giảm giá ${newCoupon.code} thành công!`);
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setError(getApiErrorMessage(err, 'Không thể tạo mã giảm giá. Vui lòng kiểm tra lại.'));
        } finally {
            setSubmitting(false);
        }
    };

    // Derived statistics
    const stats = useMemo(() => {
        const now = new Date();
        const total = coupons.length;
        const active = coupons.filter(c => c.is_active && new Date(c.start_date) <= now && new Date(c.end_date) >= now).length;
        const flashSaleCount = coupons.filter(c => c.discount_type === 'FLASH_SALE' && c.is_active).length;
        const totalUsed = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
        return { total, active, flashSaleCount, totalUsed };
    }, [coupons]);

    // Filtered coupons
    const filteredCoupons = useMemo(() => {
        const now = new Date();
        return coupons.filter(c => {
            const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.title.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === 'ALL' || c.discount_type === typeFilter;

            const isExpired = new Date(c.end_date) < now;
            let matchesStatus = true;
            if (statusFilter === 'ACTIVE') matchesStatus = c.is_active && !isExpired && new Date(c.start_date) <= now;
            else if (statusFilter === 'EXPIRED') matchesStatus = isExpired;
            else if (statusFilter === 'INACTIVE') matchesStatus = !c.is_active;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [coupons, searchTerm, typeFilter, statusFilter]);

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
                        <Truck size={12} /> Freeship
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
                        <Layers size={12} /> Combo
                    </span>
                );
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                        <Ticket className="text-[#008000]" size={28} />
                        Quản lý Khuyến mãi & Voucher của Shop
                    </h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Tạo mã giảm giá, voucher freeship và chương trình Flash Sale để kích cầu gian hàng của bạn.
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 bg-[#008000] hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Tạo Voucher Mới
                </button>
            </div>

            {/* Notification toasts */}
            {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm animate-fade-in">
                    <Check size={18} className="text-emerald-600" />
                    {successMsg}
                </div>
            )}
            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2 shadow-sm animate-fade-in">
                    <AlertCircle size={18} className="text-red-500" />
                    {error}
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Tổng số Voucher</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-stone-900">{stats.total}</span>
                        <Ticket size={20} className="text-stone-300" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Đang hoạt động</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-emerald-600">{stats.active}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md">Live</span>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Flash Sale</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-amber-500">{stats.flashSaleCount}</span>
                        <Flame size={20} className="text-amber-500" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Lượt đã sử dụng</span>
                    <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-stone-900">{stats.totalUsed}</span>
                        <Tag size={20} className="text-stone-300" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input
                        type="text"
                        placeholder="Tìm theo mã hoặc tên voucher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                        className="text-xs border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang diễn ra</option>
                        <option value="EXPIRED">Đã hết hạn</option>
                        <option value="INACTIVE">Đã tắt</option>
                    </select>

                    <button
                        onClick={fetchCoupons}
                        className="p-2 text-stone-500 hover:text-stone-900 border border-stone-200 rounded-xl hover:bg-stone-50 transition"
                        title="Tải lại"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Voucher List */}
            {loading ? (
                <div className="py-20 text-center text-stone-400 text-sm flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin text-emerald-600" size={24} />
                    Đang tải danh sách khuyến mãi...
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-200">
                    <Ticket className="mx-auto text-stone-300 mb-3" size={40} />
                    <h3 className="text-base font-bold text-stone-800">Chưa có mã giảm giá nào</h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                        Tạo voucher đầu tiên để khuyến khích khách hàng mua sắm nhiều hơn tại gian hàng của bạn.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 inline-flex items-center gap-2 bg-[#008000] text-white text-xs font-bold px-4 py-2 rounded-xl"
                    >
                        <Plus size={16} /> Tạo Voucher Ngay
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCoupons.map((coupon) => {
                        const isExpired = new Date(coupon.end_date) < new Date();
                        const isUpcoming = new Date(coupon.start_date) > new Date();
                        const progress = coupon.usage_limit ? Math.min(100, Math.round((coupon.used_count / coupon.usage_limit) * 100)) : 0;

                        return (
                            <div
                                key={coupon.id}
                                className={`bg-white rounded-2xl border transition-all p-5 shadow-sm hover:shadow-md flex flex-col justify-between ${
                                    !coupon.is_active || isExpired ? 'opacity-75 border-stone-200' : 'border-stone-100 hover:border-emerald-300'
                                }`}
                            >
                                <div className="space-y-3">
                                    {/* Top badge row */}
                                    <div className="flex items-center justify-between gap-2">
                                        {getTypeBadge(coupon.discount_type)}
                                        <div className="flex items-center gap-1.5">
                                            {isExpired ? (
                                                <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Hết hạn</span>
                                            ) : isUpcoming ? (
                                                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Sắp tới</span>
                                            ) : coupon.is_active ? (
                                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Hoạt động
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Đã tắt</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Code box */}
                                    <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
                                        <span className="font-mono text-base font-black text-stone-900 tracking-wider">
                                            {coupon.code}
                                        </span>
                                        <button
                                            onClick={() => handleCopy(coupon.code)}
                                            className="text-stone-400 hover:text-stone-700 transition"
                                            title="Sao chép mã"
                                        >
                                            {copiedCode === coupon.code ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                        </button>
                                    </div>

                                    {/* Title & Conditions */}
                                    <div>
                                        <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{coupon.title}</h4>
                                        <p className="text-xs text-stone-500 mt-0.5">
                                            {coupon.discount_type === 'PERCENTAGE'
                                                ? `Giảm ${parseVal(coupon.discount_value)}%${coupon.max_discount_amount ? ` (Tối đa ${parseVal(coupon.max_discount_amount).toLocaleString('vi-VN')}đ)` : ''}`
                                                : coupon.discount_type === 'FIXED_AMOUNT'
                                                ? `Giảm thẳng ${parseVal(coupon.discount_value).toLocaleString('vi-VN')}đ`
                                                : coupon.discount_type === 'FREE_SHIPPING'
                                                ? `Giảm ${coupon.discount_value ? `${parseVal(coupon.discount_value).toLocaleString('vi-VN')}đ` : '100%'} phí giao hàng`
                                                : coupon.discount_type === 'FLASH_SALE'
                                                ? `Giá sốc: Giảm ${parseVal(coupon.discount_value) <= 100 ? `${parseVal(coupon.discount_value)}%` : `${parseVal(coupon.discount_value).toLocaleString('vi-VN')}đ`}`
                                                : `Combo ưu đãi: Giảm ${parseVal(coupon.discount_value) <= 100 ? `${parseVal(coupon.discount_value)}%` : `${parseVal(coupon.discount_value).toLocaleString('vi-VN')}đ`}`}
                                        </p>
                                        <p className="text-[11px] text-stone-400 mt-0.5">
                                            {parseVal(coupon.min_order_value) > 0
                                                ? `Đơn tối thiểu: ${parseVal(coupon.min_order_value).toLocaleString('vi-VN')}đ`
                                                : 'Áp dụng cho mọi giá trị đơn'}
                                        </p>
                                    </div>


                                    {/* Usage progress */}
                                    <div className="space-y-1 pt-1">
                                        <div className="flex justify-between text-[11px] text-stone-500 font-medium">
                                            <span>Đã dùng: {coupon.used_count}</span>
                                            <span>{coupon.usage_limit ? `Giới hạn: ${coupon.usage_limit}` : 'Không giới hạn'}</span>
                                        </div>
                                        {coupon.usage_limit ? (
                                            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full ${progress >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Dates */}
                                    <div className="text-[11px] text-stone-400 flex items-center gap-1.5 pt-1 border-t border-stone-100">
                                        <Calendar size={12} />
                                        <span>
                                            {new Date(coupon.start_date).toLocaleDateString('vi-VN')} - {new Date(coupon.end_date).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 mt-3 border-t border-stone-100">
                                    <button
                                        onClick={() => handleToggleStatus(coupon.id)}
                                        className={`inline-flex items-center gap-1 text-xs font-bold transition ${
                                            coupon.is_active ? 'text-stone-600 hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'
                                        }`}
                                    >
                                        {coupon.is_active ? (
                                            <>
                                                <ToggleRight size={18} className="text-emerald-600" /> Đang bật
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft size={18} className="text-stone-400" /> Đã tắt
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(coupon)}
                                        className={`p-1.5 rounded-lg transition ${
                                            (coupon.used_count || 0) > 0
                                                ? 'text-stone-300 hover:text-stone-400 hover:bg-stone-50 cursor-not-allowed'
                                                : 'text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50'
                                        }`}
                                        title={(coupon.used_count || 0) > 0 ? `Đã dùng ${coupon.used_count} lượt (Không thể xóa - Chỉ có thể Tắt để bảo vệ dữ liệu đối soát)` : "Xóa voucher"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Tạo Voucher Mới */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl relative my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                            <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                                <Ticket className="text-[#008000]" size={22} />
                                Tạo Voucher Mới Cho Shop
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setFormErrors({});
                                }}
                                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
                            {/* Mã & Tiêu đề */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Mã Voucher *</label>
                                    <input
                                        type="text"
                                        placeholder="VD: TET50K"
                                        value={formData.code}
                                        onChange={(e) => {
                                            setFormData({ ...formData, code: e.target.value.toUpperCase() });
                                            if (formErrors.code) setFormErrors({ ...formErrors, code: '' });
                                        }}
                                        className={`w-full text-xs font-mono uppercase px-3 py-2.5 border rounded-xl font-bold transition ${
                                            formErrors.code ? 'border-red-400 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500' : 'border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                                        }`}
                                    />
                                    {formErrors.code && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.code}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Tiêu đề chương trình *</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Tri ân đón Tết"
                                        value={formData.title}
                                        onChange={(e) => {
                                            setFormData({ ...formData, title: e.target.value });
                                            if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                                        }}
                                        className={`w-full text-xs px-3 py-2.5 border rounded-xl transition ${
                                            formErrors.title ? 'border-red-400 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500' : 'border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                                        }`}
                                    />
                                    {formErrors.title && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.title}</p>}
                                </div>
                            </div>

                            {/* Loại ưu đãi */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">Loại khuyến mãi *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { type: 'PERCENTAGE', label: 'Giảm theo %', icon: Percent },
                                        { type: 'FIXED_AMOUNT', label: 'Tiền cố định', icon: Coins },
                                        { type: 'FREE_SHIPPING', label: 'Freeship', icon: Truck },
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
                                                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                                                    isSelected
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                                                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                                                }`}
                                            >
                                                <Icon size={16} className={isSelected ? 'text-emerald-600' : 'text-stone-400'} />
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Giá trị giảm & Giảm tối đa */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">
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
                                        className={`w-full text-xs px-3 py-2.5 border rounded-xl transition ${
                                            formErrors.discount_value ? 'border-red-400 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500' : 'border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                                        }`}
                                    />
                                    {formErrors.discount_value && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.discount_value}</p>}
                                </div>
                                {formData.discount_type === 'PERCENTAGE' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-stone-700 mb-1">Mức giảm tối đa (đ)</label>
                                        <input
                                            type="number"
                                            placeholder="VD: 50000"
                                            value={formData.max_discount_amount || ''}
                                            onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value ? Number(e.target.value) : undefined })}
                                            className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-stone-700 mb-1">Đơn tối thiểu (đ)</label>
                                        <input
                                            type="number"
                                            placeholder="VD: 150000"
                                            value={formData.min_order_value || ''}
                                            onChange={(e) => {
                                                setFormData({ ...formData, min_order_value: e.target.value ? Number(e.target.value) : undefined });
                                                if (formErrors.discount_value) setFormErrors({ ...formErrors, discount_value: '' });
                                            }}
                                            className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Giới hạn lượt dùng */}
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">Giới hạn số lượt sử dụng</label>
                                <input
                                    type="number"
                                    placeholder="Để trống nếu không giới hạn"
                                    value={formData.usage_limit || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, usage_limit: e.target.value ? Number(e.target.value) : undefined });
                                        if (formErrors.usage_limit) setFormErrors({ ...formErrors, usage_limit: '' });
                                    }}
                                    className={`w-full text-xs px-3 py-2.5 border rounded-xl transition ${
                                        formErrors.usage_limit ? 'border-red-400 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500' : 'border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                                    }`}
                                />
                                {formErrors.usage_limit && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.usage_limit}</p>}
                            </div>

                            {/* Thời gian */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Thời gian bắt đầu *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, start_date: e.target.value });
                                            if (formErrors.start_date || formErrors.end_date) setFormErrors({ ...formErrors, start_date: '', end_date: '' });
                                        }}
                                        className={`w-full text-xs px-3 py-2.5 border rounded-xl transition ${
                                            formErrors.start_date ? 'border-red-400 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500' : 'border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                                        }`}
                                    />
                                    {formErrors.start_date && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.start_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-700 mb-1">Thời gian kết thúc *</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, end_date: e.target.value });
                                            if (formErrors.end_date) setFormErrors({ ...formErrors, end_date: '' });
                                        }}
                                        className={`w-full text-xs px-3 py-2.5 border rounded-xl transition ${
                                            formErrors.end_date ? 'border-red-400 bg-red-50/20 focus:ring-red-500/20 focus:border-red-500' : 'border-stone-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                                        }`}
                                    />
                                    {formErrors.end_date && <p className="text-[11px] text-red-500 mt-1 font-medium">{formErrors.end_date}</p>}
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-[#008000] hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
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

export default SellerPromotionsPage;
