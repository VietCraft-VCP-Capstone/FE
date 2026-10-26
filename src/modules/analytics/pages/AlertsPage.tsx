/**
 * F30 — Cảnh báo bất thường. Trả lời: "Có ngày nào doanh thu hoặc lượt xem lệch khỏi mức thường không?"
 *
 * Đọc GET /seller/analytics/alerts (tham số period = 7d · 30d · 90d · all, mặc định 30d).
 */

import { Hourglass, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { count, money } from '../../../shared/utils/format';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { AlertsTable } from '../components/AlertsTable';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { InsightCard, KpiTile, Note } from '../components/ui';
import { decimal } from '../format';
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
      question="Có ngày nào doanh thu hoặc lượt xem lệch hẳn khỏi mức thường ngày không?"
      actions={<RangeTabs<AlertPeriod> value={period} onChange={setPeriod} options={PERIOD_OPTIONS} label="Kỳ xem cảnh báo" />}
    >
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const alerts = [...data.alerts].sort((a, b) => b.date.localeCompare(a.date) || a.metric.localeCompare(b.metric));
          const drops = alerts.filter(a => a.direction === 'drop').length;
          const spikes = alerts.length - drops;
          const revenue = alerts.filter(a => a.metric === 'revenue').length;
          const views = alerts.length - revenue;
          const t = data.threshold;
          const idle = !data.shop_was_analysed && alerts.length === 0;
          const kpi = (n: number) => (idle ? '—' : count(n));

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <KpiTile label="Cảnh báo" value={kpi(data.total)} hint={period === 'all' ? 'Trên toàn bộ lịch sử' : `Trong ${period.replace('d', ' ngày')} gần nhất`} />
                <KpiTile label="Tụt xuống" value={kpi(drops)} hint="Thấp hơn mức thường" />
                <KpiTile label="Vọt lên" value={kpi(spikes)} hint="Cao hơn mức thường" />
                <KpiTile label="Doanh thu" value={kpi(revenue)} hint="Cảnh báo theo doanh thu" />
                <KpiTile label="Lượt xem" value={kpi(views)} hint="Cảnh báo theo lượt xem" />
              </div>

              <InsightCard
                title={alerts.length > 0 ? `${alerts.length} cảnh báo` : idle ? 'Chưa đủ dữ liệu để dò bất thường' : 'Không có cảnh báo nào'}
                description="Sắp xếp theo ngày mới nhất trước."
                bodyClassName={alerts.length > 0 ? 'px-4 py-3' : 'p-4'}
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                {alerts.length === 0 ? (
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${idle ? 'bg-stone-100 text-stone-500' : 'bg-[#EAF0E2] text-[#005B00]'}`} aria-hidden>
                      {idle ? <Hourglass size={18} /> : <ShieldCheck size={18} />}
                    </span>
                    <div>
                      <p className="m-0 text-sm font-bold text-stone-800">
                        {idle ? 'Chưa kết luận được gì cho shop này.' : 'Không có cảnh báo nào. Đó là tin tốt.'}
                      </p>
                      <p className="mb-0 mt-1 text-xs leading-relaxed text-stone-500">
                        {data.shop_was_analysed
                          ? 'Shop đã được phân tích đầy đủ trong kỳ này, nghĩa là doanh thu và lượt xem đi theo nhịp thường ngày.'
                          : data.limitation ?? 'Chưa phân tích được shop trong kỳ này, nên chưa kết luận được. Thử chọn kỳ dài hơn.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AlertsTable alerts={alerts} />
                )}
              </InsightCard>

              <InsightCard title="Quy tắc báo động">
                <Note>
                  Cảnh báo khi điểm z vượt ±{decimal(t.z, 1)}, lệch ít nhất {count(t.min_change_pct)}% và (doanh thu) ít nhất{' '}
                  {money(t.min_change_vnd)}; tối đa {count(t.weekly_cap)} thông báo mỗi tuần.
                </Note>
              </InsightCard>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
