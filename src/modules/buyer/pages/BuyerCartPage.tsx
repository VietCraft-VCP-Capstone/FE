import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, Sparkles, Check, ArrowLeft } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import { cartService } from '../../order/services/cartService';
import api, { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

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
    productType?: string;
}

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
export const DEFAULT_PRODUCT_IMG = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300';

const absImg = (u: any): string => {
    if (!u || typeof u !== 'string') return '';
    const trimmed = u.trim();
    if (!trimmed || trimmed.startsWith('#')) return ''; // Ignore hex color codes stored in mockup_image
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('/')) return ORIGIN + trimmed;
    return trimmed;
};

const resolveCartItemImage = (variant: any, prod: any): string => {
    const vImg = absImg(variant?.mockup_image || variant?.mockupImage || variant?.image);
    if (vImg) return vImg;

    const pImgs = Array.isArray(prod?.images) ? prod.images : [];
    for (const img of pImgs) {
        const resolved = absImg(img);
        if (resolved) return resolved;
    }

    const thumb = absImg(prod?.thumbnail || prod?.image);
    if (thumb) return thumb;

    return DEFAULT_PRODUCT_IMG;
};

const parseMongooseDecimal = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof val === 'object') {
        if ('$numberDecimal' in val) {
            return parseFloat(val.$numberDecimal) || 0;
        }
        if ('value' in val) {
            return parseFloat(val.value) || 0;
        }
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};

const mapBackendCart = (cartData: any): CartItem[] => {
    if (!cartData || !Array.isArray(cartData.items)) {
        return [];
    }
    return cartData.items.map((item: any) => {
        const prod = item.product_id || {};
        const variant = item.variant_id || {};
        
        const shopName = prod.shop_id?.shop_name || 'VietCraft Selection';
        
        let variantName = '';
        if (variant.color || variant.size || variant.material) {
            variantName = [variant.color, variant.size, variant.material].filter(Boolean).join(' - ');
        } else if (variant.name) {
            variantName = variant.name;
        } else if (item.color || item.size) {
            variantName = [item.color, item.size].filter(Boolean).join(' - ');
        }
        if (!variantName) {
            variantName = 'Tiêu chuẩn';
        }

        let price = 0;
        if (variant.retail_price !== undefined && variant.retail_price !== null) {
            price = parseMongooseDecimal(variant.retail_price);
        } else if (variant.price !== undefined && variant.price !== null) {
            price = parseMongooseDecimal(variant.price);
        } else if (prod.retail_price !== undefined && prod.retail_price !== null) {
            price = parseMongooseDecimal(prod.retail_price);
        } else if (prod.price !== undefined && prod.price !== null) {
            price = parseMongooseDecimal(prod.price);
        } else if (item.price !== undefined && item.price !== null) {
            price = parseMongooseDecimal(item.price);
        } else if (Array.isArray(prod.variants) && prod.variants.length > 0) {
            const firstV = prod.variants[0];
            price = parseMongooseDecimal(firstV?.retail_price ?? firstV?.price ?? 0);
        }

        const image = resolveCartItemImage(variant, prod);

        return {
            id: item._id, // Cart item DB MongoDB ObjectId
            productId: prod._id || prod.id || '',
            variantId: variant._id || variant.id || '',
            title: prod.title || 'Sản phẩm VietCraft',
            shopName,
            variantName,
            price,
            quantity: item.quantity || 1,
            image,
            checked: item.is_selected !== undefined ? item.is_selected : true,
            productType: prod.product_type
        };
    });
};

