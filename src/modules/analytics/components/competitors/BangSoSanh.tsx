/**
 * So sánh với đối thủ cạnh tranh (thay hai phần cũ "Đối thủ trực tiếp" và "Điểm mạnh & điểm yếu"):
 * cột là bạn và 4 đối thủ, dòng là tiêu chí. Ô tô cam khi đối thủ vượt trội, xanh khi bạn vượt trội, chỉ khi chênh lệch rõ;
 * giá không tô màu vì rẻ hơn chưa chắc là lợi thế. Kiểu xem Radar giữ đúng SRS 3.9.2.
 */

import { Children, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Star, UserPlus } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { count, money } from '../../../../shared/utils/format';
import { decimal } from '../../format';
import type { InsightState } from '../../hooks/useInsight';
import { MSG } from '../../services/analyticsApi';
import type { CompetitorShop, ShopComparison } from '../../types';
import { Chip, InsightCard, Note, SelectField } from '../ui';
import { RadarSRS } from './BenchmarkSection';
import { CongTac, NutAnHien } from './dieuKhien';
import { GIAI_THICH } from './giaiThich';

export type CheDo = 'truc-tiep' | 'dan-dau';
type Tong = 'ho' | 'ban' | null;

const SO_COT = 4;
const NEN: Record<'ho' | 'ban', string> = { ho: 'bg-[#fff4e5]', ban: 'bg-[#eef6ee]' };
const XU_HUONG: Record<string, string> = {
  surge: 'Tăng đột biến tuần này',
  up: 'Thị phần tăng',
  down: 'Thị phần giảm',
  stable: 'Ổn định',
};
const NUT_THEO_DOI =
  'inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-[#007700] bg-white px-3 py-1 text-xs font-semibold text-[#005B00] transition-colors duration-150 hover:bg-[#EAF0E2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none';

const lan = (r: number) => (r >= 10 ? String(Math.round(r)) : decimal(r, 1).replace(/,0$/, ''));

/** 4 đối thủ cho bảng: trực tiếp = cùng loại hàng, giá gần bạn nhất; dẫn đầu = bán nhiều nhất. Shop vừa chọn trên bản đồ thay cột cuối. */
export function chonCot(shops: CompetitorShop[], cheDo: CheDo, chon: string | null) {
  const khac = shops.filter(s => !s.is_me);
  const xep = cheDo === 'truc-tiep'
    ? [...khac].sort((a, b) => (b.rivalry ?? 0) - (a.rivalry ?? 0) || b.units_90d - a.units_90d)
    : [...khac].sort((a, b) => b.units_90d - a.units_90d || (b.rivalry ?? 0) - (a.rivalry ?? 0));
  let ds = xep.slice(0, SO_COT);
  const s = khac.find(x => x.shop_id === chon);
  if (s && !ds.includes(s)) ds = [...ds.slice(0, SO_COT - 1), s];
  return ds;
}

/** Họ hơn / bạn hơn ở từng tiêu chí; ngưỡng chênh lệch rõ ghi ở chú thích cuối bảng. */
function soVoiBan(s: CompetitorShop, me: CompetitorShop) {
  const banHon = s.units_90d >= 1.5 * me.units_90d && s.units_90d - me.units_90d >= 5;
  const banKem = me.units_90d >= 1.5 * s.units_90d && me.units_90d - s.units_90d >= 5;
  const a = s.response_minutes;
  const b = me.response_minutes;
  const tlHon = a !== null && b !== null && b >= 1.3 * a && b - a >= 5;
  const tlKem = a !== null && b !== null && a >= 1.3 * b && a - b >= 5;
  const moiHon = s.new_30d - me.new_30d >= 2;
  const xhHon = s.trend.kind === 'surge' || s.trend.kind === 'up';
  const hon: string[] = [];
  if (banHon) hon.push(`Lượng bán gấp ${lan(s.units_90d / Math.max(me.units_90d, 1))} lần`);
  if (s.trend.kind === 'surge') hon.push('Tăng đột biến tuần này');
  if (s.trend.kind === 'up') hon.push('Thị phần đang tăng');
  if (moiHon) hon.push(`${count(s.new_30d)} sản phẩm mới trong 30 ngày`);
  if (tlHon) hon.push(`Phản hồi nhanh hơn ${b! - a!} phút`);
  const ban: string[] = [];
  if (tlKem) ban.push(`Phản hồi nhanh hơn ${a! - b!} phút`);
  if (banKem) ban.push(`Lượng bán gấp ${lan(me.units_90d / Math.max(s.units_90d, 1))} lần`);
  return {
    ban: (banHon ? 'ho' : banKem ? 'ban' : null) as Tong,
    tl: (tlHon ? 'ho' : tlKem ? 'ban' : null) as Tong,
    moi: (moiHon ? 'ho' : null) as Tong,
    xh: (xhHon ? 'ho' : null) as Tong,
    hon: hon.slice(0, 3),
    banHon: ban.slice(0, 3),
  };
}

