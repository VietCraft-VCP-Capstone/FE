import { useState, useEffect } from 'react';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { cartService } from '../../order/services/cartService';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Truck, Check, MessageSquare, Store, Copy, AlertCircle } from 'lucide-react';
import { ordersService } from '../../order/services/ordersService';
import ReorderModal from '../components/profile/ReorderModal';

export function BuyerOrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

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

    const statusBannerMap: Record<string, { title: string; desc: string; bg: string; iconBg: string }> = {
        pending: {
            title: 'Đơn hàng đang chờ xác nhận',
            desc: 'Shop đang chuẩn bị xác nhận đơn hàng của bạn.',
            bg: 'bg-amber-50 border-amber-100',
            iconBg: 'bg-amber-600'
        },
        paid: {
            title: 'Đơn hàng đang chuẩn bị',
            desc: 'Sản phẩm của bạn đang được shop in ấn và gia công đóng gói.',
            bg: 'bg-indigo-50 border-indigo-100',
            iconBg: 'bg-indigo-600'
        },
        shipping: {
            title: 'Đơn hàng đang được giao',
            desc: 'Vui lòng chú ý điện thoại để shipper liên hệ giao hàng.',
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
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold pt-1">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                <Check size={10} />
                            </div>
                            <span>
                                {order.status === 'shipping'
                                    ? 'Đang giao hàng'
                                    : order.status === 'completed'
                                    ? 'Giao hàng thành công'
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
                        <button className="border border-emerald-500 hover:bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                            <MessageSquare size={12} />
                            <span>Chat với Shop</span>
                        </button>
                        <button className="border border-gray-200 hover:bg-gray-50 text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
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
                            <div className="text-right">
                                <span className="font-extrabold text-gray-900 text-sm">
                                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Item Card Actions */}
                <div className="p-4 bg-gray-50/10 border-t border-gray-50 flex justify-end gap-2">
                    <button
                        disabled
                        className="border border-gray-200 text-gray-300 bg-gray-50 text-xs font-bold px-4 py-2 rounded-lg cursor-not-allowed"
                    >
                        Yêu cầu Trả hàng/Hoàn tiền
                    </button>
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
