import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { decimal } from '../../format';
import type { IntelAxis, IntelAxisKey, IntelIssue } from '../../intelTypes';
import { Chip, InfoTip, InsightCard, Note } from '../ui';
import { AXIS_HINT, AXIS_KEYS, AXIS_LABEL, AXIS_SHORT, EVIDENCE_LABEL, ISSUE_LABEL } from './intelLabels';

export const issueText = (i: IntelIssue) => ISSUE_LABEL[i.code] ?? i.message ?? i.code;

function AxisRow({ axisKey, axis }: { axisKey: IntelAxisKey; axis: IntelAxis }) {
  const ev = EVIDENCE_LABEL[axis.evidence] ?? EVIDENCE_LABEL.practice;
  return (
    <li className="py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-stone-800">
          {AXIS_LABEL[axisKey]} <InfoTip text={AXIS_HINT[axisKey]} label={`Giải thích trục ${AXIS_LABEL[axisKey]}`} />
        </span>
        {axis.score === null ? (
          <Chip>Thiếu dữ liệu</Chip>
        ) : (
          <span className="ml-auto flex items-center gap-2">
            <Chip tone={ev.tone}>{ev.label}</Chip>
            <span className="w-8 text-right text-sm font-bold tabular-nums text-stone-900">{decimal(axis.score, 0)}</span>
          </span>
        )}
      </div>
      {axis.score !== null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100" aria-hidden>
          <div className="h-full rounded-full bg-[#007700]" style={{ width: `${Math.max(0, Math.min(100, axis.score))}%` }} />
        </div>
      )}
      {axis.score === null && axis.missing_reason && <div className="mt-1"><Note>{axis.missing_reason}</Note></div>}
      {axis.issues.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {axis.issues.map(i => <Chip key={i.code} tone="warn" wrap>{issueText(i)}</Chip>)}
        </div>
      )}
    </li>
  );
}

export function AxisRadar({ axes }: { axes: Record<IntelAxisKey, IntelAxis> }) {
  const drawn = AXIS_KEYS.filter(k => axes[k].score !== null).map(k => ({ axis: AXIS_SHORT[k], score: axes[k].score as number }));
  return (
    <InsightCard title="Điểm theo từng trục" info="Mỗi trục 0 đến 100 là thứ hạng so với các listing cùng nhóm. Trục thiếu dữ liệu không được tính là 0.">
      {drawn.length >= 3 ? (
        <div role="img" aria-label={`Biểu đồ radar ${drawn.length} trục`} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={drawn} outerRadius="68%" margin={{ top: 12, right: 32, bottom: 12, left: 32 }}>
              <PolarGrid stroke={CHART_INK.grid} />
              <PolarAngleAxis dataKey="axis" tick={{ fill: CHART_INK.axis, fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: CHART_INK.axis, fontSize: 10 }} tickCount={3} />
              <Radar dataKey="score" stroke={SERIES.green} fill={SERIES.green} fillOpacity={0.22} strokeWidth={2.5} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Note>Chưa đủ 3 trục có dữ liệu để vẽ biểu đồ. Xem từng trục bên dưới.</Note>
      )}
      <ul className="m-0 mt-2 list-none divide-y divide-stone-100 p-0">
        {AXIS_KEYS.map(k => <AxisRow key={k} axisKey={k} axis={axes[k]} />)}
      </ul>
    </InsightCard>
  );
}
