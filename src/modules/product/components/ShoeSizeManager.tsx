import { useState } from 'react';
import { Plus, X, Footprints, Check } from 'lucide-react';

export interface ShoeSizeManagerProps {
  sizes: string[];
  onChangeSizes: (sizes: string[]) => void;
}

const SHOE_COMMON_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const POPULAR_MEN_SIZES = ['39', '40', '41', '42', '43'];
const POPULAR_WOMEN_SIZES = ['36', '37', '38', '39'];

export function ShoeSizeManager({
  sizes,
  onChangeSizes,
}: ShoeSizeManagerProps) {
  const [newSizeInput, setNewSizeInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const hasApparelSizes = sizes.some((s) =>
    ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Freesize'].includes(s)
  );

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

  const handleSelectPopularMenSizes = () => {
    const combined = Array.from(new Set([...sizes.filter((s) => !['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].includes(s)), ...POPULAR_MEN_SIZES]));
    onChangeSizes(combined);
  };

  const handleSelectPopularWomenSizes = () => {
    const combined = Array.from(new Set([...sizes.filter((s) => !['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].includes(s)), ...POPULAR_WOMEN_SIZES]));
    onChangeSizes(combined);
  };

  const handleClearAllSizes = () => {
    onChangeSizes([]);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-stone-100 bg-sky-50/50 -mx-2 px-3 py-3 rounded-xl border border-sky-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Footprints size={16} className="text-sky-700" />
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider font-jakarta">
            Kích Thước Giày Dép / Cỡ Chân ({sizes.length})
          </label>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
            Giày dép & Thể thao (EU/VN)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {sizes.length === 0 && (
            <>
              <button
                type="button"
                onClick={handleSelectPopularMenSizes}
                className="font-semibold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer flex items-center gap-1 font-jakarta"
              >
                <Check size={13} /> Thêm cỡ 39 - 43
              </button>
              <button
                type="button"
                onClick={handleSelectPopularWomenSizes}
                className="font-semibold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer flex items-center gap-1 font-jakarta"
              >
                <Check size={13} /> Thêm cỡ 36 - 39
              </button>
            </>
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
            className="font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer font-jakarta"
          >
            <Plus size={14} /> Cỡ khác
          </button>
        </div>
      </div>

      {hasApparelSizes && (
        <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <span>⚠️ Sản phẩm giày dép đang chứa size chữ ({sizes.filter((s) => ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Freesize'].includes(s)).join(', ')}).</span>
          <button
            type="button"
            onClick={() => onChangeSizes(['39', '40', '41', '42'])}
            className="font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer ml-2 whitespace-nowrap"
          >
            Đổi sang size giày 39 - 42
          </button>
        </div>
      )}

      {sizes.length === 0 && (
        <p className="text-xs text-sky-900 bg-sky-100/70 border border-sky-200/80 rounded-lg px-3 py-1.5 font-medium">
          💡 Bạn đang tạo sản phẩm <strong>Giày dép / Thể thao</strong>. Hãy chọn các số đo cỡ chân (36 - 45) bên dưới để khách hàng có thể chọn size chân chính xác khi đặt mua.
        </p>
      )}

      {/* Quick Select Common Shoe Sizes */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
          Chọn cỡ giày nhanh (EU/VN):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SHOE_COMMON_SIZES.map((sz) => {
            const isSelected = sizes.includes(sz);
            return (
              <button
                key={sz}
                type="button"
                onClick={() => toggleSize(sz)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-102 ring-2 ring-sky-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-sky-400 hover:bg-sky-50/50'
                }`}
              >
                Size {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Shoe Size Form */}
      {showAddCustom && (
        <div className="flex items-center gap-2 p-3 bg-white border border-sky-200 rounded-xl animate-fade-in shadow-xs">
          <input
            type="text"
            placeholder="Nhập cỡ giày (VD: 34, 35, 42.5, 43 1/3, 47, US 8.5...)"
            value={newSizeInput}
            onChange={(e) => setNewSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSize();
              }
            }}
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-sky-600 focus:bg-white"
          />
          <button
            type="button"
            onClick={handleAddCustomSize}
            className="px-3.5 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-700 cursor-pointer shadow-xs font-jakarta"
          >
            Thêm cỡ
          </button>
        </div>
      )}

      {/* Active Selected Size Chips */}
      {sizes.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
            Các cỡ giày đã kích hoạt ({sizes.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((sz, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-sky-300 rounded-lg text-xs font-bold text-sky-900 shadow-2xs"
              >
                <span>Size {sz.startsWith('Size') ? sz.replace(/^Size\s*/i, '') : sz}</span>
                <button
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                  title={`Bỏ cỡ ${sz}`}
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
