/**
 * F29 + F28 + F27 cho MỘT sản phẩm. Trả lời: "Sản phẩm này đang lên hay xuống, hỏng ở
 * khâu nào, và cần sửa gì trước?"
 *
 * Ba endpoint, ba khối độc lập:
 *   GET /seller/analytics/listings/{id}/health      điểm sức khoẻ và việc cần làm
 *   GET /seller/analytics/listings/{id}/conversion  phễu xem -> giỏ -> mua
 *   GET /seller/analytics/listings/{id}/timeseries  diễn biến theo ngày
 *
 * Mỗi khối tự xử trạng thái của mình. Gộp ba lời gọi vào một khối thì một endpoint chưa
 * đủ dữ liệu sẽ làm trắng cả trang, trong khi hai cái kia có số để xem.
 */

import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { TrendChart, TrendLegend } from '../../../shared/components/charts/TrendChart';
import { count, money } from '../../../shared/utils/format';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { FunnelBars, MiniStat, ScoreBars } from '../components/charts/MiniViz';
import { Chip, InsightCard, Note, type Tone } from '../components/ui';
import { NA, RANGE_OPTIONS, dateRange, decimal, fullDate, pct, shortDate } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel } from '../labels';
import type { HealthAxis, ListingConversion, ListingHealth, ListingTimeseries, TimeRange, TrendDirection } from '../types';

const RANGES: TimeRange[] = ['7d', '30d', '90d'];

const AXIS_LABEL: Record<HealthAxis, string> = {
  conversion: 'Tỉ lệ chuyển đổi',
  rating: 'Điểm đánh giá',
  content: 'Nội dung listing',
  stock: 'Tồn kho',
  freshness: 'Độ mới',
};

const STEP_LABEL: Record<string, string> = {
  view_to_cart: 'từ xem sang thêm giỏ',
  cart_to_order: 'từ thêm giỏ sang đặt mua',
};

/** Dải điểm sức khoẻ: luôn kèm chữ, không chỉ dựa vào màu. */
function bandTone(band: string): Tone {
  if (band.includes('tốt')) return 'good';
  if (band.includes('kém')) return 'bad';
  return 'warn';
}

function TrendPill({ direction, slope, threshold, what }: {
  direction: TrendDirection | null;
  slope: number | null;
  threshold: number;
  what: string;
}) {
  const map: Record<string, { label: string; tone: Tone; Icon: typeof TrendUpIcon }> = {
    up: { label: `${what} đang tăng`, tone: 'good', Icon: TrendingUp },
    down: { label: `${what} đang giảm`, tone: 'bad', Icon: TrendingDown },
    flat: { label: `${what} đi ngang`, tone: 'neutral', Icon: Minus },
  };
  const info = direction ? map[direction] : null;
  if (!info) return <Chip tone="neutral">{what}: chưa đủ dữ liệu để kết luận</Chip>;
  return (
    <Chip tone={info.tone} icon={<info.Icon size={12} aria-hidden />}>
      {info.label}
      {slope !== null && <span className="font-normal opacity-80"> ({pct(slope, 2)} mỗi ngày, cờ bật khi vượt {pct(threshold, 0)})</span>}
    </Chip>
  );
}
const TrendUpIcon = TrendingUp;

