import { scoreText } from '../../format';
import type { ListingHealth } from '../../healthTypes';
import { healthTier, TIER_COLOR } from '../intel/intelLabels';
import { Chip } from '../ui';
import { CAP_FIELD, scorePlan } from './visibleTodos';

function verdict(data: ListingHealth): { lead: string; rest?: string } {
  const { now, todos, potential } = scorePlan(data);
  if (data.cap) {
    const where = data.cap.fields.map(f => CAP_FIELD[f] ?? f).join(', ');
    return {
      lead: `Điểm đang bị khoá ở ${Math.floor(data.cap.score)}`,
      rest: `Còn lỗi ở ${where}. Sửa lỗi gấp trước, điểm sẽ lên ${Math.floor(data.cap.raw)}.`,
    };
  }
  if (potential > Math.floor(now)) return { lead: `Còn ${todos.length} việc để lên ${potential} điểm` };
  return { lead: 'Sản phẩm đã tối ưu tốt', rest: 'Không còn việc nào tăng thêm điểm.' };
}

export function ScoreHero({ data }: { data: ListingHealth }) {
  const tier = healthTier(data.score);
  const v = verdict(data);
  const { now, potential } = scorePlan(data);
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-jakarta text-6xl font-extrabold leading-none tabular-nums text-stone-900">{scoreText(data.score)}</span>
        <span className="text-lg font-semibold text-stone-400">/100</span>
        <Chip tone={tier.tone}>{tier.label}</Chip>
      </div>
      <div
        className="relative mt-4 h-2 overflow-hidden rounded-full bg-stone-100"
        role="img"
        aria-label={`Đang ${Math.floor(now)} điểm, có thể lên ${potential} điểm`}
      >
        <div className="absolute inset-y-0 left-0 rounded-full bg-[#007700]/25" style={{ width: `${potential}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, now)}%`, background: TIER_COLOR[tier.tone] }} />
      </div>
      <p className={`m-0 mt-3 text-base font-bold leading-snug ${data.cap ? 'text-rose-800' : 'text-stone-900'}`}>{v.lead}</p>
      {v.rest && <p className="m-0 mt-0.5 text-sm text-stone-600">{v.rest}</p>}
    </div>
  );
}
