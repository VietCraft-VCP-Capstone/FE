import { FOCUS } from './healthStats';

export function FilterEmpty({ active, clearAll }: { active: { label: string; clear: () => void }[]; clearAll: () => void }) {
  return (
    <div className="space-y-3 py-8 text-sm text-stone-600">
      <p className="m-0">
        {active.length > 1
          ? `Không có sản phẩm nào cùng lúc khớp ${active.map(f => f.label).join(' và ')}.`
          : 'Không có sản phẩm nào khớp bộ lọc.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {active.length > 1 && active.map(f => (
          <button key={f.label} type="button" onClick={f.clear} className={`cursor-pointer rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-[#007700] hover:text-[#007700] ${FOCUS}`}>
            Bỏ {f.label}
          </button>
        ))}
        <button type="button" onClick={clearAll} className={`cursor-pointer rounded-md border-none bg-[#007700] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#005B00] ${FOCUS}`}>
          Xoá hết bộ lọc
        </button>
      </div>
    </div>
  );
}
