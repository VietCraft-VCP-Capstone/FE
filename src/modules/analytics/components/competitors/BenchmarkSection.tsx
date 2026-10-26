/**
 * F33 — phần Điểm mạnh & điểm yếu của trang Phân tích đối thủ. Đọc GET /seller/analytics/shop-comparison.
 *
 * Người bán mới không đọc được radar 6 đường hay "điểm 0-100 min-max", nên số thật được tách thành
 * hai biểu đồ thanh: điểm mạnh và điểm cần cải thiện so với trung bình 5 shop dẫn đầu; radar gói vào
 * nút "Quan sát radar". Xếp loại dựa trên
 * SỐ THẬT với một khoảng "ngang nhóm", không dựa trên điểm quy đổi: 4,42 với 4,37 sao chênh nhau
 * xa trên thang 0-100 nhưng với người mua là như nhau.
 * Giá KHÔNG có tốt/xấu: chỉ nói đắt hơn hay rẻ hơn, và không bao giờ là "điểm cần cải thiện".
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Map as MapIcon, Radar, type LucideIcon } from 'lucide-react';
import { count, money } from '../../../../shared/utils/format';
import { InsightBlock } from '../InsightBlock';
import { SourceFooter } from '../SourceFooter';
import { RADAR_COLORS, RADAR_ME_COLOR, RadarCompare } from '../charts/RadarCompare';
import { GROUP_COLORS, StrategyMap } from '../charts/StrategyMap';
import { Chip, InsightCard, Note, type Tone } from '../ui';
import { BangManhYeu, type TieuChi } from './BangManhYeu';
import { decimal } from '../../format';
import type { InsightState } from '../../hooks/useInsight';
import { categoryLabel } from '../../labels';
import type { ShopComparison, StrategicGroups } from '../../types';
import { GIAI_THICH, NhanTinCay } from './giaiThich';

const so = (v: number) => decimal(v, Number.isInteger(v) ? 0 : 1);
// Giá trung bình làm tròn tới nghìn: "366.322đ" chỉ làm rối mắt người bán.
const nghin = (v: number) => money(Math.round(v / 1000) * 1000);

interface AxisInfo {
  name: string;
  fmt: (v: number) => string;
  /** Chiều tốt hơn. null = giá, không có tốt/xấu. */
  better: 'more' | 'less' | null;
  /** Lệch nhỏ hơn mức này (đơn vị thật) thì coi là ngang nhóm. */
  tol: (group: number) => number;
  /** Viết độ lệch (luôn dương) thành lời, vd "18 sản phẩm", "0,3 sao". */
  fmtDiff: (d: number) => string;
  // Số sản phẩm, số loại không có: top 5 theo doanh thu tất nhiên nhiều hàng hơn, khuyên "đăng thêm" là suy sai nhân quả.
  action?: { label: string; to: string };
}

const AXIS: Record<string, AxisInfo> = {
  listing_count: { name: 'Số sản phẩm đang bán', fmt: v => `${so(v)} sản phẩm`, fmtDiff: d => `${so(d)} sản phẩm`, better: 'more', tol: g => Math.max(1, g * 0.1) },
  avg_rating: { name: 'Điểm đánh giá', fmt: v => `${decimal(v, 1)} / 5`, fmtDiff: d => `${decimal(d, 1)} sao`, better: 'more', tol: () => 0.1, action: { label: 'Xem lại sản phẩm', to: '/seller/products' } },
  // Service lưu ÂM để chuẩn hoá đúng chiều; ở đây luôn dùng trị tuyệt đối (phút).
  response_speed: { name: 'Thời gian trả lời khách', fmt: v => `${decimal(v, 0)} phút`, fmtDiff: d => `${decimal(d, 0)} phút`, better: 'less', tol: g => Math.max(2, g * 0.15), action: { label: 'Mở tin nhắn khách hàng', to: '/seller/chat' } },
  avg_price: { name: 'Giá trung bình', fmt: nghin, fmtDiff: nghin, better: null, tol: g => g * 0.1, action: { label: 'Xem so sánh giá', to: '/seller/insights/pricing' } },
  product_diversity: { name: 'Số loại sản phẩm', fmt: v => `${so(v)} loại`, fmtDiff: d => `${so(d)} loại`, better: 'more', tol: () => 1 },
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
    const group = avg(data.competitors.map(c => num(c.raw?.[axis])));
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
    return { axis, i, info, name: info?.name ?? data.axes_vi[i], mine, group, gain, verdict };
  });
  const ranked = rows.filter(r => r.gain !== null).sort((a, b) => a.gain! - b.gain!);
  return {
    rows,
    weakest: ranked.find(r => r.gain! < 0),
    strongest: [...ranked].reverse().find(r => r.gain! > 0),
    catName: categoryLabel(data.segment, data.segment_name),
  };
}

