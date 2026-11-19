import { scoreText } from '../../format';
import type { HealthBlocker, ListingHealth } from '../../healthTypes';
import type { HealthStatus } from '../../types';
import { TIER_COLOR } from '../intel/intelLabels';
import { Chip } from '../ui';
import { statusInfo } from './factorState';

const statusOf = (data: ListingHealth): HealthStatus | null => {
  if (data.status) return data.status;
  if (typeof data.score !== 'number') return null;
  if (data.score >= 80) return 'good';
  return data.score >= 50 ? 'needs_improvement' : 'poor';
};

function Blockers({ items }: { items: HealthBlocker[] }) {
  return (
    <div className="mt-3 rounded-lg bg-red-50 p-3">
      <Chip tone="bad">Bị chặn bán</Chip>
      <ul className="m-0 mt-2 list-none space-y-1 p-0 text-sm text-red-800">
        {items.map(b => <li key={b.message}>{b.message}</li>)}
      </ul>
    </div>
  );
}

export function ScoreHero({ data }: { data: ListingHealth }) {
  const info = statusInfo(statusOf(data));
  const now = data.score ?? 0;
  const { coverage } = data;
  const blockers = data.blockers ?? [];
  return (
    <div>
      <p className="m-0 mb-1.5 text-xs font-semibold text-stone-500">Độ hoàn thiện trang sản phẩm</p>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-jakarta text-6xl font-extrabold leading-none tabular-nums text-stone-900">{scoreText(data.score)}</span>
        <span className="text-lg font-semibold text-stone-400">/100</span>
        <Chip tone={info.tone}>{info.label}</Chip>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-stone-100" role="img" aria-label={`Đang ${Math.floor(now)} điểm`}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, now)}%`, background: TIER_COLOR[info.tone] }} />
      </div>
      {coverage && <p className="m-0 mt-3 text-sm text-stone-600">Đánh giá {coverage.evaluated}/{coverage.total} tiêu chí</p>}
      {blockers.length > 0 && <Blockers items={blockers} />}
    </div>
  );
}
