/**
 * F32 · Ai đang bán chạy — GET /seller/analytics/competitors?categoryId=
 *
 * Trả lời: "Trong danh mục của tôi, ai đang bán chạy và tôi đứng ở đâu?" Viết cho người bán
 * mới: kết luận một câu trước, số liệu sau, và một việc làm ngay (theo dõi shop bán chạy nhất).
 * Gian hàng thật nhận `shop_id` từng dòng nên theo dõi được ngay trên bảng; shop mẫu thì không.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Radar, UserPlus } from 'lucide-react';
import { invalidateInsights, useInsight } from '../hooks/useInsight';
import { analyticsApi, analyticsErrorMessage } from '../services/analyticsApi';
import type { CompetitorTracking, Competitors } from '../types';
import { InsightPage } from '../components/InsightPage';
import { InsightBlock, InsightStatusView } from '../components/InsightBlock';
import { SourceFooter } from '../components/SourceFooter';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, SelectField, Takeaway } from '../components/ui';
import { MiniStat } from '../components/charts/MiniViz';
import { NA, decimal } from '../format';
import { categoryLabel } from '../labels';
import { count, money } from '../../../shared/utils/format';

const INSIGHTS_ROOT = '/seller/insights';

/** Phân vị giá đọc thành lời. Phân vị tính cả chính mình nên giá cao nhất là 100%. */
function priceWords(p: number | null | undefined): string | null {
  if (p === null || p === undefined || !Number.isFinite(p)) return null;
  if (p >= 90) return 'thuộc nhóm đắt nhất danh mục';
  if (p <= 10) return 'thuộc nhóm rẻ nhất danh mục';
  return `đắt hơn ${p}% sản phẩm cùng danh mục`;
}

function ratingCell(rating: number | null, nReviews?: number) {
  if (rating === null || rating === undefined) {
    return <span className="text-stone-500">Chưa có</span>;
  }
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold text-stone-800">{decimal(rating, 1)}</span>
      <span className="text-stone-500"> / 5</span>
      {nReviews !== undefined && <span className="text-stone-500"> ({count(nReviews)} đánh giá)</span>}
    </span>
  );
}

