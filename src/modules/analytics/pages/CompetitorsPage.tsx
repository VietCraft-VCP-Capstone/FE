/**
 * Phân tích đối thủ — một trang gộp F32 (ai bán chạy), F36 (theo dõi đối thủ), F33 (điểm mạnh & điểm yếu).
 *
 * Trang tải ba API một lần rồi chia cho từng phần, để kết luận đầu trang lấy được số của cả ba.
 * Viết cho người bán mới: kế hoạch tuần này và một câu kết luận trước, chi tiết từng phần sau.
 * Gian hàng thật nhận `shop_id` từng dòng nên theo dõi được ngay trên bảng; shop mẫu thì không.
 * Đường dẫn cũ /tracking và /benchmark chuyển về đây kèm #theo-doi, #manh-yeu.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Crosshair, Radar, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { invalidateInsights, useInsight, type InsightState } from '../hooks/useInsight';
import { analyticsApi, analyticsErrorMessage } from '../services/analyticsApi';
import type { CompetitorBrief, CompetitorTracking, Competitors, ShopComparison } from '../types';
import { InsightPage } from '../components/InsightPage';
import { InsightBlock, InsightStatusView } from '../components/InsightBlock';
import { SourceFooter } from '../components/SourceFooter';
import { ACTION_CLASS, Chip, DataTable, InsightCard, Note, SelectField, Takeaway } from '../components/ui';
import { MiniStat } from '../components/charts/MiniViz';
import { BenchmarkSection, giaTri, soVoiDanDau } from '../components/competitors/BenchmarkSection';
import { MUC_DE_DOA, TrackingSection, lyDoDeDoa, thuongDau } from '../components/competitors/TrackingSection';
import { TopTwentyCharts } from '../components/competitors/TopTwentyCharts';
import { NA, decimal } from '../format';
import { categoryLabel } from '../labels';
import { count, money } from '../../../shared/utils/format';

const INSIGHTS_ROOT = '/seller/insights';

const PHAN: { id: string; icon: LucideIcon; title: string; question: string }[] = [
  { id: 'ban-chay', icon: Users, title: 'Ai đang bán chạy', question: 'Trong danh mục của tôi, ai bán chạy và tôi đứng ở đâu?' },
  { id: 'theo-doi', icon: Radar, title: 'Theo dõi đối thủ', question: 'Đối thủ tôi theo dõi vừa ra hàng gì, có đáng lo không?' },
  { id: 'manh-yeu', icon: Crosshair, title: 'Điểm mạnh & điểm yếu', question: 'So với 5 shop dẫn đầu cùng danh mục, tôi hơn và kém ở đâu?' },
];

const PILL_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-stone-700 no-underline transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none';

/** Phân vị giá đọc thành lời. Phân vị so với sản phẩm của shop khác; dưới 5 sản phẩm thì API trả null. */
function priceWords(p: number | null | undefined): string | null {
  if (p === null || p === undefined || !Number.isFinite(p)) return null;
  if (p >= 90) return 'thuộc nhóm đắt nhất danh mục';
  if (p <= 10) return 'thuộc nhóm rẻ nhất danh mục';
  return `đắt hơn ${p}% sản phẩm của shop khác cùng danh mục`;
}

function ratingCell(rating: number | null, nReviews?: number) {
  if (rating === null || rating === undefined) {
    return <span className="text-stone-500">Chưa có</span>;
  }
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold text-stone-800">{decimal(rating, 1)}</span>
      <span className="text-stone-500"> / 5</span>
      {nReviews !== undefined && <span className="text-stone-500"> ({count(nReviews)} đánh giá)</span>}
    </span>
  );
}

