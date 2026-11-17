import { Sparkles } from 'lucide-react';

export interface BarStep {
  key: string;
  label: string;
  from: number;
  to: number;
  gate?: boolean;
  tip: string;
}

export function ScoreBar({ now, potential }: { now: number; steps?: BarStep[]; potential: number }) {
  const roundedNow = Math.floor(now);
  const gain = potential - roundedNow;

  return (
    <div className="space-y-2 pt-1 pb-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-baseline gap-1.5">
          <span className="text-stone-500 font-medium text-xs">Điểm hiện tại:</span>
          <span className="font-black text-stone-900 tabular-nums text-sm">
            {roundedNow}/100
          </span>
        </div>

        {potential > now && (
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span>Mục tiêu khả thi:</span>
            <span className="font-extrabold text-[#007700] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 tabular-nums text-[11px] inline-flex items-center gap-1">
              <Sparkles size={11} />
              {potential}/100 (+{gain}đ)
            </span>
          </div>
        )}
      </div>

      {/* Sleek 6px progress track */}
      <div className="relative h-2 w-full rounded-full bg-stone-100 overflow-hidden">
        {/* Current score fill */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-[#007700] transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(now, 3))}%` }}
        />
      </div>
    </div>
  );
}
