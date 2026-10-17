import { Fragment, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { count } from '../../../../shared/utils/format';
import { NA, pct } from '../../format';

export interface FunnelStage {
  label: string;
  value: number;
  icon: ReactNode;
}

function Stage({ stage, top, first }: { stage: FunnelStage; top: number; first: boolean }) {
  const share = top ? (stage.value / top) * 100 : 0;
  return (
    <div className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-stone-600">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F7EE] text-[#007700]" aria-hidden>
          {stage.icon}
        </span>
        {stage.label}
      </div>
      <div className="mt-3 font-jakarta text-[26px] font-extrabold leading-none tabular-nums text-stone-900">{count(stage.value)}</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <div className="h-full rounded-full bg-[#1a6b1a]" style={{ width: `${Math.max(2, share)}%` }} />
      </div>
      <div className="mt-1.5 text-xs text-stone-500">{first ? 'Mốc 100%' : `${pct(share, 1)} người xem`}</div>
    </div>
  );
}

function Connector({ rate, lost, weakest }: { rate: number | null; lost: number; weakest: boolean }) {
  const ten = rate == null ? NA : pct(rate, 1);
  return (
    <div
      className="flex shrink-0 items-center justify-center gap-2 py-2 md:w-32 md:flex-col md:gap-1 md:py-0"
      aria-label={`${ten} đi tiếp, ${lost} người rời đi${weakest ? ', khâu yếu nhất' : ''}`}
    >
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${weakest ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
        {ten}
        <ArrowRight size={12} className="rotate-90 md:rotate-0" aria-hidden />
      </span>
      <span className="text-xs text-stone-500">{count(lost)} rời đi</span>
      {weakest && <span className="text-[11px] font-semibold text-amber-700">Khâu yếu nhất</span>}
    </div>
  );
}

export function FunnelFlow({ stages, rates, weakest }: {
  stages: FunnelStage[];
  rates: (number | null)[];
  weakest: number | null;
}) {
  const top = stages[0]?.value || 0;
  return (
    <div className="flex flex-col items-stretch md:flex-row" aria-label="Các bước từ xem tới mua">
      {stages.map((s, i) => (
        <Fragment key={s.label}>
          {i > 0 && <Connector rate={rates[i - 1]} lost={Math.max(0, stages[i - 1].value - s.value)} weakest={weakest === i} />}
          <Stage stage={s} top={top} first={i === 0} />
        </Fragment>
      ))}
    </div>
  );
}
