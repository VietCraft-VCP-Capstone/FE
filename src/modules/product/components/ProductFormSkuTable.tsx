import { useState } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import { ProductSkuRow } from '../types/product';
import { uploadService } from '../../../shared/services/uploadService';

/** Dựng lại bảng = mẫu × size (giữ giá/kho đã nhập, dòng mới lấy giá mặc định, kho 0). */
export function syncSkus(skus: ProductSkuRow[], sizes: string[], defaultPrice: number): ProductSkuRow[] {
  const options: { option: string; image?: string }[] = [];
  for (const s of skus) if (!options.some(o => o.option === s.option)) options.push({ option: s.option, image: s.image });
  const sizeList: (string | undefined)[] = sizes.length > 0 ? sizes : [undefined];
  return options.flatMap(o => sizeList.map(size => {
    const old = skus.find(s => s.option === o.option && (s.size || undefined) === size)
      ?? skus.find(s => s.option === o.option && !s.size && sizes.length > 0 && size === sizes[0]);
    return { option: o.option, image: o.image, size, price: old?.price ?? defaultPrice, stock: old?.stock ?? 0 };
  }));
}

interface Props {
  skus?: ProductSkuRow[];
  sizes: string[];
  defaultPrice: number;
  error?: string;
  onChange: (skus: ProductSkuRow[] | undefined) => void;
}

export function ProductFormSkuTable({ skus, sizes, defaultPrice, error, onChange }: Props) {
  const [newOption, setNewOption] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const enabled = skus !== undefined;
  const rows = enabled ? syncSkus(skus, sizes, defaultPrice) : [];
  const options = [...new Map(rows.map(r => [r.option, r.image])).entries()];

  const addOption = () => {
    const name = newOption.trim();
    if (!name || options.some(([o]) => o.toLowerCase() === name.toLowerCase())) return;
    onChange(syncSkus([...rows, { option: name, price: defaultPrice, stock: 0 }], sizes, defaultPrice));
    setNewOption('');
  };

  const setImage = async (option: string, file?: File) => {
    if (!file) return;
    setUploading(option);
    try {
      const { url } = await uploadService.uploadImage(file, 'products');
      onChange(rows.map(r => (r.option === option ? { ...r, image: url } : r)));
    } catch {
      alert('Tải ảnh mẫu thất bại, vui lòng thử lại.');
    } finally {
      setUploading(null);
    }
  };

  const patchRow = (i: number, changes: Partial<ProductSkuRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...changes } : r)));

  return (
    <div className="space-y-3 pt-2 border-t border-stone-100" data-focus-target="skus">
      <label className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked ? [] : undefined)}
          className="accent-[#007700]"
        />
        Phân loại hàng theo mẫu (set / lẻ / combo) — giá và kho riêng từng loại
      </label>

      {enabled && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tên mẫu (VD: Set váy + áo, Lẻ áo, Kèm hộp quà...)"
              value={newOption}
              maxLength={80}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700]"
            />
            <button
              type="button"
              onClick={addOption}
              className="px-3.5 py-2 bg-[#007700] text-white text-xs font-bold rounded-lg hover:bg-[#005B00] cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} /> Thêm mẫu
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {options.map(([option, image]) => (
              <div key={option} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-stone-100/80 border border-stone-200 rounded-lg text-xs text-stone-700">
                <label className="w-9 h-9 rounded-md border border-dashed border-stone-300 bg-white flex items-center justify-center overflow-hidden cursor-pointer" title="Chọn ảnh cho mẫu">
                  {image
                    ? <img src={image} alt={option} className="w-full h-full object-cover" />
                    : <ImagePlus size={14} className="text-stone-400" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(option, e.target.files?.[0])} />
                </label>
                <span className="font-semibold">{uploading === option ? 'Đang tải ảnh...' : option}</span>
                <button
                  type="button"
                  aria-label={`Xoá mẫu ${option}`}
                  onClick={() => onChange(rows.filter(r => r.option !== option))}
                  className="text-stone-400 hover:text-rose-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {rows.length > 0 && (
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="text-left px-3 py-2">Mẫu</th>
                    <th className="text-left px-3 py-2">Size</th>
                    <th className="text-left px-3 py-2">Giá bạn nhận (đ)</th>
                    <th className="text-left px-3 py-2">Kho</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.option}|${r.size || ''}`} className="border-t border-stone-100">
                      <td className="px-3 py-1.5 font-medium text-stone-800">{r.option}</td>
                      <td className="px-3 py-1.5 text-stone-600">{r.size || '—'}</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number" min={1} value={r.price || ''}
                          aria-label={`Giá ${r.option} ${r.size || ''}`}
                          onChange={(e) => patchRow(i, { price: Number(e.target.value) })}
                          className="w-28 px-2 py-1 border border-stone-200 rounded-md"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number" min={0} step={1} value={r.stock}
                          aria-label={`Kho ${r.option} ${r.size || ''}`}
                          onChange={(e) => patchRow(i, { stock: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                          className="w-20 px-2 py-1 border border-stone-200 rounded-md"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {error && <p className="text-xs text-[#BA1A1A]">{error}</p>}
        </>
      )}
    </div>
  );
}
