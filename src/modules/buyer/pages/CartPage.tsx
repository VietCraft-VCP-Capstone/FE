import React, { useEffect, useState } from 'react';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, CreditCard, AlertCircle, Trash2, Tag, Sparkles } from 'lucide-react';
import { CartItemRow, CartItem } from '../../../shared/components/CartItemRow';
import { cartService } from '../../order/services/cartService';
import { LandingHeader } from '../../landing/components/LandingHeader';
import { LandingFooter } from '../../landing/components/LandingFooter';
import { useAuth } from '../../auth/hooks/useAuth';

interface CartPageProps {
  onBackToShop?: () => void;
  onCheckout?: (cartItems: CartItem[], totalAmount: number) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onBackToShop,
  onCheckout,
}) => {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [emailSubscription, setEmailSubscription] = useState('');

  const fetchCartData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await cartService.getCart();
      if (data && Array.isArray(data.items)) {
        const mapped: CartItem[] = data.items.map((i: any) => ({
          id: i._id || i.product_id?._id || Math.random().toString(),
          productId: i.product_id?._id || i.product_id || 'prod_unknown',
          title: i.product_id?.title || 'Sản phẩm thủ công VietCraft',
          price: i.product_id?.retail_price || 250000,
          imageUrl: i.product_id?.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300',
          variant: { color: i.variant_id?.color, size: i.variant_id?.size },
          customNotes: i.custom_notes,
          quantity: i.quantity || 1,
          isSelected: i.is_selected !== undefined ? i.is_selected : true,
          shopName: 'VietCraft Artisan'
        }));
        setItems(mapped);
      }
    } catch (err: any) {
      console.warn('Backend cart API error:', err.message);
      setErrorMsg('Không thể kết nối đến máy chủ MongoDB. Vui lòng kiểm tra lại dịch vụ Backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, []);

  const handleUpdateQuantity = async (id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
    try {
      await cartService.updateQuantity(id, newQty);
    } catch (e) {
      console.error('Failed to sync quantity to DB');
    }
  };

  const handleToggleSelect = async (id: string, isSelected: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSelected } : item))
    );
    try {
      await cartService.toggleSelect(id, isSelected);
    } catch (e) {
      console.error('Failed to sync selection to DB');
    }
  };

  const handleToggleSelectAll = async (checked: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, isSelected: checked })));
    for (const item of items) {
      try {
        await cartService.toggleSelect(item.id, checked);
      } catch (e) {}
    }
  };

  const handleRemoveItem = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await cartService.removeItem(id);
    } catch (e) {
      console.error('Failed to delete item from DB');
    }
  };

  const handleClearSelected = async () => {
    const selectedIds = items.filter((i) => i.isSelected).map((i) => i.id);
    setItems((prev) => prev.filter((item) => !item.isSelected));
    for (const id of selectedIds) {
      try {
        await cartService.removeItem(id);
      } catch (e) {}
    }
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    if (voucherCode.toUpperCase() === 'VIETCRAFT50') {
      setAppliedVoucher({ code: 'VIETCRAFT50', discount: 50000 });
      alert('Áp dụng mã giảm giá VIETCRAFT50 thành công (-50.000₫)!');
    } else {
      setAppliedVoucher({ code: voucherCode.toUpperCase(), discount: 30000 });
      alert(`Đã áp dụng mã ${voucherCode.toUpperCase()} (-30.000₫)!`);
    }
  };

  const selectedItems = items.filter((i) => i.isSelected !== false);
  const allSelected = items.length > 0 && items.every((i) => i.isSelected);

  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingFee = subtotal > 0 ? 30000 : 0;
  const voucherDiscount = appliedVoucher ? appliedVoucher.discount : 0;
  const total = Math.max(0, subtotal + shippingFee - voucherDiscount);

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans text-gray-900">
      {/* Header Navigation */}
      <LandingHeader
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogin={() => {}}
        onLogout={logout}
        onSignup={() => {}}
        onHome={() => (window.location.href = '/')}
        onDashboard={() => (window.location.href = '/')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Navigation Back & Title */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <button
            onClick={() => (onBackToShop ? onBackToShop() : (window.location.href = '/'))}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} /> Tiếp tục mua sắm
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-emerald-700" size={24} /> Giỏ Hàng Của Bạn ({items.length})
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
            <div className="lg:col-span-7 flex flex-col gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-28 bg-gray-100 rounded-3xl"></div>
              ))}
            </div>
            <div className="lg:col-span-5 h-80 bg-gray-100 rounded-3xl"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto my-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
              <ShoppingBag size={36} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Giỏ hàng của bạn đang trống</h3>
            <p className="text-xs text-gray-500 mt-1.5 mb-6 leading-relaxed">
              Hãy chọn các sản phẩm thủ công nghệ thuật độc đáo để thêm vào giỏ hàng.
            </p>
            <button
              onClick={() => (onBackToShop ? onBackToShop() : (window.location.href = '/'))}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3 text-sm shadow-md transition-all active:scale-95"
            >
              <Sparkles size={16} /> Khám phá sản phẩm ngay
            </button>
          </div>
        ) : (
          /* 7-to-5 Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7/12) - Cart Items List */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Select All Bar */}
              <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 border-gray-300 rounded focus:ring-emerald-700 cursor-pointer accent-emerald-700"
                  />
                  <span>Chọn tất cả ({selectedItems.length}/{items.length})</span>
                </label>

                {selectedItems.length > 0 && (
                  <button
                    onClick={handleClearSelected}
                    className="text-gray-400 hover:text-rose-600 inline-flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 size={14} /> Xóa mục đã chọn
                  </button>
                )}
              </div>

              {/* Items List */}
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleSelect={handleToggleSelect}
                  onRemoveItem={handleRemoveItem}
                />
              ))}

              {/* Assurance Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-800 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-700 flex-shrink-0" />
                  <span>Bảo đảm chất lượng thủ công</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-emerald-700 flex-shrink-0" />
                  <span>Giao hàng toàn quốc</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-700 flex-shrink-0" />
                  <span>Thanh toán VNPAY / MOMO</span>
                </div>
              </div>
            </div>

            {/* Right Column (5/12) - Order Summary Card (Sticky) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
                Tóm Tắt Đơn Hàng
              </h3>

              {/* Voucher Code Form */}
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Mã giảm giá (VD: VIETCRAFT50)..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full rounded-full border border-gray-300 px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all uppercase"
                  />
                  <Tag size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-5 py-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  Áp dụng
                </button>
              </form>

              {/* Price Breakdown */}
              <div className="flex flex-col gap-3 text-xs text-gray-600 border-b border-gray-100 pb-4">
                <div className="flex justify-between">
                  <span>Tạm tính ({selectedItems.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
                  <span className="font-semibold text-gray-900">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển dự kiến</span>
                  <span className="font-semibold text-gray-900">{shippingFee.toLocaleString('vi-VN')}₫</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Mã giảm giá ({appliedVoucher?.code})</span>
                    <span>-{voucherDiscount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
              </div>

              {/* Total Price */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-base font-bold text-gray-900">Tổng thanh toán</span>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-700">
                    {total.toLocaleString('vi-VN')}₫
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Đã bao gồm VAT & Phí vận chuyển</p>
                </div>
              </div>

              {/* Checkout Pill Button */}
              <button
                disabled={selectedItems.length === 0}
                onClick={() => onCheckout && onCheckout(selectedItems, total)}
                className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 px-6 shadow-lg shadow-emerald-200 transition-all active:scale-95 text-center cursor-pointer"
              >
                Tiến Hành Thanh Toán ({selectedItems.length})
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <LandingFooter
        emailSubscription={emailSubscription}
        setEmailSubscription={setEmailSubscription}
        onSubscribe={(e) => { e.preventDefault(); alert('Cảm ơn bạn đã đăng ký!'); }}
      />
    </div>
  );
};
