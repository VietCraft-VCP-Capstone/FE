/**
 * Phần Đối thủ: bạn và tối đa 4 shop đang so. Mặc định là shop bạn theo dõi trước, rồi shop giống bạn nhất;
 * "Đổi shop" mở hộp chọn có tìm kiếm, nên danh mục nhiều shop vẫn gọn một dòng. Ba kiểu xem dùng chung tập shop đó,
 * trừ Radar giữ đúng SRS 3.9.2 (5 shop doanh thu cao nhất). Ô tô cam khi đối thủ hơn bạn, xanh khi bạn hơn,
 * chỉ khi chênh lệch rõ; giá không tô màu vì rẻ hơn chưa chắc là lợi thế.
 */

import { Children, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, ChevronDown, Star } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { count, money } from '../../../../shared/utils/format';
import { decimal } from '../../format';
import type { InsightState } from '../../hooks/useInsight';
import { MSG } from '../../services/analyticsApi';
import type { CompetitorShop, ShopComparison } from '../../types';
import { InsightCard, Note, SelectField } from '../ui';
import { RadarSRS } from './BenchmarkSection';
import { CongTac } from './dieuKhien';
import { ViTheCanhTranh } from './ViTheCanhTranh';

export type KieuXem = 'bang' | 'tuan' | 'radar';
type Tong = 'ho' | 'ban' | null;

export const SO_COT = 4;
const NEN: Record<'ho' | 'ban', string> = { ho: 'bg-[#fff4e5]', ban: 'bg-[#eef6ee]' };
const XU_HUONG: Record<string, string> = {
  surge: 'Đột biến',
  up: 'Thị phần tăng',
  down: 'Thị phần giảm',
  stable: 'Ổn định',
};
const NUT_THEO_DOI =
  'inline-flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border border-[#007700] bg-white px-2 py-0.5 text-xs font-semibold text-[#005B00] transition-colors duration-150 hover:bg-[#EAF0E2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none';
const NUT_PHU =
  'h-9 cursor-pointer rounded-md border border-stone-300 bg-white px-3.5 text-[13px] font-semibold text-stone-900 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none';

/** Đối thủ trong danh mục, thứ tự cột của bảng: shop bạn theo dõi trước, rồi shop giống bạn nhất. */
export function xepDoiThu(shops: CompetitorShop[], trackedIds: Set<string>) {
  return shops
    .filter(s => !s.is_me)
    .sort((a, b) => Number(trackedIds.has(b.shop_id)) - Number(trackedIds.has(a.shop_id))
      || (b.rivalry ?? 0) - (a.rivalry ?? 0) || b.units_90d - a.units_90d);
}

/** Họ hơn / bạn hơn ở từng tiêu chí; ngưỡng chênh lệch rõ ghi ở ⓘ của phần. */
function soVoiBan(s: CompetitorShop, me: CompetitorShop) {
  const a = s.response_minutes;
  const b = me.response_minutes;
  const banHon = s.units_90d >= 1.5 * me.units_90d && s.units_90d - me.units_90d >= 5;
  const banKem = me.units_90d >= 1.5 * s.units_90d && me.units_90d - s.units_90d >= 5;
  const tlHon = a !== null && b !== null && b >= 1.3 * a && b - a >= 5;
  const tlKem = a !== null && b !== null && a >= 1.3 * b && a - b >= 5;
  return {
    ban: (banHon ? 'ho' : banKem ? 'ban' : null) as Tong,
    tl: (tlHon ? 'ho' : tlKem ? 'ban' : null) as Tong,
    moi: (s.new_8w - me.new_8w >= 2 ? 'ho' : null) as Tong,
    xh: (s.trend.kind === 'surge' || s.trend.kind === 'up' ? 'ho' : null) as Tong,
  };
}

const thoiGian = (phut: number) =>
  phut < 1 ? 'dưới 1 phút' : phut < 60 ? `${count(phut)} phút` : phut < 2880 ? `${decimal(phut / 60, 1)} giờ` : `${decimal(phut / 1440, 1)} ngày`;

/** Tìm tên shop không phân biệt dấu: "ao thun" khớp "Áo Thun Sài Gòn". */
const boDau = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

