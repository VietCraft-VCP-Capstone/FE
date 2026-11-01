import type { ReactNode } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Clock, Flag, Flame, Layers, Rocket } from 'lucide-react';
import type { OccasionWindow } from '../../types';
import { Chip, InfoTip } from '../ui';
import { shortDate } from '../../format';

interface OccasionTimelineProps {
  window: OccasionWindow;
  className?: string;
}

const PHASE_LABELS: Record<string, { label: string; icon: ReactNode; tone: 'brand' | 'good' | 'warn' | 'bad' | 'neutral' }> = {
  rd_sprint: {
    label: 'Pha 1: R&D Sprint (Chuẩn bị mẫu & Chụp ảnh)',
    icon: <Layers size={14} />,
    tone: 'brand',
  },
  traction: {
    label: 'Pha 2: Đón sóng sớm (Thử nhỏ & Gom review)',
    icon: <Rocket size={14} />,
    tone: 'good',
  },
  peak: {
    label: 'Pha 3: Đỉnh sóng cao điểm (Vận hành tối đa)',
    icon: <Flame size={14} />,
    tone: 'warn',
  },
  cut_off_passed: {
    label: 'Pha 4: Đã qua hạn chót (Ngừng nhận đơn dịp này)',
    icon: <Clock size={14} />,
    tone: 'bad',
  },
  upcoming: {
    label: 'Chưa tới chu kỳ mở bán',
    icon: <Calendar size={14} />,
    tone: 'neutral',
  },
};

export function OccasionTimeline({ window: ow, className = '' }: OccasionTimelineProps) {
  const currentPhaseInfo = PHASE_LABELS[ow.current_phase] || {
    label: ow.current_phase,
    icon: <Clock size={14} />,
    tone: 'neutral' as const,
  };

  return (
    <div className={`rounded-md border border-stone-200 bg-white p-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-[#007700]" size={18} />
          <h3 className="m-0 text-sm font-bold text-stone-900">
            Chu kỳ 4 pha & Hạn chót nhận đơn: {ow.name}
          </h3>
          <InfoTip
            text="Chu kỳ mua sắm chia làm 4 pha độc lập. Điểm mấu chốt của hàng thủ công/POD là hạn chót ngừng nhận đơn (Hard Cut-off) để trừ hao thời gian sản xuất và vận chuyển tránh giao trễ qua dịp."
            label="Chi tiết chu kỳ thời gian"
          />
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={currentPhaseInfo.tone} icon={currentPhaseInfo.icon}>
            {currentPhaseInfo.label}
          </Chip>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="mt-3">
        {ow.is_safe_to_launch ? (
          <div className="flex items-start gap-2.5 rounded-md border border-emerald-200 bg-[#EAF0E2]/60 p-3 text-xs text-[#005B00]">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#007700]" />
            <div>
              <span className="font-bold">Kịp chu kỳ chuẩn bị và ra hàng: </span>
              Còn <strong className="underline">{ow.days_to_cutoff} ngày</strong> trước hạn chót ngừng nhận đơn ({shortDate(ow.cut_off_date)})
              và <strong className="underline">{ow.days_to_peak} ngày</strong> trước đỉnh nhu cầu cao nhất ({shortDate(ow.peak_date)}).
              Thời gian dự trữ sản xuất & giao hàng (lead-time): <strong>{ow.lead_time_days} ngày</strong>.
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <span className="font-bold">Cảnh báo rủi ro chu kỳ: </span>
              {ow.timing_warning || `Đã cận kề hoặc vượt quá hạn chót an toàn (${shortDate(ow.cut_off_date)}).`}
              <span className="block mt-1 text-[11px] text-amber-800">
                Khuyến nghị: Không nhập số lượng lớn hàng tồn kho cho dịp này vì đơn sản xuất hoặc giao hàng có nguy cơ tới tay khách sau lễ, dẫn tới tỷ lệ hủy đơn cao.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4-Phase Step Progress Visualizer */}
      <div className="mt-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          {/* Phase 1 */}
          <div className={`rounded border p-2.5 text-xs transition-colors ${
            ow.current_phase === 'rd_sprint'
              ? 'border-[#007700] bg-emerald-50/50 ring-1 ring-[#007700]'
              : 'border-stone-200 bg-stone-50/70 text-stone-600'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
              <span>PHA 1: R&D SPRINT</span>
              <Layers size={13} className={ow.current_phase === 'rd_sprint' ? 'text-[#007700]' : ''} />
            </div>
            <div className="mt-1 font-bold text-stone-900">Chuẩn bị mẫu & Ảnh</div>
            <div className="mt-1 text-[11px] text-stone-500">
              Từ {shortDate(ow.rd_start)}
            </div>
            <div className="mt-1.5 text-[10.5px] leading-tight text-stone-600">
              Lên thiết kế, làm phôi thử, đăng listing sớm để sàn kịp index từ khóa.
            </div>
          </div>

          {/* Phase 2 */}
          <div className={`rounded border p-2.5 text-xs transition-colors ${
            ow.current_phase === 'traction'
              ? 'border-[#007700] bg-emerald-50/50 ring-1 ring-[#007700]'
              : 'border-stone-200 bg-stone-50/70 text-stone-600'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
              <span>PHA 2: TRACTION</span>
              <Rocket size={13} className={ow.current_phase === 'traction' ? 'text-[#007700]' : ''} />
            </div>
            <div className="mt-1 font-bold text-stone-900">Đón sóng sớm</div>
            <div className="mt-1 text-[11px] text-stone-500">
              Từ {shortDate(ow.traction_start)}
            </div>
            <div className="mt-1.5 text-[10.5px] leading-tight text-stone-600">
              Chạy test ngân sách nhỏ, gom 5–10 đánh giá thật để sẵn sàng trước giờ G.
            </div>
          </div>

          {/* Phase 3 */}
          <div className={`rounded border p-2.5 text-xs transition-colors ${
            ow.current_phase === 'peak'
              ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
              : 'border-stone-200 bg-stone-50/70 text-stone-600'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
              <span>PHA 3: CAO ĐIỂM</span>
              <Flame size={13} className={ow.current_phase === 'peak' ? 'text-amber-600' : ''} />
            </div>
            <div className="mt-1 font-bold text-stone-900">Đỉnh nhu cầu</div>
            <div className="mt-1 text-[11px] text-stone-500">
              Từ {shortDate(ow.peak_start)}
            </div>
            <div className="mt-1.5 text-[10.5px] leading-tight text-stone-600">
              Lượng tìm kiếm tăng vọt. Vận hành công suất in ấn / đóng gói tối đa.
            </div>
          </div>

          {/* Phase 4 */}
          <div className={`rounded border p-2.5 text-xs transition-colors ${
            ow.current_phase === 'cut_off_passed'
              ? 'border-red-400 bg-red-50/50 ring-1 ring-red-400'
              : 'border-stone-200 bg-stone-50/70 text-stone-600'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
              <span>PHA 4: HẠN CHÓT ĐƠN</span>
              <Flag size={13} className={ow.current_phase === 'cut_off_passed' ? 'text-red-600' : ''} />
            </div>
            <div className="mt-1 font-bold text-stone-900">Ngừng nhận đơn</div>
            <div className="mt-1 text-[11px] font-semibold text-red-700">
              Trước {shortDate(ow.cut_off_date)}
            </div>
            <div className="mt-1.5 text-[10.5px] leading-tight text-stone-600">
              Đóng cổng nhận đơn sự kiện. Đảm bảo giao hàng kịp ngày {shortDate(ow.peak_date)}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