function IconTong({ tong }: { tong: Tong }) {
  if (tong === 'ho') return <ArrowUpRight size={14} className="shrink-0 text-amber-700" role="img" aria-label="Đối thủ vượt trội" />;
  if (tong === 'ban') return <Check size={14} className="shrink-0 text-[#1a6b1a]" role="img" aria-label="Bạn vượt trội" />;
  return null;
}

function Dong({ ten, phu, children }: { ten: string; phu?: string; children: React.ReactNode }) {
  return (
    <>
      {/* Màn hẹp không đủ chỗ cho cột tiêu chí: tên tiêu chí thành một dòng riêng nằm trên các ô giá trị. */}
      <tr className="sm:hidden">
        <th colSpan={Children.count(children)} className="px-2 pb-0 pt-3 text-left text-[13px] font-semibold text-stone-900">{ten}</th>
      </tr>
      <tr>
        <th scope="row" className="sticky left-0 z-[1] hidden w-44 min-w-[11rem] border-b border-stone-100 bg-white py-3 pl-0 pr-3 text-left align-top font-normal sm:table-cell">
          <span className="block text-[13px] font-semibold text-stone-900">{ten}</span>
          {phu && <span className="block text-xs text-stone-500">{phu}</span>}
        </th>
        {children}
      </tr>
    </>
  );
}

function O({ tong, chon, children }: { tong?: Tong; chon?: boolean; children: React.ReactNode }) {
  return (
    <td className={`border-b border-stone-100 px-2 py-2 align-top sm:min-w-[9.5rem] sm:px-3 sm:py-3 ${tong ? NEN[tong] : chon ? 'bg-sky-50/60' : ''}`}>
      {children}
    </td>
  );
}

