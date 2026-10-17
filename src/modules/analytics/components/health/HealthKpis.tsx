/** Bốn ô số liệu đầu trang. */

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { SERIES } from '../../../../shared/components/charts/chartTheme';
import { decimal } from '../../format';
import type { HealthSummaryPoint } from '../../healthTypes';
import type { InsightState } from '../../hooks/useInsight';
import { KpiTile } from '../ui';
import type { ShopStats } from './healthStats';

/** Điểm trung bình hôm nay trừ điểm của ngày gần nhất cách đó ít nhất 7 ngày. */
function weekChange(points: HealthSummaryPoint[]): number | null {
  const last = points[points.length - 1];
  if (!last) return null;
  const cutoff = new Date(`${last.date}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  const iso = cutoff.toISOString().slice(0, 10);
  const before = [...points].reverse().find(p => p.date <= iso);
  return before ? last.avg_score - before.avg_score : null;
}

function PointsChange({ value }: { value: number | null }) {
  if (value === null) return <span>So với 7 ngày trước: —</span>;
  const rounded = Math.round(value * 10) / 10;
  const Icon = rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : Minus;
  const color = rounded > 0 ? 'text-[#005B00]' : rounded < 0 ? 'text-red-700' : 'text-stone-500';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${color}`}>
        <Icon size={14} strokeWidth={2.25} aria-hidden />
        {rounded > 0 ? '+' : ''}{decimal(rounded, 1)} điểm
      </span>
      so với 7 ngày trước
    </span>
  );
}

/** Đường nhỏ không trục, chỉ để thấy chiều đi của điểm. */
function Sparkline({ values }: { values: number[] }) {
  const w = 72;
  const h = 26;
  const min = Math.min(...values);
  const span = Math.max(1, Math.max(...values) - min);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / span) * (h - 4)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="ml-auto self-center" aria-hidden>
      <polyline points={pts} fill="none" stroke={SERIES.green} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function HealthKpis({ stats, total, summary }: {
  stats: ShopStats;
  total: number;
  summary: InsightState<HealthSummaryPoint[]>;
}) {
  const points = summary.kind === 'ready' ? summary.data : [];
  const nScored = stats.scored.length;
  const gain = stats.avg !== null && stats.avgAfter !== null ? Math.round(stats.avgAfter) - Math.round(stats.avg) : 0;
  const withTodos = stats.scored.filter(i => i.todos.length > 0).length;
  const withWarnings = stats.scored.filter(i => i.warnings.length > 0).length;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <KpiTile
        label="Điểm trung bình shop"
        value={stats.avg === null ? '—' : String(Math.round(stats.avg))}
        trailing={points.length >= 2 ? <Sparkline values={points.map(p => p.avg_score)} /> : <span className="text-xs text-stone-500">/ 100</span>}
        hint={<PointsChange value={weekChange(points)} />}
      />
      <KpiTile
        label="Đạt mức Tốt"
        value={`${stats.bands.good}/${nScored || total}`}
        trailing={nScored > 0 && <span className="text-xs font-semibold text-stone-600">{Math.round((stats.bands.good / nScored) * 100)}%</span>}
        hint="sản phẩm từ 80 điểm trở lên"
      />
      <KpiTile
        label="Việc cần làm"
        value={String(stats.nTodos)}
        trailing={withTodos > 0 && <span className="text-xs text-stone-500">ở {withTodos} sản phẩm</span>}
        hint={gain > 0 ? <span>Làm hết: <b className="font-semibold text-[#005B00]">+{gain} điểm</b> trung bình</span> : 'Không còn việc tăng điểm'}
      />
      <KpiTile
        label="Cần kiểm tra"
        value={String(stats.nWarnings)}
        trailing={withWarnings > 0 && <span className="text-xs text-stone-500">ở {withWarnings} sản phẩm</span>}
        hint={stats.nWarnings > 0 ? 'Không trừ điểm, nhưng nên xem lại' : 'Không có cảnh báo nào'}
      />
    </div>
  );
}
