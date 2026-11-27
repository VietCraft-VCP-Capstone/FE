import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Minus, LucideIcon } from 'lucide-react';
import { HINT } from './form/formUi';

interface ProductFormDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const EDITOR_ID = 'product-description-editor';

type ToolbarItem = { icon: LucideIcon; title: string; prefix: string; suffix?: string } | 'divider';

const TOOLBAR: ToolbarItem[] = [
  { icon: Bold, title: 'In đậm', prefix: '**', suffix: '**' },
  { icon: Italic, title: 'In nghiêng', prefix: '*', suffix: '*' },
  'divider',
  { icon: List, title: 'Danh sách gạch đầu dòng', prefix: '\n- ' },
  { icon: ListOrdered, title: 'Danh sách đánh số', prefix: '\n1. ' },
  'divider',
  { icon: LinkIcon, title: 'Chèn link', prefix: '[', suffix: '](https://...)' },
  { icon: Minus, title: 'Đường kẻ', prefix: '\n---\n' },
];

export function ProductFormDescriptionEditor({ value, onChange }: ProductFormDescriptionEditorProps) {
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(EDITOR_ID) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || 'nội dung';
    const replacement = `${prefix}${selectedText}${suffix}`;
    onChange(text.substring(0, start) + replacement + text.substring(end));
  };

  return (
    <div className="space-y-1.5" data-focus-target="description">
      <div className="overflow-hidden rounded-lg border border-stone-300 bg-white transition-colors focus-within:border-[#007700] focus-within:ring-2 focus-within:ring-[#007700]/15">
        <div className="flex items-center gap-0.5 border-b border-stone-200 bg-stone-50 px-2 py-1.5">
          {TOOLBAR.map((item, i) =>
            item === 'divider' ? (
              <span key={i} className="mx-1 h-4 w-px bg-stone-300" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => insertFormatting(item.prefix, item.suffix)}
                className="cursor-pointer rounded p-1.5 text-stone-600 hover:bg-stone-200 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]"
                title={item.title}
                aria-label={item.title}
              >
                <item.icon size={15} />
              </button>
            )
          )}
        </div>
        <textarea
          id={EDITOR_ID}
          rows={7}
          aria-label="Mô tả chi tiết sản phẩm"
          placeholder="Kể về sản phẩm: chất liệu, kích thước, cách làm, cách bảo quản..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full resize-y p-3 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />
      </div>
      <p className={`m-0 ${HINT}`}>Hỗ trợ định dạng Markdown. {value.trim().length} ký tự.</p>
    </div>
  );
}
