import { ShieldAlert } from 'lucide-react';
import type { PotentialProfile } from '../../types';
import { TrialPlanCard } from '../product/TrialPlanCard';

interface SeasonalTrialTabProps {
  potentialProfiles?: PotentialProfile[];
}

export function SeasonalTrialTab({
  potentialProfiles = [],
}: SeasonalTrialTabProps) {
  const leadProfile = potentialProfiles[0];
  const trialPlan = leadProfile?.trial_plan;

  return (
    <div className="space-y-4 pt-2">
      {/* TrialPlanCard cho sản phẩm hàng đầu */}
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
            Triết lý vận hành: Không bao giờ đặt cược lớn khi chưa có bằng chứng thực tế
          </h5>
        </div>
        <p className="mb-0 text-stone-600">
          Không có thuật toán AI nào dám khẳng định chắc chắn 100% một sản phẩm sẽ bán chạy. Vì vậy, hệ thống thiết kế thang 3 nấc: <strong>Nấc 1</strong> lắng nghe tín hiệu tương tác tự nhiên (ngân sách 0đ), <strong>Nấc 2</strong> thử nghiệm chi phí nhỏ (10–20 mẫu hoặc làm mẫu POD theo đơn với vốn phôi 0đ) kèm nguyên tắc dừng lỗ chặt chẽ khi chi phí chạm ngưỡng, và <strong>Nấc 3</strong> chỉ mở rộng quy mô khi tỷ lệ chuyển đổi và doanh thu thực tế chứng minh được nhu cầu thị trường.
        </p>
      </div>
    </div>
  );
}
