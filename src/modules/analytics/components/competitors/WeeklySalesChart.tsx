/**
 * Kiểu xem "Lượng bán theo tuần" của phần Đối thủ: lượng bán 8 tuần trong danh mục, cột ghép kết hợp đường.
 * Hai cột mỗi tuần là bạn và một shop đang so (chọn ở ô "Đặt cạnh bạn"); đường là shop bán chạy nhất danh mục, làm mốc.
 */

import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { count } from '../../../../shared/utils/format';
import type { CompetitorShop } from '../../types';

const SO_TUAN = 8;
const NGAY = 86_400_000;
/** Đường mốc tham chiếu: màu mực trung tính, để không lẫn với xanh lá (bạn) và xanh lam (đối thủ). */
const MAU_DAU = '#44403c';
const O_CHON =
  'h-9 max-w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 motion-reduce:transition-none';

/** Bước chia trục "đẹp" (1, 2, 2,5, 5 × 10^n) không nhỏ hơn `tho`, và các vạch chia đều theo bước đó. */
export const buocDep = (tho: number) => {
  const mu = 10 ** Math.floor(Math.log10(Math.max(tho, 1)));
  return [1, 2, 2.5, 5, 10].map(k => k * mu).find(b => b >= tho) ?? 10 * mu;
};
export const vachChia = (tu: number, den: number, buoc: number) =>
  Array.from({ length: Math.floor((den - tu) / buoc + 1e-9) + 1 }, (_, i) => tu + i * buoc);

interface Tuan {
  nhan: string;
  khoang: string;
  toi: number;
  doi: number | null;
  dau: number | null;
}

