import { Eye } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RANGE_OPTIONS } from '../format';
import { useInsight } from '../hooks/useInsight';
import type { ConversionDetail, ListingConversion, ListingTimeseries, TimeRange } from '../types';
import { InsightBlock } from './InsightBlock';
import { DailyCards } from './listing/DailyCards';
import { FunnelCard } from './listing/FunnelCard';

const RANGES: TimeRange[] = RANGE_OPTIONS.map(o => o.value);

function CollectingLine({ detail }: { detail?: ConversionDetail | null }) {
  return (
    <p className="m-0 flex items-start gap-2 rounded-md border border-stone-200 bg-white px-4 py-3 text-[13px] text-stone-600">
      <Eye size={16} className="mt-0.5 shrink-0 text-stone-400" aria-hidden />
      <span>
        <strong className="font-semibold text-stone-800">Lượt xem & tỉ lệ mua:</strong> đang thu thập
        {detail ? ` — ${detail.views_30d.toLocaleString('vi-VN')}/${detail.min_views} lượt xem trong 30 ngày` : ''}
      </span>
    </p>
  );
}

export function ListingTraffic({ id, conversionDetail }: { id: string; conversionDetail?: ConversionDetail | null }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get('range');
  const timeRange: TimeRange = RANGES.includes(raw as TimeRange) ? (raw as TimeRange) : '30d';
  const conversion = useInsight<ListingConversion>(`/listings/${id}/conversion`);
  const series = useInsight<ListingTimeseries>(`/listings/${id}/timeseries`, { timeRange });

  const setRange = (value: TimeRange) => {
    const next = new URLSearchParams(params);
    next.set('range', value);
    setParams(next, { replace: true });
  };

  const c = conversion.state;
  const s = series.state;
  if (c.kind === 'loading' || s.kind === 'loading') return null;
  if (c.kind === 'insufficient' || s.kind === 'insufficient') return <CollectingLine detail={conversionDetail} />;
  if (c.kind !== 'ready') return <InsightBlock state={c} onRetry={conversion.reload} compact>{() => null}</InsightBlock>;
  if (s.kind !== 'ready') return <InsightBlock state={s} onRetry={series.reload} compact>{() => null}</InsightBlock>;

  return (
    <>
      <FunnelCard data={c.data} meta={c.meta} />
      <DailyCards data={s.data} meta={s.meta} timeRange={timeRange} setRange={setRange} />
    </>
  );
}
