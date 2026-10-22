import { useState, type ReactNode } from 'react';
import type { IntelAxisKey, ListingIntel } from '../../intelTypes';
import { SellChanceCard } from '../health/SellChanceCard';
import { ImagePanel } from './ImagePanel';
import { AXIS_KEYS, AXIS_SIMPLE } from './intelLabels';
import { KeywordPanel } from './KeywordPanel';
import { MarketPanel } from './MarketPanel';
import { TagPanel } from './TagPanel';
import { TrendTimeline } from './TrendTimeline';

type Part = IntelAxisKey | 'sell';

function panel(part: Part, data: ListingIntel, productId?: string): ReactNode {
  if (part === 'image') return <ImagePanel images={data.images} bare />;
  if (part === 'text') return <KeywordPanel keywords={data.keywords} material={data.material} bare />;
  if (part === 'tags') return <TagPanel tags={data.tags} suggested={data.suggested_tags} bare />;
  if (part === 'market') return <MarketPanel market={data.market} bare />;
  if (part === 'trend') return <TrendTimeline points={data.score_timeline} bare />;
  return productId ? <SellChanceCard productId={productId} /> : null;
}

function weakest(data: ListingIntel): IntelAxisKey {
  const scored = AXIS_KEYS.filter(k => data.axes[k].score !== null);
  return scored.length ? scored.reduce((a, b) => ((data.axes[b].score as number) < (data.axes[a].score as number) ? b : a)) : 'image';
}

export function PartTabs({ data, productId }: { data: ListingIntel; productId?: string }) {
  const [active, setActive] = useState<Part>(() => weakest(data));
  const parts: Part[] = productId ? [...AXIS_KEYS, 'sell'] : AXIS_KEYS;
  return (
    <section className="min-w-0 rounded-xl border border-stone-200 bg-white">
      <div role="tablist" aria-label="Phân tích từng phần" className="flex gap-1 overflow-x-auto border-b border-stone-100 px-3">
        {parts.map(p => {
          const selected = p === active;
          return (
            <button
              key={p} type="button" role="tab" aria-selected={selected} onClick={() => setActive(p)}
              className={`-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-0 border-b-2 bg-transparent px-3 py-3 text-[13px] font-semibold transition-colors ${selected ? 'border-[#007700] text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              {p === 'sell' ? 'Khả năng ra đơn' : AXIS_SIMPLE[p]}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="p-5">{panel(active, data, productId)}</div>
    </section>
  );
}
