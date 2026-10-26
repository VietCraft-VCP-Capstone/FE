/**
 * BR-189: ba biểu đồ cột (giá, số đánh giá, lượt yêu thích) của 20 sản phẩm bán chạy nhất của shop khác,
 * shop của bạn vẽ chồng bằng một đường mức (trung bình các sản phẩm của bạn trong danh mục).
 * 20 cột nên không ghi số lên từng cột; số chi tiết nằm ở danh sách top 20 phía trên.
 */

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_INK, CHART_MARKS, SERIES } from '../../../../shared/components/charts/chartTheme';
import { count, money } from '../../../../shared/utils/format';
import { decimal } from '../../format';
import type { Competitors } from '../../types';
import { BangManhYeu, type TieuChi } from './BangManhYeu';

type Dong = Competitors['competitors'][number];

interface ChiSo {
  key: 'price_vnd' | 'n_reviews' | 'favorite_count';
  title: string;
  fmt: (v: number) => string;
  tick: (v: number) => string;
  mine: number | null;
}

const gon = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));

function CotTooltip({ active, payload, chiSo }: { active?: boolean; payload?: { payload?: Dong }[]; chiSo: ChiSo }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="max-w-[260px] rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 shadow-[0_6px_20px_rgba(16,33,26,0.12)]">
      <div className="text-[11.5px] font-bold text-[#0b0b0b]">#{d.rank} · {d.title}</div>
      <div className="text-[11.5px] text-[#52514e]">{d.shop_name}</div>
      <div className="mt-0.5 text-[12px] text-[#52514e]">
        {chiSo.title}: <span className="font-bold tabular-nums text-[#0b0b0b]">{chiSo.fmt(d[chiSo.key] ?? 0)}</span>
      </div>
    </div>
  );
}

function MotBieuDo({ rows, chiSo }: { rows: Dong[]; chiSo: ChiSo }) {
  const rong = rows.every(r => !r[chiSo.key]) && !chiSo.mine;
  return (
    <figure className="m-0 min-w-0">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-semibold text-stone-800">{chiSo.title}</span>
        {chiSo.mine !== null && <span className="text-xs text-stone-600">Bạn: <strong className="tabular-nums text-stone-900">{chiSo.fmt(chiSo.mine)}</strong></span>}
      </figcaption>
      {rong ? (
        <p className="m-0 flex h-44 items-center justify-center rounded-md bg-stone-50 px-4 text-center text-xs text-stone-500">
          Chưa sản phẩm nào có {chiSo.title.toLowerCase()} để so.
        </p>
      ) : (
      <div
        className="h-44"
        role="img"
        aria-label={`${chiSo.title} của ${rows.length} sản phẩm bán chạy nhất của shop khác${chiSo.mine !== null ? `, của bạn ${chiSo.fmt(chiSo.mine)}` : ''}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
            <XAxis dataKey="rank" tickLine={false} axisLine={false} interval={1} tick={{ fill: CHART_INK.axis, fontSize: 10 }} />
            <YAxis width={40} tickLine={false} axisLine={false} tickCount={3} tickFormatter={chiSo.tick} tick={{ fill: CHART_INK.axis, fontSize: 10 }} />
            <Tooltip cursor={{ fill: 'rgba(16,33,26,0.04)' }} content={<CotTooltip chiSo={chiSo} />} />
            <Bar dataKey={chiSo.key} fill={SERIES.blue} radius={[4, 4, 0, 0]} maxBarSize={CHART_MARKS.maxBarWidth} isAnimationActive={false} />
            {chiSo.mine !== null && (
              <ReferenceLine y={chiSo.mine} stroke={SERIES.green} strokeWidth={2} strokeDasharray="5 3" ifOverflow="extendDomain" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
    </figure>
  );
}

const tb = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null);
const soTb = (v: number) => decimal(v, v < 10 && !Number.isInteger(v) ? 1 : 0);
const nghin = (v: number) => money(Math.round(v / 1000) * 1000);

/** Trung bình mỗi sản phẩm của bạn so với trung bình top 20; không so số đã bán vì top 20 vốn chọn theo số bán. */
function tieuChiTop20(data: Competitors): TieuChi[] {
  const top = data.competitors;
  const tot = (k: 'n_reviews' | 'favorite_count' | 'rating_shrunk') => top
    .filter(r => typeof r[k] === 'number')
    .reduce<{ v: number; shop: string | null } | null>((a, r) => (a && a.v >= (r[k] as number) ? a : { v: r[k] as number, shop: r.shop_name }), null);
  const dem = (k: 'n_reviews' | 'favorite_count', ten: string, donVi: string): TieuChi => {
    const group = tb(top.map(r => r[k] ?? 0));
    return {
      key: k, ten, mine: tb(data.my_listings.map(r => r[k] ?? 0)), group, best: tot(k), better: 'more',
      tol: Math.max(1, (group ?? 0) * 0.1), fmt: v => `${soTb(v)} ${donVi}`, fmtDiff: d => `${soTb(d)} ${donVi}`,
    };
  };
  const sao = top.map(r => r.rating_shrunk).filter((v): v is number => typeof v === 'number');
  const gia = tb(top.map(r => r.price_vnd));
  return [
    { key: 'rating', ten: 'Điểm đánh giá', mine: data.my_position.my_avg_rating, group: tb(sao), best: tot('rating_shrunk'), better: 'more', tol: 0.1, fmt: v => `${decimal(v, 1)} / 5`, fmtDiff: d => `${decimal(d, 1)} sao` },
    dem('n_reviews', 'Số đánh giá mỗi sản phẩm', 'đánh giá'),
    dem('favorite_count', 'Lượt yêu thích mỗi sản phẩm', 'lượt'),
    { key: 'price', ten: 'Giá trung bình', mine: data.my_position.my_avg_price_vnd, group: gia, best: null, better: null, tol: (gia ?? 0) * 0.1, fmt: nghin, fmtDiff: nghin },
  ];
}

export function TopTwentyCharts({ data }: { data: Competitors }) {
  const mine = data.my_listings;
  const chiSo: ChiSo[] = [
    { key: 'price_vnd', title: 'Giá', fmt: v => money(Math.round(v)), tick: gon, mine: data.my_position.my_avg_price_vnd },
    { key: 'n_reviews', title: 'Số đánh giá', fmt: v => count(Math.round(v)), tick: v => count(v), mine: tb(mine.map(r => r.n_reviews ?? 0)) },
    { key: 'favorite_count', title: 'Lượt yêu thích', fmt: v => count(Math.round(v)), tick: v => count(v), mine: tb(mine.map(r => r.favorite_count ?? 0)) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {chiSo.map(c => <MotBieuDo key={c.key} rows={data.competitors} chiSo={c} />)}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-xs text-stone-600">
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.blue }} aria-hidden />
          Sản phẩm của shop khác, xếp theo hạng bán chạy (1 là cao nhất)
        </li>
        {mine.length > 0 && (
          <li className="inline-flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: SERIES.green }} aria-hidden />
            Trung bình các sản phẩm của bạn trong danh mục
          </li>
        )}
      </ul>
      {mine.length > 0 && (
        <div className="space-y-3 pt-3">
          <p className="m-0 text-xs leading-relaxed text-stone-500">
            Trung bình mỗi sản phẩm của bạn so với trung bình các sản phẩm bán chạy. Không so số đã bán, vì các sản phẩm này vốn được chọn vì bán nhiều nhất.
          </p>
          <BangManhYeu ds={tieuChiTop20(data)} tenNhom="Trung bình top 20" />
        </div>
      )}
    </div>
  );
}
