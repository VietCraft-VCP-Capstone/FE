/**
 * Trang chọn sản phẩm để xem sâu (F27 + F28 + F29 nằm ở trang chi tiết).
 *
 * Nguồn chính: F29 `GET /seller/analytics/listings/health` — BE đọc thẳng
 * `listing_health_scores`, trả TOÀN BỘ sản phẩm thật của shop (loại `seed_ref`) kèm
 * điểm mới nhất. Hai khối bên dưới (bán chạy nhất, xếp hạng theo danh mục) ghép từ F26
 * và F32, giữ nguyên vì cho góc nhìn khác (doanh thu, hạng cạnh tranh) mà danh sách sức
 * khoẻ không có.
 */

import { useState } from 'react';
import { AlertTriangle, ChevronRight, Search, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { count, money } from '../../../shared/utils/format';
import { AXIS_ORDER, HEALTH_BANDS, HealthExplainer } from '../components/HealthParts';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, DataTable, InsightCard, Note, SelectField, type Tone } from '../components/ui';
import { HEALTH_STATUS_LABEL, NA, decimal } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel } from '../labels';
import type { Competitors, HealthStatus, ListingHealthList, ShopOverview } from '../types';

const HEALTH_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả mức điểm' },
  { value: 'good', label: HEALTH_STATUS_LABEL.good },
  { value: 'needs_improvement', label: HEALTH_STATUS_LABEL.needs_improvement },
  { value: 'poor', label: HEALTH_STATUS_LABEL.poor },
];

function healthTone(status: HealthStatus | null): Tone {
  if (status === 'good') return 'good';
  if (status === 'poor') return 'bad';
  if (status === 'needs_improvement') return 'warn';
  return 'neutral';
}

function ListingLink({ id, title }: { id: string; title: string }) {
  return (
    <Link
      to={`/seller/insights/listings/${id}`}
      className="font-semibold text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
    >
      {title}
    </Link>
  );
}

