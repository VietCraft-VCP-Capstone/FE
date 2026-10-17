import type { RankMetric, RankingItem } from '../../rankingTypes';
import { FOCUS } from '../health/healthStats';
import { METRICS, ranked, valueOf } from './rankingMetrics';

export function RankingHighlights({ items, active, onPick }: { items: RankingItem[]; active: RankMetric; onPick: (m: RankMetric) => void }) {
  return (
    <div role="group" aria-label="Sản phẩm dẫn đầu" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {METRICS.map(m => {
        const top = ranked(items, m.key)[0];
        const value = top ? valueOf(top, m.key) : null;
        const on = active === m.key;
        return (
          <button
            key={m.key}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(m.key)}
            className={`flex min-w-0 cursor-pointer flex-col items-start rounded-md border px-4 py-3 text-left transition-colors duration-150 motion-reduce:transition-none ${FOCUS} ${on ? 'border-[#007700] bg-[#F3F7EE]' : 'border-stone-200 bg-white hover:border-stone-400'}`}
          >
            <span className="text-xs font-semibold text-stone-500">{m.best}</span>
            <span className="mt-1 line-clamp-2 text-[13.5px] font-bold leading-snug text-stone-900">{value ? top.title : 'Chưa có'}</span>
            {value !== null && value > 0 && <span className="mt-1 text-xs font-semibold text-[#005B00]">{m.format(value)}</span>}
          </button>
        );
      })}
    </div>
  );
}
