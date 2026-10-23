import { vnd } from '../../format';
import { AxisLabel, Marker } from './Marker';

export function PriceRange({ price, low, mid, high }: { price: number | null; low: number; mid: number | null; high: number }) {
  const values = [price, low, mid, high].filter((v): v is number => typeof v === 'number' && v > 0);
  const lo = Math.min(...values) * 0.85;
  const hi = Math.max(...values) * 1.1;
  const at = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const label = `Khoảng tham khảo ${vnd(low)} đến ${vnd(high)}${price ? `, giá bạn ${vnd(price)}` : ''}`;
  return (
    <div role="img" aria-label={label} className="mt-4">
      <div className="relative h-10">
        {price !== null && <Marker pos={at(price)} label={`Giá bạn ${vnd(price)}`} />}
      </div>
      <div className="relative h-1.5 rounded-sm bg-stone-200">
        <div className="absolute inset-y-0 rounded-sm bg-[#007700]/60" style={{ left: `${at(low)}%`, width: `${at(high) - at(low)}%` }} />
        {mid !== null && <div className="absolute -bottom-1 -top-1 border-l-2 border-white" style={{ left: `${at(mid)}%` }} />}
      </div>
      <div className="relative mt-3 h-4 text-[11px] tabular-nums text-stone-500">
        <AxisLabel pos={at(low)}>{vnd(low)}</AxisLabel>
        <AxisLabel pos={at(high)}>{vnd(high)}</AxisLabel>
      </div>
    </div>
  );
}
