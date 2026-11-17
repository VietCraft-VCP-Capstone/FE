/**
 * F36 — phần Theo dõi hoạt động đối thủ của trang Phân tích đối thủ; cùng danh sách follow với khu Vận hành /seller/competitors.
 *
 * Gian hàng thật: dòng thời gian 8 tuần cho từng shop đang theo dõi (sản phẩm mới theo mức cạnh tranh, số bán mỗi tuần),
 * danh sách sản phẩm mới cần lưu ý (phân trang), biểu đồ kiểm soát giải thích vì sao báo tăng đột biến.
 * Shop mẫu (seed_demo): nhập mã `shp_*`, không có ngày đăng thật nên không có dòng thời gian và hàng mới.
 */

import { useEffect, useMemo, useState } from 'react';
import { BellRing, Eye, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartesianGrid, ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ConfirmModal } from '../../../../shared/components/ConfirmModal';
import { ModalOverlay } from '../../../../shared/components/ModalOverlay';
import { useToast } from '../../../../shared/components/Toast';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { count, money, timeAgo } from '../../../../shared/utils/format';
import { InsightBlock } from '../InsightBlock';
import { useFocusTrap } from '../intel/IntelPreviewModal';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, type Tone } from '../ui';
import { decimal } from '../../format';
import { invalidateInsights, type InsightState } from '../../hooks/useInsight';
import { MSG, analyticsApi, analyticsErrorMessage } from '../../services/analyticsApi';
import { categoryLabel, tagLabel } from '../../labels';
import { PhanTrang, catTrang } from './dieuKhien';
import { GIAI_THICH, NhanTinCay } from './giaiThich';
import { Sparkline } from './BangSoSanh';
import type { CompetitorTracking, Competitors, ShopSearchResult, Threat } from '../../types';

export const MUC_DE_DOA: Record<Threat['level'], { label: string; tone: Tone }> = {
  high: { label: 'Cạnh tranh cao', tone: 'bad' },
  medium: { label: 'Cạnh tranh vừa', tone: 'warn' },
  low: { label: 'Cạnh tranh thấp', tone: 'neutral' },
};

/** Sản phẩm mới đụng hàng nào của bạn, nói ngắn; % tương đồng nằm ở chú thích khi rê chuột, chênh giá ở thanh giá bên cạnh. */
export function lyDoDeDoa(t: Threat, loaiHang?: string | null): string {
  if (!t.matched_title) return 'Bạn chưa bán loại hàng này';
  if (t.near_identical) return `Gần như trùng ${t.matched_title}`;
  return t.similarity < 0.15 ? `Cùng loại ${(loaiHang ?? 'hàng').toLowerCase()}, mẫu mã khác biệt` : `Giống ${t.matched_title}`;
}

const FIELD_CLASS =
  'h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition-colors duration-150 hover:border-stone-300 focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20 disabled:bg-stone-50 disabled:text-stone-400 motion-reduce:transition-none';

const NUT_BO_THEO_DOI =
  'inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border-none bg-transparent px-2 py-1 text-xs font-semibold text-stone-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 motion-reduce:transition-none';

const TIM_TOI_THIEU = 2;
const SO_GOI_Y = 6;
const SO_SP_MOI_TRANG = 3;
const NGAY = 86_400_000;
const SO_TUAN = 8;

type GoiY = { shop_id: string; shop_name: string; why: string };
type Launch = NonNullable<CompetitorTracking['tracked'][number]['launches']>[number];

