import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Minus, LucideIcon } from 'lucide-react';

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
    <div className="space-y-2 pt-2 border-t border-stone-100" data-focus-target="description">
      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
        Mô tả chi tiết sản phẩm
      </label>

      <div className="flex items-center gap-1 p-1.5 bg-stone-100 border border-stone-200 rounded-t-xl">
        {TOOLBAR.map((item, i) =>
          item === 'divider' ? (
            <span key={i} className="w-px h-4 bg-stone-300 mx-1" />
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => insertFormatting(item.prefix, item.suffix)}
              className="p-1.5 text-stone-600 hover:bg-white rounded cursor-pointer"
              title={item.title}
            >
              <item.icon size={14} />
            </button>
          )
        )}
      </div>

      <textarea
        id={EDITOR_ID}
        rows={4}
        placeholder="Nhập mô tả chi tiết sản phẩm, chất liệu vải, công nghệ in ấn, bảng size..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3.5 bg-stone-50/80 border border-stone-200 border-t-0 rounded-b-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] resize-y"
      />
    </div>
  );
}
