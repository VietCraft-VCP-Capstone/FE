/**
 * F31 — Doanh thu theo loại sản phẩm và nhịp mua theo giờ. Trả lời:
 * "Dòng sản phẩm nào đang mang lại tiền, và khách mua vào giờ nào?"
 *
 * Đọc GET /seller/analytics/categories (tham số timeRange = 7d · 30d · 90d).
 *
 * Hai chỗ dễ hiểu nhầm, nên nói thẳng trên trang:
 *   - Bảng loại sản phẩm tính theo khoảng đã chọn, còn heatmap tính trên TOÀN BỘ lịch sử
 *     đơn (trường heatmap_window), không đổi khi bấm 7 ngày hay 90 ngày.
 *   - Nhịp giờ và thứ kế thừa từ dữ liệu tham chiếu quốc tế trong bộ dữ liệu mồi, chưa
 *     phản ánh thói quen người mua Việt Nam. Đây là cảnh báo nặng nên hiện bằng Note
 *     ngay cạnh heatmap, không chỉ nằm trong phần "Cách tính và giới hạn".
 */

import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { count, money } from '../../../shared/utils/format';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { HourHeatmap } from '../components/charts/HourHeatmap';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { BRAND, DataTable, InsightCard, Note } from '../components/ui';
import { RANGE_OPTIONS, dateRange, pct } from '../format';
import { useInsight } from '../hooks/useInsight';
import { productTypeLabel } from '../labels';
import type { CategoryRevenue, TimeRange } from '../types';

const RANGES: TimeRange[] = ['7d', '30d', '90d'];
const TOP_ROWS = 12;

/** "14" -> "14:00 đến 15:00" cho người đọc, thay vì để trần con số giờ. */
function hourWindow(hour: number): string {
  const pad = (h: number) => `${String(h).padStart(2, '0')}:00`;
  return `${pad(hour)} đến ${pad((hour + 1) % 24)}`;
}

export function CategoriesPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('range');
  const timeRange: TimeRange = RANGES.includes(raw as TimeRange) ? (raw as TimeRange) : '30d';
  const [expanded, setExpanded] = useState(false);

  const { state, reload } = useInsight<CategoryRevenue>('/categories', { timeRange });

  const setRange = (value: TimeRange) => {
    const next = new URLSearchParams(params);
    next.set('range', value);
    setParams(next, { replace: true });
    setExpanded(false);
  };

  return (
    <InsightPage
      title="Doanh thu theo loại"
      question="Dòng sản phẩm nào đang mang lại tiền, và khách mua vào giờ nào?"
      actions={
        <RangeTabs<TimeRange>
          value={timeRange}
          onChange={setRange}
          options={[...RANGE_OPTIONS]}
          label="Khoảng thời gian"
        />
      }
    >
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const rows = [...data.by_product_type].sort((a, b) => b.revenue_vnd - a.revenue_vnd);
          const shown = expanded ? rows : rows.slice(0, TOP_ROWS);
          const maxShare = rows.reduce((top, row) => Math.max(top, row.share_pct), 0) || 1;
          const peak = data.peak_window;

          return (
            <div className="space-y-5">
              <InsightCard
                title="Doanh thu theo loại sản phẩm"
                description={`Khoảng ${dateRange(data.from, data.to)}. Tổng doanh thu ${money(data.total_revenue_vnd)}.`}
                bodyClassName="px-4 py-3"
                footer={<SourceFooter meta={meta} />}
              >
                {rows.length === 0 ? (
                  <Note>Khoảng thời gian này chưa có loại sản phẩm nào phát sinh đơn.</Note>
                ) : (
                  <>
                    <DataTable
                      caption={`Doanh thu từng loại sản phẩm, sắp xếp từ nhiều tới ít, khoảng ${dateRange(data.from, data.to)}`}
                      head={
                        <>
                          <th scope="col">Loại sản phẩm</th>
                          <th scope="col" className="text-right">Doanh thu</th>
                          <th scope="col" className="text-right">Đơn</th>
                          <th scope="col" className="text-right">Số lượng</th>
                          <th scope="col">Tỉ trọng</th>
                        </>
                      }
                    >
                      {shown.map(row => (
                        <tr key={row.product_type_id}>
                          <td className="font-medium text-stone-800">
                            {row.name_vi || productTypeLabel(row.product_type_id)}
                          </td>
                          <td className="text-right font-semibold tabular-nums text-stone-900">{money(row.revenue_vnd)}</td>
                          <td className="text-right tabular-nums text-stone-700">{count(row.orders)}</td>
                          <td className="text-right tabular-nums text-stone-700">{count(row.units)}</td>
                          <td>
                            <span className="flex items-center gap-2">
                              <span className="block h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-stone-100" aria-hidden>
                                <span
                                  className="block h-1.5 rounded-full"
                                  style={{ width: `${Math.max(4, (row.share_pct / maxShare) * 100)}%`, background: BRAND }}
                                />
                              </span>
                              <span className="tabular-nums text-stone-600">{pct(row.share_pct)}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </DataTable>

                    {rows.length > TOP_ROWS && (
                      <div className="mt-3.5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setExpanded(open => !open)}
                          aria-expanded={expanded}
                          className="cursor-pointer rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                        >
                          {expanded ? `Chỉ xem ${TOP_ROWS} loại nhiều nhất` : `Xem tất cả ${rows.length} loại`}
                        </button>
                        <Note>
                          {expanded
                            ? `Đang hiện đủ ${rows.length} loại sản phẩm có đơn trong khoảng này.`
                            : `Đang hiện ${TOP_ROWS} loại nhiều doanh thu nhất trong ${rows.length} loại có đơn.`}
                        </Note>
                      </div>
                    )}
                  </>
                )}
              </InsightCard>

              <InsightCard
                title="Khách đặt hàng vào giờ nào"
                description={`Số đơn theo thứ và giờ, múi giờ ${data.heatmap_tz}.`}
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                <div className="space-y-4">
                  {data.limitation && (
                    <div className="rounded-md bg-amber-50 px-3.5 py-2.5">
                      <Note tone="warn">
                        <strong>Đọc kỹ trước khi xếp lịch đăng bài:</strong> {data.limitation}
                      </Note>
                    </div>
                  )}

                  {peak ? (
                    <p className="m-0 flex flex-wrap items-center gap-2 text-[13px] leading-relaxed text-stone-700">
                      <Clock3 size={15} className="shrink-0 text-[#005B00]" aria-hidden />
                      <span>
                        Khung giờ có nhiều đơn nhất là <strong>{peak.dow_vi}</strong>, khoảng{' '}
                        <strong>{hourWindow(peak.hour)}</strong>, với {count(peak.orders)} đơn. {peak.note}.
                      </span>
                    </p>
                  ) : (
                    <Note>Chưa xác định được khung giờ nhiều đơn nhất.</Note>
                  )}

                  <HourHeatmap cells={data.heatmap} peak={peak} />

                  <Note>
                    Heatmap này tính trên {data.heatmap_window}, không tính theo khoảng thời gian bạn chọn ở trên, nên
                    nó giữ nguyên khi bạn đổi qua 7 ngày hay 90 ngày. Bảng doanh thu theo loại phía trên thì đổi theo
                    khoảng đã chọn.
                  </Note>
                </div>
              </InsightCard>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
