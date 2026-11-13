/**
 * F40 — Tag đang tăng nhanh. Trả lời: "Tuần này chủ đề nào đang lên?"
 *
 * Đọc GET /seller/analytics/forecast/radar.
 *
 * Cột "lượt tìm mỗi tuần" luôn rỗng và đó là CHỦ Ý: Google Trends trả chỉ số tương đối
 * 0-100, không trả lượt tìm tuyệt đối. Giữ cột lại kèm lời giải thích thì người đọc biết
 * số đó chưa có; bỏ cột đi thì lần sau lại có người đi tìm nó.
 */

import { ArrowRight, ArrowUpRight, Minus, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { count } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { RADAR_ME_COLOR, RadarCompare } from '../components/charts/RadarCompare';
import { Chip, DataTable, InsightCard, Note, type Tone } from '../components/ui';
import { NA, decimal, pct } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel, tagLabel } from '../labels';
import type { TrendRadar } from '../types';

const TREND: Record<string, { label: string; tone: Tone; Icon: typeof ArrowUpRight }> = {
  rising: { label: 'Đang tăng', tone: 'good', Icon: ArrowUpRight },
  falling: { label: 'Đang giảm', tone: 'bad', Icon: TrendingDown },
  flat: { label: 'Đi ngang', tone: 'neutral', Icon: Minus },
};

/** "2026-W35" thành "tuần 35 năm 2026". */
function weekLabel(week: string): string {
  const match = /^(\d{4})-W(\d{1,2})$/.exec(week);
  if (!match) return week;
  return `tuần ${Number(match[2])} năm ${match[1]}`;
}

export function RadarPage() {
  const { state, reload } = useInsight<TrendRadar>('/forecast/radar');

  return (
    <InsightPage title="Tag đang tăng nhanh" question="Tuần này chủ đề nào đang lên, và nên bắt kịp cái nào?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const tags = data.top_tags;
          const noSearchVolume = tags.every(t => t.searches_per_week === null);

          return (
            <div className="space-y-5">
              <InsightCard
                title={`Nhu cầu theo nhóm hàng, ${weekLabel(data.week)}`}
                description={data.radar.scale}
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                <RadarCompare
                  axes={data.radar.axes.map(axis => categoryLabel(axis))}
                  series={[
                    {
                      name: 'Nhu cầu tìm kiếm',
                      values: data.radar.values,
                      color: RADAR_ME_COLOR,
                      primary: true,
                    },
                  ]}
                  unitHint="thang 0-100"
                />
                <div className="mt-4">
                  <Note>
                    Trục cao nhất được đặt bằng 100, các trục khác quy về theo tỉ lệ với nó. Vì vậy con số ở đây nói nhóm
                    nào đang được tìm nhiều hơn nhóm nào, chứ không phải số lượt tìm thật.
                  </Note>
                </div>
              </InsightCard>

              <InsightCard
                title="10 tag tăng nhanh nhất tuần này"
                description="Tốc độ tăng so với tuần trước. Đà tăng gần 1 nghĩa là tăng liên tục nhiều tuần, không phải vọt một hôm rồi tụt."
                bodyClassName="px-4 py-3"
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                {tags.length === 0 ? (
                  <Note>Tuần này chưa có tag nào đủ dữ liệu để xếp hạng.</Note>
                ) : (
                  <DataTable
                    caption={`Mười tag có tốc độ tăng cao nhất ${weekLabel(data.week)}`}
                    head={
                      <>
                        <th scope="col" className="w-10">#</th>
                        <th scope="col">Tag & Ngành</th>
                        <th scope="col" className="text-right">Tăng WoW</th>
                        <th scope="col" className="text-right">Gia tốc 3w</th>
                        <th scope="col" className="text-right">Điểm đà tăng</th>
                        <th scope="col" className="text-right">Chỉ số cầu</th>
                        <th scope="col" className="text-right">Lượt tìm/tuần</th>
                        <th scope="col">Xu hướng</th>
                      </>
                    }
                  >
                    {tags.map(tag => {
                      const tr = TREND[tag.trend] ?? { label: tag.trend, tone: 'neutral' as Tone, Icon: Minus };
                      return (
                        <tr key={tag.tag_id}>
                          <td className="tabular-nums text-stone-400">{tag.rank}</td>
                          <td>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-stone-800">{tagLabel(tag.name_vi, tag.tag_id)}</span>
                              {tag.axis && (
                                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10.5px] text-stone-600 font-medium">
                                  {tag.axis}
                                </span>
                              )}
                              {tag.low_base && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10.5px] text-amber-700 font-semibold border border-amber-200" title="Chỉ số cầu < 5, biến động % có thể phóng đại do mẫu số nhỏ">
                                  Nền thấp
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`text-right font-semibold tabular-nums ${tag.growth_pct >= 0 ? 'text-[#005B00]' : 'text-stone-600'}`}>
                            {pct(tag.growth_pct)}
                          </td>
                          <td className="text-right tabular-nums text-stone-700">
                            {tag.acceleration != null ? (tag.acceleration > 0 ? `+${decimal(tag.acceleration)}` : decimal(tag.acceleration)) : NA}
                          </td>
                          <td className="text-right tabular-nums text-stone-900 font-bold">
                            {tag.momentum_pct != null ? `${tag.momentum_pct}/100` : decimal(tag.momentum)}
                          </td>
                          <td className="text-right tabular-nums text-stone-700">{decimal(tag.demand_index)}</td>
                          <td className="text-right text-stone-400">{tag.searches_per_week === null ? NA : count(tag.searches_per_week)}</td>
                          <td>
                            <Chip tone={tr.tone} icon={<tr.Icon size={12} aria-hidden />}>{tr.label}</Chip>
                          </td>
                        </tr>
                      );
                    })}
                  </DataTable>
                )}

                {noSearchVolume && (
                  <div className="mt-4">
                    <Note tone="warn">
                      Cột "lượt tìm mỗi tuần" chưa có số, và sẽ còn trống: Google Trends chỉ trả chỉ số tương đối 0-100 chứ
                      không trả số lượt tìm thật. Vì vậy điều kiện "chỉ xét tag có từ 100 lượt tìm mỗi tuần" trong đặc tả
                      hiện chưa áp dụng được, và bảng này xếp theo tốc độ tăng của chỉ số.
                    </Note>
                  </div>
                )}
              </InsightCard>

              <InsightCard title="Xem tiếp">
                <p className="m-0 text-[13px] leading-relaxed text-stone-600">
                  Tag tăng nhanh chỉ nói phía cầu. Muốn biết tag nào đáng vào thì cần xem cả nguồn cung: bao nhiêu người
                  đang bán, và còn chỗ trống không.
                </p>
                <Link
                  to="/seller/insights/niches"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#007700] px-3.5 py-2 text-[13px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                >
                  Xem cung và cầu từng ngách
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </InsightCard>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
