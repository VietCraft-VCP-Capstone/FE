import { useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { editLink } from '../components/HealthParts';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { ACTION_CLASS } from '../components/ui';
import { IntelReport } from '../components/intel/IntelReport';
import { TrendCalendar } from '../components/intel/TrendCalendar';
import { SourceFooter } from '../components/SourceFooter';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import type { ListingIntel } from '../intelTypes';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const QUESTION = 'Xem điểm của sản phẩm tại một ngày khác để biết nên đăng hoặc đẩy hàng vào lúc nào.';
const MAX_DAYS = 730;
const shiftDays = (days: number) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

export function ListingIntelDetailPage() {
  const { id = '' } = useParams();
  return <ListingIntelDetail key={id} id={id} />;
}

function ListingIntelDetail({ id }: { id: string }) {
  const [params, setParams] = useSearchParams();
  const date = ISO_DATE.test(params.get('date') ?? '') ? (params.get('date') as string) : '';
  const intel = useInsight<ListingIntel>(id ? `/listings/${id}/intel` : null, { date });
  const last = useRef<{ title?: string; thumbnail?: string | null } | null>(null);
  if (intel.state.kind === 'ready') last.current = { title: intel.state.data.title, thumbnail: intel.state.data.thumbnail };
  const ready = last.current;
  const title = ready?.title || 'Chi tiết phân tích';

  const setDate = (value: string) => setParams(value ? { date: value } : {}, { replace: true });

  const actions = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="intel-date" className="whitespace-nowrap text-xs font-semibold text-stone-600">Xem điểm tại ngày</label>
        <input
          id="intel-date"
          type="date"
          value={date}
          min={shiftDays(-MAX_DAYS)}
          max={shiftDays(MAX_DAYS)}
          onChange={e => setDate(e.target.value)}
          className="h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus-visible:border-[#007700] focus-visible:ring-2 focus-visible:ring-[#007700]/20"
        />
        {date && (
          <button type="button" onClick={() => setDate('')} className="h-9 cursor-pointer rounded-md border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-700 hover:border-[#007700] hover:text-[#007700]">
            Hôm nay
          </button>
        )}
      </div>
      <Link to={editLink(id)} className={ACTION_CLASS}>
        <Pencil size={15} aria-hidden /> Sửa sản phẩm
      </Link>
    </>
  );

  return (
    <InsightPage
      title={title}
      question={QUESTION}
      actions={actions}
      breadcrumb={[{ label: 'Phân tích listing', to: `${INSIGHTS_ROOT}/listing-intel` }, { label: ready?.title || 'Chi tiết' }]}
      header={ready?.title ? (
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {ready.thumbnail ? (
              <img src={ready.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
            ) : (
              <span className="h-14 w-14 shrink-0 rounded bg-stone-100" aria-hidden />
            )}
            <div className="min-w-0">
              <h1 className="m-0 line-clamp-2 font-jakarta text-lg font-extrabold leading-snug tracking-tight text-stone-900 md:text-xl">{ready.title}</h1>
              <p className="m-0 mt-0.5 text-sm text-stone-600">{QUESTION}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </header>
      ) : undefined}
    >
      <InsightBlock state={intel.state} onRetry={intel.reload}>
        {(data, meta) => (
          <div className="space-y-3">
            <IntelReport data={data} />
            <TrendCalendar group={data.peers.group} />
            <SourceFooter meta={meta} />
          </div>
        )}
      </InsightBlock>
    </InsightPage>
  );
}
