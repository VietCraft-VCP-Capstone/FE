import { useMemo, useState } from 'react';
import { InsightCard } from '../ui';
import { compactMoney } from '../../../../shared/utils/format';
import { NA, shortDate } from '../../format';
import type { MoneyReport } from '../../moneyTypes';
import { dailyStats, toPoints, type ChartMode } from './dailyData';
import { MoneyDailyChart } from './MoneyDailyChart';

export function MoneyDaily({ data }: { data: MoneyReport }) {
  const [mode, setMode] = useState<ChartMode>('day');
  const points = useMemo(() => toPoints(data.by_day, data.range), [data]);
  const stats = useMemo(() => dailyStats(data.by_day), [data]);
  const loss = data.by_day.filter(d => d.net_vnd < 0).length;
  const notes = [
    'Tính theo ngày đặt đơn, đã trừ tiền hoàn.',
    data.range === '90d' && 'Gộp theo tuần.',
    mode === 'cum'
      ? 'Đường đi lên dốc là lúc tiền về nhiều, đoạn phẳng là những ngày không có đơn.'
      : loss > 0 && `${loss} ngày bị âm do hoàn tiền (cột đỏ).`,
  ];
  const modes: [ChartMode, string][] = [
    ['day', data.range === '90d' ? 'Theo tuần' : 'Theo ngày'],
    ['cum', 'Cộng dồn'],
  ];
  const cells: [string, string][] = [
    ['TB mỗi ngày có đơn', compactMoney(stats.avg)],
    ['Ngày có đơn', `${stats.active}/${stats.total}`],
    ['Cao nhất', stats.best ? `${compactMoney(stats.best.net)} · ${shortDate(stats.best.date)}` : NA],
  ];

  return (
    <InsightCard title="Thực nhận theo ngày" description={notes.filter(Boolean).join(' ')} bodyClassName="px-4 py-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <dl className="grid flex-1 grid-cols-3 gap-3">
          {cells.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-stone-500">{label}</dt>
              <dd className="text-sm font-bold tabular-nums text-stone-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div role="group" aria-label="Kiểu biểu đồ" className="inline-flex rounded-xl border border-stone-200 bg-stone-100/70 p-0.5 text-xs">
          {modes.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                mode === id ? 'bg-white font-semibold text-[#15691a] shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <MoneyDailyChart points={points} avg={data.range === '90d' ? 0 : stats.avg} mode={mode} />
    </InsightCard>
  );
}
