/**
 * F26 — Tổng quan shop. Trả lời: "Shop đang chạy ra sao so với kỳ trước?"
 *
 * Đọc GET /seller/analytics/overview (tham số timeRange = 7d · 30d · 90d).
 *
 * Hai lưu ý đã quyết trong lúc dựng trang:
 *   - Doanh thu và lượt xem KHÔNG vẽ chung một khung. TrendChart cố tình chỉ có một trục
 *     giá trị; ép "đồng" và "lượt" vào cùng trục thì tỉ lệ giữa hai đường là do người vẽ
 *     đặt ra, không có trong dữ liệu. Vì vậy tách thành hai biểu đồ.
 *   - Cửa sổ thời gian neo theo ngày có dữ liệu mới nhất (anchored_to_latest_data), không
 *     phải hôm nay. Phải nói ra, nếu không người bán sẽ tưởng hệ thống mất số liệu.
 */

import { ChevronRight, Coins, Eye, RotateCw, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { TrendChart, TrendLegend } from '../../../shared/components/charts/TrendChart';
import { count, money } from '../../../shared/utils/format';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { RevenueOverviewChart } from '../components/charts/RevenueOverviewChart';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, DataTable, DeltaBadge, InsightCard, KpiTile, Note, Skeleton } from '../components/ui';
import { NA, RANGE_OPTIONS, dateRange, fullDate, pct, shortDate } from '../format';
import { useInsight } from '../hooks/useInsight';
import type { ShopOverview, TimeRange } from '../types';

const RANGES: TimeRange[] = ['7d', '30d', '90d', '180d', '365d'];

/**
 * `recent_feedback` chưa có hợp đồng kiểu (types.ts khai là unknown[]), nên đọc từng
 * trường một cách phòng thủ thay vì cast cả khối.
 */
