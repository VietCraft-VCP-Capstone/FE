/**
 * F36 — phần Theo dõi hoạt động đối thủ của trang Phân tích đối thủ; cùng danh sách follow với khu Vận hành /seller/competitors.
 *
 * Gian hàng thật: dòng thời gian 8 tuần cho từng shop đang theo dõi (sản phẩm mới theo mức cạnh tranh, số bán mỗi tuần),
 * danh sách sản phẩm mới cần lưu ý (phân trang), biểu đồ kiểm soát giải thích vì sao báo tăng đột biến.
 * Shop mẫu (seed_demo): nhập mã `shp_*`, không có ngày đăng thật nên không có dòng thời gian và hàng mới.
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, Eye, Plus, Trash2, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ConfirmModal } from '../../../../shared/components/ConfirmModal';
import { ModalOverlay } from '../../../../shared/components/ModalOverlay';
import { useToast } from '../../../../shared/components/Toast';
import { CHART_INK } from '../../../../shared/components/charts/chartTheme';
import { count, timeAgo } from '../../../../shared/utils/format';
import { InsightBlock } from '../InsightBlock';
import { SourceFooter } from '../SourceFooter';
import { useFocusTrap } from '../intel/IntelPreviewModal';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, type Tone } from '../ui';
import { decimal, fullDate } from '../../format';
import { invalidateInsights, type InsightState } from '../../hooks/useInsight';
import { MSG, analyticsApi, analyticsErrorMessage } from '../../services/analyticsApi';
import { categoryLabel, tagLabel } from '../../labels';
import { NutAnHien, PhanTrang, catTrang } from './dieuKhien';
import { GIAI_THICH, NhanTinCay } from './giaiThich';
import type { CompetitorTracking, Competitors, ShopSearchResult, Threat } from '../../types';

export const MUC_DE_DOA: Record<Threat['level'], { label: string; tone: Tone }> = {
  high: { label: 'Cạnh tranh cao', tone: 'bad' },
  medium: { label: 'Cạnh tranh vừa', tone: 'warn' },
  low: { label: 'Cạnh tranh thấp', tone: 'neutral' },
};

/** Lý do AI chấm mức cạnh tranh, nói bằng lời. */
export function lyDoDeDoa(t: Threat, loaiHang?: string | null): string {
  if (!t.matched_title) return 'Bạn chưa bán loại hàng này';
  if (!t.near_identical && t.similarity < 0.15) return `Cùng loại ${(loaiHang ?? 'hàng').toLowerCase()}, mẫu mã khác biệt`;
  const phan = [t.near_identical
    ? `Gần như trùng với "${t.matched_title}" của bạn (tương đồng ${Math.round(t.similarity * 100)}%)`
    : `Tương đồng ${Math.round(t.similarity * 100)}% với "${t.matched_title}" của bạn`];
  if (t.price_gap_pct !== null && t.price_gap_pct > 0) phan.push(`giá thấp hơn ${t.price_gap_pct}%`);
  return phan.join(', ');
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
const CAM = '#eb6834';
const LAM_NHAT = 'rgba(42,120,214,0.35)';

type GoiY = { shop_id: string; shop_name: string; why: string };
type Launch = NonNullable<CompetitorTracking['tracked'][number]['launches']>[number];
type Surge = NonNullable<CompetitorTracking['surging']>[number];

/** Hình và màu của một sản phẩm mới trên dòng thời gian; hình khác nhau để không chỉ dựa vào màu. */
const DAU: Record<Threat['level'] | 'ngoai', { ten: string; mau: string; vien: string; thoi: boolean; co: number }> = {
  high: { ten: 'cạnh tranh cao', mau: '#d9480f', vien: '#9a3412', thoi: true, co: 12 },
  medium: { ten: 'cạnh tranh vừa', mau: '#eda100', vien: '#8a4b00', thoi: true, co: 10 },
  low: { ten: 'cạnh tranh thấp', mau: '#a8a29e', vien: '#78716c', thoi: false, co: 11 },
  ngoai: { ten: 'ngoài phân khúc của bạn', mau: '#ffffff', vien: '#8f8a85', thoi: false, co: 11 },
};
const dauCua = (l: Launch) => DAU[l.in_my_niche && l.threat ? l.threat.level : 'ngoai'];
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

/** Một dòng cảnh báo chính: shop đăng mẫu gần như trùng hàng của bạn (kèm tăng đột biến nếu có). */
function CanhBaoChinh({ data }: { data: CompetitorTracking }) {
  for (const t of data.tracked) {
    const sao = (t.launches ?? []).filter(l => l.threat?.near_identical && l.threat.level === 'high');
    if (!sao.length) continue;
    const re = sao.map(l => l.threat!.price_gap_pct).filter((v): v is number => v !== null && v > 0);
    const khoang = re.length ? (Math.min(...re) === Math.max(...re) ? `${Math.min(...re)}` : `${Math.min(...re)}–${Math.max(...re)}`) : '';
    const vot = data.surging?.find(s => s.shop_id === t.shop_id);
    return (
      <div role="note" className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3.5 py-3 text-[13px] text-stone-900">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
        <p className="m-0">
          <strong>{t.shop_name}</strong> đã đăng {count(sao.length)} mẫu gần như trùng với sản phẩm của bạn
          {khoang ? `, giá thấp hơn ${khoang}%` : ''}
          {vot?.ratio ? `; lượng bán tuần này gấp ${decimal(vot.ratio, 1)} lần mức nền` : ''}.
        </p>
      </div>
    );
  }
  return null;
}

/** Dòng thời gian 8 tuần: mỗi shop một làn, cột nhạt là số bán mỗi tuần, dấu là sản phẩm mới theo mức cạnh tranh. */
function DongThoiGian({ data, onRemove }: { data: CompetitorTracking; onRemove: (id: string, name: string | null) => void }) {
  const [dangXem, setDangXem] = useState<string | null>(null);
  const goc = data.alerts_computed_at ? new Date(data.alerts_computed_at).getTime() : Date.now();
  const batDau = goc - SO_TUAN * 7 * NGAY;
  const maxTuan = Math.max(1, ...data.tracked.flatMap(t => t.weekly_sales ?? []));
  const vot = new Set((data.surging ?? []).map(s => s.shop_id));
  const tatCa = data.tracked.flatMap(t => (t.launches ?? []).map(l => ({ ...l, shop: t.shop_name, khoa: `${t.shop_id}-${l.listing_id}` })));
  const chiTiet = tatCa.find(m => m.khoa === dangXem);
  const nhanTuan = Array.from({ length: SO_TUAN + 1 }, (_, k) => {
    const d = new Date(batDau + k * 7 * NGAY);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  return (
    <div className="space-y-2">
      <p aria-live="polite" className={`m-0 min-h-[2.25rem] rounded-lg bg-stone-50 px-3 py-2 text-[13px] ${chiTiet ? 'text-stone-900' : 'text-stone-500'}`}>
        {chiTiet
          ? `${chiTiet.shop} · ${ngayNgan(chiTiet.listed_at)} · ${chiTiet.title} · ${dauCua(chiTiet).ten}${chiTiet.threat ? ` (${chiTiet.threat.score}/100)` : ''}${chiTiet.threat?.near_identical ? ' · gần như trùng sản phẩm của bạn' : ''}`
          : 'Rê chuột hoặc chạm vào một điểm để xem chi tiết sản phẩm mới. Cột nhạt: lượng bán theo tuần; cột cam: tuần tăng đột biến.'}
      </p>
      {/* Màn hẹp: thông tin shop nằm trên, làn thời gian chiếm cả bề ngang bên dưới. */}
      <div>
        {data.tracked.map(t => {
          const cungNgay = new Map<string, number>();
          return (
            <div key={t.shop_id} className="flex flex-col gap-2 border-b border-stone-100 py-3 sm:flex-row sm:gap-5">
              <div className="sm:w-56 sm:shrink-0">
                <Link to={`/seller/competitors/${t.shop_id}`} className="font-semibold text-stone-900 no-underline hover:text-[#007700]">{t.shop_name || 'Chưa có tên'}</Link>
                <span className="block text-xs text-stone-500">{t.category_name || 'Chưa rõ danh mục'} · {count(t.listings_total)} sản phẩm</span>
                <span className="block text-xs text-stone-500">Sản phẩm mới gần nhất: {fullDate(t.last_new_listing_at)}</span>
                <button type="button" onClick={() => onRemove(t.shop_id, t.shop_name)} aria-label={`Bỏ theo dõi ${t.shop_name || t.shop_id}`} className={`${NUT_BO_THEO_DOI} -ml-2 mt-1`}>
                  <Trash2 size={13} aria-hidden />
                  Bỏ theo dõi
                </button>
              </div>
              <div className="relative h-24 min-w-0 border-b border-stone-300 sm:flex-1">
                {(t.weekly_sales ?? []).map((v, k) => {
                  const cao = Math.round((v / maxTuan) * 56);
                  const laVot = vot.has(t.shop_id) && k === SO_TUAN - 1;
                  return (
                    <div key={k} aria-hidden>
                      <div className="absolute bottom-0 w-[8%] rounded-t-[3px]" style={{ left: `${k * 12.5 + 2.25}%`, height: cao, background: laVot ? CAM : LAM_NHAT }} />
                      {laVot && <span className="absolute w-[8%] text-center text-[11px] font-bold text-[#9a3412]" style={{ left: `${k * 12.5 + 2.25}%`, bottom: cao + 2 }}>{v}</span>}
                    </div>
                  );
                })}
                {(t.launches ?? []).map(l => {
                  const d = dauCua(l);
                  const ngay = l.listed_at.slice(0, 10);
                  const lan = (cungNgay.get(ngay) ?? 0) + 1;
                  cungNgay.set(ngay, lan);
                  const vi = Math.min(97, Math.max(1, ((new Date(l.listed_at).getTime() - batDau) / (SO_TUAN * 7 * NGAY)) * 100));
                  const khoa = `${t.shop_id}-${l.listing_id}`;
                  return (
                    <button
                      key={l.listing_id}
                      type="button"
                      aria-label={`${ngayNgan(l.listed_at)}: ${l.title ?? 'sản phẩm mới'}, ${d.ten}`}
                      onMouseEnter={() => setDangXem(khoa)}
                      onMouseLeave={() => setDangXem(null)}
                      onFocus={() => setDangXem(khoa)}
                      onBlur={() => setDangXem(null)}
                      className={`absolute top-1 z-[1] -ml-[13px] flex h-[26px] w-[26px] cursor-default items-center justify-center rounded-full border-none p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] ${dangXem === khoa ? 'bg-sky-100' : 'bg-transparent'}`}
                      style={{ left: `calc(${vi}% - ${(lan - 1) * 18}px)` }}
                    >
                      {d.thoi ? (
                        <span className="block rotate-45" style={{ width: d.co, height: d.co, background: d.mau, boxShadow: `0 0 0 1.5px ${d.vien}, 0 0 0 3px #fff` }} />
                      ) : (
                        <span className="block rounded-full" style={{ width: d.co, height: d.co, background: d.mau, border: `2px solid ${d.vien}`, boxSizing: 'border-box' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="flex gap-5" aria-hidden>
          <div className="hidden w-56 shrink-0 sm:block" />
          <div className="relative mt-1 h-5 flex-1 text-[11px] text-stone-500">
            {nhanTuan.map((n, k) => (
              <span key={k} className={`absolute whitespace-nowrap ${k % 2 ? 'hidden sm:inline' : ''}`} style={{ left: `${k * 12.5}%`, transform: k === 0 ? 'none' : k === SO_TUAN ? 'translateX(-100%)' : 'translateX(-50%)' }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-stone-600">
        {(['high', 'medium', 'low', 'ngoai'] as const).map(k => (
          <li key={k} className="inline-flex items-center gap-1.5">
            {DAU[k].thoi ? (
              <span className="block rotate-45" style={{ width: 9, height: 9, background: DAU[k].mau, boxShadow: `0 0 0 1.5px ${DAU[k].vien}` }} aria-hidden />
            ) : (
              <span className="block rounded-full" style={{ width: 10, height: 10, background: DAU[k].mau, border: `2px solid ${DAU[k].vien}`, boxSizing: 'border-box' }} aria-hidden />
            )}
            Sản phẩm mới: {DAU[k].ten}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5"><span className="block h-3 w-2 rounded-t-sm" style={{ background: LAM_NHAT }} aria-hidden />Lượng bán theo tuần</li>
      </ul>
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

  return (
    <InsightCard title="Sản phẩm mới cần lưu ý" info={GIAI_THICH.hangMoi} action={<NhanTinCay loai="tham" />}>
      {ds.length === 0 ? (
        <Note>Chưa có sản phẩm mới nào cùng nhóm hàng với bạn từ các shop đang theo dõi trong 8 tuần.</Note>
      ) : (
        <div className="space-y-2">
          <ul className="m-0 list-none divide-y divide-stone-100 p-0">
            {rows.map(l => {
              const th = l.threat!;
              const moi = goc - new Date(l.listed_at).getTime() <= 7 * NGAY;
              return (
                <li key={`${l.shopId}-${l.listing_id}`} className="py-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 font-semibold text-stone-900">{l.title}</span>
                    <Chip tone={MUC_DE_DOA[th.level].tone}>{MUC_DE_DOA[th.level].label} · {th.score}</Chip>
                  </div>
                  <span className="block text-xs text-stone-500">
                    <Link to={`/seller/competitors/${l.shopId}`} className="text-stone-600 no-underline hover:text-[#007700]">{l.shop}</Link>
                    {' · '}đăng {ngayNgan(l.listed_at)}{moi ? ' · mới tuần này' : ''}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-stone-800">{lyDoDeDoa(th, l.product_type_name)}</span>
                  {l.matched_price_vnd !== null && (
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="relative block h-4 min-w-[10rem] max-w-xs flex-1" aria-hidden>
                        <span className="absolute inset-x-0 top-[7px] h-0.5 bg-stone-100" />
                        <span className="absolute top-[7px] h-0.5 bg-stone-400" style={{ left: `${Math.min(vi(l.price_vnd), vi(l.matched_price_vnd))}%`, width: `${Math.abs(vi(l.matched_price_vnd) - vi(l.price_vnd))}%` }} />
                        <span className="absolute top-0.5 h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-white" style={{ left: `${vi(l.price_vnd)}%`, background: '#d9480f' }} />
                        <span className="absolute top-0.5 h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-white" style={{ left: `${vi(l.matched_price_vnd)}%`, background: '#1a6b1a' }} />
                      </span>
                      <span className="text-xs text-stone-600">
                        Giá {Math.round(l.price_vnd / 1000)}k so với {Math.round(l.matched_price_vnd / 1000)}k của bạn
                        {th.price_gap_pct !== null && th.price_gap_pct !== 0 ? ` (${th.price_gap_pct > 0 ? 'thấp hơn' : 'cao hơn'} ${Math.abs(th.price_gap_pct)}%)` : ''}
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2">
            <span className="text-[11px] text-stone-500">Chấm cam: giá đối thủ · chấm xanh lá: giá sản phẩm tương ứng của bạn</span>
            <PhanTrang trang={t} tong={ds.length} onDoi={setTrang} moiTrang={SO_SP_MOI_TRANG} nhan="Các trang của danh sách sản phẩm mới" />
          </div>
        </div>
      )}
      {data.my_niche_tags.length > 0 && (
        <details className="mt-3 text-xs text-stone-500">
          <summary className="cursor-pointer font-semibold text-stone-600">Hệ thống dựa vào từ khoá nào của shop bạn?</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.my_niche_tags.slice(0, 40).map(tag => (
              <Chip key={tag} tone="neutral">{tagName(tag)}</Chip>
            ))}
          </div>
        </details>
      )}
    </InsightCard>
  );
}

/** Tăng trưởng đột biến: một câu kết luận; biểu đồ kiểm soát (vì sao báo) chỉ hiện khi bấm. */
function TangDotBien({ s }: { s: Surge }) {
  const [mo, setMo] = useState(false);
  const tuan = s.weeks ?? [];
  const nguong = s.threshold ?? null;
  const max = Math.max(...tuan, nguong ?? 0, 1) * 1.12;
  return (
    <InsightCard title={`Tăng trưởng đột biến: ${s.shop_name ?? s.shop_id}`} info={GIAI_THICH.tangToc} action={<NhanTinCay loai="kiem" />}>
      <div className="space-y-3">
        <p className="m-0 text-[13px] text-stone-800">
          Tuần này bán <strong>{count(s.last_week)} sản phẩm</strong>
          {s.ratio ? `, gấp ${decimal(s.ratio, 1)} lần mức nền` : ''} ({decimal(s.baseline, 0)} sản phẩm/tuần).
        </p>
        {tuan.length > 0 && <NutAnHien mo={mo} onDoi={() => setMo(!mo)} xem="Xem biểu đồ kiểm soát" an="Ẩn biểu đồ" />}
        {mo && tuan.length > 0 && (
          <>
            <div className="h-48 w-full" role="img" aria-label={`Lượng bán 8 tuần của ${s.shop_name ?? ''}: tuần này ${s.last_week}, mức nền ${decimal(s.baseline, 0)}${nguong !== null ? `, ngưỡng cảnh báo ${decimal(nguong, 0)}` : ''}.`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tuan.map((v, k) => ({ k, v }))} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="k" interval={0} tickFormatter={(k: number) => (k === 0 ? '8 tuần trước' : k === tuan.length - 1 ? 'Tuần này' : '')} tickLine={false} axisLine={{ stroke: CHART_INK.grid }} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
                  <YAxis width={32} domain={[0, Math.ceil(max)]} tickCount={3} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
                  {nguong !== null && <ReferenceArea y1={0} y2={nguong} fill="#f2f5f9" ifOverflow="hidden" />}
                  {nguong !== null && <ReferenceLine y={nguong} stroke="#d9480f" strokeDasharray="5 4" strokeWidth={2} label={{ value: `Ngưỡng cảnh báo: ${decimal(nguong, 0)}`, position: 'insideTopLeft', fill: '#9a3412', fontSize: 11 }} />}
                  <ReferenceLine y={s.baseline} stroke="#78716c" strokeDasharray="5 4" strokeWidth={2} label={{ value: `Mức nền: ${decimal(s.baseline, 0)}`, position: 'insideTopLeft', fill: '#44403c', fontSize: 11 }} />
                  <Bar dataKey="v" maxBarSize={28} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                    {tuan.map((_, k) => <Cell key={k} fill={k === tuan.length - 1 ? CAM : 'rgba(42,120,214,0.45)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="m-0 text-xs text-stone-500">Vùng xám là biên độ bình thường. Cảnh báo khi lượng bán tuần này vượt ngưỡng tính từ trung vị và độ lệch tuyệt đối trung vị (MAD) của 7 tuần trước, nên một tuần biến động lẻ không gây báo nhầm. Kiểm chứng trên dữ liệu Olist: tỉ lệ báo nhầm khoảng 1%.</p>
          </>
        )}
      </div>
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
        {(data, meta) => {
          const full = data.slots_used >= data.slots_limit;
          const tagName = (tag: string) => tagLabel(data.tag_names?.[tag] ?? null, tag);
          const nutThem = (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-500">Đang theo dõi {count(data.slots_used)}/{count(data.slots_limit)}</span>
              <button type="button" onClick={() => setMo(true)} disabled={full} title={full ? MSG[143] : undefined} className={`${ACTION_CLASS} h-9`}>
                <Plus size={15} aria-hidden />
                Thêm shop
              </button>
            </div>
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
              {live && <CanhBaoChinh data={data} />}
              <InsightCard
                title={live ? 'Dòng thời gian hoạt động (8 tuần)' : 'Shop bạn đang theo dõi'}
                info={live ? 'Mỗi shop một làn: dấu là sản phẩm mới (hình và màu theo mức cạnh tranh với hàng của bạn), cột nhạt là số bán mỗi tuần. Bấm tên shop để xem hồ sơ, sản phẩm và khuyến mãi của họ.' : 'Shop mẫu: thêm bằng mã shop, ví dụ shp_00042.'}
                action={nutThem}
                bodyClassName="px-4 py-3"
              >
                {full && (
                  <div className="mb-3">
                    <Note tone="warn">{MSG[143]} Bỏ bớt một shop để thêm shop mới.</Note>
                  </div>
                )}
                {live ? (
                  <DongThoiGian data={data} onRemove={(id, name) => setRemoving({ id, name })} />
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
                <div className={`grid grid-cols-1 items-start gap-5 ${(data.surging?.length ?? 0) > 0 ? 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]' : ''}`}>
                  <SanPhamMoi data={data} tagName={tagName} />
                  {(data.surging?.length ?? 0) > 0 && (
                    <div className="space-y-5">{data.surging!.map(s => <TangDotBien key={s.shop_id} s={s} />)}</div>
                  )}
                </div>
              ) : (
                <Note>Sản phẩm mới và tăng trưởng đột biến chỉ có ở gian hàng thật: dữ liệu mẫu không có ngày đăng sản phẩm thật.</Note>
              )}

              <div className="px-1"><SourceFooter meta={meta} limitation={data.limitation} /></div>
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
