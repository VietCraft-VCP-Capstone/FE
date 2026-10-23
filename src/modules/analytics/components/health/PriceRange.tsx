import { vnd } from '../../format';

export function PriceRange({ price, low, mid, high }: { price: number | null; low: number; mid: number | null; high: number }) {
  const values = [price, low, mid, high].filter((v): v is number => typeof v === 'number' && v > 0);
  if (values.length === 0) return null;

  const lo = Math.min(...values) * 0.85;
  const hi = Math.max(...values) * 1.1;
  const at = (v: number) => Math.max(4, Math.min(96, ((v - lo) / (hi - lo)) * 100));
  const label = `Khoảng tham khảo ${vnd(low)} đến ${vnd(high)}${price ? `, giá bạn ${vnd(price)}` : ''}`;

  const pricePos = price !== null ? at(price) : null;
  const lowPos = at(low);
  const highPos = at(high);
  const midPos = mid !== null ? at(mid) : null;

  return (
    <div role="img" aria-label={label} className="mt-5 w-full">
      {/* Current price marker */}
      <div className="relative mb-2 h-7">
        {pricePos !== null && (
          <div
            className="absolute -translate-x-1/2 transition-all duration-300"
            style={{ left: `${pricePos}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="whitespace-nowrap rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                Bạn: {vnd(price)}
              </span>
              <span className="h-2 w-0.5 bg-stone-900" />
            </div>
          </div>
        )}
      </div>

      {/* Main Track */}
      <div className="relative h-3 w-full rounded-full bg-stone-100 p-0.5 shadow-inner">
        {/* Recommended range zone */}
        <div
          className="absolute inset-y-0.5 rounded-full bg-gradient-to-r from-emerald-500/30 via-emerald-500/50 to-emerald-500/30 ring-1 ring-emerald-500/30"
          style={{ left: `${lowPos}%`, width: `${Math.max(4, highPos - lowPos)}%` }}
        />

        {/* Median benchmark mark */}
        {midPos !== null && (
          <div
            className="absolute -bottom-1 -top-1 w-1 -translate-x-1/2 rounded-full bg-[#007700] ring-2 ring-white shadow-xs"
            style={{ left: `${midPos}%` }}
            title={`Mức giữa: ${vnd(mid)}`}
          />
        )}
      </div>

      {/* Benchmark labels */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-stone-500">
        <span>Từ {vnd(low)}</span>
        {mid !== null && (
          <span className="font-semibold text-stone-700">Mức giữa: {vnd(mid)}</span>
        )}
        <span>Đến {vnd(high)}</span>
      </div>
    </div>
  );
}
