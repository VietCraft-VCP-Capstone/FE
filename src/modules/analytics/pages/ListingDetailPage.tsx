import { useState, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Modal, Tabs } from 'antd';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  TrendingUp,
  Users,
  Package,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { HealthTheme } from '../components/health/HealthTheme';
import { ScoreHero } from '../components/health/ScoreHero';
import { ActionPlan } from '../components/health/ActionPlan';
import { CriteriaTable } from '../components/health/CriteriaTable';
import { PriceCompare } from '../components/health/PriceCompare';
import { DateField } from '../components/health/DateField';
import { WhyScore } from '../components/health/WhyScore';
import { PartTabs } from '../components/intel/PartTabs';
import { SeasonPanel } from '../components/intel/SeasonPanel';
import { ListingTraffic } from '../components/ListingTraffic';
import { SourceFooter } from '../components/SourceFooter';
import { cleanTitle, vnd } from '../format';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import type { ListingHealth } from '../healthTypes';
import type { ListingIntel } from '../intelTypes';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
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
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [intelTab, setIntelTab] = useState<string>('season');

  const last = useRef<{ title: string; thumbnail: string | null } | null>(null);
  if (health.state.kind === 'ready') {
    last.current = { title: health.state.data.title, thumbnail: health.state.data.thumbnail };
  }
  const ready = last.current;
  const rawTitle = ready?.title || 'Sản phẩm';
  const productTitle = cleanTitle(rawTitle);

  const setDate = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('date', value);
    else next.delete('date');
    setParams(next, { replace: true });
  };

  const datePicker = (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-1.5 shadow-2xs">
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <Calendar size={13} className="text-stone-400" />
        <span>Xem từ ngày:</span>
      </div>
      <DateField value={date} min={shiftDays(-MAX_DAYS)} max={shiftDays(MAX_DAYS)} onChange={setDate} />
      {date && (
        <button
          type="button"
          onClick={() => setDate('')}
          className="rounded-md border border-stone-200 bg-white px-2 py-0.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer shadow-2xs"
        >
          Hôm nay
        </button>
      )}
    </div>
  );

  return (
    <HealthTheme>
      <InsightPage
        title="Tối ưu sản phẩm"
        breadcrumb={[{ label: 'Tối ưu sản phẩm', to: `${INSIGHTS_ROOT}/listings` }, { label: productTitle }]}
        header={
          <header className="mb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-2xl border border-stone-200/90 bg-stone-100 overflow-hidden shadow-2xs group">
                  {ready?.thumbnail ? (
                    <img
                      src={ready.thumbnail}
                      alt={productTitle}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-stone-50 text-stone-400">
                      <Package size={28} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-bold text-stone-600 border border-stone-200/60" title="Mã tin đăng">
                      #{id ? id.slice(-8).toUpperCase() : 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#007700] border border-emerald-200/60">
                      ● Đang đăng bán
                    </span>
                    {health.state.kind === 'ready' && health.state.data.breakdown.find(r => r.key === 'price')?.value && (
                      <span className="inline-flex items-center rounded-full bg-stone-900 text-white px-2.5 py-0.5 text-[11px] font-black">
                        {vnd(health.state.data.breakdown.find(r => r.key === 'price')?.value)}
                      </span>
                    )}
                  </div>
                  <h1 className="m-0 truncate font-sans text-lg sm:text-xl font-black tracking-tight text-stone-900 leading-snug" title={productTitle}>
                    {productTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to={`${INSIGHTS_ROOT}/listings`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50 hover:border-stone-300 shadow-2xs no-underline"
                >
                  <ArrowLeft size={13} />
                  <span>Tất cả sản phẩm</span>
                </Link>

                <a
                  href={`/products/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#007700] hover:bg-[#005B00] px-4 py-2 text-xs font-bold text-white transition-all shadow-xs no-underline active:scale-95"
                  title="Mở trang sản phẩm hiển thị với người mua trong tab mới"
                >
                  <Eye size={13} />
                  <span>Xem trên sàn</span>
                  <ExternalLink size={11} className="opacity-75" />
                </a>
              </div>
            </div>
          </header>
        }
      >
        <InsightBlock state={health.state} onRetry={health.reload}>
          {(data, meta) => {
            return (
              <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Action Hub + Criteria + Deep Dive (8 cols) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* 1. Nhiệm vụ tối ưu */}
                    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
                      <ActionPlan data={data} productId={id} />
                    </section>

                    {/* 2. Bảng 6 tiêu chuẩn chất lượng */}
                    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
                      <CriteriaTable data={data} />
                    </section>

                    {/* 3. Phân tích chuyên sâu & Xu hướng */}
                    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
                      <div className="mb-3 border-b border-stone-100 pb-2">
                        <h2 className="m-0 text-base font-bold text-stone-900">Phân tích chuyên sâu</h2>
                      </div>

                      <Tabs
                        activeKey={intelTab}
                        onChange={setIntelTab}
                        items={[
                          {
                            key: 'season',
                            label: (
                              <span className="flex items-center gap-1.5 font-semibold text-xs py-0.5">
                                <TrendingUp size={13} />
                                <span>Mùa vụ &amp; Xu hướng</span>
                              </span>
                            ),
                            children: (
                              <InsightBlock state={intel.state} onRetry={intel.reload}>
                                {intelData => (
                                  <div className="pt-1">
                                    <SeasonPanel points={intelData.score_timeline} bare>{datePicker}</SeasonPanel>
                                  </div>
                                )}
                              </InsightBlock>
                            ),
                          },
                          {
                            key: 'parts',
                            label: (
                              <span className="flex items-center gap-1.5 font-semibold text-xs py-0.5">
                                <Layers size={13} />
                                <span>Chẩn đoán từng phần</span>
                              </span>
                            ),
                            children: (
                              <InsightBlock state={intel.state} onRetry={intel.reload}>
                                {intelData => <PartTabs data={intelData} productId={id} bare />}
                              </InsightBlock>
                            ),
                          },
                          {
                            key: 'traffic',
                            label: (
                              <span className="flex items-center gap-1.5 font-semibold text-xs py-0.5">
                                <Users size={13} />
                                <span>Lượt xem &amp; Đơn hàng</span>
                              </span>
                            ),
                            children: (
                              <div className="pt-1">
                                {id ? <ListingTraffic id={id} conversionDetail={null} /> : null}
                              </div>
                            ),
                          },
                        ]}
                      />
                    </section>
                  </div>

                  {/* Right Column: Score + Pricing + Snapshot (4 cols) */}
                  <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-4">
                    {/* Score Card */}
                    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
                      <ScoreHero data={data} onExplain={() => setShowWhyModal(true)} />
                    </section>

                    {/* Market Pricing Card */}
                    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
                      <PriceCompare data={data} />
                    </section>
                  </div>
                </div>

                <SourceFooter meta={meta} />

                <Modal
                  open={showWhyModal}
                  onCancel={() => setShowWhyModal(false)}
                  footer={null}
                  title={
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#007700]" />
                      <span className="font-jakarta font-bold text-stone-900">
                        Cách tính điểm tối ưu sản phẩm
                      </span>
                    </div>
                  }
                  width={520}
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
