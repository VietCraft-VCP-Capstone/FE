import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { cartService } from '../../order/services/cartService';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Truck, Check, CreditCard, MessageSquare, Store, Copy, AlertCircle, CheckCircle, RotateCcw, ArrowRight, PackageCheck, X, Loader2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { ordersService } from '../../order/services/ordersService';
import ReorderModal from '../components/profile/ReorderModal';
import ReviewModal from '../components/profile/ReviewModal';
import { OrderItemsList } from '../components/OrderItemsList';
import { OrderSupportSection } from '../components/OrderSupportSection';
import { returnService, type ReturnEligibilityItem } from '../../returns/services/returnService';
import { refundService } from '../../order/services/refundService';
import type { OrderItemResponse, OrderResponse } from '../../order/services/ordersService';

export function BuyerOrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const [repaying, setRepaying] = useState(false);
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [targetReviewProductId, setTargetReviewProductId] = useState<string | undefined>(undefined);
    const [eligibilityItems, setEligibilityItems] = useState<ReturnEligibilityItem[]>([]);
    const [hasLegacyRefund, setHasLegacyRefund] = useState(false);
    const [reorderItems, setReorderItems] = useState<OrderItemResponse[] | null>(null);

    const handleOpenReview = (productId?: string) => {
        setTargetReviewProductId(productId);
        setIsReviewModalOpen(true);
    };

    const handleReviewSuccess = (_orderId: string, _productId: string) => {
        showToast('Lưu đánh giá thành công! Cảm ơn bạn đã chia sẻ trải nghiệm.', 'success');
        if (id) {
            ordersService.getById(id).then(res => {
                setOrder(res);
            }).catch(() => {});
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        let cancelled = false;
        const fetchOrderDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const res = await ordersService.getById(id);
                if (!cancelled) setOrder(res);
            } catch (err) {
                console.error('Failed to load order detail', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void fetchOrderDetails();
        return () => { cancelled = true; };
    }, [id]);

    // Đơn payOS còn PENDING: nhờ BE hỏi lại payOS thay vì chỉ chờ webhook (webhook có thể
    // không tới, ví dụ BE chạy local). Vừa quay về với status=PAID thì hỏi lặp vài lần vì
    // payOS cần vài giây để chốt giao dịch.
    const returnedPaid = searchParams.get('status') === 'PAID';
    useEffect(() => {
        if (!id || order?.paymentMethod !== 'PAYOS' || order?.paymentStatus !== 'PENDING') return;
        let stopped = false;
        let attempts = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const check = async () => {
            attempts += 1;
            const result = await ordersService.syncPayosPayment(id).catch(() => null);
            if (stopped) return;
            if (result && result.paymentStatus !== 'PENDING') {
                ordersService.getById(id).then(setOrder).catch(() => {});
                return;
            }
            if (returnedPaid && attempts < 10) timer = setTimeout(() => void check(), 3000);
        };
        void check();
        return () => { stopped = true; if (timer) clearTimeout(timer); };
    }, [id, returnedPaid, order?.paymentMethod, order?.paymentStatus]);

    useEffect(() => {
        if (!order?.id) return;
        let cancelled = false;
        setHasLegacyRefund(false);
        void Promise.all([
            refundService.getForOrder(order.id).catch(() => null),
            order.status === 'completed' && order._id ? returnService.eligibility(order._id).catch(() => []) : Promise.resolve([]),
        ]).then(([legacyRefund, eligibility]) => {
            if (cancelled) return;
            setHasLegacyRefund(legacyRefund !== null);
            setEligibilityItems(eligibility);
        });
        return () => { cancelled = true; };
    }, [order?.id, order?.status]);


    const handleCopyCode = () => {
        if (!order?.id) return;
        navigator.clipboard.writeText(order.id);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleReorder = (item?: OrderItemResponse) => {
        if (!order) return;
        setReorderItems(item ? [item] : null);
        setIsReorderModalOpen(true);
    };

    const handleConfirmReorder = async (selectedItems: OrderItemResponse[]) => {
        if (!order) return;
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

        setIsReorderModalOpen(false);
        if (failures.length > 0) {
            showToast(failures[0], 'error');
            return;
        }
        showToast('Đã thêm sản phẩm vào giỏ hàng!');
        setTimeout(() => navigate('/cart'), 1200);
    };

    const [confirmingDelivery, setConfirmingDelivery] = useState(false);
    const [confirmDeliveryModalOpen, setConfirmDeliveryModalOpen] = useState(false);

    const handleConfirmReceived = async () => {
        if (!order?.id) return;
        setConfirmingDelivery(true);
        try {
            await ordersService.confirmDelivery(order.id);
            setConfirmDeliveryModalOpen(false);
            showToast('Xác nhận nhận hàng thành công! Đơn hàng đã hoàn tất.');
            const res = await ordersService.getById(order.id);
            setOrder(res);
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Lỗi khi xác nhận nhận hàng.'), 'error');
        } finally {
            setConfirmingDelivery(false);
        }
    };

    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [cancelReason, setCancelReason] = useState('Đổi ý không muốn mua nữa');
    const [customCancelReason, setCustomCancelReason] = useState('');

    const handleCancelOrder = async () => {
        if (!order?.id) return;
        setCancellingOrder(true);
        try {
            const finalReason = cancelReason === 'Khác' ? (customCancelReason.trim() || 'Lý do khác') : cancelReason;
            await ordersService.cancelOrder(order.id, finalReason);
            setIsCancelModalOpen(false);
            const isPaid = order.paymentStatus === 'PAID' && order.paymentMethod?.toLowerCase() !== 'cod';
            showToast(isPaid ? 'Đã hủy đơn và hoàn tiền tự động về tài khoản ngân hàng!' : 'Hủy đơn hàng thành công!', 'success');
            const res = await ordersService.getById(order.id);
            setOrder(res);
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Lỗi khi hủy đơn hàng.'), 'error');
        } finally {
            setCancellingOrder(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <p className="text-gray-400 font-semibold text-sm">Đang tải chi tiết đơn hàng...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
                <AlertCircle size={48} className="text-red-500 mx-auto" />
                <h3 className="text-lg font-bold text-gray-900">Không tìm thấy đơn hàng</h3>
                <button
                    onClick={() => navigate('/orders')}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                    Quay lại danh sách đơn hàng
                </button>
            </div>
        );
    }

    const formatDate = (dateStr: any) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const hour = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${day} Thg ${month} ${year}, ${hour}:${min}`;
    };

    const getPaymentMethodLabel = (method: string | undefined) => {
        switch (method?.toLowerCase()) {
            case 'payos': return 'payOS (QR ngân hàng)';
            case 'vnpay': return 'VNPay';
            case 'cod': return 'Thanh toán khi nhận hàng (COD)';
            default: return 'Ví điện tử';
        }
    };

    const getShippingCarrierLabel = (provider: string) => {
        switch (provider?.toLowerCase()) {
            case 'ghtk': return 'Giao Hàng Tiết Kiệm';
            case 'ghn': return 'Giao Hàng Nhanh';
            default: return 'Giao Hàng Nhanh';
        }
    };

    // Đơn trả trước (payOS/VNPay) đã nhận tiền nhưng shop chưa duyệt: khách phải thấy rõ là đã trả.
    const isPrepaidPaid = order.paymentMethod !== 'COD' && order.paymentStatus === 'PAID';
    const paidAmountText = `${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ`;

    const statusBannerMap: Record<string, { title: string; desc: string; bg: string; iconBg: string }> = {
        pending: isPrepaidPaid ? {
            title: order.isPod ? 'Đã thanh toán · Đơn POD chờ duyệt in' : 'Đã thanh toán · Chờ shop xác nhận',
            desc: `Bạn đã thanh toán ${paidAmountText} qua ${getPaymentMethodLabel(order.paymentMethod)}${order.paidAt ? ` lúc ${formatDate(order.paidAt)}` : ''}. `
                + (order.isPod ? 'Đơn in theo yêu cầu đang được kiểm tra trước khi chuyển xưởng in.' : 'Shop sẽ xác nhận và chuẩn bị hàng cho bạn.'),
            bg: 'bg-emerald-50 border-emerald-100',
            iconBg: 'bg-emerald-600'
        } : {
            title: order.isPod ? 'Đơn hàng POD đang chờ xác nhận' : 'Đơn hàng đang chờ xác nhận',
            desc: order.isPod ? 'Đơn hàng in theo yêu cầu đang được kiểm tra trước khi chuyển xưởng in.' : 'Shop đang chuẩn bị xác nhận đơn hàng của bạn.',
            bg: 'bg-amber-50 border-amber-100',
            iconBg: 'bg-amber-600'
        },
        paid: {
            title: order.fulfillmentStatus === 'PRINTING' 
                ? 'Đơn hàng POD đang in ấn tại xưởng' 
                : order.fulfillmentStatus === 'PACKAGED' 
                ? 'Đã in xong & đang đóng gói'
                : 'Đơn hàng đang chuẩn bị',
            desc: order.fulfillmentStatus === 'PRINTING'
                ? 'Xưởng in đang thực hiện in ấn họa tiết lên sản phẩm của bạn.'
                : order.fulfillmentStatus === 'PACKAGED'
                ? 'Sản phẩm đã in xong, xưởng in đang đóng hộp chuẩn bị giao cho shipper.'
                : 'Sản phẩm của bạn đang được xưởng chuẩn bị gia công đóng gói.',
            bg: 'bg-indigo-50 border-indigo-100',
            iconBg: 'bg-indigo-600'
        },
        shipping: {
            title: 'Đơn hàng đang được giao',
            desc: order.shippingCode
                ? `Đơn hàng đã xuất kho và bàn giao cho ${getShippingCarrierLabel(order.shippingProvider)} (Mã vận đơn: ${order.shippingCode}).`
                : 'Vui lòng chú ý điện thoại để shipper liên hệ giao hàng.',
            bg: 'bg-[#EEF2FF] border-indigo-100',
            iconBg: 'bg-emerald-600'
        },
        completed: {
            title: 'Đơn hàng đã được giao thành công',
            desc: 'Cảm ơn bạn đã tin tưởng mua sắm tại VietCraft.',
            bg: 'bg-emerald-50 border-emerald-100',
            iconBg: 'bg-emerald-600'
        },
        cancelled: {
            title: 'Đơn hàng đã bị hủy',
            desc: 'Đơn hàng này đã hủy. Bạn có thể nhấn Mua lại để đặt lại.',
            bg: 'bg-slate-100 border-slate-200',
            iconBg: 'bg-slate-500'
        }
    };

    // Đơn payOS chưa trả tiền: huỷ ở trang payOS hay link hết hạn đều giữ đơn ở đây để trả lại.
    const awaitingPayment = order.paymentMethod === 'PAYOS' && order.paymentStatus === 'PENDING' && order.status === 'pending';
    const paymentCancelled = searchParams.get('payment') === 'cancelled' || searchParams.get('cancel') === 'true';

    const handleRepay = async () => {
        setRepaying(true);
        try {
            const { checkoutUrl } = await ordersService.createPayosPayment(order._id || order.id);
            window.location.href = checkoutUrl;
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thể mở cổng thanh toán payOS. Vui lòng thử lại.'), 'error');
            setRepaying(false);
        }
    };

    const statusBanner = awaitingPayment ? {
        title: returnedPaid ? 'Đang xác nhận thanh toán' : 'Đơn hàng chờ thanh toán',
        desc: returnedPaid
            ? 'payOS đã nhận thanh toán, hệ thống đang xác nhận. Trang sẽ tự cập nhật trong giây lát.'
            : paymentCancelled
            ? 'Bạn đã huỷ thanh toán. Đơn hàng vẫn được giữ, bấm "Thanh toán lại" để hoàn tất.'
            : 'Đơn hàng chưa được thanh toán. Shop chỉ xử lý đơn sau khi bạn thanh toán thành công.',
        bg: 'bg-orange-50 border-orange-100',
        iconBg: 'bg-orange-500'
    } : statusBannerMap[order.status] || {
        title: 'Đơn hàng',
        desc: 'Đơn hàng đang được cập nhật.',
        bg: 'bg-gray-50 border-gray-200',
        iconBg: 'bg-gray-500'
    };

    const orderItems: OrderItemResponse[] = Array.isArray(order.items) ? order.items : [];
    const subtotal = orderItems.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 0)), 0);
    const shippingFee = Number(order.shippingFee ?? 0);
    const totalAmount = Number(order.totalAmount ?? 0);
    const canCancelOrder = order && 
        order.status !== 'cancelled' &&
        order.status !== 'shipping' &&
        order.status !== 'completed' &&
        !['SUBMITTED', 'RECEIVED', 'PRINTING', 'PACKAGED', 'SHIPPED', 'DELIVERED'].includes(order.fulfillmentStatus || '') &&
        (
            // Chưa thanh toán (COD hoặc pending): luôn có thể hủy
            order.status === 'pending' ||
            order.paymentStatus === 'PENDING' ||
            // Đơn POD: chưa chuyển xưởng in (chờ duyệt hoặc trong hàng đợi)
            (order.isPod && !['SUBMITTED', 'RECEIVED', 'PRINTING', 'PACKAGED'].includes(order.fulfillmentStatus || '')) ||
            // Đơn có sẵn: người bán chưa duyệt/chuẩn bị hàng
            (!order.isPod && order.sellerApprovalStatus === 'PENDING_APPROVAL')
        );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Top Bar: Back & Actions */}
            <div className="flex items-center justify-between gap-4">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase"
                >
                    <ArrowLeft size={14} />
                    <span>Trở lại</span>
                </button>

                <div className="flex items-center gap-2">
                    {canCancelOrder && (
                        <button
                            type="button"
                            onClick={() => setIsCancelModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 shadow-xs transition hover:bg-red-50 hover:border-red-300 active:scale-95 cursor-pointer"
                        >
                            <XCircle size={14} />
                            <span>Hủy đơn hàng</span>
                        </button>
                    )}

                    {order.status === 'cancelled' && (
                        <button
                            type="button"
                            onClick={() => handleReorder()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#008000] hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                        >
                            <RefreshCw size={14} />
                            <span>Mua lại</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            <div className={`border rounded-2xl p-5 flex items-center gap-4 ${statusBanner.bg}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${statusBanner.iconBg}`}>
                    {awaitingPayment ? <CreditCard size={22} /> : isPrepaidPaid && order.status === 'pending' ? <CheckCircle size={22} /> : <Truck size={22} />}
                </div>
                <div className="space-y-0.5">
                    <h2 className="font-extrabold text-gray-900 text-sm">{statusBanner.title}</h2>
                    <p className="text-xs text-gray-500 font-medium">{statusBanner.desc}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {awaitingPayment && !returnedPaid && (
                        <button
                            type="button"
                            onClick={() => void handleRepay()}
                            disabled={repaying}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
                        >
                            {repaying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                            <span>{repaying ? 'Đang mở payOS...' : 'Thanh toán lại'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Active Return Alert Banner */}
            {eligibilityItems.find(it => it.activeRequestId)?.activeRequestId && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                            <RotateCcw size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm text-indigo-950">
                                    Đơn hàng đang có yêu cầu đổi trả / hoàn tiền
                                </h3>
                                <span className="bg-indigo-200/70 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    Return v3
                                </span>
                            </div>
                            <p className="text-xs text-indigo-700 mt-0.5">
                                Yêu cầu #{eligibilityItems.find(it => it.activeRequestId)?.activeRequestId} đang trong tiến trình xử lý POD. Bạn có thể bấm theo dõi tiến độ chi tiết.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(`/returns/${encodeURIComponent(eligibilityItems.find(it => it.activeRequestId)!.activeRequestId!)}`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                        <span>Theo dõi tiến độ yêu cầu</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delivery Address */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-900 text-xs tracking-wider uppercase">Địa chỉ nhận hàng</h3>
                    <div className="space-y-1">
                        <p className="text-sm font-extrabold text-gray-900">
                            {order.shippingAddress?.recipient_name}
                            <span className="text-gray-300 mx-2">|</span>
                            <span className="text-gray-600 font-medium">{order.shippingAddress?.phone}</span>
                        </p>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            {order.shippingAddress?.address_detail}
                        </p>
                    </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-900 text-xs tracking-wider uppercase">Thông tin vận chuyển</h3>
                    <div className="space-y-1">
                        <p className="text-xs text-gray-600 font-bold">
                            Đơn vị: {getShippingCarrierLabel(order.shippingProvider)}
                        </p>
                        {order.shippingCode && (
                            <p className="text-xs font-mono font-bold text-gray-800 pt-0.5">
                                Mã vận đơn: <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{order.shippingCode}</span>
                            </p>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold pt-1">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                <Check size={10} />
                            </div>
                            <span>
                                {order.status === 'shipping'
                                    ? 'Đang giao hàng'
                                    : order.status === 'completed'
                                    ? 'Giao hàng thành công'
                                    : order.fulfillmentStatus === 'PRINTING'
                                    ? 'Đang in ấn tại xưởng'
                                    : order.fulfillmentStatus === 'PACKAGED'
                                    ? 'Đã đóng gói tại xưởng'
                                    : 'Chờ giao cho đơn vị vận chuyển'}
                            </span>
                        </div>
                        {order.status === 'shipping' && (
                            <button className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 pt-1.5 block">
                                Xem toàn bộ hành trình &gt;
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Shop & Items */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Shop Header */}
                <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={order.shopLogo || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=80'} alt={order.shopName} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-extrabold text-sm text-gray-800">{order.shopName || 'VietCraft Shop'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                if (order.shopId) {
                                    window.dispatchEvent(new CustomEvent('vietcraft-open-chat', { detail: { shopId: order.shopId } }));
                                } else {
                                    showToast('Gian hàng này không còn hoạt động', 'error');
                                }
                            }}
                            className="border border-emerald-500 hover:bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                            <MessageSquare size={12} />
                            <span>Chat với Shop</span>
                        </button>
                        <button
                            onClick={() => order.shopId ? navigate(`/shop/${order.shopId}`) : showToast('Gian hàng này không còn hoạt động', 'error')}
                            className="border border-gray-200 hover:bg-gray-50 text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                            <Store size={12} />
                            <span>Xem Shop</span>
                        </button>
                    </div>
                </div>

                {/* Items */}
                <OrderItemsList
                    orderId={order._id}
                    items={orderItems}
                    eligibilityItems={eligibilityItems}
                    completed={order.status === 'completed'}
                    onReview={handleOpenReview}
                    onReorder={handleReorder}
                />

                {order.status === 'shipping' && <div className="flex justify-end border-t border-gray-50 p-4">
                    <button
                        type="button"
                        onClick={() => setConfirmDeliveryModalOpen(true)}
                        disabled={confirmingDelivery}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                        title="Xác nhận bạn đã nhận được kiện hàng từ shipper"
                    >
                        <CheckCircle size={14} />
                        <span>{confirmingDelivery ? 'Đang xử lý...' : 'Đã nhận được hàng'}</span>
                    </button>
                </div>}
            </div>

            {!awaitingPayment && (hasLegacyRefund || order.isPod !== true || orderItems.some(item => !item.order_item_id) || eligibilityItems.some(item => item.reasonIfNot?.code === 'NORMAL_UNSUPPORTED' || item.reasonIfNot?.code === 'MISSING_ORDER_ITEM_ID')) && <OrderSupportSection
                orderId={order.id}
                refundOrderId={order._id}
                orderStatus={order.status}
            />}

            {/* Bottom Payment details */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Left block (Totals breakdown) */}
                <div className="flex-1 md:pr-8 space-y-3">
                    <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-50 pb-2">Thanh toán</h3>
                    <div className="space-y-2 text-xs text-gray-600 font-medium">
                        <div className="flex justify-between">
                            <span>Tạm tính</span>
                            <span className="text-gray-950 font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Phí vận chuyển</span>
                            <span className="text-gray-950 font-semibold">{shippingFee.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-50 pt-2 font-black text-sm text-gray-900">
                            <span>Thành tiền</span>
                            <span className="text-emerald-700 text-base">{totalAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>
                </div>

                {/* Right block (Metadata info) */}
                <div className="flex-1 pt-6 md:pt-0 md:pl-8 space-y-3">
                    <h3 className="font-extrabold text-gray-900 text-xs tracking-wider uppercase md:opacity-0 md:h-5">Metadata</h3>
                    <div className="space-y-2.5 text-xs text-gray-600 font-medium">
                        <div className="flex items-center justify-between">
                            <span>Mã đơn hàng</span>
                            <div className="flex items-center gap-1 font-bold text-gray-900">
                                <span>#{order.id}</span>
                                <button
                                    onClick={handleCopyCode}
                                    className="text-emerald-600 hover:text-emerald-700 p-0.5 hover:bg-emerald-50 rounded"
                                    title="Sao chép mã đơn hàng"
                                >
                                    <Copy size={12} />
                                </button>
                                {copySuccess && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">Đã chép</span>}
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span>Thời gian đặt hàng</span>
                            <span className="text-gray-900 font-semibold">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Trạng thái thanh toán</span>
                            {order.paymentStatus === 'PAID' ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><CheckCircle size={13} /> Đã thanh toán</span>
                            ) : order.paymentStatus === 'REFUNDED' ? (
                                <span className="font-bold text-indigo-700">Đã hoàn tiền</span>
                            ) : (
                                <span className="font-bold text-orange-600">{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Chưa thanh toán'}</span>
                            )}
                        </div>
                        <div className="flex justify-between">
                            <span>Thời gian thanh toán</span>
                            <span className="text-gray-900 font-semibold">{order.paidAt ? formatDate(order.paidAt) : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Phương thức thanh toán</span>
                            <span className="text-gray-950 font-bold">{getPaymentMethodLabel(order.paymentMethod)}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Reorder Modal */}
            {order && (
                <ReorderModal
                    isOpen={isReorderModalOpen}
                    onClose={() => setIsReorderModalOpen(false)}
                    shopName={order.shopName || 'VietCraft Shop'}
                    items={reorderItems || orderItems}
                    onConfirm={handleConfirmReorder}
                />
            )}

            {/* Review Modal */}
            {order && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => {
                        setIsReviewModalOpen(false);
                        setTargetReviewProductId(undefined);
                    }}
                    order={{
                        id: order.id,
                        shopName: order.shopName,
                        shopLogo: order.shopLogo,
                        items: orderItems,
                        is_reviewed: order.is_reviewed
                    }}
                    initialProductId={targetReviewProductId}
                    onSuccess={handleReviewSuccess}
                />
            )}

            {/* Confirm Received In-App Modal */}
            {confirmDeliveryModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget && !confirmingDelivery) {
                            setConfirmDeliveryModalOpen(false);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-delivery-title"
                        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <PackageCheck size={24} />
                            </div>
                            <button
                                type="button"
                                disabled={confirmingDelivery}
                                onClick={() => setConfirmDeliveryModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h3 id="confirm-delivery-title" className="mt-4 text-base font-extrabold text-slate-900">
                            Xác nhận đã nhận hàng
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            Bạn xác nhận đã nhận được kiện hàng từ đơn vị vận chuyển và kiểm tra đầy đủ các sản phẩm bên trong?
                        </p>

                        <div className="mt-3.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-5 text-emerald-900">
                            Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái <strong>"Đã giao"</strong>. Bạn có thể đánh giá sản phẩm hoặc tạo yêu cầu <strong>Đổi/trả hàng</strong> nếu phát hiện sản phẩm có lỗi.
                        </div>

                        <div className="mt-6 flex flex-col-reverse justify-end gap-2.5 sm:flex-row">
                            <button
                                type="button"
                                disabled={confirmingDelivery}
                                onClick={() => setConfirmDeliveryModalOpen(false)}
                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                            >
                                Huỷ
                            </button>
                            <button
                                type="button"
                                disabled={confirmingDelivery}
                                onClick={handleConfirmReceived}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                            >
                                {confirmingDelivery ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        <span>Xác nhận đã nhận</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Cancel Order Modal */}
            {isCancelModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget && !cancellingOrder) {
                            setIsCancelModalOpen(false);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-order-title"
                        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/20 text-red-600 border border-red-200/60 shadow-xs">
                                    <AlertTriangle size={24} className="stroke-[2.2]" />
                                </div>
                                <div>
                                    <h3 id="cancel-order-title" className="text-lg font-extrabold text-slate-900 tracking-tight">
                                        Xác nhận hủy đơn hàng
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Mã đơn: <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">#{order.id}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={cancellingOrder}
                                onClick={() => setIsCancelModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Notice Banner */}
                        <div className="mt-4.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                Sau khi hủy đơn, lượt dùng mã giảm giá và số lượng tồn kho sản phẩm sẽ được <strong>hoàn lại tự động</strong>.
                                {order.paymentStatus === 'PAID' && order.paymentMethod?.toLowerCase() !== 'cod' ? (
                                    <> Số tiền đã thanh toán sẽ được hệ thống <strong>tự động hoàn tiền về tài khoản ngân hàng</strong> bạn đã dùng để thanh toán.</>
                                ) : null}
                            </span>
                        </div>

                        {/* Reason Selection */}
                        <div className="mt-4.5 space-y-2.5">
                            <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider">
                                Vui lòng chọn lý do hủy:
                            </label>
                            <div className="space-y-2">
                                {[
                                    'Đổi ý không muốn mua nữa',
                                    'Muốn thay đổi địa chỉ / số điện thoại nhận hàng',
                                    'Muốn thay đổi phân loại / kích thước / màu sắc',
                                    'Tìm thấy giá tốt hơn ở nơi khác',
                                    'Khác'
                                ].map((r) => {
                                    const isSelected = cancelReason === r;
                                    return (
                                        <div
                                            key={r}
                                            onClick={() => setCancelReason(r)}
                                            className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 ${
                                                isSelected
                                                    ? 'border-red-500 bg-red-50/40 text-red-950 font-semibold shadow-xs ring-1 ring-red-500/20'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/70 font-medium'
                                            }`}
                                        >
                                            <span className="leading-snug">{r}</span>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                                isSelected ? 'border-red-600 bg-red-600' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {cancelReason === 'Khác' && (
                                <div className="pt-1 animate-in fade-in duration-200">
                                    <textarea
                                        value={customCancelReason}
                                        onChange={e => setCustomCancelReason(e.target.value)}
                                        placeholder="Vui lòng chia sẻ thêm lý do hủy đơn của bạn..."
                                        rows={2}
                                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                disabled={cancellingOrder}
                                onClick={() => setIsCancelModalOpen(false)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                Không hủy nữa
                            </button>
                            <button
                                type="button"
                                disabled={cancellingOrder}
                                onClick={handleCancelOrder}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/20 transition hover:from-red-700 hover:to-rose-700 active:scale-95 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                            >
                                {cancellingOrder ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        <span>Đang hủy đơn...</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={15} />
                                        <span>Xác nhận hủy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

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
export default BuyerOrderDetailPage;
