/**
 * F33 — Tôi mạnh, yếu ở đâu. Đọc GET /seller/analytics/shop-comparison.
 *
 * Người bán mới không đọc được radar 6 đường hay "điểm 0-100 min-max", nên mỗi tiêu chí là
 * một dòng: số thật của bạn, số thật trung bình 5 shop dẫn đầu, và nhận xét bằng lời. Nhận xét
 * dựa trên SỐ THẬT với một khoảng "ngang nhóm", không dựa trên điểm quy đổi: 4,42 với 4,37 sao
 * chênh nhau xa trên thang 0-100 nhưng với người mua là như nhau.
 * Giá KHÔNG có tốt/xấu: chỉ nói đắt hơn hay rẻ hơn, và không bao giờ là "điểm cần cải thiện".
 */

import { Link } from 'react-router-dom';
import { money } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { MiniStat } from '../components/charts/MiniViz';
import { RADAR_COLORS, RADAR_ME_COLOR, RadarCompare } from '../components/charts/RadarCompare';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, Takeaway, type Tone } from '../components/ui';
import { decimal } from '../format';
import { useInsight } from '../hooks/useInsight';
import { categoryLabel } from '../labels';
import type { ShopComparison } from '../types';

const so = (v: number) => decimal(v, Number.isInteger(v) ? 0 : 1);

interface AxisInfo {
  name: string;
  fmt: (v: number) => string;
  /** Chiều tốt hơn. null = giá, không có tốt/xấu. */
  better: 'more' | 'less' | null;
  /** Lệch nhỏ hơn mức này (đơn vị thật) thì coi là ngang nhóm. */
  tol: (group: number) => number;
  action: { label: string; to: string };
}

const AXIS: Record<string, AxisInfo> = {
  listing_count: { name: 'Số sản phẩm đang bán', fmt: v => `${so(v)} sản phẩm`, better: 'more', tol: g => Math.max(1, g * 0.1), action: { label: 'Đăng thêm sản phẩm', to: '/seller/products' } },
  avg_rating: { name: 'Điểm đánh giá', fmt: v => `${decimal(v, 1)} / 5`, better: 'more', tol: () => 0.1, action: { label: 'Xem lại sản phẩm', to: '/seller/products' } },
  // Service lưu ÂM để chuẩn hoá đúng chiều; ở đây luôn dùng trị tuyệt đối (phút).
  response_speed: { name: 'Thời gian trả lời khách', fmt: v => `${decimal(v, 0)} phút`, better: 'less', tol: g => Math.max(2, g * 0.15), action: { label: 'Mở tin nhắn khách hàng', to: '/seller/chat' } },
  avg_price: { name: 'Giá trung bình', fmt: v => money(Math.round(v)), better: null, tol: g => g * 0.1, action: { label: 'Xem giá đắt hay rẻ', to: '/seller/insights/pricing' } },
  product_diversity: { name: 'Số loại sản phẩm', fmt: v => `${so(v)} loại`, better: 'more', tol: () => 1, action: { label: 'Đăng thêm loại sản phẩm', to: '/seller/products' } },
};

const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? Math.abs(v) : null);
const avg = (xs: (number | null)[]) => {
  const ok = xs.filter((v): v is number => v !== null);
  return ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : null;
};

function Bar({ value, color }: { value: number | null; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
      {value !== null && <div className="h-2 rounded-full" style={{ width: `${Math.max(3, Math.min(100, value))}%`, background: color }} />}
    </div>
  );
}

