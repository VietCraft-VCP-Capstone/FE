import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CatalogOption } from '../types/product';
import { ERROR_TEXT, LABEL, inputClass } from './form/formUi';

interface ProductFormTagFieldProps {
  tags: CatalogOption[];
  tagIds: string[];
  newTagNames: string[];
  catalogLoading: boolean;
  error?: string;
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
  onToggleTag,
  onAddTag,
  onRemoveNewTag,
}: ProductFormTagFieldProps) {
  const [input, setInput] = useState('');
  const count = tagIds.length + newTagNames.length;
  const query = input.trim().toLowerCase();
  const [showAll, setShowAll] = useState(false);
  // Thẻ hợp danh mục xếp trước; thẻ ngành khác ẩn sau nút, trừ thẻ đã chọn. Đang gõ thì lọc trên toàn bộ.
  const related = tags.filter(t => (t.related_count ?? 0) > 0).sort((a, b) => (b.related_count ?? 0) - (a.related_count ?? 0));
  const others = tags.filter(t => !((t.related_count ?? 0) > 0));
  const visible = showAll ? [...related, ...others] : [...related, ...others.filter(t => tagIds.includes(t._id))];
  const hiddenCount = tags.length - visible.length;
  const shown = query ? tags.filter((t) => tagIds.includes(t._id) || t.name.toLowerCase().includes(query)) : visible;
  const add = () => {
    if (!input.trim()) return;
    onAddTag(input.trim());
    setInput('');
  };

  return (
    <div className="space-y-2" data-focus-target="tags" data-invalid={error ? true : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <label className={LABEL}>
          Thẻ sản phẩm <span className="text-rose-600" aria-hidden>*</span>
        </label>
        <span className="text-xs text-stone-500">Đã chọn {count}</span>
      </div>

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
          className={inputClass(undefined, 'flex-1 min-w-0')}
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="flex h-10 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-stone-300 bg-white px-3.5 text-[13px] font-semibold text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} /> Thêm thẻ
        </button>
      </div>

      <div
        className={`flex flex-wrap gap-2 rounded-lg border p-3 min-h-[52px] max-h-44 overflow-y-auto ${
          error ? 'border-rose-500 bg-rose-50/40' : 'border-stone-200 bg-stone-50'
        }`}
      >
        {catalogLoading && <span className="text-xs text-stone-500">Đang tải thẻ...</span>}
        {!catalogLoading && tags.length === 0 && newTagNames.length === 0 && (
          <span className="text-xs text-stone-500">Sàn chưa có thẻ nào. Hãy đề xuất thẻ mới ở ô bên trên.</span>
        )}
        {newTagNames.map((name) => (
          <span
            key={`new-${name}`}
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
          >
            #{name} <span className="font-normal text-amber-700">(Chờ duyệt)</span>
            <button
              type="button"
              onClick={() => onRemoveNewTag(name)}
              aria-label={`Bỏ thẻ ${name}`}
              className="ml-0.5 cursor-pointer text-amber-700 hover:text-amber-950"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {shown.map((tag) => {
          const picked = tagIds.includes(tag._id);
          return (
            <button
              key={tag._id}
              type="button"
              aria-pressed={picked}
              onClick={() => onToggleTag(tag._id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007700] ${
                picked
                  ? 'font-semibold text-white border-transparent'
                  : 'font-medium text-stone-700 bg-white border-stone-300 hover:border-stone-500'
              }`}
              style={picked ? { backgroundColor: tag.color || '#007700' } : undefined}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      {!query && (hiddenCount > 0 || showAll) && (
        <button
          type="button"
          onClick={() => setShowAll(v => !v)}
          className="text-xs font-semibold text-[#007700] hover:underline cursor-pointer"
        >
          {showAll ? 'Chỉ hiện thẻ hợp danh mục' : `Xem thêm ${hiddenCount} thẻ thuộc ngành hàng khác`}
        </button>
      )}

      {error && <p role="alert" className={ERROR_TEXT}>{error}</p>}
    </div>
  );
}
