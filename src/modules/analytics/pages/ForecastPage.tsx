/**
 * F37 "Dự báo doanh thu" — trả lời: doanh thu 30/60/90 ngày tới khoảng bao nhiêu?
 *
 * Đọc GET /seller/analytics/forecast/revenue?window=30|60|90.
 *
 * Trang này chỉ có giá trị nếu người bán biết dự báo đáng tin tới đâu, nên phần "Mô hình
 * tốt đến đâu" (MASE so với mốc ngây thơ) và bảng so sánh mô hình nằm ngay dưới biểu đồ.
 * Ô LSTM để trống là CÓ CHỦ Ý: chưa đo thì ghi "chưa đo", không điền số thay thế.
 */

import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { ForecastBandChart } from '../components/charts/ForecastBandChart';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { Chip, DataTable, InsightCard, Note, Skeleton } from '../components/ui';
import { MiniStat } from '../components/charts/MiniViz';
import { useInsight } from '../hooks/useInsight';
import { RangeTabs } from '../../seller/components/dashboard/SellerDashboardUi';
import { NA, decimal, fullDate } from '../format';
import { compactMoney, count, money } from '../../../shared/utils/format';
import type { ForecastWindow, RevenueForecast } from '../types';

const WINDOW_OPTIONS: { value: ForecastWindow; label: string }[] = [
  { value: '30', label: '30 ngày' },
  { value: '60', label: '60 ngày' },
  { value: '90', label: '90 ngày' },
];

const MODEL_NAMES: Record<string, string> = {
  seasonal_naive: 'Ngây thơ theo mùa',
  arima: 'ARIMA',
  lstm: 'LSTM',
};

function modelName(id: string): string {
  return MODEL_NAMES[id] ?? id.replace(/_+/g, ' ');
}

/** Cộng dồn dải lo95–hi95 của từng ngày. Chỉ tính khi mọi ngày đều có cả hai đầu dải. */
function bandTotals(points: RevenueForecast['points']): { lo: number; hi: number } | null {
  if (points.length === 0) return null;
  let lo = 0;
  let hi = 0;
  for (const p of points) {
    if (p.lo95 == null || p.hi95 == null || !Number.isFinite(p.lo95) || !Number.isFinite(p.hi95)) return null;
    lo += p.lo95;
    hi += p.hi95;
  }
  return { lo, hi };
}