/** Bảng sản phẩm của shop mình: mặc định 10 dòng, mở rộng khi người bán muốn xem hết. */
function MyListingsTable({ rows }: { rows: Competitors['my_listings'] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, 10);

  return (
    <>
      <DataTable
        caption="Sản phẩm của shop bạn trong danh mục này"
        head={
          <>
            <th scope="col">Sản phẩm</th>
            <th scope="col" className="text-right">Giá</th>
            <th scope="col" className="text-right">Đã bán (90 ngày)</th>
            <th scope="col">Đánh giá</th>
            <th scope="col" className="text-right">Hạng trong danh mục</th>
          </>
        }
      >
        {shown.map(row => (
          <tr key={row.listing_id}>
            <td>
              <Link
                to={`${INSIGHTS_ROOT}/listings/${row.listing_id}`}
                title={row.title}
                className="block max-w-[34ch] truncate font-medium text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
              >
                {row.title}
              </Link>
            </td>
            <td className="text-right tabular-nums">{money(row.price_vnd)}</td>
            <td className="text-right tabular-nums">{count(row.est_sales_90d)}</td>
            <td>{ratingCell(row.rating_shrunk)}</td>
            <td className="whitespace-nowrap text-right tabular-nums text-stone-700">
              {/* 0 đơn thì hạng chỉ là thứ tự hoà, không nói lên gì. */}
              {row.est_sales_90d > 0 ? <>{count(row.rank_in_cat)} / {count(row.n_in_cat)}</> : <span className="text-stone-500">Chưa có đơn</span>}
            </td>
          </tr>
        ))}
      </DataTable>

      {rows.length > 10 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="cursor-pointer rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
          >
            {expanded ? 'Thu gọn danh sách' : `Xem tất cả ${count(rows.length)} sản phẩm`}
          </button>
        </div>
      )}
    </>
  );
}

/** AI so nội dung (tên, từ khoá, mô tả) để tìm sản phẩm shop khác giống từng sản phẩm của bạn nhất. */
function DirectRivalsCard({ listings, canTrack, trackedIds, pendingShop, onTrack, footer }: {
  listings: Competitors['my_listings'];
  canTrack: boolean;
  trackedIds: Set<string>;
  pendingShop: string | null;
  onTrack: (shopId: string, shopName: string) => void;
  footer?: React.ReactNode;
}) {
  const co = listings.filter(l => (l.direct_rivals?.length ?? 0) > 0);
  const [chon, setChon] = useState('');
  const sp = co.find(l => l.listing_id === chon) ?? co[0];
  return (
    <InsightCard
      title="Đối thủ trực tiếp của từng sản phẩm"
      description="AI đọc tên, từ khoá và mô tả để tìm sản phẩm của shop khác giống sản phẩm của bạn nhất. Chỉ so trong cùng loại hàng. Từ 35% giống trở lên là gần như cùng sản phẩm."
      footer={footer}
    >
      {!sp ? (
        <Note>AI chưa tìm thấy sản phẩm nào của shop khác đủ giống sản phẩm của bạn trong cùng loại hàng.</Note>
      ) : (
        <div className="space-y-4">
          {co.length > 1 ? (
            <SelectField label="Sản phẩm của bạn" value={sp.listing_id} onChange={setChon} options={co.map(l => ({ value: l.listing_id, label: l.title }))} />
          ) : (
            <p className="m-0 text-[13px] text-stone-600">Sản phẩm của bạn: <strong className="text-stone-900">{sp.title}</strong></p>
          )}
          <ul className="m-0 list-none space-y-3 p-0">
            {sp.direct_rivals!.map(r => (
              <li key={r.product_id} className="flex flex-wrap items-start gap-3 rounded-md border border-stone-200 bg-white px-4 py-3">
                <span className="inline-flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-[#EAF0E2] text-[#005B00]">
                  <strong className="text-base leading-none tabular-nums">{Math.round(r.similarity * 100)}%</strong>
                  <span className="text-[10px]">giống</span>
                </span>
                <div className="min-w-0 flex-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-stone-900" title={r.title ?? ''}>{r.title}</span>
                    {r.near_identical && <Chip tone="warn">Gần như cùng sản phẩm</Chip>}
                  </span>
                  <span className="block text-xs text-stone-500">
                    <Link to={`/seller/competitors/${r.shop_id}`} className="font-medium text-stone-700 no-underline hover:text-[#007700]">{r.shop_name}</Link>
                    {' · '}{r.price_vnd === null ? NA : money(r.price_vnd)}{' · '}đã bán {count(r.est_sales_90d)}
                  </span>
                  {r.reasons.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.reasons.map(x => <Chip key={x} tone="info">{x}</Chip>)}
                    </div>
                  )}
                </div>
                {canTrack && (trackedIds.has(r.shop_id) ? (
                  <Chip tone="good">Đang theo dõi</Chip>
                ) : (
                  <button type="button" onClick={() => onTrack(r.shop_id, r.shop_name ?? '')} disabled={pendingShop !== null} className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none">
                    <UserPlus size={13} aria-hidden />
                    {pendingShop === r.shop_id ? 'Đang thêm' : 'Theo dõi'}
                  </button>
                ))}
              </li>
            ))}
          </ul>
          <Note>
            Ô màu là từ mà hai sản phẩm cùng có. Độ giống tính từ nội dung sản phẩm, không tính từ giá. Hai mốc 15% (đưa vào danh sách) và 35%
            (gần như cùng sản phẩm) được đo trên 17.000 tin thật của Shopee: từ 35% trở lên, 73% đúng là cùng một sản phẩm.
          </Note>
        </div>
      )}
    </InsightCard>
  );
}