/** Các tiêu chí của phần Mạnh yếu theo dạng hai bảng: số thật của bạn, trung bình 5 shop, shop tốt nhất. */
function tieuChi(data: ShopComparison, rows: ReturnType<typeof soVoiDanDau>['rows']): TieuChi[] {
  return rows.filter(r => r.info).map(r => {
    const info = r.info!;
    const cua = data.competitors
      .map(c => ({ v: num(c.raw?.[r.axis]), shop: c.shop_name }))
      .filter((x): x is { v: number; shop: string } => x.v !== null);
    const best = info.better === null || cua.length === 0
      ? null
      : cua.reduce((a, x) => ((info.better === 'more' ? x.v > a.v : x.v < a.v) ? x : a));
    return {
      key: r.axis, ten: r.name, mine: r.mine, group: r.group, best,
      better: info.better, tol: r.group === null ? 0 : info.tol(r.group),
      fmt: info.fmt, fmtDiff: info.fmtDiff, viec: info.action,
    };
  });
}

const DON_VI: Record<StrategicGroups['gaps'][number]['feature'], (v: number) => string> = {
  gia: nghin,
  sao: v => `${decimal(v, 1)} / 5`,
  phan_hoi: v => `${decimal(v, 0)} phút`,
  so_sp: v => `${decimal(v, 0)} sản phẩm`,
  doanh_so: v => money(Math.round(v)),
};

/** Một câu: tôi thuộc nhóm nào, nhóm nào bán tốt hơn. Khác ở đâu thì đã có bảng ngay bên dưới. */
function nhomKetLuan(g: StrategicGroups): string {
  const ten = (id: number) => g.groups.find(x => x.id === id)?.label ?? '';
  const dau = `Bạn thuộc nhóm "${ten(g.my_group)}".`;
  if (g.best_group === null) return `${dau} Sàn chưa có đơn đã giao nên chưa biết nhóm nào bán tốt hơn.`;
  if (g.best_group === g.my_group) return `${dau} Đây đang là nhóm bán tốt nhất trong danh mục.`;
  return `${dau} Nhóm "${ten(g.best_group)}" đang bán tốt hơn${g.gaps.length ? ', xem bạn khác nhóm này ở đâu ngay bên dưới' : ''}.`;
}

