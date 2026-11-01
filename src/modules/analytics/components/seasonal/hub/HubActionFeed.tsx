import React from 'react';
import { AlertCircle, CheckCircle, Clock, Sparkles } from 'lucide-react';
import type { Evidence, Precedent } from '../../../types/evidence';
import { EvidenceTrigger } from '../../evidence/EvidenceTrigger';
import { PrecedentCard } from '../../evidence/PrecedentCard';

export interface ActionItem {
  id: string;
  title: string;
  occasionName: string;
  deadlineText: string;
  daysLeft: number;
  expectedProfitVnd: string;
  successProbabilityPct: number;
  whyDescription: string;
  evidence: Evidence;
  precedent?: Precedent;
}

export interface RunningPlan {
  id: string;
  occasionName: string;
  planName: string;
  lockedAt: string;
  actualOrders: number;
  expectedMinOrders: number;
  expectedMaxOrders: number;
  actualRevenueVnd: string;
  expectedRevenueRange: string;
  status: 'on_track' | 'warning' | 'exceeded';
  evidence: Evidence;
}

interface Props {
  actions: ActionItem[];
  runningPlans: RunningPlan[];
  onOpenEvidence: (evidence: Evidence) => void;
  className?: string;
}

export const HubActionFeed: React.FC<Props> = ({
  actions,
  runningPlans,
  onOpenEvidence,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {/* Khối B: Việc cần làm tuần này */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-emerald-50 text-[#007700]">
              <Sparkles size={16} />
            </span>
            <h3 className="font-bold text-stone-900 text-sm">Việc cần làm tuần này</h3>
          </div>
          <span className="text-xs text-stone-500">
            Xếp theo mức lãi kỳ vọng trừ chi phí
          </span>
        </div>

        <div className="space-y-3">
          {actions.map(action => (
            <div
              key={action.id}
              className="rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 space-y-2.5 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {action.occasionName}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Clock size={11} />
                      {action.deadlineText} (còn {action.daysLeft} ngày)
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm mt-1">{action.title}</h4>
                </div>
                <EvidenceTrigger evidence={action.evidence} onOpen={onOpenEvidence} />
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">{action.whyDescription}</p>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-stone-500">
                  Lãi tăng thêm kỳ vọng: <strong className="text-stone-900">{action.expectedProfitVnd}</strong> · Xác suất {action.successProbabilityPct}%
                </span>
              </div>

              {/* Thẻ trường hợp tương tự minh chứng cho gợi ý */}
              {action.precedent && <PrecedentCard precedent={action.precedent} className="mt-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Khối C: Kế hoạch đang chạy */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-sky-50 text-sky-700">
              <CheckCircle size={16} />
            </span>
            <h3 className="font-bold text-stone-900 text-sm">Kế hoạch đang chạy</h3>
          </div>
          <span className="text-xs text-stone-500">So với kỳ vọng đã khóa</span>
        </div>

        {runningPlans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-500 space-y-2">
            <p className="font-semibold text-stone-700">Chưa có kế hoạch nào được khóa</p>
            <p>
              Chọn một dịp mua sắm trong danh sách bên dưới và bấm "Áp dụng kế hoạch" để hệ thống theo dõi kết quả thực tế.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {runningPlans.map(plan => {
              const isOnTrack = plan.status === 'on_track';
              const isWarning = plan.status === 'warning';

              return (
                <div
                  key={plan.id}
                  className="rounded-xl border border-stone-200/90 bg-white p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{plan.occasionName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isOnTrack
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isWarning
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {isOnTrack ? 'Đúng tiến độ' : isWarning ? 'Cần chú ý' : 'Vượt kỳ vọng'}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        Bản chụp khóa ngày {plan.lockedAt}
                      </span>
                    </div>
                    <EvidenceTrigger evidence={plan.evidence} onOpen={onOpenEvidence} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    <div>
                      <span className="text-stone-500 block">Số đơn thực tế:</span>
                      <strong className="text-stone-900 text-sm">
                        {plan.actualOrders} đơn
                      </strong>{' '}
                      <span className="text-[11px] text-stone-400">
                        (kỳ vọng {plan.expectedMinOrders}–{plan.expectedMaxOrders})
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Doanh thu đạt:</span>
                      <strong className="text-stone-900 text-sm">{plan.actualRevenueVnd}</strong>
                      <span className="text-[11px] text-stone-400 block">
                        (kỳ vọng {plan.expectedRevenueRange})
                      </span>
                    </div>
                  </div>

                  {isWarning && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>
                        Số đơn tuần này đang chậm hơn 18% so với khoảng kỳ vọng. Đề xuất: kiểm tra lại tồn kho và từ khóa listing.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
