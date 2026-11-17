/**
 * Phân bố giá: mỗi sản phẩm cùng loại hàng là một chấm (giá × số bán 90 ngày), lọc theo chất liệu, mặc định cùng
 * chất liệu với bạn. Giá bán chạy là phân vị 25–75% có trọng số theo số bán, nên chứa ít nhất một nửa lượng bán.
 * Mặc định chỉ hiện giá bán chạy và giá của bạn; biểu đồ mở khi bấm, hoặc tự mở khi tới từ việc "Rà soát giá" của kế hoạch.
 */

import { useMemo, useState } from 'react';
import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { count, money } from '../../../../shared/utils/format';
import type { PricePoint } from '../../types';
import { InsightCard, Note, SelectField } from '../ui';
import { NutAnHien } from './controls';
import { GIAI_THICH } from './explanations';
import { buocDep, vachChia } from './WeeklySalesChart';

const KHONG_GHI = '__chua_ghi';
const TAT_CA = '__tat_ca';
const NHAT = '#d6d3d1';
const gonK = (v: number) => `${Math.round(v / 1000)}k`;
const khoangGia = (a: number, b: number) => (a === b ? money(a) : `${money(a)} – ${money(b)}`);

/** Khoá chất liệu của một sản phẩm: tên chuẩn, cách gõ chưa có trong từ điển (tiền tố ?), hoặc "chưa ghi". */
const khoaCl = (p: PricePoint) => (p.materials.length || p.materials_unknown.length ? [...p.materials, ...p.materials_unknown.map(m => `?${m}`)] : [KHONG_GHI]);
const tenCl = (k: string) => (k === KHONG_GHI ? 'chưa ghi chất liệu' : k.startsWith('?') ? `${k.slice(1)}, chưa có trong từ điển` : k);

/** Giá mà tại đó q phần lượng bán (không phải số sản phẩm) có giá thấp hơn hoặc bằng; dưới 3 mẫu có đơn thì không tính. */
function vungBanChay(ds: PricePoint[]) {
  const co = ds.filter(p => p.units_90d > 0).sort((a, b) => a.price_vnd - b.price_vnd);
  if (co.length < 3) return null;
  const tong = co.reduce((s, p) => s + p.units_90d, 0);
  const pv = (q: number) => {
    let cong = 0;
    for (const p of co) {
      cong += p.units_90d;
      if (cong / tong >= q) return p.price_vnd;
    }
    return co[co.length - 1].price_vnd;
  };
  return { p25: pv(0.25), p50: pv(0.5), p75: pv(0.75) };
}

interface Diem extends PricePoint { x: number; y: number; nhan: string | null }

function DiemDoiThu({ cx = 0, cy = 0, mau, r }: { cx?: number; cy?: number; mau: string; r: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={mau} stroke="#fff" strokeWidth={2} />;
}

function DiemCuaBan({ cx = 0, cy = 0, payload }: { cx?: number; cy?: number; payload?: Diem }) {
  if (!payload) return null;
  return (
    <g>
      <path d={`M${cx},${cy - 7} L${cx + 7},${cy} L${cx},${cy + 7} L${cx - 7},${cy} Z`} fill={SERIES.green} stroke="#fff" strokeWidth={2} />
      {payload.nhan && (
        <text x={cx - 11} y={cy + 4} textAnchor="end" fontSize={12} fontWeight={700} fill="#1c1917" stroke="#fff" strokeWidth={3} paintOrder="stroke">{payload.nhan}</text>
      )}
    </g>
  );
}

function GiaTooltip({ active, payload }: { active?: boolean; payload?: { payload?: Diem }[] }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="max-w-[240px] rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 text-xs shadow-[0_6px_20px_rgba(16,33,26,0.12)]">
      <div className="font-bold text-stone-900">{d.title}</div>
      <div className="text-stone-600">{d.is_mine ? 'Sản phẩm của bạn' : d.shop_name}</div>
      <div className="text-stone-600">Giá <strong className="text-stone-900">{money(d.price_vnd)}</strong> · lượng bán <strong className="text-stone-900">{count(d.units_90d)}</strong></div>
      <div className="text-stone-600">Chất liệu: {khoaCl(d).map(tenCl).join(', ')}</div>
    </div>
  );
}

