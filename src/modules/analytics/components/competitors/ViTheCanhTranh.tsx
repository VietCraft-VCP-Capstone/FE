/**
 * Vị thế cạnh tranh: mỗi shop trong danh mục là một chấm, ngang là giá trung vị, dọc là số đã bán 90 ngày.
 * Hai đường nét đứt là trung vị của danh mục, chia bốn vùng. Sàn ít shop thì bản đồ càng dễ đọc hơn một biểu đồ 20 cột.
 * Bấm một shop để đưa shop đó vào bảng so sánh ngay bên dưới.
 */

import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Check, Crosshair, PieChart, TrendingUp, type LucideIcon } from 'lucide-react';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { count, money } from '../../../../shared/utils/format';
import { decimal } from '../../format';
import type { CompetitorShop } from '../../types';
import { InsightCard } from '../ui';
import { GIAI_THICH } from './giaiThich';

const XAM = '#8f8a85';
const NET = '#b8b3ad';
const NHAN_VUNG = { fill: '#78716c', fontSize: 11, fontWeight: 600 };
const gonK = (v: number) => `${Math.round(v / 1000)}k`;

function trungVi(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Bước chia trục "đẹp" (1, 2, 2,5, 5 × 10^n) không nhỏ hơn `tho`, và các vạch chia đều theo bước đó. */
export const buocDep = (tho: number) => {
  const mu = 10 ** Math.floor(Math.log10(Math.max(tho, 1)));
  return [1, 2, 2.5, 5, 10].map(k => k * mu).find(b => b >= tho) ?? 10 * mu;
};
export const vachChia = (tu: number, den: number, buoc: number) =>
  Array.from({ length: Math.floor((den - tu) / buoc + 1e-9) + 1 }, (_, i) => tu + i * buoc);

interface Diem {
  x: number;
  y: number;
  shop: CompetitorShop;
  mau: string;
  nhan: string | null;
  trai: boolean;
  chon: boolean;
}

function DiemShop({ cx = 0, cy = 0, payload }: { cx?: number; cy?: number; payload?: Diem }) {
  if (!payload) return null;
  const r = payload.shop.is_me ? 8 : 7;
  return (
    <g style={{ cursor: payload.shop.is_me ? 'default' : 'pointer' }}>
      {payload.chon && <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={SERIES.blue} strokeOpacity={0.35} strokeWidth={4} />}
      <circle cx={cx} cy={cy} r={r} fill={payload.mau} stroke="#fff" strokeWidth={2} />
      {payload.nhan && (
        <text
          x={payload.trai ? cx - r - 5 : cx + r + 5}
          y={cy + 4}
          textAnchor={payload.trai ? 'end' : 'start'}
          fontSize={12}
          fontWeight={payload.shop.is_me ? 700 : 500}
          fill="#1c1917"
          stroke="#fff"
          strokeWidth={3}
          paintOrder="stroke"
        >
          {payload.nhan}
        </text>
      )}
    </g>
  );
}

function ShopTooltip({ active, payload }: { active?: boolean; payload?: { payload?: Diem }[] }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  const s = d.shop;
  return (
    <div className="max-w-[240px] rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 text-xs shadow-[0_6px_20px_rgba(16,33,26,0.12)]">
      <div className="font-bold text-stone-900">{s.is_me ? 'Shop của bạn' : s.shop_name}</div>
      <div className="text-stone-600">Giá trung vị: <strong className="text-stone-900">{money(s.price_vnd.median)}</strong></div>
      <div className="text-stone-600">Lượng bán 90 ngày: <strong className="text-stone-900">{count(s.units_90d)}</strong> · thị phần {decimal(s.share_pct, 1)}%</div>
      {!s.is_me && s.rivalry !== null && <div className="text-stone-600">Mức độ tương đồng: {s.rivalry}/100</div>}
      {!s.is_me && <div className="mt-1 text-[11px] text-stone-500">Bấm để so sánh chi tiết</div>}
    </div>
  );
}

type NhanDinh = { icon: LucideIcon; mauIcon: string; nenIcon: string; lead: string; text: string; shopId?: string };

/** Tối đa bốn nhận định, chỉ từ số đã có: shop nên tham khảo, shop tăng đột biến, điểm mạnh của bạn, độ tập trung thị trường. */
function nhanDinh(shops: CompetitorShop[], cr3: number | undefined): NhanDinh[] {
  const me = shops.find(s => s.is_me);
  const khac = shops.filter(s => !s.is_me);
  const ra: NhanDinh[] = [];
  const peer = khac.find(s => s.is_peer);
  if (peer && me) {
    ra.push({
      icon: Crosshair, mauIcon: 'text-sky-800', nenIcon: 'bg-sky-50', lead: peer.shop_name ?? 'Một shop',
      text: ` cùng phân khúc giá với bạn (${gonK(peer.price_vnd.median)} so với ${gonK(me.price_vnd.median)}) nhưng lượng bán gấp ${Math.round(peer.units_90d / Math.max(me.units_90d, 1))} lần: nên tham khảo chiến lược của shop này.`,
      shopId: peer.shop_id,
    });
  }
  const vot = khac.find(s => s.trend.kind === 'surge');
  if (vot) {
    ra.push({
      icon: TrendingUp, mauIcon: 'text-amber-800', nenIcon: 'bg-amber-50', lead: vot.shop_name ?? 'Một shop',
      text: ` tăng trưởng đột biến: ${count(vot.trend.last_week ?? 0)} sản phẩm tuần này, mức nền ${decimal(vot.trend.baseline ?? 0, 0)} sản phẩm/tuần.`,
      shopId: vot.shop_id,
    });
  }
  const do_ = khac.map(s => s.response_minutes).filter((v): v is number => v !== null);
  if (me?.response_minutes != null && do_.length && me.response_minutes < Math.min(...do_)) {
    ra.push({
      icon: Check, mauIcon: 'text-[#005B00]', nenIcon: 'bg-[#EAF0E2]', lead: 'Thời gian phản hồi của bạn tốt nhất danh mục',
      text: `: ${me.response_minutes} phút, các shop khác từ ${Math.min(...do_)} đến ${Math.max(...do_)} phút.`,
    });
  }
  if (cr3 !== undefined && shops.length > 3) {
    ra.push({
      icon: PieChart, mauIcon: 'text-stone-700', nenIcon: 'bg-stone-100', lead: cr3 >= 50 ? 'Thị trường tập trung cao' : 'Thị trường phân tán',
      text: `: 3 shop dẫn đầu chiếm ${decimal(cr3, 0)}% lượng bán của danh mục.`,
    });
  }
  return ra.slice(0, 4);
}

export function ViTheCanhTranh({ shops, cr3, tenDanhMuc, trongBang, chon, onChon }: {
  shops: CompetitorShop[];
  cr3?: number;
  tenDanhMuc: string;
  /** Shop đang có cột trong bảng so sánh: tô lam, có nhãn tên. */
  trongBang: Set<string>;
  chon: string | null;
  onChon: (shopId: string) => void;
}) {
  // shortcut: đọc cỡ màn một lần lúc vẽ như RadarCompare; xoay máy thì chờ lần vẽ sau.
  const hep = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  const gia = shops.map(s => s.price_vnd.median);
  const ban = shops.map(s => s.units_90d);
  const bX = buocDep((Math.max(...gia) - Math.min(...gia)) / 4 || 50000);
  const xMin = Math.max(0, Math.floor((Math.min(...gia) * 0.97) / bX) * bX);
  const xMax = Math.ceil((Math.max(...gia) * 1.02) / bX) * bX;
  const bY = buocDep(Math.max(...ban, 4) / 4);
  const yMax = Math.ceil((Math.max(...ban, 4) * 1.08) / bY) * bY;
  const xMed = trungVi(gia);
  const yMed = trungVi(ban);
  const tongBan = ban.reduce((s, v) => s + v, 0);

  const diem: Diem[] = shops.map(s => {
    const coBang = trongBang.has(s.shop_id);
    return {
      x: s.price_vnd.median,
      y: s.units_90d,
      shop: s,
      mau: s.is_me ? SERIES.green : coBang ? SERIES.blue : XAM,
      // Màn hẹp chỉ ghi tên shop bạn và shop đang chọn, để chữ không đè nhau.
      nhan: s.is_me ? 'Bạn' : (hep ? chon === s.shop_id : coBang) ? s.shop_name : null,
      trai: s.price_vnd.median > xMin + 0.68 * (xMax - xMin),
      chon: chon === s.shop_id,
    };
  });
  const ds = nhanDinh(shops, cr3);

  return (
    <InsightCard
      title={`Vị thế cạnh tranh trong danh mục ${tenDanhMuc}`}
      info={GIAI_THICH.viThe}
      action={<span className="rounded-full bg-[#EAF0E2] px-2.5 py-1 text-xs font-semibold text-[#005B00]">{count(shops.length)} shop · {count(tongBan)} sản phẩm đã bán (90 ngày)</span>}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div
            className="w-full"
            style={{ height: hep ? 280 : 340 }}
            role="img"
            aria-label={`Bản đồ vị thế ${count(shops.length)} shop: giá trung vị và lượng bán 90 ngày. Trung vị danh mục: giá ${money(xMed)}, lượng bán ${decimal(yMed, 0)}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 16, bottom: 22, left: 4 }}>
                <CartesianGrid stroke={CHART_INK.grid} />
                <XAxis
                  type="number" dataKey="x" domain={[xMin, xMax]} ticks={vachChia(xMin, xMax, bX)} tickFormatter={gonK}
                  tick={{ fill: CHART_INK.axis, fontSize: 11 }} tickLine={false}
                  label={{ value: 'Giá bán trung vị →', position: 'insideBottomRight', offset: -14, fill: CHART_INK.axis, fontSize: 12 }}
                />
                <YAxis
                  type="number" dataKey="y" domain={[0, yMax]} ticks={vachChia(0, yMax, bY)} width={44} allowDecimals={false}
                  tick={{ fill: CHART_INK.axis, fontSize: 11 }} tickLine={false}
                  label={{ value: 'Lượng bán 90 ngày', angle: -90, position: 'insideLeft', offset: 10, fill: CHART_INK.axis, fontSize: 12 }}
                />
                {/* Màn hẹp không đủ chỗ cho nhãn bốn vùng: chú thích bên dưới đã nói đường nét đứt là trung vị. */}
                {!hep && (
                  <>
                    <ReferenceArea x1={xMin} x2={xMed} y1={yMed} y2={yMax} fill="transparent" ifOverflow="hidden" label={{ value: 'Giá thấp · Bán chạy', position: 'insideBottomLeft', ...NHAN_VUNG }} />
                    <ReferenceArea x1={xMed} x2={xMax} y1={yMed} y2={yMax} fill="transparent" ifOverflow="hidden" label={{ value: 'Giá cao · Bán chạy', position: 'insideBottomRight', ...NHAN_VUNG }} />
                    <ReferenceArea x1={xMin} x2={xMed} y1={0} y2={yMed} fill="transparent" ifOverflow="hidden" label={{ value: 'Giá thấp · Bán chậm', position: 'insideTopLeft', ...NHAN_VUNG }} />
                    <ReferenceArea x1={xMed} x2={xMax} y1={0} y2={yMed} fill="transparent" ifOverflow="hidden" label={{ value: 'Giá cao · Bán chậm', position: 'insideTopRight', ...NHAN_VUNG }} />
                  </>
                )}
                <ReferenceLine x={xMed} stroke={NET} strokeWidth={1.5} strokeDasharray="5 4" />
                <ReferenceLine y={yMed} stroke={NET} strokeWidth={1.5} strokeDasharray="5 4" />
                <Tooltip content={<ShopTooltip />} cursor={false} isAnimationActive={false} />
                <Scatter
                  data={diem}
                  isAnimationActive={false}
                  shape={(p: unknown) => <DiemShop {...(p as { cx?: number; cy?: number; payload?: Diem })} />}
                  onClick={(p: unknown) => {
                    const s = ((p as { payload?: Diem })?.payload ?? (p as Diem))?.shop;
                    if (s && !s.is_me) onChon(s.shop_id);
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-stone-600">
            <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES.green }} aria-hidden />Bạn</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES.blue }} aria-hidden />Đối thủ trong bảng so sánh</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: XAM }} aria-hidden />Shop khác cùng danh mục</li>
            <li className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: NET }} aria-hidden />Trung vị danh mục: giá {gonK(xMed)}, lượng bán {decimal(yMed, 0)}</li>
          </ul>
        </div>

        <div className="min-w-0">
          <h3 className="m-0 mb-2.5 text-[13px] font-bold text-stone-900">Nhận định chính</h3>
          {ds.length === 0 ? (
            <p className="m-0 text-[13px] text-stone-500">Chưa có nhận định nào đủ căn cứ.</p>
          ) : (
            <ul className="m-0 list-none space-y-2.5 p-0">
              {ds.map(d => (
                <li key={d.lead} className="flex items-start gap-2.5 rounded-lg bg-stone-50 px-3 py-2.5">
                  <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${d.nenIcon} ${d.mauIcon}`} aria-hidden>
                    <d.icon size={16} />
                  </span>
                  <div className="min-w-0 text-[13px] leading-relaxed text-stone-800">
                    <p className="m-0"><strong>{d.lead}</strong>{d.text}</p>
                    {d.shopId && (
                      <a href="#so-sanh" onClick={() => onChon(d.shopId!)} className="mt-0.5 inline-block text-[13px] font-semibold text-[#007700] no-underline hover:text-[#005B00]">
                        So sánh chi tiết →
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </InsightCard>
  );
}
