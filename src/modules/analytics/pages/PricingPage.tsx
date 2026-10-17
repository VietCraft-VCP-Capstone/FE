/**
 * F35 — Mặt bằng giá. Trả lời: "Giá của tôi đang đứng ở đâu so với nhóm bán chạy?"
 *
 * Đọc GET /seller/analytics/pricing (tham số productType, price).
 *
 * Trang này CHỈ trả lời "giá này đứng ở đâu". Nó KHÔNG hứa "giá nào bán chạy hơn", vì
 * nhóm đã đo và chỉ 24 trên 94 loại phôi có thứ tự giá đúng theo mức bán chạy, gần bằng
 * mức ngẫu nhiên. Trình bày như một công cụ tăng doanh số là hứa thứ không đo được.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { compactMoney, count, money } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { DistributionRuler, MiniStat, type RulerTick } from '../components/charts/MiniViz';
import { Chip, DataTable, InsightCard, Note, SelectField, type Tone } from '../components/ui';
import { NA, pct } from '../format';
import { useInsight } from '../hooks/useInsight';
import { productTypeLabel } from '../labels';
import type { PriceBand, PricingAnalysis } from '../types';

const BAND: Record<PriceBand, { label: string; tone: Tone; say: string }> = {
  far_below: { label: 'Thấp hơn hầu hết', tone: 'warn', say: 'Giá của bạn thấp hơn gần như mọi sản phẩm cùng loại trong nhóm bán chạy.' },
  below: { label: 'Dưới mặt bằng', tone: 'info', say: 'Giá của bạn nằm dưới mặt bằng chung của nhóm bán chạy.' },
  competitive: { label: 'Trong khoảng phổ biến', tone: 'good', say: 'Giá của bạn nằm trong khoảng mà phần lớn nhóm bán chạy đang đặt.' },
  premium: { label: 'Cao hơn mặt bằng', tone: 'info', say: 'Giá của bạn cao hơn mặt bằng chung của nhóm bán chạy.' },
  far_above: { label: 'Cao hơn hầu hết', tone: 'warn', say: 'Giá của bạn cao hơn gần như mọi sản phẩm cùng loại trong nhóm bán chạy.' },
};

export function PricingPage() {
  const [params, setParams] = useSearchParams();
  const productType = params.get('productType') || undefined;
  const productId = params.get('productId') || undefined;
  const priceParam = params.get('price') || '';
  const [priceInput, setPriceInput] = useState(priceParam);

  // Người dùng có thể vào bằng đường dẫn đã lưu, nên ô nhập phải theo URL chứ không
  // giữ giá trị của lần mở trước.
  useEffect(() => setPriceInput(priceParam), [priceParam]);

  const { state, reload } = useInsight<PricingAnalysis>('/pricing', {
    productType,
    productId,
    price: priceParam || undefined,
  });

  const patch = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const submitPrice = (event: React.FormEvent) => {
    event.preventDefault();
    const digits = priceInput.replace(/\D/g, '');
    patch('price', digits);
  };

  return (
    <InsightPage title="Mặt bằng giá" question="Giá của tôi đang đứng ở đâu so với nhóm bán chạy cùng loại phôi?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const d = data.distribution;
          const band = data.band ? BAND[data.band] : null;
          const mine = data.my_products ?? [];
          const chosen = mine.find(p => p.product_id === (data.selected_product_id || productId));
          const ticks: RulerTick[] = [
            { at: d.p10, label: `p10 ${compactMoney(d.p10)}`, tone: 'muted' },
            { at: d.p50, label: `Trung vị ${compactMoney(d.p50)}` },
            { at: d.p90, label: `p90 ${compactMoney(d.p90)}`, tone: 'muted' },
          ];
          if (data.my_price !== null) {
            ticks.push({ at: data.my_price, label: `Giá của bạn ${compactMoney(data.my_price)}`, mine: true });
          }

          return (
            <div className="space-y-5">
              {mine.length > 0 && (
                <InsightCard
                  title="Chọn một sản phẩm của bạn"
                  description="Giá lấy trực tiếp từ sản phẩm bạn đang bán trên sàn. Loại phôi bên dưới do hệ thống đoán từ tên sản phẩm, đổi lại được nếu chưa đúng."
                  bodyClassName="px-4 py-3"
                >
                  <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 md:grid-cols-2">
                    {mine.map(p => {
                      const picked = p.product_id === (data.selected_product_id || productId);
                      return (
                        <li key={p.product_id}>
                          <button
                            type="button"
                            onClick={() => patch('productId', p.product_id)}
                            aria-pressed={picked}
                            className={`w-full cursor-pointer rounded-md border px-3.5 py-2.5 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007700] motion-reduce:transition-none ${
                              picked ? 'border-[#007700] bg-[#EAF0E2]' : 'border-stone-200 bg-white hover:border-stone-300'
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold text-stone-800">{p.title}</span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs text-stone-500">
                                    {p.product_type_id ? productTypeLabel(p.product_type_id) : 'Chưa xác định loại phôi'}
                                  </span>
                                  {p.handmade_hint && <Chip tone="warn">thủ công</Chip>}
                                </span>
                              </span>
                              <span className="shrink-0 whitespace-nowrap text-[13px] font-bold tabular-nums text-stone-900">
                                {p.price_vnd === null ? NA : money(p.price_vnd)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </InsightCard>
              )}

              <InsightCard
                title="Chọn loại phôi và mức giá"
                description="Để trống ô giá thì dùng giá thật của sản phẩm bạn chọn. Điền một số để thử xem mức giá đó sẽ đứng ở đâu."
              >
                <div className="flex flex-wrap items-end gap-4">
                  <SelectField
                    label="Loại phôi"
                    value={data.product_type_id}
                    onChange={value => patch('productType', value)}
                    options={[...data.available_product_types]
                      .map(id => ({ value: id, label: productTypeLabel(id) }))
                      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))}
                  />
                  <form onSubmit={submitPrice} className="flex items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="thu-gia" className="text-xs font-semibold text-stone-600">Thử một mức giá (đồng)</label>
                      <input
                        id="thu-gia"
                        inputMode="numeric"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        placeholder="ví dụ 250000"
                        className="h-9 w-40 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 motion-reduce:transition-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="h-9 cursor-pointer rounded-md bg-[#007700] px-4 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] active:translate-y-px motion-reduce:transition-none"
                    >
                      Xem vị trí
                    </button>
                    {priceParam && (
                      <button
                        type="button"
                        onClick={() => patch('price', '')}
                        className="h-9 cursor-pointer rounded-md border border-stone-200 bg-white px-3 text-[13px] font-semibold text-stone-600 transition-colors duration-150 hover:border-stone-300 hover:text-stone-800 motion-reduce:transition-none"
                      >
                        Dùng giá thật
                      </button>
                    )}
                  </form>
                </div>
                {data.type_source_note && (
                  <div className="mt-3">
                    <Note tone={data.type_source === 'seller' ? 'neutral' : 'warn'}>
                      Mã loại phôi đang dùng: {productTypeLabel(data.product_type_id)} ({data.type_source_note}).
                      {data.type_source !== 'seller' && ' Nếu chưa đúng, chọn lại ở ô bên trên để so với đúng nhóm hàng.'}
                    </Note>
                  </div>
                )}
              </InsightCard>

              <InsightCard
                title={`Phân bố giá của ${productTypeLabel(data.product_type_id)}`}
                description={data.basis}
                footer={<SourceFooter meta={meta} method={data.suggested_range?.basis} limitation={data.limitation ?? data.suggested_range?.caveat} />}
              >
                <DistributionRuler
                  min={d.min}
                  max={d.max}
                  bandLow={d.p25}
                  bandHigh={d.p75}
                  ticks={ticks}
                />

                <div className="mt-2 grid grid-cols-2 gap-4 border-t border-stone-100 pt-4 md:grid-cols-4">
                  <MiniStat label="Giá của bạn" value={data.my_price === null ? NA : money(data.my_price)} />
                  <MiniStat
                    label="Vị trí trong nhóm"
                    value={data.percentile === null ? NA : `Phân vị ${data.percentile}`}
                    hint={data.percentile === null ? undefined : `Cao hơn ${data.percentile}% sản phẩm trong nhóm`}
                  />
                  <MiniStat label="Khoảng phổ biến" value={`${compactMoney(d.p25)} đến ${compactMoney(d.p75)}`} hint="Nửa giữa của nhóm bán chạy" />
                  <MiniStat label="Số sản phẩm so sánh" value={count(data.n_listings)} />
                </div>

                <div className="mt-4 space-y-3">
                  {data.needs_product_pick ? (
                    <Note>
                      Chọn một sản phẩm ở khối trên để xem giá của bạn đứng đâu. Chưa chọn thì đây chỉ là phân bố giá của
                      thị trường, chưa có kết luận nào về shop bạn.
                    </Note>
                  ) : data.handmade_hint ? (
                    <div className="flex items-start gap-2.5 rounded-md bg-amber-50 px-3.5 py-3">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
                      <div className="space-y-1.5">
                        <p className="m-0 text-[13px] font-bold text-amber-900">
                          Đây là hàng thủ công, đừng đọc kết luận này quá chặt
                        </p>
                        <p className="m-0 text-[13px] leading-relaxed text-amber-900/90">
                          {chosen ? `"${chosen.title}"` : 'Sản phẩm bạn chọn'} có dấu hiệu làm thủ công. Giá hàng thủ công
                          phụ thuộc công làm và chất liệu, còn mặt bằng bên dưới là phôi in công nghiệp. Hai thứ không cùng
                          loại hàng, nên hãy xem đây là mốc tham khảo xa.
                        </p>
                        {band && (
                          <p className="m-0 text-[13px] text-amber-900/90">
                            Nếu vẫn muốn đối chiếu: {band.say.toLowerCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : band ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone={band.tone}>{band.label}</Chip>
                      <span className="text-[13px] text-stone-700">{band.say}</span>
                    </div>
                  ) : (
                    <Note>Shop bạn chưa có sản phẩm loại này, nên không có vạch giá của bạn trên thước. Phân bố bên trên vẫn là mặt bằng thật của loại phôi này.</Note>
                  )}

                  {data.suggested_range && (
                    <div className="rounded-md bg-[#EAF0E2] p-4">
                      <p className="m-0 text-[13px] font-bold text-[#005B00]">
                        Khoảng giá của nhóm bán chạy: {money(data.suggested_range.low)} đến {money(data.suggested_range.high)}
                      </p>
                      <p className="mb-0 mt-1 text-xs leading-relaxed text-[#005B00]/85">{data.suggested_range.basis}</p>
                    </div>
                  )}
                </div>
              </InsightCard>

              <InsightCard title="Bảng phân vị đầy đủ" bodyClassName="px-4 py-3">
                <DataTable
                  caption={`Phân vị giá của ${productTypeLabel(data.product_type_id)}`}
                  head={
                    <>
                      <th scope="col">Mốc</th>
                      <th scope="col" className="text-right">Giá</th>
                      <th scope="col">Nghĩa là</th>
                    </>
                  }
                >
                  {[
                    { k: 'Thấp nhất', v: d.min, say: 'Sản phẩm rẻ nhất trong nhóm so sánh' },
                    { k: 'Phân vị 10', v: d.p10, say: '10% sản phẩm có giá thấp hơn mức này' },
                    { k: 'Phân vị 25', v: d.p25, say: 'Ranh dưới của khoảng phổ biến' },
                    { k: 'Trung vị', v: d.p50, say: 'Một nửa nhóm đắt hơn, một nửa rẻ hơn' },
                    { k: 'Phân vị 75', v: d.p75, say: 'Ranh trên của khoảng phổ biến' },
                    { k: 'Phân vị 90', v: d.p90, say: '10% sản phẩm có giá cao hơn mức này' },
                    { k: 'Cao nhất', v: d.max, say: 'Sản phẩm đắt nhất trong nhóm so sánh' },
                  ].map(row => (
                    <tr key={row.k}>
                      <td className="font-medium text-stone-700">{row.k}</td>
                      <td className="whitespace-nowrap text-right font-semibold tabular-nums text-stone-900">{money(row.v)}</td>
                      <td className="text-stone-500">{row.say}</td>
                    </tr>
                  ))}
                </DataTable>
              </InsightCard>

              <section className="rounded-md border border-stone-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <Info size={18} className="mt-0.5 shrink-0 text-stone-500" aria-hidden />
                  <div className="space-y-2 text-[13px] leading-relaxed text-stone-600">
                    <p className="m-0 font-bold text-stone-800">Trang này trả lời "giá của bạn đứng ở đâu", không phải "giá nào bán chạy hơn"</p>
                    <p className="m-0">
                      Chúng tôi đã kiểm trên dữ liệu hiện có: chỉ {pct(26, 0)} loại phôi cho thấy mức giá và mức bán chạy đi
                      cùng chiều, gần bằng mức bạn có được nếu xếp ngẫu nhiên. Nói cách khác, dữ liệu chưa đủ cơ sở để
                      khẳng định hạ giá hay tăng giá sẽ bán tốt hơn.
                    </p>
                    <p className="m-0">
                      Vì vậy hãy dùng thước bên trên để biết mình đang đứng đâu so với thị trường, rồi tự quyết theo giá
                      vốn và định vị của shop.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
