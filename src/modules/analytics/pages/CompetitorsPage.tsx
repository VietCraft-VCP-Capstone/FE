/**
 * Phân tích đối thủ — một trang gộp F32 (bán chạy, toàn cảnh theo shop), F33 (radar SRS 3.9.2), F36 (theo dõi đối thủ).
 *
 * Bốn phần, mỗi phần ghi "Phạm vi:" ngay dưới tên (bao nhiêu shop, danh mục nào, khoảng thời gian):
 * Kế hoạch (gom việc đáng làm từ ba phần dưới) → Thị trường (toàn danh mục: top 20, phân bố giá)
 * → Đối thủ (bạn và tối đa 4 shop đang so) → Theo dõi (shop bạn chọn theo dõi).
 * Nguồn và giờ cập nhật ghi một lần ở đầu trang, cách tính và giới hạn gom ở cuối trang, lời giải thích nằm ở ⓘ.
 * Tên phần cũ (#gia, #so-sanh, #vi-the...) vẫn chạy: chuyển tới phần mới tương ứng.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUp, CalendarCheck, ChevronDown, Radar, Store, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { invalidateInsights, useInsight, type InsightState } from '../hooks/useInsight';
import { MSG, analyticsApi, analyticsErrorMessage } from '../services/analyticsApi';
import type { CompetitorBrief, CompetitorTracking, Competitors, ShopComparison } from '../types';
import { InsightPage } from '../components/InsightPage';
import { InsightBlock, InsightStatusView } from '../components/InsightBlock';
import { SourceChip } from '../components/SourceFooter';
import { Chip, InfoTip, InsightCard, Note, SelectField, type Tone } from '../components/ui';
import { RadarSRS } from '../components/competitors/BenchmarkSection';
import { CompetitorComparison, SO_COT, xepDoiThu, type KieuXem } from '../components/competitors/CompetitorComparison';
import { PriceDistribution } from '../components/competitors/PriceDistribution';
import { Top20 } from '../components/competitors/Top20';
import { TrackingSection } from '../components/competitors/TrackingSection';
import { PhanTrang, catTrang } from '../components/competitors/controls';
import { GIAI_THICH } from '../components/competitors/explanations';
import { decimal } from '../format';
import { categoryLabel } from '../labels';
import { count, dateTime } from '../../../shared/utils/format';
import { useToast } from '../../../shared/components/Toast';

/** Thanh điều hướng: bốn phần theo thứ tự đọc. */
const MUC: { id: string; icon: LucideIcon; nav: string }[] = [
  { id: 'tong-quan', icon: CalendarCheck, nav: 'Kế hoạch' },
  { id: 'thi-truong', icon: Store, nav: 'Thị trường' },
  { id: 'doi-thu', icon: Users, nav: 'Đối thủ' },
  { id: 'theo-doi', icon: Radar, nav: 'Theo dõi' },
];

/** Tên phần cũ còn nằm trong link, thông báo và bookmark. */
const TEN_CU: Record<string, string> = {
  'ban-chay': 'thi-truong', gia: 'thi-truong', 'so-sanh': 'doi-thu', 'vi-the': 'doi-thu', 'manh-yeu': 'doi-thu',
};

const PILL_CLASS =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-stone-700 no-underline transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none';
const PILL_DANG_XEM = '!border-[#007700] !bg-[#007700] !text-white';

const MO_PHAN = 'doi-thu:mo-phan';

/** Cuộn đúng khung nội dung của khu người bán, không kéo cả cửa sổ (mất thanh tiêu đề). Chừa chỗ cho thanh dính. */
function cuonToi(idGoc: string) {
  const id = TEN_CU[idGoc] ?? idGoc;
  const el = document.getElementById(id);
  if (!el) return;
  // Phần đang thu gọn thì mở ra trước, để nhảy tới là thấy nội dung.
  window.dispatchEvent(new CustomEvent(MO_PHAN, { detail: id }));
  const khung = el.closest('.seller-content');
  const muot = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!(khung instanceof HTMLElement)) {
    el.scrollIntoView({ block: 'start' });
  } else {
    const top = id === MUC[0].id ? 0 : el.getBoundingClientRect().top - khung.getBoundingClientRect().top + khung.scrollTop - 64;
    khung.scrollTo({ top, behavior: muot ? 'smooth' : 'auto' });
  }
  if (id !== MUC[0].id) nhayLen(el, muot);
}

