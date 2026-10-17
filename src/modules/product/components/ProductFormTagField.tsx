import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CatalogOption } from '../types/product';

interface ProductFormTagFieldProps {
  tags: CatalogOption[];
  tagIds: string[];
  newTagNames: string[];
  catalogLoading: boolean;
  error?: string;
  labelClass: string;
  onToggleTag: (id: string) => void;
  onAddTag: (name: string) => void;
  onRemoveNewTag: (name: string) => void;
}

export function ProductFormTagField({
  tags,
  tagIds,
  newTagNames,
  catalogLoading,
  error,
  labelClass,
  onToggleTag,
  onAddTag,
  onRemoveNewTag,
}: ProductFormTagFieldProps) {
  const [input, setInput] = useState('');
  const add = () => {
    if (!input.trim()) return;
    onAddTag(input.trim());
    setInput('');
  };

  return (
    <div className="md:col-span-2 space-y-2" data-focus-target="tags">
      <label className={labelClass}>
        Thẻ sản phẩm <span className="text-rose-500">*</span>
        <span className="ml-2 font-medium normal-case tracking-normal text-stone-400">
          Đã chọn {tagIds.length + newTagNames.length}
        </span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Gõ tên thẻ và nhấn Enter hoặc nút Thêm (ví dụ: GomBatTrang, Linen)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="flex-1 px-3.5 py-2 bg-stone-50/80 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 font-jakarta"
        >
          <Plus size={13} /> Thêm thẻ
        </button>
      </div>
      <div
        className={`flex flex-wrap gap-2 p-3 bg-stone-50/80 border rounded-xl min-h-[52px] ${
          error ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
        }`}
      >
        {catalogLoading && <span className="text-xs text-stone-400">Đang tải thẻ...</span>}
        {!catalogLoading && tags.length === 0 && newTagNames.length === 0 && (
          <span className="text-xs text-stone-400">Sàn chưa duyệt thẻ nào.</span>
        )}
        {newTagNames.map((name) => (
          <span
            key={`new-${name}`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 shadow-xs"
          >
            #{name} <span className="text-[10px] text-amber-700 font-normal">(Chờ duyệt)</span>
            <button
              type="button"
              onClick={() => onRemoveNewTag(name)}
              aria-label={`Bỏ thẻ ${name}`}
              className="ml-1 text-amber-600 hover:text-amber-900 cursor-pointer"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {tags.map((tag) => {
          const picked = tagIds.includes(tag._id);
          return (
            <button
              key={tag._id}
              type="button"
              onClick={() => onToggleTag(tag._id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                picked
                  ? 'font-bold text-white border-transparent shadow-xs'
                  : 'font-medium text-stone-600 bg-white border-stone-200 hover:border-stone-400'
              }`}
              style={picked ? { backgroundColor: tag.color || '#007700' } : undefined}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
