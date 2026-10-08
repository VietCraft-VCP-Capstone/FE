import React, { useState, useEffect } from 'react';
import {
    Wallet,
    Clock,
    ArrowUpRight,
    Landmark,
    Search,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    sellerFinanceService,
    SellerFinanceOverview,
    SellerSettlementItem,
    SellerWithdrawalItem
} from '../services/sellerFinanceService';
import { useToast } from '../../../shared/components/Toast';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

export const SellerRevenuePage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'settlements' | 'withdrawals'>('settlements');
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [overview, setOverview] = useState<SellerFinanceOverview>({
        availableBalance: 0,
        pendingBalance: 0,
        settledRevenue: 0,
        totalWithdrawn: 0,
        totalPlatformFee: 0,
        defaultBank: null,
    });

    // Settlements state
    const [settlements, setSettlements] = useState<SellerSettlementItem[]>([]);
    const [loadingSettlements, setLoadingSettlements] = useState(false);
    const [settlementPage, setSettlementPage] = useState(1);
    const [settlementTotalPages, setSettlementTotalPages] = useState(1);
    const [settlementStatus, setSettlementStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Withdrawals state
    const [withdrawals, setWithdrawals] = useState<SellerWithdrawalItem[]>([]);
    const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
    const [withdrawalPage, setWithdrawalPage] = useState(1);
    const [withdrawalTotalPages, setWithdrawalTotalPages] = useState(1);

    // Modal state
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
    const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

    const loadOverview = async () => {
        setLoadingOverview(true);
        try {
            const data = await sellerFinanceService.getOverview();
            setOverview(data);
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Lỗi khi tải thông tin tài chính.'), 'error');
        } finally {
            setLoadingOverview(false);
        }
    };

    const loadSettlements = async (page = 1) => {
        setLoadingSettlements(true);
        try {
            const res = await sellerFinanceService.getSettlements({
                page,
                limit: 10,
                status: settlementStatus === 'ALL' ? undefined : settlementStatus,
                search: searchQuery.trim() || undefined,
            });
            setSettlements(res.items);
            setSettlementPage(res.page);
            setSettlementTotalPages(res.totalPages || 1);
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Lỗi khi tải danh sách đối soát.'), 'error');
        } finally {
            setLoadingSettlements(false);
        }
    };

    const loadWithdrawals = async (page = 1) => {
        setLoadingWithdrawals(true);
        try {
            const res = await sellerFinanceService.getWithdrawals({
                page,
                limit: 10,
            });
            setWithdrawals(res.items);
            setWithdrawalPage(res.page);
            setWithdrawalTotalPages(res.totalPages || 1);
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Lỗi khi tải lịch sử rút tiền.'), 'error');
        } finally {
            setLoadingWithdrawals(false);
        }
    };

    useEffect(() => {
        loadOverview();
    }, []);

    useEffect(() => {
        if (activeTab === 'settlements') {
            loadSettlements(1);
        } else {
            loadWithdrawals(1);
        }
    }, [activeTab, settlementStatus]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadSettlements(1);
    };

    const handleOpenWithdrawModal = () => {
        if (!overview.defaultBank) {
            showToast('Vui lòng thiết lập Tài khoản ngân hàng trong Cài đặt thanh toán trước khi rút tiền.', 'error');
            setTimeout(() => navigate('/seller/settings?tab=payment'), 1000);
            return;
        }
        if (overview.availableBalance < 500) {
            showToast('Số dư khả dụng phải từ 500 VNĐ trở lên để thực hiện rút tiền.', 'error');
            return;
        }
        setWithdrawAmount('');
        setIsWithdrawModalOpen(true);
    };

    const handleConfirmWithdraw = async () => {
        const numAmount = Number(withdrawAmount);
        if (!numAmount || numAmount < 500) {
            showToast('Số tiền rút tối thiểu là 500 VNĐ.', 'error');
            return;
        }
        if (numAmount > overview.availableBalance) {
            showToast(`Số dư khả dụng không đủ (Tối đa ${overview.availableBalance.toLocaleString('vi-VN')} VNĐ).`, 'error');
            return;
        }

        setSubmittingWithdraw(true);
        try {
            await sellerFinanceService.requestWithdrawal({
                amount: numAmount,
            });
            showToast('Yêu cầu rút tiền thành công! Lệnh chi đã được khởi tạo.', 'success');
            setIsWithdrawModalOpen(false);
            loadOverview();
            if (activeTab === 'withdrawals') {
                loadWithdrawals(1);
            }
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Lỗi khi yêu cầu rút tiền.'), 'error');
        } finally {
            setSubmittingWithdraw(false);
        }
    };

    const formatVND = (n: number) => {
        return (n || 0).toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '---';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const presets = [500, 1000, 5000, 10000, 50000];

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-[#007700] border border-emerald-200 shadow-2xs">
                            <Wallet size={24} />
                        </div>
                        <span>Doanh thu & Đối soát cửa hàng</span>
                    </h1>
                    <p className="text-xs text-stone-500 mt-1">
                        Theo dõi dòng tiền bán hàng, các phiên đối soát đơn hàng và thực hiện rút tiền về tài khoản ngân hàng.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            loadOverview();
                            if (activeTab === 'settlements') loadSettlements(settlementPage);
                            else loadWithdrawals(withdrawalPage);
                        }}
                        className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition shadow-2xs cursor-pointer"
                        title="Tải lại dữ liệu"
                    >
                        <RotateCw size={16} />
                    </button>
                    <button
                        onClick={handleOpenWithdrawModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#007700] to-emerald-600 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
                    >
                        <ArrowUpRight size={16} />
                        <span>Rút tiền về tài khoản</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Số dư khả dụng */}
                <div className="bg-gradient-to-br from-white to-emerald-50/40 p-5 rounded-3xl border border-emerald-200/80 shadow-xs relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Số dư khả dụng</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-[#007700] flex items-center justify-center font-bold">
                            <Wallet size={18} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-emerald-800 tracking-tight">
                            {loadingOverview ? '---' : formatVND(overview.availableBalance)}
                        </div>
                        <p className="text-[11px] font-medium text-emerald-700/80 mt-1 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Sẵn sàng rút về tài khoản
                        </p>
                    </div>
                </div>

                {/* 2. Số dư chờ đối soát */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Chờ đối soát</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-stone-900 tracking-tight">
                            {loadingOverview ? '---' : formatVND(overview.pendingBalance)}
                        </div>
                        <p className="text-[11px] font-medium text-amber-700 mt-1">
                            Ở các đơn đang xử lý / đang giao
                        </p>
                    </div>
                </div>

                {/* 3. Tổng tiền đã rút */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Đã giải ngân</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-stone-900 tracking-tight">
                            {loadingOverview ? '---' : formatVND(overview.totalWithdrawn)}
                        </div>
                        <p className="text-[11px] font-medium text-stone-500 mt-1">
                            Tổng tiền đã rút về ngân hàng
                        </p>
                    </div>
                </div>

                {/* 4. Tổng phí sàn */}
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Phí sàn trích thu</span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Receipt size={18} />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-stone-900 tracking-tight">
                            {loadingOverview ? '---' : formatVND(overview.totalPlatformFee)}
                        </div>
                        <p className="text-[11px] font-medium text-stone-500 mt-1">
                            Chi phí hoa hồng & hạ tầng sàn
                        </p>
                    </div>
                </div>
            </div>

            {/* Bank Information Card */}
            {overview.defaultBank ? (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-[#007700] shadow-2xs shrink-0 font-bold text-xs">
                            {overview.defaultBank.bankCode || 'BANK'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm text-stone-900">{overview.defaultBank.bankName}</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#007700] border border-emerald-200">
                                    Tài khoản thụ hưởng mặc định
                                </span>
                            </div>
                            <p className="text-xs text-stone-600 mt-0.5">
                                Số TK: <span className="font-mono font-bold text-stone-800">{overview.defaultBank.accountNumber}</span> • Chủ TK: <span className="font-bold text-stone-800 uppercase">{overview.defaultBank.accountHolder}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/seller/settings?tab=payment')}
                        className="text-xs font-bold text-[#007700] hover:underline self-start sm:self-auto cursor-pointer"
                    >
                        Thay đổi tài khoản
                    </button>
                </div>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-amber-900">
                        <AlertCircle size={18} className="text-amber-600 shrink-0" />
                        <span>Bạn chưa thiết lập tài khoản ngân hàng nhận tiền. Hãy cài đặt để có thể thực hiện rút tiền.</span>
                    </div>
                    <button
                        onClick={() => navigate('/seller/settings?tab=payment')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                        Cài đặt ngay
                    </button>
                </div>
            )}

            {/* Main Tabs Container */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
                {/* Tabs Nav */}
                <div className="flex border-b border-stone-200 bg-stone-50/70 p-1.5 gap-1.5">
                    <button
                        onClick={() => setActiveTab('settlements')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'settlements'
                                ? 'bg-white text-[#007700] shadow-2xs'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                        }`}
                    >
                        <Receipt size={15} />
                        <span>Phiên đối soát đơn hàng</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('withdrawals')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'withdrawals'
                                ? 'bg-white text-[#007700] shadow-2xs'
                                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                        }`}
                    >
                        <Landmark size={15} />
                        <span>Lịch sử rút tiền</span>
                    </button>
                </div>

                {/* Tab 1: Settlements Content */}
                {activeTab === 'settlements' && (
                    <div className="p-5 sm:p-6 space-y-4">
                        {/* Filters Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                {[
                                    { id: 'ALL', label: 'Tất cả' },
                                    { id: 'SETTLED', label: 'Đã giải ngân' },
                                    { id: 'PENDING', label: 'Đang giữ tiền' },
                                    { id: 'CANCELLED', label: 'Đã hủy' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSettlementStatus(tab.id)}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                            settlementStatus === tab.id
                                                ? 'bg-stone-900 text-white shadow-2xs'
                                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSearchSubmit} className="relative max-w-xs w-full">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm theo mã đơn (#VC-...)"
                                    className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#007700] focus:ring-1 focus:ring-[#007700] outline-none"
                                />
                            </form>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-2xl border border-stone-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-stone-50 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                    <tr>
                                        <th className="py-3 px-4">Mã đơn hàng</th>
                                        <th className="py-3 px-4">Ngày đặt / Giao</th>
                                        <th className="py-3 px-4 text-right">Doanh thu (Gross)</th>
                                        <th className="py-3 px-4 text-right">Phí sàn</th>
                                        <th className="py-3 px-4 text-right">Thực nhận về ví</th>
                                        <th className="py-3 px-4 text-center">Trạng thái đối soát</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                                    {loadingSettlements ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-stone-400 font-semibold">
                                                <Loader2 size={24} className="animate-spin mx-auto text-[#007700] mb-2" />
                                                <span>Đang tải danh sách đối soát...</span>
                                            </td>
                                        </tr>
                                    ) : settlements.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-stone-400 font-semibold">
                                                Không tìm thấy phiên đối soát nào phù hợp.
                                            </td>
                                        </tr>
                                    ) : (
                                        settlements.map((item) => (
                                            <tr key={item.orderId} className="hover:bg-stone-50/70 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                                                        #{item.orderCode}
                                                    </span>
                                                    <p className="text-[10px] text-stone-400 mt-0.5">{item.itemsCount} sản phẩm</p>
                                                </td>
                                                <td className="py-3.5 px-4 text-stone-500">
                                                    <div>{formatDate(item.orderDate)}</div>
                                                    {item.deliveredDate && (
                                                        <div className="text-[10px] text-emerald-700 font-semibold">
                                                            Giao: {formatDate(item.deliveredDate)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                                                    {formatVND(item.subtotal)}
                                                </td>
                                                <td className="py-3.5 px-4 text-right text-rose-600 font-semibold">
                                                    -{formatVND(item.platformFee)}
                                                    <span className="text-[10px] text-stone-400 ml-1">
                                                        ({Math.round(item.commissionRate * 100)}%)
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                                                    {formatVND(item.netPayout)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.settlementStatus === 'SETTLED' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 size={11} /> Đã vào ví
                                                        </span>
                                                    ) : item.settlementStatus === 'CANCELLED' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 border border-stone-200">
                                                            Đơn hủy
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock size={11} /> Chờ giao xong
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {settlementTotalPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-stone-500">
                                    Trang {settlementPage} / {settlementTotalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={settlementPage <= 1 || loadingSettlements}
                                        onClick={() => loadSettlements(settlementPage - 1)}
                                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        disabled={settlementPage >= settlementTotalPages || loadingSettlements}
                                        onClick={() => loadSettlements(settlementPage + 1)}
                                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Withdrawals Content */}
                {activeTab === 'withdrawals' && (
                    <div className="p-5 sm:p-6 space-y-4">
                        <div className="overflow-x-auto rounded-2xl border border-stone-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-stone-50 text-stone-600 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
                                    <tr>
                                        <th className="py-3 px-4">Mã lệnh rút</th>
                                        <th className="py-3 px-4">Thời gian</th>
                                        <th className="py-3 px-4">Ngân hàng thụ hưởng</th>
                                        <th className="py-3 px-4 text-right">Số tiền rút</th>
                                        <th className="py-3 px-4 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                                    {loadingWithdrawals ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-stone-400 font-semibold">
                                                <Loader2 size={24} className="animate-spin mx-auto text-[#007700] mb-2" />
                                                <span>Đang tải lịch sử rút tiền...</span>
                                            </td>
                                        </tr>
                                    ) : withdrawals.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-stone-400 font-semibold">
                                                Chưa có lệnh rút tiền nào.
                                            </td>
                                        </tr>
                                    ) : (
                                        withdrawals.map((item) => (
                                            <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                                                <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                                                    #{item.withdrawalCode}
                                                </td>
                                                <td className="py-3.5 px-4 text-stone-500">
                                                    {formatDate(item.createdAt)}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-stone-900">{item.bankName}</div>
                                                    <div className="text-[11px] text-stone-500 font-mono">
                                                        {item.accountNumber} • {item.accountHolder}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-black text-stone-900 text-sm">
                                                    {formatVND(item.amount)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.status === 'COMPLETED' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 size={11} /> Thành công
                                                        </span>
                                                    ) : item.status === 'FAILED' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <AlertCircle size={11} /> Thất bại
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock size={11} /> Đang xử lý
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {withdrawalTotalPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-stone-500">
                                    Trang {withdrawalPage} / {withdrawalTotalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={withdrawalPage <= 1 || loadingWithdrawals}
                                        onClick={() => loadWithdrawals(withdrawalPage - 1)}
                                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        disabled={withdrawalPage >= withdrawalTotalPages || loadingWithdrawals}
                                        onClick={() => loadWithdrawals(withdrawalPage + 1)}
                                        className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Withdrawal Modal */}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-stone-100 space-y-5 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-50 text-[#007700] border border-emerald-200 shadow-2xs">
                                    <Landmark size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-stone-900 tracking-tight">
                                        Rút tiền về tài khoản
                                    </h3>
                                    <p className="text-xs text-stone-500 mt-0.5">
                                        Chuyển khoản liên ngân hàng Napas247 tức thì
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsWithdrawModalOpen(false)}
                                className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Balance Banner */}
                        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-600">Số dư khả dụng:</span>
                            <span className="text-base font-black text-[#007700]">
                                {formatVND(overview.availableBalance)}
                            </span>
                        </div>

                        {/* Bank destination card */}
                        {overview.defaultBank && (
                            <div className="rounded-2xl border border-stone-200 p-3.5 bg-stone-50/60 space-y-1">
                                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                                    Tài khoản nhận tiền:
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-stone-900">{overview.defaultBank.bankName}</span>
                                    <span className="text-xs font-mono font-bold text-stone-700">{overview.defaultBank.accountNumber}</span>
                                </div>
                                <div className="text-[11px] font-semibold text-stone-600 uppercase">
                                    {overview.defaultBank.accountHolder}
                                </div>
                            </div>
                        )}

                        {/* Input Amount */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-stone-700 block uppercase tracking-wider">
                                Số tiền muốn rút (VNĐ) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={500}
                                    max={overview.availableBalance}
                                    step={500}
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value ? Number(e.target.value) : '')}
                                    placeholder="Tối thiểu 500đ"
                                    className="w-full pl-4 pr-12 py-3 rounded-2xl border border-stone-200 focus:border-[#007700] focus:ring-2 focus:ring-[#007700]/20 font-bold text-stone-900 text-sm outline-none transition"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                                    VNĐ
                                </span>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {presets.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setWithdrawAmount(p)}
                                        disabled={p > overview.availableBalance}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 transition cursor-pointer"
                                    >
                                        {formatVND(p)}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setWithdrawAmount(overview.availableBalance)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-300 bg-emerald-50 text-[#007700] hover:bg-emerald-100 transition cursor-pointer"
                                >
                                    Toàn bộ
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                            <button
                                type="button"
                                disabled={submittingWithdraw}
                                onClick={() => setIsWithdrawModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={submittingWithdraw || !withdrawAmount || Number(withdrawAmount) < 500 || Number(withdrawAmount) > overview.availableBalance}
                                onClick={handleConfirmWithdraw}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#007700] to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {submittingWithdraw ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        <span>Đang gửi lệnh chi...</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowUpRight size={15} />
                                        <span>Xác nhận rút tiền</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerRevenuePage;
