import { useState, useEffect } from 'react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { cartService } from '../../order/services/cartService';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, Check, MessageSquare, Store, Copy, AlertCircle, Star, CheckCircle } from 'lucide-react';
import { ordersService } from '../../order/services/ordersService';
import ReorderModal from '../components/profile/ReorderModal';
import { RefundRequestPanel } from '../components/RefundRequestPanel';
import ReviewModal from '../components/profile/ReviewModal';

export function BuyerOrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [targetReviewProductId, setTargetReviewProductId] = useState<string | undefined>(undefined);

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
        const fetchOrderDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const res = await ordersService.getById(id);
                setOrder(res);
            } catch (err) {
                console.error('Failed to load order detail', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [id]);

    const handleCopyCode = () => {
        if (!order?.id) return;
        navigator.clipboard.writeText(order.id);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleReorder = () => {
        if (!order) return;
        setIsReorderModalOpen(true);
    };

    const handleConfirmReorder = async (selectedItems: any[]) => {
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

    const handleConfirmReceived = async () => {
        if (!order?.id) return;
        const ok = window.confirm('Bạn xác nhận đã nhận được kiện hàng và kiểm tra đầy đủ sản phẩm?');
        if (!ok) return;

        setConfirmingDelivery(true);
        try {
            await ordersService.confirmDelivery(order.id);
            showToast('Xác nhận nhận hàng thành công! Đơn hàng đã hoàn tất.');
            const res = await ordersService.getById(order.id);
            setOrder(res);
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Lỗi khi xác nhận nhận hàng.'), 'error');
        } finally {
            setConfirmingDelivery(false);
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

    const getPaymentMethodLabel = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'momo': return 'Ví MoMo';
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

    const statusBannerMap: Record<string, { title: string; desc: string; bg: string; iconBg: string }> = {
        pending: {
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

    const statusBanner = statusBannerMap[order.status] || {
        title: 'Đơn hàng',
        desc: 'Đơn hàng đang được cập nhật.',
        bg: 'bg-gray-50 border-gray-200',
        iconBg: 'bg-gray-500'
    };

    const orderItems: any[] = Array.isArray(order.items) ? order.items : [];
    const subtotal = orderItems.reduce((acc: number, it: any) => acc + ((it.price || 0) * (it.quantity || 0)), 0);
    const shippingFee = Number(order.shippingFee ?? 0);
    const totalAmount = Number(order.totalAmount ?? (subtotal + shippingFee));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase"
            >
                <ArrowLeft size={14} />
                <span>Trở lại</span>
            </button>

            {/* Status Banner */}
            <div className={`border rounded-2xl p-5 flex items-center gap-4 ${statusBanner.bg}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${statusBanner.iconBg}`}>
                    <Truck size={22} />
                </div>
                <div className="space-y-0.5">
                    <h2 className="font-extrabold text-gray-900 text-sm">{statusBanner.title}</h2>
                    <p className="text-xs text-gray-500 font-medium">{statusBanner.desc}</p>
                </div>
            </div>

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
                <div className="divide-y divide-gray-50 p-4">
                    {orderItems.map((item: any, idx: number) => (
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
                                <p className="text-[11px] text-gray-400 mt-1">Phân loại: {item.color || 'Trắng'}</p>
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
                                                onClick={() => handleOpenReview(item.productId)}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-amber-200/70 shadow-2xs"
                                                title="Xem và chỉnh sửa đánh giá cho sản phẩm này"
                                            >
                                                <Star size={11} className="fill-amber-500 text-amber-500" />
                                                <span>Chỉnh sửa đánh giá</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenReview(item.productId)}
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

                {/* Item Card Actions */}
                <div className="p-4 bg-gray-50/10 border-t border-gray-50 flex justify-end gap-2">

                    <RefundRequestPanel orderId={order.id} orderStatus={order.status} />
                    {order.status === 'shipping' && (
                        <button
                            type="button"
                            onClick={handleConfirmReceived}
                            disabled={confirmingDelivery}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                            title="Xác nhận bạn đã nhận được kiện hàng từ shipper"
                        >
                            <CheckCircle size={14} />
                            <span>{confirmingDelivery ? 'Đang xử lý...' : 'Đã nhận được hàng'}</span>
                        </button>
                    )}
                    {order.status === 'completed' && (
                        order.is_reviewed || (orderItems.length > 0 && orderItems.every((it: any) => it.is_reviewed)) ? (
                            <button
                                onClick={() => handleOpenReview()}
                                className="border border-amber-500 text-amber-700 hover:bg-amber-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                title="Xem và chỉnh sửa đánh giá của đơn hàng này"
                            >
                                <Star size={14} className="fill-amber-500 text-amber-500" />
                                <span>Chỉnh sửa đánh giá</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => handleOpenReview()}
                                className="border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                title="Đánh giá sản phẩm trong đơn hàng"
                            >
                                <Star size={14} />
                                <span>Đánh giá</span>
                            </button>
                        )
                    )}
                    <button
                        onClick={handleReorder}
                        className="border border-emerald-600 hover:bg-emerald-50 text-emerald-600 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                        <span>Mua lại</span>
                    </button>
                </div>
            </div>

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
                            <span>Thời gian thanh toán</span>
                            <span className="text-gray-900 font-semibold">{formatDate(order.createdAt)}</span>
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
                    items={orderItems}
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