/** Kế hoạch tuần này: điều đáng làm nhất về đối thủ. Shop mẫu không có nên ẩn hẳn. */
function WeeklyPlanCard({ state, reload }: { state: InsightState<CompetitorBrief>; reload: () => void }) {
  if (state.kind === 'insufficient') return null;
  return (
    <InsightCard
      title="Kế hoạch tuần này"
      description="AI gom điều đáng chú ý nhất về đối thủ (trang này, So sánh giá, Gợi ý từ khoá) thành việc nên làm. Việc quan trọng nhất ở trên cùng."
      footer={state.kind === 'ready' && (
        <span className="text-xs text-stone-500">
          {state.data.source === 'llm'
            ? `Câu chữ do mô hình ngôn ngữ (${state.data.provider}) viết. Mọi con số đã được đối chiếu với số liệu gốc.`
            : 'Lập tự động từ số liệu phân tích. Mỗi việc đều kèm con số làm căn cứ.'}
        </span>
      )}
    >
      {state.kind !== 'ready' ? (
        <InsightStatusView state={state} onRetry={reload} compact />
      ) : state.data.actions.length === 0 ? (
        <Note>Tuần này chưa có việc gì gấp: giá, từ khoá và đối thủ của bạn đều chưa có gì đáng lo.</Note>
      ) : (
        <ol className="m-0 list-none space-y-2 p-0">
          {state.data.actions.map((a, i) => (
            <li key={i} className="flex items-start gap-3 rounded-md border border-stone-200 bg-white px-4 py-3">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] text-xs font-bold text-[#005B00]" aria-hidden>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-semibold text-stone-900">{a.action}</p>
                {a.why && <p className="m-0 mt-0.5 text-[13px] text-stone-600">{a.why}</p>}
              </div>
              {a.link && (
                <Link to={a.link} className="shrink-0 text-[13px] font-medium text-[#007700] no-underline hover:underline">Xem</Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </InsightCard>
  );
}

function PageSection({ id, icon: Icon, title, question, action, children }: (typeof PHAN)[number] & {
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-tieu-de`} className="scroll-mt-4 space-y-4 border-t border-stone-200 pt-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-tieu-de`} className="m-0 flex items-center gap-2 text-base font-bold text-stone-900">
            <Icon size={18} className="text-[#007700]" aria-hidden /> {title}
          </h2>
          <p className="mb-0 mt-1 text-[13px] text-stone-600">{question}</p>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Kết luận chung: mỗi phần góp một câu và một con số; phần nào chưa tải xong thì bỏ qua. */
function TongQuan({ comp, trk, cmp, action }: {
  comp: Competitors | null;
  trk: { data: CompetitorTracking; live: boolean } | null;
  cmp: ShopComparison | null;
  action?: React.ReactNode;
}) {
  if (!comp && !trk && !cmp) return null;
  const catName = comp ? categoryLabel(comp.category_id, comp.category_names?.[comp.category_id]) : '';
  const best = comp?.my_listings[0];
  const rival = comp?.direct_rival_shops?.[0];
  const top = comp?.competitors[0];
  const latest = trk?.data.alerts[0];
  const ss = cmp ? soVoiDanDau(cmp) : null;
  const nhom = cmp?.strategic_groups;
  const tenNhom = (id: number | null) => nhom?.groups.find(g => g.id === id)?.label;

  return (
    <>
      <Takeaway action={action}>
        {rival ? (
          <>Đối thủ trực tiếp nhất là <strong>{rival.shop_name}</strong>, có hàng giống {count(rival.overlap)} sản phẩm của bạn. </>
        ) : top && top.est_sales_90d > 0 ? (
          <>Bán chạy nhất {catName} là <strong>{top.title}</strong> của {top.shop_name}. </>
        ) : null}
        {trk && (trk.data.tracked.length === 0 ? (
          <>Bạn chưa theo dõi đối thủ nào. </>
        ) : latest ? (
          // Chỉ gọi tên khi đe doạ cao hoặc vừa; đe doạ thấp mà nêu tên là làm người bán lo thừa.
          latest.threat && latest.threat.level !== 'low' ? (
            <>Hàng mới đáng chú ý nhất: <strong>{latest.title || latest.listing_id}</strong> của {latest.shop_name || latest.shop_id} ({MUC_DE_DOA[latest.threat.level].label.toLowerCase()}: {thuongDau(lyDoDeDoa(latest.threat))}). </>
          ) : latest.threat ? (
            <>Đối thủ ra {count(trk.data.alerts_total)} sản phẩm mới cùng nhóm hàng, chưa có sản phẩm nào đe doạ đáng kể. </>
          ) : (
            <>Hàng mới nhất của đối thủ: <strong>{latest.title || latest.listing_id}</strong> của {latest.shop_name || latest.shop_id}. </>
          )
        ) : (
          <>Các shop bạn theo dõi chưa ra hàng mới cùng nhóm hàng với bạn. </>
        ))}
        {ss?.strongest && (
          <>Điểm mạnh nhất: <strong>{ss.strongest.name}</strong> (bạn {giaTri(ss.strongest.info, ss.strongest.mine)}, nhóm dẫn đầu {giaTri(ss.strongest.info, ss.strongest.group)}). </>
        )}
        {ss?.weakest && (
          <>Cần cải thiện nhất: <strong>{ss.weakest.name}</strong> (bạn {giaTri(ss.weakest.info, ss.weakest.mine)}, nhóm dẫn đầu {giaTri(ss.weakest.info, ss.weakest.group)}).</>
        )}
      </Takeaway>

      <InsightCard bodyClassName="px-4 py-3">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {comp && (
            <MiniStat
              label="Hạng bán chạy"
              value={best && best.est_sales_90d > 0 ? `${count(best.rank_in_cat)} / ${count(best.n_in_cat)}` : 'Chưa có'}
              hint={!best
                ? `Bạn chưa có sản phẩm trong ${catName}.`
                : best.est_sales_90d > 0
                  ? `Sản phẩm tốt nhất của bạn trong ${catName}.`
                  : `Chưa có đơn đã giao trong 90 ngày nên chưa xếp hạng được.`}
            />
          )}
          {trk && (
            <MiniStat
              label="Đang theo dõi"
              value={`${count(trk.data.slots_used)} / ${count(trk.data.slots_limit)} shop`}
              hint={trk.data.slots_used >= trk.data.slots_limit ? 'Đã đủ chỗ.' : undefined}
            />
          )}
          {trk && (
            <MiniStat
              label="Hàng mới của đối thủ"
              value={`${count(trk.data.alerts_total)} sản phẩm`}
              hint={trk.live ? '7 ngày qua, cùng nhóm hàng với bạn.' : 'Cùng nhóm hàng với bạn.'}
            />
          )}
          {nhom ? (
            <MiniStat
              label="Nhóm chiến lược của bạn"
              value={tenNhom(nhom.my_group)}
              hint={nhom.best_group === null ? undefined : nhom.best_group === nhom.my_group ? 'Đang là nhóm bán tốt nhất.' : `Nhóm bán tốt nhất: ${tenNhom(nhom.best_group)}.`}
            />
          ) : ss && (
            <MiniStat label="Danh mục chính" value={ss.catName} hint={`${decimal(cmp!.shops_in_segment, 0)} shop cùng danh mục.`} />
          )}
        </div>
      </InsightCard>
    </>
  );
}

export function CompetitorsPage() {
  const [params, setParams] = useSearchParams();
  const urlCategory = params.get('categoryId') || '';
  const { state, reload } = useInsight<Competitors>('/competitors', { categoryId: urlCategory || undefined });
  const tracking = useInsight<CompetitorTracking>('/competitor-tracking');
  const comparison = useInsight<ShopComparison>('/shop-comparison');
  const brief = useInsight<CompetitorBrief>('/competitor-brief');

  // Tới từ đường dẫn có #phần: cuộn tới khi mọi phần đã tải xong, để nội dung phía trên không đẩy lệch.
  const { hash, key } = useLocation();
  const daTai = [state, tracking.state, comparison.state, brief.state].every(s => s.kind !== 'loading');
  const daCuon = useRef('');
  useEffect(() => {
    if (!hash || !daTai || daCuon.current === key) return;
    daCuon.current = key;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
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

  const canTrack = state.kind === 'ready' && state.data.competitors.some(c => c.shop_id);
  const trackedIds = useMemo(
    () => new Set(tracking.state.kind === 'ready' ? tracking.state.data.tracked.map(t => t.shop_id) : []),
    [tracking.state],
  );
  const [pendingShop, setPendingShop] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);

  async function track(shopId: string, shopName: string) {
    setPendingShop(shopId);
    setNotice(null);
    try {
      await analyticsApi.trackCompetitor(shopId);
      invalidateInsights('/competitor-tracking');
      tracking.reload();
      setNotice({ tone: 'good', text: `Đã theo dõi ${shopName}. Hàng mới của shop này sẽ hiện ở phần Theo dõi đối thủ bên dưới.` });
    } catch (err) {
      setNotice({ tone: 'bad', text: analyticsErrorMessage(err, 'Không theo dõi được shop này.') });
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

  // Việc làm ngay: theo dõi đối thủ trực tiếp nhất (AI) chưa theo dõi, không có thì shop bán chạy nhất, rồi tới điểm yếu nhất.
  const nextRival = state.kind === 'ready' && canTrack && tracking.state.kind === 'ready'
    ? state.data.direct_rival_shops?.find(s => !trackedIds.has(s.shop_id))
      ?? state.data.competitors.find(c => c.shop_id && !trackedIds.has(c.shop_id))
    : undefined;
  const yeuNhat = comparison.state.kind === 'ready' ? soVoiDanDau(comparison.state.data).weakest : undefined;

  return (
    <InsightPage title="Phân tích đối thủ" question="Ai đang bán giống tôi, họ vừa ra hàng gì, và tôi hơn kém họ ở đâu?">
      <nav aria-label="Các phần trong trang">
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {PHAN.map(p => (
            <li key={p.id}>
              <a href={`#${p.id}`} className={PILL_CLASS}><p.icon size={14} aria-hidden /> {p.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <WeeklyPlanCard state={brief.state} reload={brief.reload} />

      <TongQuan
        comp={state.kind === 'ready' ? state.data : null}
        trk={tracking.state.kind === 'ready' ? { data: tracking.state.data, live: tracking.state.meta.source.mode === 'live' } : null}
        cmp={comparison.state.kind === 'ready' ? comparison.state.data : null}
        action={
          nextRival ? (
            <button
              type="button"
              onClick={() => track(nextRival.shop_id!, nextRival.shop_name ?? '')}
              disabled={pendingShop !== null}
              className={ACTION_CLASS}
            >
              <UserPlus size={15} aria-hidden />
              {pendingShop === nextRival.shop_id ? 'Đang theo dõi...' : `Theo dõi ${nextRival.shop_name}`}
            </button>
          ) : yeuNhat?.info ? (
            <Link to={yeuNhat.info.action.to} className={ACTION_CLASS}>{yeuNhat.info.action.label}</Link>
          ) : undefined
        }
      />
      {notice && (
        <p aria-live="polite" className={`m-0 text-[13px] font-medium ${notice.tone === 'good' ? 'text-[#005B00]' : 'text-red-700'}`}>
          {notice.text}
        </p>
      )}

      <PageSection
        {...PHAN[0]}
        action={options.length > 0 && <SelectField label="Danh mục" value={selected} onChange={pickCategory} options={options} />}
      >
      {state.kind !== 'ready' ? (
        <InsightCard>
          <InsightStatusView state={state} onRetry={reload} />
        </InsightCard>
      ) : (
        <InsightBlock state={state} onRetry={reload}>
          {(data, meta) => {
            const catName = categoryLabel(data.category_id, data.category_names?.[data.category_id]);
            const best = data.my_listings[0];
            const price = priceWords(data.my_position.price_percentile);

            return (
              <div className="space-y-5">

                <InsightCard
                  title="Bạn đứng ở đâu trong danh mục"
                  description={`So các sản phẩm của bạn với mọi sản phẩm thuộc ${catName}.`}
                  footer={<SourceFooter meta={meta} />}
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    <MiniStat
                      label="Giá trung bình của bạn"
                      value={data.my_position.my_avg_price_vnd === null ? NA : money(data.my_position.my_avg_price_vnd)}
                      hint={price ? `Bạn ${price}.` : undefined}
                    />
                    <MiniStat
                      label="Điểm đánh giá của bạn"
                      value={data.my_position.my_avg_rating === null ? 'Chưa có' : `${decimal(data.my_position.my_avg_rating, 1)} / 5`}
                      hint={
                        data.my_position.my_avg_rating === null
                          ? 'Chưa có khách đánh giá sản phẩm của bạn trong danh mục này.'
                          : data.my_position.rating_percentile === null
                            ? 'Chưa đủ 5 sản phẩm của shop khác có đánh giá để so.'
                            : `Cao hơn ${data.my_position.rating_percentile}% sản phẩm của shop khác cùng danh mục.`
                      }
                    />
                    <MiniStat
                      label="Sản phẩm của bạn ở đây"
                      value={`${count(data.my_listings.length)} sản phẩm`}
                    />
                    {best && (
                      <MiniStat
                        label="Sản phẩm của shop khác"
                        value={`${count(best.n_in_cat - data.my_listings.length)} sản phẩm`}
                        hint="Đang bán cùng danh mục với bạn."
                      />
                    )}
                  </div>
                </InsightCard>

                {data.direct_rival_shops !== undefined && (
                  <DirectRivalsCard
                    listings={data.my_listings}
                    canTrack={canTrack}
                    trackedIds={trackedIds}
                    pendingShop={pendingShop}
                    onTrack={track}
                    footer={<SourceFooter meta={meta} />}
                  />
                )}

                <InsightCard
                  title="20 sản phẩm bán chạy nhất của shop khác"
                  description="Xếp theo số đã bán trong 90 ngày, bằng nhau thì theo số đánh giá. Bấm Theo dõi để được báo khi shop đó ra hàng mới."
                  footer={<SourceFooter meta={meta} limitation={data.note} />}
                >
                  {data.competitors.length === 0 ? (
                    <Note>Danh mục này chưa có sản phẩm nào của người bán khác để so sánh.</Note>
                  ) : (
                    <>
                      <div className="mb-5"><TopTwentyCharts data={data} /></div>
                      <DataTable
                        caption="Hai mươi sản phẩm bán chạy nhất của shop khác trong danh mục"
                        head={
                          <>
                            <th scope="col" className="text-right">Hạng</th>
                            <th scope="col">Shop</th>
                            <th scope="col">Sản phẩm</th>
                            <th scope="col" className="text-right">Giá</th>
                            <th scope="col" className="text-right">Đã bán (90 ngày)</th>
                            <th scope="col">Đánh giá</th>
                            <th scope="col" className="text-right">Được yêu thích</th>
                            {canTrack && <th scope="col" className="text-right"><span className="sr-only">Theo dõi</span></th>}
                          </>
                        }
                      >
                        {data.competitors.map(row => (
                          <tr key={row.listing_id}>
                            <td className="text-right font-jakarta font-bold tabular-nums text-stone-900">{row.rank}</td>
                            <td>
                              {row.shop_id ? (
                                <Link
                                  to={`/seller/competitors/${row.shop_id}`}
                                  title={`Xem hồ sơ ${row.shop_name}`}
                                  className="block max-w-[24ch] truncate font-medium text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                                >
                                  {row.shop_name}
                                </Link>
                              ) : (
                                <span className="block max-w-[24ch] truncate font-medium text-stone-800" title={row.shop_name}>
                                  {row.shop_name}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="block max-w-[30ch] truncate text-stone-600" title={row.title}>
                                {row.title}
                              </span>
                            </td>
                            <td className="text-right tabular-nums">{money(row.price_vnd)}</td>
                            <td className="text-right tabular-nums">{count(row.est_sales_90d)}</td>
                            <td>{ratingCell(row.rating_shrunk, row.n_reviews)}</td>
                            <td className="text-right tabular-nums">{count(row.favorite_count)}</td>
                            {canTrack && (
                              <td className="text-right">
                                {row.shop_id && (trackedIds.has(row.shop_id) ? (
                                  <Chip tone="good">Đang theo dõi</Chip>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => track(row.shop_id!, row.shop_name)}
                                    disabled={pendingShop !== null || tracking.state.kind !== 'ready'}
                                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                  >
                                    <UserPlus size={13} aria-hidden />
                                    {pendingShop === row.shop_id ? 'Đang thêm' : 'Theo dõi'}
                                  </button>
                                ))}
                              </td>
                            )}
                          </tr>
                        ))}
                      </DataTable>
                      <div className="mt-4 space-y-2">
                        {data.competitors.some(c => c.est_sales_90d === 0) && (
                          <Note tone="warn">
                            {count(data.competitors.filter(c => c.est_sales_90d === 0).length)} sản phẩm trong bảng chưa có đơn đã giao trong 90 ngày,
                            nên được xếp theo số đánh giá. Thứ hạng của chúng chưa nói lên ai bán chạy hơn.
                          </Note>
                        )}
                        <Note>
                          {canTrack
                            ? 'Theo dõi tối đa 10 shop. Hàng mới của họ hiện ở phần '
                            : 'Bảng này chưa kèm mã shop nên không theo dõi trực tiếp từ đây được. Thêm shop ở phần '}
                          <a
                            href="#theo-doi"
                            className="inline-flex items-center gap-1 font-semibold text-[#007700] no-underline transition-colors duration-150 hover:text-[#005B00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007700] motion-reduce:transition-none"
                          >
                            <Radar size={14} aria-hidden /> Theo dõi đối thủ
                          </a>
                          {' '}bên dưới.
                        </Note>
                      </div>
                    </>
                  )}
                </InsightCard>

                <InsightCard
                  title="Sản phẩm của bạn trong danh mục này"
                  description="Hạng tính theo số đã bán trong 90 ngày, so với mọi sản phẩm cùng danh mục. Bấm tên sản phẩm để xem chi tiết."
                  footer={<SourceFooter meta={meta} limitation={data.note} />}
                >
                  {data.my_listings.length === 0 ? (
                    <Note>
                      Bạn chưa có sản phẩm nào trong danh mục {catName}. Chọn danh mục khác để xem vị trí của mình.
                    </Note>
                  ) : (
                    <MyListingsTable rows={data.my_listings} />
                  )}
                </InsightCard>
              </div>
            );
          }}
        </InsightBlock>
      )}
      </PageSection>

      <PageSection {...PHAN[1]}>
        <TrackingSection state={tracking.state} reload={tracking.reload} rivals={state.kind === 'ready' ? state.data : null} />
      </PageSection>

      <PageSection {...PHAN[2]}>
        <BenchmarkSection state={comparison.state} reload={comparison.reload} />
      </PageSection>
    </InsightPage>
  );
}
