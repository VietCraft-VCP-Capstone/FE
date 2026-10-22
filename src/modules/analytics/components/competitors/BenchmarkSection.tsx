/**
 * F33 — phần Điểm mạnh & điểm yếu của trang Phân tích đối thủ. Đọc GET /seller/analytics/shop-comparison.
 *
 * Người bán mới không đọc được radar 6 đường hay "điểm 0-100 min-max", nên mỗi tiêu chí là
 * một dòng: số thật của bạn, số thật trung bình 5 shop dẫn đầu, và nhận xét bằng lời. Nhận xét
 * dựa trên SỐ THẬT với một khoảng "ngang nhóm", không dựa trên điểm quy đổi: 4,42 với 4,37 sao
 * chênh nhau xa trên thang 0-100 nhưng với người mua là như nhau.
 * Giá KHÔNG có tốt/xấu: chỉ nói đắt hơn hay rẻ hơn, và không bao giờ là "điểm cần cải thiện".
 */

import { Link } from 'react-router-dom';
import { count, money } from '../../../../shared/utils/format';
import { InsightBlock } from '../InsightBlock';
import { SourceFooter } from '../SourceFooter';
import { RADAR_COLORS, RADAR_ME_COLOR, RadarCompare } from '../charts/RadarCompare';
import { StrategyMap } from '../charts/StrategyMap';
import { Chip, InsightCard, Note, type Tone } from '../ui';
import { decimal } from '../../format';
import type { InsightState } from '../../hooks/useInsight';
import { categoryLabel } from '../../labels';
import type { ShopComparison, StrategicGroups } from '../../types';

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
  avg_price: { name: 'Giá trung bình', fmt: v => money(Math.round(v)), better: null, tol: g => g * 0.1, action: { label: 'Xem so sánh giá', to: '/seller/insights/pricing' } },
  product_diversity: { name: 'Số loại sản phẩm', fmt: v => `${so(v)} loại`, better: 'more', tol: () => 1, action: { label: 'Đăng thêm loại sản phẩm', to: '/seller/products' } },
};

const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? Math.abs(v) : null);
const avg = (xs: (number | null)[]) => {
  const ok = xs.filter((v): v is number => v !== null);
  return ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : null;
};

/** Số thật của một tiêu chí, đọc thành lời. */
export const giaTri = (info: AxisInfo | undefined, v: number | null) => (v === null || !info ? 'chưa có' : info.fmt(v));

/** So từng tiêu chí với trung bình 5 shop dẫn đầu; kết luận đầu trang cũng dùng điểm mạnh, yếu nhất ở đây. */
export function soVoiDanDau(data: ShopComparison) {
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
  return {
    rows,
    weakest: ranked.find(r => r.gain! < 0),
    strongest: [...ranked].reverse().find(r => r.gain! > 0),
    catName: categoryLabel(data.segment, data.segment_name),
  };
}

function Bar({ value, color }: { value: number | null; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
      {value !== null && <div className="h-2 rounded-full" style={{ width: `${Math.max(3, Math.min(100, value))}%`, background: color }} />}
    </div>
  );
}

const DON_VI: Record<StrategicGroups['gaps'][number]['feature'], (v: number) => string> = {
  gia: v => money(Math.round(v)),
  sao: v => `${decimal(v, 1)} / 5`,
  phan_hoi: v => `${decimal(v, 0)} phút`,
  so_sp: v => `${decimal(v, 0)} sản phẩm`,
  doanh_so: v => money(Math.round(v)),
};

/** Một câu: tôi thuộc nhóm nào, nhóm nào bán tốt hơn và khác tôi ở đâu. */
function nhomKetLuan(g: StrategicGroups): string {
  const ten = (id: number) => g.groups.find(x => x.id === id)?.label ?? '';
  const dau = `Bạn thuộc nhóm "${ten(g.my_group)}".`;
  if (g.best_group === null) return `${dau} Sàn chưa có đơn đã giao nên chưa biết nhóm nào bán tốt hơn.`;
  if (g.best_group === g.my_group) return `${dau} Đây đang là nhóm bán tốt nhất trong danh mục.`;
  const khac = g.gaps.map(x => `${x.name.toLowerCase()} ${DON_VI[x.feature](x.theirs)} (bạn ${DON_VI[x.feature](x.mine)})`).join(', ');
  return `${dau} Nhóm "${ten(g.best_group)}" đang bán tốt hơn${khac ? `: ${khac}` : ''}.`;
}

