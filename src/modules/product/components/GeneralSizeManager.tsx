import { useState } from 'react';
import { Plus, X, Ruler, Check } from 'lucide-react';

export interface GeneralSizeManagerProps {
  sizes: string[];
  onChangeSizes: (sizes: string[]) => void;
  categoryName?: string;
}

const COMMON_GENERAL_SPECS = ['Tiêu chuẩn', 'Nhỏ (S)', 'Vừa (M)', 'Lớn (L)', 'Cỡ đại (XL)', 'Freesize'];
const COMMON_DIMENSIONS = ['20x30 cm', '30x40 cm', '40x60 cm', '50x70 cm'];
const DEFAULT_GENERAL_SPECS = ['Nhỏ (S)', 'Vừa (M)', 'Lớn (L)'];

export function GeneralSizeManager({
  sizes,
  onChangeSizes,
  categoryName = '',
}: GeneralSizeManagerProps) {
  const [newSizeInput, setNewSizeInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const isWallartOrDecor = /tranh|canvas|poster|thảm|decor|gối/i.test(categoryName);

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
    const trimmed = newSizeInput.trim();
    if (!trimmed) return;
    if (!sizes.includes(trimmed)) {
      onChangeSizes([...sizes, trimmed]);
    }
    setNewSizeInput('');
    setShowAddCustom(false);
  };

  const handleSelectDefaultSpecs = () => {
    const combined = Array.from(new Set([...sizes, ...DEFAULT_GENERAL_SPECS]));
    onChangeSizes(combined);
  };

  const handleSelectStandardOnly = () => {
    onChangeSizes(['Tiêu chuẩn']);
  };

  const handleClearAllSizes = () => {
    onChangeSizes([]);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-stone-100 bg-amber-50/50 -mx-2 px-3 py-3 rounded-xl border border-amber-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Ruler size={16} className="text-amber-700" />
          <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider font-jakarta">
            Quy Cách / Kích Thước Sản Phẩm ({sizes.length})
          </label>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            Thủ công mỹ nghệ & Decor
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {sizes.length === 0 && (
            <>
              <button
                type="button"
                onClick={handleSelectDefaultSpecs}
                className="font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer flex items-center gap-1 font-jakarta"
              >
                <Check size={13} /> Thêm nhanh Nhỏ, Vừa, Lớn
              </button>
              <button
                type="button"
                onClick={handleSelectStandardOnly}
                className="font-semibold text-stone-600 hover:text-stone-900 hover:underline cursor-pointer flex items-center gap-1 font-jakarta"
              >
                <Check size={13} /> 1 Cỡ tiêu chuẩn
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
            className="font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer font-jakarta"
          >
            <Plus size={14} /> Kích thước khác
          </button>
        </div>
      </div>

      {sizes.length === 0 && (
        <p className="text-xs text-amber-900 bg-amber-100/70 border border-amber-200/80 rounded-lg px-3 py-1.5 font-medium">
          💡 Dành cho hàng thủ công mỹ nghệ, gốm sứ, tranh decor, phụ kiện: Bạn có thể chọn quy chuẩn hoặc kích thước đóng gói (cm) để người mua chọn khi đặt hàng (hoặc để trống nếu sản phẩm chỉ có duy nhất 1 kích thước).
        </p>
      )}

      {/* Quick Select Common Specs */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
          Chọn quy cách có sẵn:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_GENERAL_SPECS.map((sz) => {
            const isSelected = sizes.includes(sz);
            return (
              <button
                key={sz}
                type="button"
                onClick={() => toggleSize(sz)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-102 ring-2 ring-amber-300'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50'
                }`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimension Options for wallart, decor, mats, bags */}
      {isWallartOrDecor && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
            Kích thước tranh / decor tiêu chuẩn (Dài x Rộng):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_DIMENSIONS.map((dim) => {
              const isSelected = sizes.includes(dim);
              return (
                <button
                  key={dim}
                  type="button"
                  onClick={() => toggleSize(dim)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-jakarta transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs scale-102 ring-2 ring-amber-300'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50'
                  }`}
                >
                  {dim}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Spec Form */}
      {showAddCustom && (
        <div className="flex items-center gap-2 p-3 bg-white border border-amber-200 rounded-xl animate-fade-in shadow-xs">
          <input
            type="text"
            placeholder="Nhập kích thước/quy cách (VD: 30x40cm, Cao 25cm, Đường kính 20cm, 500ml...)"
            value={newSizeInput}
            onChange={(e) => setNewSizeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSize();
              }
            }}
            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
          />
          <button
            type="button"
            onClick={handleAddCustomSize}
            className="px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 cursor-pointer shadow-xs font-jakarta"
          >
            Thêm
          </button>
        </div>
      )}

      {/* Active Selected Size Chips */}
      {sizes.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
            Các quy cách đã kích hoạt ({sizes.length}):
          </span>
          <div className="flex flex-wrap gap-2">
            {sizes.map((sz, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 shadow-2xs"
              >
                <span>{sz}</span>
                <button
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer ml-1"
                  title={`Bỏ quy cách ${sz}`}
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