const ngayNgan = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Ba bước để người bán mới hiểu theo dõi đối thủ để làm gì. */
function CachHoatDong({ toiDa }: { toiDa: number }) {
  const buoc = [
    { icon: UserPlus, ten: 'Chọn shop', cau: `Tối đa ${toiDa} shop bán giống bạn.` },
    { icon: Eye, ten: 'Hệ thống canh mỗi ngày', cau: 'Hàng mới cùng loại, shop bán vọt lên.' },
    { icon: BellRing, ten: 'Bạn biết ngay', cau: 'Kèm mức cạnh tranh để biết xem gì trước.' },
  ];
  return (
    <ol aria-label="Theo dõi đối thủ hoạt động thế nào" className="m-0 grid list-none grid-cols-1 gap-3 rounded-md border border-stone-200 bg-stone-50 p-3 sm:grid-cols-3">
      {buoc.map((b, i) => (
        <li key={b.ten} className="flex items-start gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#007700] ring-1 ring-stone-200" aria-hidden>
            <b.icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[13px] font-bold text-stone-900">{i + 1}. {b.ten}</p>
            <p className="m-0 mt-0.5 text-xs leading-relaxed text-stone-600">{b.cau}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** SRS 3.9.5: hộp thoại thêm shop. Gian hàng thật tìm theo tên, theo danh mục, có gợi ý; shop mẫu nhập mã. */
function ThemShop({ live, used, limit, trackedIds, goiY, onTrack, onClose }: {
  live: boolean;
  used: number;
  limit: number;
  trackedIds: Set<string>;
  goiY: GoiY[];
  onTrack: (shopId: string, name: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const panelRef = useFocusTrap(onClose);
  // Giữ nguyên danh sách gợi ý lúc mở, để shop vừa theo dõi đổi sang "Đang theo dõi" thay vì biến mất.
  const [goiYLucMo] = useState(goiY);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [dangThem, setDangThem] = useState<string | null>(null);
  const [daThem, setDaThem] = useState<Set<string>>(() => new Set());
  const [ma, setMa] = useState('');
  const [danhMuc, setDanhMuc] = useState<{ id: string; name: string }[]>([]);
  const [dm, setDm] = useState('');

  const daTheoDoi = (id: string) => trackedIds.has(id) || daThem.has(id);
  const full = used + [...daThem].filter(id => !trackedIds.has(id)).length >= limit;
  const dangTim = query.trim().length >= TIM_TOI_THIEU || dm !== '';
  const tenDm = danhMuc.find(d => d.id === dm)?.name;

  useEffect(() => {
    if (!live) return;
    let con = true;
    analyticsApi.trackingCategories().then(ds => con && setDanhMuc(ds)).catch(() => undefined);
    return () => {
      con = false;
    };
  }, [live]);

  // Chờ người dùng ngừng gõ rồi mới gọi BE. Chọn danh mục thì tìm ngay cả khi chưa gõ tên.
  useEffect(() => {
    const q = query.trim();
    if (!live || (q.length < TIM_TOI_THIEU && !dm)) {
      setResults(null);
      return;
    }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await analyticsApi.searchShops({ q: q.length >= TIM_TOI_THIEU ? q : undefined, categoryId: dm || undefined }, ctl.signal));
      } catch {
        if (!ctl.signal.aborted) setResults([]);
      } finally {
        if (!ctl.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [query, dm, live]);

  const them = async (id: string, ten: string) => {
    setDangThem(id);
    const ok = await onTrack(id, ten);
    if (ok) setDaThem(s => new Set(s).add(id));
    setDangThem(null);
    return ok;
  };

  const dong = (id: string, ten: string, phu: string | null, daCo: boolean) => (
    <li key={id} className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <Link to={`/seller/competitors/${id}`} className="block truncate text-[13.5px] font-semibold text-stone-900 no-underline hover:text-[#007700]">
          {ten}
        </Link>
        {phu && <span className="block text-xs leading-relaxed text-stone-500">{phu}</span>}
      </div>
      {daCo ? (
        <Chip tone="good">Đang theo dõi</Chip>
      ) : (
        <button
          type="button"
          onClick={() => void them(id, ten)}
          disabled={full || dangThem !== null}
          aria-label={`Theo dõi ${ten}`}
          className={`${ACTION_CLASS} h-8 shrink-0 px-3`}
        >
          <Plus size={14} aria-hidden />
          {dangThem === id ? 'Đang thêm' : 'Theo dõi'}
        </button>
      )}
    </li>
  );

  const LIST_CLASS = 'm-0 list-none divide-y divide-stone-100 rounded-lg border border-stone-200 p-0';

  return (
    <ModalOverlay>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="them-shop-tieu-de" className="relative my-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="border-b border-stone-200 px-5 py-4 pr-12">
          <h2 id="them-shop-tieu-de" className="m-0 text-base font-bold text-stone-900">Thêm shop để theo dõi</h2>
          <p className="m-0 mt-0.5 text-xs text-stone-500">
            Đang theo dõi {count(used + [...daThem].filter(id => !trackedIds.has(id)).length)}/{count(limit)} shop.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {full && <Note tone="warn">{MSG[143]} Bỏ bớt một shop để thêm shop mới.</Note>}
          {live ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label htmlFor="tim-shop" className="text-xs font-semibold text-stone-600">Tìm shop theo tên</label>
                  <input
                    id="tim-shop"
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={`Gõ ít nhất ${TIM_TOI_THIEU} chữ trong tên shop`}
                    maxLength={60}
                    autoComplete="off"
                    className={`${FIELD_CLASS} mt-1 block w-full`}
                  />
                </div>
                <div>
                  <label htmlFor="tim-danh-muc" className="text-xs font-semibold text-stone-600">Hoặc theo danh mục</label>
                  <select id="tim-danh-muc" value={dm} onChange={e => setDm(e.target.value)} className={`${FIELD_CLASS} mt-1 block w-full cursor-pointer sm:w-48`}>
                    <option value="">Mọi danh mục</option>
                    {danhMuc.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div aria-live="polite">
                {dangTim ? (
                  searching ? (
                    <p className="m-0 text-xs text-stone-500">Đang tìm...</p>
                  ) : results?.length === 0 ? (
                    <p className="m-0 text-xs text-stone-500">
                      {dm ? `Không có shop nào khác đang bán trong ${tenDm ?? 'danh mục này'}${query.trim() ? ' có tên như vậy' : ''}.` : 'Không có shop nào tên như vậy.'}
                    </p>
                  ) : results ? (
                    <>
                      {dm && <p className="m-0 mb-1.5 text-xs font-semibold text-stone-600">Shop đang bán trong {tenDm}, nhiều sản phẩm xếp trước</p>}
                      <ul className={LIST_CLASS}>
                        {results.map(r => dong(
                          r.shop_id,
                          r.shop_name,
                          r.products_in_category !== undefined ? `${count(r.products_in_category)} sản phẩm trong danh mục này` : null,
                          r.is_tracked || daTheoDoi(r.shop_id),
                        ))}
                      </ul>
                    </>
                  ) : null
                ) : goiYLucMo.length > 0 ? (
                  <>
                    <p className="m-0 mb-1.5 text-xs font-semibold text-stone-600">Gợi ý cho bạn</p>
                    <ul className={LIST_CLASS}>{goiYLucMo.map(g => dong(g.shop_id, g.shop_name, g.why, daTheoDoi(g.shop_id)))}</ul>
                  </>
                ) : (
                  <p className="m-0 text-xs text-stone-500">Gõ tên shop để tìm.</p>
                )}
              </div>
            </>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                const target = ma.trim();
                if (target) void them(target, target).then(ok => ok && setMa(''));
              }}
              className="flex flex-wrap items-end gap-2"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="ma-shop" className="text-xs font-semibold text-stone-600">Mã shop cần theo dõi</label>
                <input id="ma-shop" value={ma} onChange={e => setMa(e.target.value)} placeholder="shp_00042" disabled={full} className={`${FIELD_CLASS} w-48`} />
              </div>
              <button type="submit" disabled={full || dangThem !== null || !ma.trim()} className={`${ACTION_CLASS} h-9`}>
                <Plus size={15} aria-hidden />
                {dangThem ? 'Đang thêm' : 'Theo dõi'}
              </button>
            </form>
          )}
        </div>

        <div className="flex justify-end border-t border-stone-200 px-5 py-3">
          <button type="button" onClick={onClose} className={`${ACTION_CLASS} h-9`}>Xong</button>
        </div>
        {/* Nút đóng đặt cuối để ô tìm kiếm nhận focus đầu tiên khi mở. */}
        <button type="button" onClick={onClose} aria-label="Đóng hộp thoại thêm shop" className="absolute right-3 top-3 cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]">
          <X size={20} aria-hidden />
        </button>
      </div>
    </ModalOverlay>
  );
}

/** SRS 3.9.5: danh sách shop đang theo dõi. Mỗi dòng trả lời hai câu: họ ra bao nhiêu hàng mới, và đang bán lên hay xuống. */
function DanhSachTheoDoi({ data, onRemove }: { data: CompetitorTracking; onRemove: (id: string, name: string | null) => void }) {
  const vot = new Map((data.surging ?? []).map(s => [s.shop_id, s]));
  // Cùng một thang cho mọi dòng, để đường cao hơn nghĩa là bán nhiều hơn thật.
  const maxTuan = Math.max(1, ...data.tracked.flatMap(t => t.weekly_sales ?? []));
  return (
    <DataTable
      caption="Danh sách shop đang theo dõi"
      head={
        <>
          <th scope="col">Shop</th>
          <th scope="col" className="text-right">Sản phẩm mới<span className="block font-normal text-stone-400">8 tuần</span></th>
          <th scope="col" className="text-right">Cạnh tranh cao</th>
          <th scope="col">Lượng bán 8 tuần</th>
          <th scope="col" className="text-right"><span className="sr-only">Bỏ theo dõi</span></th>
        </>
      }
    >
      {data.tracked.map(t => {
        const moi = t.launches ?? [];
        const cao = moi.filter(l => l.in_my_niche && l.threat?.level === 'high').length;
        const tuan = t.weekly_sales ?? [];
        return (
          <tr key={t.shop_id}>
            <td>
              <Link to={`/seller/competitors/${t.shop_id}`} className="font-semibold text-stone-900 no-underline hover:text-[#007700]">{t.shop_name || 'Chưa có tên'}</Link>
              <span className="block text-xs text-stone-500">
                {t.category_name || 'Chưa rõ danh mục'} · {count(t.listings_total)} sản phẩm{t.last_new_listing_at ? ` · mới nhất ${ngayNgan(t.last_new_listing_at)}` : ''}
              </span>
            </td>
            <td className="text-right text-base font-bold tabular-nums text-stone-900">{count(moi.length)}</td>
            <td className="text-right">{cao ? <Chip tone="bad">{count(cao)}</Chip> : <span className="tabular-nums text-stone-400">0</span>}</td>
            <td>
              {tuan.length > 0 ? (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Sparkline tuan={tuan} max={maxTuan} mau={SERIES.blue} />
                  <span className="whitespace-nowrap text-xs text-stone-600">tuần này <strong className="tabular-nums text-stone-900">{count(tuan[tuan.length - 1])}</strong></span>
                  {vot.has(t.shop_id) && <Chip tone="warn">Tăng đột biến{vot.get(t.shop_id)?.ratio ? ` · gấp ${decimal(vot.get(t.shop_id)!.ratio!, 1)} lần` : ''}</Chip>}
                </span>
              ) : <span className="text-stone-400">—</span>}
            </td>
            <td className="text-right">
              <button type="button" onClick={() => onRemove(t.shop_id, t.shop_name)} aria-label={`Bỏ theo dõi ${t.shop_name || t.shop_id}`} className={NUT_BO_THEO_DOI}>
                <Trash2 size={14} aria-hidden />
                Bỏ theo dõi
              </button>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

type HangMoi = Launch & { shop: string | null; shopId: string };
interface DiemMoi { x: number; y: number; l: HangMoi; trai: boolean }

const MAU_MUC: Record<Threat['level'], string> = { high: '#d9480f', medium: '#eda100', low: '#a8a29e' };
const NHAN_VUNG = { fill: '#44403c', fontSize: 12, fontWeight: 600 };
const ngayMs = (v: number) => {
  const d = new Date(v);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

function DiemHangMoi({ cx = 0, cy = 0, payload }: { cx?: number; cy?: number; payload?: DiemMoi }) {
  if (!payload) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={MAU_MUC[payload.l.threat!.level]} stroke="#fff" strokeWidth={2} />
      <text x={payload.trai ? cx - 11 : cx + 11} y={cy + 4} textAnchor={payload.trai ? 'end' : 'start'} fontSize={11} fontWeight={700}
        fill="#1c1917" stroke="#fff" strokeWidth={3} paintOrder="stroke">{payload.l.threat!.score}</text>
    </g>
  );
}

function HangMoiTooltip({ active, payload }: { active?: boolean; payload?: { payload?: DiemMoi }[] }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  const th = d.l.threat!;
  return (
    // Ô chú thích hẹp hơn biểu đồ trên điện thoại, để không đẩy trang tràn ngang.
    <div className="rounded-lg border border-[#e3e6e3] bg-white px-3 py-2 text-xs shadow-[0_6px_20px_rgba(16,33,26,0.12)]" style={{ maxWidth: 'min(260px, calc(100vw - 180px))' }}>
      <div className="font-bold text-stone-900">{d.l.title ?? 'Sản phẩm mới'}</div>
      <div className="text-stone-600">{d.l.shop} · đăng {ngayNgan(d.l.listed_at)}</div>
      <div className="text-stone-600">{MUC_DE_DOA[th.level].label}: <strong className="text-stone-900">{th.score}/100</strong></div>
      <div className="text-stone-600">{lyDoDeDoa(th, d.l.product_type_name)}</div>
      {d.l.matched_price_vnd !== null && <div className="text-stone-600">Giá {money(d.l.price_vnd)} · của bạn {money(d.l.matched_price_vnd)}</div>}
    </div>
  );
}

/** Cùng kiểu với bản đồ Vị thế: mỗi chấm một sản phẩm mới, ngang là ngày đăng, dọc là mức cạnh tranh; số cạnh chấm khớp với danh sách bên dưới. */
function BieuDoHangMoi({ ds, batDau, goc }: { ds: HangMoi[]; batDau: number; goc: number }) {
  // shortcut: đọc cỡ màn một lần lúc vẽ như ViTheCanhTranh; xoay máy thì chờ lần vẽ sau.
  const hep = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
  const buoc = (hep ? 14 : 7) * NGAY;
  const ticks = Array.from({ length: Math.floor((goc - batDau) / buoc) + 1 }, (_, k) => batDau + k * buoc);
  const tho = ds.map(l => ({ x: Math.min(goc, Math.max(batDau, new Date(l.listed_at).getTime())), y: l.threat!.score, l })).sort((a, b) => a.x - b.x);
  // Nhãn số mặc định bên phải chấm; sát mép phải, hoặc có chấm khác ngay bên phải cùng tầm điểm, thì đặt bên trái.
  const diem: DiemMoi[] = tho.map((d, i) => ({
    ...d,
    trai: d.x > batDau + 0.86 * (goc - batDau)
      || (d.x > batDau + 5 * NGAY && tho.slice(i + 1).some(e => e.x - d.x < 7 * NGAY && Math.abs(e.y - d.y) < 12)),
  }));
  const soCao = ds.filter(l => l.threat!.level === 'high').length;
  return (
    <div
      className="w-full"
      style={{ height: hep ? 240 : 270 }}
      role="img"
      aria-label={`Sản phẩm mới của các shop đang theo dõi trong 8 tuần: ${count(ds.length)} sản phẩm cùng nhóm hàng với bạn, ${count(soCao)} sản phẩm cạnh tranh cao. Trục ngang là ngày đăng, trục dọc là mức cạnh tranh từ 0 tới 100.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 16, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
          <ReferenceArea y1={50} y2={100} fill={MAU_MUC.high} fillOpacity={0.07} ifOverflow="hidden" />
          <ReferenceArea y1={25} y2={50} fill={MAU_MUC.medium} fillOpacity={0.09} ifOverflow="hidden" />
          <XAxis type="number" dataKey="x" domain={[batDau, goc]} ticks={ticks} tickFormatter={ngayMs}
            tick={{ fill: CHART_INK.axis, fontSize: 11 }} tickLine={false} />
          {/* Tên ba mức ghi ngay trên trục dọc (giữa mỗi vùng) thay cho số, để chữ không đè lên chấm. */}
          <YAxis type="number" dataKey="y" domain={[0, 100]} ticks={[12.5, 37.5, 75]} width={hep ? 40 : 58}
            tickFormatter={(v: number) => (v > 50 ? 'Cao' : v > 25 ? 'Vừa' : 'Thấp')}
            tick={NHAN_VUNG} tickLine={false}
            label={hep ? undefined : { value: 'Mức cạnh tranh', angle: -90, position: 'insideLeft', offset: 0, fill: CHART_INK.axis, fontSize: 12 }} />
          <Tooltip content={<HangMoiTooltip />} cursor={false} isAnimationActive={false} />
          <Scatter data={diem} isAnimationActive={false} shape={(p: unknown) => <DiemHangMoi {...(p as { cx?: number; cy?: number; payload?: DiemMoi })} />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Sản phẩm mới cùng ngách với bạn trong 8 tuần, cạnh tranh mạnh nhất trước; 3 mục mỗi trang. */
function SanPhamMoi({ data, tagName }: { data: CompetitorTracking; tagName: (t: string) => string }) {
  const [trang, setTrang] = useState(1);
  const goc = data.alerts_computed_at ? new Date(data.alerts_computed_at).getTime() : Date.now();
  const ds = data.tracked
    .flatMap(t => (t.launches ?? []).filter(l => l.in_my_niche && l.threat).map(l => ({ ...l, shop: t.shop_name, shopId: t.shop_id })))
    .sort((a, b) => b.threat!.score - a.threat!.score || b.listed_at.localeCompare(a.listed_at));
  const { t, rows } = catTrang(ds, trang, SO_SP_MOI_TRANG);
  const gia = ds.flatMap(l => [l.price_vnd, l.matched_price_vnd ?? l.price_vnd]);
  const lo = Math.min(...gia) * 0.9;
  const hi = Math.max(...gia) * 1.05;
  const vi = (v: number) => ((v - lo) / Math.max(hi - lo, 1)) * 100;
  // Từ khoá ngách của bạn: trước là một mục gập riêng, giờ nằm trong ⓘ của thẻ.
  const tuKhoa = data.my_niche_tags.slice(0, 40).map(tagName).join(', ');

  return (
    <InsightCard
      title="Sản phẩm mới cần lưu ý"
      info={tuKhoa ? `${GIAI_THICH.hangMoi} Từ khoá của shop bạn: ${tuKhoa}.` : GIAI_THICH.hangMoi}
      action={<NhanTinCay loai="tham" />}
    >
      {ds.length === 0 ? (
        <Note>Chưa có sản phẩm mới nào cùng nhóm hàng với bạn từ các shop đang theo dõi trong 8 tuần.</Note>
      ) : (
        <div className="space-y-2">
          <BieuDoHangMoi ds={ds} batDau={goc - SO_TUAN * 7 * NGAY} goc={goc} />
          <ul className="m-0 list-none divide-y divide-stone-100 p-0">
            {rows.map(l => {
              const th = l.threat!;
              const moi = goc - new Date(l.listed_at).getTime() <= 7 * NGAY;
              return (
                <li key={`${l.shopId}-${l.listing_id}`} className="py-2.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Chip tone={MUC_DE_DOA[th.level].tone}>{MUC_DE_DOA[th.level].label} · {th.score}</Chip>
                    <span className="min-w-0 font-semibold text-stone-900">{l.title}</span>
                    <span className="text-xs text-stone-500">
                      <Link to={`/seller/competitors/${l.shopId}`} className="text-stone-600 no-underline hover:text-[#007700]">{l.shop}</Link>
                      {' · '}{ngayNgan(l.listed_at)}{moi ? ' · mới tuần này' : ''}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                    <span className="text-[13px] text-stone-800" title={th.matched_title ? `Tương đồng ${Math.round(th.similarity * 100)}%` : undefined}>{lyDoDeDoa(th, l.product_type_name)}</span>
                    {l.matched_price_vnd !== null && (
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="relative block h-4 w-32 sm:w-40" aria-hidden>
                          <span className="absolute inset-x-0 top-[7px] h-0.5 bg-stone-100" />
                          <span className="absolute top-[7px] h-0.5 bg-stone-400" style={{ left: `${Math.min(vi(l.price_vnd), vi(l.matched_price_vnd))}%`, width: `${Math.abs(vi(l.matched_price_vnd) - vi(l.price_vnd))}%` }} />
                          <span className="absolute top-0.5 h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-white" style={{ left: `${vi(l.price_vnd)}%`, background: SERIES.blue }} />
                          <span className="absolute top-0.5 h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-white" style={{ left: `${vi(l.matched_price_vnd)}%`, background: SERIES.green }} />
                        </span>
                        {/* Chấm màu cạnh từng giá thay cho dòng chú thích riêng. */}
                        <span className="flex items-center gap-2 whitespace-nowrap text-xs text-stone-700">
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: SERIES.blue }} aria-hidden />{money(l.price_vnd)}</span>
                          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: SERIES.green }} aria-hidden />Bạn {money(l.matched_price_vnd)}</span>
                          {th.price_gap_pct ? <strong className="text-stone-900">{th.price_gap_pct > 0 ? '−' : '+'}{Math.abs(th.price_gap_pct)}%</strong> : null}
                        </span>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <PhanTrang trang={t} tong={ds.length} onDoi={setTrang} moiTrang={SO_SP_MOI_TRANG} nhan="Các trang của danh sách sản phẩm mới" />
        </div>
      )}
    </InsightCard>
  );
}

export function TrackingSection({ state, reload, rivals }: {
  state: InsightState<CompetitorTracking>;
  reload: () => void;
  /** Bảng bán chạy đang mở trên trang: nguồn gợi ý shop để theo dõi. */
  rivals: Competitors | null;
}) {
  const live = state.kind === 'ready' && state.meta.source.mode === 'live';
  const [busy, setBusy] = useState(false);
  const [mo, setMo] = useState(false);
  const { showToast } = useToast();
  const [removing, setRemoving] = useState<{ id: string; name: string | null } | null>(null);
  // Thêm shop xong danh sách tải lại (đang tải); hộp thoại dùng bản gần nhất để không bị đóng giữa chừng.
  const [cuoi, setCuoi] = useState<{ data: CompetitorTracking; live: boolean } | null>(null);
  useEffect(() => {
    if (state.kind === 'ready') setCuoi({ data: state.data, live: state.meta.source.mode === 'live' });
  }, [state]);

  // Gợi ý: shop AI thấy bán giống bạn nhất trước, rồi tới shop bán chạy trong danh mục đang xem.
  const goiY = useMemo<GoiY[]>(() => {
    if (!live || !rivals || state.kind !== 'ready') return [];
    const tracked = new Set(state.data.tracked.map(t => t.shop_id));
    const tenDm = (id: string) => categoryLabel(id, rivals.category_names?.[id] ?? null);
    const ra = new Map<string, GoiY>();
    for (const s of rivals.rival_shops_by_category?.all ?? rivals.direct_rival_shops ?? []) {
      const o = s.categories?.length ? ` · ở ${s.categories.map(tenDm).join(', ')}` : '';
      ra.set(s.shop_id, { shop_id: s.shop_id, shop_name: s.shop_name ?? 'Shop chưa đặt tên', why: `Có hàng giống ${count(s.overlap)} sản phẩm của bạn${o}` });
    }
    const dm = tenDm(rivals.category_id);
    for (const c of rivals.competitors) {
      if (c.shop_id && !ra.has(c.shop_id)) ra.set(c.shop_id, { shop_id: c.shop_id, shop_name: c.shop_name, why: `Bán chạy trong ${dm}` });
    }
    return [...ra.values()].filter(g => !tracked.has(g.shop_id)).slice(0, SO_GOI_Y);
  }, [live, rivals, state]);

  const refresh = () => {
    invalidateInsights('/competitor-tracking');
    reload();
  };

  const trackShop = async (target: string, name: string): Promise<boolean> => {
    try {
      await analyticsApi.trackCompetitor(target);
      showToast(`Đã theo dõi ${name}.`, 'success');
      refresh();
      return true;
    } catch (err) {
      showToast(analyticsErrorMessage(err, MSG[145]), 'error');
      return false;
    }
  };

  const remove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await analyticsApi.untrackCompetitor(removing.id);
      showToast(`Đã bỏ theo dõi ${removing.name || removing.id}.`, 'success');
      refresh();
    } catch (err) {
      showToast(analyticsErrorMessage(err, MSG[146]), 'error');
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  return (
    <>
      <InsightBlock state={state} onRetry={reload} errorText={MSG[147]}>
        {data => {
          const full = data.slots_used >= data.slots_limit;
          const tagName = (tag: string) => tagLabel(data.tag_names?.[tag] ?? null, tag);
          // Số shop đã dùng (2/10) nằm ở dòng Phạm vi của phần, không nhắc lại ở đây.
          const nutThem = (
            <button type="button" onClick={() => setMo(true)} disabled={full} title={full ? MSG[143] : undefined} className={`${ACTION_CLASS} h-9`}>
              <Plus size={15} aria-hidden />
              Thêm shop
            </button>
          );

          if (data.tracked.length === 0) {
            return (
              <div className="space-y-5">
                <CachHoatDong toiDa={data.slots_limit} />
                <InsightCard title="Shop bạn đang theo dõi" action={nutThem} bodyClassName="px-4 py-3">
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-500" aria-hidden>
                      <UserPlus size={20} />
                    </span>
                    <p className="m-0 text-sm font-bold text-stone-800">Bạn chưa theo dõi shop nào</p>
                    <p className="m-0 max-w-[46ch] text-xs leading-relaxed text-stone-500">Hệ thống sẽ báo khi họ ra hàng mới cùng loại với bạn.</p>
                    <button type="button" onClick={() => setMo(true)} className={`${ACTION_CLASS} mt-1 h-9`}>
                      <Plus size={15} aria-hidden />
                      Thêm shop
                    </button>
                  </div>
                </InsightCard>
              </div>
            );
          }

          return (
            <div className="space-y-5">
              <InsightCard
                title="Shop bạn đang theo dõi"
                info={live ? GIAI_THICH.theoDoi : 'Shop mẫu: thêm bằng mã shop, ví dụ shp_00042.'}
                action={nutThem}
                bodyClassName="px-4 py-3"
              >
                {full && (
                  <div className="mb-3">
                    <Note tone="warn">{MSG[143]} Bỏ bớt một shop để thêm shop mới.</Note>
                  </div>
                )}
                {live ? (
                  <>
                    <DanhSachTheoDoi data={data} onRemove={(id, name) => setRemoving({ id, name })} />
                    {!full && (
                      <p className="m-0 mt-3 text-xs text-stone-600">
                        Muốn theo dõi thêm: bấm <strong className="text-stone-800">+ Thêm shop</strong>, hoặc <strong className="text-stone-800">+ Theo dõi</strong> ở bảng của phần Đối thủ.
                      </p>
                    )}
                  </>
                ) : (
                  <DataTable
                    caption="Danh sách shop đang theo dõi"
                    head={
                      <>
                        <th scope="col">Shop</th>
                        <th scope="col">Mã</th>
                        <th scope="col">Thêm lúc</th>
                        <th scope="col" className="text-right">Đang bán</th>
                        <th scope="col" className="text-right"><span className="sr-only">Bỏ theo dõi</span></th>
                      </>
                    }
                  >
                    {data.tracked.map(shop => (
                      <tr key={shop.shop_id}>
                        <td className="font-semibold text-stone-800">{shop.shop_name || 'Chưa có tên'}</td>
                        <td className="font-mono text-xs text-stone-500">{shop.shop_id}</td>
                        <td className="text-stone-600">{timeAgo(shop.added_at)}</td>
                        <td className="text-right tabular-nums text-stone-700">{count(shop.listings_total)}</td>
                        <td className="text-right">
                          <button type="button" onClick={() => setRemoving({ id: shop.shop_id, name: shop.shop_name })} aria-label={`Bỏ theo dõi ${shop.shop_name || shop.shop_id}`} className={NUT_BO_THEO_DOI}>
                            <Trash2 size={14} aria-hidden />
                            Bỏ theo dõi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                )}
              </InsightCard>

              {live ? (
                <SanPhamMoi data={data} tagName={tagName} />
              ) : (
                <Note>Sản phẩm mới và lượng bán theo tuần chỉ có ở gian hàng thật: dữ liệu mẫu không có ngày đăng sản phẩm thật.</Note>
              )}
            </div>
          );
        }}
      </InsightBlock>

      {mo && cuoi && (
        <ThemShop
          live={cuoi.live}
          used={cuoi.data.slots_used}
          limit={cuoi.data.slots_limit}
          trackedIds={new Set(cuoi.data.tracked.map(t => t.shop_id))}
          goiY={goiY}
          onTrack={trackShop}
          onClose={() => setMo(false)}
        />
      )}

      <ConfirmModal
        isOpen={removing !== null}
        title="Bỏ theo dõi shop này?"
        message={
          live
            ? `Bạn sẽ không nhận cảnh báo mới về ${removing?.name || 'shop này'} nữa; cảnh báo đã gửi vẫn còn trong mục Thông báo. Shop này cũng rời khỏi mục Đối thủ đang theo dõi ở khu Vận hành. Có thể theo dõi lại bất cứ lúc nào.`
            : `Cảnh báo tương lai về ${removing?.name || removing?.id || 'shop này'} sẽ dừng. Cảnh báo cũ vẫn được giữ lại.`
        }
        confirmLabel="Bỏ theo dõi"
        cancelLabel="Giữ lại"
        isLoading={busy}
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
}
