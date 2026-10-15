/**
 * F33 — So sánh 5 trục. Trả lời: "So với 5 shop mạnh nhất cùng phân khúc, tôi yếu ở đâu?"
 *
 * Đọc GET /seller/analytics/shop-comparison.
 *
 * Điểm trên radar là điểm TƯƠNG ĐỐI trong phân khúc (chuẩn hoá 0-100, 100 luôn là tốt
 * hơn), không phải điểm tuyệt đối. Không nói rõ chỗ này thì người bán thấy 38 điểm ở trục
 * giá và tưởng shop mình có vấn đề, trong khi đó chỉ nghĩa là giá thấp hơn nhóm.
 */

import { money } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { MiniStat } from '../components/charts/MiniViz';
import { RADAR_COLORS, RADAR_ME_COLOR, RadarCompare } from '../components/charts/RadarCompare';
import { DataTable, InsightCard, Note } from '../components/ui';
import { NA, decimal } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel } from '../labels';
import type { ShopComparison } from '../types';

/**
 * Giá trị thật của từng trục. `response_speed` được lưu ÂM để "càng lớn càng tốt" đúng cho
 * mọi trục khi chuẩn hoá, nên phải đổi dấu lại khi hiện cho người đọc.
 */
function rawText(axis: string, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NA;
  switch (axis) {
    case 'listing_count':
      return `${decimal(value, 0)} sản phẩm`;
    case 'avg_rating':
      return `${decimal(value)} trên 5`;
    case 'response_speed':
      return `${decimal(Math.abs(value), 0)} phút`;
    case 'avg_price':
      return money(value);
    case 'product_diversity':
      return `${decimal(value, 0)} loại hàng`;
    default:
      return decimal(value);
  }
}

const RAW_HINT: Record<string, string> = {
  response_speed: 'Thời gian trả lời khách trung bình. Càng ngắn càng tốt.',
  avg_price: 'Giá bán trung bình của shop. Cao hay thấp không tự nó là tốt hay xấu.',
  product_diversity: 'Số loại hàng khác nhau shop đang bán.',
};

export function BenchmarkPage() {
  const { state, reload } = useInsight<ShopComparison>('/shop-comparison');

  return (
    <InsightPage title="So sánh 5 trục" question="So với những shop mạnh nhất cùng phân khúc, tôi yếu ở đâu?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          // Trục yếu nhất tính bằng khoảng cách tới điểm trung bình của nhóm đối thủ, chứ
          // không phải điểm thấp nhất: điểm thấp mà cả nhóm cũng thấp thì không phải điểm yếu.
          const gaps = data.axes.map((_, i) => {
            const rivals = data.competitors.map(c => c.values[i] ?? 0);
            const avg = rivals.length ? rivals.reduce((s, v) => s + v, 0) / rivals.length : 0;
            return { index: i, gap: (data.me[i] ?? 0) - avg, avg };
          });
          const weakest = [...gaps].sort((a, b) => a.gap - b.gap)[0];
          const weakestName = weakest ? data.axes_vi[weakest.index] : null;

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InsightCard bodyClassName="px-4 py-3">
                  <MiniStat label="Phân khúc của bạn" value={categoryLabel(data.segment)} hint={data.segment_reason} />
                </InsightCard>
                <InsightCard bodyClassName="px-4 py-3">
                  <MiniStat label="Số shop trong phân khúc" value={decimal(data.shops_in_segment, 0)} hint="Toàn bộ shop được đưa vào phép chuẩn hoá" />
                </InsightCard>
                <InsightCard bodyClassName="px-4 py-3">
                  <MiniStat label="Đang so với" value={`${data.competitors.length} shop mạnh nhất`} hint="Xếp theo doanh thu ước lượng 90 ngày" />
                </InsightCard>
              </div>

              <InsightCard
                title="Shop của bạn so với nhóm dẫn đầu"
                description={data.normalization}
                footer={<SourceFooter meta={meta} method={`Phân khúc xác định tự động: ${data.segment_reason}`} />}
              >
                <RadarCompare
                  axes={data.axes_vi}
                  unitHint="điểm 0-100"
                  series={[
                    { name: 'Shop của bạn', values: data.me, color: RADAR_ME_COLOR, primary: true },
                    ...data.competitors.map((c, i) => ({
                      name: c.shop_name,
                      values: c.values,
                      color: RADAR_COLORS[i % RADAR_COLORS.length],
                    })),
                  ]}
                />

                {weakestName && weakest && (
                  <div className="mt-4 rounded-md bg-stone-50 p-4">
                    <p className="m-0 text-[13px] leading-relaxed text-stone-700">
                      {weakest.gap < 0 ? (
                        <>
                          Trục cách nhóm dẫn đầu xa nhất là <strong className="text-stone-900">{weakestName}</strong>: bạn được{' '}
                          {decimal(data.me[weakest.index] ?? 0, 0)} điểm, trung bình nhóm là {decimal(weakest.avg, 0)} điểm. Nếu
                          chọn một việc để cải thiện thì đây là chỗ tạo khác biệt lớn nhất.
                        </>
                      ) : (
                        <>
                          Không có trục nào bạn thấp hơn trung bình nhóm dẫn đầu. Trục sát nhất là{' '}
                          <strong className="text-stone-900">{weakestName}</strong>, và bạn vẫn đang trên mức trung bình của nhóm.
                        </>
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <Note>
                    Điểm ở đây là điểm tương đối trong phân khúc, không phải điểm tuyệt đối. Trục giá 40 điểm chỉ nghĩa là
                    giá của bạn thấp hơn phần lớn nhóm, không nghĩa là giá đó sai.
                  </Note>
                </div>
              </InsightCard>

              <InsightCard title="Giá trị thật của từng trục" description="Con số gốc trước khi quy về thang 100." bodyClassName="px-4 py-3">
                <DataTable
                  caption="Giá trị thật của shop trên từng trục so sánh"
                  head={
                    <>
                      <th scope="col">Trục</th>
                      <th scope="col" className="text-right">Giá trị thật</th>
                      <th scope="col" className="text-right">Điểm quy đổi</th>
                      <th scope="col">Nghĩa là</th>
                    </>
                  }
                >
                  {data.axes.map((axis, i) => (
                    <tr key={axis}>
                      <td className="font-medium text-stone-700">{data.axes_vi[i] ?? axis}</td>
                      <td className="whitespace-nowrap text-right font-semibold tabular-nums text-stone-900">
                        {rawText(axis, data.me_raw[axis] ?? null)}
                      </td>
                      <td className="text-right tabular-nums text-stone-600">{decimal(data.me[i] ?? 0, 0)}</td>
                      <td className="text-xs text-stone-500">{RAW_HINT[axis] ?? 'Càng cao càng tốt trong phân khúc này.'}</td>
                    </tr>
                  ))}
                </DataTable>
              </InsightCard>

              <InsightCard title="Doanh thu ước lượng của nhóm dẫn đầu" bodyClassName="px-4 py-3">
                <DataTable
                  caption="Doanh thu ước lượng 90 ngày của các shop được đưa vào so sánh"
                  head={
                    <>
                      <th scope="col">Shop</th>
                      <th scope="col" className="text-right">Doanh thu ước lượng 90 ngày</th>
                    </>
                  }
                >
                  {data.competitors.map(c => (
                    <tr key={c.shop_id}>
                      <td className="font-semibold text-stone-800">{c.shop_name}</td>
                      <td className="whitespace-nowrap text-right tabular-nums text-stone-700">{money(c.est_revenue_90d_vnd)}</td>
                    </tr>
                  ))}
                </DataTable>
              </InsightCard>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
