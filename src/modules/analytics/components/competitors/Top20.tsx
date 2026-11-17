/**
 * SRS 3.9.1: top 20 sản phẩm bán chạy của đối thủ trong danh mục. Bảng xếp hạng đủ cột SRS (hạng, sản phẩm, shop,
 * giá, số bán, số đánh giá, lượt yêu thích), 5 dòng mỗi trang; kiểu xem Biểu đồ là 4 biểu đồ cột thẳng hàng theo hạng,
 * sản phẩm của bạn là cột xanh lá ở cuối, rê chuột thì sáng cùng một cột ở cả 4 biểu đồ.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { UserPlus } from 'lucide-react';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { count, money } from '../../../../shared/utils/format';
import { MSG } from '../../services/analyticsApi';
import type { Competitors } from '../../types';
import { Chip, InsightCard, Note } from '../ui';
import { CongTac, PhanTrang, catTrang } from './dieuKhien';
import { GIAI_THICH, NhanTinCay } from './giaiThich';

const NUT_THEO_DOI =
  'inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-[#007700] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#005B00] transition-colors duration-150 hover:bg-[#EAF0E2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none';

interface Cot { key: string; nhan: string; ten: string; shop: string; gia: number; ban: number; dg: number; yt: number; laToi: boolean; hang: number | null }

const CHI_SO: { ten: string; lay: (c: Cot) => number; fmt: (v: number) => string }[] = [
  { ten: 'Lượng bán 90 ngày', lay: c => c.ban, fmt: v => count(v) },
  { ten: 'Giá', lay: c => c.gia, fmt: v => money(v) },
  { ten: 'Lượt đánh giá', lay: c => c.dg, fmt: v => count(v) },
  { ten: 'Lượt yêu thích', lay: c => c.yt, fmt: v => count(v) },
];

export function Top20({ data, canTrack, trackedIds, pendingShop, khoa, full, onTrack }: {
  data: Competitors;
  canTrack: boolean;
  trackedIds: Set<string>;
  pendingShop: string | null;
  khoa: boolean;
  full: boolean;
  onTrack: (shopId: string, shopName: string) => void;
}) {
  const [xem, setXem] = useState<'bang' | 'bieu-do'>('bang');
  const [trang, setTrang] = useState(1);
  const [dangXem, setDangXem] = useState<string | null>(null);
  const rows = data.competitors;
  const { t, rows: trangNay } = catTrang(rows, trang);

  const cuaToi = [...data.my_listings].sort((a, b) => b.est_sales_90d - a.est_sales_90d);
  const cot: Cot[] = [
    ...rows.map(r => ({ key: `r${r.rank}`, nhan: String(r.rank), ten: r.title, shop: r.shop_name, gia: r.price_vnd, ban: r.est_sales_90d, dg: r.n_reviews ?? 0, yt: r.favorite_count ?? 0, laToi: false, hang: r.rank })),
    ...cuaToi.map((l, i) => ({ key: `b${i}`, nhan: i === Math.floor((cuaToi.length - 1) / 2) ? 'Bạn' : '', ten: l.title, shop: 'Sản phẩm của bạn', gia: l.price_vnd, ban: l.est_sales_90d, dg: l.n_reviews ?? 0, yt: l.favorite_count ?? 0, laToi: true, hang: null })),
  ];
  const theoKhoa = new Map(cot.map(c => [c.key, c]));
  const c = dangXem ? theoKhoa.get(dangXem) : undefined;
  const banChayToi = cuaToi[0];
  const tongDg = rows.reduce((s, r) => s + (r.n_reviews ?? 0), 0);
  const dgTop5 = rows.slice(0, 5).reduce((s, r) => s + (r.n_reviews ?? 0), 0);

  return (
    <InsightCard
      title={`Top ${count(rows.length)} sản phẩm bán chạy của đối thủ`}
      info={GIAI_THICH.banChay}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <NhanTinCay loai="kiem" />
          <CongTac<'bang' | 'bieu-do'> nhan="Kiểu xem top 20" giaTri={xem} onDoi={setXem} luaChon={[{ value: 'bang', label: 'Bảng' }, { value: 'bieu-do', label: 'Biểu đồ' }]} />
        </div>
      }
    >
      {rows.length === 0 ? (
        <Note>Danh mục này chưa có sản phẩm nào của người bán khác để so sánh.</Note>
      ) : (
        <div className="space-y-3">
          {data.low_sample && <Note tone="warn">Mới có {count(rows.length)} sản phẩm của đối thủ, thứ hạng chỉ để tham khảo.</Note>}
          {xem === 'bang' ? (
            <>
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-[13px]">
                  <caption className="sr-only">Top {count(rows.length)} sản phẩm bán chạy của đối thủ, xếp theo lượng bán 90 ngày</caption>
                  <thead>
                    {/* Cột số co theo nội dung (w-[1%] + nowrap), phần còn lại dành cho tên sản phẩm. */}
                    <tr className="text-left text-xs text-stone-500">
                      <th scope="col" className="w-[1%] whitespace-nowrap border-b border-stone-200 py-2 pr-3 font-semibold">Hạng</th>
                      <th scope="col" className="whitespace-nowrap border-b border-stone-200 px-2 py-2 font-semibold">Sản phẩm · Shop</th>
                      <th scope="col" className="w-[1%] whitespace-nowrap border-b border-stone-200 px-3 py-2 font-semibold">Loại</th>
                      <th scope="col" className="w-[1%] whitespace-nowrap border-b border-stone-200 px-3 py-2 text-right font-semibold">Giá</th>
                      <th scope="col" className="w-[1%] whitespace-nowrap border-b border-stone-200 px-3 py-2 text-right font-semibold">Lượng bán 90 ngày</th>
                      <th scope="col" className="w-[1%] whitespace-nowrap border-b border-stone-200 px-3 py-2 text-right font-semibold">Lượt đánh giá</th>
                      <th scope="col" className="w-[1%] whitespace-nowrap border-b border-stone-200 px-3 py-2 text-right font-semibold">Yêu thích</th>
                      {canTrack && <th scope="col" className="w-[1%] border-b border-stone-200 px-2 py-2"><span className="sr-only">Theo dõi shop</span></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {trangNay.map(r => (
                      <tr key={r.listing_id}>
                        <td className="border-b border-stone-100 py-2 pr-2 font-bold tabular-nums text-stone-500">{r.rank}</td>
                        <td className="max-w-0 border-b border-stone-100 px-2 py-2">
                          {/* Màn hẹp: tên shop xuống dòng dưới để tên sản phẩm không bị cắt còn vài chữ. */}
                          <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                            <span className="min-w-0 truncate font-semibold text-stone-900" title={r.title}>{r.title}</span>
                            {r.shop_id ? (
                              <Link to={`/seller/competitors/${r.shop_id}`} className="shrink-0 truncate text-xs text-[#007700] no-underline hover:text-[#005B00]">{r.shop_name}</Link>
                            ) : (
                              <span className="shrink-0 truncate text-xs text-stone-500">{r.shop_name}</span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap border-b border-stone-100 px-2 py-2 text-xs text-stone-600">{data.price_points?.find(p => p.listing_id === r.listing_id)?.product_type_name ?? ''}</td>
                        <td className="whitespace-nowrap border-b border-stone-100 px-2 py-2 text-right font-semibold tabular-nums text-stone-900">{money(r.price_vnd)}</td>
                        {/* BR-188: 0 đơn thì nói thẳng, không để số 0 nằm trong bảng "bán chạy". */}
                        <td className="whitespace-nowrap border-b border-stone-100 px-2 py-2 text-right tabular-nums text-stone-700">{r.est_sales_90d > 0 ? count(r.est_sales_90d) : <span className="text-stone-400">Chưa có đơn</span>}</td>
                        <td className="border-b border-stone-100 px-2 py-2 text-right tabular-nums text-stone-700">{count(r.n_reviews ?? 0)}</td>
                        <td className="border-b border-stone-100 px-2 py-2 text-right tabular-nums text-stone-700">{count(r.favorite_count ?? 0)}</td>
                        {canTrack && (
                          <td className="whitespace-nowrap border-b border-stone-100 px-2 py-1.5 text-right">
                            {r.shop_id && (trackedIds.has(r.shop_id) ? (
                              <Chip tone="good">Đang theo dõi</Chip>
                            ) : (
                              <button type="button" onClick={() => onTrack(r.shop_id!, r.shop_name)} disabled={khoa || full} title={full ? MSG[143] : undefined} aria-label={`Theo dõi ${r.shop_name}`} className={NUT_THEO_DOI}>
                                <UserPlus size={12} aria-hidden />
                                {pendingShop === r.shop_id ? 'Đang thêm' : 'Theo dõi'}
                              </button>
                            ))}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {/* BR-189: shop bạn không nằm trong top 20; sản phẩm bán chạy nhất của bạn đứng riêng ở chân bảng, ngoài phân trang. */}
                  {banChayToi && (
                    <tfoot>
                      <tr className="bg-[#f3f8f1]">
                        <th scope="row" className="border-t-2 border-[#cfe3c9] py-2 pr-2 text-left font-bold text-[#005B00]">Bạn</th>
                        <td className="max-w-0 border-t-2 border-[#cfe3c9] px-2 py-2">
                          <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                            <span className="min-w-0 truncate font-semibold text-stone-900" title={banChayToi.title}>{banChayToi.title}</span>
                            {banChayToi.rank_in_cat != null && <span className="shrink-0 text-xs text-stone-500">· hạng {count(banChayToi.rank_in_cat)} nếu tính chung</span>}
                          </span>
                        </td>
                        <td className="whitespace-nowrap border-t-2 border-[#cfe3c9] px-2 py-2 text-xs text-stone-600">{data.price_points?.find(p => p.listing_id === banChayToi.listing_id)?.product_type_name ?? ''}</td>
                        <td className="whitespace-nowrap border-t-2 border-[#cfe3c9] px-2 py-2 text-right font-semibold tabular-nums text-stone-900">{money(banChayToi.price_vnd)}</td>
                        <td className="whitespace-nowrap border-t-2 border-[#cfe3c9] px-2 py-2 text-right tabular-nums text-stone-700">{banChayToi.est_sales_90d > 0 ? count(banChayToi.est_sales_90d) : <span className="text-stone-400">Chưa có đơn</span>}</td>
                        <td className="border-t-2 border-[#cfe3c9] px-2 py-2 text-right tabular-nums text-stone-700">{count(banChayToi.n_reviews ?? 0)}</td>
                        <td className="border-t-2 border-[#cfe3c9] px-2 py-2 text-right tabular-nums text-stone-700">{count(banChayToi.favorite_count ?? 0)}</td>
                        {canTrack && <td className="border-t-2 border-[#cfe3c9]" />}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <PhanTrang trang={t} tong={rows.length} onDoi={setTrang} nhan="Các trang của bảng xếp hạng top 20" />
            </>
          ) : (
            <>
              <p aria-live="polite" className={`m-0 min-h-[2.25rem] rounded-lg bg-stone-50 px-3 py-2 text-[13px] ${c ? 'text-stone-900' : 'text-stone-500'}`}>
                {c
                  ? `${c.laToi ? 'Sản phẩm của bạn' : `#${c.hang}`} · ${c.ten} · ${c.shop} · ${money(c.gia)} · lượng bán ${count(c.ban)} · ${count(c.dg)} lượt đánh giá · ${count(c.yt)} lượt yêu thích`
                  : 'Rê chuột lên một cột để xem số liệu đầy đủ của sản phẩm trên cả 4 biểu đồ.'}
              </p>
              <div className="-mx-4 overflow-x-auto px-4">
                <div className="min-w-[40rem] space-y-1" role="img" aria-label={`Bốn biểu đồ cột của top ${count(rows.length)}: lượng bán, giá, lượt đánh giá, lượt yêu thích theo hạng; cột xanh lá ở cuối là sản phẩm của bạn. Số liệu đầy đủ ở dạng Bảng.`}>
                  {CHI_SO.map((m, i) => {
                    const cuoi = i === CHI_SO.length - 1;
                    const max = Math.max(...cot.map(m.lay), 0);
                    return (
                      <div key={m.ten} className="flex items-stretch gap-2">
                        <div className="flex w-28 shrink-0 flex-col justify-end pb-1">
                          <span className="text-xs font-semibold text-stone-800">{m.ten}</span>
                          <span className="text-[11px] text-stone-500">cao nhất {m.fmt(max)}</span>
                        </div>
                        <div className="min-w-0 flex-1" style={{ height: cuoi ? 92 : 72 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={cot}
                              syncId="top20"
                              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                              onMouseMove={(s: { activeLabel?: string }) => setDangXem(s?.activeLabel ?? null)}
                              onMouseLeave={() => setDangXem(null)}
                            >
                              <XAxis dataKey="key" hide={!cuoi} interval={0} tickFormatter={(k: string) => theoKhoa.get(k)?.nhan ?? ''} tickLine={false} axisLine={{ stroke: CHART_INK.grid }} tick={{ fill: CHART_INK.axis, fontSize: 10 }} />
                              <YAxis hide domain={[0, max || 1]} />
                              <Tooltip content={() => null} cursor={{ fill: 'rgba(42,120,214,0.10)' }} isAnimationActive={false} />
                              <Bar dataKey={(x: Cot) => m.lay(x)} radius={[3, 3, 0, 0]} maxBarSize={22} minPointSize={1} isAnimationActive={false}>
                                {cot.map(x => <Cell key={x.key} fill={m.lay(x) === 0 ? '#e7e5e4' : x.laToi ? SERIES.green : SERIES.blue} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {tongDg >= 5 && dgTop5 / tongDg >= 0.5 && (
                <p className="m-0 text-xs text-stone-500">Lượt đánh giá tập trung ở nhóm dẫn đầu: 5 sản phẩm đầu chiếm {count(dgTop5)}/{count(tongDg)} lượt đánh giá của top {count(rows.length)}. Giá gồm nhiều loại hàng; để so giá, dùng thẻ Phân bố giá bên dưới.</p>
              )}
            </>
          )}
          {rows.some(r => r.est_sales_90d === 0) && (
            <Note tone="warn">{count(rows.filter(r => r.est_sales_90d === 0).length)} sản phẩm chưa có đơn trong 90 ngày nên xếp theo số đánh giá.</Note>
          )}
        </div>
      )}
    </InsightCard>
  );
}
