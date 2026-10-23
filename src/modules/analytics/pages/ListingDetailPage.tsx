import { useState, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Modal, Tabs } from 'antd';
import { ArrowLeft, Calendar, Sparkles, Layers, TrendingUp, Users, Package } from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { HealthTheme } from '../components/health/HealthTheme';
import { HealthGauge } from '../components/health/HealthGauge';
import { FactorGrid } from '../components/health/FactorGrid';
import { FactorBreakdownCard } from '../components/health/FactorBreakdownCard';
import { HealthRoadmap } from '../components/health/HealthRoadmap';
import { ListingDiagnosticCard } from '../components/health/ListingDiagnosticCard';
import { WhyScore } from '../components/health/WhyScore';
import { PartTabs } from '../components/intel/PartTabs';
import { SeasonPanel } from '../components/intel/SeasonPanel';
import { ListingTraffic } from '../components/ListingTraffic';
import { SourceFooter } from '../components/SourceFooter';
import { visibleTodos } from '../components/health/visibleTodos';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import type { ListingHealth } from '../healthTypes';
import type { ListingIntel } from '../intelTypes';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const QUESTION = 'Chấm điểm chất lượng tin đăng và đề xuất tối ưu chuyển đổi theo chuẩn thuật toán sàn.';
const MAX_DAYS = 730;
const shiftDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

export function ListingDetailPage() {
  const { id = '' } = useParams();
  return <ListingDetail key={id} id={id} />;
}