/** Nháy viền xanh hai lần ở phần vừa cuộn tới, để người dùng biết mình đang đứng ở đâu. Chờ cuộn mượt xong mới nháy. */
function nhayLen(el: HTMLElement, muot: boolean) {
  const tat = { boxShadow: '0 0 0 3px rgba(0, 119, 0, 0)', backgroundColor: 'rgba(234, 240, 226, 0)', borderRadius: '8px' };
  const sang = { boxShadow: '0 0 0 3px rgba(0, 119, 0, 0.45)', backgroundColor: 'rgba(234, 240, 226, 0.7)', borderRadius: '8px' };
  el.animate?.([tat, sang, tat, sang, tat], { duration: 1600, delay: muot ? 450 : 0, easing: 'ease-in-out' });
}

/** Mọi link #phần trong trang đi qua cuonToi; vẫn giữ href để mở tab mới hoặc chép link được. */
function bamNeo(e: React.MouseEvent) {
  const a = (e.target as HTMLElement).closest('a[href^="#"]');
  const goc = a?.getAttribute('href')?.slice(1);
  const id = goc ? TEN_CU[goc] ?? goc : undefined;
  if (!id || !document.getElementById(id)) return;
  e.preventDefault();
  window.history.replaceState(window.history.state, '', `#${id}`);
  cuonToi(id);
}

/** Thanh nút dính trên đầu khi cuộn; nút của phần đang xem được tô xanh. Màn rộng có thêm ô danh mục chung cho cả trang. */
function ThanhDieuHuong({ dang, loc }: { dang: string; loc?: React.ReactNode }) {
  return (
    // -top-6 bù 24px đệm trên của khung cuộn, để thanh nằm sát mép, không lộ nội dung phía trên.
    <nav aria-label="Các phần trong trang" className="sticky -top-6 z-20 -mx-2 border-b border-stone-200 bg-[#f8fafb] px-2 py-2">
      <div className="flex items-center gap-2">
        <ul className="m-0 flex min-w-0 flex-1 list-none gap-2 overflow-x-auto p-0">
          {MUC.map(m => (
            <li key={m.id} className="shrink-0">
              <a href={`#${m.id}`} aria-current={dang === m.id ? 'location' : undefined} className={`${PILL_CLASS} ${dang === m.id ? PILL_DANG_XEM : ''}`}>
                <m.icon size={14} aria-hidden /> {m.nav}
              </a>
            </li>
          ))}
        </ul>
        {/* Màn hẹp không đủ chỗ: ô danh mục nằm ở đầu trang thay vì trên thanh. */}
        {loc && <div className="hidden shrink-0 xl:block">{loc}</div>}
        {dang !== 'tong-quan' && (
          <a href="#tong-quan" className={`${PILL_CLASS} shrink-0`} title="Lên đầu trang" aria-label="Lên đầu trang">
            <ArrowUp size={14} aria-hidden />
          </a>
        )}
      </div>
    </nav>
  );
}

/** Theo dõi phần nào đang nằm ở khoảng 15–30% chiều cao khung cuộn, để tô sáng nút tương ứng. */
function usePhanDangXem() {
  const [dang, setDang] = useState(MUC[0].id);
  useEffect(() => {
    const els = MUC.map(m => document.getElementById(m.id)).filter((e): e is HTMLElement => e !== null);
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const thay = new Map<string, boolean>();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => thay.set(e.target.id, e.isIntersecting));
      const dau = MUC.find(m => thay.get(m.id));
      if (dau) setDang(dau.id);
    }, { root: els[0].closest('.seller-content'), rootMargin: '-15% 0px -70% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
  return dang;
}

const MUC_UU_TIEN: Record<NonNullable<CompetitorBrief['actions'][number]['priority']>, { label: string; tone: Tone }> = {
  gap: { label: 'Khẩn cấp', tone: 'bad' },
  quan_trong: { label: 'Quan trọng', tone: 'warn' },
  // Xám chứ không xanh lam: xanh lam trên trang này dành cho đối thủ.
  nen_lam: { label: 'Khuyến nghị', tone: 'neutral' },
  duy_tri: { label: 'Duy trì', tone: 'good' },
};

const NUT_XEM =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#007700] no-underline transition-colors duration-150 hover:border-[#007700] hover:bg-[#EAF0E2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none';

/** Phần thu gọn hay mở: nhớ theo từng phần trên máy người dùng; nhảy tới phần (bấm Xem, link #phần) thì tự mở. */
function useMoPhan(id: string) {
  const khoa = `vc-doi-thu-thu-gon:${id}`;
  const [mo, datMo] = useState(() => {
    try {
      return localStorage.getItem(khoa) !== '1';
    } catch {
      return true;
    }
  });
  const doi = (v: boolean) => {
    datMo(v);
    try {
      if (v) localStorage.removeItem(khoa);
      else localStorage.setItem(khoa, '1');
    } catch {
      // trình duyệt chặn lưu thì chỉ không nhớ được lần sau
    }
  };
  useEffect(() => {
    const nghe = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) return;
      datMo(true);
      try {
        localStorage.removeItem(khoa);
      } catch {
        // như trên
      }
    };
    window.addEventListener(MO_PHAN, nghe);
    return () => window.removeEventListener(MO_PHAN, nghe);
  }, [id, khoa]);
  return [mo, doi] as const;
}

