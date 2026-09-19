import React, { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, X, AlertCircle } from 'lucide-react';
import { useToast } from '../../../../shared/components/Toast';

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

interface ReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopName: string;
    items: OrderItem[];
    onConfirm: (selectedItems: OrderItem[]) => void;
}

export const ReorderModal: React.FC<ReorderModalProps> = ({
    isOpen,
    onClose,
    shopName,
    items,
    onConfirm
}) => {
    const { showToast } = useToast();
    const [editableItems, setEditableItems] = useState<(OrderItem & { selected: boolean })[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && items) {
            setEditableItems(
                items.map(item => ({
                    ...item,
                    selected: true
                }))
            );
            setErrorMsg(null);
        }
    }, [isOpen, items]);

    if (!isOpen) return null;

    const handleToggleSelect = (index: number) => {
        setErrorMsg(null);
        setEditableItems(prev =>
            prev.map((item, i) => {
                if (i === index) {
                    return { ...item, selected: !item.selected };
                }
                return item;
            })
        );
    };

    const handleQuantityChange = (index: number, delta: number) => {
        setErrorMsg(null);
        setEditableItems(prev =>
            prev.map((item, i) => {
                if (i === index) {
                    const next = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: next };
                }
                return item;
            })
        );
    };

    const handleConfirm = () => {
        const selected = editableItems.filter(item => item.selected);
        if (selected.length === 0) {
            const msg = 'Vui lòng chọn ít nhất một sản phẩm để mua lại.';
            setErrorMsg(msg);
            showToast(msg, 'error');
            return;
        }
        setErrorMsg(null);
        const finalItems = selected.map(({ selected, ...rest }) => rest);
        onConfirm(finalItems);
    };

    const selectedCount = editableItems.filter(item => item.selected).length;
    const totalAmount = editableItems
        .filter(item => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <h2 className="font-extrabold text-gray-900 text-lg">Mua lại đơn hàng</h2>
                        <p className="text-xs text-gray-500 font-medium">Shop: {shopName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                        <X size={18} />
                    </button>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-shake">
                        <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Items List */}
                <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1">
                    {editableItems.map((item, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                item.selected ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-100 bg-gray-50/20 opacity-70'
                            }`}
                        >
                            {/* Checkbox */}
                            <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleToggleSelect(idx)}
                                className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                            />

                            {/* Image */}
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                <img
                                    src={item.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200'}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm leading-snug truncate">{item.title}</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Phân loại: {`${item.color || ''} ${item.size || ''}`.trim() || 'Mặc định'}
                                </p>
                                <span className="font-extrabold text-emerald-600 text-xs mt-1 block">
                                    {item.price.toLocaleString('vi-VN')}đ
                                </span>
                            </div>

                            {/* Quantity Changer */}
                            {item.selected && (
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(idx, -1)}
                                        className="p-1 hover:bg-gray-50 text-gray-600 transition-colors"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(idx, 1)}
                                        className="p-1 hover:bg-gray-50 text-gray-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer / Summary */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Đã chọn ({selectedCount}/{editableItems.length} món)</span>
                        <div className="text-right">
                            <span className="text-xs text-gray-500 font-medium">Tổng tiền: </span>
                            <span className="font-black text-emerald-600 text-base">
                                {totalAmount.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-250 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-lg flex-1 transition-all"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex-[2] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
                        >
                            <ShoppingCart size={14} />
                            <span>Thêm {selectedCount} món vào giỏ</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReorderModal;