export function BenchmarkSection({ state, reload }: { state: InsightState<ShopComparison>; reload: () => void }) {
  return (
    <InsightBlock state={state} onRetry={reload}>
      {(data, meta) => {
        const { rows, weakest, catName } = soVoiDanDau(data);
        const chonTheo = data.ranked_by === 'reviews'
          ? 'Sàn chưa có đơn đã giao trong 90 ngày nên 5 shop được chọn theo số đánh giá; thứ hạng này chưa ổn định.'
          : '5 shop là 5 shop có doanh thu 90 ngày cao nhất danh mục.';
        const rawCua = (raw: Record<string, number | null> | undefined) => data.axes.map(a => giaTri(AXIS[a], num(raw?.[a])));

        return (
          <div className="space-y-5">
            <InsightCard
              title="Bạn so với 5 shop dẫn đầu"
              description={`Danh mục chính của bạn là ${catName} (${decimal(data.shops_in_segment, 0)} shop, kể cả shop bạn). ${chonTheo}`}
              action={weakest?.info && (
                <Link to={weakest.info.action.to} className="text-[13px] font-semibold text-[#007700] no-underline hover:text-[#005B00]">
                  {weakest.info.action.label}
                </Link>
              )}
              footer={<SourceFooter meta={meta} method={`Danh mục so sánh chọn tự động: ${data.segment_reason}.`} />}
            >
              <RadarCompare
                axes={rows.map(r => r.name)}
                unitHint="điểm 0–100 giữa 6 shop"
                series={[
                  { name: 'Shop của bạn', values: data.me, color: RADAR_ME_COLOR, primary: true, raw: rawCua(data.me_raw) },
                  ...data.competitors.map((c, i) => ({ name: c.shop_name, values: c.values, color: RADAR_COLORS[i % RADAR_COLORS.length], raw: rawCua(c.raw) })),
                ]}
              />
              <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">
                Mỗi trục, shop có số tốt nhất trong 6 shop được 100 điểm, kém nhất được 0. Riêng giá trung bình: 100 là đắt nhất, không phải tốt hơn. Rê chuột lên biểu đồ để xem số thật.
              </p>

              <h3 className="mb-3 mt-5 text-[13px] font-bold text-stone-900">Đọc từng tiêu chí bằng số thật</h3>
              <ul className="m-0 list-none space-y-4 p-0">
                {rows.map(r => (
                  <li key={r.axis} className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] md:items-center md:gap-5">
                    <div>
                      <span className="block text-[13px] font-semibold text-stone-800">{r.name}</span>
                      <span className="block text-xs text-stone-500">
                        Bạn <strong className="text-stone-800">{giaTri(r.info, r.mine)}</strong> · Nhóm {giaTri(r.info, r.group)}
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
            </InsightCard>

            {(data.strategic_groups || data.strategic_groups_reason) && (
              <InsightCard
                title="Bản đồ nhóm chiến lược"
                description={`AI chia ${count(data.shops_in_segment)} shop cùng danh mục thành các nhóm có cách bán giống nhau (giá, đánh giá, thời gian trả lời, số mẫu, doanh thu).`}
                bodyClassName="px-4 py-3"
              >
                {data.strategic_groups ? (
                  <div className="space-y-3">
                    <p className="m-0 text-[13px] leading-relaxed text-stone-800">{nhomKetLuan(data.strategic_groups)}</p>
                    <StrategyMap data={data.strategic_groups} />
                    {!data.strategic_groups.clear && (
                      <Note tone="warn">Các shop chưa tách nhóm rõ (độ tách {decimal(data.strategic_groups.silhouette, 2)}), nên đọc bản đồ để tham khảo.</Note>
                    )}
                    <Note>Vị trí trên bản đồ chỉ cho thấy shop nào giống shop nào. Hai trục là hướng khác nhau nhiều nhất giữa các shop, không phải thang điểm.</Note>
                  </div>
                ) : (
                  <Note>{data.strategic_groups_reason}.</Note>
                )}
              </InsightCard>
            )}
          </div>
        );
      }}
    </InsightBlock>
  );
}
