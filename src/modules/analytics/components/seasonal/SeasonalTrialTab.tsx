import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { PotentialProfile } from '../../types';
import { TrialPlanCard } from '../product/TrialPlanCard';

interface SeasonalTrialTabProps {
  potentialProfiles?: PotentialProfile[];
}

export function SeasonalTrialTab({
  potentialProfiles = [],
}: SeasonalTrialTabProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const safeIdx = Math.min(selectedIdx, Math.max(0, potentialProfiles.length - 1));
  const leadProfile = potentialProfiles[safeIdx];
  const trialPlan = leadProfile?.trial_plan;

  return (
    <div className="space-y-4 pt-2">
      {potentialProfiles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {potentialProfiles.map((prof, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                idx === safeIdx
                  ? 'border-[#007700] bg-[#EAF0E2]/70 text-[#005B00]'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {prof.product_name}
            </button>
          ))}
        </div>
      )}

      {/* TrialPlanCard cho sản phẩm đang chọn */}
      {trialPlan ? (
        <TrialPlanCard trialPlan={trialPlan} />
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-xs text-stone-600">
          Chưa có hồ sơ thử nhỏ nào được lập cho dịp này.
        </div>
      )}

      {/* Nguyên tắc cốt lõi của thang thử nghiệm */}
      <div className="rounded-2xl border border-emerald-200 bg-[#EAF0E2]/30 p-5 text-xs text-stone-700 leading-relaxed space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-[#007700]" />
          <h5 className="m-0 text-xs font-bold text-[#005B00] uppercase tracking-wider">
            Nguyên tắc kiểm soát vốn &amp; Thử nghiệm an toàn
          </h5>
        </div>
        <p className="mb-0 text-stone-600">
          Quy trình 3 nấc giúp giảm thiểu rủi ro tồn kho: <strong>Nấc 1</strong> Đo lường tương tác tự nhiên (0đ chi phí), <strong>Nấc 2</strong> Thử nghiệm số lượng nhỏ (10–20 phôi) kèm điểm dừng lỗ rõ ràng, và <strong>Nấc 3</strong> Mở rộng sản xuất khi tỷ lệ chốt đơn đạt chuẩn kỳ vọng.
        </p>
      </div>
    </div>
  );
}
