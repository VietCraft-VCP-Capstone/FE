import { useEffect, useState } from 'react';

const MAX_DAYS = 366;
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
const span = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

export function rangeProblem(from: string, to: string): string | null {
  if (!from || !to) return 'Chọn đủ ngày bắt đầu và ngày kết thúc.';
  if (from > to) return 'Ngày bắt đầu phải trước ngày kết thúc.';
  if (to > today()) return 'Không chọn ngày trong tương lai.';
  if (span(from, to) >= MAX_DAYS) return `Chọn tối đa ${MAX_DAYS} ngày.`;
  return null;
}

export function CustomRange({ from, to, onApply }: { from: string; to: string; onApply: (from: string, to: string) => void }) {
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { setF(from); setT(to); setErr(null); }, [from, to]);

  const apply = () => {
    const e = rangeProblem(f, t);
    setErr(e);
    if (!e) onApply(f, t);
  };
  const input = 'h-7 rounded-lg border-none bg-transparent px-2 text-xs font-medium text-stone-800 tabular-nums hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]';

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`inline-flex items-center gap-1 rounded-xl border bg-white p-0.5 ${err ? 'border-red-300' : 'border-stone-200'}`}>
        <input type="date" aria-label="Từ ngày" value={f} max={t || today()} onChange={e => setF(e.target.value)} className={input} />
        <span className="text-xs text-stone-400">→</span>
        <input type="date" aria-label="Đến ngày" value={t} min={f} max={today()} onChange={e => setT(e.target.value)} className={input} />
        <button type="button" onClick={apply} className="h-7 rounded-[10px] bg-[#007700] px-3 text-xs font-semibold text-white hover:bg-[#005B00]">
          Xem
        </button>
      </div>
      {err && <p role="alert" className="m-0 text-xs text-red-600">{err}</p>}
    </div>
  );
}