export function ListingsPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get('categoryId') || undefined;
  const healthStatus = params.get('health') || '';
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query, 250).trim().toLowerCase();
  const [healthQuery, setHealthQuery] = useState('');
  const healthSearch = useDebouncedValue(healthQuery, 250).trim().toLowerCase();

  // Lấy cả shop một lần rồi lọc ở máy: phần tổng quan cần đếm đủ mọi mức điểm.
  const health = useInsight<ListingHealthList>('/listings/health');
  const overview = useInsight<ShopOverview>('/overview', { timeRange: '30d' });
  const inCategory = useInsight<Competitors>('/competitors', { categoryId });

  const setCategory = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('categoryId', value);
    setParams(next, { replace: true });
  };

  const setHealthStatus = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('health', value);
    else next.delete('health');
    setParams(next, { replace: true });
  };

  return (
    <InsightPage title="Sức khoẻ sản phẩm" question="Sản phẩm nào cần xem kỹ trước?">
      <div className="space-y-5">
        <InsightBlock state={health.state} onRetry={health.reload}>
          {(data, meta) => {
            const scored = data.items.filter(item => item.score !== null);
            const counts = {
              good: scored.filter(i => i.status === 'good').length,
              needs_improvement: scored.filter(i => i.status === 'needs_improvement').length,
              poor: scored.filter(i => i.status === 'poor').length,
            };
            const avg = scored.length ? scored.reduce((s, i) => s + (i.score as number), 0) / scored.length : null;
            const unscored = data.items.length - scored.length;
            const counted = AXIS_ORDER.filter(axis => scored.some(i => !i.axes_missing.includes(axis)));
            const missing = AXIS_ORDER.filter(axis => !counted.includes(axis));

            // Thấp điểm lên trước: trang này trả lời "sản phẩm nào cần xem trước".
            const rows = data.items
              .filter(item => !healthStatus || item.status === healthStatus)
              .filter(item => !healthSearch || item.title.toLowerCase().includes(healthSearch))
              .sort((a, b) => (a.score ?? 101) - (b.score ?? 101));

            return (
              <InsightCard
                title="Sức khoẻ từng sản phẩm"
                description="Bấm vào một sản phẩm để xem chi tiết điểm từng tiêu chí và cách tăng điểm."
                bodyClassName="px-5 py-4"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <SelectField label="Mức điểm" value={healthStatus} onChange={setHealthStatus} options={HEALTH_STATUS_OPTIONS} />
                    <div className="flex h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 focus-within:border-[#007700]">
                      <Search size={15} className="shrink-0 text-stone-400" aria-hidden />
                      <input
                        type="search"
                        value={healthQuery}
                        onChange={e => setHealthQuery(e.target.value)}
                        placeholder="Tìm theo tên sản phẩm"
                        aria-label="Tìm sản phẩm theo tên"
                        className="w-44 border-none bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                }
                footer={<SourceFooter meta={meta} />}
              >
                {data.items.length > 0 && (
                  <div className="mb-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
                        <span className="block text-xs font-semibold text-stone-500">Điểm trung bình của shop</span>
                        <span className="mt-1 block font-jakarta text-2xl font-extrabold leading-none text-stone-900">
                          {avg === null ? NA : decimal(avg, 1)}
                        </span>
                        <span className="mt-1 block text-xs text-stone-500">
                          {scored.length} sản phẩm đã chấm{unscored > 0 ? ` · ${unscored} đang chờ chấm` : ''}
                        </span>
                      </div>
                      {HEALTH_BANDS.map(band => {
                        const active = healthStatus === band.status;
                        return (
                          <button
                            key={band.status}
                            type="button"
                            onClick={() => setHealthStatus(active ? '' : band.status)}
                            aria-pressed={active}
                            className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors duration-150 motion-reduce:transition-none ${active ? 'border-[#007700] bg-[#F3F7EE]' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                          >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                              <Chip tone={band.tone}>{band.label}</Chip> {band.range}
                            </span>
                            <span className="mt-1 block font-jakarta text-2xl font-extrabold leading-none text-stone-900">
                              {count(counts[band.status])}
                            </span>
                            <span className="mt-1 block text-xs text-stone-500">{active ? 'Đang lọc · bấm để bỏ lọc' : 'sản phẩm · bấm để lọc'}</span>
                          </button>
                        );
                      })}
                    </div>
                    <HealthExplainer counted={counted} missing={missing} />
                  </div>
                )}

                {unscored > 0 && (
                  <div className="mb-3">
                    <Note>Sản phẩm mới tạo hoặc vừa sửa sẽ có điểm sau khoảng 1 phút.</Note>
                  </div>
                )}

                {rows.length === 0 ? (
                  <Note>
                    {healthSearch || healthStatus
                      ? 'Không có sản phẩm nào khớp với bộ lọc hiện tại.'
                      : 'Shop bạn chưa có sản phẩm nào. Đăng sản phẩm đầu tiên, điểm sẽ hiện sau khoảng 1 phút.'}
                  </Note>
                ) : (
                  <DataTable
                    caption="Toàn bộ sản phẩm thật của shop kèm điểm sức khoẻ mới nhất"
                    head={
                      <>
                        <th scope="col">Sản phẩm</th>
                        <th scope="col" className="text-right">Điểm</th>
                        <th scope="col">Mức</th>
                        <th scope="col">Việc nên làm đầu tiên</th>
                        <th scope="col" className="w-10"><span className="sr-only">Xem chi tiết</span></th>
                      </>
                    }
                  >
                    {rows.map(item => (
                      <tr key={item.product_id} className="transition-colors duration-150 hover:bg-stone-50 motion-reduce:transition-none">
                        <td>
                          <div className="flex items-center gap-2.5">
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" aria-hidden />
                            ) : (
                              <span className="h-9 w-9 shrink-0 rounded-lg bg-stone-100" aria-hidden />
                            )}
                            <ListingLink id={item.product_id} title={item.title} />
                          </div>
                        </td>
                        <td className="text-right tabular-nums font-semibold text-stone-900">
                          {item.score === null ? <span className="text-xs font-normal text-stone-400">Chưa chấm</span> : decimal(item.score, 1)}
                        </td>
                        <td>
                          {item.status ? <Chip tone={healthTone(item.status)}>{HEALTH_STATUS_LABEL[item.status] ?? item.status}</Chip> : <span className="text-xs text-stone-400">{NA}</span>}
                        </td>
                        <td className="max-w-[340px] text-xs leading-relaxed text-stone-600">
                          {item.score === null ? (
                            <span className="text-stone-400">Đang chờ chấm</span>
                          ) : item.top_todo ? (
                            <>
                              {item.top_todo.message}
                              {item.top_todo.impact != null && item.top_todo.impact > 0 && (
                                <span className="ml-1 whitespace-nowrap font-semibold text-[#005B00]">+{item.top_todo.impact.toLocaleString('vi-VN')} điểm</span>
                              )}
                              {(item.n_todos ?? 0) > 1 && <span className="ml-1 text-stone-400">· thêm {(item.n_todos as number) - 1} việc</span>}
                            </>
                          ) : (
                            <span className="text-stone-500">Đã đạt mọi mốc hiện có</span>
                          )}
                          {(item.n_warnings ?? 0) > 0 && (
                            <span className="mt-0.5 flex items-center gap-1 text-amber-700">
                              <AlertTriangle size={12} aria-hidden /> {item.n_warnings} mục cần kiểm tra
                            </span>
                          )}
                        </td>
                        <td className="text-right text-stone-400"><ChevronRight size={16} aria-hidden /></td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </InsightCard>
            );
          }}
        </InsightBlock>

        <InsightCard
          title="Bán chạy nhất 30 ngày qua"
          description="Bắt đầu từ đây: sản phẩm đang mang tiền về cũng là sản phẩm mà một sự cố nhỏ gây thiệt hại lớn nhất."
          bodyClassName="px-5 py-4"
          footer={overview.state.kind === 'ready' ? <SourceFooter meta={overview.state.meta} /> : undefined}
        >
          <InsightBlock state={overview.state} onRetry={overview.reload} compact>
            {data =>
              data.top_products.length === 0 ? (
                <Note>Ba mươi ngày qua chưa có sản phẩm nào phát sinh đơn.</Note>
              ) : (
                <DataTable
                  caption="Năm sản phẩm nhiều doanh thu nhất 30 ngày qua"
                  head={
                    <>
                      <th scope="col">Sản phẩm</th>
                      <th scope="col" className="text-right">Đơn</th>
                      <th scope="col" className="text-right">Doanh thu</th>
                      <th scope="col" className="w-10"><span className="sr-only">Xem chi tiết</span></th>
                    </>
                  }
                >
                  {data.top_products.map(product => (
                    <tr key={product.listing_id} className="transition-colors duration-150 hover:bg-stone-50 motion-reduce:transition-none">
                      <td><ListingLink id={product.listing_id} title={product.title} /></td>
                      <td className="text-right tabular-nums text-stone-700">{count(product.orders)}</td>
                      <td className="text-right font-semibold tabular-nums text-stone-900">{money(product.revenue_vnd)}</td>
                      <td className="text-right text-stone-400"><ChevronRight size={16} aria-hidden /></td>
                    </tr>
                  ))}
                </DataTable>
              )
            }
          </InsightBlock>
        </InsightCard>

        <InsightBlock state={inCategory.state} onRetry={inCategory.reload}>
          {(data, meta) => {
            const rows = data.my_listings
              .filter(item => !search || item.title.toLowerCase().includes(search))
              .sort((a, b) => a.rank_in_cat - b.rank_in_cat);

            return (
              <InsightCard
                title="Tất cả sản phẩm trong một danh mục"
                description="Hạng trong danh mục tính trên doanh số ước lượng 90 ngày, so với mọi sản phẩm cùng danh mục trên sàn."
                bodyClassName="px-5 py-4"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <SelectField
                      label="Danh mục"
                      value={data.category_id}
                      onChange={setCategory}
                      options={data.available_categories.map(id => ({ value: id, label: categoryLabel(id) }))}
                    />
                    <div className="flex h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 focus-within:border-[#007700]">
                      <Search size={15} className="shrink-0 text-stone-400" aria-hidden />
                      <input
                        type="search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Tìm theo tên sản phẩm"
                        aria-label="Tìm sản phẩm theo tên"
                        className="w-44 border-none bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                }
                footer={<SourceFooter meta={meta} limitation={data.note} />}
              >
                {rows.length === 0 ? (
                  <Note>
                    {search
                      ? `Không có sản phẩm nào trong danh mục này khớp với "${query}".`
                      : 'Shop bạn chưa có sản phẩm nào trong danh mục này.'}
                  </Note>
                ) : (
                  <DataTable
                    caption={`Sản phẩm của shop trong danh mục ${categoryLabel(data.category_id)}`}
                    head={
                      <>
                        <th scope="col">Sản phẩm</th>
                        <th scope="col" className="text-right">Giá</th>
                        <th scope="col" className="text-right">Bán 90 ngày</th>
                        <th scope="col" className="text-right">Đánh giá</th>
                        <th scope="col" className="text-right">Hạng danh mục</th>
                        <th scope="col" className="w-10"><span className="sr-only">Xem chi tiết</span></th>
                      </>
                    }
                  >
                    {rows.map(item => (
                      <tr key={item.listing_id} className="transition-colors duration-150 hover:bg-stone-50 motion-reduce:transition-none">
                        <td><ListingLink id={item.listing_id} title={item.title} /></td>
                        <td className="whitespace-nowrap text-right tabular-nums text-stone-700">{money(item.price_vnd)}</td>
                        <td className="text-right tabular-nums text-stone-700">{count(item.est_sales_90d)}</td>
                        <td className="whitespace-nowrap text-right tabular-nums text-stone-700">
                          {item.rating_shrunk === null ? (
                            <span className="text-xs text-stone-400">{NA}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Star size={13} className="text-amber-500" aria-hidden />
                              {decimal(item.rating_shrunk)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-right tabular-nums text-stone-600">
                          {count(item.rank_in_cat)} / {count(item.n_in_cat)}
                        </td>
                        <td className="text-right text-stone-400"><ChevronRight size={16} aria-hidden /></td>
                      </tr>
                    ))}
                  </DataTable>
                )}

                <div className="mt-4">
                  <Note>
                    Đây là danh sách sản phẩm CÓ SỐ LIỆU PHÂN TÍCH, nên có thể khác danh sách ở khu vận hành. Mã sản phẩm
                    dùng cho phân tích và mã sản phẩm trên sàn là hai hệ khác nhau, chưa nối được với nhau.
                  </Note>
                </div>
              </InsightCard>
            );
          }}
        </InsightBlock>
      </div>
    </InsightPage>
  );
}
