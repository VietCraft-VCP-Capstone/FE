import React from 'react';
import { CalendarClock, ShieldCheck, Target } from 'lucide-react';
import type { Evidence, Metric } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';

interface Props {
  kpis: {
    actionsDue14d: Metric<number>;
    capitalNeeded14d?: Metric<string>;
    reliableOccasionsCount: Metric<number>;
    previousErrorPct: Metric<string>;
  };
  onOpenEvidence: (evidence: Evidence) => void;
  className?: string;
}

export const HubKpiStrip: React.FC<Props> = ({ kpis, onOpenEvidence, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3.5 ${className}`}>
      {/* 1. Số dịp cần hành động trong 14 ngày tới */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007700]">
              <CalendarClock size={16} />
            </span>
            <span className="font-semibold text-stone-700">Cần triển khai (14 ngày)</span>
          </div>
          <EvidenceTrigger evidence={kpis.actionsDue14d.evidence} onOpen={onOpenEvidence} />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 tracking-tight">
              {kpis.actionsDue14d.value}
            </span>
            <span className="text-xs font-semibold text-stone-500">{kpis.actionsDue14d.unit}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {kpis.actionsDue14d.comparedWith}
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 font-medium">
            {kpis.actionsDue14d.label === 'observed' ? 'Quan sát' : 'Quy tắc'}
          </span>
          <span className="text-stone-400">Hạn chốt gần</span>
        </div>
      </div>

      {/* 2. Số dịp dự báo đáng tin */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <ShieldCheck size={16} />
            </span>
            <span className="font-semibold text-stone-700">Độ tin cậy cao</span>
          </div>
          <EvidenceTrigger evidence={kpis.reliableOccasionsCount.evidence} onOpen={onOpenEvidence} />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 tracking-tight">
              {kpis.reliableOccasionsCount.value}
            </span>
            <span className="text-xs font-semibold text-stone-500">{kpis.reliableOccasionsCount.unit}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {kpis.reliableOccasionsCount.comparedWith}
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
          <span className="rounded bg-sky-50 text-sky-700 px-1.5 py-0.5 font-medium">Mức Cao / Khá</span>
          <span className="text-stone-400">Kiểm chứng ≥2 kỳ</span>
        </div>
      </div>

      {/* 3. Độ ổn định chu kỳ tìm kiếm */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Target size={16} />
            </span>
            <span className="font-semibold text-stone-700">Độ ổn định chu kỳ</span>
          </div>
          <EvidenceTrigger evidence={kpis.previousErrorPct.evidence} onOpen={onOpenEvidence} />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 tracking-tight">
              {kpis.previousErrorPct.value}
            </span>
            <span className="text-xs font-semibold text-stone-500">{kpis.previousErrorPct.unit}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {kpis.previousErrorPct.comparedWith}
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
          <span className="rounded bg-purple-50 text-purple-700 px-1.5 py-0.5 font-medium">Ổn định cao</span>
          <span className="text-stone-400">Dữ liệu đa kỳ</span>
        </div>
      </div>
    </div>
  );
};