export function PriceDistribution({ points, loaiBanDau, moSan = false }: {
  points: PricePoint[];
  /** Loại hàng chọn sẵn, lấy từ link của kế hoạch (?loai=). */
  loaiBanDau?: string;
  moSan?: boolean;
}) {
  // Loại hàng của bạn trước (nhiều sản phẩm trước), rồi tới loại bạn chưa bán.
  const loaiDs = useMemo(() => {
    const dem = new Map<string, { tat: number; toi: number }>();
    for (const p of points) {
      const d = dem.get(p.product_type_name) ?? { tat: 0, toi: 0 };
      d.tat += 1;
      if (p.is_mine) d.toi += 1;
      dem.set(p.product_type_name, d);
    }
    return [...dem.entries()].sort((a, b) => b[1].toi - a[1].toi || b[1].tat - a[1].tat).map(([ten, d]) => ({ ten, ...d }));
  }, [points]);
  const [loaiChon, setLoai] = useState<string>(loaiBanDau ?? '');
  const [clChon, setCl] = useState<string | null>(null);
  const [mo, setMo] = useState(moSan);
  const loai = loaiDs.some(l => l.ten === loaiChon) ? loaiChon : loaiDs[0]?.ten ?? '';

  const goc = points.filter(p => p.product_type_name === loai);
  const demCl = new Map<string, number>();
  const clToi = new Map<string, number>();
  goc.forEach(p => khoaCl(p).forEach(k => {
    if (!p.is_mine) demCl.set(k, (demCl.get(k) ?? 0) + 1);
    else if (k !== KHONG_GHI) clToi.set(k, (clToi.get(k) ?? 0) + 1);
  }));
  const clMacDinh = [...clToi.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? TAT_CA;
  const cl = clChon !== null && (clChon === TAT_CA || demCl.has(clChon)) ? clChon : clMacDinh;
  // Biến thể khác chất liệu có giá riêng: đang lọc chất liệu nào thì dùng giá của chất liệu đó.
  const cungLoai = goc.map(p => {
    const g = cl === TAT_CA ? undefined : p.price_by_material?.[cl];
    return g ? { ...p, price_vnd: g } : p;
  });
  const cuaToi = cungLoai.filter(p => p.is_mine);
  const doiThu = cungLoai.filter(p => !p.is_mine);
  const khop = (p: PricePoint) => cl === TAT_CA || khoaCl(p).includes(cl);
  const nhom = doiThu.filter(khop);
  const vung = vungBanChay(nhom);

  if (!loai) return <Note>Danh mục này chưa có sản phẩm nào để phân tích giá.</Note>;

  const gia = cungLoai.map(p => p.price_vnd);
  const bX = buocDep((Math.max(...gia) - Math.min(...gia)) / 5 || 50000);
  const xMin = Math.max(0, Math.floor((Math.min(...gia) * 0.97) / bX) * bX);
  const xMax = Math.ceil((Math.max(...gia) * 1.02) / bX) * bX;
  const yTop = Math.max(...cungLoai.map(p => p.units_90d), 4);
  const bY = buocDep(yTop / 4);
  const yMax = Math.ceil((yTop * 1.08) / bY) * bY;
  const lam = (p: PricePoint, nhan: string | null): Diem => ({ ...p, x: p.price_vnd, y: p.units_90d, nhan });
  const diemKhac = doiThu.filter(p => !khop(p)).map(p => lam(p, null));
  const diemKhop = nhom.map(p => lam(p, null));
  const diemToi = cuaToi.map((p, i) => lam(p, i === 0 ? 'Bạn' : null));

  const tenNhom = `${loai.toLowerCase()}${cl === TAT_CA ? '' : ` ${tenCl(cl)}`}`;
  const giaToi = cuaToi.map(p => p.price_vnd);
  const minToi = giaToi.length ? Math.min(...giaToi) : null;
  const maxToi = giaToi.length ? Math.max(...giaToi) : null;
  const soShop = new Set(nhom.map(p => p.shop_name)).size;

  const boLoc = (
    // Nằm ở đầu thẻ: max-w-full để ô chọn co theo bề ngang thẻ trên điện thoại thay vì tràn ra ngoài.
    <div className="flex min-w-0 max-w-full flex-wrap items-end gap-3">
      <SelectField
        label="Loại hàng"
        value={loai}
        onChange={v => { setLoai(v); setCl(null); }}
        options={loaiDs.map(l => ({ value: l.ten, label: l.toi ? l.ten : `${l.ten} (bạn chưa bán)` }))}
        className="min-w-0 max-w-full"
      />
      <SelectField
        label="Chất liệu"
        value={cl}
        onChange={setCl}
        options={[
          { value: TAT_CA, label: 'Mọi chất liệu' },
          ...[...demCl.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => ({ value: k, label: tenCl(k) })),
        ]}
        className="min-w-0 max-w-full"
      />
    </div>
  );

  return (
    <InsightCard title="Phân bố giá" info={`${GIAI_THICH.vungGia} Đang tính trên ${count(nhom.length)} sản phẩm của ${count(soShop)} shop.`} action={boLoc}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="m-0 text-xs font-semibold text-stone-500">Giá bán chạy</p>
            {vung ? (
              <p className="m-0 mt-0.5 text-2xl font-bold tabular-nums text-stone-900">{khoangGia(vung.p25, vung.p75)}</p>
            ) : (
              <p className="m-0 mt-0.5 text-[13px] text-stone-600">Chưa đủ dữ liệu: cần ít nhất 3 sản phẩm có đơn.</p>
            )}
          </div>
          {minToi !== null && maxToi !== null && (
            <p className="m-0 mb-1 inline-flex items-center gap-2 text-sm text-stone-900">
              <span className="h-2.5 w-2.5 rotate-45" style={{ background: SERIES.green }} aria-hidden />
              Bạn {khoangGia(minToi, maxToi)}
            </p>
          )}
          <div className="ml-auto">
            <NutAnHien mo={mo} onDoi={() => setMo(!mo)} xem="Xem biểu đồ" an="Ẩn biểu đồ" controls="bieu-do-phan-bo-gia" />
          </div>
        </div>

        {mo && (
          <div id="bieu-do-phan-bo-gia" className="min-w-0">
            <div className="h-[300px] w-full" role="img" aria-label={`Giá và lượng bán 90 ngày của từng sản phẩm ${tenNhom}${vung ? `; giá bán chạy ${khoangGia(vung.p25, vung.p75)}` : ''}${minToi !== null ? `; giá của bạn từ ${money(minToi)}` : ''}.`}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 12, right: 16, bottom: 22, left: 4 }}>
                  <CartesianGrid stroke={CHART_INK.grid} />
                  <XAxis type="number" dataKey="x" domain={[xMin, xMax]} ticks={vachChia(xMin, xMax, bX)} tickFormatter={gonK} tick={{ fill: CHART_INK.axis, fontSize: 11 }} tickLine={false}
                    label={{ value: 'Giá bán', position: 'insideBottom', offset: -14, fill: CHART_INK.axis, fontSize: 12 }} />
                  <YAxis type="number" dataKey="y" domain={[0, yMax]} ticks={vachChia(0, yMax, bY)} width={44} allowDecimals={false} tick={{ fill: CHART_INK.axis, fontSize: 11 }} tickLine={false}
                    label={{ value: 'Lượng bán 90 ngày', angle: -90, position: 'insideLeft', offset: 10, fill: CHART_INK.axis, fontSize: 12 }} />
                  {vung && (
                    <ReferenceArea
                      x1={vung.p25} x2={Math.max(vung.p75, vung.p25 + (xMax - xMin) * 0.006)}
                      fill={SERIES.blue} fillOpacity={0.1} stroke={SERIES.blue} strokeOpacity={0.4} ifOverflow="hidden"
                      label={{ value: 'Giá bán chạy', position: 'insideTop', fill: '#1e3a8a', fontSize: 12, fontWeight: 600 }}
                    />
                  )}
                  {vung && <ReferenceLine x={vung.p50} stroke={SERIES.blue} strokeWidth={2} strokeDasharray="5 4" />}
                  <Tooltip content={<GiaTooltip />} cursor={false} isAnimationActive={false} />
                  <Scatter data={diemKhac} isAnimationActive={false} shape={(p: unknown) => <DiemDoiThu {...(p as object)} mau={NHAT} r={4} />} />
                  <Scatter data={diemKhop} isAnimationActive={false} shape={(p: unknown) => <DiemDoiThu {...(p as object)} mau={SERIES.blue} r={6} />} />
                  <Scatter data={diemToi} isAnimationActive={false} shape={(p: unknown) => <DiemCuaBan {...(p as object)} />} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-stone-600">
              <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES.blue }} aria-hidden />Đối thủ · {cl === TAT_CA ? loai.toLowerCase() : tenCl(cl)}</li>
              {cl !== TAT_CA && <li className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: NHAT }} aria-hidden />Chất liệu khác</li>}
              <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45" style={{ background: SERIES.green }} aria-hidden />Bạn</li>
              {vung && <li className="inline-flex items-center gap-1.5"><span className="h-3 w-0 border-l-2 border-dashed" style={{ borderColor: SERIES.blue }} aria-hidden />Trung vị {money(vung.p50)}</li>}
            </ul>
          </div>
        )}
      </div>
    </InsightCard>
  );
}
