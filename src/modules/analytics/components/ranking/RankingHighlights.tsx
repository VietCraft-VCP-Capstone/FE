import { ShoppingBag, DollarSign, Eye, MessageSquare, Heart, Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RankMetric, RankingItem } from '../../rankingTypes';
import { cleanTitle } from '../../format';
import { count } from '../../../../shared/utils/format';
import { detailLink } from '../health/HealthCells';
import { Thumb } from '../health/Thumb';
import { METRICS, ranked, valueOf, metricOf } from './rankingMetrics';

const METRIC_ICONS: Record<RankMetric, typeof ShoppingBag> = {
  units: ShoppingBag,
  revenue: DollarSign,
  views: Eye,
  cart_rate: MessageSquare,
  likes: Heart,
};

function formatCompactValue(key: RankMetric, val: number): string {
  if (key === 'revenue') {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}tr`;
    if (val >= 1_000) return `${Math.round(val / 1000)}k`;
    return `${val}đ`;
  }
  if (key === 'units') return `${count(val)} món`;
  if (key === 'views') return `${count(val)} xem`;
  if (key === 'cart_rate') return `${val}%`;
  if (key === 'likes') return `${count(val)} thích`;
  return String(val);
}

export function RankingHighlights({
  items,
  active,
  onPick,
}: {
  items: RankingItem[];
  active: RankMetric;
  onPick: (m: RankMetric) => void;
}) {
  const activeDef = metricOf(active);
  const top = ranked(items, active)[0];
  const topValue = top ? valueOf(top, active) : null;
  const topMarket = top?.market[active];
  const hasData = topValue !== null && topValue > 0;

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-stone-100/80 border border-stone-200/70 w-fit">
        {METRICS.map(m => {
          const on = active === m.key;
          const Icon = METRIC_ICONS[m.key] ?? ShoppingBag;
          const topItem = ranked(items, m.key)[0];
          const val = topItem ? valueOf(topItem, m.key) : null;
          const hasVal = val !== null && val > 0;

          return (
            <button
              key={m.key}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(m.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                on
                  ? 'bg-white text-stone-900 shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <Icon size={15} className={on ? 'text-[#007700]' : 'text-stone-400'} />
              <span>{m.label}</span>
              {hasVal && (
                <span
                  className={`text-[11px] tabular-nums px-2 py-0.5 rounded-md font-bold ${
                    on ? 'bg-emerald-50 text-[#007700]' : 'bg-stone-200/70 text-stone-600'
                  }`}
                >
                  {formatCompactValue(m.key, val)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasData && top && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-r from-emerald-50/40 via-white to-stone-50/30 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <Thumb src={top.thumbnail} size={52} />
                <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#007700] text-white text-[10px] font-black shadow-xs">
                  #1
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11.5px] font-bold text-[#007700] flex items-center gap-1">
                    <Trophy size={12} /> Quán quân {activeDef.label.toLowerCase()} của shop
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-[11px] text-stone-500 font-medium">{top.category}</span>
                </div>
                <Link
                  to={detailLink(top.product_id)}
                  className="block truncate text-sm font-bold text-stone-900 hover:text-[#007700] transition-colors leading-snug no-underline"
                  title={cleanTitle(top.title)}
                >
                  {cleanTitle(top.title)}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 border-t sm:border-t-0 sm:border-l border-stone-100 pt-3 sm:pt-0 sm:pl-6 text-xs">
              <div>
                <div className="text-[10.5px] text-stone-400 font-medium">Chỉ số tại shop</div>
                <div className="text-sm font-extrabold tabular-nums text-stone-900">
                  {activeDef.format(topValue)}
                </div>
              </div>
              {topMarket && (
                <div>
                  <div className="text-[10.5px] text-stone-400 font-medium">Vị thế toàn sàn</div>
                  <div className="text-xs font-bold tabular-nums text-[#007700]">
                    Hạng #{topMarket.rank} <span className="text-stone-400 text-[10.5px] font-normal">/ {topMarket.of}</span>
                  </div>
                </div>
              )}
              <Link
                to={detailLink(top.product_id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 text-white px-3.5 py-2 text-xs font-bold hover:bg-stone-800 transition no-underline shadow-2xs shrink-0"
              >
                <span>Chi tiết</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
