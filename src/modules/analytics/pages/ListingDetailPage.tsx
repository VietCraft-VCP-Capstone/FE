import { useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Modal, Tabs } from 'antd';
import { Calendar } from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { HealthTheme } from '../components/health/HealthTheme';
import { ActionPlan } from '../components/health/ActionPlan';
import { CriteriaTable } from '../components/health/CriteriaTable';
import { DetailHeader } from '../components/health/DetailHeader';
import { ScoreHero } from '../components/health/ScoreHero';
import { PriceCompare } from '../components/health/PriceCompare';
import { DateField } from '../components/health/DateField';
import { WhyScore } from '../components/health/WhyScore';
import { PartTabs } from '../components/intel/PartTabs';
import { SeasonPanel } from '../components/intel/SeasonPanel';
import { ListingTraffic } from '../components/ListingTraffic';
import { SourceFooter } from '../components/SourceFooter';
import { cleanTitle } from '../format';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import type { ListingHealth } from '../healthTypes';
import type { ListingIntel } from '../intelTypes';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 730;
const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs';
const shiftDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });

const hasUrgent = (data: ListingHealth) => data.warnings.some(w => w.type === 'warning');

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
  const [intelTab, setIntelTab] = useState<string>('traffic');

  const last = useRef<ListingHealth | null>(null);
  if (health.state.kind === 'ready') last.current = health.state.data;
  const ready = last.current;
  const productTitle = cleanTitle(ready?.title || 'Sản phẩm');

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
        header={<DetailHeader id={id} title={productTitle} thumbnail={ready?.thumbnail ?? null} data={ready} />}
      >
        <InsightBlock state={health.state} onRetry={health.reload}>
          {(data, meta) => (
            <div className="space-y-4">
              {hasUrgent(data) && <ActionPlan data={data} productId={id} />}

              <section className={`${CARD} grid grid-cols-1 gap-6 lg:grid-cols-12`}>
                <div className="lg:col-span-3">
                  <ScoreHero data={data} />
                </div>
                <div className="lg:col-span-9 lg:border-l lg:border-stone-100 lg:pl-6">
                  <CriteriaTable data={data} productId={id} onExplain={() => setShowWhyModal(true)} />
                </div>
              </section>

              {!hasUrgent(data) && <ActionPlan data={data} productId={id} />}

              <section className="pt-2">
                <h2 className="m-0 text-base font-bold text-stone-900">Phân tích thêm</h2>
                <Tabs
                  activeKey={intelTab}
                  onChange={setIntelTab}
                  items={[
                    {
                      key: 'traffic',
                      label: 'Lượt xem và đơn hàng',
                      children: id ? <ListingTraffic id={id} conversionDetail={null} /> : null,
                    },
                    {
                      key: 'price',
                      label: 'So sánh giá',
                      children: <div className={CARD}><PriceCompare data={data} /></div>,
                    },
                    {
                      key: 'parts',
                      label: 'Chi tiết từng phần',
                      children: (
                        <InsightBlock state={intel.state} onRetry={intel.reload}>
                          {intelData => <div className={CARD}><PartTabs data={intelData} productId={id} bare /></div>}
                        </InsightBlock>
                      ),
                    },
                    {
                      key: 'season',
                      label: 'Mùa vụ',
                      children: (
                        <InsightBlock state={intel.state} onRetry={intel.reload}>
                          {intelData => <div className={CARD}><SeasonPanel points={intelData.score_timeline} bare>{datePicker}</SeasonPanel></div>}
                        </InsightBlock>
                      ),
                    },
                  ]}
                />
              </section>

              <SourceFooter meta={meta} />

              <Modal
                open={showWhyModal}
                onCancel={() => setShowWhyModal(false)}
                footer={null}
                title="Cách tính điểm tối ưu sản phẩm"
                width={520}
              >
                <WhyScore data={data} />
              </Modal>
            </div>
          )}
        </InsightBlock>
      </InsightPage>
    </HealthTheme>
  );
}
