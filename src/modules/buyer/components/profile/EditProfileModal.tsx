import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '../../../user/services/userService';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    uploadingAvatar: boolean;
    onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpdateProfile: (name: string, phone: string) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isOpen,
    onClose,
    profile,
    uploadingAvatar,
    onAvatarChange,
    onUpdateProfile
}) => {
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (profile) {
            setEditName(profile.full_name || '');
            setEditPhone(profile.phone || '');
        }
    }, [profile, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onUpdateProfile(editName, editPhone);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
                <h2 className="font-extrabold text-gray-900 text-lg">Chỉnh sửa hồ sơ</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                            <img src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150'} alt="Avatar Preview" className="w-full h-full object-cover" />
                            {uploadingAvatar && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold text-gray-900">Ảnh đại diện</h4>
                            <div className="relative">
                                <button 
                                    type="button" 
                                    className="bg-gray-100 hover:bg-gray-205 text-gray-800 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all"
                                >
                                    Chọn ảnh mới
                                </button>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={onAvatarChange} 
                                    disabled={uploadingAvatar}
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    title="Tải ảnh mới lên"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Họ và tên</label>
                        <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-900 mb-1">Số điện thoại</label>
                        <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full border border-gray-300 text-gray-900 font-semibold bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-lg"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                        >
                            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Cập nhật</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