function ListingDetail({ id }: { id: string }) {
  const [params, setParams] = useSearchParams();
  const date = ISO_DATE.test(params.get('date') ?? '') ? (params.get('date') as string) : '';
  const health = useInsight<ListingHealth>(id ? `/listings/${id}/health` : null);
  const intel = useInsight<ListingIntel>(id ? `/listings/${id}/intel` : null, { date });
  const [selectedFactor, setSelectedFactor] = useState<string>('images');
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [rangePill, setRangePill] = useState<'7' | '30' | '90'>('7');
  const [intelTab, setIntelTab] = useState<string>('parts');

  const last = useRef<{ title: string; thumbnail: string | null } | null>(null);
  if (health.state.kind === 'ready') {
    last.current = { title: health.state.data.title, thumbnail: health.state.data.thumbnail };
  }
  const ready = last.current;
  const productTitle = ready?.title || 'Sản phẩm';

  const setDate = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('date', value);
    else next.delete('date');
    setParams(next, { replace: true });
  };

  const datePicker = (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5">
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <Calendar size={13} className="text-stone-400" />
        <span>Xem từ ngày:</span>
      </div>
      <input
        id="health-date"
        type="date"
        value={date}
        min={shiftDays(-MAX_DAYS)}
        max={shiftDays(MAX_DAYS)}
        onChange={e => setDate(e.target.value)}
        className="h-7 rounded border border-stone-200 bg-stone-50/50 px-2 text-xs font-medium text-stone-800 outline-none transition-colors focus:border-[#111111]"
      />
      {date && (
        <button
          type="button"
          onClick={() => setDate('')}
          className="rounded border border-stone-200 bg-white px-2 py-0.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
        >
          Hôm nay
        </button>
      )}
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <Link
        to={`${INSIGHTS_ROOT}/listings`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
      >
        <ArrowLeft size={13} />
        <span>Tất cả sản phẩm</span>
      </Link>
    </div>
  );

  return (
    <HealthTheme>
      <InsightPage
        title="Chất lượng tin đăng"
        question={QUESTION}
        actions={actions}
        breadcrumb={[{ label: 'Sức khoẻ sản phẩm', to: `${INSIGHTS_ROOT}/listings` }, { label: productTitle }]}
        header={
          <header className="mb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-stone-200/80 pb-4">
              {/* Product Identity Block: Prominent Thumbnail + Real Title + Meta */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Product Thumbnail with subtle border & fallback */}
                <div className="relative h-14 w-14 shrink-0 rounded-xl border border-stone-200/80 bg-stone-100 overflow-hidden shadow-2xs">
                  {ready?.thumbnail ? (
                    <img
                      src={ready.thumbnail}
                      alt={productTitle}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-50 text-stone-400">
                      <Package size={22} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      ID: {id ? id.slice(-8).toUpperCase() : 'N/A'}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="text-[11px] font-medium text-stone-500">Mộc Studio</span>
                    <span className="text-stone-300">·</span>
                    <span className="text-[11px] font-medium text-stone-400">Kiểm toán chất lượng tin đăng</span>
                  </div>

                  <h1 className="m-0 mt-1 truncate font-sans text-xl md:text-2xl font-bold tracking-tight text-[#111111]">
                    {productTitle}
                  </h1>
                </div>
              </div>

              {/* Action Controls: Back button & Date range */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to={`${INSIGHTS_ROOT}/listings`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                >
                  <ArrowLeft size={13} />
                  <span>Tất cả sản phẩm</span>
                </Link>

                <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
                  {(['7', '30', '90'] as const).map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setRangePill(days)}
                      className={`rounded px-3 py-1 text-xs font-semibold transition-all ${
                        rangePill === days
                          ? 'bg-[#111111] text-white'
                          : 'text-stone-500 hover:text-[#111111]'
                      }`}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>
        }
      >
        <InsightBlock state={health.state} onRetry={health.reload}>
          {(data, meta) => {
            const todos = visibleTodos(data);
            const potential = todos.length
              ? Math.min(100, (data.score ?? 0) + todos.reduce((s, t) => s + t.impact, 0))
              : null;

            return (
              <div className="space-y-6 pt-1">
                {/* 1. Unified Panoramic Health Bento (Score + 6 Drivers + Factor Drilldown) */}
                <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                  <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
                    {/* Left: Health Gauge Engine (5 cols) */}
                    <div className="lg:col-span-5 p-5 md:p-6">
                      <HealthGauge
                        score={data.score}
                        potential={potential}
                        productId={id}
                        onExplainClick={() => setShowWhyModal(true)}
                      />
                    </div>

                    {/* Right: 6 Performance Pillars Grid (7 cols) */}
                    <div className="lg:col-span-7 p-5 md:p-6">
                      <FactorGrid
                        data={data}
                        selectedFactor={selectedFactor}
                        onSelectFactor={setSelectedFactor}
                      />
                    </div>
                  </div>

                  {/* Bottom Integrated Drilldown Tray for Selected Factor */}
                  <div className="border-t border-stone-100 bg-stone-50/40 p-5 md:p-6">
                    <FactorBreakdownCard
                      data={data}
                      selectedFactor={selectedFactor}
                    />
                  </div>
                </div>

                {/* 2. Horizontal Action Roadmap Pipeline */}
                <HealthRoadmap data={data} />

                {/* 3. Diagnostic Audit Table & Clean Inspection Drawer */}
                <ListingDiagnosticCard data={data} productId={id} />

                {/* 4. Deep-dive Intelligence Tabs */}
                <div className="rounded-xl border border-stone-200 bg-white p-5 md:p-6 shadow-2xs mt-6">
                  <div className="border-b border-stone-100 pb-3 mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      Dữ liệu chuyên sâu
                    </span>
                    <h3 className="m-0 mt-0.5 font-jakarta text-base font-bold text-[#111111]">
                      Chẩn đoán chuyên sâu &amp; Thị trường
                    </h3>
                  </div>

                  <Tabs
                    activeKey={intelTab}
                    onChange={setIntelTab}
                    items={[
                      {
                        key: 'parts',
                        label: (
                          <span className="flex items-center gap-1.5 font-semibold text-xs">
                            <Layers size={13} />
                            <span>Chẩn đoán từng phần</span>
                          </span>
                        ),
                        children: (
                          <InsightBlock state={intel.state} onRetry={intel.reload}>
                            {intelData => <PartTabs data={intelData} productId={id} />}
                          </InsightBlock>
                        ),
                      },
                      {
                        key: 'season',
                        label: (
                          <span className="flex items-center gap-1.5 font-semibold text-xs">
                            <TrendingUp size={13} />
                            <span>Mùa vụ &amp; Xu hướng</span>
                          </span>
                        ),
                        children: (
                          <InsightBlock state={intel.state} onRetry={intel.reload}>
                            {intelData => (
                              <div className="space-y-4 pt-2">
                                <SeasonPanel points={intelData.score_timeline}>{datePicker}</SeasonPanel>
                              </div>
                            )}
                          </InsightBlock>
                        ),
                      },
                      {
                        key: 'traffic',
                        label: (
                          <span className="flex items-center gap-1.5 font-semibold text-xs">
                            <Users size={13} />
                            <span>Lưu lượng &amp; Chuyển đổi</span>
                          </span>
                        ),
                        children: id ? <ListingTraffic id={id} conversionDetail={null} /> : null,
                      },
                    ]}
                  />
                </div>

                <SourceFooter meta={meta} />

                {/* Algorithm Explanation Modal */}
                <Modal
                  open={showWhyModal}
                  onCancel={() => setShowWhyModal(false)}
                  footer={null}
                  title={
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#346538]" />
                      <span className="font-jakarta font-bold text-[#111111]">
                        Thuật toán tính điểm Listing Health
                      </span>
                    </div>
                  }
                  width={760}
                >
                  <WhyScore data={data} />
                </Modal>
              </div>
            );
          }}
        </InsightBlock>
      </InsightPage>
    </HealthTheme>
  );
}
