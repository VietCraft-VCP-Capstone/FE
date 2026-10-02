/**
 * F32 · Đối thủ cùng danh mục — GET /seller/analytics/competitors?categoryId=
 *
 * Trả lời câu hỏi của người bán: "Tôi đang cạnh tranh với ai trong danh mục này?"
 *
 * Ba khối: vị trí của shop mình trong danh mục (phân vị giá / phân vị điểm), 20 listing
 * bán chạy nhất của người khác, và các listing của mình kèm hạng trong danh mục.
 *
 * Lưu ý dữ liệu: mỗi dòng đối thủ CHỈ có `shop_name`, không có `shop_id` (xem types.ts),
 * nên trang này không thể gọi trackCompetitor cho từng dòng. Việc thêm shop theo dõi
 * nằm ở trang F36 (nhập mã shop). Không tự suy ra mã shop từ tên.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { useInsight } from '../hooks/useInsight';
import type { Competitors } from '../types';
import { InsightPage } from '../components/InsightPage';
import { InsightBlock, InsightStatusView } from '../components/InsightBlock';
import { SourceFooter } from '../components/SourceFooter';
import { DataTable, InsightCard, Note, SelectField } from '../components/ui';
import { MiniStat } from '../components/charts/MiniViz';
import { NA, decimal } from '../format';
import { categoryLabel } from '../labels';
import { count, money } from '../../../shared/utils/format';

const INSIGHTS_ROOT = '/seller/insights';

/** "Giá của bạn cao hơn 52% listing trong danh mục này." */
function higherThan(p: number | null | undefined): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return NA;
  return `Cao hơn ${p}%`;
}

function remainderHint(p: number | null | undefined, what: string): string | undefined {
  if (p === null || p === undefined || !Number.isFinite(p)) return undefined;
  return `Còn ${Math.max(0, 100 - p)}% listing trong danh mục có ${what} cao hơn bạn.`;
}

function ratingCell(rating: number | null, nReviews?: number) {
  if (rating === null || rating === undefined) {
    return <span className="text-stone-500">{NA}</span>;
  }
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold text-stone-800">{decimal(rating, 2)}</span>
      <span className="text-stone-500"> / 5</span>
      {nReviews !== undefined && <span className="text-stone-500"> ({count(nReviews)} đánh giá)</span>}
    </span>
  );
}

/** Bảng listing của shop mình: mặc định 10 dòng, mở rộng khi người bán muốn xem hết. */
function MyListingsTable({ rows }: { rows: Competitors['my_listings'] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, 10);

  return (
    <>
      <DataTable
        caption="Sản phẩm của shop bạn trong danh mục này"
        head={
          <>
            <th scope="col">Sản phẩm</th>
            <th scope="col" className="text-right">Giá</th>
            <th scope="col" className="text-right">Bán 90 ngày</th>
            <th scope="col">Đánh giá</th>
            <th scope="col" className="text-right">Hạng trong danh mục</th>
          </>
        }
      >
        {shown.map(row => (
          <tr key={row.listing_id}>
            <td>
              <Link
                to={`${INSIGHTS_ROOT}/listings/${row.listing_id}`}
                title={row.title}
                className="block max-w-[34ch] truncate font-medium text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
              >
                {row.title}
              </Link>
            </td>
            <td className="text-right tabular-nums">{money(row.price_vnd)}</td>
            <td className="text-right tabular-nums">{count(row.est_sales_90d)}</td>
            <td>{ratingCell(row.rating_shrunk)}</td>
            <td className="whitespace-nowrap text-right tabular-nums text-stone-700">
              hạng {count(row.rank_in_cat)} / {count(row.n_in_cat)}
            </td>
          </tr>
        ))}
      </DataTable>

      {rows.length > 10 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="cursor-pointer rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
          >
            {expanded ? 'Thu gọn danh sách' : `Xem tất cả ${count(rows.length)} sản phẩm`}
          </button>
        </div>
      )}
    </>
  );
}