export function ForecastPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('window');
  const horizon: ForecastWindow = raw === '60' || raw === '90' ? raw : '30';
  const { state, reload } = useInsight<RevenueForecast>('/forecast/revenue', { window: horizon });

  const changeHorizon = (value: ForecastWindow) => {
    const next = new URLSearchParams(params);
    next.set('window', value);
    setParams(next);
  };

  return (
    <InsightPage
      title="Dự báo doanh thu"
      question="Doanh thu của shop trong 30, 60 hay 90 ngày tới khoảng bao nhiêu, và con số đó đáng tin tới đâu?"
      actions={
        <RangeTabs<ForecastWindow>
          value={horizon}
          onChange={changeHorizon}
          options={WINDOW_OPTIONS}
          label="Khoảng dự báo"
        />
      }
    >
      <InsightBlock
        state={state}
        onRetry={reload}
        skeleton={
          <div className="space-y-4">
            <Skeleton className="h-80 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        }
      >
        {(data, meta) => {
          const first = data.points[0]?.date ?? null;
          const last = data.points[data.points.length - 1]?.date ?? null;
          const band = bandTotals(data.points);
          const perDay = data.horizon_days > 0 ? Math.round(data.total_forecast_vnd / data.horizon_days) : null;
          const v = data.validation;
          const ms = data.model_selection;
          const modelRows: { key: string; value: number | null; hint: string }[] = [
            {
              key: 'seasonal_naive',
              value: ms.seasonal_naive_mase,
              hint: 'Lấy nguyên số của kỳ trước làm dự báo. Đây là mốc bắt buộc phải thắng.',
            },
            { key: 'arima', value: ms.arima_mase, hint: 'Mô hình chuỗi thời gian cổ điển, dùng cho dữ liệu ngắn.' },
            { key: 'lstm', value: ms.lstm_mase, hint: 'Mạng nơ ron. Chưa đo vì chưa chốt có làm hay không.' },
          ];

          return (
            <div className="space-y-4">
              <InsightCard
                title={`Dự báo ${count(data.horizon_days)} ngày tới`}
                description={first && last ? `Từ ${fullDate(first)} đến ${fullDate(last)}` : undefined}
                footer={
                  <SourceFooter
                    meta={meta}
                    limitation={data.limitation}
                    method={`Mô hình ${modelName(data.model)}, chọn theo số đo MASE trên phần dữ liệu giữ lại ${count(v.holdout_days)} ngày.`}
                  />
                }
              >
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-end">
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-stone-500">Tổng doanh thu dự báo</span>
                    <span className="mt-1 block font-jakarta text-3xl font-extrabold leading-none tracking-tight text-stone-900">
                      {money(data.total_forecast_vnd)}
                    </span>
                    <span className="mt-1.5 block text-xs text-stone-500">
                      Bình quân {perDay == null ? NA : money(perDay)} mỗi ngày
                    </span>
                  </div>
                  <div className="min-w-0 rounded-md bg-stone-50 px-4 py-3">
                    <span className="block text-[11.5px] font-semibold text-stone-500">Cộng dồn dải từng ngày</span>
                    <span className="mt-0.5 block font-jakarta text-base font-bold text-stone-900">
                      {band ? `${compactMoney(band.lo)} đến ${compactMoney(band.hi)}` : NA}
                    </span>
                    <p className="mb-0 mt-1 text-[11.5px] leading-relaxed text-stone-500">
                      Đây là tổng của dải tin cậy 95% từng ngày, cộng lại, không phải khoảng tin cậy của con số tổng.
                      Nhiều ngày có mức thấp nhất bằng 0 nên đầu dưới rất nhỏ: cứ coi đó là "ngày đó có thể không bán
                      được gì", không phải mức sàn của cả kỳ.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <ForecastBandChart
                    points={data.points.map(p => ({ date: p.date, yhat: p.yhat, lo95: p.lo95, hi95: p.hi95 }))}
                    forecastFrom={first}
                    height={300}
                  />
                </div>
                <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">
                  Dữ liệu của tính năng này chỉ có phần dự báo, nên biểu đồ không có đoạn doanh thu đã xảy ra. Muốn xem
                  phần đã bán, mở trang Tổng quan shop.
                </p>
              </InsightCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <InsightCard
                  title="Mô hình này tốt đến đâu"
                  action={
                    v.beats_baseline === true ? (
                      <Chip tone="good" icon={<CheckCircle2 size={13} aria-hidden />}>thắng mốc so sánh</Chip>
                    ) : v.beats_baseline === false ? (
                      <Chip tone="warn" icon={<AlertTriangle size={13} aria-hidden />}>chưa thắng mốc so sánh</Chip>
                    ) : (
                      <Chip tone="neutral">chưa so được</Chip>
                    )
                  }
                  footer={<SourceFooter meta={meta} limitation={v.note} />}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <MiniStat label={`${v.metric} của mô hình`} value={decimal(v.value)} hint="càng nhỏ càng sát thực tế" />
                    <MiniStat label="Mốc so sánh ngây thơ" value={decimal(v.baseline)} hint="lấy số kỳ trước làm dự báo" />
                    <MiniStat
                      label="Số ngày giữ lại để đo"
                      value={count(v.holdout_days)}
                      hint="đo trên dữ liệu mô hình chưa từng thấy"
                    />
                  </div>
                  <p className="mb-0 mt-4 text-[13.5px] leading-relaxed text-stone-700">
                    {v.metric} dưới 1 nghĩa là dự báo tốt hơn cách đoán đơn giản nhất, tức là lấy luôn số của kỳ trước.
                    {v.value != null && v.baseline != null && (
                      <>
                        {' '}
                        Ở đây mô hình đạt {decimal(v.value)} so với mốc {decimal(v.baseline)}, nên{' '}
                        {v.beats_baseline === true
                          ? 'nó thắng cách đoán đơn giản, dự báo trên biểu đồ dùng được để lên kế hoạch hàng.'
                          : 'nó chưa thắng cách đoán đơn giản, bạn đừng dựa hẳn vào con số dự báo.'}
                      </>
                    )}
                  </p>
                  <p className="mb-0 mt-2 text-xs leading-relaxed text-stone-500">{v.note}</p>
                </InsightCard>

                <InsightCard
                  title="Đã so những mô hình nào"
                  description={`Mô hình đang dùng: ${modelName(ms.chosen)}.`}
                  footer={<SourceFooter meta={meta} limitation={ms.why} />}
                >
                  <DataTable
                    caption="So sánh MASE của các mô hình trên phần dữ liệu giữ lại"
                    head={
                      <>
                        <th scope="col">Mô hình</th>
                        <th scope="col" className="text-right">MASE</th>
                        <th scope="col">Ghi chú</th>
                      </>
                    }
                  >
                    {modelRows.map(row => (
                      <tr key={row.key} className={ms.chosen === row.key ? 'bg-[#EAF0E2]/50' : ''}>
                        <td className="font-semibold text-stone-800">
                          <span className="flex flex-wrap items-center gap-2">
                            {modelName(row.key)}
                            {ms.chosen === row.key && <Chip tone="good">đang dùng</Chip>}
                          </span>
                        </td>
                        <td className="text-right tabular-nums">
                          {row.value == null ? <Chip tone="neutral">chưa đo</Chip> : <strong>{decimal(row.value)}</strong>}
                        </td>
                        <td className="text-stone-600">{row.hint}</td>
                      </tr>
                    ))}
                  </DataTable>
                  <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">{ms.why}</p>
                </InsightCard>
              </div>

              {data.limitation && (
                <InsightCard title="Dự báo này áp cho cả shop, không cho từng sản phẩm">
                  <div className="flex items-start gap-2">
                    <Info size={15} className="mt-0.5 shrink-0 text-stone-500" aria-hidden />
                    <div className="min-w-0 space-y-2">
                      <p className="m-0 text-[13.5px] leading-relaxed text-stone-700">{data.limitation}</p>
                      <Note>
                        Nói gọn: mỗi sản phẩm bán quá thưa để dự báo riêng, dự báo riêng từng sản phẩm còn sai hơn cả
                        cách đoán đơn giản, nên chỉ dự báo mức tổng của shop.
                      </Note>
                    </div>
                  </div>
                </InsightCard>
              )}
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
