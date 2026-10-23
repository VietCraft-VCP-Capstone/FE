import { useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Col, Row } from 'antd';
import { Pencil } from 'lucide-react';
import { editLink } from '../components/HealthParts';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { AchievedList } from '../components/health/AchievedList';
import { HealthScoreCard } from '../components/health/HealthScoreCard';
import { HealthTheme } from '../components/health/HealthTheme';
import { HealthSummary } from '../components/health/HealthSummary';
import { HealthTodoList } from '../components/health/HealthTodoList';
import { PriceAdvice } from '../components/health/PriceAdvice';
import { Thumb } from '../components/health/Thumb';
import { WhyScore } from '../components/health/WhyScore';
import { PartTabs } from '../components/intel/PartTabs';
import { SeasonPanel } from '../components/intel/SeasonPanel';
import { ListingTraffic } from '../components/ListingTraffic';
import { SourceFooter } from '../components/SourceFooter';
import { ACTION_CLASS } from '../components/ui';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import type { ListingHealth } from '../healthTypes';
import type { ListingIntel } from '../intelTypes';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const QUESTION = 'Điểm sức khoẻ và việc cần làm để sản phẩm dễ bán hơn.';
const MAX_DAYS = 730;
const shiftDays = (days: number) => new Date(Date.now() + days * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

export function ListingDetailPage() {
  const { id = '' } = useParams();
  return <ListingDetail key={id} id={id} />;
}

function ListingDetail({ id }: { id: string }) {
  const [params, setParams] = useSearchParams();
  const date = ISO_DATE.test(params.get('date') ?? '') ? (params.get('date') as string) : '';
  const health = useInsight<ListingHealth>(id ? `/listings/${id}/health` : null);
  const intel = useInsight<ListingIntel>(id ? `/listings/${id}/intel` : null, { date });
  const last = useRef<{ title: string; thumbnail: string | null } | null>(null);
  if (health.state.kind === 'ready') last.current = { title: health.state.data.title, thumbnail: health.state.data.thumbnail };
  const ready = last.current;
  const title = ready?.title || 'Sản phẩm';

  const setDate = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('date', value);
    else next.delete('date');
    setParams(next, { replace: true });
  };

  const datePicker = (
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="health-date" className="whitespace-nowrap text-xs text-stone-600">Xem từ ngày</label>
        <input
          id="health-date"
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
  );

  const actions = (
    <Link to={editLink(id)} className={ACTION_CLASS}>
      <Pencil size={15} aria-hidden /> Sửa sản phẩm
    </Link>
  );

  return (
    <HealthTheme>
    <InsightPage
      title={title}
      question={QUESTION}
      actions={actions}
      breadcrumb={[{ label: 'Sức khoẻ sản phẩm', to: `${INSIGHTS_ROOT}/listings` }, { label: title }]}
      header={ready?.title ? (
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="flex min-w-0 items-center gap-3.5">
            <Thumb src={ready.thumbnail} size={56} />
            <div className="min-w-0">
              <h1 className="m-0 line-clamp-2 font-jakarta text-lg font-extrabold leading-snug tracking-tight text-stone-900 md:text-xl">{ready.title}</h1>
              <p className="m-0 mt-0.5 text-xs text-stone-500">{QUESTION}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </header>
      ) : undefined}
    >
      <InsightBlock state={health.state} onRetry={health.reload}>
        {(data, meta) => (
          <div className="space-y-8 pt-2">
            <HealthSummary data={data} />
            <Row gutter={[48, 32]}>
              <Col xs={24} lg={15} className="space-y-10">
                <HealthTodoList data={data} productId={id} />
                <HealthScoreCard data={data} />
              </Col>
              <Col xs={24} lg={9} className="space-y-10">
                <PriceAdvice data={data} />
                <AchievedList data={data} />
              </Col>
            </Row>
            <WhyScore data={data} />
            <SourceFooter meta={meta} />
          </div>
        )}
      </InsightBlock>
      <InsightBlock state={intel.state} onRetry={intel.reload}>
        {data => (
          <div className="space-y-10 pt-6">
            <SeasonPanel points={data.score_timeline}>{datePicker}</SeasonPanel>
            <PartTabs data={data} productId={id} />
          </div>
        )}
      </InsightBlock>
      {id && <ListingTraffic id={id} conversionDetail={null} />}
    </InsightPage>
    </HealthTheme>
  );
}