/** Khối bấm để mở (radar, bản đồ nhóm): người bán đọc phần dễ trước, muốn xem hình tổng thể thì mở. */
function MoRong({ id, icon: Icon, tieuDe, moTa, children }: {
  id: string;
  icon: LucideIcon;
  tieuDe: string;
  moTa: string;
  children: React.ReactNode;
}) {
  const [mo, setMo] = useState(false);
  return (
    <div className="rounded-md border border-stone-200">
      <button
        type="button"
        aria-expanded={mo}
        aria-controls={id}
        onClick={() => setMo(v => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border-none bg-white px-4 py-3 text-left transition-colors duration-150 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
      >
        <span className="flex items-center gap-2.5">
          <Icon size={16} className="shrink-0 text-[#007700]" aria-hidden />
          <span>
            <span className="block text-[13px] font-bold text-stone-900">{tieuDe}</span>
            <span className="block text-xs text-stone-500">{moTa}</span>
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#007700]">
          {mo ? 'Thu gọn' : 'Mở ra xem'}
          <ChevronDown size={14} className={`transition-transform duration-150 motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`} aria-hidden />
        </span>
      </button>
      {/* Chỉ dựng khi mở: biểu đồ trong khung ẩn không đo được bề rộng. */}
      {mo && <div id={id} className="border-t border-stone-100 px-4 py-4">{children}</div>}
    </div>
  );
}

const SO_SHOP_HIEN = 8;

/** Nhóm chiến lược đọc như các thẻ: mỗi nhóm một thẻ (tên, số shop, giá, các shop), rồi bạn khác nhóm bán tốt nhất ở đâu. */
function NhomChienLuoc({ g }: { g: StrategicGroups }) {
  const thuTu = (id: number) => (id === g.best_group ? 0 : id === g.my_group ? 1 : 2);
  const nhom = [...g.groups].sort((a, b) => thuTu(a.id) - thuTu(b.id) || b.size - a.size);
  const tot = g.groups.find(x => x.id === g.best_group);
  return (
    <div className="space-y-4">
      <p className="m-0 text-[13px] leading-relaxed text-stone-800">{nhomKetLuan(g)}</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {nhom.map(gr => {
          const shops = g.points.filter(pt => pt.group === gr.id).sort((x, y) => Number(y.me) - Number(x.me));
          const cuaBan = gr.id === g.my_group;
          return (
            <section
              key={gr.id}
              aria-label={`Nhóm ${gr.label}`}
              className={`min-w-0 rounded-lg border bg-white p-4 ${cuaBan ? 'border-[#007700] shadow-[0_0_0_1px_#007700]' : 'border-stone-200'}`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: GROUP_COLORS[gr.id % GROUP_COLORS.length] }} aria-hidden />
                <h4 className="m-0 text-[13.5px] font-bold leading-snug text-stone-900">{gr.label}</h4>
              </div>
              {(cuaBan || gr.id === g.best_group) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cuaBan && <Chip tone="brand">Nhóm của bạn</Chip>}
                  {gr.id === g.best_group && <Chip tone="good">Bán tốt nhất</Chip>}
                </div>
              )}
              <dl className="m-0 mt-3 grid grid-cols-2 gap-2">
                <div><dt className="text-[11px] text-stone-500">Số shop</dt><dd className="m-0 text-[15px] font-semibold text-stone-900">{count(gr.size)}</dd></div>
                <div><dt className="text-[11px] text-stone-500">Giá trung bình</dt><dd className="m-0 text-[15px] font-semibold text-stone-900">{nghin(gr.avg_price_vnd)}</dd></div>
              </dl>
              <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0" aria-label="Các shop trong nhóm">
                {shops.slice(0, SO_SHOP_HIEN).map(pt => (
                  <li key={pt.shop_id} className={`rounded-full px-2 py-0.5 text-xs ${pt.me ? 'bg-[#EAF0E2] font-bold text-[#005B00]' : 'bg-stone-100 text-stone-700'}`}>
                    {pt.me ? 'Shop của bạn' : pt.shop_name}
                  </li>
                ))}
                {shops.length > SO_SHOP_HIEN && <li className="px-1 py-0.5 text-xs text-stone-500">+{count(shops.length - SO_SHOP_HIEN)} shop khác</li>}
              </ul>
            </section>
          );
        })}
      </div>

      {tot && g.gaps.length > 0 && (
        <div className="rounded-lg bg-stone-50 p-4">
          <h4 className="m-0 mb-3 text-[13px] font-bold text-stone-900">Bạn khác nhóm "{tot.label}" ở đâu</h4>
          <ul className="m-0 list-none space-y-2 p-0">
            {g.gaps.map(x => (
              <li key={x.feature} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-white px-3 py-2.5 text-[13px]">
                <span className="min-w-[9rem] font-semibold text-stone-800">{x.name.replace(' (phút)', '')}</span>
                <span className="text-stone-600">Bạn <strong className="text-stone-900">{DON_VI[x.feature](x.mine)}</strong></span>
                <ArrowRight size={14} className="text-stone-400" aria-label="so với" />
                <span className="text-stone-600">Nhóm <strong className="text-stone-900">{DON_VI[x.feature](x.theirs)}</strong></span>
                <span className="ml-auto"><Chip tone={x.feature === 'gia' ? 'info' : 'warn'}>{x.feature === 'gia' ? 'Chỉ để biết' : 'Nên học'}</Chip></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!g.clear && (
        <Note tone="warn">Các shop trong danh mục này chưa chia thành nhóm rõ ràng, nên chỉ đọc các nhóm để tham khảo.</Note>
      )}

      <MoRong id="ban-do-nhom" icon={MapIcon} tieuDe="Xem bản đồ vị trí các shop" moTa="Mỗi chấm là một shop, cùng màu là cùng nhóm; các shop gần nhau là có cách bán giống nhau.">
        <StrategyMap data={g} />
        <div className="mt-3"><Note>Vị trí trên bản đồ chỉ cho thấy shop nào giống shop nào. Hai trục là hướng khác nhau nhiều nhất giữa các shop, không phải thang điểm.</Note></div>
      </MoRong>
    </div>
  );
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
        // Đường trung bình 5 shop: 6 đường chồng nhau khó đọc, nên mặc định chỉ vẽ bạn và đường này.
        const tbDiem = data.axes.map((_, i) => avg(data.competitors.map(c => c.values[i] ?? null)));
        const tenTb = 'Trung bình 5 shop dẫn đầu';

        return (
          <div className="space-y-5">
            <InsightCard
              title="Bạn so với 5 shop dẫn đầu"
              info={GIAI_THICH.soSanh}
              description={`Danh mục chính của bạn là ${catName} (${decimal(data.shops_in_segment, 0)} shop, kể cả shop bạn). ${chonTheo}`}
              action={weakest?.info?.action && (
                <Link to={weakest.info.action.to} className="text-[13px] font-semibold text-[#007700] no-underline hover:text-[#005B00]">
                  {weakest.info.action.label}
                </Link>
              )}
              footer={<SourceFooter meta={meta} method={`Danh mục so sánh chọn tự động: ${data.segment_reason}.`} />}
            >
              <BangManhYeu ds={tieuChi(data, rows)} tenNhom="Trung bình 5 shop dẫn đầu" />

              <div className="mt-5">
              <MoRong id="quan-sat-radar" icon={Radar} tieuDe="Quan sát radar" moTa="Hình dạng tổng thể của bạn so với 5 shop dẫn đầu trên một biểu đồ, kèm số thật của từng shop.">
                <RadarCompare
                  axes={rows.map(r => r.name)}
                  bangSoThat
                  anBanDau={data.competitors.map(c => c.shop_name)}
                  series={[
                    { name: 'Shop của bạn', values: data.me, color: RADAR_ME_COLOR, primary: true, raw: rawCua(data.me_raw) },
                    { name: tenTb, values: tbDiem, color: '#78716c', raw: rows.map(r => giaTri(r.info, r.group)) },
                    ...data.competitors.map((c, i) => ({ name: c.shop_name, values: c.values, color: RADAR_COLORS[i % RADAR_COLORS.length], raw: rawCua(c.raw) })),
                  ]}
                />
                <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">
                  Mỗi trục, shop có số tốt nhất trong 6 shop được 100 điểm, kém nhất được 0. Riêng giá trung bình: 100 là đắt nhất, không phải tốt hơn. Mặc định chỉ vẽ bạn và trung bình 5 shop; bấm tên từng shop bên dưới biểu đồ để vẽ thêm.
                </p>
              </MoRong>
              </div>
            </InsightCard>

            {(data.strategic_groups || data.strategic_groups_reason) && (
              <InsightCard
                title="Nhóm chiến lược"
                info={GIAI_THICH.nhom}
                action={<NhanTinCay loai="tham" />}
                description={`AI chia ${count(data.shops_in_segment)} shop cùng danh mục thành các nhóm có cách bán giống nhau (giá, đánh giá, thời gian trả lời, số mẫu, doanh thu).`}
                bodyClassName="px-4 py-3"
              >
                {data.strategic_groups ? (
                  <NhomChienLuoc g={data.strategic_groups} />
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