function NutThuGon({ mo, onDoi, ten, controls }: { mo: boolean; onDoi: () => void; ten: string; controls: string }) {
  return (
    <button
      type="button"
      onClick={onDoi}
      aria-expanded={mo}
      aria-controls={controls}
      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
    >
      {mo ? 'Thu gọn' : 'Mở rộng'}
      <span className="sr-only"> phần {ten}</span>
      <ChevronDown size={14} className={`transition-transform duration-150 motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`} aria-hidden />
    </button>
  );
}

/** Một phần của trang: tên, dòng "Phạm vi:" (dữ liệu nào, bao nhiêu shop, bao lâu), nút thu gọn. */
function PageSection({ id, icon: Icon, title, info, pham, action, dau, children }: {
  id: string;
  icon: LucideIcon;
  title: string;
  info?: string;
  pham?: string;
  action?: React.ReactNode;
  /** Phần đầu tiên nằm ngay dưới thanh dính: không kẻ vạch ngăn phía trên. */
  dau?: boolean;
  children: React.ReactNode;
}) {
  const [mo, doi] = useMoPhan(id);
  return (
    <section id={id} aria-labelledby={`${id}-tieu-de`} className={`scroll-mt-16 space-y-4 ${dau ? 'pt-2' : 'border-t border-stone-200 pt-8'}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] text-[#007700]" aria-hidden>
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-tieu-de`} className="m-0 flex items-center gap-1.5 font-jakarta text-lg font-bold leading-tight text-stone-900">
              {title}
              {/* Ô rộng 400px bị cắt mép trên điện thoại 390px, nên chặn bề rộng theo màn hình. */}
              {info && <InfoTip text={<span className="block max-w-[calc(100vw-3rem)]">{info}</span>} label={`Giải thích: ${title}`} wide />}
            </h2>
            {pham && (
              <p className="m-0 mt-0.5 text-[13px] text-stone-600"><strong className="font-semibold text-stone-900">Phạm vi:</strong> {pham}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mo && action}
          <NutThuGon mo={mo} onDoi={() => doi(!mo)} ten={title} controls={`${id}-noi-dung`} />
        </div>
      </header>
      {mo && <div id={`${id}-noi-dung`} className="space-y-4">{children}</div>}
    </section>
  );
}

/** Kế hoạch hành động: tối đa 10 việc API đã xếp từ khẩn cấp tới duy trì, 5 việc mỗi trang. Shop mẫu không có nên ẩn hẳn. */
function WeeklyPlanCard({ state, reload }: { state: InsightState<CompetitorBrief>; reload: () => void }) {
  const [trang, setTrang] = useState(1);
  // Vẫn giữ mốc #tong-quan để nút "Lên đầu trang" chạy được.
  if (state.kind === 'insufficient') return <div id="tong-quan" />;
  const viec = state.kind === 'ready' ? state.data.actions : [];
  const { t, dau, rows } = catTrang(viec, trang);
  return (
    <PageSection
      id="tong-quan"
      dau
      icon={CalendarCheck}
      title={viec.length ? `Kế hoạch hành động · ${count(viec.length)} việc` : 'Kế hoạch hành động'}
      info={GIAI_THICH.keHoach}
      pham="tổng hợp từ 3 phần bên dưới, xếp theo mức gấp"
    >
      {state.kind !== 'ready' ? (
        <InsightCard>
          <InsightStatusView state={state} onRetry={reload} compact />
        </InsightCard>
      ) : viec.length === 0 ? (
        <Note>Tuần này chưa có việc gì cần làm: giá, từ khoá và đối thủ của bạn đều chưa có gì đáng lo.</Note>
      ) : (
        <div className="space-y-3">
          <ol className="m-0 list-none space-y-2 p-0" start={dau + 1}>
            {rows.map((a, i) => (
              <li key={dau + i} className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-lg border border-stone-200 bg-white px-4 py-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-700" aria-hidden>
                  {dau + i + 1}
                </span>
                {/* Màn hẹp: chữ chiếm hết dòng, nút Xem xuống dòng dưới thay vì bóp chữ còn một từ mỗi dòng. */}
                <div className="min-w-0 flex-1 basis-[12rem]">
                  <div className="flex flex-wrap items-start gap-2">
                    {a.priority && MUC_UU_TIEN[a.priority] && <Chip tone={MUC_UU_TIEN[a.priority].tone}>{MUC_UU_TIEN[a.priority].label}</Chip>}
                    <p className="m-0 min-w-0 flex-1 basis-[10rem] text-sm font-semibold text-stone-900">{a.action}</p>
                  </div>
                  {/* Căn cứ (con số) là chi tiết: bấm mới hiện, để danh sách đọc lướt được. */}
                  {a.why && (
                    <details className="mt-1 text-[13px] text-stone-600">
                      <summary className="w-fit cursor-pointer text-xs font-semibold text-stone-500 hover:text-[#007700]">Vì sao?</summary>
                      <p className="m-0 mt-1 leading-relaxed">{a.why}</p>
                    </details>
                  )}
                </div>
                {a.link && (
                  <Link to={a.link} className={`${NUT_XEM} ml-9 sm:ml-0`}>
                    Xem <ArrowRight size={13} aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ol>
          <PhanTrang trang={t} tong={viec.length} onDoi={setTrang} nhan="Các trang của kế hoạch hành động" />
        </div>
      )}
    </PageSection>
  );
}

export function CompetitorsPage() {
  const [params, setParams] = useSearchParams();
  const urlCategory = params.get('categoryId') || '';
  // Việc "Rà soát giá" của kế hoạch dẫn tới đây kèm ?loai= để phân bố giá mở đúng loại hàng của việc đó.
  const loaiUrl = params.get('loai') || undefined;
  const { state, reload } = useInsight<Competitors>('/competitors', { categoryId: urlCategory || undefined });
  const tracking = useInsight<CompetitorTracking>('/competitor-tracking');
  const comparison = useInsight<ShopComparison>('/shop-comparison');
  const brief = useInsight<CompetitorBrief>('/competitor-brief');
  const dangXem = usePhanDangXem();

  // Tới từ đường dẫn có #phần: cuộn tới khi mọi phần đã tải xong, để nội dung phía trên không đẩy lệch.
  const { hash, key } = useLocation();
  const daTai = [state, tracking.state, comparison.state, brief.state].every(s => s.kind !== 'loading');
  const daCuon = useRef('');
  useEffect(() => {
    if (!hash || !daTai || daCuon.current === key) return;
    daCuon.current = key;
    cuonToi(hash.slice(1));
  }, [hash, key, daTai]);

  // Service tự chọn danh mục chính khi không truyền categoryId; nhớ lại để ô chọn không trống.
  const [resolved, setResolved] = useState<{
    id: string;
    list: string[];
    names: Record<string, string | null>;
    types: Record<string, string[]>;
  } | null>(null);
  useEffect(() => {
    if (state.kind === 'ready') {
      const d = state.data;
      setResolved({ id: d.category_id, list: d.available_categories, names: d.category_names ?? {}, types: d.my_types_by_category ?? {} });
    }
  }, [state]);

  // Ô chọn ghi kèm loại hàng của bạn: "Áo (Áo thun, Hoodie)", để thấy vì sao 3 loại hàng chỉ là 2 danh mục.
  const options = useMemo(() => {
    const ids = resolved?.list.length ? resolved.list : urlCategory ? [urlCategory] : [];
    return ids
      .map(id => {
        const ten = categoryLabel(id, resolved?.names[id]);
        const loai = resolved?.types[id] ?? [];
        return { value: id, ten, label: loai.length ? `${ten} (${loai.join(', ')})` : ten };
      })
      .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  }, [resolved, urlCategory]);

  const selected = urlCategory || resolved?.id || '';
  const tenDm = selected ? categoryLabel(selected, resolved?.names[selected]) : '';

  // Tập shop đang so (null = mặc định) và shop đặt cạnh bạn ở biểu đồ / màn hẹp; đổi danh mục thì về mặc định.
  const [xem, setXem] = useState<KieuXem>('bang');
  const [chonIds, setChonIds] = useState<string[] | null>(null);
  const [chon, setChon] = useState<string | null>(null);
  useEffect(() => {
    setChonIds(null);
    setChon(null);
  }, [selected]);

  const canTrack = state.kind === 'ready' && state.data.competitors.some(c => c.shop_id);
  const trackedIds = useMemo(
    () => new Set(tracking.state.kind === 'ready' ? tracking.state.data.tracked.map(t => t.shop_id) : []),
    [tracking.state],
  );
  const full = tracking.state.kind === 'ready' && tracking.state.data.slots_used >= tracking.state.data.slots_limit;
  const [pendingShop, setPendingShop] = useState<string | null>(null);
  const khoa = pendingShop !== null || tracking.state.kind !== 'ready';
  const { showToast } = useToast();

  async function track(shopId: string, shopName: string) {
    setPendingShop(shopId);
    try {
      await analyticsApi.trackCompetitor(shopId);
      invalidateInsights('/competitor-tracking');
      tracking.reload();
      showToast(`Đã theo dõi ${shopName}. Sản phẩm mới của shop này sẽ hiện ở phần Theo dõi.`, 'success');
    } catch (err) {
      showToast(analyticsErrorMessage(err, MSG[145]), 'error');
    } finally {
      setPendingShop(null);
    }
  }

  function pickCategory(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('categoryId', value);
    else next.delete('categoryId');
    setParams(next);
  }

  // Một ô danh mục cho cả trang: màn rộng nằm trên thanh dính, màn hẹp ở đầu trang (không nằm trong một phần thu gọn được).
  const oDanhMuc = options.length > 0 ? <SelectField label="Danh mục" value={selected} onChange={pickCategory} options={options} /> : null;
  const loiF32 = (
    <InsightCard>
      <InsightStatusView state={state} onRetry={reload} errorText={MSG[136]} />
    </InsightCard>
  );
  const shops = state.kind === 'ready' ? state.data.shops ?? [] : [];
  const cr3 = state.kind === 'ready' ? state.data.concentration_top3_pct : undefined;
  const xep = xepDoiThu(shops, trackedIds);
  const ds = chonIds ? xep.filter(s => chonIds.includes(s.shop_id)) : xep.slice(0, SO_COT);

  // Dòng "Phạm vi:" của từng phần. Radar theo SRS 3.9.2 có tập shop riêng nên ghi riêng.
  const phamThiTruong = !tenDm ? undefined : xep.length > 0
    ? `toàn danh mục ${tenDm} · ${count(xep.reduce((t, s) => t + s.n_listings, 0))} sản phẩm của ${count(xep.length)} shop khác · 90 ngày`
    : `toàn danh mục ${tenDm} · 90 ngày`;
  const ss = comparison.state.kind === 'ready' ? comparison.state.data : null;
  const phamRadar = ss
    ? `${count(ss.competitors.length)} shop ${ss.ranked_by === 'reviews' ? 'nhiều đánh giá nhất' : 'doanh thu cao nhất'} · danh mục ${categoryLabel(ss.segment, ss.segment_name)} · 90 ngày`
    : undefined;
  const phamDoiThu = xem === 'radar' || shops.length === 0
    ? phamRadar
    : `${count(ds.length)} shop bạn đang so · danh mục ${tenDm} · ${xem === 'tuan' ? '8 tuần' : '90 ngày'}`;
  const phamTheoDoi = tracking.state.kind === 'ready'
    ? `${count(tracking.state.data.slots_used)}/${count(tracking.state.data.slots_limit)} shop bạn chọn theo dõi · 8 tuần`
    : undefined;

  // BR-187: một dòng nguồn và giờ quét cho cả trang, lấy theo F32 (Kế hoạch là dữ liệu kết hợp nên không dùng).
  const nguon = state.kind === 'ready' ? state.meta : null;
  const dauTrang = (
    <>
      {nguon?.source && <SourceChip mode={nguon.source.mode} />}
      {nguon?.computed_at && <span className="text-[13px] text-stone-600">Cập nhật lần cuối {dateTime(nguon.computed_at)}</span>}
      {oDanhMuc && <div className="xl:hidden">{oDanhMuc}</div>}
    </>
  );
  const ghiChu = [
    state.kind === 'ready' && state.data.note ? { ten: 'Lượng bán', text: state.data.note } : null,
    tracking.state.kind === 'ready' && tracking.state.data.limitation ? { ten: 'Theo dõi', text: tracking.state.data.limitation } : null,
  ].filter((g): g is { ten: string; text: string } => g !== null);

  return (
    <InsightPage title="Phân tích đối thủ" actions={dauTrang}>
      <div className="space-y-4" onClickCapture={bamNeo}>
      <ThanhDieuHuong dang={dangXem} loc={oDanhMuc} />

      {/* Đầu trang chỉ một bản tóm tắt: kế hoạch hành động đã gom điều đáng làm từ mọi phần, mỗi việc có nút tới đúng chỗ. */}
      <WeeklyPlanCard state={brief.state} reload={brief.reload} />

      <PageSection
        id="thi-truong"
        icon={Store}
        title="Thị trường"
        pham={phamThiTruong}
        action={cr3 !== undefined && shops.length > 3 && <Chip tone="neutral">Top 3 shop chiếm {decimal(cr3, 0)}% lượng bán</Chip>}
      >
        {state.kind !== 'ready' ? loiF32 : (
          <InsightBlock state={state} onRetry={reload}>
            {data => (
              <div className="space-y-5">
                {/* SRS 3.9.1 trước, phần bổ sung (phân bố giá) sau. key theo danh mục: đổi danh mục thì bộ lọc, trang đang xem về mặc định. */}
                <Top20 key={`top-${data.category_id}`} data={data} canTrack={canTrack} trackedIds={trackedIds} pendingShop={pendingShop} khoa={khoa} full={full} onTrack={track} />
                {(data.price_points?.length ?? 0) > 0 && (
                  // Có ?loai= thì mỗi lần bấm "Xem" (key điều hướng mới) chọn lại loại hàng và mở sẵn biểu đồ.
                  <PriceDistribution key={`gia-${data.category_id}-${loaiUrl ? key : ''}`} points={data.price_points!} khac={data.price_points_other} tenDm={tenDm} loaiBanDau={loaiUrl} moSan={Boolean(loaiUrl)} />
                )}
              </div>
            )}
          </InsightBlock>
        )}
      </PageSection>

      <PageSection id="doi-thu" icon={Users} title="Đối thủ" info={GIAI_THICH.doiThu} pham={phamDoiThu}>
        {state.kind !== 'ready' ? loiF32 : shops.length === 0 ? (
          // Shop mẫu không có toàn cảnh theo shop: vẫn có radar SRS 3.9.2.
          <InsightCard>
            <RadarSRS state={comparison.state} reload={comparison.reload} />
          </InsightCard>
        ) : (
          <CompetitorComparison
            shops={shops}
            xep={xep}
            ds={ds}
            laMacDinh={chonIds === null}
            onDoiTap={setChonIds}
            xem={xem}
            onXem={setXem}
            chon={chon}
            onChon={setChon}
            tenDm={tenDm}
            comparison={comparison}
            canTrack={canTrack}
            trackedIds={trackedIds}
            theoDoi={tracking.state.kind === 'ready' ? tracking.state.data.tracked : []}
            pendingShop={pendingShop}
            khoa={khoa}
            full={full}
            onTrack={track}
          />
        )}
      </PageSection>

      <PageSection id="theo-doi" icon={Radar} title="Theo dõi" pham={phamTheoDoi}>
        <TrackingSection state={tracking.state} reload={tracking.reload} rivals={state.kind === 'ready' ? state.data : null} />
      </PageSection>

      {ghiChu.length > 0 && (
        <details className="rounded-md border border-stone-200 bg-white px-4 py-3 text-[13px] text-stone-600">
          <summary className="w-fit cursor-pointer text-xs font-semibold text-stone-600 hover:text-[#007700]">Cách tính và giới hạn</summary>
          <div className="mt-2 space-y-1.5 leading-relaxed">
            {ghiChu.map(g => (
              <p key={g.ten} className="m-0"><strong className="text-stone-700">{g.ten}:</strong> {g.text}</p>
            ))}
          </div>
        </details>
      )}
      </div>
    </InsightPage>
  );
}
