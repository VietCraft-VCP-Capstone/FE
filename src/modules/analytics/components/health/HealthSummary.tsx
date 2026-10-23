import { scoreText } from '../../format';
import type { ListingHealth } from '../../healthTypes';
import { healthTier, TIER_COLOR } from '../intel/intelLabels';
import { ScoreLadder } from './ScoreLadder';
import { visibleTodos } from './visibleTodos';

export function HealthSummary({ data }: { data: ListingHealth }) {
  if (data.score === null) {
    return <p className="m-0 py-6 text-sm text-stone-600">Chưa đủ dữ liệu để chấm sản phẩm này.</p>;
  }
  const tier = healthTier(data.score);
  const todos = visibleTodos(data);
  const potential = todos.length ? Math.min(100, data.score + todos.reduce((s, t) => s + t.impact, 0)) : null;
  const next = data.todos.length === 0
    ? 'Sản phẩm đã đạt đủ các tiêu chí.'
    : todos.length
      ? `Làm ${todos.length} việc bên dưới để lên khoảng ${scoreText(potential)} điểm.`
      : 'Chỉ còn vài điểm nhỏ có thể cải thiện thêm.';

  return (
    <section className="grid gap-x-10 gap-y-6 py-2 md:grid-cols-[auto_minmax(0,1fr)] md:items-end">
      <div>
        <p className="m-0 text-sm text-stone-500">Điểm sức khoẻ</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-jakarta text-6xl font-extrabold leading-none tracking-tight tabular-nums text-stone-900">{scoreText(data.score)}</span>
          <span className="text-base text-stone-400">/ 100</span>
        </div>
        <p className="m-0 mt-2 text-sm font-semibold" style={{ color: TIER_COLOR[tier.tone] }}>{tier.label}</p>
      </div>
      <div className="min-w-0">
        <p className="m-0 mb-4 max-w-[60ch] text-[15px] text-stone-800">{next}</p>
        <ScoreLadder score={data.score} potential={potential} />
      </div>
    </section>
  );
}
