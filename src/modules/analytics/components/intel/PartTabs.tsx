import { useState, type ReactNode } from 'react';
import { Tabs } from 'antd';
import { Layers, Image, FileText, Tag, BarChart2, TrendingUp, DollarSign } from 'lucide-react';
import type { IntelAxisKey, ListingIntel } from '../../intelTypes';
import { SellChanceCard } from '../health/SellChanceCard';
import { ImagePanel } from './ImagePanel';
import { AXIS_KEYS, AXIS_SIMPLE } from './intelLabels';
import { KeywordPanel } from './KeywordPanel';
import { MarketPanel } from './MarketPanel';
import { TagPanel } from './TagPanel';
import { TrendTimeline } from './TrendTimeline';

type Part = IntelAxisKey | 'sell';

const TAB_ICONS: Record<Part, typeof Image> = {
  image: Image,
  text: FileText,
  tags: Tag,
  market: DollarSign,
  trend: TrendingUp,
  sell: BarChart2,
};

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

export function PartTabs({
  data,
  productId,
  bare = false,
}: {
  data: ListingIntel;
  productId?: string;
  bare?: boolean;
}) {
  const [active, setActive] = useState<Part>(() => weakest(data));
  const parts: Part[] = productId ? [...AXIS_KEYS, 'sell'] : AXIS_KEYS;

  const tabItems = parts.map(p => {
    const Icon = TAB_ICONS[p] ?? Layers;
    return {
      key: p,
      label: (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Icon size={14} />
          {p === 'sell' ? 'Khả năng ra đơn' : AXIS_SIMPLE[p]}
        </span>
      ),
      children: (
        <div className="pt-2">
          {panel(p, data, productId)}
        </div>
      ),
    };
  });

  if (bare) {
    return <Tabs activeKey={active} onChange={key => setActive(key as Part)} items={tabItems} className="mt-1" />;
  }

  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-5 md:p-6 shadow-xs transition-shadow hover:shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#007700] ring-1 ring-[#007700]/15">
          <Layers size={18} />
        </div>
        <div>
          <h2 className="m-0 font-jakarta text-base font-bold tracking-tight text-stone-900">
            Xem kỹ từng phần (Chẩn đoán chuyên sâu)
          </h2>
          <p className="m-0 mt-0.5 text-xs text-stone-500">
            Phân tích chi tiết chất lượng ảnh chụp, bộ từ khoá SEO, tag phân loại và năng lực cạnh tranh
          </p>
        </div>
      </div>
      <Tabs activeKey={active} onChange={key => setActive(key as Part)} items={tabItems} className="mt-2" />
    </section>
  );
}
