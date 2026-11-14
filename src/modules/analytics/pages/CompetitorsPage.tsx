/**
 * Phân tích đối thủ — một trang gộp F32 (bán chạy, toàn cảnh theo shop), F33 (radar SRS 3.9.2), F36 (theo dõi đối thủ).
 *
 * Thứ tự: kế hoạch hành động (gom điều đáng làm từ mọi phần) → vị thế cạnh tranh (bản đồ giá × lượng bán)
 * → so sánh với đối thủ (bảng, kiểu xem radar) → phân tích giá thị trường (giá nào bán được, top 20)
 * → theo dõi hoạt động đối thủ. Mỗi điều nói một lần; chi tiết phụ ẩn sau nút.
 * Tên phần cũ (#ban-chay, #doi-thu, #manh-yeu) vẫn chạy: chuyển tới phần mới tương ứng.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUp, CalendarCheck, ChevronDown, Crosshair, Radar, Scale, Tags } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { invalidateInsights, useInsight, type InsightState } from '../hooks/useInsight';
import { MSG, analyticsApi, analyticsErrorMessage } from '../services/analyticsApi';
import type { CompetitorBrief, CompetitorTracking, Competitors, ShopComparison } from '../types';
import { InsightPage } from '../components/InsightPage';
import { InsightBlock, InsightStatusView } from '../components/InsightBlock';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, InsightCard, Note, SelectField, type Tone } from '../components/ui';
import { RadarSRS } from '../components/competitors/BenchmarkSection';
import { BangSoSanh, chonCot, type CheDo } from '../components/competitors/BangSoSanh';
import { PhanTichGia } from '../components/competitors/PhanTichGia';
import { Top20 } from '../components/competitors/Top20';
import { TrackingSection } from '../components/competitors/TrackingSection';
import { ViTheCanhTranh } from '../components/competitors/ViTheCanhTranh';
import { PhanTrang, catTrang } from '../components/competitors/dieuKhien';
import { GIAI_THICH } from '../components/competitors/giaiThich';
import { categoryLabel } from '../labels';
import { count } from '../../../shared/utils/format';
import { useToast } from '../../../shared/components/Toast';

// Thứ tự theo quy trình phân tích đối thủ: biết mình đứng đâu → so với từng đối thủ → xem giá thị trường → theo dõi.
const PHAN: { id: string; icon: LucideIcon; title: string; nav: string; question: string }[] = [
  { id: 'vi-the', icon: Crosshair, title: 'Vị thế cạnh tranh', nav: 'Vị thế cạnh tranh', question: 'Xem giá và lượng bán của bạn so với các shop cùng danh mục.' },
  { id: 'so-sanh', icon: Scale, title: 'So sánh với đối thủ cạnh tranh', nav: 'So sánh đối thủ', question: 'So sánh bạn với từng đối thủ theo các tiêu chí chính.' },
  { id: 'gia', icon: Tags, title: 'Phân tích giá thị trường', nav: 'Phân tích giá', question: 'Xem khoảng giá đang bán chạy và giá của bạn nằm ở đâu.' },
  { id: 'theo-doi', icon: Radar, title: 'Theo dõi hoạt động đối thủ', nav: 'Theo dõi đối thủ', question: 'Xem đối thủ bạn theo dõi vừa ra mẫu gì và bán ra sao.' },
];
const PHAN_THEO_ID = Object.fromEntries(PHAN.map(p => [p.id, p]));

/** Thanh điều hướng: đầu trang + các phần. */
const MUC: { id: string; icon: LucideIcon; nav: string }[] = [
  { id: 'tong-quan', icon: CalendarCheck, nav: 'Kế hoạch hành động' },
  ...PHAN.map(({ id, icon, nav }) => ({ id, icon, nav })),
];

/** Tên phần cũ còn nằm trong link, thông báo và bookmark. */
const TEN_CU: Record<string, string> = { 'ban-chay': 'gia', 'doi-thu': 'so-sanh', 'manh-yeu': 'so-sanh' };

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

/** Thanh nút dính trên đầu khi cuộn; nút của phần đang xem được tô xanh. Ô danh mục chung cho cả trang. */
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
        {/* Màn hẹp không đủ chỗ: ô danh mục nằm ở đầu phần Vị thế cạnh tranh thay vì trên thanh. */}
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
  nen_lam: { label: 'Khuyến nghị', tone: 'info' },
  duy_tri: { label: 'Duy trì', tone: 'good' },
};

