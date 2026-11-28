import React, { useState } from 'react';
import {
  CheckCircle,
  ChevronDown,
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
        const currentMilestone = item.milestones.find((m) => m.isCurrent);
        const recOpen = !!expanded[`${item.id}:rec`];
        const msOpen = !!expanded[`${item.id}:ms`];
        const basisOpen = !!expanded[`${item.id}:basis`];

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-2.5 min-w-0 overflow-hidden"
          >
            {/* 1. Header: Dịp & Hạn chính */}
            <div className="space-y-1.5 border-b border-stone-100 pb-2.5 min-w-0">
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

            {/* 2. Trường 1: Khuyến nghị hành động (mặc định chỉ hiện tiêu đề chính, bấm để xổ chi tiết) */}
            <div className="rounded-xl bg-stone-50/70 border border-stone-200/80 min-w-0 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(`${item.id}:rec`)}
                className="w-full flex items-center justify-between gap-2 p-2.5 text-left hover:bg-stone-100/60 transition-colors cursor-pointer"
                aria-expanded={recOpen}
              >
                <span className="flex items-center gap-1.5 text-xs font-bold text-stone-900 min-w-0 flex-1">
                  <Sparkles size={13} className="text-[#007700] shrink-0" />
                  <span className="truncate" title={item.recommendation.title}>
                    {item.recommendation.title}
                  </span>
                </span>
                <ChevronDown
                  size={14}
                  className={`text-stone-400 shrink-0 transition-transform ${recOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {recOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-stone-200/60 space-y-2">
                  <p className="text-xs text-stone-600 leading-relaxed break-words m-0">
                    {item.recommendation.advice}
                  </p>
                  {item.recommendation.ctaLabel && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.(item.recommendation.targetTab, item.occasionId)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#007700] hover:text-[#005500] hover:underline transition-colors cursor-pointer"
                    >
                      <span>{item.recommendation.ctaLabel}</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Trường 2: Tiến độ 4 mốc (mặc định chỉ hiện tóm tắt 2/4 mốc, bấm để xổ danh sách) */}
            <div className="rounded-xl border border-stone-200/70 bg-stone-50/40 min-w-0 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(`${item.id}:ms`)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-stone-100/60 transition-colors cursor-pointer"
                aria-expanded={msOpen}
              >
                <span className="flex items-center gap-1.5 text-xs text-stone-700 min-w-0">
                  <CheckCircle size={12} className="text-[#007700] shrink-0" />
                  <span className="font-semibold text-stone-800">Tiến độ:</span>
                  <span className="font-bold text-[#007700]">{checkedMilestonesCount}/4 mốc</span>
                  {currentMilestone && (
                    <span className="text-[11px] text-stone-500 truncate">
                      · {currentMilestone.label} ({currentMilestone.dateText})
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-stone-400 shrink-0 transition-transform ${msOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {msOpen && (
                <div className="grid grid-cols-2 gap-1.5 p-2.5 pt-2 border-t border-stone-200/60 min-w-0">
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
              )}
            </div>

            {/* 4. Trường 3: Ý tưởng đã lưu & Căn cứ tính toán (mặc định chỉ hiện số mẫu, bấm để xổ căn cứ) */}
            <div className="pt-1 border-t border-stone-100 min-w-0">
              <button
                type="button"
                onClick={() => toggleSection(`${item.id}:basis`)}
                className="w-full flex items-center justify-between gap-2 py-1 text-left text-[11px] text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                aria-expanded={basisOpen}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <Bookmark size={11} className="text-[#007700] shrink-0" />
                  <span>
                    Ý tưởng đã lưu: <strong className="text-stone-800 font-semibold">{item.savedIdeasCount}</strong> mẫu
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500">
                    {item.daysLeft <= 3 ? 'Sắp đến hạn' : 'Đúng tiến độ'}
                  </span>
                </span>
                {item.calculationBasis && (
                  <ChevronDown
                    size={13}
                    className={`text-stone-400 shrink-0 transition-transform ${basisOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {basisOpen && item.calculationBasis && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-stone-50 p-2 text-[11px] text-stone-500 min-w-0">
                  <Calculator size={12} className="shrink-0 text-stone-400 mt-0.5" />
                  <span className="break-words leading-relaxed flex-1">
                    {item.calculationBasis}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