/** Số của cột: cột đủ cao thì ghi chữ trắng bên trong, cột thấp thì ghi phía trên; cột hẹp hoặc bằng 0 thì bỏ. */
function NhanCot(p: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: number | string }) {
  const x = Number(p.x);
  const y = Number(p.y);
  const w = Number(p.width);
  const h = Number(p.height);
  const v = Number(p.value);
  if (!v || w < 14) return null;
  const trong = h >= 20;
  return (
    <text x={x + w / 2} y={trong ? y + 14 : y - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill={trong ? '#ffffff' : '#44403c'}>
      {count(v)}
    </text>
  );
}

function TuanTooltip({ active, payload, tenDoi, tenDau }: {
  active?: boolean;
  payload?: { payload?: Tuan }[];
  tenDoi?: string;
  tenDau?: string;
}) {
  const t = payload?.[0]?.payload;
  if (!active || !t) return null;
  const dong = (mau: string, ten: string, v: number, duong = false) => (
    <div className="flex items-center gap-1.5 text-stone-600">
      <span className={duong ? 'h-0.5 w-3' : 'h-2.5 w-2.5 rounded-sm'} style={{ background: mau }} aria-hidden />
      {ten}: <strong className="tabular-nums text-stone-900">{count(v)}</strong>
    </div>
  );
  return (
    <div className="max-w-[260px] rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 text-xs shadow-[0_6px_20px_rgba(16,33,26,0.12)]">
      <div className="mb-0.5 font-bold text-stone-900">{t.khoang}</div>
      {dong(SERIES.green, 'Bạn', t.toi)}
      {t.doi !== null && dong(SERIES.blue, tenDoi ?? 'Đối thủ', t.doi)}
      {t.dau !== null && dong(MAU_DAU, tenDau ?? 'Bán chạy nhất', t.dau, true)}
    </div>
  );
}

export function WeeklySalesChart({ shops, ds, chon, onChon }: {
  /** Mọi shop trong danh mục, để tìm shop bán chạy nhất làm mốc. */
  shops: CompetitorShop[];
  /** Các shop đang so; chưa chọn thì đặt shop đầu tiên cạnh bạn. */
  ds: CompetitorShop[];
  chon: string | null;
  onChon: (shopId: string) => void;
}) {
  // shortcut: đọc cỡ màn một lần lúc vẽ như các biểu đồ khác của trang; xoay máy thì chờ lần vẽ sau.
  const hep = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  const me = shops.find(s => s.is_me);
  const khac = shops.filter(s => !s.is_me);
  // Mặc định đặt cạnh bạn shop giống bạn nhất trong các shop đang so.
  const doi = ds.find(s => s.shop_id === chon) ?? [...ds].sort((a, b) => (b.rivalry ?? 0) - (a.rivalry ?? 0))[0];
  // Mốc tham chiếu là shop bán nhiều nhất danh mục; nếu đó chính là shop đang đặt cạnh bạn thì lấy shop đứng thứ hai.
  const theoBan = [...khac].sort((a, b) => b.units_90d - a.units_90d);
  const dau = theoBan.find(s => s.shop_id !== doi?.shop_id);
  const hangDau = dau === theoBan[0] ? 'bán chạy nhất danh mục' : 'bán chạy thứ hai danh mục';

  // Lượng bán tuần thứ k tính tới lúc trang tải: tuần cuối là 7 ngày gần nhất.
  const nay = Date.now();
  const ngay = (ms: number) => {
    const d = new Date(ms);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };
  const data: Tuan[] = Array.from({ length: SO_TUAN }, (_, k) => {
    const tu = nay - (SO_TUAN - k) * 7 * NGAY;
    return {
      nhan: k === SO_TUAN - 1 ? 'Tuần này' : ngay(tu),
      khoang: `${k === SO_TUAN - 1 ? 'Tuần này' : 'Tuần'} ${ngay(tu)} – ${ngay(tu + 6 * NGAY)}`,
      toi: me?.weekly_units[k] ?? 0,
      doi: doi ? doi.weekly_units[k] ?? 0 : null,
      dau: dau ? dau.weekly_units[k] ?? 0 : null,
    };
  });
  const lonNhat = Math.max(4, ...data.flatMap(t => [t.toi, t.doi ?? 0, t.dau ?? 0]));
  const bY = Math.max(1, Math.ceil(buocDep(lonNhat / 4)));
  // Chừa khoảng trên cùng cho số ghi trên điểm của đường.
  const yMax = Math.ceil((lonNhat * 1.15) / bY) * bY;
  const chuoi = (s: CompetitorShop | undefined) => (s ? s.weekly_units.join(', ') : '');
  const dinhDau = Math.max(0, ...data.map(t => t.dau ?? 0));

  return (
    <div>
      {ds.length > 0 && (
        <label className="mb-3 flex max-w-full flex-wrap items-center gap-2 text-[13px] font-semibold text-stone-700">
          Đặt cạnh bạn
          <select value={doi?.shop_id ?? ''} onChange={e => onChon(e.target.value)} className={O_CHON}>
            {ds.map(s => (
              <option key={s.shop_id} value={s.shop_id}>{s.shop_name || 'Chưa có tên'}</option>
            ))}
          </select>
        </label>
      )}
      <div
        className="w-full"
        style={{ height: hep ? 260 : 320 }}
        role="img"
        aria-label={`Lượng bán mỗi tuần trong danh mục, 8 tuần gần nhất. Bạn: ${chuoi(me)}.${doi ? ` ${doi.shop_name}: ${chuoi(doi)}.` : ''}${dau ? ` ${dau.shop_name}, ${hangDau}: ${chuoi(dau)}.` : ''}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 22, right: 12, bottom: 0, left: 4 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
            <XAxis dataKey="nhan" interval={hep ? 'preserveEnd' : 0} tick={{ fill: CHART_INK.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#d6d3d1' }} />
            <YAxis
              domain={[0, yMax]} ticks={vachChia(0, yMax, bY)} width={44} allowDecimals={false}
              tick={{ fill: CHART_INK.axis, fontSize: 11 }} tickLine={false} axisLine={false}
              label={{ value: 'Lượng bán/tuần', angle: -90, position: 'insideLeft', offset: 10, fill: CHART_INK.axis, fontSize: 12 }}
            />
            <Tooltip content={<TuanTooltip tenDoi={doi?.shop_name ?? undefined} tenDau={dau?.shop_name ?? undefined} />} cursor={{ fill: 'rgba(120,113,108,0.08)' }} isAnimationActive={false} />
            <Bar dataKey="toi" fill={SERIES.green} radius={[3, 3, 0, 0]} maxBarSize={34} isAnimationActive={false}>
              <LabelList dataKey="toi" content={(p: unknown) => <NhanCot {...(p as Parameters<typeof NhanCot>[0])} />} />
            </Bar>
            {doi && (
              <Bar dataKey="doi" fill={SERIES.blue} radius={[3, 3, 0, 0]} maxBarSize={34} isAnimationActive={false}>
                <LabelList dataKey="doi" content={(p: unknown) => <NhanCot {...(p as Parameters<typeof NhanCot>[0])} />} />
              </Bar>
            )}
            {dau && (
              <Line
                dataKey="dau" type="linear" stroke={MAU_DAU} strokeWidth={2} isAnimationActive={false}
                dot={{ r: 4, fill: MAU_DAU, stroke: '#ffffff', strokeWidth: 2 }} activeDot={{ r: 5, fill: MAU_DAU, stroke: '#ffffff', strokeWidth: 2 }}
              >
                <LabelList
                  dataKey="dau"
                  content={(p: unknown) => {
                    const { x, y, value, index } = p as { x?: number | string; y?: number | string; value?: number | string; index?: number };
                    const v = Number(value);
                    // Màn hẹp chỉ ghi số ở đỉnh và tuần này, để các số không đè nhau; tuần khác xem bằng cách chạm.
                    if (!v || (hep && index !== SO_TUAN - 1 && v !== dinhDau)) return null;
                    return <text x={Number(x)} y={Number(y) - 9} textAnchor="middle" fontSize={11} fontWeight={700} fill={MAU_DAU}>{count(v)}</text>;
                  }}
                />
              </Line>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-stone-600">
        <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.green }} aria-hidden />Bạn</li>
        {doi && <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES.blue }} aria-hidden />{doi.shop_name || 'Đối thủ'}</li>}
        {dau && (
          <li className="inline-flex items-center gap-1.5">
            <span className="relative inline-block h-2.5 w-4" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" style={{ background: MAU_DAU }} />
              <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: MAU_DAU }} />
            </span>
            {dau.shop_name || 'Shop khác'} · {hangDau}
          </li>
        )}
      </ul>
    </div>
  );
}
