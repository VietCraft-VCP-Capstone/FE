import { scoreText } from '../../format';

const ZONES = [
  { from: 0, to: 50, label: 'Kém (<50)', color: 'from-rose-500 to-rose-400', dot: 'bg-rose-500' },
  { from: 50, to: 80, label: 'Cần cải thiện (50-79)', color: 'from-amber-400 to-amber-500', dot: 'bg-amber-500' },
  { from: 80, to: 100, label: 'Tốt (≥80)', color: 'from-emerald-500 to-emerald-600', dot: 'bg-emerald-600' },
];

export function ScoreLadder({ score, potential }: { score: number; potential: number | null }) {
  const now = Math.max(0, Math.min(100, score));
  const next = potential !== null && potential > now + 1 ? Math.min(100, potential) : null;
  const label = `Điểm hiện tại ${scoreText(now)} trên 100${next !== null ? `, có thể lên ${scoreText(next)} nếu làm các việc bên dưới` : ''}`;

  return (
    <div role="img" aria-label={label} className="w-full max-w-2xl">
      {/* Markers */}
      <div className="relative mb-2 h-7">
        {/* Current score marker */}
        <div
          className="absolute -translate-x-1/2 transition-all duration-300"
          style={{ left: `${Math.max(6, Math.min(94, now))}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="whitespace-nowrap rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              Hiện tại: {scoreText(now)}
            </span>
            <span className="h-2 w-0.5 bg-stone-900" />
          </div>
        </div>

        {/* Potential target marker */}
        {next !== null && (
          <div
            className="absolute -translate-x-1/2 transition-all duration-300"
            style={{ left: `${Math.max(6, Math.min(94, next))}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="whitespace-nowrap rounded-full bg-[#007700] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs ring-2 ring-emerald-200">
                Tiềm năng: {scoreText(next)}
              </span>
              <span className="h-2 w-0.5 bg-[#007700]" />
            </div>
          </div>
        )}
      </div>

      {/* Track bar */}
      <div className="flex h-3 w-full gap-1 overflow-hidden rounded-full bg-stone-100 p-0.5 shadow-inner">
        {ZONES.map(z => (
          <div
            key={z.label}
            className={`h-full rounded-full bg-gradient-to-r ${z.color}`}
            style={{ width: `${z.to - z.from}%` }}
          />
        ))}
      </div>

      {/* Zone legends */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        {ZONES.map(z => (
          <span key={z.label} className="flex items-center gap-1.5 font-medium">
            <span className={`h-2 w-2 rounded-full ${z.dot}`} />
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}
