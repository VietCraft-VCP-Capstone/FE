import React from 'react';
import {
  CheckCircle,
  Clock,
  Sparkles,
  Bookmark,
  CheckSquare,
  Square,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import type { Evidence } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';

export interface OccasionMilestone {
  stageIdx: number;
  label: string;
  dateText: string;
  isPassed: boolean;
  isCurrent: boolean;
  checked: boolean;
}

export interface UnifiedOccasionAction {
  id: string;
  occasionId: string;
  occasionName: string;
  phaseBadge: {
    text: string;
    variant: 'amber' | 'blue' | 'emerald' | 'stone';
  };
  deadlineText: string;
  daysLeft: number;
  isUrgent: boolean;
  recommendation: {
    title: string;
    advice: string;
    calculationBasis: string;
    ctaLabel: string;
    targetTab: 'potential' | 'readiness' | 'traits' | 'timeline' | 'hub' | 'trial';
    actionType: string;
  };
  milestones: OccasionMilestone[];
  savedIdeasCount: number;
  calculationBasis: string;
  evidence: Evidence;
}

// Aliases for backward compatibility if needed
export type ActionItem = UnifiedOccasionAction;
export type RunningPlan = UnifiedOccasionAction;

interface Props {
  occasions: UnifiedOccasionAction[];
  onOpenEvidence: (evidence: Evidence) => void;
  onToggleMilestone?: (occasionId: string, stageIdx: number) => void;
  onNavigateTab?: (targetTab: string, occasionId?: string) => void;
  className?: string;
}

export const HubActionFeed: React.FC<Props> = ({
  occasions,
  onOpenEvidence,
  onToggleMilestone,
  onNavigateTab,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {occasions.map((item) => {
        const badgeClasses = {
          amber: 'text-amber-800 bg-amber-50 border-amber-200',
          blue: 'text-blue-700 bg-blue-50 border-blue-200',
          emerald: 'text-emerald-800 bg-emerald-50 border-emerald-200',
          stone: 'text-stone-700 bg-stone-50 border-stone-200',
        }[item.phaseBadge.variant];

        const checkedMilestonesCount = item.milestones.filter((m) => m.checked).length;

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-3 min-w-0 overflow-hidden"
          >
            {/* 1. Header: Dịp & Trạng thái (2 dòng tách bạch, không dính hay tràn viền) */}
            <div className="space-y-2 border-b border-stone-100 pb-2.5 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <h3 className="font-bold text-stone-900 text-sm truncate min-w-0" title={item.occasionName}>
                  {item.occasionName}
                </h3>
                <div className="shrink-0">
                  <EvidenceTrigger evidence={item.evidence} onOpen={onOpenEvidence} />
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-xs">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${badgeClasses}`}>
                  {item.phaseBadge.text}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-stone-500 shrink-0">
                  <Clock size={11} className="text-stone-400 shrink-0" />
                  <span>
                    {item.deadlineText} (còn {item.daysLeft} ngày)
                  </span>
                </span>
              </div>
            </div>

            {/* 2. Khuyến nghị AI có căn cứ từ Backend */}
            <div className="rounded-xl bg-stone-50/70 border border-stone-200/80 p-3 space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 min-w-0">
                <Sparkles size={13} className="text-[#007700] shrink-0" />
                <h4 className="truncate min-w-0" title={item.recommendation.title}>
                  {item.recommendation.title}
                </h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                {item.recommendation.advice}
              </p>
              {item.recommendation.ctaLabel && (
                <button
                  type="button"
                  onClick={() => onNavigateTab?.(item.recommendation.targetTab, item.occasionId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#007700] hover:text-[#005500] hover:underline transition-colors pt-0.5 cursor-pointer"
                >
                  <span>{item.recommendation.ctaLabel}</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>

            {/* 3. Checklist 4 mốc tiến độ chuẩn */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="font-semibold text-stone-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle size={12} className="text-stone-400" />
                  Tiến độ 4 mốc
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  {checkedMilestonesCount}/4 mốc
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-stone-50/60 p-2 rounded-xl border border-stone-200/60 min-w-0">
                {item.milestones.map((ms) => (
                  <button
                    key={ms.stageIdx}
                    type="button"
                    onClick={() => onToggleMilestone?.(item.occasionId, ms.stageIdx)}
                    className="flex items-center gap-1 text-left text-xs text-stone-700 hover:text-stone-900 transition-colors group cursor-pointer min-w-0 overflow-hidden"
                    title={`${ms.label} (${ms.dateText}) - Bấm để đánh dấu hoàn thành`}
                  >
                    {ms.checked ? (
                      <CheckSquare size={13} className="text-[#007700] shrink-0" />
                    ) : (
                      <Square size={13} className="text-stone-400 group-hover:text-stone-600 shrink-0" />
                    )}
                    <span
                      className={`truncate text-[11px] min-w-0 ${
                        ms.checked
                          ? 'line-through text-stone-400 font-normal'
                          : ms.isCurrent
                          ? 'font-bold text-stone-900'
                          : 'font-medium'
                      }`}
                    >
                      {ms.label} <span className="text-stone-400 font-normal">({ms.dateText})</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Footer: Ý tưởng đã lưu & Căn cứ tính toán */}
            <div className="pt-2 border-t border-stone-100 space-y-1 text-[11px] min-w-0">
              <div className="flex items-center justify-between text-stone-500">
                <span className="flex items-center gap-1">
                  <Bookmark size={11} className="text-[#007700]" />
                  Ý tưởng đã lưu: <strong className="text-stone-800 font-semibold">{item.savedIdeasCount}</strong> mẫu
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  {item.daysLeft <= 3 ? 'Sắp đến hạn' : 'Đúng tiến độ'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-stone-400 min-w-0 overflow-hidden">
                <Calculator size={11} className="shrink-0 text-stone-400" />
                <span className="truncate min-w-0" title={item.calculationBasis}>
                  {item.calculationBasis}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
