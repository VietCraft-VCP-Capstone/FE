/**
 * F28 phễu mua + F27 diễn biến theo ngày của MỘT sản phẩm.
 *
 *   GET /seller/analytics/listings/{id}/conversion
 *   GET /seller/analytics/listings/{id}/timeseries
 * Chỉ vẽ đầy đủ khi cả hai đã có số. Một trong hai chưa đủ dữ liệu thì gộp thành một
 * dòng tiến độ lượt xem, thay vì hai khối "Chưa đủ dữ liệu" to.
 */

import { Eye, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { TrendChart, TrendLegend } from '../../../shared/components/charts/TrendChart';
import { count, money } from '../../../shared/utils/format';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { NA, RANGE_OPTIONS, dateRange, decimal, fullDate, pct, shortDate } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel } from '../labels';
import type { ConversionDetail, InsightMeta, ListingConversion, ListingTimeseries, TimeRange, TrendDirection } from '../types';
import { FunnelBars, MiniStat } from './charts/MiniViz';
import { InsightBlock } from './InsightBlock';
import { SourceFooter } from './SourceFooter';
import { Chip, InsightCard, Note, type Tone } from './ui';

const RANGES: TimeRange[] = ['7d', '30d', '90d'];

const STEP_LABEL: Record<string, string> = {
  view_to_cart: 'từ xem sang thêm giỏ',
  cart_to_order: 'từ thêm giỏ sang đặt mua',
};

const TREND: Record<string, { word: string; tone: Tone; Icon: typeof TrendingUp }> = {
  up: { word: 'đang tăng', tone: 'good', Icon: TrendingUp },
  down: { word: 'đang giảm', tone: 'bad', Icon: TrendingDown },
  flat: { word: 'đi ngang', tone: 'neutral', Icon: Minus },
};

function TrendPill({ direction, slope, what }: { direction: TrendDirection | null; slope: number | null; what: string }) {
  const info = direction ? TREND[direction] : null;
  if (!info) return <Chip tone="neutral">{what}: chưa đủ dữ liệu</Chip>;
  return (
    <Chip tone={info.tone} icon={<info.Icon size={12} aria-hidden />}>
      {what} {info.word}
      {slope !== null && <span className="font-normal opacity-80"> ({pct(slope, 2)} mỗi ngày)</span>}
    </Chip>
  );
}

/** Một dòng thay cho hai khối trống khi chưa đủ lượt xem. */
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

function FunnelCard({ data, meta }: { data: ListingConversion; meta: InsightMeta }) {
  const weakLabel = data.weakest_step ? STEP_LABEL[data.weakest_step] ?? data.weakest_step : null;
  return (
    <InsightCard title="Phễu mua hàng" description={`Từ ${dateRange(data.window.from, data.window.to)}.`} footer={<SourceFooter meta={meta} />}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,260px)]">
        <FunnelBars
          steps={[
            { label: 'Người xem', value: data.funnel.views },
            { label: 'Thêm vào giỏ', value: data.funnel.carts, convPct: data.view_to_cart_pct, weakest: data.weakest_step === 'view_to_cart' },
            { label: 'Đặt mua', value: data.funnel.orders, convPct: data.cart_to_order_pct, weakest: data.weakest_step === 'cart_to_order' },
          ]}
        />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <MiniStat label="Xem thành mua" value={pct(data.view_to_order_pct, 2)} />
            <MiniStat
              label="Sản phẩm cùng danh mục"
              value={pct(data.category_avg_pct, 2)}
              hint={data.category_id ? categoryLabel(data.category_id) : undefined}
            />
            <MiniStat
              label="So với cùng danh mục"
              value={data.cr_index === null ? NA : `${decimal(data.cr_index)} lần`}
              hint={data.cr_index === null ? undefined : data.cr_index >= 1 ? 'Bán tốt hơn' : 'Bán kém hơn'}
            />
          </div>
          {weakLabel && <Note>Khách bỏ đi nhiều nhất ở bước {weakLabel}. Sửa chỗ này trước.</Note>}
        </div>
      </div>
      {data.tips.length > 0 && (
        <ul className="m-0 mt-5 list-none space-y-3 border-t border-stone-100 p-0 pt-4">
          {data.tips.map(tip => (
            <li key={tip.issue} className="rounded-md bg-amber-50 p-3.5">
              <p className="m-0 text-[13px] font-semibold text-amber-900">{tip.issue}</p>
              <p className="mb-0 mt-1 text-[13px] leading-relaxed text-amber-900/90">{tip.action}</p>
            </li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}

function SeriesCards({ data, meta, timeRange, setRange }: {
  data: ListingTimeseries;
  meta: InsightMeta;
  timeRange: TimeRange;
  setRange: (value: TimeRange) => void;
}) {
  const viewRows = data.series.map((point, i) => ({
    label: shortDate(point.date),
    views: point.views,
    median: data.category_median[i]?.views ?? 0,
  }));
  const actionRows = data.series.map(point => ({ label: shortDate(point.date), carts: point.carts, orders: point.orders }));

  return (
    <>
      <InsightCard
        title="Lượt xem theo ngày"
        description="So với mức thường gặp của sản phẩm cùng danh mục."
        action={<RangeTabs<TimeRange> value={timeRange} onChange={setRange} options={[...RANGE_OPTIONS]} label="Khoảng thời gian" />}
        footer={<SourceFooter meta={meta} />}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <TrendPill direction={data.trend?.views ?? null} slope={data.trend?.views_slope_pct_per_day ?? null} what="Lượt xem" />
          <TrendPill direction={data.trend?.orders ?? null} slope={data.trend?.orders_slope_pct_per_day ?? null} what="Đơn hàng" />
        </div>
        <TrendChart
          data={viewRows}
          series={[
            { key: 'views', name: 'Sản phẩm này', color: SERIES.green },
            { key: 'median', name: 'Thường gặp trong danh mục', color: SERIES.blue },
          ]}
          formatValue={count}
          ariaLabel={`Lượt xem của sản phẩm so với sản phẩm cùng danh mục, từ ${fullDate(data.from)} đến ${fullDate(data.to)}`}
        />
        <div className="mt-3">
          <TrendLegend
            items={[
              { name: 'Tổng lượt xem trong kỳ', color: SERIES.green, total: count(data.totals.views) },
              { name: 'Tỉ lệ mua', color: SERIES.blue, total: pct(data.totals.conversion_pct, 2) },
            ]}
          />
        </div>
      </InsightCard>

      <InsightCard title="Thêm giỏ và đặt mua theo ngày">
        <TrendChart
          data={actionRows}
          series={[
            { key: 'carts', name: 'Thêm giỏ', color: SERIES.blue },
            { key: 'orders', name: 'Đơn hàng', color: SERIES.green },
          ]}
          formatValue={count}
          height={220}
          ariaLabel={`Số lần thêm giỏ và số đơn từng ngày, từ ${fullDate(data.from)} đến ${fullDate(data.to)}`}
        />
        <div className="mt-3">
          <TrendLegend
            items={[
              { name: 'Tổng thêm giỏ', color: SERIES.blue, total: count(data.totals.carts) },
              { name: 'Tổng đơn', color: SERIES.green, total: count(data.totals.orders) },
            ]}
          />
        </div>
        <div className="mt-3">
          <Note>Doanh thu của sản phẩm trong kỳ: {money(data.totals.revenue_vnd)}.</Note>
        </div>
      </InsightCard>
    </>
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
      <SeriesCards data={s.data} meta={s.meta} timeRange={timeRange} setRange={setRange} />
    </>
  );
}
