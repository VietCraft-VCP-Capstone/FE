import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, FolderHeart, UserCheck, MapPin,
    CreditCard, Settings, LogOut, ChevronRight, Check,
    Package, Truck, Home, Plus, Trash2, Edit2, Camera, Loader2
} from 'lucide-react';
import { userService, UserProfile, Address } from '../../user/services/userService';
import { ordersService } from '../../order/services/ordersService';
import { productsService } from '../../product/services/productsService';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { AddressFormModal } from '../components/profile/AddressFormModal';
import { ConfirmDeleteModal } from '../components/profile/ConfirmDeleteModal';
import { ToastNotification } from '../components/profile/ToastNotification';
const getFullAddressText = (addr: Address) => {
    return addr.address_detail;
};

interface BuyerProfilePageProps {
    onLogout: () => void;
}

export function BuyerProfilePage({ onLogout }: BuyerProfilePageProps) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Toast and Confirm State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    // Modal Visibility States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const [activeTab, setActiveTab] = useState<'overview' | 'addresses'>('overview');
    const [savedProducts, setSavedProducts] = useState<any[]>([]);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('Kích thước ảnh không được vượt quá 5MB.', 'error');
            return;
        }

        setUploadingAvatar(true);

        try {
            let uploadedUrl = '';
            const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;
            const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET;

            if (cloudName && uploadPreset) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);

                try {
                    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                        method: 'POST',
                        body: formData
                    });

                    if (response.ok) {
                        const data = await response.json();
                        uploadedUrl = data.secure_url;
                    } else {
                        console.warn('Cloudinary upload failed, falling back to Base64');
                    }
                } catch (err) {
                    console.warn('Cloudinary upload request failed, falling back to Base64', err);
                }
            }

            if (!uploadedUrl) {
                uploadedUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            const updated = await userService.updateProfile({
                avatar: uploadedUrl
            });

            setProfile((prev: UserProfile | null) => 
                prev ? { ...prev, avatar: updated.avatar } : null
            );
            showToast('Cập nhật ảnh đại diện thành công!', 'success');
        } catch (error) {
            console.error('Failed to upload avatar', error);
            showToast('Tải ảnh đại diện lên thất bại.', 'error');
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch profile
                const prof = await userService.getProfile();
                setProfile(prof);

                // Fetch latest order
                const orders = await ordersService.getByUser();
                if (orders && orders.length > 0) {
                    setLastOrder(orders[0]);
                }

                // Fetch real products for saved products section
                try {
                    const res = await productsService.getAll();
                    const list = Array.isArray(res) ? res : ((res as any)?.items || []);
                    const mapped = list.slice(0, 3).map((p: any) => ({
                        title: p.title || p.name || 'Sản phẩm sáng tạo',
                        image: p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150'
                    }));
                    setSavedProducts(mapped);
                } catch (prodErr) {
                    console.error('Failed to load real products for profile page', prodErr);
                }
            } catch (err) {
                console.error('Failed to load profile data', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleUpdateProfile = async (name: string, phone: string) => {
        if (!profile) return;
        try {
            const updated = await userService.updateProfile({
                full_name: name,
                phone: phone
            });
            setProfile((prev: UserProfile | null) => prev ? { ...prev, full_name: updated.full_name, phone: updated.phone } : null);
            showToast('Cập nhật hồ sơ thành công!', 'success');
        } catch (e) {
            showToast('Cập nhật hồ sơ thất bại.', 'error');
            throw e;
        }
    };

    const handleSaveAddress = async (addrData: Partial<Address>) => {
        if (!profile) return;
        try {
            let updatedAddresses: Address[];
            if (editingAddress?._id) {
                updatedAddresses = await userService.updateAddress(editingAddress._id, addrData);
                showToast('Cập nhật địa chỉ thành công!', 'success');
            } else {
                updatedAddresses = await userService.addAddress(addrData);
                showToast('Thêm địa chỉ thành công!', 'success');
            }
            setProfile({ ...profile, addresses: updatedAddresses });
            setIsAddressModalOpen(false);
            setEditingAddress(null);
        } catch (e) {
            showToast('Lưu địa chỉ thất bại.', 'error');
            throw e;
        }
    };

    const handleSetDefaultAddress = async (addr: Address) => {
        if (!profile || !addr._id) return;
        try {
            const updatedAddresses = await userService.updateAddress(addr._id, { ...addr, is_default: true });
            setProfile({ ...profile, addresses: updatedAddresses });
            showToast('Đặt làm mặc định thành công!', 'success');
        } catch (e) {
            showToast('Đặt làm mặc định thất bại.', 'error');
        }
    };

    const openAddressModal = (addr: Address | null = null) => {
        setEditingAddress(addr);
        setIsAddressModalOpen(true);
    };

    if (loading || !profile) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <p className="text-gray-500 font-semibold">Đang tải thông tin cá nhân...</p>
            </div>
        );
    }

    // Stepper mapping helper
    const getStepStatus = (status: string) => {
        const steps = ['ordered', 'paid', 'processing', 'shipping', 'completed'];
        const currentIdx = steps.indexOf(status?.toLowerCase());
        return (step: string) => {
            const stepIdx = steps.indexOf(step);
            if (stepIdx < currentIdx) return 'completed';
            if (stepIdx === currentIdx) return 'active';
            return 'pending';
        };
    };

    const checkStep = lastOrder ? getStepStatus(lastOrder.status) : () => 'pending';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Profile Banner Card - Always Visible */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 flex-shrink-0 cursor-pointer">
                    <img 
                        src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'} 
                        alt={profile.full_name} 
                        className="w-full h-full object-cover transition-all group-hover:scale-105" 
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera size={20} className="text-white mb-1" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Thay đổi</span>
                    </div>
                    {/* Loading Overlay */}
                    {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                    )}
                    {/* Hidden File Input */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        disabled={uploadingAvatar}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        title="Thay đổi ảnh đại diện"
                    />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h1 className="text-2xl font-black text-gray-900">{profile.full_name}</h1>
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-100 mx-auto md:mx-0 w-fit">
                            <UserCheck size={12} />
                            <span>{profile.rank || 'Thành viên Bạc'}</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    {profile.phone && <p className="text-xs text-gray-400">SĐT: {profile.phone}</p>}
                </div>
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-[#008000] hover:bg-emerald-700 text-white rounded-full py-2 px-6 text-sm font-bold transition-all shadow-sm active:scale-95 flex-shrink-0"
                >
                    Chỉnh sửa hồ sơ
                </button>
            </div>

            {/* Main Layout Grid - Always Visible */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Activities & Menu options) */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm">Hoạt động</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors" onClick={() => navigate('/orders')}>
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                                    <ShoppingBag size={18} />
                                </div>
                                <span className="block font-black text-gray-900 text-lg">{profile.stats?.ordersCount || 12}</span>
                                <span className="text-[10px] text-gray-500 font-bold">Đơn hàng</span>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                                    <FolderHeart size={18} />
                                </div>
                                <span className="block font-black text-gray-900 text-lg">{profile.stats?.collectionsCount || 5}</span>
                                <span className="text-[10px] text-gray-500 font-bold">Bộ sưu tập</span>
                            </div>
                        </div>
                        <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors mt-2">
                            <span className="flex items-center gap-1">
                                <span>👁️</span> {profile.stats?.followingCount || 24} Đang theo dõi
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Menu links */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            <li>
                                <button 
                                    onClick={() => setActiveTab(activeTab === 'addresses' ? 'overview' : 'addresses')} 
                                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 text-sm font-semibold transition-colors ${activeTab === 'addresses' ? 'text-emerald-700 bg-emerald-50/40' : 'text-gray-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin size={18} className={activeTab === 'addresses' ? 'text-emerald-600' : 'text-gray-400'} />
                                        <span>Số địa chỉ nhận hàng</span>
                                    </div>
                                    <ChevronRight size={16} className={activeTab === 'addresses' ? 'text-emerald-600' : 'text-gray-400'} />
                                </button>
                            </li>
                            <li>
                                <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={18} className="text-gray-400" />
                                        <span>Phương thức thanh toán</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400" />
                                </button>
                            </li>
                            <li>
                                <button onClick={() => setIsEditModalOpen(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Settings size={18} className="text-gray-400" />
                                        <span>Cài đặt tài khoản</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400" />
                                </button>
                            </li>
                            <li>
                                <button onClick={onLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-sm font-semibold text-red-600 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <LogOut size={18} className="text-red-500" />
                                        <span>Đăng xuất</span>
                                    </div>
                                    <ChevronRight size={16} className="text-red-400" />
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Earn Money Promo */}
                    <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-white">
                            <ShoppingBag size={120} />
                        </div>
                        <h3 className="font-extrabold text-base flex items-center gap-1.5">
                            <span className="text-lg">🏪</span> Kiếm tiền từ sáng tạo của bạn
                        </h3>
                        <p className="text-xs text-emerald-100/80 leading-relaxed font-medium">
                            Mở gian hàng trên VietCraft để chia sẻ sản phẩm độc đáo của bạn.
                        </p>
                        <button
                            onClick={() => navigate('/seller/register')}
                            className="w-full bg-[#008000] hover:bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm"
                        >
                            Đăng ký ngay
                        </button>
                    </div>
                </div>

                {/* Right Column (Conditional Content) */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'overview' ? (
                        <>
                            {/* Latest Order Stepper Tracker */}
                            {lastOrder && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 text-sm">Đơn hàng gần nhất</h3>
                                        <button onClick={() => navigate('/orders')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                                            Xem tất cả
                                        </button>
                                    </div>

                                    {/* Stepper Progress Bar */}
                                    <div className="relative flex justify-between items-center max-w-md mx-auto py-2">
                                        {/* Connector line */}
                                        <div className="absolute left-4 right-4 h-0.5 bg-gray-200 top-1/2 -translate-y-1/2 z-0">
                                            <div
                                                className="h-full bg-emerald-600 transition-all duration-500"
                                                style={{
                                                    width:
                                                        lastOrder.status === 'completed'
                                                            ? '100%'
                                                            : lastOrder.status === 'shipping'
                                                                ? '75%'
                                                                : lastOrder.status === 'processing'
                                                                    ? '50%'
                                                                    : lastOrder.status === 'paid'
                                                                        ? '25%'
                                                                        : '0%'
                                                }}
                                            />
                                        </div>

                                        {/* Step 1: Ordered */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${checkStep('ordered') === 'completed' || checkStep('ordered') === 'active'
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-500'
                                                }`}>
                                                <Check size={14} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 mt-2">Đã đặt</span>
                                        </div>

                                        {/* Step 2: Paid (Approved) */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${checkStep('paid') === 'completed' || checkStep('paid') === 'active'
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-500'
                                                }`}>
                                                <Check size={14} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 mt-2">Đã duyệt</span>
                                        </div>

                                        {/* Step 3: Processing (Preparing) */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${checkStep('processing') === 'active'
                                                ? 'bg-emerald-50 border-emerald-600 text-emerald-600 ring-2 ring-emerald-600 ring-offset-2'
                                                : checkStep('processing') === 'completed'
                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-500'
                                                }`}>
                                                <Package size={14} />
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 ${checkStep('processing') === 'active' ? 'text-emerald-700' : 'text-gray-500'}`}>Chuẩn bị hàng</span>
                                        </div>

                                        {/* Step 4: Shipping */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${checkStep('shipping') === 'active'
                                                ? 'bg-emerald-50 border-emerald-600 text-emerald-600 ring-2 ring-emerald-600 ring-offset-2'
                                                : checkStep('shipping') === 'completed'
                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-500'
                                                }`}>
                                                <Truck size={14} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 mt-2">Đang giao</span>
                                        </div>

                                        {/* Step 5: Completed */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${checkStep('completed') === 'completed' || checkStep('completed') === 'active'
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-500'
                                                }`}>
                                                <Home size={14} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 mt-2">Đã nhận</span>
                                        </div>
                                    </div>

                                    {/* Order item info */}
                                    <div
                                        onClick={() => navigate(`/orders/${lastOrder.id}`)}
                                        className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all cursor-pointer shadow-sm mt-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                <img src={lastOrder.items[0]?.image} alt={lastOrder.items[0]?.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400">Mã đơn: #{lastOrder.id}</p>
                                                <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{lastOrder.items[0]?.title}</h4>
                                                <p className="text-xs text-emerald-600 font-bold mt-1">
                                                    {lastOrder.status === 'shipping'
                                                        ? 'Dự kiến giao: 12 Thg 10, 2024'
                                                        : lastOrder.status === 'completed'
                                                            ? 'Giao hàng thành công'
                                                            : 'Đang xử lý đơn hàng'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-400" />
                                    </div>
                                </div>
                            )}

                            {/* Saved / Favorites */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                                <div className="flex items-center gap-1.5 text-[#e11d48]">
                                    <span>💚</span>
                                    <h3 className="font-bold text-gray-900 text-sm">Sản phẩm đã lưu & Yêu thích</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {savedProducts.map((p, i) => (
                                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-2 flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-50">
                                                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                            </div>
                                            <h4 className="text-[10px] font-bold text-gray-800 line-clamp-1 mt-2 text-center">{p.title}</h4>
                                        </div>
                                    ))}
                                    {/* Explore more */}
                                    <div
                                        onClick={() => navigate('/')}
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors aspect-square"
                                    >
                                        <Plus size={24} className="text-gray-400 mb-2" />
                                        <span className="text-[10px] font-bold text-gray-400">Khám phá thêm</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Address management column */
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <button onClick={() => setActiveTab('overview')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                                            &larr; Quay lại
                                        </button>
                                    </div>
                                    <h2 className="font-black text-gray-900 text-lg">Sổ địa chỉ nhận hàng</h2>
                                    <p className="text-xs text-gray-500">Quản lý các địa chỉ giao nhận hàng của bạn.</p>
                                </div>
                                <button
                                    onClick={() => openAddressModal()}
                                    className="bg-[#008000] hover:bg-emerald-700 text-white rounded-full py-2 px-5 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                >
                                    <Plus size={14} />
                                    <span>Thêm địa chỉ mới</span>
                                </button>
                            </div>

                            {profile.addresses.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                    <MapPin size={32} className="mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm font-semibold">Chưa có địa chỉ nào được thêm.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {profile.addresses.map((addr: Address) => (
                                        <div key={addr._id} className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-sm transition-all bg-gray-50/20">
                                            <div className="space-y-1.5 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-extrabold text-sm text-gray-900">{addr.recipient_name}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="text-sm text-gray-600 font-semibold">{addr.phone}</span>
                                                    {addr.is_default && (
                                                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                                                            Mặc định
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-2xl">{getFullAddressText(addr)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                {!addr.is_default && (
                                                    <button
                                                        onClick={() => handleSetDefaultAddress(addr)}
                                                        className="border border-gray-200 hover:bg-gray-50 text-[10px] font-bold text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Đặt làm mặc định
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openAddressModal(addr)}
                                                    className="text-gray-500 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                    title="Sửa địa chỉ"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => addr._id && setConfirmDeleteId(addr._id)}
                                                    className="text-gray-500 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Xóa địa chỉ"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                profile={profile}
                uploadingAvatar={uploadingAvatar}
                onAvatarChange={handleAvatarChange}
                onUpdateProfile={handleUpdateProfile}
            />

            {/* Address Form Modal */}
            <AddressFormModal
                isOpen={isAddressModalOpen}
                onClose={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddress(null);
                }}
                editingAddress={editingAddress}
                onSaveAddress={handleSaveAddress}
            />

            {/* Custom Confirm Delete Modal */}
            <ConfirmDeleteModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={async () => {
                    if (!confirmDeleteId) return;
                    const id = confirmDeleteId;
                    setConfirmDeleteId(null);
                    try {
                        const updatedAddresses = await userService.deleteAddress(id);
                        setProfile((prev: any) => prev ? { ...prev, addresses: updatedAddresses } : null);
                        showToast('Xóa địa chỉ thành công!', 'success');
                    } catch (e) {
                        showToast('Xóa địa chỉ thất bại.', 'error');
                    }
                }}
            />

            {/* Toast Notification */}
            {toast && (
                <ToastNotification
                    message={toast.message}
                    type={toast.type}
                />
            )}
        </div>
    );
}
export default BuyerProfilePage;
