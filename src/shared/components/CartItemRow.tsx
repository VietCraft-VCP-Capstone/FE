import React from 'react';
import { Trash2, Plus, Minus, FileText } from 'lucide-react';

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl: string;
  variant?: {
    color?: string;
    size?: string;
  };
  customNotes?: string;
  quantity: number;
  isSelected?: boolean;
  shopName?: string;
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onToggleSelect?: (id: string, isSelected: boolean) => void;
  onRemoveItem: (id: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onToggleSelect,
  onRemoveItem,
}) => {
  const subtotal = item.price * item.quantity;
  const isSelected = item.isSelected !== undefined ? item.isSelected : true;

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-3xl border transition-all duration-200 gap-4 ${isSelected ? 'border-emerald-200 shadow-sm' : 'border-gray-100 bg-gray-50/40 opacity-75'}`}>
      {/* Checkbox, Image & Product Details */}
      <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect && onToggleSelect(item.id, e.target.checked)}
          className="w-5 h-5 text-emerald-700 border-gray-300 rounded focus:ring-emerald-700 cursor-pointer accent-emerald-700"
        />

        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {item.shopName && (
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              {item.shopName}
            </span>
          )}
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 leading-snug">
            {item.title}
          </h4>

          {/* Variant tags & Custom notes */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-0.5">
            {item.variant?.color && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                Màu: {item.variant.color}
              </span>
            )}
            {item.variant?.size && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                Size: {item.variant.size}
              </span>
            )}
            {item.customNotes && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-amber-100">
                <FileText size={11} /> {item.customNotes}
              </span>
            )}
          </div>

          <div className="sm:hidden mt-1 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              {item.price.toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>
      </div>

      {/* Price, Quantity Counter & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
        <div className="hidden sm:block text-right">
          <span className="text-xs text-gray-400 font-medium block">Đơn giá</span>
          <span className="text-sm font-bold text-gray-800">
            {item.price.toLocaleString('vi-VN')}₫
          </span>
        </div>

        {/* Pill Quantity Controls */}
        <div className="flex items-center border border-gray-200 rounded-full bg-gray-50 px-2 py-1">
          <button
            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
            className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            aria-label="Giảm số lượng"
          >
            <Minus size={13} />
          </button>
          <span className="px-3 text-xs font-bold text-gray-800 min-w-[24px] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
            aria-label="Tăng số lượng"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right min-w-[90px]">
          <span className="text-[11px] text-gray-400 font-medium block sm:hidden">Thành tiền</span>
          <span className={`text-base font-extrabold ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
            {subtotal.toLocaleString('vi-VN')}₫
          </span>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onRemoveItem(item.id)}
          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
          title="Xóa sản phẩm"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