export function CompetitorsPage() {
  const [params, setParams] = useSearchParams();
  const urlCategory = params.get('categoryId') || '';
  const { state, reload } = useInsight<Competitors>('/competitors', { categoryId: urlCategory || undefined });

  // Không truyền categoryId thì service tự chọn một danh mục và trả về trong category_id.
  // Nhớ lại giá trị đó để ô chọn không bị trống và không phải gọi lại API lần hai.
  const [resolved, setResolved] = useState<{ id: string; list: string[] } | null>(null);
  useEffect(() => {
    if (state.kind === 'ready') {
      setResolved({ id: state.data.category_id, list: state.data.available_categories });
    }
  }, [state]);

  const options = useMemo(() => {
    const ids = resolved?.list.length ? resolved.list : urlCategory ? [urlCategory] : [];
    return ids
      .map(id => ({ value: id, label: categoryLabel(id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [resolved, urlCategory]);

  const selected = urlCategory || resolved?.id || '';

  function pickCategory(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('categoryId', value);
    else next.delete('categoryId');
    setParams(next);
  }

  return (
    <InsightPage
      title="Đối thủ cùng danh mục"
      question="Tôi đang cạnh tranh với ai trong danh mục này?"
      actions={
        options.length > 0 && (
          <SelectField label="Danh mục" value={selected} onChange={pickCategory} options={options} />
        )
      }
    >
      {state.kind !== 'ready' ? (
        <InsightCard>
          <InsightStatusView state={state} onRetry={reload} />
        </InsightCard>
      ) : (
        <InsightBlock state={state} onRetry={reload}>
          {(data, meta) => (
            <div className="space-y-5">
              <InsightCard
                title="Vị trí của tôi"
                description={`Tính trên các sản phẩm của bạn thuộc danh mục ${categoryLabel(data.category_id)}.`}
                footer={<SourceFooter meta={meta} />}
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                  <MiniStat
                    label="Phân vị giá"
                    value={higherThan(data.my_position.price_percentile)}
                    hint={remainderHint(data.my_position.price_percentile, 'giá')}
                  />
                  <MiniStat
                    label="Phân vị điểm đánh giá"
                    value={higherThan(data.my_position.rating_percentile)}
                    hint={remainderHint(data.my_position.rating_percentile, 'điểm đánh giá')}
                  />
                  <MiniStat
                    label="Giá trung bình của bạn"
                    value={data.my_position.my_avg_price_vnd === null ? NA : money(data.my_position.my_avg_price_vnd)}
                    hint="Trung bình các listing của bạn trong danh mục này."
                  />
                  <MiniStat
                    label="Điểm đánh giá trung bình"
                    value={
                      data.my_position.my_avg_rating === null
                        ? NA
                        : `${decimal(data.my_position.my_avg_rating, 2)} / 5`
                    }
                    hint="Điểm đã làm mượt theo số lượt đánh giá."
                  />
                </div>
                <div className="mt-4">
                  <Note>
                    Phân vị đọc như sau: phân vị giá {data.my_position.price_percentile ?? '?'} nghĩa là giá của bạn
                    cao hơn {data.my_position.price_percentile ?? '?'}% listing trong danh mục, chứ không phải điểm
                    chất lượng.
                  </Note>
                </div>
              </InsightCard>

              <InsightCard
                title="20 listing bán chạy nhất danh mục"
                description="Xếp theo số lượng bán ước lượng trong 90 ngày."
                footer={<SourceFooter meta={meta} limitation={data.note} />}
              >
                {data.competitors.length === 0 ? (
                  <Note>Danh mục này chưa có listing nào của người bán khác để so sánh.</Note>
                ) : (
                  <>
                    <DataTable
                      caption="Hai mươi listing bán chạy nhất trong danh mục"
                      head={
                        <>
                          <th scope="col" className="text-right">Hạng</th>
                          <th scope="col">Shop</th>
                          <th scope="col">Sản phẩm</th>
                          <th scope="col" className="text-right">Giá</th>
                          <th scope="col" className="text-right">Bán 90 ngày</th>
                          <th scope="col">Đánh giá</th>
                          <th scope="col" className="text-right">Lượt thích</th>
                        </>
                      }
                    >
                      {data.competitors.map(row => (
                        <tr key={row.listing_id}>
                          <td className="text-right font-jakarta font-bold tabular-nums text-stone-900">{row.rank}</td>
                          <td>
                            <span className="block max-w-[24ch] truncate font-medium text-stone-800" title={row.shop_name}>
                              {row.shop_name}
                            </span>
                          </td>
                          <td>
                            <span className="block max-w-[30ch] truncate text-stone-600" title={row.title}>
                              {row.title}
                            </span>
                          </td>
                          <td className="text-right tabular-nums">{money(row.price_vnd)}</td>
                          <td className="text-right tabular-nums">{count(row.est_sales_90d)}</td>
                          <td>{ratingCell(row.rating_shrunk, row.n_reviews)}</td>
                          <td className="text-right tabular-nums">{count(row.favorite_count)}</td>
                        </tr>
                      ))}
                    </DataTable>
                    <div className="mt-4">
                      <Note>
                        Bảng này chỉ có tên shop, chưa kèm mã shop, nên không thêm shop theo dõi trực tiếp từ đây.{' '}
                        <Link
                          to={`${INSIGHTS_ROOT}/tracking`}
                          className="inline-flex items-center gap-1 font-semibold text-[#007700] no-underline transition-colors duration-150 hover:text-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                        >
                          <Radar size={14} aria-hidden /> Theo dõi đối thủ
                        </Link>{' '}
                        cho phép thêm bằng mã shop.
                      </Note>
                    </div>
                  </>
                )}
              </InsightCard>

              <InsightCard
                title="Sản phẩm của bạn trong danh mục này"
                description="Hạng tính trên toàn bộ listing cùng danh mục, theo số bán ước lượng 90 ngày."
                footer={<SourceFooter meta={meta} limitation={data.note} />}
              >
                {data.my_listings.length === 0 ? (
                  <Note>
                    Bạn chưa có sản phẩm nào trong danh mục {categoryLabel(data.category_id)}. Chọn danh mục khác để xem
                    vị trí của mình.
                  </Note>
                ) : (
                  <MyListingsTable rows={data.my_listings} />
                )}
              </InsightCard>
            </div>
          )}
        </InsightBlock>
      )}
    </InsightPage>
  );
}
