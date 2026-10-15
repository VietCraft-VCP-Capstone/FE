/**
 * F30 — Cảnh báo bất thường. Trả lời: "Có ngày nào doanh thu lệch khỏi mức thường không?"
 *
 * Đọc GET /seller/analytics/alerts (tham số period = 7d · 30d · 90d · all).
 *
 * Mặc định `all` vì cửa sổ ngắn thường không có ngày nào vượt ngưỡng: ngưỡng z = 7,0 rất
 * khắt khe (đổi lại chỉ 0,6% báo động giả), nên mở trang ở `30d` hay gặp danh sách rỗng
 * và người bán tưởng tính năng không chạy.
 */

import { ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { count, money } from '../../../shared/utils/format';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, DataTable, InsightCard, KpiTile, Note, type Tone } from '../components/ui';
import { decimal, fullDate, pct } from '../format';
import { useInsight } from '../hooks/useInsight';
import type { AlertPeriod, AnomalyAlerts } from '../types';

const PERIODS: AlertPeriod[] = ['7d', '30d', '90d', 'all'];

const PERIOD_OPTIONS = [
  { value: '7d' as AlertPeriod, label: '7 ngày' },
  { value: '30d' as AlertPeriod, label: '30 ngày' },
  { value: '90d' as AlertPeriod, label: '90 ngày' },
  { value: 'all' as AlertPeriod, label: 'Toàn bộ' },
];

/** Mức độ nặng nhẹ: luôn kèm chữ, màu chỉ là kênh phụ. */
const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  high: { label: 'Nặng', tone: 'bad' },
  medium: { label: 'Vừa', tone: 'warn' },
  low: { label: 'Nhẹ', tone: 'neutral' },
};

/**
 * Cờ tin cậy do mô hình tự hạ xuống. Dịch sang câu người bán hiểu được: bản gốc trả mã
 * tiếng Anh, hiện thẳng ra thì không ai biết nên tin tới đâu.
 */
const CONFIDENCE: Record<string, { label: string; tone: Tone; hint: string }> = {
  calendar_sensitive: {
    label: 'Trùng dịp lễ',
    tone: 'warn',
    hint: 'Ngày này nằm trong cửa sổ lễ nên mức lệch có thể do mùa vụ, không phải do shop.',
  },
  limited_few_cycles: {
    label: 'Ít chu kỳ để so',
    tone: 'warn',
    hint: 'Chuỗi còn ngắn nên mức "bình thường" chưa được xác định chắc chắn.',
  },
  unreliable_high_rate: {
    label: 'Độ tin cậy thấp',
    tone: 'bad',
    hint: 'Shop này có quá nhiều ngày bị gắn cờ, tức mô hình chưa mô tả đúng nhịp bán.',
  },
};

