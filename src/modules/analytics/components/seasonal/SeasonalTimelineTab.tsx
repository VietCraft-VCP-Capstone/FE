import {
  CheckCircle2,
  Circle,
  Hourglass,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { OccasionTimeline } from '../occasions/OccasionTimeline';
import { fullDate } from '../../format';

interface SeasonalTimelineTabProps {
  activeCamp: SeasonalCampaign;
  categoryName?: string;
  checkedMilestones: Record<number, boolean>;
  onToggleMilestone: (idx: number) => void;
}

export function SeasonalTimelineTab({
  activeCamp,
  categoryName,
  checkedMilestones,
  onToggleMilestone,
}: SeasonalTimelineTabProps) {
  const campName = activeCamp.name?.replace(/Lễ Hội |Mùa /gi, '') || 'Chiến dịch';
  const completedCount = Object.values(checkedMilestones).filter(Boolean).length;

  const milestones = activeCamp.milestone_actions?.length
    ? activeCamp.milestone_actions
    : [
        {
          title: `Trước ngày dịp 6 tuần · ${activeCamp.launch_window?.start ? fullDate(activeCamp.launch_window.start) : 'Bắt đầu chuẩn bị'}`,
          desc: `Lấy mẫu thử, chụp ảnh concept theo chủ đề ${campName}, lên listing đón index sớm.`,
        },
        {
          title: `Trước ngày dịp 3 tuần · ${activeCamp.launch_window?.end ? fullDate(activeCamp.launch_window.end) : 'Hạn chót đăng bán'}`,
          desc: `Đăng bán hoàn tất, gắn từ khoá ngách đón tìm kiếm sớm và gom 3-5 đánh giá đầu tiên.`,
        },
        {
          title: `Tuần cao điểm & Hạn chốt nhận đơn · ${activeCamp.launch_window?.peak_date ? fullDate(activeCamp.launch_window.peak_date) : 'Đỉnh cao điểm'}`,
          desc: `Đỉnh mua sắm: tung combo quà tặng để nâng giá trị trung bình đơn hàng.`,
        },
      ];

  return (
    <div className="space-y-5 pt-2">
      {/* OccasionTimeline 4 pha */}
      {activeCamp.occasion_window ? (
        <OccasionTimeline
          window={activeCamp.occasion_window}
          className="shadow-none border border-stone-200/90"
        />
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
          Đang cập nhật lộ trình chu kỳ chi tiết cho dịp {activeCamp.name}.
        </div>
      )}

      {/* Cột mốc thời gian & Kế hoạch hành động */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* 7 Cột: Lộ trình triển khai & Checklist */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
          <div>
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#007700]">
                Lộ trình triển khai theo tuần
              </span>
              <h4 className="m-0 mt-1 text-base font-bold text-stone-900">
                Kế hoạch hành động từng mốc ({completedCount}/3 hoàn thành)
              </h4>
            </div>

            {/* Progress bar gradient */}
            <div className="my-5 rounded-xl bg-stone-50/70 p-4 border border-stone-200/80">
              <div className="relative mb-2 flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-rose-600 mb-1">Hôm nay</span>
                  <span className="h-3 w-3 rounded-full bg-rose-600 ring-4 ring-rose-100 shadow-xs" />
                </div>

                <div className="flex flex-col items-center">
                  <span className="h-3 w-3 rounded-full bg-amber-600 ring-4 ring-amber-100 shadow-xs mt-3" />
                  <span className="text-[11px] font-bold text-stone-800 mt-1">
                    {activeCamp.launch_window?.start ? fullDate(activeCamp.launch_window.start) : 'Trước 6 tuần'}
                  </span>
                  <span className="text-[10px] text-stone-400">Chuẩn bị</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-stone-800 mb-1">
                    {activeCamp.launch_window?.end ? fullDate(activeCamp.launch_window.end) : 'Hạn chót'}
                  </span>
                  <span className="text-[10px] text-stone-400 mb-1">Hạn chót đăng bán</span>
                  <span className="h-3 w-3 rounded-full bg-orange-600 ring-4 ring-orange-100 shadow-xs" />
                </div>

                <div className="flex flex-col items-center">
                  <span className="h-3 w-3 rounded-full bg-[#16a34a] ring-4 ring-emerald-100 shadow-xs mt-3" />
                  <span className="text-[11px] font-bold text-[#007700] mt-1">
                    {activeCamp.launch_window?.peak_date ? fullDate(activeCamp.launch_window.peak_date) : 'Đỉnh'}
                  </span>
                  <span className="text-[10px] text-[#007700] font-semibold">Đỉnh sức mua</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 via-orange-400 to-[#16a34a]" />
            </div>

            {/* Checklist 3 mốc */}
            <div className="space-y-2">
              {milestones.map((m, idx) => {
                const isDone = checkedMilestones[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onToggleMilestone(idx)}
                    className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                      isDone
                        ? 'bg-[#EAF0E2]/40 border border-[#007700]/30'
                        : 'bg-stone-50/70 border border-stone-200/60 hover:bg-stone-100/60'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#007700]" />
                    ) : (
                      <Circle size={18} className="mt-0.5 shrink-0 text-stone-300" />
                    )}
                    <div>
                      <div className={`text-xs font-bold ${isDone ? 'text-[#007700] line-through' : 'text-stone-800'}`}>
                        {m.title}
                      </div>
                      <div className="mt-0.5 text-xs text-stone-500 leading-relaxed">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Định hướng ngành hàng */}
          <div className="mt-4 rounded-xl border border-amber-200/70 bg-[#FEFCE8] p-3.5 text-xs text-stone-700">
            <div className="flex items-start gap-2">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
              <div className="leading-relaxed">
                <strong className="font-bold text-stone-900">
                  Định hướng ngành {categoryName || 'Thời trang & Quà tặng'}:
                </strong>{' '}
                {activeCamp.category_summary || 'Tập trung các sản phẩm có tính ứng dụng cao hoặc phối set quà tặng.'}
              </div>
            </div>
          </div>
        </div>

        {/* 5 Cột: Kỷ luật hạn chót & Đồng hồ đếm ngược */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-amber-700">
              <ShieldAlert size={16} />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Kỷ luật hạn chót (Hard cut-off)
              </span>
            </div>
            <h4 className="m-0 mt-1 text-base font-bold text-stone-900">
              Thời hạn an toàn vận hành
            </h4>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              Hàng thủ công &amp; may mặc cần thời gian chuẩn bị và vận chuyển nội địa (3 – 5 ngày). Nếu tiếp tục nhận đơn quá sát ngày lễ, tỷ lệ giao trễ hoặc khách hủy đơn bùng phát sẽ làm tụt chỉ số vận hành gian hàng.
            </p>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <Hourglass size={16} className="text-rose-600" />
                Hạn chót dừng nhận đơn ship xa:
              </div>
              <div className="mt-1 font-bold text-base text-rose-900">
                {activeCamp.launch_window?.end ? fullDate(activeCamp.launch_window.end) : 'Đang cập nhật'}
              </div>
              <p className="mb-0 mt-1.5 text-[11px] text-rose-700">
                Sau mốc này chỉ nhận đơn giao hỏa tốc hoặc giao gần để đảm bảo hàng tới tay khách trước dịp lễ.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-center">
            <span className="text-xs text-stone-500">Đếm ngược đến đỉnh mua sắm:</span>
            <div className="mt-1 text-2xl font-black text-[#007700]">
              {(activeCamp.timing as any)?.days_until_peak !== undefined
                ? `${(activeCamp.timing as any).days_until_peak} ngày`
                : activeCamp.timing.days_diff > 0
                ? `${activeCamp.timing.days_diff} ngày`
                : 'Cao điểm'}
            </div>
            <span className="text-[11px] text-stone-400">
              (Dự kiến đỉnh: {activeCamp.launch_window?.peak_date ? fullDate(activeCamp.launch_window.peak_date) : 'N/A'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
