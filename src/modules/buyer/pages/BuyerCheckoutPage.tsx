import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Tag, CreditCard, Wallet, Landmark, Truck, Check } from 'lucide-react';
import { ordersService } from '../../order/services/ordersService';
import { userService } from '../../user/services/userService';
import { cartService } from '../../order/services/cartService';

interface CheckoutItem {
    id?: string;
    productId: string;
    variantId: string;
    title: string;
    shopName: string;
    variantName: string;
    price: number;
    quantity: number;
    image: string;
    color?: string;
    size?: string;
}

export function BuyerCheckoutPage() {
    const navigate = useNavigate();
    const { setCartCount } = useOutletContext<{ setCartCount: (n: number) => void }>();
    const [items, setItems] = useState<CheckoutItem[]>([]);

    const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | 'bank' | 'cod'>('momo');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    useEffect(() => {
        const stored = localStorage.getItem('vietcraft_checkout');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.length > 0) {
                    setItems(parsed);
                }
            } catch (e) {}
        }

        const fetchAddress = async () => {
            try {
                const profile = await userService.getProfile();
                if (profile && profile.addresses && profile.addresses.length > 0) {
                    const defaultAddr = profile.addresses.find((a: any) => a.is_default) || profile.addresses[0];
                    setRecipientAddress(defaultAddr);
                }
            } catch (err) {
                console.error('Failed to load profile address', err);
            }
        };
        fetchAddress();
    }, []);

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) return;
        if (couponCode.toUpperCase() === 'GIAM50K' || couponCode.toUpperCase() === 'VIETCRAFT50') {
            setDiscount(50000);
            setCouponApplied(true);
        } else if (couponCode.toUpperCase() === 'FREESHIP') {
            setDiscount(30000);
            setCouponApplied(true);
        } else {
            showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn.', 'error');
        }
    };

    const handlePlaceOrder = async () => {
        if (!recipientAddress) {
            showToast('Vui lòng thiết lập địa chỉ nhận hàng trong trang Hồ sơ trước.', 'error');
            setTimeout(() => {
                navigate('/profile');
            }, 1000);
            return;
        }

        setLoading(true);
        try {
            const subtotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
            const shippingFee = 30000;
            const totalAmount = subtotal + shippingFee - discount;

            const orderPayload = {
                items: items.map(it => ({
                    productId: it.productId,
                    variantId: it.variantId,
                    quantity: it.quantity,
                    price: it.price,
                    title: it.title,
                    color: it.color || 'Mặc định',
                    size: it.size || 'L',
                    image: it.image
                })),
                paymentGateway: paymentMethod === 'cod' ? 'cod' : paymentMethod === 'momo' ? 'momo' : 'vnpay',
                shippingProvider: 'ghn',
                shopName: items[0]?.shopName || 'VietCraft Shop',
                shippingAddress: {
                    recipient_name: recipientAddress.recipient_name,
                    phone: recipientAddress.phone,
                    address_detail: recipientAddress.address_detail,
                    province_id: recipientAddress.province_id || '79',
                    district_id: recipientAddress.district_id || '760',
                    ward_code: recipientAddress.ward_code || '26734'
                },
                totalAmount,
                shippingFee
            };

            const createdOrder = await ordersService.create(orderPayload);
            showToast(`Đặt hàng thành công! Mã đơn hàng: ${createdOrder.id}`, 'success');

            // Clear checkout storage
            localStorage.removeItem('vietcraft_checkout');

            // Remove purchased items from database cart
            const removePromises = items.map(item => {
                if (item.id) {
                    return cartService.removeItem(item.id).catch(err => console.error("Error removing from cart on checkout:", err));
                }
                return Promise.resolve();
            });
            await Promise.all(removePromises);

            // Sync updated cart count to layout/header
            try {
                const updatedCart = await cartService.getCart();
                const total = updatedCart?.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || 0;
                setCartCount(total);
            } catch (e) {
                setCartCount(0);
            }

            // Redirect to order details or list
            setTimeout(() => {
                navigate(`/orders/${createdOrder.id}`);
            }, 1500);
        } catch (error: any) {
            console.error(error);
            showToast('Có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const subtotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const shippingFee = 30000;
    const finalTotal = subtotal + shippingFee - discount;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Thanh toán</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Address, Orders, Payment) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Delivery Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900 text-lg">Địa chỉ giao hàng</h2>
                            <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Thay đổi</button>
                        </div>
                        {recipientAddress ? (
                            <div className="flex items-start gap-2 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-gray-900 text-sm">{recipientAddress.recipient_name}</span>
                                        <span className="text-gray-400">|</span>
                                        <span className="text-gray-600 text-sm font-medium">{recipientAddress.phone}</span>
                                        {recipientAddress.is_default && (
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                                MẶC ĐỊNH
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        {recipientAddress.address_detail}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                                <p className="text-xs text-gray-500 font-semibold mb-2">Chưa thiết lập địa chỉ nhận hàng.</p>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                                >
                                    Thêm địa chỉ trong Hồ sơ &gt;
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Order items */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 text-lg mb-4">Đơn hàng của bạn</h2>
                        <div className="space-y-4">
                            {items.length > 0 ? (
                                items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-3 rounded-xl border border-gray-50 bg-white">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{item.title}</h3>
                                            <p className="text-[11px] text-gray-400 mt-1">Loại phôi: {item.title.includes('Cốc') ? 'Cốc sứ' : 'Áo thun Premium'}</p>
                                            <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                                                {item.size && <span>Kích cỡ: {item.size}</span>}
                                                {item.color && <span>Màu sắc: {item.color}</span>}
                                                <span>Số lượng: {item.quantity}</span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="font-extrabold text-emerald-600 text-sm">
                                                    {item.price.toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 font-semibold mb-2">Không có sản phẩm nào trong hàng chờ thanh toán.</p>
                                    <button
                                        onClick={() => navigate('/cart')}
                                        className="text-xs font-bold text-emerald-600 hover:underline"
                                    >
                                        Quay lại giỏ hàng
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment methods */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 text-lg mb-4">Phương thức thanh toán</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('momo')}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                    paymentMethod === 'momo'
                                        ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 ring-1 ring-emerald-600'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <Wallet className={paymentMethod === 'momo' ? 'text-emerald-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Ví điện tử (MoMo/ZaloPay)</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                    paymentMethod === 'card'
                                        ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 ring-1 ring-emerald-600'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <CreditCard className={paymentMethod === 'card' ? 'text-emerald-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Thẻ tín dụng / Ghi nợ</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('bank')}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                    paymentMethod === 'bank'
                                        ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 ring-1 ring-emerald-600'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <Landmark className={paymentMethod === 'bank' ? 'text-emerald-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Chuyển khoản ngân hàng</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('cod')}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                                    paymentMethod === 'cod'
                                        ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 ring-1 ring-emerald-600'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <Truck className={paymentMethod === 'cod' ? 'text-emerald-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Thanh toán khi nhận hàng (COD)</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column (Coupon & Checkout summary) */}
                <div className="space-y-6">
                    {/* Coupons */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 text-sm mb-3">Mã giảm giá</h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Tag className="absolute inset-y-0 left-3 my-auto text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Nhập mã giảm giá..."
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <button
                                onClick={handleApplyCoupon}
                                className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg px-4 py-2 text-xs font-bold transition-all flex-shrink-0"
                            >
                                Áp dụng
                            </button>
                        </div>
                        {couponApplied && (
                            <p className="text-xs text-emerald-600 font-bold mt-2">
                                ✓ Đã áp dụng mã giảm giá thành công (-{discount.toLocaleString('vi-VN')}đ)
                            </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">Gợi ý mã: GIAM50K (cho đơn hàng), FREESHIP (miễn phí ship)</p>
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                        <div className="space-y-2 text-xs text-gray-600 font-medium">
                            <div className="flex justify-between">
                                <span>Tạm tính</span>
                                <span className="text-gray-950 font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Phí in & vận chuyển</span>
                                <span className="text-gray-950 font-semibold">{shippingFee.toLocaleString('vi-VN')}đ</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-red-500 font-bold">
                                    <span>Giảm giá</span>
                                    <span>-{discount.toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">Tổng thanh toán</span>
                            <div className="text-right">
                                <span className="text-lg font-black text-emerald-600">
                                    {finalTotal.toLocaleString('vi-VN')}đ
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">(Đã bao gồm VAT nếu có)</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || items.length === 0}
                            className={`w-full bg-[#008000] hover:bg-emerald-700 text-white rounded-full py-3 font-bold transition-all text-sm shadow-md active:scale-[0.98] ${
                                loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[9999] bg-white border border-gray-150 shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm border-l-4 ${toast.type === 'success' ? 'border-l-emerald-500' : 'border-l-red-500'} transform translate-y-0 transition-all duration-300`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {toast.type === 'success' ? <Check size={18} /> : <span>⚠️</span>}
                    </div>
                    <div>
                        <p className="text-xs font-extrabold text-gray-900">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
export default BuyerCheckoutPage;