export function BenchmarkPage() {
  const { state, reload } = useInsight<ShopComparison>('/shop-comparison');

  return (
    <InsightPage title="Tôi mạnh, yếu ở đâu" question="So với 5 shop bán chạy nhất cùng danh mục, shop tôi hơn và kém ở điểm nào?">
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const rows = data.axes.map((axis, i) => {
            const info = AXIS[axis];
            const mine = num(data.me_raw[axis]);
            const all = [mine, ...data.competitors.map(c => num(c.raw?.[axis]))];
            const group = avg(all.slice(1));
            // Thanh dài theo số thật: "ít là tốt" thì nhanh nhất dài nhất.
            const present = all.filter((v): v is number => v !== null);
            const width = (v: number | null) => {
              if (v === null || present.length === 0) return null;
              return info?.better === 'less' ? (Math.min(...present) / Math.max(v, 1e-9)) * 100 : (v / Math.max(...present, 1e-9)) * 100;
            };
            let gain: number | null = null;
            let verdict: { text: string; tone: Tone } = { text: 'Chưa có số liệu', tone: 'neutral' };
            if (info && mine !== null && group !== null) {
              const tol = info.tol(group);
              if (info.better === null) {
                verdict = { text: mine - group > tol ? 'Đắt hơn nhóm' : group - mine > tol ? 'Rẻ hơn nhóm' : 'Ngang nhóm', tone: 'info' };
              } else {
                const d = info.better === 'more' ? mine - group : group - mine;
                verdict = d >= tol ? { text: 'Tốt hơn nhóm', tone: 'good' } : d <= -tol ? { text: 'Kém hơn nhóm', tone: 'warn' } : { text: 'Ngang nhóm', tone: 'neutral' };
                if (verdict.tone !== 'neutral') gain = d / Math.max(group, 1e-9);
              }
            }
            return { axis, i, info, name: info?.name ?? data.axes_vi[i], mine, group, gain, verdict, wMine: width(mine), wGroup: width(group) };
          });
          const ranked = rows.filter(r => r.gain !== null).sort((a, b) => a.gain! - b.gain!);
          const weakest = ranked.find(r => r.gain! < 0);
          const strongest = [...ranked].reverse().find(r => r.gain! > 0);
          const fmt = (r: typeof rows[number], v: number | null) => (v === null || !r.info ? 'chưa có' : r.info.fmt(v));
          const catName = categoryLabel(data.segment, data.segment_name);

          return (
            <div className="space-y-5">
              <Takeaway
                action={
                  weakest?.info
                    ? <Link to={weakest.info.action.to} className={ACTION_CLASS}>{weakest.info.action.label}</Link>
                    : <Link to="/seller/insights/pricing" className={ACTION_CLASS}>Xem giá đắt hay rẻ</Link>
                }
              >
                {strongest && (
                  <>Điểm mạnh nhất: <strong>{strongest.name}</strong> (bạn {fmt(strongest, strongest.mine)}, nhóm {fmt(strongest, strongest.group)}). </>
                )}
                {weakest ? (
                  <>Cần cải thiện nhất: <strong>{weakest.name}</strong> (bạn {fmt(weakest, weakest.mine)}, nhóm {fmt(weakest, weakest.group)}).</>
                ) : (
                  <>Bạn không kém 5 shop dẫn đầu ở tiêu chí nào trong {catName}.</>
                )}
              </Takeaway>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Danh mục chính của bạn" value={catName} hint={data.segment_reason} />
                </InsightCard>
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Số shop cùng danh mục" value={`${decimal(data.shops_in_segment, 0)} shop`} hint="Kể cả shop bạn" />
                </InsightCard>
                <InsightCard bodyClassName="px-5 py-4">
                  <MiniStat label="Đang so với" value={`${data.competitors.length} shop bán chạy nhất`} hint="Xếp theo doanh thu 90 ngày" />
                </InsightCard>
              </div>

              <InsightCard
                title="Bạn so với 5 shop dẫn đầu"
                description="Mỗi dòng là một tiêu chí: số của bạn, số trung bình của nhóm dẫn đầu, và nhận xét. Chênh lệch nhỏ được tính là ngang nhóm."
                footer={<SourceFooter meta={meta} method={`Danh mục so sánh chọn tự động: ${data.segment_reason}.`} />}
              >
                <ul className="m-0 list-none space-y-4 p-0">
                  {rows.map(r => (
                    <li key={r.axis} className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] md:items-center md:gap-5">
                      <div>
                        <span className="block text-[13px] font-semibold text-stone-800">{r.name}</span>
                        <span className="block text-xs text-stone-500">
                          Bạn <strong className="text-stone-800">{fmt(r, r.mine)}</strong> · Nhóm {fmt(r, r.group)}
                        </span>
                      </div>
                      <div className="space-y-1.5" aria-hidden>
                        <Bar value={r.wMine} color={r.info?.better === null ? '#78716c' : RADAR_ME_COLOR} />
                        <Bar value={r.wGroup} color="#d6d3d1" />
                      </div>
                      <Chip tone={r.verdict.tone}>{r.verdict.text}</Chip>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-5 rounded-full" style={{ background: RADAR_ME_COLOR }} aria-hidden /> Shop của bạn</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-5 rounded-full bg-stone-300" aria-hidden /> Trung bình 5 shop dẫn đầu</span>
                </div>
                <div className="mt-3 space-y-2">
                  {(data.axes_missing ?? []).length > 0 && (
                    <Note tone="warn">
                      Shop bạn chưa có số liệu {(data.axes_missing ?? []).map(a => AXIS[a]?.name.toLowerCase() ?? a).join(', ')}, nên tiêu chí đó chưa so được.
                    </Note>
                  )}
                  <Note>Giá cao hay thấp không tự nó là tốt hay xấu, nên trang chỉ ghi đắt hơn hay rẻ hơn nhóm.</Note>
                </div>
                <details className="mt-4 rounded-xl border border-stone-200 px-4 py-3">
                  <summary className="cursor-pointer text-[13px] font-semibold text-stone-700">Xem biểu đồ radar của từng shop</summary>
                  <div className="mt-3">
                    <RadarCompare
                      axes={rows.map(r => r.name)}
                      unitHint="điểm 0-100 trong danh mục"
                      series={[
                        { name: 'Shop của bạn', values: data.me, color: RADAR_ME_COLOR, primary: true },
                        ...data.competitors.map((c, i) => ({ name: c.shop_name, values: c.values, color: RADAR_COLORS[i % RADAR_COLORS.length] })),
                      ]}
                    />
                  </div>
                </details>
              </InsightCard>

              <InsightCard title="5 shop đang được so" bodyClassName="px-5 py-4">
                <DataTable
                  caption="Doanh thu 90 ngày của các shop được đưa vào so sánh"
                  head={
                    <>
                      <th scope="col">Shop</th>
                      <th scope="col" className="text-right">Doanh thu 90 ngày (ước tính)</th>
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
