import React from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-none">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-655 flex items-center justify-center mx-auto">
                    <Trash2 size={24} />
                </div>
                <h3 className="font-extrabold text-gray-900 text-base">Xác nhận xóa</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Bạn có chắc chắn muốn xóa địa chỉ nhận hàng này? Hành động này không thể hoàn tác.</p>
                <div className="flex justify-center gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-lg flex-1"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex-1"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
