import { compactMoney } from '../../../../shared/utils/format';
import type { ListingHealth } from '../../healthTypes';

const MIN_PEERS = 8;

const ADVICE = {
  low: 'Giá thấp giúp dễ chốt đơn. Kiểm tra lại giá vốn và phí sàn để vẫn có lãi.',
  mid: null,
  high: 'Giá cao hơn vẫn bán được nếu chất liệu hoặc thiết kế tốt hơn. Hãy nêu rõ điểm đó trong mô tả và ảnh cận cảnh.',
};

export function PriceCompare({ data }: { data: ListingHealth }) {
  const row = data.breakdown.find(r => r.key === 'price');
  if (!row) return null;
  const ref = row.reference;
  const prices = ref?.prices ?? [];
  const mine = row.value;
  const comparable = Boolean(ref?.comparable) && prices.length > 0;

  const sorted = [...prices].sort((a, b) => a - b);
  const low = row.full?.low ?? row.suggestion?.low ?? (sorted.length ? sorted[Math.floor(sorted.length * 0.25)] : 0);
  const high = row.full?.high ?? row.suggestion?.high ?? (sorted.length ? sorted[Math.floor(sorted.length * 0.75)] : 0);
  const at: keyof typeof ADVICE = mine !== null && low > 0 && mine < low ? 'low' : mine !== null && high > 0 && mine > high ? 'high' : 'mid';

  const verdict = {
    low: `Giá của bạn thấp hơn đa số shop ${compactMoney(low - (mine ?? 0))}`,
    mid: 'Giá của bạn nằm trong vùng đa số shop đang bán',
    high: `Giá của bạn cao hơn đa số shop ${compactMoney((mine ?? 0) - high)}`,
  }[at];

  const bands = [
    { key: 'low', label: 'Thấp hơn', range: `dưới ${compactMoney(low)}` },
    { key: 'mid', label: 'Đa số shop', range: `${compactMoney(low)} đến ${compactMoney(high)}` },
    { key: 'high', label: 'Cao hơn', range: `trên ${compactMoney(high)}` },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="m-0 text-base font-bold text-stone-900">So sánh giá</h2>
        {comparable && <span className="text-xs text-stone-500">so với {ref?.n} shop</span>}
      </div>

      {mine === null ? (
        <p className="m-0 mt-2 text-sm text-stone-500">Sản phẩm chưa có giá bán.</p>
      ) : !comparable ? (
        <p className="m-0 mt-2 text-sm leading-relaxed text-stone-600">
          Chưa đủ sản phẩm cùng chất liệu để so giá (đã có {ref?.same_n ?? 0}/{MIN_PEERS}). Trong lúc chờ, giá chưa tính vào điểm và không bị trừ.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          <p className="m-0 text-sm font-semibold text-stone-900">{verdict}</p>
          <ol className="m-0 grid list-none grid-cols-3 divide-x divide-stone-200 overflow-hidden rounded-xl border border-stone-200 p-0 text-center">
            {bands.map(b => (
              <li key={b.key} aria-current={b.key === at} className={`px-1.5 py-2 ${b.key === at ? 'bg-[#EAF0E2]' : 'bg-white'}`}>
                <div className={`text-xs font-semibold ${b.key === at ? 'text-[#005B00]' : 'text-stone-600'}`}>{b.label}</div>
                <div className="mt-0.5 text-xs tabular-nums text-stone-500">{b.range}</div>
              </li>
            ))}
          </ol>
          {ADVICE[at] && <p className="m-0 text-xs leading-relaxed text-stone-600">{ADVICE[at]}</p>}
        </div>
      )}
    </div>
  );
}