function readFeedback(item: unknown): { rating: number | null; comment: string | null; when: string | null } {
  const rec = (item ?? {}) as Record<string, unknown>;
  const rating = typeof rec.rating === 'number' ? rec.rating : null;
  const comment =
    typeof rec.comment === 'string' ? rec.comment : typeof rec.content === 'string' ? rec.content : null;
  const when =
    typeof rec.created_at === 'string' ? rec.created_at : typeof rec.date === 'string' ? rec.date : null;
  return { rating, comment, when };
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-md" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}

export function OverviewPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('range');
  const timeRange: TimeRange = RANGES.includes(raw as TimeRange) ? (raw as TimeRange) : '30d';

  const { state, reload } = useInsight<ShopOverview>('/overview', { timeRange });

  const setRange = (value: TimeRange) => {
    const next = new URLSearchParams(params);
    next.set('range', value);
    setParams(next, { replace: true });
  };

  return (
    <InsightPage
      title="Tổng quan shop"
      question="Shop đang chạy ra sao so với kỳ trước?"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <RangeTabs<TimeRange>
            value={timeRange}
            onChange={setRange}
            options={[...RANGE_OPTIONS]}
            label="Khoảng thời gian"
          />
          <button
            type="button"
            onClick={reload}
            disabled={state.kind === 'loading'}
            title="Làm mới số liệu từ máy chủ"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 shadow-sm transition-all duration-150 hover:border-[#007700] hover:bg-[#EAF0E2]/30 hover:text-[#005B00] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            <RotateCw
              size={13.5}
              className={`transition-transform duration-300 ${state.kind === 'loading' ? 'animate-spin text-[#007700]' : 'text-stone-500'}`}
            />
            <span>{state.kind === 'loading' ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      }
    >
      <InsightBlock state={state} onRetry={reload} skeleton={<PageSkeleton />}>
        {(data, meta) => {
          const compare = dateRange(data.compare_from, data.compare_to);
          // Lượt xem null nghĩa là sàn chưa bật theo dõi hành vi người mua. Không vẽ
          // đường lượt xem trong trường hợp đó: một đường phẳng ở 0 nói rằng không ai
          // xem hàng, trong khi sự thật là chưa đo.
          const hasViews = data.series.some(point => point.views !== null);
          const chart = data.series.map(point => ({
            label: shortDate(point.date),
            revenue: point.revenue_vnd,
            views: point.views ?? 0,
            orders: point.orders,
          }));
          const totalViews = data.series.reduce((sum, p) => sum + (p.views ?? 0), 0);
          const totalOrders = data.series.reduce((sum, p) => sum + p.orders, 0);
          const feedback = data.recent_feedback ?? [];

          return (
            <div className="space-y-5">
              <InsightCard
                title="Số liệu chính"
                description={`Kỳ này: ${dateRange(data.from, data.to)}`}
                footer={<SourceFooter meta={meta} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KpiTile
                    label="Lượt xem"
                    value={data.kpi.views.value !== null ? count(data.kpi.views.value) : '—'}
                    isUnavailable={data.kpi.views.value === null}
                    unavailableText="Chưa đo lường"
                    icon={<Eye size={17} />}
                    iconBg="bg-amber-50 text-amber-600 ring-1 ring-amber-500/20"
                    trailing={<DeltaBadge value={data.kpi.views.pop_pct} fallbackLabel="Chưa so" />}
                    hint="Sàn chưa bật theo dõi lượt xem"
                  />
                  <KpiTile
                    label="Đơn hàng"
                    value={data.kpi.orders.value !== null ? count(data.kpi.orders.value) : '—'}
                    icon={<ShoppingBag size={17} />}
                    iconBg="bg-blue-50 text-blue-600 ring-1 ring-blue-500/20"
                    trailing={<DeltaBadge value={data.kpi.orders.pop_pct} fallbackLabel="Kỳ đầu" />}
                    hint={data.kpi.orders.pop_pct === null ? 'Kỳ trước chưa có đơn để so' : `So với ${compare}`}
                  />
                  <KpiTile
                    label="Doanh thu"
                    value={data.kpi.revenue_vnd.value !== null ? money(data.kpi.revenue_vnd.value) : '—'}
                    icon={<Coins size={17} />}
                    iconBg="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20"
                    trailing={<DeltaBadge value={data.kpi.revenue_vnd.pop_pct} fallbackLabel="Kỳ đầu" />}
                    hint={data.kpi.revenue_vnd.pop_pct === null ? 'Kỳ trước chưa có số để so' : `So với ${compare}`}
                  />
                  <KpiTile
                    label="Tỉ lệ chuyển đổi"
                    value={data.kpi.conversion_pct.value !== null ? pct(data.kpi.conversion_pct.value, 2) : '—'}
                    isUnavailable={data.kpi.conversion_pct.value === null}
                    unavailableText="Cần lượt xem"
                    icon={<TrendingUp size={17} />}
                    iconBg="bg-purple-50 text-purple-600 ring-1 ring-purple-500/20"
                    trailing={<DeltaBadge value={data.kpi.conversion_pct.pop_pct} fallbackLabel="Chưa so" />}
                    hint="Tính theo: Đơn hàng ÷ Lượt xem"
                  />
                </div>
                {data.anchored_to_latest_data && (
                  <div className="mt-4">
                    <Note>
                      Cửa sổ thời gian tính từ ngày có dữ liệu mới nhất là {fullDate(data.to)}, không tính từ hôm
                      nay. Vì vậy bạn sẽ chưa thấy số liệu của hôm nay ở đây.
                    </Note>
                  </div>
                )}
              </InsightCard>

              <InsightCard
                title="Phân tích Doanh thu theo chu kỳ"
                description="Theo dõi doanh thu, số đơn và giá trị trung bình theo ngày, tuần, tháng, quý hoặc năm."
                footer={<SourceFooter meta={meta} />}
              >
                <RevenueOverviewChart
                  series={data.series}
                  timeRangeLabel={`Từ ${shortDate(data.from)} đến ${fullDate(data.to)}`}
                  onRangeSuggestion={setRange}
                />
              </InsightCard>

              <InsightCard
                title={hasViews ? 'Lượt xem và đơn theo ngày' : 'Đơn hàng theo ngày'}
                description={
                  hasViews
                    ? 'Hai chuỗi này cùng đơn vị là lượt nên vẽ chung được. Doanh thu tính bằng đồng nên để ở biểu đồ riêng phía trên.'
                    : 'Số đơn phát sinh mỗi ngày trong kỳ đã chọn.'
                }
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                <TrendChart
                  data={chart}
                  series={
                    hasViews
                      ? [
                          { key: 'views', name: 'Lượt xem', color: SERIES.blue },
                          { key: 'orders', name: 'Đơn hàng', color: SERIES.green },
                        ]
                      : [{ key: 'orders', name: 'Đơn hàng', color: SERIES.green }]
                  }
                  formatValue={count}
                  ariaLabel={
                    hasViews
                      ? `Lượt xem và số đơn từng ngày từ ${fullDate(data.from)} đến ${fullDate(data.to)}`
                      : `Số đơn từng ngày từ ${fullDate(data.from)} đến ${fullDate(data.to)}`
                  }
                />
                <div className="mt-3">
                  <TrendLegend
                    items={
                      hasViews
                        ? [
                            { name: 'Lượt xem', color: SERIES.blue, total: count(totalViews) },
                            { name: 'Đơn hàng', color: SERIES.green, total: count(totalOrders) },
                          ]
                        : [{ name: 'Tổng đơn trong kỳ', color: SERIES.green, total: count(totalOrders) }]
                    }
                  />
                </div>
                <div className="mt-2">
                  {hasViews ? (
                    <Note>
                      Số đơn nhỏ hơn lượt xem rất nhiều nên đường đơn hàng nằm sát đáy. Tỉ lệ giữa hai đường chính là
                      tỉ lệ chuyển đổi ở thẻ trên.
                    </Note>
                  ) : (
                    <Note tone="warn">
                      Chưa có đường lượt xem vì sàn chưa bật theo dõi hành vi người mua. Đó là lý do ô lượt xem và ô tỉ lệ
                      chuyển đổi ở trên để trống, không phải vì chúng bằng 0.
                    </Note>
                  )}
                </div>
              </InsightCard>

              <InsightCard
                title="5 sản phẩm bán chạy nhất"
                description="Bấm vào một sản phẩm để xem sức khoẻ, phễu chuyển đổi và diễn biến của riêng nó."
                bodyClassName="px-4 py-3"
                footer={<SourceFooter meta={meta} />}
              >
                {data.top_products.length === 0 ? (
                  <Note>Kỳ này chưa có sản phẩm nào phát sinh đơn.</Note>
                ) : (
                  <DataTable
                    caption={`Năm sản phẩm nhiều doanh thu nhất trong kỳ ${dateRange(data.from, data.to)}`}
                    head={
                      <>
                        <th scope="col">Sản phẩm</th>
                        <th scope="col" className="text-right">Đơn</th>
                        <th scope="col" className="text-right">Doanh thu</th>
                        <th scope="col" className="w-10" />
                      </>
                    }
                  >
                    {data.top_products.map(product => (
                      <tr key={product.listing_id} className="transition-colors duration-150 hover:bg-stone-50 motion-reduce:transition-none">
                        <td>
                          <Link
                            to={`/seller/insights/listings/${product.listing_id}`}
                            className="font-semibold text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                          >
                            {product.title}
                          </Link>
                        </td>
                        <td className="text-right tabular-nums text-stone-700">{count(product.orders)}</td>
                        <td className="text-right font-semibold tabular-nums text-stone-900">{money(product.revenue_vnd)}</td>
                        <td className="text-right text-stone-400">
                          <ChevronRight size={16} aria-hidden />
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </InsightCard>

              {feedback.length > 0 && (
                <InsightCard title="Đánh giá mới nhất" footer={<SourceFooter meta={meta} />}>
                  <ul className="m-0 list-none space-y-3 p-0">
                    {feedback.slice(0, 5).map((item, index) => {
                      const fb = readFeedback(item);
                      return (
                        <li key={index} className="border-b border-stone-100 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Chip tone={fb.rating !== null && fb.rating >= 4 ? 'good' : 'warn'} icon={<Star size={12} aria-hidden />}>
                              {fb.rating === null ? NA : `${fb.rating}/5`}
                            </Chip>
                            {fb.when && <span className="text-xs text-stone-500">{fullDate(fb.when)}</span>}
                          </div>
                          {fb.comment && <p className="mb-0 mt-1.5 text-[13px] leading-relaxed text-stone-700">{fb.comment}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </InsightCard>
              )}
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
