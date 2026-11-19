import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Modal, Tabs } from 'antd';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { HealthTheme } from '../components/health/HealthTheme';
import { ActionPlan } from '../components/health/ActionPlan';
import { CriteriaTable } from '../components/health/CriteriaTable';
import { DetailHeader } from '../components/health/DetailHeader';
import { ImpactCard } from '../components/health/ImpactCard';
import { Recommendations } from '../components/health/Recommendations';
import { ScoreHero } from '../components/health/ScoreHero';
import { SearchInsightsCard } from '../components/health/SearchInsightsCard';
import { WhyScore } from '../components/health/WhyScore';
import { PartTabs } from '../components/intel/PartTabs';
import { ListingTraffic } from '../components/ListingTraffic';
import { cleanTitle } from '../format';
import { useInsight } from '../hooks/useInsight';
import { INSIGHTS_ROOT } from '../nav';
import type { ListingHealth } from '../healthTypes';
import type { ListingIntel } from '../intelTypes';

const CARD = 'rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs';

export function ListingDetailPage() {
  const { id = '' } = useParams();
  return <ListingDetail key={id} id={id} />;
}

function ListingDetail({ id }: { id: string }) {
  const health = useInsight<ListingHealth>(id ? `/listings/${id}/health` : null);
  const intel = useInsight<ListingIntel>(id ? `/listings/${id}/intel` : null);
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);
  const [intelTab, setIntelTab] = useState<string>('traffic');

  const last = useRef<ListingHealth | null>(null);
  if (health.state.kind === 'ready') last.current = health.state.data;
  const ready = last.current;
  const productTitle = cleanTitle(ready?.title || 'Sản phẩm');

  return (
    <HealthTheme>
      <InsightPage
        title="Tối ưu sản phẩm"
        breadcrumb={[{ label: 'Tối ưu sản phẩm', to: `${INSIGHTS_ROOT}/listings` }, { label: productTitle }]}
        header={<DetailHeader id={id} title={productTitle} thumbnail={ready?.thumbnail ?? null} data={ready} />}
      >
        <InsightBlock state={health.state} onRetry={health.reload}>
          {data => (
            <div className="space-y-4">
              <section className={`${CARD} grid grid-cols-1 gap-6 lg:grid-cols-12`}>
                <div className="lg:col-span-3">
                  <ScoreHero data={data} />
                </div>
                <div className="lg:col-span-9 lg:border-l lg:border-stone-100 lg:pl-6">
                  <CriteriaTable factors={data.factors} onExplain={() => setShowWhyModal(true)} />
                </div>
              </section>

              <Recommendations data={data} productId={id} />

              <ActionPlan productId={id} />

              <SearchInsightsCard productId={id} />

              <ImpactCard productId={id} />

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
                      key: 'parts',
                      label: 'Chi tiết từng phần',
                      children: (
                        <InsightBlock state={intel.state} onRetry={intel.reload}>
                          {intelData => <div className={CARD}><PartTabs data={intelData} productId={id} bare /></div>}
                        </InsightBlock>
                      ),
                    },
                  ]}
                />
              </section>

              <Modal
                open={showWhyModal}
                onCancel={() => setShowWhyModal(false)}
                footer={null}
                title="Cách tính độ hoàn thiện trang sản phẩm"
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
