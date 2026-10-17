/** Điểm theo ngày của một sản phẩm. */

import { useState } from 'react';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { TrendChart } from '../../../shared/components/charts/TrendChart';
import { decimal, fullDate, shortDate } from '../format';
import { useInsight, type InsightState } from '../hooks/useInsight';
import type { HealthHistoryPoint } from '../healthTypes';
import { InsightCard, Note, Skeleton } from './ui';

const DAY_OPTIONS = [30, 90] as const;
type HistoryDays = (typeof DAY_OPTIONS)[number];

const BAND_LINES = [
  { y: 80, label: 'Tốt từ 80' },
  { y: 50, label: 'Kém dưới 50' },
];

export function HealthHistory({ productId }: { productId: string }) {
  const [days, setDays] = useState<HistoryDays>(30);
  const { state } = useInsight<HealthHistoryPoint[]>(`/listings/${productId}/health/history`, { days });

  return (
    <InsightCard
      title="Điểm theo ngày"
      info="Điểm tăng ngay sau khi bạn sửa sản phẩm, và giảm dần nếu lâu không cập nhật ảnh, mô tả, tag."
      bodyClassName="px-4 py-3"
      action={
        <div role="group" aria-label="Khoảng thời gian của lịch sử điểm" className="inline-flex rounded-md bg-stone-100 p-0.5">
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => setDays(d)}
              className={`cursor-pointer rounded border-none px-2.5 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] motion-reduce:transition-none ${
                days === d ? 'bg-white text-stone-900 shadow-sm' : 'bg-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      }
    >
      <HistoryBody state={state} days={days} />
    </InsightCard>
  );
}

function HistoryBody({ state, days }: { state: InsightState<HealthHistoryPoint[]>; days: number }) {
  if (state.kind === 'loading') return <Skeleton className="h-[140px] w-full" />;

  if (state.kind === 'insufficient') {
    const n = state.meta?.quality?.sample_size ?? 0;
    return (
      <Note>
        {n === 1
          ? 'Mới có điểm của một ngày, lịch sử sẽ hiện từ ngày thứ hai.'
          : `Chưa có điểm nào trong ${days} ngày qua.`}
      </Note>
    );
  }

  if (state.kind !== 'ready') return <Note>Chưa đọc được lịch sử điểm.</Note>;

  const points = state.data;
  const first = points[0];
  const last = points[points.length - 1];
  const change = last.score - first.score;
  const rows = points.map(p => ({ label: shortDate(p.date), score: p.score }));

  return (
    <div className="space-y-1.5">
      <TrendChart
        data={rows}
        series={[{ key: 'score', name: 'Điểm sức khoẻ', color: SERIES.green }]}
        height={140}
        yDomain={[0, 100]}
        thresholds={BAND_LINES}
        formatValue={n => decimal(n, 1)}
        ariaLabel={`Điểm sức khoẻ từ ${fullDate(first.date)} đến ${fullDate(last.date)}, từ ${decimal(first.score, 1)} thành ${decimal(last.score, 1)}`}
      />
      <Note>
        Từ {fullDate(first.date)}: {decimal(first.score, 1)} → {decimal(last.score, 1)} điểm
        {change === 0 ? ' (không đổi)' : ` (${change > 0 ? '+' : ''}${decimal(change, 1)})`}.
      </Note>
    </div>
  );
}
