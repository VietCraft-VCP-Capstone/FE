import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Flame,
  Gift,
  GraduationCap,
  Heart,
  Info,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Tag,
  Trees,
  Truck,
  X,
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
  rawCampaign?: SeasonalCampaign;
}

interface TimelineMilestone {
  label: string;
  date: string;
}

interface OccasionDetails {
  title: string;
  badge: string;
  categoryFocus: string[];
  keywords: string[];
  milestones: TimelineMilestone[];
  cutoffFormula: string;
  leadTimeDays: number | null;
  warning: string | null;
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Chỉ lấy dữ liệu có thật do backend trả về (lịch dịp + mốc tính theo công thức).
 * Không có nội dung tự viết: thiếu dữ liệu thì bỏ trống, không bịa.
 */
export function getOccasionDetails(row: CalendarTimelineRow): OccasionDetails {
  const raw = row.rawCampaign;
  const oc = raw?.occasion_window;
  const lw = raw?.launch_window;

  const candidates: TimelineMilestone[] = [
    { label: 'Bắt đầu chuẩn bị mẫu', date: fmtDate(oc?.rd_start || lw?.start) },
    { label: 'Bắt đầu đăng bán', date: fmtDate(oc?.traction_start || (lw as any)?.traction_start) },
    { label: 'Bắt đầu cao điểm', date: fmtDate(oc?.peak_start || (lw as any)?.peak_start) },
    { label: 'Hạn chốt nhận đơn', date: fmtDate(oc?.cut_off_date || lw?.end) },
    { label: 'Ngày diễn ra dịp', date: fmtDate(oc?.peak_date || lw?.peak_date) },
  ];

  return {
    title: raw?.name || row.name,
    badge: raw?.badge || '',
    categoryFocus: raw?.category_summary
      ? raw.category_summary.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    keywords: raw?.search_keywords || [],
    milestones: candidates.filter(m => m.date),
    cutoffFormula: lw?.basis || '',
    leadTimeDays: oc?.lead_time_days ?? null,
    warning: oc?.timing_warning || null,
  };
}

export function SeasonalMonthMatrix({
  campaigns,
  activeCampId,
  onSelectCampaign,
}: SeasonalMonthMatrixProps) {
  const [viewMode, setViewMode] = useState<'120d' | '12m'>('120d');

  // State cho Form Popup / Modal khi click
  const [activeModalOccasion, setActiveModalOccasion] = useState<CalendarTimelineRow | null>(null);

  // State cho Hover Tooltip Card khi rê chuột
  const [hoveredOccasion, setHoveredOccasion] = useState<CalendarTimelineRow | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalOccasion(null);
        setHoveredOccasion(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        expectedOrders: camp.expected_orders || '',
        confidenceText: (confText === 'Cao' || confText === 'Khá' || confText === 'Sơ bộ') ? confText : 'Khá',
        confidenceDots: confDots,
        nextDeadline,
        stages,
        isDashedCurve: camp.is_dashed_curve ?? (confText === 'Sơ bộ' || stages.endDays > 60),
        rawCampaign: camp,
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

  // Xử lý sự kiện rê chuột vào hàng
  const handleRowMouseEnter = (row: CalendarTimelineRow, e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    const cardWidth = 400;
    const cardHeight = 200;

    // Tính toán tọa độ hiển thị để không tràn màn hình
    let top = rect.bottom + 6;
    if (top + cardHeight > window.innerHeight) {
      top = Math.max(10, rect.top - cardHeight - 6);
    }
    const left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, rect.left + 24));

    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPos({ top, left });
      setHoveredOccasion(row);
    }, 120);
  };

  const handleRowMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredOccasion(null);
    setHoverPos(null);
  };

  const hoveredDetails = hoveredOccasion ? getOccasionDetails(hoveredOccasion) : null;
  const modalDetails = activeModalOccasion ? getOccasionDetails(activeModalOccasion) : null;

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-4 relative">
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
            <div className="w-48 shrink-0 pl-2">Dịp</div>

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
                • Ngày diễn ra dịp theo lịch.<br />
                • Hạn chốt = ngày dịp trừ số ngày sản xuất và giao hàng cấu hình cho từng dịp.<br />
                • Đánh dấu <strong>Gấp</strong> khi còn dưới 14 ngày.
              </div>
            </div>

            <div className="w-24 shrink-0 pl-3 flex items-center gap-1 group/th relative">
              <span>Dự kiến</span>
              <Info size={12} className="text-stone-400 cursor-help" />
              <div className="absolute left-0 top-6 hidden group-hover/th:block z-30 w-60 rounded-lg bg-stone-900 p-2.5 text-[11px] text-white shadow-lg pointer-events-none leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Dự kiến số đơn:</strong>
                • Chưa có mô hình dự báo từ dữ liệu đơn hàng thật nên chưa hiển thị con số.
              </div>
            </div>

            <div className="w-24 shrink-0 pl-3 flex items-center gap-1 group/th relative">
              <span>Tin cậy</span>
              <Info size={12} className="text-stone-400 cursor-help" />
              <div className="absolute right-0 top-6 hidden group-hover/th:block z-30 w-64 rounded-lg bg-stone-900 p-2.5 text-[11px] text-white shadow-lg pointer-events-none leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Cách xếp mức này:</strong>
                • Xếp theo quy tắc khoảng cách ngày tới dịp (dịp xa hơn 60 ngày là Sơ bộ).<br />
                • Chưa đối chiếu với số liệu đơn hàng thực tế.
              </div>
            </div>
          </div>

          {/* Danh sách các dịp trong khung lịch */}
          <div className="relative divide-y divide-stone-100/90 pt-1">
            {/* Vạch đỏ HÔM NAY chạy xuyên suốt qua tất cả các dòng */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-20 border-l-2 border-rose-500"
              style={{
                left: `calc(192px + 2px)`,
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
                  onClick={() => {
                    onSelectCampaign(row.id);
                    setActiveModalOccasion(row);
                  }}
                  onMouseEnter={e => handleRowMouseEnter(row, e)}
                  onMouseLeave={handleRowMouseLeave}
                  className={`group relative flex items-center py-4 px-2 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/50 ring-1 ring-emerald-300/80 shadow-2xs'
                      : 'hover:bg-stone-50/80'
                  }`}
                >
                  {/* Cột 1: Tên Dịp & Thứ/Ngày */}
                  <div className="w-48 shrink-0 pr-3">
                    <div className="text-sm font-bold text-stone-900 group-hover:text-[#007700] transition-colors flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-stone-100 group-hover:bg-emerald-100/70 transition-colors">
                        {getCampaignLucideIcon(row.id)}
                      </span>
                      <span>{row.name}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 flex items-center justify-between">
                      <span>{row.weekdayText}</span>
                      <span className="text-[10px] font-bold text-[#007700] opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem chi tiết →
                      </span>
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
                      title="Hạn chốt nhận đơn"
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
                    {row.expectedOrders ? (
                      <>
                        <div className="font-bold text-xs text-stone-900">{row.expectedOrders}</div>
                        <div className="text-[11px] text-stone-400">đơn</div>
                      </>
                    ) : (
                      <div className="text-[11px] text-stone-400">Chưa có dữ liệu</div>
                    )}
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

        <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
          <span>💡 Rê chuột hoặc ấn vào hàng bất kỳ để xem form mô tả chi tiết nội dung dịp</span>
        </span>
      </div>

      {/* 4. HOVER PREVIEW CARD: chỉ hiển thị dữ liệu có thật */}
      {hoveredOccasion && hoverPos && !activeModalOccasion && hoveredDetails && (
        <div
          style={{
            position: 'fixed',
            top: hoverPos.top,
            left: hoverPos.left,
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 60,
          }}
          className="pointer-events-none rounded-xl border border-stone-200/95 bg-white p-4 shadow-xl text-stone-800"
        >
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007700]">
              {getCampaignLucideIcon(hoveredOccasion.id)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-900 m-0">{hoveredDetails.title}</h4>
                {hoveredDetails.badge && (
                  <span className="rounded bg-emerald-100/80 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                    {hoveredDetails.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-stone-500 font-medium">{hoveredOccasion.weekdayText}</span>
            </div>
          </div>

          <div className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700">{hoveredOccasion.nextDeadline.title}</span>
              <span className="text-stone-500">còn {hoveredOccasion.nextDeadline.daysLeft} ngày</span>
            </div>

            {hoveredDetails.categoryFocus.length > 0 && (
              <div className="rounded-lg bg-stone-50/90 p-2 border border-stone-100">
                <span className="block text-[11px] font-bold text-stone-700 mb-1">Nhóm hàng gợi ý của dịp:</span>
                <div className="flex flex-wrap gap-1">
                  {hoveredDetails.categoryFocus.slice(0, 4).map((p, idx) => (
                    <span key={idx} className="rounded bg-white px-1.5 py-0.5 text-[10.5px] border border-stone-200/80 text-stone-700">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-stone-100 text-[11px] text-emerald-700 font-semibold">
              Bấm chuột để xem mô tả chi tiết các mốc thời gian
            </div>
          </div>
        </div>
      )}

      {/* 5. FORM CHI TIẾT khi bấm vào dịp: chỉ dữ liệu có nguồn */}
      {activeModalOccasion && modalDetails && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60"
          onClick={() => setActiveModalOccasion(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/80">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-emerald-100 text-[#007700]">
                  {getCampaignLucideIcon(activeModalOccasion.id)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="m-0 text-base sm:text-lg font-bold text-stone-900">{modalDetails.title}</h3>
                    {modalDetails.badge && (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                        {modalDetails.badge}
                      </span>
                    )}
                  </div>
                  <p className="m-0 text-xs text-stone-500 mt-0.5">{activeModalOccasion.weekdayText}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalOccasion(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                aria-label="Đóng form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-stone-700">
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-amber-800 shrink-0" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wide text-amber-800">Mốc tiếp theo</div>
                    <div className="text-sm font-bold text-stone-900 mt-0.5">{activeModalOccasion.nextDeadline.title}</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-200 text-amber-900">
                  Còn {activeModalOccasion.nextDeadline.daysLeft} ngày
                </span>
              </div>

              {modalDetails.warning && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-200/70 text-xs text-rose-900">
                  <Truck size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalDetails.warning}</span>
                </div>
              )}

              {modalDetails.milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 m-0">Các mốc thời gian</h4>
                  <ul className="m-0 p-0 list-none divide-y divide-stone-100 rounded-xl border border-stone-200/80">
                    {modalDetails.milestones.map((m, i) => (
                      <li key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="text-stone-700">{m.label}</span>
                        <strong className="text-stone-900">{m.date}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="m-0 text-[11px] text-stone-500 leading-relaxed">
                    {modalDetails.cutoffFormula && <>Cách tính hạn chốt: {modalDetails.cutoffFormula}. </>}
                    {modalDetails.leadTimeDays !== null && (
                      <>
                        Số ngày sản xuất và giao hàng ({modalDetails.leadTimeDays} ngày) là tham số cấu hình cho từng dịp,
                        chưa được đo từ dữ liệu đơn hàng của shop.
                      </>
                    )}
                  </p>
                </div>
              )}

              {modalDetails.categoryFocus.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 m-0">
                    <PackageCheck size={14} className="text-[#007700]" />
                    Nhóm hàng gợi ý của dịp
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {modalDetails.categoryFocus.map((p, idx) => (
                      <span key={idx} className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-800 border border-stone-200/70">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="m-0 text-[11px] text-stone-500">Danh sách do hệ thống cấu hình sẵn cho dịp này, chưa phải số liệu bán chạy đo được.</p>
                </div>
              )}

              {modalDetails.keywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5 m-0">
                    <Tag size={14} className="text-amber-600" />
                    Từ khóa theo dịp
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {modalDetails.keywords.map((kw, idx) => (
                      <span key={idx} className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 border border-amber-200/70">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-100 bg-stone-50">
              <button
                type="button"
                onClick={() => setActiveModalOccasion(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
