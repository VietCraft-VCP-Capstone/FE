import { ShoppingBag, DollarSign, Eye, MessageSquare, Heart } from 'lucide-react';
import type { RankMetric, RankingItem } from '../../rankingTypes';
import { FOCUS } from '../health/healthStats';
import { METRICS, ranked, valueOf } from './rankingMetrics';

const METRIC_ICONS: Record<RankMetric, typeof ShoppingBag> = {
  units: ShoppingBag,
  revenue: DollarSign,
  views: Eye,
  cart_rate: MessageSquare,
  likes: Heart,
};

export function RankingHighlights({
  items,
  active,
  onPick,
}: {
  items: RankingItem[];
  active: RankMetric;
  onPick: (m: RankMetric) => void;
}) {
  return (
    <div role="group" aria-label="Sản phẩm dẫn đầu" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {METRICS.map(m => {
        const top = ranked(items, m.key)[0];
        const value = top ? valueOf(top, m.key) : null;
        const on = active === m.key;
        const Icon = METRIC_ICONS[m.key] ?? ShoppingBag;

        return (
          <button
            key={m.key}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(m.key)}
            className={`group flex min-w-0 cursor-pointer flex-col justify-between rounded-lg border p-3.5 text-left transition-all duration-150 ${FOCUS} ${
              on
                ? 'border-[#007700] bg-emerald-50/50 shadow-xs ring-1 ring-[#007700]'
                : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                {m.best}
              </span>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  on ? 'bg-emerald-100 text-[#007700]' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                }`}
              >
                <Icon size={13} />
              </div>
            </div>

            <span className="line-clamp-2 text-xs font-bold leading-snug text-stone-900 mb-1">
              {value ? top.title : 'Chưa có'}
            </span>

            {value !== null && value > 0 ? (
              <span className="text-xs font-extrabold text-[#007700] tabular-nums">
                {m.format(value)}
              </span>
            ) : (
              <span className="text-xs text-stone-400">—</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
