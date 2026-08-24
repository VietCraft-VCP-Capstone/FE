import { ProductItem } from '../types/product';
import { Trash2, X } from 'lucide-react';

interface ProductDeleteModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function ProductDeleteModal({
  product,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}: ProductDeleteModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <Trash2 size={20} />
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="px-6 py-3 space-y-2.5">
          <h3 className="text-lg font-bold text-stone-900 font-jakarta">
            Xác nhận xóa sản phẩm
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Bạn có chắc chắn muốn xóa sản phẩm{' '}
            <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              "{product.title}"
            </span>{' '}
            khỏi hệ thống? Hành động này không thể hoàn tác.
          </p>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-stone-50 border-t border-stone-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 bg-[#BA1A1A] hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
