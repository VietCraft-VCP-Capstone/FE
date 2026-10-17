import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { TrendLegend } from '../../../../shared/components/charts/TrendChart';
import { count, money } from '../../../../shared/utils/format';
import { RangeTabs } from '../../../seller/components/dashboard/SellerDashboardUi';
import { RANGE_OPTIONS, decimal, fullDate, shortDate } from '../../format';
import type { InsightMeta, ListingTimeseries, TimeRange } from '../../types';
import { DailyBars } from '../charts/DailyBars';
import { SourceFooter } from '../SourceFooter';
import { Chip, InsightCard, Note, type Tone } from '../ui';

function HalfChange({ values, what, unit }: { values: number[]; what: string; unit: string }) {
  const half = Math.floor(values.length / 2);
  if (half < 3) return <Chip tone="neutral">{what}: chưa đủ ngày để so sánh</Chip>;
  const before = values.slice(-2 * half, -half).reduce((s, v) => s + v, 0);
  const after = values.slice(-half).reduce((s, v) => s + v, 0);
  const change = before ? Math.round(((after - before) / before) * 100) : after ? 100 : 0;
  const flat = Math.abs(change) < 5;
  const Icon = flat ? Minus : change > 0 ? TrendingUp : TrendingDown;
  const tone: Tone = flat ? 'neutral' : change > 0 ? 'good' : 'bad';
  return (
    <Chip tone={tone} icon={<Icon size={12} aria-hidden />}>
      {what} {flat ? 'gần như không đổi' : `${change > 0 ? 'tăng' : 'giảm'} ${Math.abs(change)}%`}
      <span className="font-normal opacity-80"> · {count(after)} {unit} trong {half} ngày gần đây, trước đó {count(before)}</span>
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
        title="Mỗi ngày có bao nhiêu người xem"
        description={coTrungVi ? 'Cột xanh lá là số lượt xem sản phẩm này. Đường xanh dương là mức thường gặp của sản phẩm cùng loại.' : 'Mỗi cột là số lượt khách mở trang sản phẩm trong ngày.'}
        action={<RangeTabs<TimeRange> value={timeRange} onChange={setRange} options={[...RANGE_OPTIONS]} label="Khoảng thời gian" />}
        footer={<SourceFooter meta={meta} />}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <HalfChange values={data.series.map(p => p.views)} what="Lượt xem" unit="lượt" />
          <HalfChange values={data.series.map(p => p.orders)} what="Đơn hàng" unit="đơn" />
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
              { name: 'Tổng lượt xem', color: SERIES.green, total: count(data.totals.views) },
              ...(coTrungVi ? [{ name: 'Thường gặp trong danh mục', color: SERIES.blue, total: '' }] : []),
            ]}
          />
          {data.totals.conversion_pct != null && (
            <span className="text-xs text-stone-500">Cứ 100 người xem có khoảng <strong className="tabular-nums text-stone-800">{decimal(data.totals.conversion_pct, 1)}</strong> người đặt mua</span>
          )}
        </div>
      </InsightCard>

      <InsightCard
        title="Mỗi ngày có bao nhiêu người cho vào giỏ và đặt mua"
        description="Cột xanh dương là số lần khách cho sản phẩm vào giỏ. Cột xanh lá là số đơn khách đã đặt."
      >
        <DailyBars
          data={rows}
          series={[
            { key: 'carts', name: 'Cho vào giỏ', color: SERIES.blue, kind: 'bar' },
            { key: 'orders', name: 'Đặt mua', color: SERIES.green, kind: 'bar' },
          ]}
          formatValue={count}
          height={220}
          ariaLabel={`Số lần cho vào giỏ và số đơn đặt mua mỗi ngày ${khoang}`}
        />
        <div className="mt-3">
          <TrendLegend
            items={[
              { name: 'Lần cho vào giỏ', color: SERIES.blue, total: count(data.totals.carts) },
              { name: 'Đơn đặt mua', color: SERIES.green, total: count(data.totals.orders) },
            ]}
          />
        </div>
        <div className="mt-3">
          <Note>
            {data.totals.carts > 0 && <>Cứ 10 lần khách cho vào giỏ thì có khoảng <b>{decimal((data.totals.orders / data.totals.carts) * 10, 1)}</b> đơn được đặt. </>}
            Tiền bán được trong kỳ: <b>{money(data.totals.revenue_vnd)}</b>.
          </Note>
        </div>
      </InsightCard>
    </>
  );
}
