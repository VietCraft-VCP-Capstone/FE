import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Trash2, Plus, Minus, Sparkles, Check } from 'lucide-react';
import { productsService } from '../../product/services/productsService';

interface CartItem {
    id: string;
    productId: string;
    variantId: string;
    title: string;
    shopName: string;
    variantName: string;
    price: number;
    quantity: number;
    image: string;
    checked: boolean;
}

export function BuyerCartPage() {
    const navigate = useNavigate();
    const { setCartCount } = useOutletContext<{ setCartCount: (n: number) => void }>();

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    useEffect(() => {
        const stored = localStorage.getItem('vietcraft_cart');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.length > 0) {
                    setCartItems(parsed);
                }
            } catch (e) {}
        }

        const fetchRecs = async () => {
            try {
                const list = await productsService.getAll();
                const mapped = (list || []).slice(0, 4).map((p: any) => ({
                    id: p._id || p.id,
                    title: p.title || p.name || 'Sản phẩm VietCraft',
                    price: p.variants?.[0]?.retail_price ? Number(p.variants[0].retail_price.toString()) : 150000,
                    image: p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300'
                }));
                setRecommendations(mapped);
            } catch (err) {
                console.error('Failed to load cross-sell recommendations', err);
            }
        };
        fetchRecs();
    }, []);

    // Save cart and update header count
    const saveCart = (items: CartItem[]) => {
        setCartItems(items);
        localStorage.setItem('vietcraft_cart', JSON.stringify(items));
        const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);
        setCartCount(totalQty);
    };

    const handleQtyChange = (id: string, delta: number) => {
        const updated = cartItems.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        });
        saveCart(updated);
    };

    const handleToggleCheck = (id: string) => {
        const updated = cartItems.map(item => {
            if (item.id === id) {
                return { ...item, checked: !item.checked };
            }
            return item;
        });
        saveCart(updated);
    };

    const handleToggleAll = () => {
        const allChecked = cartItems.every(item => item.checked);
        const updated = cartItems.map(item => ({ ...item, checked: !allChecked }));
        saveCart(updated);
    };

    const handleDeleteItem = (id: string) => {
        const updated = cartItems.filter(item => item.id !== id);
        saveCart(updated);
    };

    const handleAddRecommendation = (rec: any) => {
        // Add to cart
        const existing = cartItems.find(item => item.productId === rec.id);
        let updated;
        if (existing) {
            updated = cartItems.map(item =>
                item.productId === rec.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            const newItem: CartItem = {
                id: `item_${Date.now()}`,
                productId: rec.id,
                variantId: `var_${rec.id}`,
                title: rec.title,
                shopName: 'VietCraft Selection',
                variantName: 'Mặc định',
                price: rec.price,
                quantity: 1,
                image: rec.image,
                checked: true
            };
            updated = [...cartItems, newItem];
        }
        saveCart(updated);
    };

    // Calculate totals
    const checkedItems = cartItems.filter(item => item.checked);
    const totalSelectedQty = checkedItems.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = checkedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const allChecked = cartItems.length > 0 && cartItems.every(item => item.checked);

    const handleCheckout = () => {
        if (checkedItems.length === 0) {
            showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'error');
            return;
        }
        // Store selected items for checkout
        localStorage.setItem('vietcraft_checkout', JSON.stringify(checkedItems));
        navigate('/checkout');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Giỏ hàng của bạn</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-3 space-y-4">
                    {cartItems.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                            <p className="text-gray-500 mb-4">Giỏ hàng của bạn đang trống.</p>
                            <button
                                onClick={() => navigate('/')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 py-2 text-sm font-semibold transition-colors"
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                                {/* Left Checkbox and Product Details */}
                                <div className="flex items-center gap-4 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleToggleCheck(item.id)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-gray-900 leading-snug line-clamp-1">{item.title}</h3>
                                        <p className="text-xs text-gray-500">Cửa hàng: <span className="font-medium text-gray-700">{item.shopName}</span></p>
                                        <p className="text-xs text-gray-400">Phân loại: {item.variantName}</p>
                                    </div>
                                </div>

                                {/* Right Side: Price, Qty and Delete */}
                                <div className="flex items-center gap-8 pr-2">
                                    <div className="text-right">
                                        <span className="font-extrabold text-gray-900 text-lg">
                                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>

                                    {/* Qty controller */}
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                        <button
                                            onClick={() => handleQtyChange(item.id, -1)}
                                            className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="px-3 text-sm font-semibold text-gray-700 select-none">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => handleQtyChange(item.id, 1)}
                                            className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                                        title="Xóa sản phẩm"
                                    >
                                        <Trash2 size={14} />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Recommendations Section */}
                <div className="lg:col-span-3 mt-8">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Gợi ý mua kèm</h2>
                        <Sparkles size={18} className="text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {recommendations.map((rec) => (
                            <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                                <div className="space-y-2">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                        <img src={rec.image} alt={rec.title} className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
                                        {rec.title}
                                    </h4>
                                    <p className="text-sm font-extrabold text-emerald-600">
                                        {rec.price.toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleAddRecommendation(rec)}
                                    className="mt-3 w-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-full py-1 text-xs font-bold transition-all"
                                >
                                    Thêm vào giỏ
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom sticky bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] py-4 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                        {/* Select All */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="selectAll"
                                checked={allChecked}
                                onChange={handleToggleAll}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="selectAll" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                                Chọn tất cả ({cartItems.length})
                            </label>
                        </div>

                        {/* Summary details */}
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="text-sm text-gray-500 font-medium">Tổng thanh toán ({totalSelectedQty} sản phẩm):</span>
                                <span className="text-xl font-black text-[#10b981] ml-2">
                                    {totalPrice.toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="bg-[#008000] hover:bg-emerald-700 text-white rounded-full py-2.5 px-10 font-bold transition-all shadow-md active:scale-95 text-sm"
                            >
                                Mua Hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[9999] bg-white border border-gray-150 shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm border-l-4 ${toast.type === 'success' ? 'border-l-emerald-500' : 'border-l-red-500'} transform translate-y-0 transition-all duration-300`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-655'}`}>
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
export default BuyerCartPage;
