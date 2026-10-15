/**
 * Trang chọn sản phẩm để xem sâu (F27 + F28 + F29 nằm ở trang chi tiết).
 *
 * Không có endpoint riêng cho "danh sách sản phẩm của tôi trong phân tích", nên ghép hai
 * nguồn đã có: F26 cho nhóm bán chạy nhất, F32 cho toàn bộ sản phẩm của shop trong một
 * danh mục (F32 kèm luôn hạng trong danh mục, thứ mà F26 không có).
 */

import { useState } from 'react';
import { ChevronRight, Search, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { count, money } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { DataTable, InsightCard, Note, SelectField } from '../components/ui';
import { NA, decimal } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel } from '../labels';
import type { Competitors, ShopOverview } from '../types';

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
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query, 250).trim().toLowerCase();

  const overview = useInsight<ShopOverview>('/overview', { timeRange: '30d' });
  const inCategory = useInsight<Competitors>('/competitors', { categoryId });

  const setCategory = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('categoryId', value);
    setParams(next, { replace: true });
  };

  return (
    <InsightPage title="Sức khoẻ sản phẩm" question="Sản phẩm nào cần xem kỹ trước?">
      <div className="space-y-5">
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
