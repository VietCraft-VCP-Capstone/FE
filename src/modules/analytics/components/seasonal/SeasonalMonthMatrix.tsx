import { useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Calendar,
  Flame,
  Gift,
  GraduationCap,
  Heart,
  Info,
  ShoppingBag,
  Sparkles,
  Sun,
  Trees,
  Zap,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';

interface SeasonalMonthMatrixProps {
  campaigns: SeasonalCampaign[];
  activeCampId?: string;
  onSelectCampaign: (id: string) => void;
}

export function getCampaignLucideIcon(campId: string): ReactNode {
  switch (campId) {
    case 'halloween':
      return <Flame className="h-4 w-4 text-orange-600" />;
    case 'noel':
      return <Trees className="h-4 w-4 text-emerald-700" />;
    case 'tet':
      return <Sparkles className="h-4 w-4 text-rose-600" />;
    case 'valentine_8_3':
    case 'valentine':
    case '8/3':
      return <Heart className="h-4 w-4 text-pink-600" />;
    case 'he_dulich':
    case '30/4':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'tuutuong_trungthu':
    case 'khai_giang':
    case 'trung_thu':
      return <GraduationCap className="h-4 w-4 text-teal-700" />;
    case '11/11':
      return <Zap className="h-4 w-4 text-amber-500" />;
    case '12/12':
      return <ShoppingBag className="h-4 w-4 text-indigo-600" />;
    case '20/11':
      return <BookOpen className="h-4 w-4 text-blue-600" />;
    default:
      return <Gift className="h-4 w-4 text-[#007700]" />;
  }
}

interface CalendarTimelineRow {
  id: string;
  name: string;
  weekdayText: string;
  expectedOrders: string;
  confidenceText: 'Cao' | 'Khá' | 'Sơ bộ';
  confidenceDots: number; // 1 to 4
  nextDeadline: {
    title: string;
    dateText: string;
    daysLeft: number;
    isUrgent: boolean;
  };
  stages: {
    prepStartDays: number;
    tractionStartDays: number;
    peakDays: number;
    cutoffDays: number;
    endDays: number;
  };
  isDashedCurve?: boolean;
}

export function SeasonalMonthMatrix({
  campaigns,
  activeCampId,
  onSelectCampaign,
}: SeasonalMonthMatrixProps) {
  const [viewMode, setViewMode] = useState<'120d' | '12m'>('120d');

  // Chuyển đổi toàn bộ campaigns thực tế từ Backend/AI sang định dạng hàng CalendarTimelineRow
  const mappedCampaignRows: CalendarTimelineRow[] = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    return campaigns.map(camp => {
      const ocWin = camp.occasion_window;
      const lw = camp.launch_window;
      const evDateStr = ocWin?.peak_date || lw?.peak_date;

      // 1. Tên thứ và ngày
      let weekdayText = camp.weekday_text;
      if (!weekdayText && evDateStr) {
        try {
          const d = new Date(evDateStr);
          const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
          const dayName = days[d.getDay()];
          const datePart = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
          weekdayText = `${dayName}, ${datePart}`;
        } catch {
          weekdayText = camp.name;
        }
      }

      // 2. Tọa độ các mốc thời gian 4 pha
      const stages = camp.stages
        ? {
            prepStartDays: camp.stages.prep_start_days,
            tractionStartDays: camp.stages.traction_start_days,
            peakDays: camp.stages.peak_days,
            cutoffDays: camp.stages.cutoff_days,
            endDays: camp.stages.end_days,
          }
        : {
            prepStartDays: 0,
            tractionStartDays: Math.max(0, (ocWin?.days_to_peak || 30) - 20),
            peakDays: Math.max(0, ocWin?.days_to_peak || 30),
            cutoffDays: Math.max(0, ocWin?.days_to_cutoff || 14),
            endDays: Math.max(0, (ocWin?.days_to_peak || 30) + 4),
          };

      // 3. Mốc hạn tiếp theo
      const nextDeadline = camp.next_deadline
        ? {
            title: camp.next_deadline.title,
            dateText: camp.next_deadline.date_text,
            daysLeft: camp.next_deadline.days_left,
            isUrgent: camp.next_deadline.is_urgent,
          }
        : {
            title: camp.timing?.label || `Hạn chốt đơn còn ${camp.timing?.days_diff || 0} ngày`,
            dateText: ocWin?.cut_off_date || '',
            daysLeft: camp.timing?.days_diff || 0,
            isUrgent: (camp.timing?.days_diff || 0) <= 14,
          };

      // 4. Mức độ tin cậy được tính từ BE/AI
      const confText = camp.confidence?.text || camp.confidence_text || (stages.endDays > 60 ? 'Sơ bộ' : 'Khá');
      const confDots =
        camp.confidence?.dots ||
        camp.confidence_dots ||
        (confText === 'Cao' ? 4 : confText === 'Khá' ? 3 : 1);

      return {
        id: camp.id,
        name: camp.name,
        weekdayText: weekdayText || camp.name,
        expectedOrders: camp.expected_orders || '80–150',
        confidenceText: (confText === 'Cao' || confText === 'Khá' || confText === 'Sơ bộ') ? confText : 'Khá',
        confidenceDots: confDots,
        nextDeadline,
        stages,
        isDashedCurve: camp.is_dashed_curve ?? (confText === 'Sơ bộ' || stages.endDays > 60),
      };
    });
  }, [campaigns]);

  // Luôn dùng dữ liệu thực tế từ API backend
  const activeRows = mappedCampaignRows;

  // Lọc hiển thị:
  // - 120d (cửa sổ trượt 4 tháng): Lọc các dịp bắt đầu chuẩn bị trong vòng 120 ngày tới
  // - 12m (toàn bộ 12 tháng): Hiển thị tất cả các dịp trong chu kỳ năm
  const displayRows = useMemo(() => {
    if (viewMode === '120d') {
      const filtered = activeRows.filter(r => r.stages.prepStartDays <= 120 && r.stages.endDays >= 0);
      return filtered.length > 0 ? filtered : activeRows.slice(0, 5);
    }
    return activeRows;
  }, [activeRows, viewMode]);

  // Tính ngày hiện tại và mảng header 4 tháng động tính từ tháng này
  const now = useMemo(() => new Date(), []);
  const todayLabel = useMemo(() => {
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  }, [now]);

  const monthHeaders = useMemo(() => {
    return [0, 1, 2, 3].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const showYear = offset === 0 || m === 1;
      return {
        label: showYear ? `T${m}/${y}` : `T${m}`,
        isFirst: offset === 0,
      };
    });
  }, [now]);

  // Tổng số ngày trong khung nhìn 120 ngày
  const totalDays = 120;

  // Tính tọa độ phần trăm theo ngày trong khung nhìn 120 ngày
  const getPct = (days: number) => {
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      {/* 1. Header & Điều khiển xem */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007700]">
              <Calendar size={18} />
            </span>
            <h3 className="m-0 text-base font-bold text-stone-900">
              Lộ trình 4 tháng tới &amp; 4 giai đoạn vận hành
            </h3>
          </div>
          <p className="mb-0 mt-1 text-xs text-stone-500">
            Cửa sổ trượt tự động 4 tháng tính từ hôm nay. Khi một dịp qua đi, dịp tiếp theo trong năm sẽ tự động nối tiếp vào lịch.
          </p>
        </div>

        {/* Nút lọc chế độ xem */}
        <div className="flex items-center gap-1.5 bg-stone-100/90 p-1 rounded-xl text-xs shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('120d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === '120d'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            4 tháng tới (Cửa sổ trượt)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('12m')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === '12m'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Tất cả 12 dịp trong năm
          </button>
        </div>
      </div>

      {/* 2. Bảng biểu đồ tiến độ dạng lịch chi tiết theo đúng thiết kế */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[940px] select-none text-stone-800">
          {/* Header Bảng */}
          <div className="flex items-center border-b border-stone-200 pb-2 text-xs font-semibold text-stone-500">
            <div className="w-44 shrink-0 pl-2">Dịp</div>
            
            {/* Header Timeline 4 tháng */}
            <div className="relative flex-1 grid grid-cols-4 text-xs font-medium">
              {monthHeaders.map((mH, idx) => (
                <div key={idx} className={`text-left ${idx === 0 ? 'pl-1' : 'pl-2'}`}>
                  <span className={idx === 0 ? 'text-stone-700 font-bold' : 'text-stone-600'}>
                    {mH.label}
                  </span>
                  {mH.isFirst && (
                    <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1 leading-none mt-0.5">
                      <span className="text-[9px]">▼</span> Hôm nay {todayLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="w-52 shrink-0 pl-4 flex items-center gap-1 group/th relative">
              <span>Hạn tiếp theo</span>
              <Info size={12} className="text-stone-400 cursor-help" />
              <div className="absolute left-4 top-6 hidden group-hover/th:block z-30 w-60 rounded-lg bg-stone-900 p-2.5 text-[11px] text-white shadow-lg pointer-events-none leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Căn cứ tính mốc hạn:</strong>
                • Ngày lễ chính thức theo lịch quốc gia.<br />
                • Trừ thời gian ship p90 (2–4 ngày) + xưởng in p90 (2–3 ngày) + 1 ngày đệm an toàn.<br />
                • Đánh dấu <strong>Gấp</strong> khi còn dưới 14 ngày.
              </div>
            </div>

            <div className="w-24 shrink-0 pl-3 flex items-center gap-1 group/th relative">
              <span>Dự kiến</span>
              <Info size={12} className="text-stone-400 cursor-help" />
              <div className="absolute left-0 top-6 hidden group-hover/th:block z-30 w-60 rounded-lg bg-stone-900 p-2.5 text-[11px] text-white shadow-lg pointer-events-none leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Căn cứ dự kiến số đơn:</strong>
                • Số đơn ngày thường của shop trong 8 tuần qua.<br />
                • Nhân hệ số tăng trưởng đơn lịch sử ngành trên sàn (tăng 2.5x – 6x tùy dịp).<br />
                • Thể hiện dưới dạng khoảng dao động an toàn.
              </div>
            </div>

            <div className="w-24 shrink-0 pl-3 flex items-center gap-1 group/th relative">
              <span>Tin cậy</span>
              <Info size={12} className="text-stone-400 cursor-help" />
              <div className="absolute right-0 top-6 hidden group-hover/th:block z-30 w-64 rounded-lg bg-stone-900 p-2.5 text-[11px] text-white shadow-lg pointer-events-none leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Tiêu chí xếp hạng độ tin cậy:</strong>
                • <strong>Cao (●●●●)</strong>: Có từ 2 kỳ lịch sử sàn, n ≥ 1.000 đơn.<br />
                • <strong>Khá (●●●○)</strong>: Có 1 kỳ lịch sử hoặc trend Google rõ nét.<br />
                • <strong>Sơ bộ (●○○○)</strong>: Dịp còn xa (&gt; 60 ngày), ước tính sơ bộ theo ngành.
              </div>
            </div>
          </div>

          {/* Danh sách các dịp trong khung lịch */}
          <div className="relative divide-y divide-stone-100/90 pt-1">
            {/* Vạch đỏ HÔM NAY chạy xuyên suốt qua tất cả các dòng */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-20 border-l-2 border-rose-500"
              style={{
                left: `calc(176px + 2px)`,
              }}
            />

            {displayRows.map(row => {
              const isSelected = activeCampId === row.id;

              // Tọa độ các mốc thời gian của dải 4 pha (%)
              const p1Start = getPct(row.stages.prepStartDays);
              const p2Start = getPct(row.stages.tractionStartDays);
              const p3Peak = getPct(row.stages.peakDays);
              const p4Cutoff = getPct(row.stages.cutoffDays);
              const pEnd = getPct(row.stages.endDays);

              const p1Width = Math.max(2, p2Start - p1Start);
              const p2Width = Math.max(3, p4Cutoff - p2Start);
              const p3Width = Math.max(3, pEnd - p4Cutoff);
              const p4Width = Math.max(2, 4);

              // Tọa độ đường cong ngọn đồi sức mua (Bell Curve Hill)
              const hillStart = Math.max(0, p1Start);
              const hillPeak = p3Peak;
              const hillEnd = Math.min(100, pEnd + 2);

              return (
                <div
                  key={row.id}
                  onClick={() => onSelectCampaign(row.id)}
                  className={`group relative flex items-center py-4 px-2 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/50 ring-1 ring-emerald-300/80 shadow-2xs'
                      : 'hover:bg-stone-50/70'
                  }`}
                >
                  {/* Cột 1: Tên Dịp & Thứ/Ngày */}
                  <div className="w-44 shrink-0 pr-3">
                    <div className="text-sm font-bold text-stone-900 group-hover:text-[#007700] transition-colors">
                      {row.name}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {row.weekdayText}
                    </div>
                  </div>

                  {/* Cột 2: Trục Timeline (Thanh 4 pha + Đường cong sức mua + Vạch hạn chốt) */}
                  <div className="relative flex-1 h-14 flex items-center">
                    {/* Các vạch ngăn tháng mờ */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                      {[0, 1, 2, 3].map(col => (
                        <div key={col} className="h-full border-r border-dashed border-stone-200/50" />
                      ))}
                    </div>

                    {/* Đường cong ngọn đồi sức mua (Demand Hill Area) */}
                    <svg
                      viewBox="0 0 100 40"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                    >
                      <defs>
                        <linearGradient id={`hillGrad-${row.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#d6d3d1" stopOpacity="0.30" />
                          <stop offset="100%" stopColor="#e7e5e4" stopOpacity="0.08" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M ${hillStart} 36 C ${(hillStart + hillPeak) / 2} 32, ${hillPeak - 5} 12, ${hillPeak} 8 C ${hillPeak + 5} 12, ${(hillPeak + hillEnd) / 2} 32, ${hillEnd} 36 Z`}
                        fill={`url(#hillGrad-${row.id})`}
                        stroke="#a8a29e"
                        strokeWidth="0.8"
                        strokeDasharray={row.isDashedCurve ? '2 2' : undefined}
                      />
                    </svg>

                    {/* Thanh 4 pha tiến độ liên tục (4-Phase Segmented Bar) */}
                    <div
                      style={{
                        left: `${p1Start}%`,
                        width: `${Math.min(100 - p1Start, pEnd - p1Start + 4)}%`,
                      }}
                      className="relative z-10 h-4 rounded-sm flex items-center overflow-hidden shadow-2xs"
                    >
                      {/* Pha 1: Chuẩn bị mẫu (Xanh rất nhạt) */}
                      <div
                        style={{ width: `${(p1Width / (pEnd - p1Start + 4)) * 100}%` }}
                        className="h-full bg-[#dbeafe] border-r border-white/60"
                        title="Pha 1: Chuẩn bị mẫu"
                      />
                      {/* Pha 2: Đăng bán & gom tương tác (Xanh dương vừa) */}
                      <div
                        style={{ width: `${(p2Width / (pEnd - p1Start + 4)) * 100}%` }}
                        className="h-full bg-[#7dd3fc] border-r border-white/60"
                        title="Pha 2: Đăng bán & gom tương tác"
                      />
                      {/* Pha 3: Tuần cao điểm (Xanh dương đậm) */}
                      <div
                        style={{ width: `${(p3Width / (pEnd - p1Start + 4)) * 100}%` }}
                        className="h-full bg-[#0284c7] border-r border-white/60"
                        title="Pha 3: Cao điểm bán hàng"
                      />
                      {/* Pha 4: Hạn chốt nhận đơn & giao hàng (Cam hổ phách) */}
                      <div
                        style={{ width: `${(p4Width / (pEnd - p1Start + 4)) * 100}%` }}
                        className="h-full bg-[#ea580c]"
                        title="Pha 4: Hạn chốt nhận đơn"
                      />
                    </div>

                    {/* Vạch đứng màu đen đánh dấu Hạn chốt nhận đơn (Cut-off line) */}
                    <div
                      style={{ left: `${pEnd + 4}%` }}
                      className="absolute top-2 bottom-2 w-[2.5px] bg-stone-900 z-20 pointer-events-none rounded-xs"
                      title="Hạn chót nhận đơn"
                    />
                  </div>

                  {/* Cột 3: Hạn tiếp theo */}
                  <div className="w-52 shrink-0 pl-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-stone-900">
                        {row.nextDeadline.title}
                      </span>
                      {row.nextDeadline.isUrgent && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                          Gấp
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">
                      còn {row.nextDeadline.daysLeft} ngày
                    </div>
                  </div>

                  {/* Cột 4: Dự kiến */}
                  <div className="w-24 shrink-0 pl-3">
                    <div className="font-bold text-xs text-stone-900">
                      {row.expectedOrders}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      đơn
                    </div>
                  </div>

                  {/* Cột 5: Tin cậy (với các chấm tròn) */}
                  <div className="w-24 shrink-0 pl-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-stone-800">
                        {row.confidenceText}
                      </span>
                      <div className="flex items-center gap-0.5 text-stone-800">
                        {[1, 2, 3, 4].map(dot => (
                          <span
                            key={dot}
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              dot <= row.confidenceDots
                                ? 'bg-stone-900'
                                : 'border border-stone-400 bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Chú thích màu sắc (Legend) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs text-stone-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-xs bg-[#dbeafe]" />
            <span>Chuẩn bị mẫu</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-xs bg-[#7dd3fc]" />
            <span>Đăng bán &amp; gom tương tác</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-xs bg-[#0284c7]" />
            <span>Cao điểm sức mua</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-3 rounded-xs bg-[#ea580c]" />
            <span>Hạn chốt nhận đơn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-[2px] bg-stone-900" />
            <span>Vạch chốt đơn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-[2px] bg-rose-500" />
            <span className="font-semibold text-rose-600">Hôm nay {todayLabel}</span>
          </div>
        </div>

        <span className="text-[11px] text-stone-400">
          Bấm vào hàng bất kỳ để đồng bộ lộ trình chi tiết
        </span>
      </div>
    </div>
  );
}
