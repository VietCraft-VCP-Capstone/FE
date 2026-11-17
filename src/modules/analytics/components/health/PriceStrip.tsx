import { compactMoney } from '../../../../shared/utils/format';

export function PriceStrip({
  prices,
  mine,
  band,
}: {
  prices: number[];
  mine: number | null;
  band?: { low: number; high: number } | null;
  warn?: boolean;
}) {
  const sorted = [...prices].sort((a, b) => a - b);
  if (!sorted.length) return null;

  const minPrice = sorted[0];
  const maxPrice = sorted[sorted.length - 1];
  const bLow = band?.low ?? sorted[Math.floor(sorted.length * 0.25)] ?? minPrice;
  const bHigh = band?.high ?? sorted[Math.floor(sorted.length * 0.75)] ?? maxPrice;

  const scaleMin = Math.max(0, Math.floor(Math.min(minPrice, mine ?? minPrice) * 0.9));
  const scaleMax = Math.ceil(Math.max(maxPrice, mine ?? maxPrice) * 1.08);
  const totalSpan = scaleMax - scaleMin || 1;

  const bandLeftPct = Math.max(0, Math.min(100, ((bLow - scaleMin) / totalSpan) * 100));
  const bandWidthPct = Math.max(2, Math.min(100 - bandLeftPct, ((bHigh - bLow) / totalSpan) * 100));
  const minePct = mine !== null ? Math.max(4, Math.min(96, ((mine - scaleMin) / totalSpan) * 100)) : null;

  // 16-bin discrete frequency histogram
  const BINS = 16;
  const binStep = totalSpan / BINS;
  const bins = Array.from({ length: BINS }, (_, i) => {
    const lo = scaleMin + i * binStep;
    const hi = lo + binStep;
    const count = sorted.filter(p => (i === BINS - 1 ? p >= lo && p <= hi : p >= lo && p < hi)).length;
    const inBand = (lo >= bLow && lo <= bHigh) || (hi >= bLow && hi <= bHigh) || (lo <= bLow && hi >= bHigh);
    return { lo, hi, count, inBand };
  });
  const maxCount = Math.max(1, ...bins.map(b => b.count));

  return (
    <div className="space-y-3 pt-1">
      {/* 1. Visual Density & Spectrum Bar */}
      <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-3.5 pt-8 relative">
        {/* Diamond Pin for User's Price */}
        {mine !== null && minePct !== null && (
          <div
            className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center z-20 pointer-events-none transition-all duration-300"
            style={{ left: `${minePct}%` }}
          >
            <span className="rounded bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 shadow-xs whitespace-nowrap">
              Giá bạn: {compactMoney(mine)}
            </span>
            <span className="w-0 h-0 border-x-3 border-x-transparent border-t-3 border-t-stone-900" />
          </div>
        )}

        {/* Density Histogram Columns */}
        <div className="h-9 flex items-end gap-1 px-0.5">
          {bins.map((b, idx) => {
            const heightPct = b.count > 0 ? Math.max(18, Math.round((b.count / maxCount) * 100)) : 6;
            return (
              <div
                key={idx}
                title={`${compactMoney(b.lo)} - ${compactMoney(b.hi)}: ${b.count} shop`}
                className="flex-1 flex flex-col justify-end h-full cursor-default"
              >
                <div
                  className={`w-full rounded-t-xs transition-colors ${
                    b.inBand
                      ? 'bg-[#007700]'
                      : b.count > 0
                      ? 'bg-stone-300'
                      : 'bg-stone-200/40'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Continuous Baseline Track */}
        <div className="h-1.5 w-full rounded-full bg-stone-200/70 relative overflow-hidden mt-1">
          <div
            className="h-full rounded-full bg-[#007700]"
            style={{ left: `${bandLeftPct}%`, width: `${bandWidthPct}%`, position: 'absolute' }}
          />
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2 font-medium">
          <span>{compactMoney(scaleMin)}</span>
          <span className="text-[#007700] font-bold">
            Vùng phổ biến ({compactMoney(bLow)} – {compactMoney(bHigh)})
          </span>
          <span>{compactMoney(scaleMax)}</span>
        </div>
      </div>

      {/* 2. Three Metric Benchmark Pillars */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-2 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">Thấp nhất</span>
          <span className="text-xs font-black text-stone-800 tabular-nums">{compactMoney(minPrice)}</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">Sàn VietCraft</span>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#007700] block">Vùng phổ biến</span>
          <span className="text-xs font-black text-emerald-950 tabular-nums">{compactMoney(bLow)} – {compactMoney(bHigh)}</span>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">{sorted.length} shop cùng loại</span>
        </div>
        <div className="rounded-xl border border-stone-200/70 bg-stone-50/50 p-2 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">Cao nhất</span>
          <span className="text-xs font-black text-stone-800 tabular-nums">{compactMoney(maxPrice)}</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">Phân khúc cao</span>
        </div>
      </div>
    </div>
  );
}
