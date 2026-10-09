import { useState, useEffect, useMemo } from 'react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { cartService } from '../../order/services/cartService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Search, 
    Store, 
    ShoppingBag, 
    Eye, 
    RefreshCw, 
    Star, 
    Truck, 
    Check, 
    ArrowRightLeft, 
    DollarSign, 
    ExternalLink, 
    RotateCcw,
    XCircle
} from 'lucide-react';
import { ordersService } from '../../order/services/ordersService';
import { returnService, type ReturnRequest } from '../../returns/services/returnService';
import ReorderModal from '../components/profile/ReorderModal';
import ReviewModal from '../components/profile/ReviewModal';

interface OrderItem {
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    title?: string;
    color?: string;
    size?: string;
    image?: string;
    is_reviewed?: boolean;
}

interface Order {
    id: string;
    _id?: string;
    shopName: string;
    shopLogo: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled';
    paymentMethod?: string;
    paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
    fulfillmentStatus?: string;
    createdAt: string;
    is_reviewed?: boolean;
}

type OrderTab = 'all' | 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled' | 'returns';

const RETURN_STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
    SUBMITTED: { label: 'Đã gửi yêu cầu', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
    PENDING_PRINTER: { label: 'Chờ xưởng in thẩm định', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
    PRINTER_PROPOSED_FAULT_CHANGE: { label: 'Chờ quản trị xem xét', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
    APPROVED: { label: 'Đã duyệt yêu cầu', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REJECTED: { label: 'Bị từ chối', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
    DISPUTED: { label: 'Đang khiếu nại / tranh chấp', badgeClass: 'bg-orange-50 text-orange-800 border-orange-200' },
    AWAITING_ADMIN_REFUND: { label: 'Chờ hoàn tiền', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    CONVERTED_TO_REFUND: { label: 'Duyệt hoàn tiền', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    REPLACEMENT_CREATED: { label: 'Đã tạo đơn in bù', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    COMPLETED: { label: 'Hoàn tất', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
    CANCELLED: { label: 'Đã hủy', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const RETURN_REASON_LABELS: Record<string, string> = {
    R01: 'In sai, lệch, mờ hoặc sai màu',
    R01A: 'Vấn đề chất lượng cần kiểm tra',
    R02: 'Phôi sản phẩm bị lỗi',
    R03: 'Giao sai size, màu hoặc số lượng',
    R04: 'Thiếu sản phẩm trong kiện',
    R05: 'Sản phẩm hư hỏng khi giao',
    R06: 'Không nhận được hàng',
    R07: 'Vấn đề kỹ thuật cần xem xét',
    R08: 'Sai thông tin đơn hàng',
    R09: 'Vấn đề khác cần hỗ trợ',
    R13: 'Cần đội ngũ hỗ trợ phân loại',
};

export function BuyerOrdersPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const paramTab = searchParams.get('tab') as OrderTab | null;
    const [activeTab, setActiveTab] = useState<OrderTab>(
        paramTab && ['all', 'pending', 'paid', 'shipping', 'completed', 'cancelled', 'returns'].includes(paramTab)
            ? paramTab
            : 'all'
    );

    const [orders, setOrders] = useState<Order[]>([]);
    const [returnsList, setReturnsList] = useState<ReturnRequest[]>([]);
    const [returnsPage, setReturnsPage] = useState(1);
    const [returnsError, setReturnsError] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingReturns, setLoadingReturns] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [reorderOrder, setReorderOrder] = useState<Order | null>(null);
    const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
    const [targetReviewProductId, setTargetReviewProductId] = useState<string | undefined>(undefined);
    const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

    const handleOpenReview = (order: Order, productId?: string) => {
        setReviewOrder(order);
        setTargetReviewProductId(productId);
    };

    const handleReviewSuccess = (orderId: string, productId: string) => {
        setReviewedOrders(prev => new Set(prev).add(orderId));
        setOrders(prev => prev.map(ord => {
            if (ord.id === orderId) {
                const updatedItems = ord.items.map(it => {
                    if (it.productId === productId) {
                        return { ...it, is_reviewed: true };
                    }
                    return it;
                });
                const allReviewed = updatedItems.every(it => it.is_reviewed);
                return {
                    ...ord,
                    items: updatedItems,
                    is_reviewed: allReviewed
                };
            }
            return ord;
        }));
        showToast('Lưu đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.', 'success');
        if (activeTab !== 'returns') {
            ordersService.getByUser(activeTab).then(res => {
                setOrders(Array.isArray(res) ? (res as Order[]) : ((res as any)?.items || []));
            }).catch(() => {});
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const tabs = [
        { id: 'all', label: 'Tất cả' },
        { id: 'pending', label: 'Chờ xác nhận' },
        { id: 'paid', label: 'Đang xử lý' },
        { id: 'shipping', label: 'Đang giao' },
        { id: 'completed', label: 'Đã giao' },
        { id: 'cancelled', label: 'Đã hủy' },
        { id: 'returns', label: 'Đổi trả / Hoàn tiền' }
    ] as const;

    const handleTabChange = (tabId: OrderTab) => {
        setActiveTab(tabId);
        if (tabId === 'all') {
            setSearchParams({});
        } else {
            setSearchParams({ tab: tabId });
        }
    };

    // Tải danh sách đơn hàng
    useEffect(() => {
        if (activeTab === 'returns') return;
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const res = await ordersService.getByUser(activeTab);
                setOrders(Array.isArray(res) ? (res as Order[]) : ((res as any)?.items || []));
            } catch (err) {
                console.error('Failed to fetch orders', err);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [activeTab]);

    // Tải danh sách yêu cầu đổi trả / hoàn tiền
    const fetchReturns = async () => {
        setLoadingReturns(true);
        setReturnsError('');
        try {
            const list = await returnService.list();
            setReturnsList(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error('Failed to fetch return requests', err);
            setReturnsError(getApiErrorMessage(err, 'Không tải được yêu cầu đổi trả.'));
        } finally {
            setLoadingReturns(false);
        }
    };

    useEffect(() => {
        void fetchReturns();
        window.addEventListener('focus', fetchReturns);
        return () => window.removeEventListener('focus', fetchReturns);
    }, []);

    useEffect(() => {
        if (activeTab === 'returns') {
            void fetchReturns();
        }
    }, [activeTab]);

    // Map orderId -> ReturnRequest để hiển thị badge trên các đơn hàng thường
    const activeReturnByOrderId = useMemo(() => {
        const map = new Map<string, ReturnRequest>();
        for (const req of returnsList) {
            if (req.order_id && !map.has(String(req.order_id)) && !['COMPLETED', 'CANCELLED', 'EXPIRED', 'ADMIN_REJECTED'].includes(req.status)) {
                map.set(String(req.order_id), req);
            }
        }
        return map;
    }, [returnsList]);

    const getStatusBadge = (order: Order) => {
        // Đơn payOS chưa trả tiền: shop chưa xử lý, khách cần vào đơn để thanh toán lại.
        if (order.status === 'pending' && order.paymentMethod === 'PAYOS' && order.paymentStatus === 'PENDING') {
            return <span className="bg-orange-50 text-orange-700 font-bold border border-orange-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">CHỜ THANH TOÁN</span>;
        }
        switch (order.status) {
            case 'pending':
                return (
                    <>
                        {order.paymentMethod !== 'COD' && order.paymentStatus === 'PAID' && (
                            <span className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">ĐÃ THANH TOÁN</span>
                        )}
                        <span className="bg-amber-50 text-amber-700 font-bold border border-amber-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">CHỜ XÁC NHẬN</span>
                    </>
                );
            case 'paid':
                return <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">ĐANG XỬ LÝ</span>;
            case 'shipping':
                return <span className="bg-blue-50 text-blue-700 font-bold border border-blue-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">ĐANG GIAO</span>;
            case 'completed':
                return <span className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">ĐÃ GIAO</span>;
            case 'cancelled':
                return <span className="bg-slate-50 text-slate-500 font-bold border border-slate-200 text-[10px] px-2.5 py-0.5 rounded-full uppercase">ĐÃ HỦY</span>;
            default:
                return null;
        }
    };

    const handleReorder = (order: Order) => {
        setReorderOrder(order);
    };

    const handleConfirmReorder = async (selectedItems: OrderItem[]) => {
        if (!reorderOrder) return;
        const failures: string[] = [];
        for (const it of selectedItems) {
            try {
                await cartService.addToCart({
                    productId: it.productId,
                    variantId: it.variantId && it.variantId !== 'default' ? it.variantId : undefined,
                    quantity: it.quantity,
                });
            } catch (err) {
                failures.push(getApiErrorMessage(err));
            }
        }

        setReorderOrder(null);
        if (failures.length > 0) {
            showToast(failures[0], 'error');
            return;
        }
        showToast('Đã thêm sản phẩm vào giỏ hàng!');
        setTimeout(() => navigate('/cart'), 1200);
    };

    const filteredOrders = orders.filter(o => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        const matchesShop = o.shopName?.toLowerCase().includes(query);
        const matchesId = o.id?.toLowerCase().includes(query);
        const matchesItem = (o.items || []).some(it => it.title?.toLowerCase().includes(query));
        return matchesShop || matchesId || matchesItem;
    });

    const filteredReturns = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return returnsList;
        return returnsList.filter(req => {
            const reqId = (req.id || req._id || '').toLowerCase();
            const orderId = String(req.order_id || '').toLowerCase();
            const title = String((req.item_snapshot as any)?.title || '').toLowerCase();
            const desc = String(req.reason_description || '').toLowerCase();
            const reasonCode = String(req.reason_code || '').toLowerCase();
            return reqId.includes(query) || orderId.includes(query) || title.includes(query) || desc.includes(query) || reasonCode.includes(query);
        });
    }, [returnsList, searchQuery]);

    const returnsPageCount = Math.max(1, Math.ceil(filteredReturns.length / 20));
    const currentReturnsPage = Math.min(returnsPage, returnsPageCount);
    const visibleReturns = filteredReturns.slice((currentReturnsPage - 1) * 20, currentReturnsPage * 20);
    useEffect(() => { setReturnsPage(1); }, [searchQuery]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Tabs and Search row */}
            <div className="border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 md:pb-0">
                {/* Filter Tabs */}
                <nav className="flex space-x-6 overflow-x-auto no-scrollbar scroll-smooth">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`pb-3 md:pb-4 font-semibold text-xs whitespace-nowrap transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 cursor-pointer ${
                                    isActive ? 'text-emerald-600 border-emerald-600' : 'text-gray-500 border-transparent hover:text-gray-900'
                                }`}
                            >
                                <span>{tab.label}</span>
                                {tab.id === 'returns' && returnsList.length > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {returnsList.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Search box */}
                <div className="relative w-full md:w-80 md:mb-3">
                    <Search className="absolute inset-y-0 left-3 my-auto text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder={activeTab === 'returns' ? "Tìm theo mã yêu cầu, mã đơn, tên sản phẩm..." : "Tìm kiếm theo Tên Shop, ID Đơn hàng..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    />
                </div>
            </div>

            {/* TAB: ĐỔI TRẢ & HOÀN TIỀN */}
            {activeTab === 'returns' && returnsError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{returnsError} <button type="button" onClick={() => void fetchReturns()} className="font-bold underline">Thử lại</button></p>}
            {activeTab === 'returns' ? (
                loadingReturns ? (
                    <div className="text-center py-16">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                        <p className="text-gray-400 font-semibold text-sm">Đang tải danh sách yêu cầu đổi trả / hoàn tiền...</p>
                    </div>
                ) : filteredReturns.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                        <RotateCcw size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-700 font-bold mb-1 text-sm">Chưa có yêu cầu đổi trả hoặc hoàn tiền nào</p>
                        <p className="text-gray-400 text-xs max-w-md mx-auto mb-6 leading-relaxed">
                            Khi bạn gửi yêu cầu đổi hàng in bù hoặc hoàn tiền cho các đơn hàng POD, tiến độ thẩm định từ xưởng in và sàn sẽ hiển thị đầy đủ tại đây.
                        </p>
                        <button
                            type="button"
                            onClick={() => handleTabChange('completed')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 rounded-xl transition shadow-xs"
                        >
                            <span>Xem các đơn hàng đã giao</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visibleReturns.map(req => {
                            const reqId = req.id || req._id || '';
                            const isExchange = (req.final_resolution || req.requested_resolution) === 'EXCHANGE';
                            const statusCfg = RETURN_STATUS_CONFIG[req.status] || { label: req.status, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
                            const reasonText = RETURN_REASON_LABELS[req.reason_code] || req.reason_code || 'Vấn đề sản phẩm';
                            const snapshot = (req.item_snapshot || {}) as any;

                            return (
                                <div key={reqId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Card Header: Request Code, Order Link, Resolution Badge, Status Badge */}
                                    <div className="p-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3 bg-gray-50/20">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <span className="font-extrabold text-sm text-gray-900 font-mono">
                                                Yêu cầu #{reqId.slice(-8)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/orders/${encodeURIComponent(req.order_id)}`)}
                                                className="text-xs text-gray-500 hover:text-emerald-700 font-mono font-medium underline flex items-center gap-0.5 cursor-pointer"
                                                title="Xem đơn hàng gốc"
                                            >
                                                (Đơn #{req.order_id})
                                            </button>
                                            {isExchange ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                                                    <ArrowRightLeft size={12} /> ĐỔI HÀNG (IN BÙ)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                                    <DollarSign size={12} /> HOÀN TIỀN
                                                </span>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusCfg.badgeClass}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {statusCfg.label}
                                        </span>
                                    </div>

                                    {/* Card Body: Product Snapshot, Reason, Description */}
                                    <div className="p-4 flex flex-col md:flex-row items-start justify-between gap-4">
                                        <div className="flex gap-4 flex-1 min-w-0">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                <img
                                                    src={snapshot.image || '/image-not-found.jpg'}
                                                    alt={snapshot.title || 'Sản phẩm'}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { (e.target as HTMLImageElement).src = '/image-not-found.jpg'; }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <h4 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-1">
                                                    {snapshot.title || 'Sản phẩm in ấn theo yêu cầu'}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                                    {snapshot.color && <span>Màu: <b>{snapshot.color}</b></span>}
                                                    {snapshot.size && <span>Size: <b>{snapshot.size}</b></span>}
                                                    <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                                                        SL khiếu nại: {req.quantity || 1}
                                                    </span>
                                                </div>
                                                <div className="pt-1 text-xs">
                                                    <span className="font-bold text-gray-700">Lý do: </span>
                                                    <span className="text-gray-900 font-semibold">{req.reason_code} - {reasonText}</span>
                                                </div>
                                                {req.reason_description && (
                                                    <p className="text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100 line-clamp-2 mt-1">
                                                        "{req.reason_description}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer: Metadata (dates, SLA) & Actions */}
                                    <div className="p-4 bg-gray-50/10 border-t border-gray-50 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
                                        <div className="text-xs text-gray-400 space-y-0.5">
                                            <p>Ngày gửi: {req.created_at ? new Date(req.created_at).toLocaleString('vi-VN') : 'Mới đây'}</p>
                                            {req.deadline_at && (
                                                <p className="text-amber-700 font-medium">
                                                    Hạn xử lý: {new Date(req.deadline_at).toLocaleString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/orders/${encodeURIComponent(req.order_id)}`)}
                                                className="border border-gray-200 hover:bg-gray-50 font-bold text-xs text-gray-600 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                                            >
                                                <ExternalLink size={13} />
                                                <span>Xem đơn hàng gốc</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/returns/${encodeURIComponent(reqId)}`)}
                                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                                            >
                                                <Eye size={13} />
                                                <span>Theo dõi tiến độ</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                /* TAB: ĐƠN HÀNG THƯỜNG */
                loading ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 font-semibold text-sm">Đang tải danh sách đơn hàng...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                        <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-semibold mb-2 text-sm">Không tìm thấy đơn hàng nào</p>
                        <p className="text-gray-400 text-xs max-w-sm mx-auto mb-6">
                            Hãy thử điều chỉnh bộ lọc trạng thái hoặc từ khóa tìm kiếm của bạn.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => {
                            const activeReturn = activeReturnByOrderId.get(order._id || order.id);

                            return (
                                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Card Header (Shop, Status, Return Badge) */}
                                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                        <div className="flex items-center gap-2">
                                            <Store size={16} className="text-gray-500" />
                                            <span className="font-extrabold text-sm text-gray-800">{order.shopName}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-[10px] font-bold text-gray-400">Mã đơn: #{order.id}</span>
                                            {activeReturn && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                                    <ArrowRightLeft size={10} /> Đang yêu cầu đổi/trả
                                                </span>
                                            )}
                                            {getStatusBadge(order)}
                                        </div>
                                    </div>

                                    {/* Card Items list */}
                                    <div className="p-4 divide-y divide-gray-50">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                    <img
                                                        src={item.image || '/image-not-found.jpg'}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '/image-not-found.jpg';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-1">{item.title}</h4>
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        Phân loại: {`${item.color || ''} ${item.size || ''}`.trim() || 'Mặc định'}
                                                    </p>
                                                    <p className="text-xs font-semibold text-gray-500 mt-0.5">x{item.quantity}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end justify-between">
                                                    <span className="font-extrabold text-gray-900 text-sm">
                                                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                                    </span>
                                                    {order.status === 'completed' && (
                                                        <div className="mt-2">
                                                            {item.is_reviewed ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenReview(order, item.productId);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-amber-200/70 shadow-2xs"
                                                                    title="Xem và chỉnh sửa đánh giá cho sản phẩm này"
                                                                >
                                                                    <Star size={11} className="fill-amber-500 text-amber-500" />
                                                                    <span>Chỉnh sửa đánh giá</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenReview(order, item.productId);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-emerald-200/70 shadow-2xs"
                                                                    title="Đánh giá sản phẩm này"
                                                                >
                                                                    <Star size={11} />
                                                                    <span>Đánh giá</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Card Footer (Actions, Total) */}
                                    <div className="p-4 bg-gray-50/10 border-t border-gray-50 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500 font-bold">Tổng số tiền:</span>
                                            <span className="font-black text-emerald-600 text-base ml-1.5">
                                                {order.totalAmount.toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {activeReturn && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/returns/${encodeURIComponent(activeReturn.id || activeReturn._id || '')}`)}
                                                    className="border border-indigo-300 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                >
                                                    <ArrowRightLeft size={13} />
                                                    <span>Xem yêu cầu đổi/trả</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                className="border border-gray-200 hover:bg-gray-50 font-bold text-xs text-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                                            >
                                                <Eye size={14} />
                                                <span>Xem chi tiết</span>
                                            </button>

                                            {order.status !== 'cancelled' &&
                                                order.status !== 'shipping' &&
                                                order.status !== 'completed' &&
                                                (order.status === 'pending' || order.status === 'paid' || order.paymentStatus === 'PENDING') &&
                                                !['SUBMITTED', 'RECEIVED', 'PRINTING', 'PACKAGED', 'SHIPPED', 'DELIVERED'].includes(order.fulfillmentStatus || '') && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/orders/${order.id}`)}
                                                    className="border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                                                >
                                                    <XCircle size={14} />
                                                    <span>Hủy đơn</span>
                                                </button>
                                            )}

                                            {order.status === 'cancelled' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorder(order)}
                                                    className="bg-[#008000] hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
                                                >
                                                    <RefreshCw size={14} />
                                                    <span>Mua lại</span>
                                                </button>
                                            )}

                                            {order.status === 'shipping' && (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/orders/${order.id}`)}
                                                    className="bg-[#008000] hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                                                >
                                                    <Truck size={14} />
                                                    <span>Theo dõi hành trình</span>
                                                </button>
                                            )}

                                            {order.status === 'completed' && (
                                                <>
                                                    {order.is_reviewed || (order.items?.length > 0 && order.items.every(it => it.is_reviewed)) || reviewedOrders.has(order.id) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReview(order)}
                                                            className="border border-amber-500 text-amber-700 hover:bg-amber-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                                            title="Xem và chỉnh sửa đánh giá của đơn hàng này"
                                                        >
                                                            <Star size={14} className="fill-amber-500 text-amber-500" />
                                                            <span>Chỉnh sửa đánh giá</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenReview(order)}
                                                            className="border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                                            title="Đánh giá các sản phẩm trong đơn hàng"
                                                        >
                                                            <Star size={14} />
                                                            <span>Đánh giá</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReorder(order)}
                                                        className="bg-[#008000] hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                                                    >
                                                        <RefreshCw size={14} />
                                                        <span>Mua lại</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Reorder Modal */}
            {reorderOrder && (
                <ReorderModal
                    isOpen={!!reorderOrder}
                    onClose={() => setReorderOrder(null)}
                    shopName={reorderOrder.shopName}
                    items={reorderOrder.items}
                    onConfirm={handleConfirmReorder}
                />
            )}

            {/* Review Modal */}
            {reviewOrder && (
                <ReviewModal
                    isOpen={!!reviewOrder}
                    onClose={() => {
                        setReviewOrder(null);
                        setTargetReviewProductId(undefined);
                    }}
                    order={reviewOrder}
                    initialProductId={targetReviewProductId}
                    onSuccess={handleReviewSuccess}
                />
            )}

            {activeTab === 'returns' && !loadingReturns && returnsPageCount > 1 && <nav aria-label="Trang yêu cầu đổi trả" className="flex flex-wrap items-center justify-end gap-4 text-sm"><button type="button" disabled={currentReturnsPage <= 1} onClick={() => setReturnsPage(currentReturnsPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trang trước</button><span>Trang {currentReturnsPage}/{returnsPageCount} · {filteredReturns.length} yêu cầu</span><button type="button" disabled={currentReturnsPage >= returnsPageCount} onClick={() => setReturnsPage(currentReturnsPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Trang sau</button></nav>}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[9999] bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm border-l-4 ${toast.type === 'success' ? 'border-l-emerald-500' : 'border-l-red-500'} transition-all duration-300`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {toast.type === 'success' ? <Check size={18} /> : <span>⚠️</span>}
                    </div>
                    <p className="text-xs font-extrabold text-gray-900">{toast.message}</p>
                </div>
            )}
        </div>
    );
}

export default BuyerOrdersPage;
