import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import {
    ArrowLeft, Tag, CreditCard, Wallet, Landmark, Truck, Check,
    Ticket, X, Flame, Percent, Coins, Layers,
    ChevronRight, AlertCircle, RefreshCw, Package, Sparkles, Star
} from 'lucide-react';

import { ordersService } from '../../order/services/ordersService';
import { userService } from '../../user/services/userService';
import { cartService } from '../../order/services/cartService';
import { productsService } from '../../product/services/productsService';
import { promotionService, CouponDTO, ApplyCouponResponse } from '../../promotion/services/promotionService';
import { getApiErrorMessage, isLoggedIn } from '../../../infrastructure/api/interceptors';

interface CheckoutItem {
    id?: string;
    productId: string;
    shopId?: string;
    variantId: string;
    title: string;
    shopName: string;
    variantName: string;
    price: number;
    quantity: number;
    image: string;
    color?: string;
    size?: string;
    productType?: string;
}

const parseVal = (val: any): number => {

    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && val.$numberDecimal) return Number(val.$numberDecimal) || 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

export function BuyerCheckoutPage() {

    const navigate = useNavigate();
    const outletContext = useOutletContext<{ setCartCount?: (n: number) => void }>() || {};
    const setCartCount = outletContext.setCartCount ?? (() => {});
    const [items, setItems] = useState<CheckoutItem[]>([]);
    const authed = isLoggedIn();

    const [paymentMethod, setPaymentMethod] = useState<'payos' | 'card' | 'bank' | 'cod'>('payos');
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [couponApplied, setCouponApplied] = useState(false);
    const [appliedCouponInfo, setAppliedCouponInfo] = useState<ApplyCouponResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Coupon modal & available vouchers state
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<CouponDTO[]>([]);
    const [loadingCoupons, setLoadingCoupons] = useState(false);
    const [couponsLoaded, setCouponsLoaded] = useState(false);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    useEffect(() => {
        if (!authed) return;

        const stored = localStorage.getItem('vietcraft_checkout');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.length > 0) {
                    setItems(parsed);
                    if (!parsed[0].shopId && parsed[0].productId) {
                        productsService.getById(parsed[0].productId).then((prod: any) => {
                            const foundShopId = prod?.shopInfo?.id || prod?.shop_id?._id || prod?.shop_id;
                            if (foundShopId) {
                                setItems((prev: any[]) => prev.map((item, idx) => idx === 0 ? { ...item, shopId: String(foundShopId) } : item));
                            }
                        }).catch(() => {});
                    }
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
    }, [authed]);

    const [shippingFee, setShippingFee] = useState<number>(30000);
    const [shippingDetails, setShippingDetails] = useState<{
        zoneLabel: string;
        shopProvince?: string;
        pricingType?: string;
    }>({ zoneLabel: 'Tiêu chuẩn' });
    const [loadingShipping, setLoadingShipping] = useState<boolean>(false);

    const currentShopId = items[0]?.shopId || (items[0] as any)?.shop_id;

    useEffect(() => {
        if (!currentShopId) return;

        let isCancelled = false;
        setLoadingShipping(true);

        ordersService.calculateShipping({
            shopId: String(currentShopId),
            address: recipientAddress || {}
        }).then((res) => {
            if (isCancelled) return;
            if (typeof res?.shippingFee === 'number') {
                setShippingFee(res.shippingFee);
                setShippingDetails({
                    zoneLabel: res.zoneLabel || 'Tiêu chuẩn',
                    shopProvince: res.shopProvince,
                    pricingType: res.pricingType
                });
            }
        }).catch((err) => {
            console.warn('Lỗi tính phí vận chuyển từ server, dùng mặc định:', err);
        }).finally(() => {
            if (!isCancelled) setLoadingShipping(false);
        });

        return () => {
            isCancelled = true;
        };
    }, [currentShopId, recipientAddress]);

    const subtotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const shippingDiscount = appliedCouponInfo?.target === 'SHIPPING' ? Math.min(discount, shippingFee) : 0;
    const productDiscount = appliedCouponInfo?.target === 'PRODUCT' ? discount : 0;
    const finalTotal = Math.max(0, subtotal - productDiscount + shippingFee - shippingDiscount);

    const hasPodItem = items.some(it => it.productType === 'POD_TEMPLATE');
    const codDisabled = hasPodItem;

    useEffect(() => {
        if (codDisabled && paymentMethod === 'cod') setPaymentMethod('payos');
    }, [codDisabled, paymentMethod]);

    // Fetch available coupons when opening modal or on initial items load
    const loadAvailableCoupons = useCallback(async () => {
        setLoadingCoupons(true);
        try {
            const data = await promotionService.getAvailableCoupons({
                shopId: currentShopId ? String(currentShopId) : undefined,
                productId: items[0]?.productId,
                subtotal,
                items: JSON.stringify(items.map(it => ({ productId: it.productId, price: it.price, quantity: it.quantity })))
            });
            setAvailableCoupons(Array.isArray(data) ? data : []);
            setCouponsLoaded(true);
        } catch (err) {
            console.error('Lỗi khi tải mã giảm giá:', err);
        } finally {
            setLoadingCoupons(false);
        }
    }, [items, subtotal]);

    const handleOpenCouponModal = () => {
        setShowCouponModal(true);
        if (items.length > 0 && !loadingCoupons && !couponsLoaded) loadAvailableCoupons();
    };

    useEffect(() => {
        if (items.length > 0) loadAvailableCoupons();
    }, [items.length, loadAvailableCoupons]);

    if (!authed) {
        return <Navigate to={`/login?next=${encodeURIComponent('/checkout')}`} replace />;
    }

    const handleApplyCoupon = async (codeToUse?: string) => {
        const targetCode = (typeof codeToUse === 'string' ? codeToUse : couponCode).trim();
        if (!targetCode) {
            showToast('Vui lòng nhập mã giảm giá', 'error');
            return;
        }

        setApplyingCoupon(true);
        try {
            const res = await promotionService.applyCoupon({
                code: targetCode,
                subtotal,
                shippingFee,
                shopId: currentShopId ? String(currentShopId) : undefined,
                productId: items[0]?.productId,
                items: items.map(it => ({ productId: it.productId, price: it.price, quantity: it.quantity }))
            });

            setDiscount(res.discount);
            setCouponApplied(true);
            setAppliedCouponInfo(res);
            setCouponCode(res.coupon?.code || targetCode.toUpperCase());
            setShowCouponModal(false);
            showToast(res.message || `Đã áp dụng mã giảm ${res.discount.toLocaleString('vi-VN')}đ thành công!`, 'success');
        } catch (err: any) {
            showToast(getApiErrorMessage(err, 'Mã giảm giá không hợp lệ hoặc không đủ điều kiện.'), 'error');
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setDiscount(0);
        setCouponApplied(false);
        setAppliedCouponInfo(null);
        setCouponCode('');
        showToast('Đã hủy áp dụng mã giảm giá.', 'success');
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
                paymentGateway: paymentMethod === 'cod' ? 'cod' : paymentMethod === 'payos' ? 'payos' : 'vnpay',
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
                totalAmount: finalTotal,
                shippingFee,
                couponCode: couponApplied ? (appliedCouponInfo?.coupon?.code || couponCode.trim().toUpperCase()) : undefined
            };

            const createdOrder = await ordersService.create(orderPayload);
            const serverTotal = Number(createdOrder?.totalAmount ?? 0);
            showToast(
                `Đặt hàng thành công! Mã đơn hàng: ${createdOrder?.id || ''} — Tổng thanh toán: ${serverTotal.toLocaleString('vi-VN')}đ`,
                'success'
            );

            localStorage.removeItem('vietcraft_checkout');

            const removePromises = items.map(item => {
                if (item.productId) {
                    return cartService.removeByProduct(item.productId, item.variantId)
                        .catch(err => console.error("Error removing from cart on checkout:", err));
                }
                return Promise.resolve();
            });
            await Promise.all(removePromises);

            try {
                const updatedCart = await cartService.getCart();
                const total = updatedCart?.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || 0;
                setCartCount(total);
            } catch (e) {
                setCartCount(0);
            }

            const orderPath = createdOrder?.id ? `/orders/${createdOrder.id}` : '/orders';

            if (paymentMethod === 'payos' && createdOrder?.id) {
                try {
                    const { checkoutUrl } = await ordersService.createPayosPayment(createdOrder.id);
                    window.location.href = checkoutUrl;
                    return;
                } catch (payosErr: any) {
                    showToast(getApiErrorMessage(payosErr, 'Không thể mở cổng payOS. Vui lòng thanh toán lại từ chi tiết đơn hàng.'), 'error');
                }
            }

            setTimeout(() => {
                navigate(orderPath);
            }, 1500);
        } catch (error: any) {
            showToast(getApiErrorMessage(error, 'Có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại.'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const getCouponBadge = (type: string) => {
        switch (type) {
            case 'FLASH_SALE':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200">
                        <Flame size={10} className="text-amber-500 fill-amber-500 animate-pulse" /> Flash Sale
                    </span>
                );
            case 'FREE_SHIPPING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-200">
                        <Truck size={10} /> Freeship
                    </span>
                );
            case 'PERCENTAGE':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200">
                        <Percent size={10} /> Giảm %
                    </span>
                );
            case 'FIXED_AMOUNT':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <Coins size={10} /> Tiền cố định
                    </span>
                );
            case 'BUNDLE':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <Layers size={10} /> Combo
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/cart')}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Thanh toán đơn hàng</h1>
                        <p className="text-xs text-gray-500">Kiểm tra thông tin giao hàng, áp dụng voucher và hoàn tất đơn</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Shipping Address, Items, Payment Method) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Delivery Address */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
                                Địa chỉ nhận hàng
                            </h2>
                            <button
                                onClick={() => navigate('/profile')}
                                className="text-xs font-bold text-emerald-600 hover:underline"
                            >
                                Thay đổi
                            </button>
                        </div>

                        {recipientAddress ? (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{recipientAddress.recipient_name}</span>
                                        <span className="text-gray-400">|</span>
                                        <span className="text-gray-600 font-medium">{recipientAddress.phone}</span>
                                    </div>
                                    {shippingDetails.zoneLabel && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                            <Truck size={11} /> {loadingShipping ? 'Đang tính...' : shippingDetails.zoneLabel}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 leading-relaxed">{recipientAddress.address_detail}</p>
                            </div>
                        ) : (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center justify-between">
                                <span>Bạn chưa có địa chỉ nhận hàng mặc định.</span>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="font-bold text-amber-900 underline"
                                >
                                    Thêm địa chỉ ngay
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
                            Kiểm tra kiện hàng ({items.length} sản phẩm)
                        </h2>
                        <div className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <div key={idx} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-16 h-16 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-bold text-gray-900 truncate">{item.title}</h3>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Shop: {item.shopName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.color && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    Màu: {item.color}
                                                </span>
                                            )}
                                            {item.size && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                    Size: {item.size}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-900">
                                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">SL: x{item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">3</span>
                            Phương thức thanh toán
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('payos')}
                                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                                    paymentMethod === 'payos'
                                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Wallet className={paymentMethod === 'payos' ? 'text-emerald-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Chuyển khoản QR (payOS)</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Quét mã VietQR bằng app ngân hàng</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                                    paymentMethod === 'card'
                                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <CreditCard className={paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Thẻ Quốc tế (Visa, Mastercard)</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Cổng VNPay an toàn</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('bank')}
                                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                                    paymentMethod === 'bank'
                                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Landmark className={paymentMethod === 'bank' ? 'text-emerald-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Ngân hàng nội địa (VNPay)</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Thẻ ATM / Internet Banking</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                disabled={codDisabled}
                                onClick={() => !codDisabled && setPaymentMethod('cod')}
                                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition ${
                                    codDisabled
                                        ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200'
                                        : paymentMethod === 'cod'
                                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Truck className={!codDisabled && paymentMethod === 'cod' ? 'text-emerald-600' : 'text-gray-400'} size={20} />
                                <div>
                                    <p className="text-xs font-bold">Thanh toán khi nhận hàng (COD)</p>
                                    {codDisabled && (
                                        <p className="text-[11px] font-normal text-gray-400 mt-0.5">
                                            Không hỗ trợ cho hàng in theo yêu cầu
                                        </p>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column (Coupon & Checkout summary) */}
                <div className="space-y-6">
                    {/* Coupons Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                <Ticket className="text-[#008000]" size={16} />
                                Mã giảm giá / Voucher
                            </h3>
                            <button
                                onClick={handleOpenCouponModal}
                                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                            >
                                Kho voucher <ChevronRight size={14} />
                            </button>
                        </div>

                        {!couponApplied ? (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute inset-y-0 left-3 my-auto text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Nhập mã giảm giá..."
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleApplyCoupon()}
                                        disabled={applyingCoupon || !couponCode.trim()}
                                        className="bg-[#008000] hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all flex-shrink-0 disabled:opacity-50"
                                    >
                                        {applyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                                    </button>
                                </div>

                                <button
                                    onClick={handleOpenCouponModal}
                                    className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between transition"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Ticket size={14} className="text-emerald-600" />
                                        Chọn Voucher Sàn & Shop có sẵn
                                    </span>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-fade-in">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                                {appliedCouponInfo?.coupon?.code || couponCode}
                                            </span>
                                            {appliedCouponInfo?.coupon?.is_platform ? (
                                                <span className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                                                    Voucher Sàn
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-stone-700 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                                    Voucher Shop
                                                </span>
                                            )}
                                            {appliedCouponInfo?.coupon?.applicable_scope === 'SPECIFIC_PRODUCTS' && (
                                                <span className="text-[10px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                                                    SP chỉ định
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-emerald-900 mt-1">
                                            {appliedCouponInfo?.coupon?.title || 'Đã áp dụng mã giảm giá'}
                                        </p>
                                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                            Tiết kiệm: -{discount.toLocaleString('vi-VN')}đ
                                            {appliedCouponInfo?.target === 'SHIPPING' && ' (Trừ vào phí ship)'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleRemoveCoupon}
                                        className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                                    >
                                        Hủy dùng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm">Chi tiết thanh toán</h3>
                        <div className="space-y-2 text-xs text-gray-600 font-medium">
                            <div className="flex justify-between">
                                <span>Tiền hàng</span>
                                <span className="text-gray-950 font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                    <span>Phí vận chuyển</span>
                                    {shippingDetails.zoneLabel && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {loadingShipping ? 'Đang tính...' : shippingDetails.zoneLabel}
                                        </span>
                                    )}
                                </div>
                                <span className="text-gray-950 font-semibold">
                                    {shippingFee === 0 ? (
                                        <span className="text-emerald-600 font-bold">Miễn phí</span>
                                    ) : (
                                        `${shippingFee.toLocaleString('vi-VN')}đ`
                                    )}
                                </span>
                            </div>
                            {couponApplied && discount > 0 && (
                                <div className="flex justify-between items-center text-emerald-600 font-bold animate-fade-in bg-emerald-50/70 border border-emerald-100 px-2.5 py-1.5 rounded-xl">
                                    <span className="flex items-center gap-1.5">
                                        <Ticket size={13} className="text-emerald-600" />
                                        <span>Giảm giá voucher</span>
                                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase">
                                            {appliedCouponInfo?.coupon?.code || couponCode}
                                        </span>
                                        {appliedCouponInfo?.target === 'SHIPPING' && (
                                            <span className="text-[9px] text-sky-700 bg-sky-50 border border-sky-200 px-1 py-0.2 rounded font-medium">
                                                Freeship
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-emerald-700 font-black">
                                        -{discount.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-900">Tổng thanh toán</span>
                            <div className="text-right">
                                <span className="text-xl font-black text-emerald-600">
                                    {finalTotal.toLocaleString('vi-VN')}đ
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">(Đã bao gồm VAT nếu có)</p>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || items.length === 0}
                            className={`w-full bg-[#008000] hover:bg-emerald-700 text-white rounded-full py-3.5 font-bold transition-all text-sm shadow-md active:scale-[0.98] ${
                                loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Đang xử lý đơn...' : 'Xác nhận đặt hàng'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Chọn Voucher Khả Dụng */}
            {showCouponModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8 font-sans">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                            <div>
                                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                                    <Ticket className="text-[#008000]" size={20} />
                                    Kho Voucher VietCraft & Gian Hàng
                                </h3>
                                <p className="text-xs text-stone-500 mt-0.5">Chọn 1 voucher tối ưu nhất cho đơn hàng hiện tại</p>
                            </div>
                            <button
                                onClick={() => setShowCouponModal(false)}
                                className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Input gõ mã ngay trong modal */}
                        <div className="flex gap-2 my-4">
                            <input
                                type="text"
                                placeholder="Nhập mã voucher khác..."
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            />
                            <button
                                onClick={() => handleApplyCoupon()}
                                disabled={applyingCoupon || !couponCode.trim()}
                                className="px-4 py-2 bg-[#008000] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                            >
                                Áp dụng
                            </button>
                        </div>

                        {/* Danh sách voucher */}
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {loadingCoupons ? (
                                <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
                                    <RefreshCw className="animate-spin text-emerald-600" size={20} />
                                    Đang kiểm tra các mã giảm giá khả dụng...
                                </div>
                            ) : availableCoupons.length === 0 ? (
                                <div className="py-10 text-center text-stone-400 text-xs">
                                    Hiện chưa có voucher nào phù hợp cho đơn hàng này.
                                </div>
                            ) : (() => {
                                // Tính toán voucher tốt nhất
                                const currentShopId = items[0]?.shopId || (items[0] as any)?.shop_id;
                                const itemShopIdStr = currentShopId ? String(currentShopId) : '';
                                const isEligible = (c: CouponDTO) => {
                                    if (c.is_eligible === false) return false;
                                    if (c.shop_id && itemShopIdStr) {
                                        const couponShopId = String((c.shop_id as any)?._id || c.shop_id);
                                        if (couponShopId !== itemShopIdStr) return false;
                                    }
                                    return true;
                                };

                                const estimateDiscount = (c: CouponDTO): number => {
                                    if (!isEligible(c)) return -1;
                                    const val = parseVal(c.discount_value);
                                    const eligibleSubtotal = c.applicable_scope === 'SPECIFIC_PRODUCTS'
                                        ? items
                                            .filter(item => (c.applicable_product_ids || []).includes(item.productId))
                                            .reduce((sum, item) => sum + item.price * item.quantity, 0)
                                        : subtotal;
                                    const maxDiscount = parseVal(c.max_discount_amount);
                                    const cap = maxDiscount > 0 ? maxDiscount : Infinity;
                                    const percentDiscount = (percent: number) => Math.min(
                                        Math.round(eligibleSubtotal * percent / 100), cap, eligibleSubtotal
                                    );
                                    if (c.discount_type === 'PERCENTAGE') {
                                        return percentDiscount(val);
                                    }
                                    if (c.discount_type === 'FIXED_AMOUNT') return Math.min(val, eligibleSubtotal);
                                    if (c.discount_type === 'FREE_SHIPPING') return val > 0 ? Math.min(val, shippingFee) : shippingFee;
                                    if (c.discount_type === 'FLASH_SALE' || c.discount_type === 'BUNDLE') {
                                        return val <= 100
                                            ? percentDiscount(val)
                                            : Math.min(val, cap, eligibleSubtotal);
                                    }
                                    return 0;
                                };

                                const eligibleCoupons = availableCoupons.filter(c => isEligible(c) && estimateDiscount(c) > 0);
                                const ineligibleCoupons = availableCoupons.filter(c => !isEligible(c));
                                const eligibleButNoDiscount = availableCoupons.filter(c =>
                                    isEligible(c) && estimateDiscount(c) <= 0
                                );

                                // Sắp xếp eligible theo ước lượng giảm giá cao nhất
                                eligibleCoupons.sort((a, b) => estimateDiscount(b) - estimateDiscount(a));
                                const sortedCoupons = [...eligibleCoupons, ...eligibleButNoDiscount, ...ineligibleCoupons];

                                const bestCoupon = eligibleCoupons.length > 0 ? eligibleCoupons[0] : null;
                                const bestDiscount = bestCoupon ? estimateDiscount(bestCoupon) : 0;

                                return (
                                    <>
                                    {/* Gợi ý voucher tốt nhất */}
                                    {bestCoupon && !couponApplied && (
                                        <button
                                            onClick={() => handleApplyCoupon(bestCoupon.code)}
                                            disabled={applyingCoupon}
                                            className="w-full p-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 border-dashed rounded-2xl flex items-center gap-3 text-left hover:shadow-md transition-all group"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                                <Sparkles size={18} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                                                    <Star size={11} className="text-amber-500 fill-amber-500" />
                                                    Gợi ý tốt nhất
                                                </p>
                                                <p className="text-xs font-bold text-stone-800 truncate">
                                                    {bestCoupon.code} — Tiết kiệm ~{bestDiscount.toLocaleString('vi-VN')}đ
                                                </p>
                                            </div>
                                            <span className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black rounded-xl shadow-sm flex-shrink-0 group-hover:from-amber-600 group-hover:to-orange-600 transition-all">
                                                Dùng ngay
                                            </span>
                                        </button>
                                    )}

                                    {sortedCoupons.map((c) => {
                                    const isSelected = couponApplied && (appliedCouponInfo?.coupon?.code === c.code || couponCode.toUpperCase() === c.code);
                                    const couponIsEligible = isEligible(c) && estimateDiscount(c) > 0;
                                    const isBest = bestCoupon?.id === c.id && couponIsEligible && !couponApplied;

                                    return (
                                        <div
                                            key={c.id}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                isSelected
                                                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                    : !couponIsEligible
                                                    ? 'border-stone-200 bg-stone-50/30 opacity-50 grayscale-[30%] pointer-events-none select-none'
                                                    : isBest
                                                    ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-200/50 hover:border-amber-400'
                                                    : 'border-stone-200 hover:border-emerald-300 bg-white'
                                            }`}
                                        >
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-xs bg-stone-100 text-stone-900 px-2 py-0.5 rounded border border-stone-200">
                                                        {c.code}
                                                    </span>
                                                    {getCouponBadge(c.discount_type)}
                                                    {c.is_platform ? (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${couponIsEligible ? 'text-emerald-700 bg-emerald-50' : 'text-stone-400 bg-stone-100'}`}>
                                                            Sàn VietCraft
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                                                            {c.shop_name}
                                                        </span>
                                                    )}
                                                    {c.applicable_scope === 'SPECIFIC_PRODUCTS' && (
                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                            <Package size={10} /> {c.scope_message || 'SP chỉ định'}
                                                        </span>
                                                    )}
                                                    {isBest && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-300">
                                                            <Star size={9} className="fill-amber-500 text-amber-500" /> Tốt nhất
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-xs font-bold text-stone-900">{c.title}</h4>

                                                <p className={`text-[11px] font-semibold ${couponIsEligible ? 'text-emerald-700' : 'text-stone-400'}`}>
                                                    {c.discount_type === 'PERCENTAGE'
                                                        ? `Giảm ${parseVal(c.discount_value)}%${c.max_discount_amount ? ` (Tối đa ${parseVal(c.max_discount_amount).toLocaleString('vi-VN')}đ)` : ''}`
                                                        : c.discount_type === 'FIXED_AMOUNT'
                                                        ? `Giảm thẳng ${parseVal(c.discount_value).toLocaleString('vi-VN')}đ`
                                                        : c.discount_type === 'FREE_SHIPPING'
                                                        ? `Freeship ${c.discount_value ? `${parseVal(c.discount_value).toLocaleString('vi-VN')}đ` : '100%'}`
                                                        : `Giảm ${parseVal(c.discount_value) <= 100 ? `${parseVal(c.discount_value)}%` : `${parseVal(c.discount_value).toLocaleString('vi-VN')}đ`}`}
                                                </p>

                                                <p className="text-[10px] text-stone-400">
                                                    {parseVal(c.min_order_value) > 0
                                                        ? `Đơn từ ${parseVal(c.min_order_value).toLocaleString('vi-VN')}đ`
                                                        : 'Không giới hạn giá trị đơn'}
                                                    {' • '}HSD: {new Date(c.end_date).toLocaleDateString('vi-VN')}
                                                </p>


                                                {!isEligible && c.min_order_diff && c.min_order_diff > 0 ? (
                                                    <p className="text-[10px] font-semibold text-amber-600">
                                                        Mua thêm {c.min_order_diff.toLocaleString('vi-VN')}đ để sử dụng
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex sm:flex-col items-center justify-end gap-2 sm:self-center flex-shrink-0">
                                                {isSelected ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-xl">
                                                        <Check size={14} /> Đang dùng
                                                    </span>
                                                ) : couponIsEligible ? (
                                                    <button
                                                        onClick={() => handleApplyCoupon(c.code)}
                                                        disabled={applyingCoupon}
                                                        className={`px-4 py-1.5 text-white text-xs font-bold rounded-xl transition shadow-sm ${
                                                            isBest
                                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                                                : 'bg-[#008000] hover:bg-emerald-700'
                                                        }`}
                                                    >
                                                        {isBest ? '⭐ Dùng ngay' : 'Dùng ngay'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-xl cursor-not-allowed">
                                                        {c.shop_id && items[0]?.shopId && c.shop_id !== items[0].shopId
                                                            ? 'Không áp dụng cho shop này'
                                                            : c.scope_message || (c.is_eligible !== false && estimateDiscount(c) <= 0
                                                                ? 'Không có ưu đãi'
                                                                : 'Không đủ ĐK')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                    })}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[9999] bg-white border border-gray-150 shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm border-l-4 ${toast.type === 'success' ? 'border-l-emerald-500' : 'border-l-red-500'} transform translate-y-0 transition-all duration-300`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
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