function IconTong({ tong }: { tong: Tong }) {
  if (tong === 'ho') return <ArrowUpRight size={14} className="shrink-0 text-amber-700" role="img" aria-label="Đối thủ hơn bạn" />;
  if (tong === 'ban') return <Check size={14} className="shrink-0 text-[#1a6b1a]" role="img" aria-label="Bạn hơn" />;
  return null;
}

/** Một tiêu chí; lời giải thích nằm ở chú thích khi rê chuột vào tên, không chiếm thêm dòng. */
function Dong({ ten, phu, goiY, children }: { ten: string; phu?: string; goiY?: string; children: React.ReactNode }) {
  return (
    <>
      {/* Màn hẹp không đủ chỗ cho cột tiêu chí: tên tiêu chí thành một dòng riêng nằm trên các ô giá trị. */}
      <tr className="sm:hidden">
        <th colSpan={Children.count(children)} className="px-2 pb-0 pt-3 text-left text-[13px] font-semibold text-stone-900">
          {ten}{phu && <span className="font-normal text-stone-500"> · {phu}</span>}
        </th>
      </tr>
      <tr>
        <th scope="row" className="sticky left-0 z-[1] hidden w-44 min-w-[11rem] border-b border-stone-100 bg-white py-3 pl-0 pr-3 text-left align-top font-normal sm:table-cell">
          <span title={goiY} className={`block text-[13px] font-semibold text-stone-900 ${goiY ? 'cursor-help' : ''}`}>{ten}</span>
          {phu && <span className="block text-xs text-stone-500">{phu}</span>}
        </th>
        {children}
      </tr>
    </>
  );
}

function O({ tong, children }: { tong?: Tong; children: React.ReactNode }) {
  return (
    <td className={`border-b border-stone-100 px-2 py-2 align-top sm:min-w-[9.5rem] sm:px-3 sm:py-3 ${tong ? NEN[tong] : ''}`}>
      {children}
    </td>
  );
}