export function BuyerCartPage() {
    const navigate = useNavigate();

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
        const syncAndFetchCart = async () => {
            try {
                const migrationFailures = await cartService.migrateLegacyCart();
                if (migrationFailures.length > 0) {
                    showToast(migrationFailures[0], 'error');
                }

                const cartData = await cartService.getCart();
                setCartItems(mapBackendCart(cartData));
            } catch (err) {
                showToast(getApiErrorMessage(err, 'Không tải được giỏ hàng'), 'error');
            }
        };

        syncAndFetchCart();

        const fetchRecs = async () => {
            try {
                const res = await productsService.getAll();
                const list = Array.isArray(res) ? res : ((res as any)?.items || []);
                const mapped = list.slice(0, 4).map((p: any) => ({
                    id: p._id || p.id,
                    title: p.title || p.name || 'Sản phẩm VietCraft',
                    price: p.variants?.[0]?.retail_price 
                        ? parseMongooseDecimal(p.variants[0].retail_price) 
                        : (p.price || 0),
                    image: p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300'
                }));
                setRecommendations(mapped);
            } catch (err) {
                console.error('Failed to load cross-sell recommendations', err);
            }
        };
        fetchRecs();
    }, []);

    const handleQtyChange = async (id: string, delta: number) => {
        const item = cartItems.find((it: CartItem) => it.id === id);
        if (!item) return;
        const newQty = Math.max(1, item.quantity + delta);
        try {
            const updated = await cartService.updateQuantity(id, newQty);
            setCartItems(mapBackendCart(updated));
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thể cập nhật số lượng'), 'error');
        }
    };

    const handleToggleCheck = async (id: string) => {
        const item = cartItems.find((it: CartItem) => it.id === id);
        if (!item) return;
        try {
            const updated = await cartService.toggleSelect(id, !item.checked);
            setCartItems(mapBackendCart(updated));
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thể cập nhật trạng thái chọn'), 'error');
        }
    };

    const handleToggleAll = async () => {
        const allChecked = cartItems.every((item: CartItem) => item.checked);
        try {
            const promises = cartItems.map((item: CartItem) => cartService.toggleSelect(item.id, !allChecked));
            const results = await Promise.all(promises);
            if (results.length > 0) {
                setCartItems(mapBackendCart(results[results.length - 1]));
            }
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thể cập nhật trạng thái chọn tất cả'), 'error');
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            const updated = await cartService.removeItem(id);
            setCartItems(mapBackendCart(updated));
            showToast('Đã xóa sản phẩm khỏi giỏ hàng');
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thể xóa sản phẩm'), 'error');
        }
    };

    const handleAddRecommendation = async (rec: any) => {
        try {
            const updated = await cartService.addToCart({
                productId: rec.id,
                quantity: 1
            });
            setCartItems(mapBackendCart(updated));
            showToast(`Đã thêm "${rec.title}" vào giỏ hàng!`);
        } catch (err) {
            showToast(getApiErrorMessage(err, 'Không thể thêm sản phẩm gợi ý'), 'error');
        }
    };

    const checkedItems = cartItems.filter((item: CartItem) => item.checked);
    const totalSelectedQty = checkedItems.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
    const totalPrice = checkedItems.reduce((acc: number, item: CartItem) => acc + (item.price * item.quantity), 0);
    const allChecked = cartItems.length > 0 && cartItems.every((item: CartItem) => item.checked);

    const handleCheckout = () => {
        if (checkedItems.length === 0) {
            showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'error');
            return;
        }
        localStorage.setItem('vietcraft_checkout', JSON.stringify(checkedItems));
        navigate('/checkout');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
            {/* Nút quay lại mua sắm */}
            <div className="mb-4">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#15803d] transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
                </button>
            </div>

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
                        cartItems.map((item: CartItem) => (
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
                                        <img 
                                            src={item.image} 
                                            alt={item.title} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMG;
                                            }}
                                        />
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
                        {recommendations.map((rec: any) => (
                            <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                                <div className="space-y-2">
                                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                        <img 
                                            src={rec.image} 
                                            alt={rec.title} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMG;
                                            }}
                                        />
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

            {/* Bottom bar */}
            {cartItems.length > 0 && (
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] py-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-8">
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {toast.type === 'success' ? <Check size={18} /> : <span>⚠️</span>}
                    </div>
                    <p className="text-xs font-extrabold text-gray-900">{toast.message}</p>
                </div>
            )}
        </div>
    );
}

export default BuyerCartPage;