/** Bảng sản phẩm của shop mình: mặc định 10 dòng, mở rộng khi người bán muốn xem hết. */
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
            <th scope="col" className="text-right">Đã bán (90 ngày)</th>
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
              {count(row.rank_in_cat)} / {count(row.n_in_cat)}
            </td>
          </tr>
        ))}
      </DataTable>

      {rows.length > 10 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="cursor-pointer rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
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

  // Không truyền categoryId thì service tự chọn danh mục chính và trả về trong category_id.
  // Nhớ lại giá trị đó để ô chọn không bị trống và không phải gọi lại API lần hai.
  const [resolved, setResolved] = useState<{ id: string; list: string[]; names: Record<string, string | null> } | null>(null);
  useEffect(() => {
    if (state.kind === 'ready') {
      setResolved({ id: state.data.category_id, list: state.data.available_categories, names: state.data.category_names ?? {} });
    }
  }, [state]);

  const options = useMemo(() => {
    const ids = resolved?.list.length ? resolved.list : urlCategory ? [urlCategory] : [];
    return ids
      .map(id => ({ value: id, label: categoryLabel(id, resolved?.names[id]) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [resolved, urlCategory]);

  const selected = urlCategory || resolved?.id || '';

  const canTrack = state.kind === 'ready' && state.data.competitors.some(c => c.shop_id);
  const tracking = useInsight<CompetitorTracking>(canTrack ? '/competitor-tracking' : null);
  const trackedIds = useMemo(
    () => new Set(tracking.state.kind === 'ready' ? tracking.state.data.tracked.map(t => t.shop_id) : []),
    [tracking.state],
  );
  const [pendingShop, setPendingShop] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);

  async function track(shopId: string, shopName: string) {
    setPendingShop(shopId);
    setNotice(null);
    try {
      await analyticsApi.trackCompetitor(shopId);
      invalidateInsights('/competitor-tracking');
      tracking.reload();
      setNotice({ tone: 'good', text: `Đã theo dõi ${shopName}. Hàng mới của shop này sẽ hiện ở mục Đối thủ đang theo dõi.` });
    } catch (err) {
      setNotice({ tone: 'bad', text: analyticsErrorMessage(err, 'Không theo dõi được shop này.') });
    } finally {
      setPendingShop(null);
    }
  }

  function pickCategory(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('categoryId', value);
    else next.delete('categoryId');
    setParams(next);
  }

  return (
    <InsightPage
      title="Ai đang bán chạy"
      question="Trong danh mục của tôi, ai đang bán chạy và tôi đứng ở đâu?"
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
          {(data, meta) => {
            const catName = categoryLabel(data.category_id, data.category_names?.[data.category_id]);
            const best = data.my_listings[0];
            const top = data.competitors[0];
            const price = priceWords(data.my_position.price_percentile);
            // Việc nên làm: theo dõi shop bán chạy nhất mà mình chưa theo dõi.
            const nextRival = canTrack && tracking.state.kind === 'ready'
              ? data.competitors.find(c => c.shop_id && !trackedIds.has(c.shop_id))
              : undefined;

            return (
              <div className="space-y-5">
                <Takeaway
                  action={
                    nextRival ? (
                      <button
                        type="button"
                        onClick={() => track(nextRival.shop_id!, nextRival.shop_name)}
                        disabled={pendingShop !== null}
                        className={ACTION_CLASS}
                      >
                        <UserPlus size={15} aria-hidden />
                        {pendingShop === nextRival.shop_id ? 'Đang theo dõi...' : `Theo dõi ${nextRival.shop_name}`}
                      </button>
                    ) : canTrack ? (
                      <Link to={`${INSIGHTS_ROOT}/tracking`} className={ACTION_CLASS}>Xem đối thủ đang theo dõi</Link>
                    ) : undefined
                  }
                >
                  {best
                    ? <>Trong <strong>{catName}</strong>, sản phẩm bán chạy nhất của bạn đứng hạng <strong>{count(best.rank_in_cat)}/{count(best.n_in_cat)}</strong>. </>
                    : <>Bạn chưa có sản phẩm nào trong <strong>{catName}</strong>. </>}
                  {price && data.my_position.my_avg_price_vnd !== null && (
                    <>Giá trung bình của bạn {money(data.my_position.my_avg_price_vnd)}, {price}. </>
                  )}
                  {top && (
                    <>Bán chạy nhất là <strong>{top.title}</strong> của {top.shop_name} ({count(top.est_sales_90d)} cái trong 90 ngày).</>
                  )}
                </Takeaway>
                {notice && (
                  <p aria-live="polite" className={`m-0 text-[13px] font-medium ${notice.tone === 'good' ? 'text-[#005B00]' : 'text-red-700'}`}>
                    {notice.text}
                  </p>
                )}

                <InsightCard
                  title="Bạn đứng ở đâu trong danh mục"
                  description={`So các sản phẩm của bạn với mọi sản phẩm thuộc ${catName}.`}
                  footer={<SourceFooter meta={meta} />}
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    <MiniStat
                      label="Giá trung bình của bạn"
                      value={data.my_position.my_avg_price_vnd === null ? NA : money(data.my_position.my_avg_price_vnd)}
                      hint={price ? `Bạn ${price}.` : undefined}
                    />
                    <MiniStat
                      label="Điểm đánh giá của bạn"
                      value={data.my_position.my_avg_rating === null ? 'Chưa có' : `${decimal(data.my_position.my_avg_rating, 1)} / 5`}
                      hint={
                        data.my_position.rating_percentile === null
                          ? 'Chưa có khách đánh giá sản phẩm trong danh mục này.'
                          : `Cao hơn ${data.my_position.rating_percentile}% sản phẩm cùng danh mục.`
                      }
                    />
                    <MiniStat
                      label="Sản phẩm của bạn ở đây"
                      value={`${count(data.my_listings.length)} sản phẩm`}
                    />
                    {best && (
                      <MiniStat
                        label="Sản phẩm của shop khác"
                        value={`${count(best.n_in_cat - data.my_listings.length)} sản phẩm`}
                        hint="Đang bán cùng danh mục với bạn."
                      />
                    )}
                  </div>
                </InsightCard>

                <InsightCard
                  title="20 sản phẩm bán chạy nhất của shop khác"
                  description="Xếp theo số đã bán trong 90 ngày. Bấm Theo dõi để được báo khi shop đó ra hàng mới."
                  footer={<SourceFooter meta={meta} limitation={data.note} />}
                >
                  {data.competitors.length === 0 ? (
                    <Note>Danh mục này chưa có sản phẩm nào của người bán khác để so sánh.</Note>
                  ) : (
                    <>
                      <DataTable
                        caption="Hai mươi sản phẩm bán chạy nhất của shop khác trong danh mục"
                        head={
                          <>
                            <th scope="col" className="text-right">Hạng</th>
                            <th scope="col">Shop</th>
                            <th scope="col">Sản phẩm</th>
                            <th scope="col" className="text-right">Giá</th>
                            <th scope="col" className="text-right">Đã bán (90 ngày)</th>
                            <th scope="col">Đánh giá</th>
                            <th scope="col" className="text-right">Được yêu thích</th>
                            {canTrack && <th scope="col" className="text-right"><span className="sr-only">Theo dõi</span></th>}
                          </>
                        }
                      >
                        {data.competitors.map(row => (
                          <tr key={row.listing_id}>
                            <td className="text-right font-jakarta font-bold tabular-nums text-stone-900">{row.rank}</td>
                            <td>
                              {row.shop_id ? (
                                <Link
                                  to={`/seller/competitors/${row.shop_id}`}
                                  title={`Xem hồ sơ ${row.shop_name}`}
                                  className="block max-w-[24ch] truncate font-medium text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                                >
                                  {row.shop_name}
                                </Link>
                              ) : (
                                <span className="block max-w-[24ch] truncate font-medium text-stone-800" title={row.shop_name}>
                                  {row.shop_name}
                                </span>
                              )}
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
                            {canTrack && (
                              <td className="text-right">
                                {row.shop_id && (trackedIds.has(row.shop_id) ? (
                                  <Chip tone="good">Đang theo dõi</Chip>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => track(row.shop_id!, row.shop_name)}
                                    disabled={pendingShop !== null || tracking.state.kind !== 'ready'}
                                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                  >
                                    <UserPlus size={13} aria-hidden />
                                    {pendingShop === row.shop_id ? 'Đang thêm' : 'Theo dõi'}
                                  </button>
                                ))}
                              </td>
                            )}
                          </tr>
                        ))}
                      </DataTable>
                      <div className="mt-4">
                        <Note>
                          {canTrack
                            ? 'Theo dõi tối đa 10 shop. Hàng mới của họ hiện ở mục '
                            : 'Bảng này chưa kèm mã shop nên không theo dõi trực tiếp từ đây được. Thêm shop ở mục '}
                          <Link
                            to={`${INSIGHTS_ROOT}/tracking`}
                            className="inline-flex items-center gap-1 font-semibold text-[#007700] no-underline transition-colors duration-150 hover:text-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                          >
                            <Radar size={14} aria-hidden /> Đối thủ đang theo dõi
                          </Link>
                          .
                        </Note>
                      </div>
                    </>
                  )}
                </InsightCard>

                <InsightCard
                  title="Sản phẩm của bạn trong danh mục này"
                  description="Hạng tính theo số đã bán trong 90 ngày, so với mọi sản phẩm cùng danh mục. Bấm tên sản phẩm để xem chi tiết."
                  footer={<SourceFooter meta={meta} limitation={data.note} />}
                >
                  {data.my_listings.length === 0 ? (
                    <Note>
                      Bạn chưa có sản phẩm nào trong danh mục {catName}. Chọn danh mục khác để xem vị trí của mình.
                    </Note>
                  ) : (
                    <MyListingsTable rows={data.my_listings} />
                  )}
                </InsightCard>
              </div>
            );
          }}
        </InsightBlock>
      )}
    </InsightPage>
  );
}
