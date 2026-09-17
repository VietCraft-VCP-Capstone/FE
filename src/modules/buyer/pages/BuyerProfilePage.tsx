import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, FolderHeart, UserCheck, MapPin,
    CreditCard, Settings, LogOut, ChevronRight, Check,
    Truck, Home, Plus, Trash2, Edit2, Camera, Loader2,
    Calendar, Eye, Heart, Store
} from 'lucide-react';
import { userService, UserProfile, Address } from '../../user/services/userService';
import { ordersService } from '../../order/services/ordersService';
import { productsService } from '../../product/services/productsService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { AddressFormModal } from '../components/profile/AddressFormModal';
import { ConfirmDeleteModal } from '../components/profile/ConfirmDeleteModal';
import { useToast } from '../../../shared/components/Toast';
const getFullAddressText = (addr: Address) => {
    return addr.address_detail;
};

interface BuyerProfilePageProps {
    onLogout: () => void;
}

export function BuyerProfilePage({ onLogout }: BuyerProfilePageProps) {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
                const prof = await userService.getProfile();
                setProfile(prof);

                const orders = await ordersService.getByUser();
                if (orders && orders.length > 0) {
                    setLastOrder(orders[0]);
                }

                try {
                    const [allProducts, wishlistIds] = await Promise.all([
                        productsService.getAll(),
                        userService.getWishlist().catch(() => [])
                    ]);
                    const ids = Array.isArray(wishlistIds) ? wishlistIds : [];
                    const products: any[] = Array.isArray(allProducts)
                        ? allProducts
                        : (allProducts?.items || []);
                    
                    const matchedItems = products.filter((p: any) =>
                        ids.includes(p.id) || ids.includes(p._id?.toString())
                    );
                    
                    const mapped = matchedItems.slice(0, 3).map((p: any) => ({
                        title: p.title || p.name || 'Sản phẩm sáng tạo',
                        image: p.image || p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150'
                    }));

                    if (mapped.length === 0) {
                        const fallbackMapped = products.slice(0, 3).map((p: any) => ({
                            title: p.title || p.name || 'Sản phẩm sáng tạo',
                            image: p.image || p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=150'
                        }));
                        setSavedProducts(fallbackMapped);
                    } else {
                        setSavedProducts(mapped);
                    }
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
            showToast(getApiErrorMessage(e, 'Cập nhật hồ sơ thất bại.'), 'error');
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
            showToast(getApiErrorMessage(e, 'Lưu địa chỉ thất bại.'), 'error');
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
            showToast(getApiErrorMessage(e, 'Đặt làm mặc định thất bại.'), 'error');
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
            <div className="bg-white rounded-[24px] border border-gray-200 p-6 flex flex-row items-center gap-6">
                <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-gray-150 flex-shrink-0 cursor-pointer">
                    <img 
                        src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'} 
                        alt={profile.full_name} 
                        className="w-full h-full object-cover transition-all group-hover:scale-105" 
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera size={18} className="text-white mb-1" />
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Thay đổi</span>
                    </div>
                    {/* Loading Overlay */}
                    {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
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
                <div className="flex-1 space-y-2">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{profile.full_name}</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{profile.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-1 bg-emerald-50/50 text-[#008000] text-xs px-3 py-1.5 rounded-full font-bold border border-emerald-250">
                            <UserCheck size={12} />
                            <span>{profile.rank || 'Thành viên Bạc'}</span>
                        </div>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-[#008000] hover:bg-emerald-700 text-white rounded-full py-1.5 px-5 text-xs font-bold transition-all shadow-sm active:scale-95 flex-shrink-0"
                        >
                            Chỉnh sửa hồ sơ
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Layout Grid - Always Visible */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Activities & Menu options) */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="bg-white rounded-[24px] border border-gray-200 p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-gray-900 text-sm">Hoạt động</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-[30px] p-4 text-center cursor-pointer hover:bg-gray-50/50 transition-colors flex flex-col items-center justify-center aspect-[1.15/1]" onClick={() => navigate('/orders')}>
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#008000] flex items-center justify-center mb-2">
                                    <ShoppingBag size={18} />
                                </div>
                                <span className="block font-black text-gray-900 text-lg leading-none mb-1">{profile.stats?.ordersCount ?? 0}</span>
                                <span className="text-[10px] text-gray-500 font-bold">Đơn hàng</span>
                            </div>
                            <div className="border border-gray-200 rounded-[30px] p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors flex flex-col items-center justify-center aspect-[1.15/1]" onClick={() => navigate('/favorites')}>
                                <div className="w-8 h-8 rounded-full bg-purple-50 text-[#a855f7] flex items-center justify-center mb-2">
                                    <FolderHeart size={18} />
                                </div>
                                <span className="block font-black text-gray-900 text-lg leading-none mb-1">{profile.stats?.collectionsCount ?? 0}</span>
                                <span className="text-[10px] text-gray-500 font-bold">Bộ sưu tập</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/followed-shops')}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors mt-2 cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <Eye size={14} className="text-gray-400" />
                                <span>{profile.stats?.followingCount ?? 0} Đang theo dõi</span>
                            </span>
                            <ChevronRight size={14} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Menu links */}
                    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-gray-150">
                            <li>
                                <button 
                                    onClick={() => navigate('/followed-shops')} 
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <Store size={18} className="text-gray-400" />
                                        <span>Gian hàng đang theo dõi</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-400" />
                                </button>
                            </li>
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
                    <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-sm space-y-4 relative overflow-hidden">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#008000] flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-100">
                                <Store size={20} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-sm">
                                    Kiếm tiền từ sáng tạo của bạn
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed font-semibold mt-1">
                                    Mở gian hàng trên VietCraft để chia sẻ sản phẩm độc đáo của bạn.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/seller/register')}
                            className="w-full bg-[#008000] hover:bg-emerald-700 text-white font-bold py-2.5 rounded-full text-xs transition-colors shadow-sm cursor-pointer mt-2"
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
                                <div className="bg-white rounded-[24px] border border-gray-200 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-900 text-sm">Đơn hàng gần nhất</h3>
                                        <button onClick={() => navigate('/orders')} className="text-xs font-bold text-[#008000] hover:text-emerald-700">
                                            Xem tất cả
                                        </button>
                                    </div>

                                    {/* Stepper Progress Bar */}
                                    <div className="relative flex justify-between items-center w-full py-2 z-0 scale-95 sm:scale-100">
                                        {/* Connector line */}
                                        <div className="absolute left-6 right-6 h-[3px] bg-gray-250 top-[16px] -translate-y-1/2 z-0 rounded-full">
                                            <div
                                                className="h-full bg-[#008000] transition-all duration-500 rounded-full"
                                                style={{
                                                    width:
                                                        lastOrder.status === 'completed'
                                                            ? '105%'
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
                                        <div className="relative z-10 flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-300 ${
                                                checkStep('ordered') === 'completed' || checkStep('ordered') === 'active'
                                                    ? 'bg-[#008000] border-[#008000] text-white shadow-sm'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                                <Check size={14} className="stroke-[3]" />
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 text-center transition-all ${
                                                checkStep('ordered') === 'active'
                                                    ? 'text-[#008000] font-black'
                                                    : checkStep('ordered') === 'completed'
                                                        ? 'text-gray-800'
                                                        : 'text-gray-400 font-semibold'
                                            }`}>Đã đặt</span>
                                        </div>

                                        {/* Step 2: Paid (Approved) */}
                                        <div className="relative z-10 flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-300 ${
                                                checkStep('paid') === 'completed' || checkStep('paid') === 'active'
                                                    ? 'bg-[#008000] border-[#008000] text-white shadow-sm'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                                <Check size={14} className="stroke-[3]" />
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 text-center transition-all ${
                                                checkStep('paid') === 'active'
                                                    ? 'text-[#008000] font-black'
                                                    : checkStep('paid') === 'completed'
                                                        ? 'text-gray-800'
                                                        : 'text-gray-400 font-semibold'
                                            }`}>Đã duyệt</span>
                                        </div>

                                        {/* Step 3: Preparing */}
                                        <div className="relative z-10 flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-300 ${
                                                checkStep('processing') === 'active'
                                                    ? 'bg-white border-[#008000] text-[#008000] ring-1 ring-[#008000] ring-offset-2'
                                                    : checkStep('processing') === 'completed'
                                                        ? 'bg-[#008000] border-[#008000] text-white shadow-sm'
                                                        : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                                {checkStep('processing') === 'completed' ? (
                                                    <Check size={14} className="stroke-[3]" />
                                                ) : (
                                                    <Store size={14} className={checkStep('processing') === 'active' ? 'stroke-[2.5]' : ''} />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 text-center transition-all ${
                                                checkStep('processing') === 'active'
                                                    ? 'text-[#008000] font-black'
                                                    : checkStep('processing') === 'completed'
                                                        ? 'text-gray-850'
                                                        : 'text-gray-400 font-semibold'
                                            }`}>Chuẩn bị hàng</span>
                                        </div>

                                        {/* Step 4: Shipping */}
                                        <div className="relative z-10 flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-300 ${
                                                checkStep('shipping') === 'active'
                                                    ? 'bg-white border-[#008000] text-[#008000] ring-1 ring-[#008000] ring-offset-2'
                                                    : checkStep('shipping') === 'completed'
                                                        ? 'bg-[#008000] border-[#008000] text-white shadow-sm'
                                                        : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                                {checkStep('shipping') === 'completed' ? (
                                                    <Check size={14} className="stroke-[3]" />
                                                ) : (
                                                    <Truck size={14} className={checkStep('shipping') === 'active' ? 'stroke-[2.5]' : ''} />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 text-center transition-all ${
                                                checkStep('shipping') === 'active'
                                                    ? 'text-[#008000] font-black'
                                                    : checkStep('shipping') === 'completed'
                                                        ? 'text-gray-850'
                                                        : 'text-gray-400 font-semibold'
                                            }`}>Đang giao</span>
                                        </div>

                                        {/* Step 5: Completed */}
                                        <div className="relative z-10 flex flex-col items-center flex-1">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 transition-all duration-300 ${
                                                checkStep('completed') === 'completed' || checkStep('completed') === 'active'
                                                    ? 'bg-[#008000] border-[#008000] text-white shadow-sm'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                            }`}>
                                                {checkStep('completed') === 'completed' || checkStep('completed') === 'active' ? (
                                                    <Check size={14} className="stroke-[3]" />
                                                ) : (
                                                    <Home size={14} />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold mt-2 text-center transition-all ${
                                                checkStep('completed') === 'active'
                                                    ? 'text-[#008000] font-black'
                                                    : checkStep('completed') === 'completed'
                                                        ? 'text-gray-850'
                                                        : 'text-gray-400 font-semibold'
                                            }`}>Đã nhận</span>
                                        </div>
                                    </div>

                                    {/* Order item info */}
                                    <div
                                        onClick={() => navigate(`/orders/${lastOrder.id}`)}
                                        className="flex items-center justify-between p-4 rounded-[20px] border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer mt-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                                <img src={lastOrder.items[0]?.image} alt={lastOrder.items[0]?.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400">Mã đơn: #{lastOrder.id}</p>
                                                <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{lastOrder.items[0]?.title}</h4>
                                                <p className="text-xs text-[#008000] font-semibold mt-1 flex items-center gap-1.5">
                                                    <Calendar size={13} className="stroke-[2.5]" />
                                                    {lastOrder.status === 'shipping'
                                                        ? 'Dự kiến giao: 12 Thg 10, 2024'
                                                        : lastOrder.status === 'completed'
                                                            ? 'Giao hàng thành công'
                                                            : 'Đang xử lý đơn hàng'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-450 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Saved / Favorites */}
                            <div className="bg-white rounded-[24px] border border-gray-200 p-6 shadow-sm space-y-4">
                                <div className="flex items-center gap-2 text-[#008000]">
                                    <Heart size={16} className="fill-[#008000] text-[#008000]" />
                                    <h3 className="font-bold text-gray-900 text-sm">Sản phẩm đã lưu & Yêu thích</h3>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
                                    {savedProducts.map((p, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-50 border border-gray-150 aspect-square cursor-pointer hover:scale-105 transition-all">
                                                <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                            </div>
                                            <h4 className="text-[10px] font-bold text-gray-700 line-clamp-1 mt-2.5 text-center px-1 leading-normal w-full">{p.title}</h4>
                                        </div>
                                    ))}
                                    {/* Explore more */}
                                    <div className="flex flex-col items-center">
                                        <div
                                            onClick={() => navigate('/')}
                                            className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-50/20 hover:border-[#008000] hover:text-[#008000] transition-colors aspect-square text-gray-400 font-sans"
                                        >
                                            <Plus size={24} className="stroke-[2.5]" />
                                        </div>
                                        <span className="text-[10px] font-bold text-[#008000] hover:text-emerald-700 text-center mt-2.5 cursor-pointer leading-normal">Khám phá thêm</span>
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
                        showToast(getApiErrorMessage(e, 'Xóa địa chỉ thất bại.'), 'error');
                    }
                }}
            />
        </div>
    );
}
export default BuyerProfilePage;