const NUT_XEM =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#007700] no-underline transition-colors duration-150 hover:border-[#007700] hover:bg-[#EAF0E2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none';

/** Kế hoạch hành động tuần này: tối đa 10 việc API đã xếp từ khẩn cấp tới duy trì, 5 việc mỗi trang. Shop mẫu không có nên ẩn hẳn. */
function WeeklyPlanCard({ state, reload }: { state: InsightState<CompetitorBrief>; reload: () => void }) {
  const [trang, setTrang] = useState(1);
  if (state.kind === 'insufficient') return null;
  const viec = state.kind === 'ready' ? state.data.actions : [];
  const { t, dau, rows } = catTrang(viec, trang);
  return (
    <InsightCard
      title={viec.length ? `Kế hoạch hành động tuần này · ${count(viec.length)} việc` : 'Kế hoạch hành động tuần này'}
      info={GIAI_THICH.keHoach}
      footer={state.kind === 'ready' && (
        <span className="text-xs text-stone-500">Tự động lập từ dữ liệu phân tích, xếp theo mức ưu tiên.</span>
      )}
    >
      {state.kind !== 'ready' ? (
        <InsightStatusView state={state} onRetry={reload} compact />
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
                    {a.priority && <Chip tone={MUC_UU_TIEN[a.priority].tone}>{MUC_UU_TIEN[a.priority].label}</Chip>}
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
    </InsightCard>
  );
}

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

function PageSection({ id, icon: Icon, title, question, action, children }: (typeof PHAN)[number] & {
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mo, doi] = useMoPhan(id);
  return (
    <section id={id} aria-labelledby={`${id}-tieu-de`} className="scroll-mt-16 space-y-4 border-t border-stone-200 pt-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] text-[#007700]" aria-hidden>
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <h2 id={`${id}-tieu-de`} className="m-0 font-jakarta text-lg font-bold leading-tight text-stone-900">{title}</h2>
            <p className="mb-0 mt-1 text-[13px] text-stone-600">{question}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mo && action}
          <button
            type="button"
            onClick={() => doi(!mo)}
            aria-expanded={mo}
            aria-controls={`${id}-noi-dung`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
          >
            {mo ? 'Thu gọn' : 'Mở rộng'}
            <span className="sr-only"> phần {title}</span>
            <ChevronDown size={14} className={`transition-transform duration-150 motion-reduce:transition-none ${mo ? 'rotate-180' : ''}`} aria-hidden />
          </button>
        </div>
      </header>
      {mo && <div id={`${id}-noi-dung`} className="space-y-4">{children}</div>}
    </section>
  );
}

export function CompetitorsPage() {
  const [params, setParams] = useSearchParams();
  const urlCategory = params.get('categoryId') || '';
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
  const [resolved, setResolved] = useState<{ id: string; list: string[]; names: Record<string, string | null> } | null>(null);
  useEffect(() => {
    if (state.kind === 'ready') {
      setResolved({ id: state.data.category_id, list: state.data.available_categories, names: state.data.category_names ?? {} });
    }
  }, [state]);

  const options = useMemo(() => {
    const ids = resolved?.list.length ? resolved.list : urlCategory ? [urlCategory] : [];
    return ids
      .map(id => ({ value: id, label: categoryLabel(id, resolved?.names[id]) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [resolved, urlCategory]);

  const selected = urlCategory || resolved?.id || '';

  // Shop chọn trên bản đồ hiện thành một cột của bảng so sánh; đổi danh mục thì bỏ chọn.
  const [cheDo, setCheDo] = useState<CheDo>('truc-tiep');
  const [chon, setChon] = useState<string | null>(null);
  useEffect(() => setChon(null), [selected]);

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
      showToast(`Đã theo dõi ${shopName}. Sản phẩm mới của shop này sẽ hiện ở phần Theo dõi hoạt động đối thủ.`, 'success');
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

  // Một ô danh mục cho cả trang: màn rộng nằm trên thanh dính, màn hẹp ở đầu phần Vị thế cạnh tranh.
  const oDanhMuc = options.length > 0 ? <SelectField label="Danh mục" value={selected} onChange={pickCategory} options={options} /> : null;
  const loiF32 = (
    <InsightCard>
      <InsightStatusView state={state} onRetry={reload} errorText={MSG[136]} />
    </InsightCard>
  );
  const shops = state.kind === 'ready' ? state.data.shops ?? [] : [];
  const tenDm = state.kind === 'ready' ? categoryLabel(state.data.category_id, state.data.category_names?.[state.data.category_id] ?? null) : '';
  const chiShopThat = (
    <InsightCard bodyClassName="px-4 py-3">
      <Note>Phần này tính từ đơn hàng và ngày đăng thật trên sàn nên chỉ có ở gian hàng thật.</Note>
    </InsightCard>
  );

  return (
    <InsightPage title="Phân tích đối thủ" question="Đối thủ đang làm gì và bạn đứng ở đâu so với họ.">
      <div className="space-y-4" onClickCapture={bamNeo}>
      <ThanhDieuHuong dang={dangXem} loc={oDanhMuc} />

      {/* Đầu trang chỉ một bản tóm tắt: kế hoạch hành động đã gom điều đáng làm từ mọi phần, mỗi việc có nút tới đúng chỗ. */}
      <div id="tong-quan" className="scroll-mt-16">
        <WeeklyPlanCard state={brief.state} reload={brief.reload} />
      </div>

      <PageSection {...PHAN_THEO_ID['vi-the']} action={oDanhMuc && <div className="xl:hidden">{oDanhMuc}</div>}>
        {state.kind !== 'ready' ? loiF32 : shops.length === 0 ? chiShopThat : (
          <>
            {/* MSG137: chỉ báo khi bạn không bán gì ở danh mục đang xem. */}
            {state.data.my_listings.length === 0 && <Note>{MSG[137]} Chọn danh mục khác để so với đối thủ.</Note>}
            <ViTheCanhTranh
              shops={shops}
              cr3={state.data.concentration_top3_pct}
              tenDanhMuc={tenDm}
              trongBang={new Set(chonCot(shops, cheDo, chon).map(s => s.shop_id))}
              chon={chon}
              onChon={setChon}
            />
          </>
        )}
      </PageSection>

      <PageSection {...PHAN_THEO_ID['so-sanh']}>
        {state.kind !== 'ready' ? loiF32 : shops.length === 0 ? (
          // Shop mẫu không có toàn cảnh theo shop: vẫn có radar SRS 3.9.2.
          <InsightCard title="So sánh shop với đối thủ cùng phân khúc">
            <RadarSRS state={comparison.state} reload={comparison.reload} />
          </InsightCard>
        ) : (
          <BangSoSanh
            shops={shops}
            cheDo={cheDo}
            onCheDo={setCheDo}
            chon={chon}
            onChon={setChon}
            comparison={comparison}
            canTrack={canTrack}
            trackedIds={trackedIds}
            pendingShop={pendingShop}
            khoa={khoa}
            full={full}
            onTrack={track}
            footer={<SourceFooter meta={state.meta} />}
          />
        )}
      </PageSection>

      <PageSection {...PHAN_THEO_ID['gia']}>
        {state.kind !== 'ready' ? loiF32 : (
          <InsightBlock state={state} onRetry={reload}>
            {(data, meta) => (
              <div className="space-y-5">
                {/* key theo danh mục: đổi danh mục thì bộ lọc, trang đang xem về mặc định. */}
                {(data.price_points?.length ?? 0) > 0 && <PhanTichGia key={`gia-${data.category_id}`} points={data.price_points!} />}
                <Top20 key={`top-${data.category_id}`} data={data} canTrack={canTrack} trackedIds={trackedIds} pendingShop={pendingShop} khoa={khoa} full={full} onTrack={track} />
                {/* Một dòng nguồn cho cả phần, thay vì lặp ở từng thẻ. */}
                <div className="px-1"><SourceFooter meta={meta} limitation={data.note} /></div>
              </div>
            )}
          </InsightBlock>
        )}
      </PageSection>

      <PageSection {...PHAN_THEO_ID['theo-doi']}>
        <TrackingSection state={tracking.state} reload={tracking.reload} rivals={state.kind === 'ready' ? state.data : null} />
      </PageSection>
      </div>
    </InsightPage>
  );
}
