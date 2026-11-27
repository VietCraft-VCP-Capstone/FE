import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { FormNavItem, NavState } from './formSections';

const MARKER: Record<NavState, string> = {
  done: 'bg-[#007700] border-[#007700] text-white',
  todo: 'bg-white border-stone-300 text-stone-600',
  error: 'bg-rose-600 border-rose-600 text-white',
};

interface ProductFormNavProps {
  items: FormNavItem[];
  activeId: string;
  onJump: (id: string) => void;
  children?: ReactNode;
}

export function ProductFormNav({ items, activeId, onJump, children }: ProductFormNavProps) {
  const done = items.filter((i) => i.state === 'done').length;

  return (
    <nav aria-label="Các phần của biểu mẫu" className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-stone-200 bg-white p-4 lg:flex">
      <div>
        <div className="flex items-baseline justify-between text-xs text-stone-600">
          <span>Tiến độ</span>
          <b className="tabular-nums text-stone-900">{done}/{items.length}</b>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-sm bg-stone-200" aria-hidden>
          <div className="h-full bg-[#007700] transition-[width] duration-300" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      </div>

      <ol className="m-0 list-none space-y-0.5 p-0">
        {items.map((item, i) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onJump(item.id)}
                aria-current={active ? 'step' : undefined}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] ${
                  active ? 'bg-[#EAF0E2]' : 'hover:bg-stone-100'
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center border text-[11px] font-bold tabular-nums ${MARKER[item.state]}`}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                  aria-hidden
                >
                  {item.state === 'done' ? <Check size={13} strokeWidth={3} /> : item.state === 'error' ? '!' : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] font-semibold ${active ? 'text-[#005B00]' : 'text-stone-900'}`}>{item.label}</span>
                  <span className={`block truncate text-xs ${item.state === 'error' ? 'font-medium text-rose-600' : 'text-stone-500'}`}>
                    {item.state === 'error' ? 'Cần sửa' : item.meta}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {children && <div className="mt-auto">{children}</div>}
    </nav>
  );
}
