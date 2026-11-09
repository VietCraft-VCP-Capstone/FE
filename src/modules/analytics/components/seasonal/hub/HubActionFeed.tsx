import React from 'react';
import { CheckCircle, Clock, Sparkles, AlertTriangle, Bookmark, CheckSquare, Square, Calculator } from 'lucide-react';
import type { Evidence } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';

export interface ActionItem {
  id: string;
  occasionId: string;
  occasionName: string;
  phaseBadge: {
    text: string;
    variant: 'amber' | 'blue' | 'emerald' | 'rose';
  };
  deadlineText: string;
  daysLeft: number;
  isUrgent: boolean;
  isOverduePrep?: boolean;
  title: string;
  whyDescription: string;
  noteText?: string;
  calculationBasis: string;
  evidence: Evidence;
}

export interface OccasionMilestone {
  stageIdx: number;
  label: string;
  dateText: string;
  isPassed: boolean;
  isCurrent: boolean;
  checked: boolean;
}

export interface RunningPlan {
  id: string;
  occasionId: string;
  occasionName: string;
  eventDateText: string;
  deadlineText: string;
  daysLeft: number;
  statusText: string;
  statusVariant: 'amber' | 'emerald' | 'blue' | 'stone';
  milestones: OccasionMilestone[];
  savedIdeasCount: number;
  operationalNote: string;
  evidence: Evidence;
}

interface Props {
  actions: ActionItem[];
  runningPlans: RunningPlan[];
  onOpenEvidence: (evidence: Evidence) => void;
  onToggleMilestone?: (occasionId: string, stageIdx: number) => void;
  className?: string;
}

export const HubActionFeed: React.FC<Props> = ({
  actions,
  runningPlans,
  onOpenEvidence,
  onToggleMilestone,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {/* Cột trái: Gợi ý việc nên làm theo dịp (Gợi ý tham khảo, không bắt buộc) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-50 text-[#007700]">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Việc gợi ý ưu tiên theo dịp</h3>
              </div>
            </div>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {actions.length} dịp sắp tới
            </span>
          </div>

          <div className="space-y-3.5 mt-3.5">
            {actions.map(action => {
              const badgeVariantClasses = {
                rose: 'text-rose-700 bg-rose-50 border-rose-200',
                amber: 'text-amber-800 bg-amber-50 border-amber-200',
                blue: 'text-blue-700 bg-blue-50 border-blue-200',
                emerald: 'text-emerald-800 bg-emerald-50 border-emerald-200',
              }[action.phaseBadge.variant];

              return (
                <div
                  key={action.id}
                  className="rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 space-y-2.5 hover:bg-stone-50/80 transition-colors flex flex-col justify-between min-h-[190px]"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
                          {action.occasionName}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badgeVariantClasses}`}>
                          {action.phaseBadge.text}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200">
                          <Clock size={11} className="text-stone-500" />
                          {action.deadlineText} (còn {action.daysLeft} ngày)
                        </span>
                      </div>
                      <EvidenceTrigger evidence={action.evidence} onOpen={onOpenEvidence} />
                    </div>

                    <h4 className="font-bold text-stone-900 text-sm leading-snug">{action.title}</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">{action.whyDescription}</p>
                  </div>

                  <div className="pt-2 border-t border-stone-200/60">
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                      <Calculator size={12} className="text-stone-400 shrink-0" />
                      <span className="truncate">{action.calculationBasis}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cột phải: Theo dõi tiến độ & Mốc của shop */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-sky-50 text-sky-700">
                <CheckCircle size={16} />
              </span>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Theo dõi tiến độ &amp; Mốc của shop</h3>
                <p className="text-[11px] text-stone-500">Checklist 4 mốc vận hành &amp; ý tưởng đã lưu theo từng dịp</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {runningPlans.length} kế hoạch theo dõi
            </span>
          </div>

          <div className="space-y-3.5 mt-3.5">
            {runningPlans.map(plan => {
              const statusClasses = {
                amber: 'bg-amber-50 text-amber-800 border-amber-200',
                emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                blue: 'bg-blue-50 text-blue-800 border-blue-200',
                stone: 'bg-stone-50 text-stone-700 border-stone-200',
              }[plan.statusVariant];

              return (
                <div
                  key={plan.id}
                  className="rounded-xl border border-stone-200/90 bg-white p-4 space-y-3 shadow-2xs hover:border-stone-300 transition-colors flex flex-col justify-between min-h-[190px]"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{plan.occasionName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClasses}`}>
                          {plan.statusText}
                        </span>
                      </div>
                      <EvidenceTrigger evidence={plan.evidence} onOpen={onOpenEvidence} />
                    </div>

                    {/* Checklist 4 mốc vận hành thực tế */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/70">
                      {plan.milestones.map(ms => (
                        <button
                          key={ms.stageIdx}
                          type="button"
                          onClick={() => onToggleMilestone?.(plan.occasionId, ms.stageIdx)}
                          className="flex items-center gap-1.5 text-left text-xs text-stone-700 hover:text-stone-900 transition-colors group cursor-pointer"
                          title="Bấm để đánh dấu hoàn thành mốc này"
                        >
                          {ms.checked ? (
                            <CheckSquare size={13} className="text-[#007700] shrink-0" />
                          ) : (
                            <Square size={13} className="text-stone-400 group-hover:text-stone-600 shrink-0" />
                          )}
                          <span className={`truncate text-[11px] ${ms.checked ? 'line-through text-stone-400 font-normal' : 'font-medium'}`}>
                            {ms.label} <span className="text-stone-500 font-normal">({ms.dateText})</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Bookmark size={12} className="text-[#007700]" />
                        <span>Ý tưởng đã lưu: <strong className="text-stone-900 font-semibold">{plan.savedIdeasCount}</strong> mẫu</span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {plan.deadlineText} (còn {plan.daysLeft} ngày)
                      </span>
                    </div>

                    {plan.operationalNote && (
                      <div className="flex items-start gap-1.5 text-[11px] text-stone-600 bg-amber-50/60 p-2 rounded-md border border-amber-200/60 leading-relaxed">
                        <AlertTriangle size={13} className="text-amber-700 shrink-0 mt-0.5" />
                        <span>{plan.operationalNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
