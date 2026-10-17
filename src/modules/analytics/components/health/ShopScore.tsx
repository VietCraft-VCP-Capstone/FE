import { Progress } from 'antd';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { decimal } from '../../format';
import type { HealthSummaryPoint } from '../../healthTypes';
import type { InsightState } from '../../hooks/useInsight';
import type { HealthStatus } from '../../types';
import { HEALTH_BANDS } from '../HealthParts';
import { InsightCard } from '../ui';
import { ClearButton } from './HealthBreakdowns';
import { BAND_COLOR, FOCUS, bandOf, type ShopStats } from './healthStats';

const VERDICT: Record<HealthStatus, string> = {
  good: 'Sản phẩm đăng chỉn chu, giữ vững nhé.',
  needs_improvement: 'Khá ổn, sửa thêm vài chỗ là lên mức Tốt.',
  poor: 'Nhiều sản phẩm còn sơ sài, nên sửa sớm.',
};

function weekChange(points: HealthSummaryPoint[]): number | null {
  const last = points[points.length - 1];
  if (!last) return null;
  const cutoff = new Date(`${last.date}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const iso = cutoff.toISOString().slice(0, 10);
  const before = [...points].reverse().find(p => p.date <= iso);
  return before ? last.avg_score - before.avg_score : null;
}

function WeekChange({ value }: { value: number | null }) {
  if (value === null) return null;
  const rounded = Math.round(value * 10) / 10;
  const Icon = rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : Minus;
  const color = rounded > 0 ? 'text-[#005B00]' : rounded < 0 ? 'text-red-700' : 'text-stone-500';
  return (
    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${color}`}>
        <Icon size={14} strokeWidth={2.25} aria-hidden />
        {rounded > 0 ? '+' : ''}{decimal(rounded, 1)} điểm
      </span>
      so với tuần trước
    </span>
  );
}

function BandPicker({ bands, active, onPick }: { bands: Record<HealthStatus, number>; active: string; onPick: (band: string) => void }) {
  return (
    <div role="group" aria-label="Lọc bảng theo mức điểm" className="grid grid-cols-3 gap-2">
      {HEALTH_BANDS.map(b => {
        const n = bands[b.status];
        const on = active === b.status;
        return (
          <button
            key={b.status}
            type="button"
            aria-pressed={on}
            disabled={n === 0 && !on}
            onClick={() => onPick(on ? '' : b.status)}
            className={`flex cursor-pointer flex-col items-start rounded-md border px-3 py-2 text-left transition-colors duration-150 disabled:cursor-default disabled:opacity-60 motion-reduce:transition-none ${FOCUS} ${on ? 'border-[#007700] bg-[#F3F7EE]' : 'border-stone-200 bg-white hover:border-stone-400'}`}
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BAND_COLOR[b.status] }} aria-hidden />
              {b.label}
            </span>
            <span className="mt-0.5 font-jakarta text-xl font-extrabold leading-tight tabular-nums text-stone-900">{n}</span>
            <span className="text-[11px] text-stone-500">{b.range}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ShopScore({ stats, bands, scope, summary, active, onPick, className }: {
  stats: ShopStats;
  bands: Record<HealthStatus, number>;
  scope?: string;
  summary: InsightState<HealthSummaryPoint[]>;
  active: string;
  onPick: (band: string) => void;
  className?: string;
}) {
  const avg = stats.avg === null ? null : Math.round(stats.avg);
  const after = stats.avgAfter === null ? null : Math.round(stats.avgAfter);
  const points = summary.kind === 'ready' ? summary.data : [];
  return (
    <InsightCard
      title="Điểm của shop"
      info="Trung bình điểm các sản phẩm đã chấm. Bấm một mức bên dưới để lọc bảng sản phẩm."
      action={active ? <ClearButton onClick={() => onPick('')} /> : undefined}
      className={className}
      bodyClassName="flex flex-col gap-4 p-4"
    >
      <div className="flex items-center gap-4">
        <Progress
          type="circle"
          size={104}
          strokeWidth={9}
          percent={avg ?? 0}
          strokeColor={avg === null ? undefined : BAND_COLOR[bandOf(avg)]}
          format={() => (
            <span className="flex flex-col items-center leading-none">
              <span className="font-jakarta text-[28px] font-extrabold tabular-nums text-stone-900">{avg ?? '—'}</span>
              <span className="mt-1 text-[11px] text-stone-500">/ 100</span>
            </span>
          )}
        />
        <div className="min-w-0 space-y-1.5">
          <p className="m-0 text-[15px] font-bold leading-snug text-stone-900">{avg === null ? 'Đang chấm điểm sản phẩm' : VERDICT[bandOf(avg)]}</p>
          <WeekChange value={weekChange(points)} />
          {avg !== null && after !== null && after > avg && (
            <p className="m-0 text-[13px] leading-relaxed text-stone-600">
              Làm hết <b className="text-stone-900">{stats.nTodos} việc</b> gợi ý, điểm shop lên khoảng{' '}
              <b className="text-[#005B00]">{after}</b>.
            </p>
          )}
        </div>
      </div>
      {scope && <p className="-mb-2 m-0 text-xs text-stone-500">Số sản phẩm mỗi mức, chỉ đếm sản phẩm {scope}:</p>}
      <BandPicker bands={bands} active={active} onPick={onPick} />
      {stats.unscored > 0 && <p className="m-0 text-xs text-stone-500">+ {stats.unscored} sản phẩm đang chấm, có điểm sau khoảng 1 phút.</p>}
    </InsightCard>
  );
}
