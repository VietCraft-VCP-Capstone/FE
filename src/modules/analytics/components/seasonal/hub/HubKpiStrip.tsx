import React from 'react';
import { CalendarClock, DollarSign, ShieldCheck, Target } from 'lucide-react';
import type { Evidence, Metric } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';

interface Props {
  kpis: {
    actionsDue14d: Metric<number>;
    capitalNeeded14d: Metric<string>;
    reliableOccasionsCount: Metric<number>;
    previousErrorPct: Metric<string>;
  };
  onOpenEvidence: (evidence: Evidence) => void;
  className?: string;
}

export const HubKpiStrip: React.FC<Props> = ({ kpis, onOpenEvidence, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 ${className}`}>
      {/* 1. Số dịp cần hành động trong 14 ngày tới */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007700]">
              <CalendarClock size={16} />
            </span>
            <span className="font-semibold text-stone-700">Dịp cần làm 14 ngày tới</span>
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
          <span className="text-stone-400">Hạn chốt đơn sắp đến</span>
        </div>
      </div>

      {/* 2. Tiền vốn cần chuẩn bị 14 ngày */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <DollarSign size={16} />
            </span>
            <span className="font-semibold text-stone-700">Tiền nhập hàng 14 ngày</span>
          </div>
          <EvidenceTrigger evidence={kpis.capitalNeeded14d.evidence} onOpen={onOpenEvidence} />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-stone-900 tracking-tight">
              {kpis.capitalNeeded14d.value}
            </span>
            <span className="text-xs font-semibold text-stone-500">{kpis.capitalNeeded14d.unit}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {kpis.capitalNeeded14d.comparedWith}
          </p>
        </div>
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 font-medium">Dự toán</span>
          <span className="text-stone-400">Theo giá vốn khai báo</span>
        </div>
      </div>

      {/* 3. Số dịp dự báo đáng tin */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <ShieldCheck size={16} />
            </span>
            <span className="font-semibold text-stone-700">Dịp dự báo đáng tin</span>
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
          <span className="text-stone-400">Đã kiểm chứng ≥2 kỳ</span>
        </div>
      </div>

      {/* 4. Dự báo dịp trước lệch bao nhiêu % */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-stone-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Target size={16} />
            </span>
            <span className="font-semibold text-stone-700">Dự báo dịp trước lệch</span>
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
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-600 font-medium">Báo cáo sau dịp</span>
          <span className="text-stone-400">Tốt hơn số năm ngoái</span>
        </div>
      </div>
    </div>
  );
};
