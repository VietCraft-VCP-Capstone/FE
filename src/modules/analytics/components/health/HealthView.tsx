import { PackagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HealthSummaryPoint, ListingHealthList } from '../../healthTypes';
import { useInsight, type InsightState } from '../../hooks/useInsight';
import { AXIS_ORDER, HEALTH_BANDS, HealthExplainer } from '../HealthParts';
import { InsightBlock } from '../InsightBlock';
import { SourceFooter } from '../SourceFooter';
import { Fold } from '../ui';
import { AxisAverages, IssueBars } from './HealthBreakdowns';
import { HealthTable, TABLE_ID } from './HealthTable';
import { FOCUS, ISSUES, hasIssue, shopStats } from './healthStats';
import { ScoreBenefits } from './ScoreBenefits';
import { ShopScore } from './ShopScore';
import { ShopTrend, TREND_DAYS } from './ShopTrend';

function EmptyShop() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-stone-200 bg-white px-6 py-12 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#F3F7EE] text-[#007700]" aria-hidden>
        <PackagePlus size={20} />
      </span>
      <div>
        <p className="m-0 text-sm font-bold text-stone-800">Shop chưa có sản phẩm nào</p>
        <p className="m-0 mt-1 text-xs text-stone-500">Đăng sản phẩm đầu tiên, khoảng 1 phút sau sẽ có điểm và việc cần làm.</p>
      </div>
      <Link
        to="/seller/products?new=1"
        className={`inline-flex h-9 items-center rounded-md bg-[#007700] px-4 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] motion-reduce:transition-none ${FOCUS}`}
      >
        Đăng sản phẩm
      </Link>
    </div>
  );
}

function scrollToTable() {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => document.getElementById(TABLE_ID)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }));
}

export function HealthView({ health, params, setParam, setTags, clearFilters }: {
  health: { state: InsightState<ListingHealthList>; reload: () => void };
  params: URLSearchParams;
  setParam: (key: string, value: string) => void;
  setTags: (tags: string[]) => void;
  clearFilters: () => void;
}) {
  const issue = params.get('issue') || '';
  const band = params.get('health') || '';
  const axis = AXIS_ORDER.find(a => a === params.get('axis')) ?? null;
  const days = TREND_DAYS.find(d => String(d) === params.get('days')) ?? 30;
  const trend = useInsight<HealthSummaryPoint[]>('/listings/health/summary', { days }).state;
  const pick = (key: string) => (value: string) => {
    setParam(key, value);
    if (value) scrollToTable();
  };

  return (
    <InsightBlock state={health.state} onRetry={health.reload}>
      {(data, meta) => {
        if (data.items.length === 0) return <EmptyShop />;
        const stats = shopStats(data.items, AXIS_ORDER);
        const counted = stats.axes.filter(a => a.avg !== null).map(a => a.axis);
        const inBand = data.items.filter(i => !band || i.status === band);
        const bandLabel = HEALTH_BANDS.find(b => b.status === band)?.label;
        const issueLabel = ISSUES.find(i => i.key === issue)?.label;
        return (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <ShopScore
              stats={stats}
              bands={issue ? shopStats(data.items.filter(i => hasIssue(i, issue)), AXIS_ORDER).bands : stats.bands}
              scope={issueLabel && `đang bị "${issueLabel.toLowerCase()}"`}
              summary={trend} active={band} onPick={pick('health')} className="lg:col-span-5"
            />
            <IssueBars
              stats={band ? shopStats(inBand, AXIS_ORDER) : stats}
              total={inBand.length}
              scope={bandLabel && `ở mức ${bandLabel}`}
              active={issue} onPick={pick('issue')} className="lg:col-span-7"
            />
            <AxisAverages stats={stats} active={axis ?? ''} onPick={pick('axis')} className="lg:col-span-5" />
            <ShopTrend
              state={trend}
              scores={stats.scored.map(i => i.score as number)}
              days={days}
              onDaysChange={d => setParam('days', d === 30 ? '' : String(d))}
              className="lg:col-span-7"
            />
            <div className="min-w-0 space-y-3 lg:col-span-12">
              <HealthTable
                items={data.items} issue={issue} band={band} axis={axis} query={params.get('q') || ''} tags={params.getAll('tag')}
                setParam={setParam} setTags={setTags} clearFilters={clearFilters}
              />
              <ScoreBenefits />
              <Fold title="Điểm được tính thế nào?">
                <HealthExplainer counted={counted} missing={AXIS_ORDER.filter(a => !counted.includes(a))} />
              </Fold>
              <SourceFooter meta={meta} />
            </div>
          </div>
        );
      }}
    </InsightBlock>
  );
}
