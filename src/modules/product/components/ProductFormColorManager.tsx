import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ProductColorVariant } from '../types/product';

interface ProductFormColorManagerProps {
  colors: ProductColorVariant[];
  onChangeColors: (colors: ProductColorVariant[]) => void;
}

export function ProductFormColorManager({
  colors,
  onChangeColors,
}: ProductFormColorManagerProps) {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#007700');
  const [showAddColor, setShowAddColor] = useState(false);

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    const newVariant: ProductColorVariant = {
      name: newColorName.trim(),
      hex: newColorHex
    };
    onChangeColors([...colors, newVariant]);
    setNewColorName('');
    setShowAddColor(false);
  };

  const handleRemoveColor = (index: number) => {
    onChangeColors(colors.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 pt-2 border-t border-stone-100">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
          Biến thể màu sắc ({colors.length})
        </label>
        <button
          type="button"
          onClick={() => setShowAddColor(!showAddColor)}
          className="text-xs font-semibold text-[#007700] hover:text-[#005B00] flex items-center gap-1 cursor-pointer font-jakarta"
        >
          <Plus size={14} /> Thêm màu
        </button>
      </div>

      {showAddColor && (
        <div className="flex items-center gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl animate-fade-in">
          <input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0"
          />
          <input
            type="text"
            placeholder="Tên màu (VD: Men lam cổ, Gỗ mun...)"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700]"
          />
          <button
            type="button"
            onClick={handleAddColor}
            className="px-3.5 py-2 bg-[#007700] text-white text-xs font-bold rounded-lg hover:bg-[#005B00] cursor-pointer shadow-xs"
          >
            Lưu màu
          </button>
        </div>
      )}

      {/* Color Chips */}
      <div className="flex flex-wrap gap-2">
        {colors.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-3 py-1.5 bg-stone-100/80 border border-stone-200 rounded-full text-xs font-medium text-stone-700 shadow-2xs"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs"
              style={{ backgroundColor: c.hex }}
            />
            <span>{c.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveColor(idx)}
              className="text-stone-400 hover:text-rose-600 p-0.5 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
