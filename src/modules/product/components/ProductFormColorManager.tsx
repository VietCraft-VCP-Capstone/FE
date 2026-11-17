import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ProductColorVariant } from '../types/product';
import { HINT, LABEL, inputClass } from './form/formUi';

interface ProductFormColorManagerProps {
  colors: ProductColorVariant[];
  onChangeColors: (colors: ProductColorVariant[]) => void;
}

export function ProductFormColorManager({ colors, onChangeColors }: ProductFormColorManagerProps) {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#007700');
  const [showAddColor, setShowAddColor] = useState(false);

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    onChangeColors([...colors, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName('');
    setShowAddColor(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className={LABEL}>Màu sắc ({colors.length})</span>
        <button
          type="button"
          onClick={() => setShowAddColor(!showAddColor)}
          aria-expanded={showAddColor}
          className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#007700] hover:text-[#005B00] hover:underline"
        >
          <Plus size={14} /> Thêm màu
        </button>
      </div>

      {showAddColor && (
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <input
            type="color"
            aria-label="Chọn màu"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
          />
          <input
            type="text"
            placeholder="Tên màu (VD: Men lam cổ, Gỗ mun...)"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              handleAddColor();
            }}
            className={inputClass(undefined, 'flex-1 min-w-0')}
          />
          <button
            type="button"
            onClick={handleAddColor}
            disabled={!newColorName.trim()}
            className="h-10 shrink-0 cursor-pointer rounded-lg bg-[#007700] px-4 text-[13px] font-semibold text-white hover:bg-[#005B00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Lưu màu
          </button>
        </div>
      )}

      {colors.length === 0 ? (
        <p className={`m-0 ${HINT}`}>Chưa có màu nào. Bỏ qua nếu sản phẩm chỉ có một màu.</p>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {colors.map((c, idx) => (
            <li key={idx} className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white py-1 pl-2 pr-1 text-[13px] text-stone-800">
              <span className="h-4 w-4 rounded-full border border-stone-300" style={{ backgroundColor: c.hex }} aria-hidden />
              <span>{c.name}</span>
              <button
                type="button"
                onClick={() => onChangeColors(colors.filter((_, i) => i !== idx))}
                aria-label={`Bỏ màu ${c.name}`}
                className="cursor-pointer rounded p-1 text-stone-500 hover:bg-rose-50 hover:text-rose-600"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
