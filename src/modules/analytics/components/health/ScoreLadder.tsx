import { scoreText } from '../../format';
import { AxisLabel, Marker } from './Marker';

const ZONES = [
  { from: 0, to: 50, label: 'Kém', color: 'bg-red-600' },
  { from: 50, to: 80, label: 'Cần cải thiện', color: 'bg-amber-500' },
  { from: 80, to: 100, label: 'Tốt', color: 'bg-green-700' },
];

export function ScoreLadder({ score, potential }: { score: number; potential: number | null }) {
  const now = Math.max(0, Math.min(100, score));
  const next = potential !== null && potential > now + 1 ? Math.min(100, potential) : null;
  const apart = next !== null && next - now >= 22;
  const label = `Điểm hiện tại ${scoreText(now)} trên 100${next !== null ? `, có thể lên ${scoreText(next)} nếu làm các việc bên dưới` : ''}`;
  return (
    <div role="img" aria-label={label} className="max-w-2xl">
      <div className="relative h-10">
        <Marker pos={now} label={apart || next === null ? `Bây giờ ${scoreText(now)}` : `${scoreText(now)} lên ${scoreText(next)}`} />
        {next !== null && <Marker pos={next} label={apart ? `Sau khi sửa ${scoreText(next)}` : ''} tone="green" />}
      </div>
      <div className="flex gap-0.5">
        {ZONES.map(z => <div key={z.label} className={`h-1.5 ${z.color} ${z.from === 0 ? 'rounded-l-sm' : ''} ${z.to === 100 ? 'rounded-r-sm' : ''}`} style={{ width: `${z.to - z.from}%` }} />)}
      </div>
      <div className="relative mt-3 h-4 text-[11px] text-stone-500">
        {ZONES.map(z => <AxisLabel key={z.label} pos={(z.from + z.to) / 2}>{z.label}</AxisLabel>)}
      </div>
    </div>
  );
}
