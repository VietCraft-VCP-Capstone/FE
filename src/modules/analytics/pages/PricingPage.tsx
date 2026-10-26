/**
 * F35 — So sánh giá. Đọc GET /seller/analytics/pricing (tham số productType, price, productId).
 *
 * Trang này CHỈ trả lời "giá này đứng ở đâu". Nó KHÔNG hứa "giá nào bán chạy hơn", vì
 * nhóm đã đo và chỉ 24 trên 94 loại phôi có thứ tự giá đúng theo mức bán chạy, gần bằng
 * mức ngẫu nhiên. Lời văn viết cho người bán mới: không p10/p90, không "loại phôi".
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { compactMoney, count, money } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { DistributionRuler, MiniStat, type RulerTick } from '../components/charts/MiniViz';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, SelectField, Takeaway, type Tone } from '../components/ui';
import { NA, pct } from '../format';
import { useInsight } from '../hooks/useInsight';
import { productTypeLabel } from '../labels';
import type { AiPrice, PriceBand, PricingAnalysis } from '../types';

const NHOM_SO: Record<string, string> = {
  reference_catalog: 'sản phẩm bán chạy nhất cùng loại ở thị trường tham khảo (không phải shop trên VietCraft)',
  live_category: 'sản phẩm cùng danh mục đang bán trên VietCraft',
  seed_market: 'sản phẩm bán chạy nhất cùng loại (dữ liệu mô phỏng)',
};

const BAND: Record<PriceBand, { label: string; tone: Tone; say: string }> = {
  far_below: { label: 'Thấp hơn hầu hết', tone: 'warn', say: 'Giá của bạn thấp hơn gần như mọi sản phẩm cùng loại trong nhóm bán chạy.' },
  below: { label: 'Dưới mặt bằng', tone: 'info', say: 'Giá của bạn nằm dưới mặt bằng chung của nhóm bán chạy.' },
  competitive: { label: 'Trong khoảng phổ biến', tone: 'good', say: 'Giá của bạn nằm trong khoảng mà phần lớn nhóm bán chạy đang đặt.' },
  premium: { label: 'Cao hơn mặt bằng', tone: 'info', say: 'Giá của bạn cao hơn mặt bằng chung của nhóm bán chạy.' },
  far_above: { label: 'Cao hơn hầu hết', tone: 'warn', say: 'Giá của bạn cao hơn gần như mọi sản phẩm cùng loại trong nhóm bán chạy.' },
};

const TIN_CAY: Record<AiPrice['confidence'], { label: string; tone: Tone }> = {
  high: { label: 'Độ tin cậy cao', tone: 'good' },
  medium: { label: 'Độ tin cậy vừa', tone: 'info' },
  low: { label: 'Độ tin cậy thấp', tone: 'warn' },
};

/** Giá của các sản phẩm giống nhất ở shop khác (AI), so với giá bạn đang bán. */
function AiPriceCard({ ai, reason, myPrice }: { ai: AiPrice | null | undefined; reason?: string | null; myPrice: number | null }) {
  if (!ai) {
    return reason ? (
      <InsightCard title="Giá của đối thủ trực tiếp" bodyClassName="px-4 py-3">
        <Note>{reason}.</Note>
      </InsightCard>
    ) : null;
  }
  const tin = TIN_CAY[ai.confidence];
  const lech = myPrice === null ? null
    : myPrice > ai.high_vnd ? `Giá bạn đang bán (${money(myPrice)}) cao hơn khoảng này ${pct(Math.round((myPrice / ai.high_vnd - 1) * 100), 0)}.`
    : myPrice < ai.low_vnd ? `Giá bạn đang bán (${money(myPrice)}) thấp hơn khoảng này ${pct(Math.round((1 - myPrice / ai.low_vnd) * 100), 0)}.`
    : `Giá bạn đang bán (${money(myPrice)}) nằm trong khoảng này.`;
  return (
    <InsightCard
      title="Giá của đối thủ trực tiếp"
      description="AI tìm các sản phẩm của shop khác giống sản phẩm bạn chọn nhất (cùng loại hàng) rồi xem họ đang bán giá bao nhiêu."
      bodyClassName="px-4 py-3"
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <span className="block text-xs font-semibold text-stone-500">Khoảng giá nên cân nhắc</span>
          <strong className="font-jakarta text-2xl text-stone-900">{money(ai.low_vnd)} – {money(ai.high_vnd)}</strong>
        </div>
        <MiniStat label="Giá gợi ý" value={money(ai.suggested_vnd)} />
        <Chip tone={tin.tone}>{tin.label}</Chip>
      </div>
      {lech && <p className="mb-0 mt-3 text-[13px] text-stone-700">{lech}</p>}
      <div className="mt-3">
        <Note>
          Dựa trên {count(ai.n_neighbors)} sản phẩm giống nhất, giá của họ từ {money(ai.rival_price_min_vnd)} đến {money(ai.rival_price_max_vnd)}.
          Con số đã pha {Math.round(ai.rival_weight * 100)}% giá đối thủ trực tiếp với mặt bằng cùng loại cho đỡ dao động.
        </Note>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-[13px] font-semibold text-[#007700]">Xem {count(ai.n_neighbors)} sản phẩm làm căn cứ</summary>
        <ul className="m-0 mt-2 list-none space-y-1.5 p-0">
          {ai.neighbors.map(n => (
            <li key={n.product_id} className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
              <span className="w-12 shrink-0 font-semibold tabular-nums text-[#005B00]">{Math.round(n.similarity * 100)}%</span>
              <span className="min-w-0 flex-1 truncate text-stone-800" title={n.title ?? ''}>{n.title}</span>
              <span className="text-stone-500">{n.shop_name}</span>
              <span className="w-24 text-right font-semibold tabular-nums text-stone-900">{money(n.price_vnd)}</span>
            </li>
          ))}
        </ul>
      </details>
    </InsightCard>
  );
}

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
    <InsightPage title="So sánh giá" question="Giá sản phẩm của tôi đứng ở đâu so với các sản phẩm cùng loại đang bán chạy?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const d = data.distribution;
          const band = data.band ? BAND[data.band] : null;
          const mine = data.my_products ?? [];
          const chosen = mine.find(p => p.product_id === (data.selected_product_id || productId));
          // Gian hàng thật: "loại" là danh mục cấp 2 của sàn, service trả kèm tên.
          const typeLabel = (id: string) => productTypeLabel(id, data.product_type_names?.[id]);
          const ticks: RulerTick[] = [{ at: d.p50, label: `Giá ở giữa ${compactMoney(d.p50)}`, tone: 'muted' }];
          if (data.my_price !== null) {
            ticks.push({ at: data.my_price, label: `Giá của bạn ${compactMoney(data.my_price)}`, mine: true });
          }
          const typeName = typeLabel(data.product_type_id);
          const nhomSo = (data.basis_kind && NHOM_SO[data.basis_kind]) || data.basis;
          const phoBien = `${money(d.p25)} – ${money(d.p75)}`;

          return (
            <div className="space-y-5">
              <Takeaway
                action={band && !data.needs_product_pick ? <Link to="/seller/products" className={ACTION_CLASS}>Sửa giá sản phẩm</Link> : undefined}
              >
                {band && data.my_price !== null && !data.needs_product_pick ? (
                  <>
                    {chosen ? <><strong>{chosen.title}</strong> giá </> : 'Mức giá '}
                    {money(data.my_price)}: <strong>{band.label.toLowerCase()}</strong> so với {typeName}. Giá phổ biến: {phoBien}.
                  </>
                ) : (
                  <>Chọn một sản phẩm của bạn bên dưới để biết giá đắt hay rẻ. Giá phổ biến của {typeName}: {phoBien}.</>
                )}
              </Takeaway>

              {mine.length > 0 && (
                <InsightCard
                  title="Chọn một sản phẩm của bạn"
                  description="Giá lấy từ sản phẩm bạn đang bán. Loại sản phẩm do hệ thống đoán từ tên, đổi lại được ở khối bên dưới nếu chưa đúng."
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
                                    {p.product_type_id ? productTypeLabel(p.product_type_id) : 'Chưa rõ loại sản phẩm'}
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

              <AiPriceCard ai={data.ai_price} reason={data.ai_price_reason} myPrice={chosen?.price_vnd ?? null} />

              <InsightCard
                title="Thử một mức giá khác"
                description="Để trống ô giá thì dùng giá thật của sản phẩm bạn chọn. Điền một số để xem mức giá đó đắt hay rẻ."
              >
                <div className="flex flex-wrap items-end gap-4">
                  <SelectField
                    label="Loại sản phẩm"
                    value={data.product_type_id}
                    onChange={value => patch('productType', value)}
                    options={[...data.available_product_types]
                      .map(id => ({ value: id, label: typeLabel(id) }))
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
                      Đang so với loại: {typeName} ({data.type_source_note}).
                      {data.type_source !== 'seller' && ' Nếu chưa đúng, chọn lại ở ô Loại sản phẩm.'}
                    </Note>
                  </div>
                )}
              </InsightCard>

              <InsightCard
                title={`Giá của ${typeName} đang bán ra sao`}
                description={`So với ${count(data.n_listings)} ${nhomSo}. Vùng xanh nhạt là khoảng giá phổ biến.`}
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
                    label="So với thị trường"
                    value={band ? band.label : NA}
                    hint={data.percentile === null ? undefined : data.percentile >= 100 ? 'Đắt hơn mọi sản phẩm cùng loại' : `Đắt hơn ${data.percentile}% sản phẩm cùng loại`}
                  />
                  <MiniStat label="Khoảng giá phổ biến" value={`${compactMoney(d.p25)} – ${compactMoney(d.p75)}`} hint="Một nửa số sản phẩm có giá trong khoảng này" />
                  <MiniStat label="Tính trên" value={`${count(data.n_listings)} sản phẩm`} />
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
                          phụ thuộc công làm và chất liệu, còn giá bên trên là của hàng in sẵn. Hai thứ không cùng loại
                          hàng, nên hãy xem đây là mốc tham khảo xa.
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
                    <Note>Shop bạn chưa có sản phẩm loại này, nên chưa có vạch giá của bạn trên thước. Thước bên trên vẫn là giá thị trường của loại này.</Note>
                  )}

                  {data.suggested_range && (
                    <div className="rounded-md bg-[#EAF0E2] p-4">
                      <p className="m-0 text-[13px] font-bold text-[#005B00]">
                        Khoảng giá của nhóm bán chạy: {money(data.suggested_range.low)} đến {money(data.suggested_range.high)}
                      </p>
                      <p className="mb-0 mt-1 text-xs leading-relaxed text-[#005B00]/85">Một nửa số sản phẩm bán chạy có giá trong khoảng này.</p>
                    </div>
                  )}
                </div>
              </InsightCard>

              <section className="rounded-md border border-stone-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <Info size={18} className="mt-0.5 shrink-0 text-stone-500" aria-hidden />
                  <div className="min-w-0 flex-1 space-y-2 text-[13px] leading-relaxed text-stone-600">
                    <p className="m-0 font-bold text-stone-800">Trang này cho biết giá bạn đứng ở đâu, không cho biết giá nào bán chạy hơn</p>
                    <p className="m-0">
                      Dữ liệu hiện có chưa cho thấy rẻ hơn thì bán chạy hơn (chỉ {pct(26, 0)} loại sản phẩm có giá và mức
                      bán đi cùng chiều). Hãy quyết giá theo giá vốn và cách bạn muốn định vị shop.
                    </p>
                    <details>
                      <summary className="cursor-pointer font-semibold text-stone-700">Xem bảng giá chi tiết</summary>
                      <div className="mt-2">
                        <DataTable
                          caption={`Các mốc giá của ${typeName}`}
                          head={
                            <>
                              <th scope="col">Mốc</th>
                              <th scope="col" className="text-right">Giá</th>
                              <th scope="col">Nghĩa là</th>
                            </>
                          }
                        >
                          {[
                            { k: 'Rẻ nhất', v: d.min, say: 'Sản phẩm rẻ nhất trong nhóm so sánh' },
                            { k: 'Mốc 10%', v: d.p10, say: '10% sản phẩm rẻ hơn mức này' },
                            { k: 'Đầu khoảng phổ biến', v: d.p25, say: '25% sản phẩm rẻ hơn mức này' },
                            { k: 'Giá ở giữa', v: d.p50, say: 'Một nửa đắt hơn, một nửa rẻ hơn' },
                            { k: 'Cuối khoảng phổ biến', v: d.p75, say: '25% sản phẩm đắt hơn mức này' },
                            { k: 'Mốc 90%', v: d.p90, say: '10% sản phẩm đắt hơn mức này' },
                            { k: 'Đắt nhất', v: d.max, say: 'Sản phẩm đắt nhất trong nhóm so sánh' },
                          ].map(row => (
                            <tr key={row.k}>
                              <td className="font-medium text-stone-700">{row.k}</td>
                              <td className="whitespace-nowrap text-right font-semibold tabular-nums text-stone-900">{money(row.v)}</td>
                              <td className="text-stone-500">{row.say}</td>
                            </tr>
                          ))}
                        </DataTable>
                      </div>
                    </details>
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
