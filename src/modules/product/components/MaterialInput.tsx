import { useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

export const MATERIAL_SUGGESTIONS = [
  'cotton', 'thun', 'linen', 'lanh', 'đũi', 'lụa', 'tơ tằm', 'len', 'nỉ', 'dạ', 'jean', 'denim', 'kaki', 'kate',
  'voan', 'chiffon', 'ren', 'nhung', 'da bò', 'da thật', 'da pu', 'simili', 'canvas', 'cói', 'mây', 'tre', 'gỗ',
  'gốm', 'sứ', 'thủy tinh', 'inox', 'bạc 925', 'đồng', 'thổ cẩm', 'vải bố', 'polyester', 'spandex',
];

const MAX_ITEMS = 5;
const MAX_LENGTH = 40;
const HINT = `Tối đa ${MAX_ITEMS} chất liệu. Gõ để chọn gợi ý hoặc nhập chất liệu khác rồi bấm Enter.`;

export function MaterialInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const taken = new Set(value.map(v => v.toLowerCase()));

  const add = () => {
    const name = draft.trim().slice(0, MAX_LENGTH);
    if (!name) return;
    if (value.length >= MAX_ITEMS) return setNotice(`Đã đủ ${MAX_ITEMS} chất liệu, bỏ bớt một mục để thêm "${name}".`);
    if (value.some(v => v.toLowerCase() === name.toLowerCase())) return setNotice(`"${name}" đã có trong danh sách.`);
    onChange([...value, name]);
    setDraft('');
    setNotice('');
    inputRef.current?.focus();
  };

  const remove = (name: string) => {
    onChange(value.filter(v => v !== name));
    setNotice('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-jakarta text-xs font-bold uppercase tracking-wider text-stone-700">Chất liệu</label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={id}
          type="text"
          list={`${id}-list`}
          value={draft}
          maxLength={MAX_LENGTH}
          onChange={e => {
            setDraft(e.target.value);
            setNotice('');
          }}
          onKeyDown={e => {
            if (e.key !== 'Enter' || e.nativeEvent.isComposing || e.keyCode === 229) return;
            e.preventDefault();
            add();
          }}
          placeholder="VD: cotton, gốm, da bò..."
          className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#007700] focus:outline-none focus:ring-2 focus:ring-[#007700]/20"
        />
        <datalist id={`${id}-list`}>
          {MATERIAL_SUGGESTIONS.filter(s => !taken.has(s.toLowerCase())).map(s => <option key={s} value={s} />)}
        </datalist>
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="shrink-0 cursor-pointer rounded-xl bg-stone-100 px-3.5 text-xs font-bold text-stone-700 hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Thêm
        </button>
      </div>
      {value.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {value.map(m => (
            <li key={m} className="inline-flex items-center gap-1 rounded-lg border border-[#007700]/20 bg-[#EAF0E2] px-2.5 py-1 text-xs font-semibold text-[#005B00]">
              {m}
              <button type="button" onClick={() => remove(m)} aria-label={`Bỏ chất liệu ${m}`} className="cursor-pointer rounded text-[#005B00] hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]">
                <X size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p role="status" className={`m-0 text-xs ${notice ? 'font-semibold text-amber-800' : 'text-stone-500'}`}>{notice || HINT}</p>
    </div>
  );
}
