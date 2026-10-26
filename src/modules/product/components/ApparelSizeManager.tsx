import { useState } from 'react';
import { Plus, X, Shirt, Check } from 'lucide-react';

export interface ApparelSizeManagerProps {
  sizes: string[];
  onChangeSizes: (sizes: string[]) => void;
}

const APPAREL_COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Freesize'];
const DEFAULT_APPAREL_SIZES = ['S', 'M', 'L', 'XL'];

export function ApparelSizeManager({
  sizes,
  onChangeSizes,
}: ApparelSizeManagerProps) {
  const [newSizeInput, setNewSizeInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const toggleSize = (size: string) => {
    const trimmed = size.trim();
    if (!trimmed) return;
    if (sizes.includes(trimmed)) {
      onChangeSizes(sizes.filter((s) => s !== trimmed));
    } else {
      onChangeSizes([...sizes, trimmed]);
    }
  };

  const handleAddCustomSize = () => {
    const trimmed = newSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!sizes.includes(trimmed)) {
      onChangeSizes([...sizes, trimmed]);
    }
    setNewSizeInput('');
    setShowAddCustom(false);
  };

  const handleSelectDefaultSizes = () => {
    const combined = Array.from(new Set([...sizes, ...DEFAULT_APPAREL_SIZES]));
    onChangeSizes(combined);
  };

  const handleClearAllSizes = () => {
    onChangeSizes([]);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-stone-100 bg-emerald-50/40 -mx-2 px-3 py-3 rounded-xl border border-emerald-100">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shirt size={16} className="text-emerald-700" />
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
            Bảng Size Quần Áo / May Mặc ({sizes.length})
          </label>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Thời trang & May mặc
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {sizes.length === 0 && (
            <button
              type="button"
              onClick={handleSelectDefaultSizes}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1 font-jakarta"
            >
              <Check size={13} /> Thêm nhanh S, M, L, XL
            </button>
          )}
          {sizes.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSizes}
              className="font-medium text-stone-400 hover:text-stone-600 hover:underline cursor-pointer"
            >
              Xoá hết
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="font-semibold text-[#007700] hover:text-[#005B00] flex items-center gap-1 cursor-pointer font-jakarta"
          >
            <Plus size={14} /> Size khác
          </button>
        </div>
      </div>

      {sizes.length === 0 && (
        <p className="text-xs text-emerald-800 bg-emerald-100/70 border border-emerald-200/80 rounded-lg px-3 py-1.5 font-medium">
          💡 Bạn đang chọn danh mục Thời trang / Quần áo. Hãy chọn các kích thước có sẵn bên dưới để người mua có thể lựa chọn size khi đặt hàng.
        </p>
      )}

      {/* Quick Select Common Sizes */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
          Chọn size nhanh:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {APPAREL_COMMON_SIZES.map((sz) => {
            const isSelected = sizes.includes(sz);
            return (
              <button
                key={sz}
                type="button"
                onClick={() => toggleSize(sz)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#007700] text-white border-[#007700] shadow-xs scale-102'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Size Form */}
      {showAddCustom && (
        <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl animate-fade-in">
          <input
            type="text"
            placeholder="Nhập size mới (VD: 4XL, 5XL, Oversize, 29, 30...)"
            value={newSizeInput}
            onChange={(e) => setNewSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSize();
              }
            }}
            className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700]"
          />
          <button
            type="button"
            onClick={handleAddCustomSize}
            className="px-3.5 py-2 bg-[#007700] text-white text-xs font-bold rounded-lg hover:bg-[#005B00] cursor-pointer shadow-xs font-jakarta"
          >
            Thêm
          </button>
        </div>
      )}

      {/* Active Selected Size Chips */}
      {sizes.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
            Các size đã kích hoạt ({sizes.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((sz, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 shadow-2xs"
              >
                <span>{sz}</span>
                <button
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                  title={`Bỏ size ${sz}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
