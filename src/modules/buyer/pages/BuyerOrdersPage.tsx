import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Store, ShoppingBag, Eye, RefreshCw, Star, Truck, Check } from 'lucide-react';
import { ordersService } from '../../order/services/ordersService';
import ReorderModal from '../components/profile/ReorderModal';

interface OrderItem {
    productId: string;
    variantId: string;
    quantity: number;
    price: number;
    title?: string;
    color?: string;
    size?: string;
    image?: string;
}

interface Order {
    id: string;
    shopName: string;
    shopLogo: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled';
    createdAt: string;
}

export function BuyerOrdersPage() {
    const navigate = useNavigate();
    const { setCartCount } = useOutletContext<{ setCartCount: (n: number) => void }>();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'shipping' | 'completed' | 'cancelled'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [reorderOrder, setReorderOrder] = useState<Order | null>(null);

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
        { id: 'cancelled', label: 'Đã hủy' }
    ] as const;

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // Fetch orders from BE with active tab status
                const res = await ordersService.getByUser(activeTab);
                setOrders(res);
            } catch (err) {
                console.error('Failed to fetch orders', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [activeTab]);

    const getStatusBadge = (status: Order['status']) => {
        switch (status) {
            case 'pending':
                return <span className="bg-amber-50 text-amber-700 font-bold border border-amber-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">CHỜ XÁC NHẬN</span>;
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

    const handleConfirmReorder = (selectedItems: OrderItem[]) => {
        if (!reorderOrder) return;
        const cartStr = localStorage.getItem('vietcraft_cart');
        let cartItems = [];
        if (cartStr) {
            try {
                cartItems = JSON.parse(cartStr);
            } catch (e) {}
        }

        selectedItems.forEach(it => {
            const existing = cartItems.find((item: any) => item.productId === it.productId && item.variantId === it.variantId);
            if (existing) {
                existing.quantity += it.quantity;
            } else {
                cartItems.push({
                    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    productId: it.productId,
                    variantId: it.variantId,
                    title: it.title || 'Sản phẩm tái đặt',
                    shopName: reorderOrder.shopName,
                    variantName: `${it.color || ''} ${it.size || ''}`.trim() || 'Mặc định',
                    price: it.price,
                    quantity: it.quantity,
                    image: it.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200',
                    checked: true
                });
            }
        });

        localStorage.setItem('vietcraft_cart', JSON.stringify(cartItems));
        setCartCount(cartItems.reduce((acc: number, it: any) => acc + it.quantity, 0));
        setReorderOrder(null);
        showToast('Đã thêm sản phẩm vào giỏ hàng!');
        setTimeout(() => navigate('/cart'), 1200);
    };

    // Filter orders locally by search query as well
    const filteredOrders = orders.filter(o => {
        const query = searchQuery.toLowerCase();
        const matchesShop = o.shopName?.toLowerCase().includes(query);
        const matchesId = o.id?.toLowerCase().includes(query);
        const matchesItem = o.items.some(it => it.title?.toLowerCase().includes(query));
        return matchesShop || matchesId || matchesItem;
    });

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
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-3 md:pb-4 font-semibold text-xs whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
                                    isActive ? 'text-emerald-600 border-emerald-600' : 'text-gray-500 border-transparent hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Search box */}
                <div className="relative w-full md:w-80 md:mb-3">
                    <Search className="absolute inset-y-0 left-3 my-auto text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên Shop, ID Đơn hàng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    />
                </div>
            </div>

            {/* Order cards list */}
            {loading ? (
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
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {/* Card Header (Shop, Status) */}
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                                <div className="flex items-center gap-2">
                                    <Store size={16} className="text-gray-500" />
                                    <span className="font-extrabold text-sm text-gray-800">{order.shopName}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-gray-400">Mã đơn: #{order.id}</span>
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>

                            {/* Card Items list */}
                            <div className="p-4 divide-y divide-gray-50">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-1">{item.title}</h4>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Phân loại: {`${item.color || ''} ${item.size || ''}`.trim() || 'Mặc định'}
                                            </p>
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

                            {/* Card Footer (Actions, Total) */}
                            <div className="p-4 bg-gray-50/10 border-t border-gray-50 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs text-gray-500 font-bold">Tổng số tiền:</span>
                                    <span className="font-black text-emerald-600 text-base ml-1.5">
                                        {order.totalAmount.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                        className="border border-gray-200 hover:bg-gray-50 font-bold text-xs text-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                        <Eye size={14} />
                                        <span>Xem chi tiết</span>
                                    </button>

                                    {order.status === 'shipping' && (
                                        <button
                                            onClick={() => navigate(`/orders/${order.id}`)}
                                            className="bg-[#008000] hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                        >
                                            <Truck size={14} />
                                            <span>Theo dõi hành trình</span>
                                        </button>
                                    )}

                                    {order.status === 'completed' && (
                                        <>
                                            <button className="border border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                                                <Star size={14} />
                                                <span>Đánh giá</span>
                                            </button>
                                            <button
                                                onClick={() => handleReorder(order)}
                                                className="bg-[#008000] hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                            >
                                                <RefreshCw size={14} />
                                                <span>Mua lại</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
