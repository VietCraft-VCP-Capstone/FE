import { ShieldCheck } from 'lucide-react';
import { reputationTier } from '../../../../shared/utils/reputationTier';

const statLabel = 'text-[11px] font-bold uppercase tracking-wider text-stone-500';
const statValue = 'text-2xl font-extrabold leading-none font-jakarta';

const scoreHint = (score: number) =>
  score >= 90 ? '✨ Điểm uy tín xuất sắc: Sản phẩm của bạn được ưu tiên đẩy Top tìm kiếm tự nhiên và được ưu tiên bảo vệ khi phát sinh khiếu nại.'
    : score >= 70 ? 'Gian hàng đạt chuẩn sàn: Duy trì chuỗi đơn sạch không lỗi để nâng hạng lên Nghệ Nhân Uy Tín.'
      : '⚠️ Cảnh báo: Tỷ lệ khiếu nại cao. Hãy cải thiện chất lượng sản phẩm & đóng gói để tránh bị hạn chế hiển thị.';

export function ShopReputationCard({ profile }: { profile: any }) {
  const tier = reputationTier(profile.reputation_tier);
  const streak = profile.clean_streak_orders || 0;
  const disputes = profile.dispute_count_30d || 0;
  const penalty = profile.penalty_points_30d;

  return (
    <section className="mb-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${tier.badge}`}>
              <ShieldCheck size={14} className={profile.reputation_tier === 'TRUSTED' ? 'text-emerald-700' : 'text-current'} />
              {tier.label}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Chỉ số Uy Tín Gian Hàng (SRS)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-stone-700">Điểm uy tín:</span>
            <span className="text-3xl font-extrabold leading-none text-stone-900 font-jakarta">{profile.reputation_score}</span>
            <span className="text-xs font-medium text-stone-400">/ 100 điểm</span>
          </div>
          <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">{scoreHint(profile.reputation_score)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-8 shrink-0">
          <div>
            <dt className={statLabel}>Chuỗi đơn</dt>
            <dd className="m-0 mt-1.5 flex items-baseline gap-1.5">
              <span className={`${statValue} text-stone-900`}>{streak}</span>
              <span className="text-xs text-stone-400">/ 10 đơn</span>
            </dd>
            <div className="mt-2 h-2 w-32 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#007700] transition-all duration-300" style={{ width: `${Math.min(100, streak * 10)}%` }} />
            </div>
            <dd className="m-0 mt-1 text-[11px] text-stone-400">Đạt 10 đơn: +5 điểm SRS</dd>
          </div>
          <div>
            <dt className={statLabel}>Khiếu nại (30 ngày)</dt>
            <dd className="m-0 mt-1.5 flex items-baseline gap-1">
              <span className={`${statValue} ${disputes > 0 ? 'text-amber-600' : 'text-stone-900'}`}>{disputes}</span>
              <span className="text-xs text-stone-400">đơn</span>
            </dd>
            <dd className={`m-0 mt-2 text-[11px] font-medium ${penalty ? 'text-rose-600' : 'text-emerald-700'}`}>
              {penalty ? `Trừ ${penalty} điểm vi phạm` : 'Không có vi phạm'}
            </dd>
          </div>
        </div>
      </div>
    </section>
  );
}