export function ListingDetailPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const raw = params.get('range');
  const timeRange: TimeRange = RANGES.includes(raw as TimeRange) ? (raw as TimeRange) : '30d';

  const health = useInsight<ListingHealth>(id ? `/listings/${id}/health` : null);
  const conversion = useInsight<ListingConversion>(id ? `/listings/${id}/conversion` : null);
  const series = useInsight<ListingTimeseries>(id ? `/listings/${id}/timeseries` : null, { timeRange });

  const setRange = (value: TimeRange) => {
    const next = new URLSearchParams(params);
    next.set('range', value);
    setParams(next, { replace: true });
  };

  // Tên sản phẩm lấy từ khối nào có trước, để tiêu đề không phải chờ cả ba.
  const title =
    (health.state.kind === 'ready' && health.state.data.title) ||
    (conversion.state.kind === 'ready' && conversion.state.data.title) ||
    (series.state.kind === 'ready' && series.state.data.title) ||
    id;

  return (
    <InsightPage
      title={title}
      question="Sản phẩm này đang lên hay xuống, hỏng ở khâu nào, và cần sửa gì trước?"
      breadcrumb={[
        { label: 'Sức khoẻ sản phẩm', to: '/seller/insights/listings' },
        { label: title },
      ]}
    >
      <div className="space-y-5">
        {/* ------------------------------------------------ F29 điểm sức khoẻ -- */}
        <InsightBlock state={health.state} onRetry={health.reload}>
          {(data, meta) => (
            <InsightCard
              title="Điểm sức khoẻ"
              description="Chấm trên năm trục, mỗi trục một trọng số. Điểm từ 80 là tốt, 50 đến 79 là cần cải thiện, dưới 50 là kém."
              footer={<SourceFooter meta={meta} limitation={data.note} />}
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="font-jakarta text-5xl font-extrabold leading-none text-stone-900">{decimal(data.health_score, 1)}</span>
                      <span className="pb-1 text-sm text-stone-400">trên 100</span>
                    </div>
                    <div className="mt-2">
                      <Chip tone={bandTone(data.band)}>{data.band}</Chip>
                    </div>
                    <p className="mb-0 mt-2 text-xs text-stone-500">Chấm ngày {fullDate(data.date)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-stone-100 pt-4">
                    <MiniStat
                      label="Chuyển đổi"
                      value={pct(data.conversion_rate, 2)}
                      hint={data.category_avg_cr === null ? undefined : `Danh mục ${pct(data.category_avg_cr, 2)}`}
                    />
                    <MiniStat
                      label="So với danh mục"
                      value={data.cr_index === null ? NA : `${decimal(data.cr_index)} lần`}
                      hint={data.cr_index === null ? undefined : data.cr_index >= 1 ? 'Tốt hơn mặt bằng' : 'Thấp hơn mặt bằng'}
                    />
                    <MiniStat
                      label="Điểm đánh giá"
                      value={data.rating_shrunk === null ? 'Chưa có đánh giá' : decimal(data.rating_shrunk)}
                      hint={data.n_reviews > 0 ? `${count(data.n_reviews)} đánh giá` : 'Chưa ai đánh giá'}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <ScoreBars
                    rows={(Object.keys(AXIS_LABEL) as HealthAxis[])
                      .filter(axis => data.breakdown[axis])
                      .map(axis => ({
                        label: AXIS_LABEL[axis],
                        score: data.breakdown[axis].score,
                        weight: data.breakdown[axis].weight,
                        counted: data.breakdown[axis].counted,
                      }))}
                  />

                  {data.axes_missing.length > 0 && (
                    <Note>
                      Trục {data.axes_missing.map(a => AXIS_LABEL[a as HealthAxis] ?? a).join(', ')} thiếu dữ liệu nên bị loại
                      khỏi phép tính và trọng số được chia lại cho các trục còn lại. Thiếu dữ liệu không bị tính 0 điểm, vì
                      thiếu dữ liệu khác với làm kém.
                    </Note>
                  )}

                  {data.todo.length > 0 ? (
                    <div className="rounded-xl bg-stone-50 p-4">
                      <p className="m-0 mb-2 text-[13px] font-bold text-stone-800">Việc nên sửa trước</p>
                      <ol className="m-0 list-none space-y-2 p-0">
                        {[...data.todo].sort((a, b) => a.priority - b.priority).map(task => (
                          <li key={`${task.priority}-${task.action}`} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-stone-700">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] text-[11px] font-bold text-[#005B00]">
                              {task.priority}
                            </span>
                            <span>
                              {task.action}
                              {task.expected_gain && <span className="ml-1 font-semibold text-[#005B00]">{task.expected_gain}</span>}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <Note>Không có việc nào cần sửa gấp ở sản phẩm này.</Note>
                  )}
                </div>
              </div>
            </InsightCard>
          )}
        </InsightBlock>

        {/* ------------------------------------------------- F28 phễu chuyển --- */}
        <InsightBlock state={conversion.state} onRetry={conversion.reload}>
          {(data, meta) => {
            const weakLabel = data.weakest_step ? STEP_LABEL[data.weakest_step] ?? data.weakest_step : null;
            return (
              <InsightCard
                title="Phễu chuyển đổi"
                description={`Tính trên khoảng ${dateRange(data.window.from, data.window.to)}.`}
                footer={<SourceFooter meta={meta} />}
              >
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,260px)]">
                  <FunnelBars
                    steps={[
                      { label: 'Người xem', value: data.funnel.views },
                      {
                        label: 'Thêm vào giỏ',
                        value: data.funnel.carts,
                        convPct: data.view_to_cart_pct,
                        weakest: data.weakest_step === 'view_to_cart',
                      },
                      {
                        label: 'Đặt mua',
                        value: data.funnel.orders,
                        convPct: data.cart_to_order_pct,
                        weakest: data.weakest_step === 'cart_to_order',
                      },
                    ]}
                  />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                      <MiniStat label="Xem thành mua" value={pct(data.view_to_order_pct, 2)} />
                      <MiniStat
                        label="Mặt bằng danh mục"
                        value={pct(data.category_avg_pct, 2)}
                        hint={data.category_id ? categoryLabel(data.category_id) : undefined}
                      />
                      <MiniStat
                        label="So với danh mục"
                        value={data.cr_index === null ? NA : `${decimal(data.cr_index)} lần`}
                        hint={data.cr_index === null ? undefined : data.cr_index >= 1 ? 'Tốt hơn mặt bằng' : 'Thấp hơn mặt bằng'}
                      />
                    </div>
                    {weakLabel && (
                      <Note>
                        Khâu rơi nhiều nhất là {weakLabel}. Đây là chỗ sửa được nhiều nhất với cùng một lượng công.
                      </Note>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-stone-100 pt-4">
                  {data.tips.length > 0 ? (
                    <ul className="m-0 list-none space-y-3 p-0">
                      {data.tips.map(tip => (
                        <li key={tip.issue} className="rounded-xl bg-amber-50 p-3.5">
                          <p className="m-0 text-[13px] font-semibold text-amber-900">{tip.issue}</p>
                          <p className="mb-0 mt-1 text-[13px] leading-relaxed text-amber-900/90">{tip.action}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Note>
                      Không có gợi ý sửa nào, và đó là dấu tốt: hệ thống chỉ đưa gợi ý khi tỉ lệ chuyển đổi thấp hơn mặt
                      bằng danh mục từ 20% trở lên.
                    </Note>
                  )}
                </div>
              </InsightCard>
            );
          }}
        </InsightBlock>

        {/* -------------------------------------------- F27 diễn biến theo ngày -- */}
        <InsightBlock state={series.state} onRetry={series.reload}>
          {(data, meta) => {
            const viewRows = data.series.map((point, i) => ({
              label: shortDate(point.date),
              views: point.views,
              median: data.category_median[i]?.views ?? 0,
            }));
            const actionRows = data.series.map(point => ({
              label: shortDate(point.date),
              carts: point.carts,
              orders: point.orders,
            }));

            return (
              <div className="space-y-5">
                <InsightCard
                  title="Lượt xem so với mặt bằng danh mục"
                  description="Đường của sản phẩm này và đường trung vị danh mục cùng đơn vị là lượt xem nên vẽ chung được."
                  action={<RangeTabs<TimeRange> value={timeRange} onChange={setRange} options={[...RANGE_OPTIONS]} label="Khoảng thời gian" />}
                  footer={<SourceFooter meta={meta} />}
                >
                  <div className="mb-4 flex flex-wrap gap-2">
                    <TrendPill
                      direction={data.trend?.views ?? null}
                      slope={data.trend?.views_slope_pct_per_day ?? null}
                      threshold={data.trend?.threshold_pct ?? 5}
                      what="Lượt xem"
                    />
                    <TrendPill
                      direction={data.trend?.orders ?? null}
                      slope={data.trend?.orders_slope_pct_per_day ?? null}
                      threshold={data.trend?.threshold_pct ?? 5}
                      what="Đơn hàng"
                    />
                  </div>
                  <TrendChart
                    data={viewRows}
                    series={[
                      { key: 'views', name: 'Sản phẩm này', color: SERIES.green },
                      { key: 'median', name: 'Trung vị danh mục', color: SERIES.blue },
                    ]}
                    formatValue={count}
                    ariaLabel={`Lượt xem của sản phẩm so với trung vị danh mục, từ ${fullDate(data.from)} đến ${fullDate(data.to)}`}
                  />
                  <div className="mt-3">
                    <TrendLegend
                      items={[
                        { name: 'Tổng lượt xem trong kỳ', color: SERIES.green, total: count(data.totals.views) },
                        { name: 'Tỉ lệ chuyển đổi', color: SERIES.blue, total: pct(data.totals.conversion_pct, 2) },
                      ]}
                    />
                  </div>
                </InsightCard>

                <InsightCard title="Thêm giỏ và đặt mua theo ngày" footer={<SourceFooter meta={meta} />}>
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
              </div>
            );
          }}
        </InsightBlock>

        <InsightCard>
          <Link
            to="/seller/insights/listings"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-600 no-underline transition-colors duration-150 hover:text-[#007700] motion-reduce:transition-none"
          >
            Xem sản phẩm khác
            <ArrowRight size={15} aria-hidden />
          </Link>
        </InsightCard>
      </div>
    </InsightPage>
  );
}