function Sparkline({ tuan, max, mau }: { tuan: number[]; max: number; mau: string }) {
  const d = tuan.map((v, i) => [2 + (i * 74) / Math.max(tuan.length - 1, 1), 23 - (v / Math.max(max, 1)) * 20]);
  const cuoi = d[d.length - 1] ?? [0, 23];
  return (
    <svg viewBox="0 0 78 26" width={78} height={26} aria-hidden className="block overflow-visible">
      <polyline points={d.map(p => p.join(',')).join(' ')} fill="none" stroke={mau} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={cuoi[0]} cy={cuoi[1]} r={3.5} fill={mau} stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}

export function BangSoSanh({
  shops, cheDo, onCheDo, chon, onChon, comparison, canTrack, trackedIds, pendingShop, khoa, full, onTrack, footer,
}: {
  shops: CompetitorShop[];
  cheDo: CheDo;
  onCheDo: (v: CheDo) => void;
  chon: string | null;
  onChon: (id: string | null) => void;
  comparison: { state: InsightState<ShopComparison>; reload: () => void };
  canTrack: boolean;
  trackedIds: Set<string>;
  pendingShop: string | null;
  khoa: boolean;
  full: boolean;
  onTrack: (shopId: string, shopName: string) => void;
  footer?: React.ReactNode;
}) {
  const [xem, setXem] = useState<'bang' | 'radar'>('bang');
  const [du, setDu] = useState(false);
  const me = shops.find(s => s.is_me);
  const ds = chonCot(shops, cheDo, chon);
  // shortcut: đọc cỡ màn một lần lúc vẽ như RadarCompare. Màn hẹp: chỉ "Bạn" và một đối thủ (ô "So với" hoặc chấm vừa bấm trên bản đồ).
  const hep = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  const motDoiThu = ds.find(s => s.shop_id === chon) ?? ds[0];

  const dieuKhien = (
    <div className="flex flex-wrap items-center gap-2">
      {xem === 'bang' && (
        <CongTac<CheDo>
          nhan="Chọn đối thủ để so"
          giaTri={cheDo}
          onDoi={v => { onCheDo(v); onChon(null); }}
          luaChon={[{ value: 'truc-tiep', label: 'Đối thủ trực tiếp' }, { value: 'dan-dau', label: 'Dẫn đầu doanh số' }]}
        />
      )}
      <CongTac<'bang' | 'radar'> nhan="Kiểu xem" giaTri={xem} onDoi={setXem} luaChon={[{ value: 'bang', label: 'Bảng' }, { value: 'radar', label: 'Radar' }]} />
    </div>
  );

  if (!me) {
    return (
      <InsightCard title="So sánh với đối thủ" action={dieuKhien} footer={footer}>
        {xem === 'radar' ? <RadarSRS state={comparison.state} reload={comparison.reload} /> : <Note>{MSG[137]} Chọn danh mục có sản phẩm của bạn để so sánh.</Note>}
      </InsightCard>
    );
  }

  const cot = hep ? [me, ...(motDoiThu ? [motDoiThu] : [])] : [me, ...ds];
  const sv = new Map(ds.map(s => [s.shop_id, soVoiBan(s, me)]));
  const maxTuan = Math.max(1, ...cot.flatMap(s => s.weekly_units));
  const lo = Math.min(...cot.map(s => s.price_vnd.p25));
  const hi = Math.max(...cot.map(s => s.price_vnd.p75));
  const dem = Math.max((hi - lo) * 0.08, 10000);
  const vi = (v: number) => ((v - (lo - dem)) / (hi - lo + 2 * dem)) * 100;
  const chenhGia = (s: CompetitorShop) => {
    const c = Math.round(((s.price_vnd.median - me.price_vnd.median) / me.price_vnd.median) * 100);
    return Math.abs(c) < 5 ? 'tương đương bạn' : c < 0 ? `thấp hơn bạn ${-c}%` : `cao hơn bạn ${c}%`;
  };

  return (
    <InsightCard title={`Bạn và ${count(ds.length)} đối thủ`} info={GIAI_THICH.soSanh} action={dieuKhien} footer={footer}>
      {xem === 'radar' ? (
        <RadarSRS state={comparison.state} reload={comparison.reload} />
      ) : (
        <div className="space-y-3">
          {ds.length === 0 && <Note>Danh mục này chưa có shop nào khác để so sánh.</Note>}
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-stone-600">
            <li className="inline-flex items-center gap-1.5"><span className={`h-3.5 w-3.5 rounded ${NEN.ho} ring-1 ring-amber-200`} aria-hidden />Đối thủ vượt trội</li>
            <li className="inline-flex items-center gap-1.5"><span className={`h-3.5 w-3.5 rounded ${NEN.ban} ring-1 ring-green-200`} aria-hidden />Bạn vượt trội</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded bg-white ring-1 ring-stone-300" aria-hidden />Tương đương hoặc chưa đủ dữ liệu</li>
          </ul>
          {hep && ds.length > 0 && (
            <SelectField label="So với" value={motDoiThu?.shop_id ?? ''} onChange={onChon} options={ds.map(s => ({ value: s.shop_id, label: s.shop_name ?? 'Shop chưa đặt tên' }))} className="min-w-0 max-w-full" />
          )}
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full border-separate border-spacing-0 text-[13px] sm:min-w-[54rem]">
              <caption className="sr-only">So sánh shop của bạn với {count(ds.length)} đối thủ theo từng tiêu chí</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-[1] hidden border-b border-stone-200 bg-white py-2.5 pl-0 pr-3 text-left text-xs font-semibold text-stone-500 sm:table-cell">Tiêu chí</th>
                  {cot.map(s => (
                    <th key={s.shop_id} scope="col" className={`border-b border-stone-200 px-2 py-2.5 text-left align-top sm:px-3 ${s.is_me ? 'bg-[#f6faf6]' : chon === s.shop_id ? 'bg-sky-50' : 'bg-white'}`}>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.is_me ? SERIES.green : SERIES.blue }} aria-hidden />
                        {s.is_me ? (
                          <span className="font-bold text-stone-900">Bạn</span>
                        ) : (
                          <Link to={`/seller/competitors/${s.shop_id}`} className="font-bold text-stone-900 no-underline hover:text-[#007700] sm:truncate" title={s.shop_name ?? ''}>{s.shop_name}</Link>
                        )}
                      </span>
                      <span className="block text-xs font-normal text-stone-500">{s.is_me ? s.shop_name : `Tương đồng ${s.rivalry ?? 0}/100`}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Dong ten="Mức độ tương đồng" phu="cùng loại hàng, cùng phân khúc giá">
                  {cot.map(s => (
                    <O key={s.shop_id} chon={chon === s.shop_id}>
                      <span className="block text-base font-bold tabular-nums text-stone-900">{s.is_me ? '—' : `${s.rivalry ?? 0}/100`}</span>
                      <span className="block text-xs text-stone-500">{s.is_me ? 'mốc so sánh' : s.shared_types.length ? `Cùng loại hàng; giá ${chenhGia(s)}` : 'Không bán cùng loại hàng'}</span>
                      {!s.is_me && s.similar_listings > 0 && (
                        <span className="mt-1 block text-xs font-semibold text-sky-800">{count(s.similar_listings)} mẫu gần giống sản phẩm của bạn</span>
                      )}
                    </O>
                  ))}
                </Dong>
                <Dong ten="Lượng bán 90 ngày" phu="và thị phần trong danh mục">
                  {cot.map(s => (
                    <O key={s.shop_id} tong={sv.get(s.shop_id)?.ban} chon={chon === s.shop_id}>
                      <span className="flex items-center gap-1.5">
                        <span className="text-base font-bold tabular-nums text-stone-900">{count(s.units_90d)}</span>
                        <IconTong tong={sv.get(s.shop_id)?.ban ?? null} />
                      </span>
                      <span className="block text-xs text-stone-500">thị phần {decimal(s.share_pct, 1)}%</span>
                    </O>
                  ))}
                </Dong>
                <Dong ten="Xu hướng 8 tuần" phu="thị phần so với toàn danh mục">
                  {cot.map(s => (
                    <O key={s.shop_id} tong={sv.get(s.shop_id)?.xh} chon={chon === s.shop_id}>
                      <Sparkline tuan={s.weekly_units} max={maxTuan} mau={s.is_me ? SERIES.green : SERIES.blue} />
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                        {s.trend.kind ? XU_HUONG[s.trend.kind] : 'Chưa đủ dữ liệu'}
                        <IconTong tong={sv.get(s.shop_id)?.xh ?? null} />
                      </span>
                    </O>
                  ))}
                </Dong>
                <Dong ten="Giá" phu="chấm: giá trung vị · thanh: khoảng giá phổ biến · vạch xanh lá: giá của bạn">
                  {cot.map(s => (
                    <O key={s.shop_id} chon={chon === s.shop_id}>
                      <span className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-base font-bold tabular-nums text-stone-900">{money(s.price_vnd.median)}</span>
                        <span className="text-xs text-stone-500">{s.is_me ? 'giá trung vị' : chenhGia(s)}</span>
                      </span>
                      <span className="relative mt-1.5 block h-4" aria-hidden>
                        <span className="absolute inset-x-0 top-[7px] h-0.5 rounded bg-stone-200" />
                        <span
                          className="absolute top-1 h-2 rounded"
                          style={{ left: `${vi(s.price_vnd.p25)}%`, width: `${Math.max(1.5, vi(s.price_vnd.p75) - vi(s.price_vnd.p25))}%`, background: s.is_me ? 'rgba(26,107,26,0.28)' : 'rgba(42,120,214,0.28)' }}
                        />
                        <span className="absolute top-0 h-4 w-0.5 -translate-x-1/2" style={{ left: `${vi(me.price_vnd.median)}%`, background: SERIES.green }} />
                        <span className="absolute top-0.5 h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-white" style={{ left: `${vi(s.price_vnd.median)}%`, background: s.is_me ? SERIES.green : SERIES.blue }} />
                      </span>
                    </O>
                  ))}
                </Dong>
                {du && (
                  <>
                    <Dong ten="Điểm đánh giá" phu="đã hiệu chỉnh theo số lượt đánh giá">
                      {cot.map(s => (
                        <O key={s.shop_id} chon={chon === s.shop_id}>
                          <span className="flex items-center gap-1">
                            <span className="text-base font-bold tabular-nums text-stone-900">{s.rating === null ? 'Chưa có' : decimal(s.rating, 1)}</span>
                            {s.rating !== null && <Star size={13} className="fill-amber-500 text-amber-500" aria-hidden />}
                          </span>
                          <span className="block text-xs text-stone-500">{count(s.n_reviews)} lượt đánh giá</span>
                        </O>
                      ))}
                    </Dong>
                    <Dong ten="Thời gian phản hồi" phu="trung bình với khách hàng">
                      {cot.map(s => (
                        <O key={s.shop_id} tong={sv.get(s.shop_id)?.tl} chon={chon === s.shop_id}>
                          <span className="flex items-center gap-1.5">
                            <span className="text-base font-bold tabular-nums text-stone-900">{s.response_minutes === null ? 'Chưa có dữ liệu' : `${s.response_minutes} phút`}</span>
                            <IconTong tong={sv.get(s.shop_id)?.tl ?? null} />
                          </span>
                        </O>
                      ))}
                    </Dong>
                    <Dong ten="Sản phẩm mới" phu="đăng trong 30 ngày">
                      {cot.map(s => (
                        <O key={s.shop_id} tong={sv.get(s.shop_id)?.moi} chon={chon === s.shop_id}>
                          <span className="flex items-center gap-1.5">
                            <span className="text-base font-bold text-stone-900">{s.new_30d === 0 ? 'Chưa có' : `${count(s.new_30d)} sản phẩm`}</span>
                            <IconTong tong={sv.get(s.shop_id)?.moi ?? null} />
                          </span>
                        </O>
                      ))}
                    </Dong>
                    <Dong ten="Cơ cấu sản phẩm" phu="trong danh mục này">
                      {cot.map(s => (
                        <O key={s.shop_id} chon={chon === s.shop_id}>
                          <span className="block font-bold text-stone-900">{count(s.n_listings)} sản phẩm</span>
                          <span className="block text-xs text-stone-500">{s.types.map(t => `${t.count} ${t.name.toLowerCase()}`).join(', ')}</span>
                          <span className="block text-xs text-stone-500">Chất liệu: {s.materials.length ? s.materials.join(', ') : 'chưa ghi'}</span>
                        </O>
                      ))}
                    </Dong>
                  </>
                )}
                <Dong ten="Điểm đối thủ vượt trội">
                  {cot.map(s => (
                    <O key={s.shop_id} chon={chon === s.shop_id}>
                      {s.is_me ? null : (sv.get(s.shop_id)?.hon.length ?? 0) > 0 ? (
                        <ul className="m-0 list-none space-y-1 p-0">
                          {sv.get(s.shop_id)!.hon.map(t => (
                            <li key={t} className="flex items-baseline gap-1.5 text-stone-800"><span className="h-1.5 w-1.5 shrink-0 -translate-y-px rounded-full bg-amber-600" aria-hidden />{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-stone-500">Chưa ghi nhận</span>
                      )}
                    </O>
                  ))}
                </Dong>
                <Dong ten="Điểm bạn vượt trội">
                  {cot.map(s => (
                    <O key={s.shop_id} chon={chon === s.shop_id}>
                      {s.is_me ? null : (sv.get(s.shop_id)?.banHon.length ?? 0) > 0 ? (
                        <ul className="m-0 list-none space-y-1 p-0">
                          {sv.get(s.shop_id)!.banHon.map(t => (
                            <li key={t} className="flex items-baseline gap-1.5 text-stone-800"><span className="h-1.5 w-1.5 shrink-0 -translate-y-px rounded-full bg-[#1a6b1a]" aria-hidden />{t}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-stone-500">Chưa ghi nhận</span>
                      )}
                    </O>
                  ))}
                </Dong>
                {canTrack && (
                  <Dong ten="Theo dõi" phu="nhận cảnh báo sản phẩm mới">
                    {cot.map(s => (
                      <O key={s.shop_id} chon={chon === s.shop_id}>
                        {s.is_me ? null : trackedIds.has(s.shop_id) ? (
                          <Chip tone="good">Đang theo dõi</Chip>
                        ) : (
                          <button type="button" onClick={() => onTrack(s.shop_id, s.shop_name ?? '')} disabled={khoa || full} title={full ? MSG[143] : undefined} aria-label={`Theo dõi ${s.shop_name ?? ''}`} className={NUT_THEO_DOI}>
                            <UserPlus size={13} aria-hidden />
                            {pendingShop === s.shop_id ? 'Đang thêm' : 'Theo dõi'}
                          </button>
                        )}
                      </O>
                    ))}
                  </Dong>
                )}
              </tbody>
            </table>
          </div>
          <NutAnHien
            mo={du}
            onDoi={() => setDu(!du)}
            xem="Xem thêm 4 tiêu chí: điểm đánh giá, thời gian phản hồi, sản phẩm mới, cơ cấu sản phẩm"
            an="Ẩn bớt tiêu chí"
          />
          {du && (
            <ul className="m-0 list-disc space-y-0.5 pl-5 text-xs text-stone-500">
              <li>Chỉ tô màu khi chênh lệch rõ: lượng bán gấp từ 1,5 lần; thời gian phản hồi chênh từ 30% và 5 phút; nhiều hơn từ 2 sản phẩm mới. Giá không tô màu vì giá thấp hơn chưa chắc là lợi thế.</li>
              <li>Điểm đánh giá chỉ để tham khảo khi mỗi shop còn ít lượt: chênh lệch 0,1 điểm lúc này chưa có ý nghĩa thống kê.</li>
              <li>"Thị phần tăng/giảm" dựa trên kiểm định thị phần 4 tuần gần nhất so với 4 tuần trước, đã loại trừ tăng trưởng chung của toàn sàn.</li>
            </ul>
          )}
        </div>
      )}
    </InsightCard>
  );
}
