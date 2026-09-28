/**
 * F34 — Tag còn thiếu. Trả lời: "Nhóm bán chạy đang gắn tag nào mà tôi chưa có?"
 *
 * Đọc GET /seller/analytics/tag-gap (tham số categoryId).
 *
 * Trang này khác các trang còn lại ở một điểm: khi `signal.has_signal` là false thì thứ
 * quan trọng nhất trên màn hình KHÔNG phải danh sách tag, mà là lời cảnh báo rằng danh
 * sách đó chưa đáng tin. Dữ liệu mồi gán tag ngẫu nhiên nên độ vượt trội đo được là
 * nhiễu. Đặt bảng lên trước cảnh báo là mời người bán ra quyết định trên số ngẫu nhiên.
 */

import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { count } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { MiniStat } from '../components/charts/MiniViz';
import { Chip, DataTable, InsightCard, Note, SelectField } from '../components/ui';
import { decimal, pct } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel, tagLabel } from '../labels';
import type { TagGap } from '../types';

export function TagGapPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get('categoryId') || undefined;
  const { state, reload } = useInsight<TagGap>('/tag-gap', { categoryId });

  const setCategory = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('categoryId', value);
    setParams(next, { replace: true });
  };

  return (
    <InsightPage title="Tag còn thiếu" question="Nhóm bán chạy đang gắn tag nào mà tôi chưa có?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const trusted = data.signal.has_signal;
          const rows = [...data.missing_tags].sort((a, b) => b.lift - a.lift);

          return (
            <div className="space-y-5">
              {!trusted && (
                <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5" role="note">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
                    <div>
                      <h2 className="m-0 text-sm font-bold text-amber-900">Chưa có tín hiệu đủ mạnh, đừng hành động theo bảng dưới</h2>
                      <p className="mb-0 mt-1.5 text-[13px] leading-relaxed text-amber-900/90">{data.signal.note}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-amber-200 pt-4 md:grid-cols-4">
                    <MiniStat label="Tag đã thử" value={count(data.signal.tags_tested)} />
                    <MiniStat label="Tag đủ mạnh" value={count(data.signal.strong_count)} hint="Cần ít nhất 1 để tin được" />
                    <MiniStat label="Tag yếu" value={count(data.signal.weak_count)} hint="Nằm trong mức ngẫu nhiên" />
                    <MiniStat label="Vượt trội cao nhất" value={data.signal.max_lift === null ? 'Chưa có' : `${decimal(data.signal.max_lift)} lần`} />
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Đối thủ đã quét" value={count(data.competitors_scanned)} hint="Nhóm bán chạy nhất trong danh mục" />
                </InsightCard>
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Tag shop bạn đang dùng" value={count(data.my_tags.length)} />
                </InsightCard>
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Tag họ có mà bạn chưa" value={count(rows.length)} />
                </InsightCard>
              </div>

              <InsightCard
                title="Tag nhóm bán chạy dùng nhiều hơn mặt bằng"
                description="Độ vượt trội là tỉ lệ dùng tag trong nhóm bán chạy chia cho tỉ lệ dùng của toàn danh mục. Vượt trội 2 lần nghĩa là nhóm dẫn đầu dùng tag đó gấp đôi mặt bằng."
                bodyClassName="px-5 py-4"
                action={
                  <SelectField
                    label="Danh mục"
                    value={data.category_id}
                    onChange={setCategory}
                    options={data.available_categories.map(id => ({ value: id, label: categoryLabel(id) }))}
                  />
                }
                footer={<SourceFooter meta={meta} limitation={data.note} />}
              >
                {rows.length === 0 ? (
                  <Note>
                    Không có tag nào của nhóm bán chạy mà shop bạn chưa dùng trong danh mục này. Bộ tag của bạn đã bao phủ
                    đủ, nên chỗ cần cải thiện nằm ở nơi khác.
                  </Note>
                ) : (
                  <DataTable
                    caption={`Tag của nhóm bán chạy trong danh mục ${categoryLabel(data.category_id)} mà shop chưa dùng`}
                    head={
                      <>
                        <th scope="col">Tag</th>
                        <th scope="col" className="text-right">Đối thủ dùng</th>
                        <th scope="col" className="text-right">Nhóm bán chạy</th>
                        <th scope="col" className="text-right">Toàn danh mục</th>
                        <th scope="col" className="text-right">Vượt trội</th>
                        <th scope="col" className="text-right">Traffic có thể tăng</th>
                      </>
                    }
                  >
                    {rows.map(tag => {
                      // Dữ liệu từng trả khoảng ngược (thấp 53%, cao 25%). Vẫn sắp lại ở đây
                      // để giao diện không bao giờ in ra một khoảng vô nghĩa.
                      const low = Math.min(tag.estimated_traffic_gain.low_pct, tag.estimated_traffic_gain.high_pct);
                      const high = Math.max(tag.estimated_traffic_gain.low_pct, tag.estimated_traffic_gain.high_pct);
                      return (
                        <tr key={tag.tag_id}>
                          <td className="font-semibold text-stone-800">{tagLabel(tag.name, tag.tag_id)}</td>
                          <td className="text-right tabular-nums text-stone-700">{count(tag.used_by_competitors)}</td>
                          <td className="text-right tabular-nums text-stone-700">{pct(tag.competitor_share_pct, 0)}</td>
                          <td className="text-right tabular-nums text-stone-600">{pct(tag.category_share_pct, 0)}</td>
                          <td className="text-right tabular-nums font-semibold text-stone-900">{decimal(tag.lift)} lần</td>
                          <td className="whitespace-nowrap text-right">
                            <span className={trusted ? 'tabular-nums text-stone-800' : 'tabular-nums text-stone-400'}>
                              {pct(low, 0)} đến {pct(high, 0)}
                            </span>
                            <span className="ml-1.5 text-[11px] text-stone-400">ước lượng</span>
                          </td>
                        </tr>
                      );
                    })}
                  </DataTable>
                )}

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-3">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-stone-500" aria-hidden />
                  <p className="m-0 text-xs leading-relaxed text-stone-600">
                    {data.note} Con số "traffic có thể tăng" là một khoảng ước lượng, không phải mức chắc chắn đạt được, và
                    không phải cam kết.
                  </p>
                </div>
              </InsightCard>

              {data.my_tags.length > 0 && (
                <InsightCard title="Tag shop bạn đang dùng" description="Để đối chiếu với bảng trên.">
                  <div className="flex flex-wrap gap-1.5">
                    {data.my_tags.map(tag => (
                      <Chip key={tag} tone="neutral">{tagLabel(tag, tag)}</Chip>
                    ))}
                  </div>
                </InsightCard>
              )}
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