export function AlertsPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('period');
  const period: AlertPeriod = PERIODS.includes(raw as AlertPeriod) ? (raw as AlertPeriod) : 'all';

  const { state, reload } = useInsight<AnomalyAlerts>('/alerts', { period });

  const setPeriod = (value: AlertPeriod) => {
    const next = new URLSearchParams(params);
    next.set('period', value);
    setParams(next, { replace: true });
  };

  return (
    <InsightPage
      title="Cảnh báo bất thường"
      question="Có ngày nào doanh thu lệch hẳn khỏi mức thường ngày không?"
      actions={<RangeTabs<AlertPeriod> value={period} onChange={setPeriod} options={PERIOD_OPTIONS} label="Kỳ xem cảnh báo" />}
    >
      <InsightBlock state={state} onRetry={reload}>
        {(data, meta) => {
          const alerts = [...data.alerts].sort((a, b) => b.date.localeCompare(a.date));
          const drops = alerts.filter(a => a.direction === 'drop').length;
          const spikes = alerts.length - drops;

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <KpiTile label="Ngày bị gắn cờ" value={count(data.total)} hint={period === 'all' ? 'Trên toàn bộ lịch sử' : `Trong ${period.replace('d', ' ngày')} gần nhất`} />
                <KpiTile label="Ngày tụt xuống" value={count(drops)} hint="Doanh thu thấp hơn mức thường" />
                <KpiTile label="Ngày vọt lên" value={count(spikes)} hint="Doanh thu cao hơn mức thường" />
              </div>

              <InsightCard
                title={alerts.length > 0 ? `${alerts.length} ngày vượt ngưỡng` : 'Không có ngày nào vượt ngưỡng'}
                description="Sắp xếp theo ngày mới nhất trước."
                bodyClassName={alerts.length > 0 ? 'px-4 py-3' : 'p-4'}
                footer={<SourceFooter meta={meta} limitation={data.limitation} />}
              >
                {alerts.length === 0 ? (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF0E2] text-[#005B00]" aria-hidden>
                      <ShieldCheck size={18} />
                    </span>
                    <div>
                      <p className="m-0 text-sm font-bold text-stone-800">Không có ngày nào vượt ngưỡng. Đó là tin tốt.</p>
                      <p className="mb-0 mt-1 text-xs leading-relaxed text-stone-500">
                        {data.shop_was_analysed
                          ? 'Shop đã được phân tích đầy đủ trong kỳ này, nghĩa là doanh thu đi theo nhịp thường ngày, không có cú tụt hay cú vọt nào đáng để bạn phải xem lại.'
                          : 'Chưa phân tích được shop trong kỳ này, nên chưa kết luận được. Thử chọn kỳ dài hơn.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <DataTable
                    caption="Những ngày doanh thu lệch khỏi mức thường"
                    head={
                      <>
                        <th scope="col">Ngày</th>
                        <th scope="col">Chiều lệch</th>
                        <th scope="col" className="text-right">Thực tế</th>
                        <th scope="col" className="text-right">Mức thường</th>
                        <th scope="col" className="text-right">Độ lệch</th>
                        <th scope="col">Mức độ</th>
                      </>
                    }
                  >
                    {alerts.map(alert => {
                      const sev = SEVERITY[alert.severity] ?? { label: alert.severity, tone: 'neutral' as Tone };
                      const conf = CONFIDENCE[alert.confidence];
                      const dropped = alert.direction === 'drop';
                      const gap = alert.expected_vnd
                        ? Math.round(((alert.actual_vnd - alert.expected_vnd) / alert.expected_vnd) * 100)
                        : null;
                      return (
                        <tr key={`${alert.date}-${alert.direction}`}>
                          <td className="whitespace-nowrap font-semibold text-stone-800">{fullDate(alert.date)}</td>
                          <td>
                            <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${dropped ? 'text-red-700' : 'text-[#005B00]'}`}>
                              {dropped ? <ArrowDownRight size={15} aria-hidden /> : <ArrowUpRight size={15} aria-hidden />}
                              {dropped ? 'Tụt xuống' : 'Vọt lên'}
                            </span>
                            {gap !== null && <span className="ml-1.5 text-xs text-stone-500">{pct(gap, 0)} so với mức thường</span>}
                          </td>
                          <td className="whitespace-nowrap text-right font-semibold tabular-nums text-stone-900">{money(alert.actual_vnd)}</td>
                          <td className="whitespace-nowrap text-right tabular-nums text-stone-600">{money(alert.expected_vnd)}</td>
                          <td className="text-right tabular-nums text-stone-700">
                            {decimal(Math.abs(alert.z))}
                            <span className="ml-1 text-xs text-stone-400">lần</span>
                          </td>
                          <td>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Chip tone={sev.tone}>{sev.label}</Chip>
                              {conf && <Chip tone={conf.tone}><span title={conf.hint}>{conf.label}</span></Chip>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </DataTable>
                )}
              </InsightCard>

              <InsightCard title="Vì sao ngưỡng là 7,0 chứ không phải 2,0">
                <div className="space-y-3 text-[13px] leading-relaxed text-stone-600">
                  <p className="m-0">
                    Một ngày chỉ bị gắn cờ khi doanh thu lệch khỏi mức thường quá{' '}
                    <strong className="text-stone-900">{decimal(data.threshold.z)} lần</strong> độ dao động bình thường của
                    chính shop bạn. Độ lệch ở bảng trên là số lần đó.
                  </p>
                  <p className="m-0">{data.threshold.why}</p>
                  <Note>
                    Ngưỡng cao nghĩa là hệ thống ít báo, nhưng báo thì đáng xem. Ngưỡng thấp sẽ báo nhiều ngày bình thường,
                    và sau vài lần như vậy thì không ai còn đọc cảnh báo nữa.
                  </Note>
                </div>
              </InsightCard>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