export function Sparkline({ tuan, max, mau }: { tuan: number[]; max: number; mau: string }) {
  const d = tuan.map((v, i) => [2 + (i * 74) / Math.max(tuan.length - 1, 1), 23 - (v / Math.max(max, 1)) * 20]);
  const cuoi = d[d.length - 1] ?? [0, 23];
  return (
    <svg viewBox="0 0 78 26" width={78} height={26} aria-hidden className="block overflow-visible">
      <polyline points={d.map(p => p.join(',')).join(' ')} fill="none" stroke={mau} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={cuoi[0]} cy={cuoi[1]} r={3.5} fill={mau} stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}

/** "Đổi shop": hộp chọn có tìm kiếm, tối đa 4 shop; chỉ áp dụng khi bấm Áp dụng. */
function DoiShop({ xep, ds, trackedIds, tenDm, onApDung }: {
  xep: CompetitorShop[];
  ds: CompetitorShop[];
  trackedIds: Set<string>;
  tenDm: string;
  onApDung: (ids: string[] | null) => void;
}) {
  const [mo, setMo] = useState(false);
  const [nhap, setNhap] = useState<string[]>([]);
  const [tim, setTim] = useState('');
  const goc = useRef<HTMLDivElement>(null);
  const nut = useRef<HTMLButtonElement>(null);
  const oTim = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (!mo) return;
    oTim.current?.focus({ preventScroll: true });
    const ngoai = (e: MouseEvent) => {
      if (!goc.current?.contains(e.target as Node)) setMo(false);
    };
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMo(false);
      nut.current?.focus();
    };
    document.addEventListener('mousedown', ngoai);
    document.addEventListener('keydown', phim);
    return () => {
      document.removeEventListener('mousedown', ngoai);
      document.removeEventListener('keydown', phim);
    };
  }, [mo]);

  const macDinh = xep.slice(0, SO_COT).map(s => s.shop_id);
  const khop = (s: CompetitorShop) => boDau(s.shop_name ?? '').includes(boDau(tim.trim()));
  const nhom = [
    { ten: 'Bạn đang theo dõi', ds: xep.filter(s => trackedIds.has(s.shop_id) && khop(s)) },
    { ten: `Giống bạn nhất trong danh mục ${tenDm}`, ds: xep.filter(s => !trackedIds.has(s.shop_id) && khop(s)) },
  ].filter(g => g.ds.length > 0);
  const du = nhap.length >= SO_COT;
  const bat = (sid: string) => setNhap(n => (n.includes(sid) ? n.filter(x => x !== sid) : n.length >= SO_COT ? n : [...n, sid]));
  const apDung = () => {
    const laMacDinh = nhap.length === macDinh.length && macDinh.every(x => nhap.includes(x));
    onApDung(laMacDinh ? null : nhap);
    setMo(false);
    nut.current?.focus();
  };

  return (
    <div ref={goc} className="contents">
      <button
        ref={nut}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={mo}
        onClick={() => {
          if (mo) return setMo(false);
          setNhap(ds.map(s => s.shop_id));
          setTim('');
          setMo(true);
        }}
        className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none ${
          mo ? 'border-[#007700] bg-[#EAF0E2] text-[#005B00]' : 'border-stone-300 bg-white text-stone-900 hover:border-[#007700] hover:text-[#007700]'
        }`}
      >
        Đổi shop
        <ChevronDown size={14} className={`transition-transform duration-150 motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {mo && (
        <div
          role="dialog"
          aria-labelledby={`${id}-tieu-de`}
          className="absolute inset-x-0 top-full z-30 mt-2 flex flex-col rounded-xl border border-stone-300 bg-white shadow-[0_12px_32px_rgba(16,33,26,0.16)] lg:right-auto lg:w-[35rem]"
        >
          <div className="flex items-baseline justify-between gap-3 px-4 pb-2 pt-4">
            <h3 id={`${id}-tieu-de`} className="m-0 text-base font-bold text-stone-900">Chọn shop để so</h3>
            <span className="text-xs text-stone-600">Tối đa {SO_COT} shop</span>
          </div>
          <label className="flex flex-col gap-1 px-4 pb-3 text-xs font-semibold text-stone-600">
            Tìm shop
            <input
              ref={oTim}
              type="search"
              value={tim}
              onChange={e => setTim(e.target.value)}
              placeholder="Gõ tên shop"
              className="h-9 rounded-md border border-stone-300 px-3 text-sm font-normal text-stone-900 outline-none focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20"
            />
          </label>
          <div className="max-h-72 overflow-y-auto border-t border-stone-100">
            {nhom.length === 0 && <p className="m-0 px-4 py-3 text-[13px] text-stone-500">Không có shop nào khớp “{tim.trim()}”.</p>}
            {nhom.map((g, i) => (
              <div key={g.ten} role="group" aria-labelledby={`${id}-nhom-${i}`} className={i ? 'border-t border-stone-100' : ''}>
                <p id={`${id}-nhom-${i}`} className="m-0 px-4 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-stone-500">{g.ten}</p>
                {g.ds.map(s => {
                  const co = nhap.includes(s.shop_id);
                  const tat = !co && du;
                  return (
                    <label key={s.shop_id} className={`flex items-center gap-3 px-4 py-2 text-sm ${tat ? 'cursor-not-allowed text-stone-400' : 'cursor-pointer text-stone-900 hover:bg-stone-50'}`}>
                      <input type="checkbox" checked={co} disabled={tat} onChange={() => bat(s.shop_id)} className="h-4 w-4 shrink-0 accent-[#007700]" />
                      {/* Màn hẹp: số liệu xuống dòng dưới tên, để tên shop không bị cắt. */}
                      <span className="min-w-0 flex-1 lg:flex lg:items-baseline lg:justify-between lg:gap-3">
                        <span className="block truncate font-semibold">{s.shop_name || 'Shop chưa đặt tên'}</span>
                        <span className={`block shrink-0 text-xs ${tat ? '' : 'text-stone-500'}`}>giống {s.rivalry ?? 0}/100 · đã bán {count(s.units_90d)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
          {du && <p className="m-0 border-t border-stone-100 px-4 py-2.5 text-xs text-stone-600">Đã chọn đủ {SO_COT}. Bỏ chọn một shop để chọn shop khác.</p>}
          <div className="flex justify-end gap-2 border-t border-stone-100 px-4 py-3">
            <button type="button" onClick={() => setNhap(macDinh)} className={NUT_PHU}>Về mặc định</button>
            <button
              type="button"
              onClick={apDung}
              disabled={nhap.length === 0}
              className="h-9 cursor-pointer rounded-md border-none bg-[#007700] px-4 text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Bảng: cột là bạn và các shop đang so, dòng là tiêu chí. Màn hẹp chỉ "Bạn" và một đối thủ chọn ở ô "So với". */
function BangSoSanh({ me, ds, chon, onChon, canTrack, trackedIds, pendingShop, khoa, full, onTrack }: {
  me: CompetitorShop;
  ds: CompetitorShop[];
  chon: string | null;
  onChon: (id: string) => void;
  canTrack: boolean;
  trackedIds: Set<string>;
  pendingShop: string | null;
  khoa: boolean;
  full: boolean;
  onTrack: (shopId: string, shopName: string) => void;
}) {
  // shortcut: đọc cỡ màn một lần lúc vẽ như RadarCompare; xoay máy thì chờ lần vẽ sau.
  const hep = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  const motDoiThu = ds.find(s => s.shop_id === chon) ?? ds[0];
  const cot = hep ? [me, motDoiThu] : [me, ...ds];
  const sv = new Map(ds.map(s => [s.shop_id, soVoiBan(s, me)]));
  const chenhGia = (s: CompetitorShop) => {
    const c = Math.round(((s.price_vnd.median - me.price_vnd.median) / me.price_vnd.median) * 100);
    return c === 0 ? '0%' : `${c > 0 ? '+' : '−'}${Math.abs(c)}%`;
  };
  // Chú thích màu chỉ ghi loại ô đang có trên bảng.
  const dangTo = new Set(cot.flatMap(s => {
    const v = sv.get(s.shop_id);
    return v ? [v.ban, v.xh, v.tl, v.moi] : [];
  }));
  const so = (v: React.ReactNode) => <strong className="text-base font-bold tabular-nums text-stone-900">{v}</strong>;

  return (
    <div className="space-y-3">
      {(dangTo.has('ho') || dangTo.has('ban')) && (
        <ul aria-label="Chú thích màu ô" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-stone-600">
          {dangTo.has('ho') && <li className="inline-flex items-center gap-1.5"><span className={`h-3.5 w-3.5 rounded ${NEN.ho} ring-1 ring-amber-200`} aria-hidden />Đối thủ hơn bạn</li>}
          {dangTo.has('ban') && <li className="inline-flex items-center gap-1.5"><span className={`h-3.5 w-3.5 rounded ${NEN.ban} ring-1 ring-green-200`} aria-hidden />Bạn hơn</li>}
        </ul>
      )}
      {hep && (
        <SelectField label="So với" value={motDoiThu.shop_id} onChange={onChon} options={ds.map(s => ({ value: s.shop_id, label: s.shop_name ?? 'Shop chưa đặt tên' }))} className="min-w-0 max-w-full" />
      )}
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full border-separate border-spacing-0 text-[13px] sm:min-w-[54rem]">
          <caption className="sr-only">So sánh shop của bạn với {count(ds.length)} đối thủ theo từng tiêu chí</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-[1] hidden border-b border-stone-200 bg-white py-2.5 pl-0 pr-3 text-left align-top text-xs font-semibold text-stone-500 sm:table-cell">Tiêu chí</th>
              {cot.map(s => (
                <th key={s.shop_id} scope="col" className={`border-b border-stone-200 px-2 py-2.5 text-left align-top sm:px-3 ${s.is_me ? 'bg-[#f6faf6]' : 'bg-white'}`}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.is_me ? SERIES.green : SERIES.blue }} aria-hidden />
                    {s.is_me ? (
                      <span className="font-bold text-stone-900">Bạn</span>
                    ) : (
                      <Link to={`/seller/competitors/${s.shop_id}`} className="font-bold text-stone-900 no-underline hover:text-[#007700] sm:truncate" title={s.shop_name ?? ''}>{s.shop_name}</Link>
                    )}
                  </span>
                  {/* Vì sao shop này có trong bảng: bạn đang theo dõi, hoặc giống bạn tới đâu. */}
                  {!s.is_me && (
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal">
                      {trackedIds.has(s.shop_id) ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#005B00]"><Check size={12} aria-hidden />Đang theo dõi</span>
                      ) : (
                        <>
                          <span className="text-stone-600">Giống bạn {s.rivalry ?? 0}/100</span>
                          {canTrack && (
                            <button type="button" onClick={() => onTrack(s.shop_id, s.shop_name ?? '')} disabled={khoa || full} title={full ? MSG[143] : undefined} aria-label={`Theo dõi ${s.shop_name ?? ''}`} className={NUT_THEO_DOI}>
                              {pendingShop === s.shop_id ? 'Đang thêm' : '+ Theo dõi'}
                            </button>
                          )}
                        </>
                      )}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Dong ten="Lượng bán 90 ngày · thị phần" goiY="Số sản phẩm đã giao thành công trong 90 ngày, và phần trăm của cả danh mục.">
              {cot.map(s => (
                <O key={s.shop_id} tong={sv.get(s.shop_id)?.ban}>
                  <span className="flex flex-wrap items-baseline gap-x-1.5">
                    {so(count(s.units_90d))}
                    <span className="text-stone-500">· {decimal(s.share_pct, 1)}%</span>
                    <IconTong tong={sv.get(s.shop_id)?.ban ?? null} />
                  </span>
                </O>
              ))}
            </Dong>
            <Dong ten="Xu hướng 8 tuần" goiY="Thị phần 4 tuần gần nhất so với 4 tuần trước. Đột biến: lượng bán tuần này vượt ngưỡng bất thường.">
              {cot.map(s => (
                <O key={s.shop_id} tong={sv.get(s.shop_id)?.xh}>
                  <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                    {s.trend.kind ? XU_HUONG[s.trend.kind] : 'Chưa đủ dữ liệu'}
                    <IconTong tong={sv.get(s.shop_id)?.xh ?? null} />
                  </span>
                </O>
              ))}
            </Dong>
            <Dong ten="Giá trung vị" goiY="Giá trung vị các sản phẩm của shop trong danh mục; phần trăm so với giá trung vị của bạn.">
              {cot.map(s => (
                <O key={s.shop_id}>
                  <span className="flex flex-wrap items-baseline gap-x-1.5">
                    {so(money(s.price_vnd.median))}
                    {!s.is_me && <span className="text-stone-500">· {chenhGia(s)}</span>}
                  </span>
                </O>
              ))}
            </Dong>
            <Dong ten="Điểm đánh giá" goiY="Đã hiệu chỉnh theo số lượt đánh giá. Khi mỗi shop còn ít lượt, chênh 0,1 điểm chưa có ý nghĩa thống kê.">
              {cot.map(s => (
                <O key={s.shop_id}>
                  <span className="flex flex-wrap items-center gap-x-1.5">
                    {s.rating === null ? so('Chưa có') : (
                      <span className="inline-flex items-center gap-1">{so(decimal(s.rating, 1))}<Star size={13} className="fill-amber-500 text-amber-500" aria-hidden /></span>
                    )}
                    <span className="text-stone-500">· {count(s.n_reviews)} lượt</span>
                  </span>
                </O>
              ))}
            </Dong>
            <Dong ten="Trả lời khách" phu="từ tin nhắn chat · 90 ngày" goiY="Trung vị thời gian từ lúc khách hỏi tới tin trả lời đầu tiên của chủ shop, và tỉ lệ lượt hỏi được trả lời. Cần ít nhất 5 lượt hỏi.">
              {cot.map(s => (
                <O key={s.shop_id} tong={sv.get(s.shop_id)?.tl}>
                  {s.reply_rate === null ? (
                    <span className="text-stone-500">Chưa đủ dữ liệu</span>
                  ) : (
                    <span className="flex flex-wrap items-baseline gap-x-1.5">
                      {so(s.response_minutes === null ? 'Chưa trả lời' : thoiGian(s.response_minutes))}
                      <span className="text-stone-500">· trả lời {s.reply_rate}%</span>
                      <IconTong tong={sv.get(s.shop_id)?.tl ?? null} />
                    </span>
                  )}
                </O>
              ))}
            </Dong>
            <Dong ten="Sản phẩm mới 8 tuần">
              {cot.map(s => (
                <O key={s.shop_id} tong={sv.get(s.shop_id)?.moi}>
                  <span className="flex items-center gap-1.5">
                    {so(count(s.new_8w))}
                    <IconTong tong={sv.get(s.shop_id)?.moi ?? null} />
                  </span>
                </O>
              ))}
            </Dong>
            <Dong ten="Cơ cấu sản phẩm" goiY="Sản phẩm của shop trong danh mục này, theo loại hàng và chất liệu.">
              {cot.map(s => (
                <O key={s.shop_id}>
                  <span className="block">{so(`${count(s.n_listings)} sản phẩm`)}</span>
                  <span className="block text-xs text-stone-500">
                    {s.types.map(t => `${t.count} ${t.name.toLowerCase()}`).join(', ')}
                    {s.materials.length > 0 && ` · ${s.materials.join(', ')}`}
                  </span>
                </O>
              ))}
            </Dong>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Thanh công cụ (tập shop đang so + kiểu xem) và nội dung theo kiểu xem. Tập shop do trang giữ, vì dòng Phạm vi cũng đọc nó. */
export function PhanDoiThu({
  shops, xep, ds, laMacDinh, onDoiTap, xem, onXem, chon, onChon, tenDm, comparison, canTrack, trackedIds, pendingShop, khoa, full, onTrack,
}: {
  shops: CompetitorShop[];
  /** Mọi đối thủ trong danh mục, đã xếp theo xepDoiThu. */
  xep: CompetitorShop[];
  ds: CompetitorShop[];
  laMacDinh: boolean;
  onDoiTap: (ids: string[] | null) => void;
  xem: KieuXem;
  onXem: (v: KieuXem) => void;
  chon: string | null;
  onChon: (id: string) => void;
  tenDm: string;
  comparison: { state: InsightState<ShopComparison>; reload: () => void };
  canTrack: boolean;
  trackedIds: Set<string>;
  pendingShop: string | null;
  khoa: boolean;
  full: boolean;
  onTrack: (shopId: string, shopName: string) => void;
}) {
  const me = shops.find(s => s.is_me);
  const nTheoDoi = ds.filter(s => trackedIds.has(s.shop_id)).length;
  const lyDo = laMacDinh
    ? [nTheoDoi > 0 && `${count(nTheoDoi)} bạn theo dõi`, ds.length > nTheoDoi && `${count(ds.length - nTheoDoi)} giống bạn nhất`].filter(Boolean).join(', ')
    : 'bạn tự chọn';

  return (
    <InsightCard bodyClassName="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
        {xem !== 'radar' && xep.length > 0 ? (
          // Màn hẹp (có thanh bên 68px) hộp Đổi shop giãn theo nhóm này, nên nhóm chiếm cả dòng.
          <div className="relative flex w-full flex-wrap items-center gap-x-2.5 gap-y-2 lg:w-auto">
            <span className="text-sm text-stone-900">
              <strong className="font-bold">Đang so với {count(ds.length)} shop</strong>
              {lyDo && <span className="text-stone-600"> · {lyDo}</span>}
            </span>
            <DoiShop xep={xep} ds={ds} trackedIds={trackedIds} tenDm={tenDm} onApDung={onDoiTap} />
          </div>
        ) : <span />}
        <CongTac<KieuXem>
          nhan="Kiểu xem"
          giaTri={xem}
          onDoi={onXem}
          luaChon={[
            { value: 'bang', label: 'Bảng' },
            // Màn 390px không đủ chỗ cho ba nhãn đầy đủ.
            { value: 'tuan', label: <><span className="sm:hidden">Theo tuần</span><span className="hidden sm:inline">Lượng bán theo tuần</span></> },
            { value: 'radar', label: 'Radar (SRS)' },
          ]}
        />
      </div>
      <div className="p-4">
        {xem === 'radar' ? (
          <RadarSRS state={comparison.state} reload={comparison.reload} />
        ) : !me ? (
          <Note>{MSG[137]} Chọn danh mục có sản phẩm của bạn để so sánh.</Note>
        ) : ds.length === 0 ? (
          <Note>Danh mục này chưa có shop nào khác để so sánh.</Note>
        ) : xem === 'tuan' ? (
          <ViTheCanhTranh shops={shops} ds={ds} chon={chon} onChon={onChon} />
        ) : (
          <BangSoSanh me={me} ds={ds} chon={chon} onChon={onChon} canTrack={canTrack} trackedIds={trackedIds} pendingShop={pendingShop} khoa={khoa} full={full} onTrack={onTrack} />
        )}
      </div>
    </InsightCard>
  );
}
