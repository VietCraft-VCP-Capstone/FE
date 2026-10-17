import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { TrendLegend } from '../../../../shared/components/charts/TrendChart';
import { count, money } from '../../../../shared/utils/format';
import { RangeTabs } from '../../../seller/components/dashboard/SellerDashboardUi';
import { RANGE_OPTIONS, fullDate, pct, shortDate } from '../../format';
import type { InsightMeta, ListingTimeseries, TimeRange, TrendDirection } from '../../types';
import { DailyBars } from '../charts/DailyBars';
import { SourceFooter } from '../SourceFooter';
import { Chip, InsightCard, Note, type Tone } from '../ui';

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

export function DailyCards({ data, meta, timeRange, setRange }: {
  data: ListingTimeseries;
  meta: InsightMeta;
  timeRange: TimeRange;
  setRange: (value: TimeRange) => void;
}) {
  const coTrungVi = data.category_median.length > 0;
  const rows = data.series.map((p, i) => ({
    label: shortDate(p.date),
    views: p.views,
    carts: p.carts,
    orders: p.orders,
    ...(coTrungVi ? { median: data.category_median[i]?.views ?? 0 } : {}),
  }));
  const khoang = `từ ${fullDate(data.from)} đến ${fullDate(data.to)}`;

  return (
    <>
      <InsightCard
        title="Lượt xem theo ngày"
        description={coTrungVi ? 'Cột là lượt xem của sản phẩm, đường là mức thường gặp trong danh mục.' : 'Lượt xem của sản phẩm mỗi ngày.'}
        action={<RangeTabs<TimeRange> value={timeRange} onChange={setRange} options={[...RANGE_OPTIONS]} label="Khoảng thời gian" />}
        footer={<SourceFooter meta={meta} />}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <TrendPill direction={data.trend?.views ?? null} slope={data.trend?.views_slope_pct_per_day ?? null} what="Lượt xem" />
          <TrendPill direction={data.trend?.orders ?? null} slope={data.trend?.orders_slope_pct_per_day ?? null} what="Đơn hàng" />
        </div>
        <DailyBars
          data={rows}
          series={[
            { key: 'views', name: 'Sản phẩm này', color: SERIES.green, kind: 'bar' },
            ...(coTrungVi ? [{ key: 'median', name: 'Thường gặp trong danh mục', color: SERIES.blue, kind: 'line' as const }] : []),
          ]}
          formatValue={count}
          ariaLabel={`Lượt xem mỗi ngày ${khoang}`}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <TrendLegend
            items={[
              { name: 'Lượt xem trong kỳ', color: SERIES.green, total: count(data.totals.views) },
              ...(coTrungVi ? [{ name: 'Thường gặp trong danh mục', color: SERIES.blue, total: '' }] : []),
            ]}
          />
          <span className="text-xs text-stone-500">Tỉ lệ mua trong kỳ <strong className="tabular-nums text-stone-800">{pct(data.totals.conversion_pct, 2)}</strong></span>
        </div>
      </InsightCard>

      <InsightCard title="Thêm giỏ và đặt mua theo ngày">
        <DailyBars
          data={rows}
          series={[
            { key: 'carts', name: 'Thêm giỏ', color: SERIES.blue, kind: 'bar' },
            { key: 'orders', name: 'Đơn hàng', color: SERIES.green, kind: 'bar' },
          ]}
          formatValue={count}
          height={220}
          ariaLabel={`Số lần thêm giỏ và số đơn mỗi ngày ${khoang}`}
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
