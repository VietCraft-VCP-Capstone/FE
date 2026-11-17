import { CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import type { TrialPlan } from '../../types';
import { money } from '../../../../shared/utils/format';
import { Chip } from '../ui';

interface TrialPlanCardProps {
  trialPlan: TrialPlan;
  className?: string;
}

export function TrialPlanCard({ trialPlan, className = '' }: TrialPlanCardProps) {
  const isPod = trialPlan.mode === 'make_to_order';

  return (
    <div className={`rounded-md border border-stone-200 bg-white p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#007700]" size={16} />
          <h4 className="m-0 text-sm font-bold text-stone-900">
            Kế hoạch thử nghiệm 3 nấc (Thử nhỏ trước khi đặt cược lớn)
          </h4>
        </div>
        <Chip tone={isPod ? 'brand' : 'good'}>
          {trialPlan.mode_label}
        </Chip>
      </div>

      {/* Thông số thử nghiệm */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded bg-stone-50 p-2.5">
          <span className="text-[11px] text-stone-500">Số lượng test an toàn</span>
          <div className="mt-0.5 font-bold text-stone-900">
            {trialPlan.test_quantity === 0 ? '0 sp (Sản xuất theo đơn)' : `${trialPlan.test_quantity} sản phẩm`}
          </div>
        </div>
        <div className="rounded bg-stone-50 p-2.5">
          <span className="text-[11px] text-stone-500">Ngân sách test tối đa</span>
          <div className="mt-0.5 font-bold text-stone-900">
            {money(trialPlan.test_budget_vnd)}
          </div>
        </div>
        <div className="rounded bg-stone-50 p-2.5 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-stone-500">Thời gian đánh giá</span>
          <div className="mt-0.5 font-bold text-stone-900">
            {trialPlan.timeframe_days} ngày
          </div>
        </div>
      </div>

      {/* 3 Nấc bậc thang */}
      <div className="mt-4 space-y-2">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Quy trình 3 nấc kiểm chứng:
        </span>
        <div className="space-y-2">
          {trialPlan.ladder_steps.map((step) => (
            <div
              key={step.step}
              className="flex items-start gap-2.5 rounded border border-stone-200 bg-stone-50/50 p-2.5 text-xs"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#007700] text-[11px] font-bold text-white">
                {step.step}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-stone-900">{step.name}</span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                    {step.threshold}
                  </span>
                </div>
                <div className="mt-0.5 text-stone-600 leading-relaxed text-[11.5px]">
                  {step.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tiêu chí thành công & Cắt lỗ */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-emerald-200 bg-[#EAF0E2]/40 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#005B00]">
            <CheckCircle size={14} />
            <span>Tiêu chí để mở rộng (Scale-up)</span>
          </div>
          <p className="mb-0 mt-1.5 text-[11.5px] leading-relaxed text-stone-700">
            {trialPlan.success_criteria}
          </p>
        </div>

        <div className="rounded border border-amber-200 bg-amber-50/50 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <ShieldAlert size={14} />
            <span>Nguyên tắc cắt lỗ (Stop-loss)</span>
          </div>
          <ul className="mb-0 mt-1.5 list-disc pl-4 text-[11.5px] leading-relaxed text-amber-900 space-y-1">
            {trialPlan.stop_loss_rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
