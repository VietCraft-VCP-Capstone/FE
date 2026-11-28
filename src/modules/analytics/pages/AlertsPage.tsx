/**
 * F30 — Cảnh báo bất thường. Trả lời: "Có ngày nào doanh thu hoặc lượt xem lệch khỏi mức thường không?"
 *
 * Đọc GET /seller/analytics/alerts (tham số period = 7d · 30d · 90d · all, mặc định 30d).
 */

import { useSearchParams } from 'react-router-dom';
import { count, money } from '../../../shared/utils/format';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { groupAlerts } from '../alertGroups';
import { AlertsTable } from '../components/AlertsTable';
import { AlertVerdict } from '../components/AlertVerdict';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { InsightCard, Note } from '../components/ui';
import { useInsight } from '../hooks/useInsight';
import type { AlertPeriod, AnomalyAlerts } from '../types';

const PERIODS: AlertPeriod[] = ['7d', '30d', '90d', 'all'];

const PERIOD_OPTIONS = [
  { value: '7d' as AlertPeriod, label: '7 ngày' },
  { value: '30d' as AlertPeriod, label: '30 ngày' },
  { value: '90d' as AlertPeriod, label: '90 ngày' },
  { value: 'all' as AlertPeriod, label: 'Toàn bộ' },
];

export function AlertsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('period');
  const period: AlertPeriod = PERIODS.includes(raw as AlertPeriod) ? (raw as AlertPeriod) : '30d';

  const { state, reload } = useInsight<AnomalyAlerts>('/alerts', { period });

  const setPeriod = (value: AlertPeriod) => {
    const next = new URLSearchParams(params);
    next.set('period', value);
    setParams(next, { replace: true });
  };

  return (
    <InsightPage
      title="Cảnh báo bất thường"
      question="Shop của bạn có đang bán ổn không?"
      actions={<RangeTabs<AlertPeriod> value={period} onChange={setPeriod} options={PERIOD_OPTIONS} label="Kỳ xem cảnh báo" />}
    >
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const groups = groupAlerts(data.alerts);
          const drops = groups.filter(g => g.alert.direction === 'drop');
          const spikes = groups.filter(g => g.alert.direction === 'spike');
          const idle = !data.shop_was_analysed && groups.length === 0;
          const t = data.threshold;

          return (
            <div className="space-y-5">
              <AlertVerdict groups={groups} idle={idle} limitation={data.limitation} />

              {drops.length > 0 && (
                <InsightCard title={`Cần chú ý (${drops.length})`} description="Lúc shop bán ít hoặc ít người xem hơn hẳn mọi khi." bodyClassName="px-4 py-1">
                  <AlertsTable groups={drops} />
                </InsightCard>
              )}

              {spikes.length > 0 && (
                <InsightCard title={`Tăng đột biến (${spikes.length})`} description="Thường nhờ dịp lễ, quảng cáo hoặc được chia sẻ. Bạn không cần làm gì." bodyClassName="px-4 py-1">
                  <AlertsTable groups={spikes} />
                </InsightCard>
              )}

              <details className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <summary className="cursor-pointer font-semibold text-stone-800">Hệ thống báo khi nào?</summary>
                <Note>
                  Mỗi sáng, hệ thống so ngày hôm qua với 4 tuần gần nhất của shop. Bạn nhận thông báo khi lệch từ{' '}
                  {count(t.min_change_pct)}% (doanh thu phải lệch từ {money(t.min_change_vnd)}). Tối đa {count(t.weekly_cap)} thông
                  báo mỗi tuần; nhiều ngày liền không có đơn chỉ báo một lần.
                </Note>
              </details>

              <SourceFooter meta={meta} limitation={data.limitation} />
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
