import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BookOpen,
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
export interface PrepWarning {
  level: 'missed' | 'late' | 'warn';
  short: string;
  text: string;
}

function toDay(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function shortDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Cảnh báo trễ chuẩn bị: so sánh hôm nay với các mốc thật do backend trả về.
 * Không có mốc thì không cảnh báo.
 */
export function getPrepWarning(row: CalendarTimelineRow): PrepWarning | null {
  const raw = row.rawCampaign;
  const oc = raw?.occasion_window;
  const lw = raw?.launch_window;
  const tractionStart = toDay(oc?.traction_start || (lw as any)?.traction_start);
  const peakStart = toDay(oc?.peak_start || (lw as any)?.peak_start);
  const cutoff = toDay(oc?.cut_off_date || lw?.end);
  if (!cutoff) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const daysToCutoff = Math.round((cutoff.getTime() - today.getTime()) / dayMs);

  if (daysToCutoff < 0) {
    return {
      level: 'missed',
      short: 'Không kịp chuẩn bị',
      text: `Đã quá hạn chốt đơn (${shortDate(cutoff)}). Đơn đặt mới có nguy cơ không giao kịp trước dịp này.`,
    };
  }
  if (peakStart && today.getTime() >= peakStart.getTime()) {
    return {
      level: 'late',
      short: 'Trễ chuẩn bị',
      text: `Đã qua giai đoạn chuẩn bị mẫu và đăng bán (cao điểm bắt đầu từ ${shortDate(peakStart)}). Chỉ còn ${daysToCutoff} ngày đến hạn chốt đơn (${shortDate(cutoff)}). Nếu chưa có mẫu và hàng sẵn sàng thì rất khó kịp.`,
    };
  }
  if (tractionStart && today.getTime() >= tractionStart.getTime()) {
    return {
      level: 'warn',
      short: 'Cần đăng bán ngay',
      text: `Đã qua mốc bắt đầu đăng bán (${shortDate(tractionStart)}). Cần đăng bán sớm, còn ${daysToCutoff} ngày đến hạn chốt đơn (${shortDate(cutoff)}).`,
    };
  }
  return null;
}

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
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalId(null);
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

  const parseExpectedOrders = (raw: string): { value: number; hasData: boolean } => {
    if (!raw || raw.toLowerCase().includes('chưa')) return { value: 0, hasData: false };
    const nums = raw.match(/\d+/g)?.map(Number).filter(n => !Number.isNaN(n)) || [];
    if (nums.length === 0) return { value: 0, hasData: false };
    const avg = nums.length >= 2 ? (nums[0] + nums[nums.length - 1]) / 2 : nums[0];
    return { value: Math.round(avg), hasData: avg > 0 };
  };

  const getShortOccasionLabel = (row: CalendarTimelineRow): string => {
    const dateMatch = row.weekdayText.match(/(\d{1,2}\/\d{1,2})/);
    const datePart = dateMatch ? dateMatch[1] : '';
    const lower = row.name.toLowerCase();
    if (lower.includes('tết nguyên đán')) return datePart ? `Tết ${datePart}` : 'Tết';
    if (lower.includes('giáng sinh')) return datePart ? `Noel ${datePart}` : 'Noel';
    if (lower.includes('valentine')) return datePart ? `Val ${datePart}` : 'Valentine';
    if (lower.includes('quốc tế phụ nữ') || lower.includes('8/3')) return datePart ? `8/3` : '8/3';
    if (lower.includes('siêu sale')) return datePart || row.name.replace(/Siêu sale\s*/i, '');
    if (datePart && !row.name.includes(datePart)) {
      const words = row.name.split(' ').slice(0, 2).join(' ');
      return `${words} ${datePart}`;
    }
    return row.name.length > 14 ? `${row.name.slice(0, 13)}…` : row.name;
  };

  const chartMeta = useMemo(() => {
    const hasAnyForecast = displayRows.some(r => parseExpectedOrders(r.expectedOrders).hasData);
    const items = displayRows.map(row => {
      const parsed = parseExpectedOrders(row.expectedOrders);
      const metricValue = hasAnyForecast
        ? parsed.value
        : Math.max(1, row.nextDeadline.daysLeft);
      return {
        row,
        metricValue,
        hasForecastData: parsed.hasData,
        shortLabel: getShortOccasionLabel(row),
        warning: getPrepWarning(row),
      };
    });

    const rawMax = Math.max(1, ...items.map(i => i.metricValue));
    const step = rawMax <= 12 ? 3 : rawMax <= 40 ? 10 : rawMax <= 120 ? 30 : Math.ceil(rawMax / 4 / 10) * 10;
    const axisMax = step * 4;
    const ticks = [axisMax, step * 3, step * 2, step, 0];

    const nearest = [...displayRows].sort((a, b) => a.nextDeadline.daysLeft - b.nextDeadline.daysLeft)[0] || null;
    const peak = items
      .filter(i => i.hasForecastData)
      .sort((a, b) => b.metricValue - a.metricValue)[0]?.row || null;
    const upcomingFocus = items
      .filter(
        i =>
          i.row.id !== nearest?.id &&
          i.row.id !== peak?.id &&
          (i.row.nextDeadline.isUrgent || i.warning !== null || i.row.nextDeadline.daysLeft <= 30)
      )
      .sort((a, b) => b.metricValue - a.metricValue || a.row.nextDeadline.daysLeft - b.row.nextDeadline.daysLeft)[0]?.row || null;

    return {
      hasAnyForecast,
      items,
      axisMax,
      ticks,
      nearest,
      upcomingFocus,
      peak,
    };
  }, [displayRows]);

  const selectedRow = useMemo(() => {
    return displayRows.find(r => r.id === activeCampId) || displayRows[0] || null;
  }, [displayRows, activeCampId]);

  const rechartsData = useMemo(() => {
    return chartMeta.items.map(({ row, shortLabel, warning }) => {
      const parsed = parseExpectedOrders(row.expectedOrders);
      return {
        id: row.id,
        shortLabel,
        name: row.name,
        weekdayText: row.weekdayText,
        expectedOrdersAvg: parsed.value,
        expectedOrdersDisplay: row.expectedOrders || 'Chưa có dữ liệu',
        hasForecastData: parsed.hasData,
        daysLeft: Math.max(0, row.nextDeadline.daysLeft),
        deadlineTitle: row.nextDeadline.title,
        confidenceText: row.confidenceText,
        warningShort: warning?.short || null,
        warningLevel: warning?.level || null,
      };
    });
  }, [chartMeta.items]);

  const activeModalOccasion = useMemo(() => {
    if (!activeModalId) return null;
    return mappedCampaignRows.find(r => r.id === activeModalId) || null;
  }, [mappedCampaignRows, activeModalId]);

  const modalDetails = activeModalOccasion ? getOccasionDetails(activeModalOccasion) : null;

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-4 relative">
      {/* 1. Header tối giản phong cách Hình 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 relative group/info">
          <h3 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-stone-950">
            Lộ trình theo dịp mua sắm
          </h3>
          <Info size={14} className="text-stone-400 cursor-help" />
          <div className="absolute left-0 top-6 hidden group-hover/info:block z-30 w-72 rounded-xl bg-stone-900 p-3 text-[11px] text-white shadow-xl pointer-events-none leading-relaxed">
            <strong className="text-emerald-400 block mb-1">Cách đọc biểu đồ cột kết hợp đường:</strong>
            • <strong>Cột xanh</strong> (trục trái): số đơn dự kiến của từng dịp.<br />
            • <strong>Đường hổ phách</strong> (trục phải): số ngày còn lại đến hạn chuẩn bị tiếp theo.<br />
            • Bấm vào bất kỳ cột nào để chọn dịp và mở chi tiết các mốc thời gian.
          </div>
        </div>

        {/* Segmented pill toggle */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('120d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === '120d'
                ? 'bg-emerald-50 text-[#007700] shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            4 tháng tới
          </button>
          <button
            type="button"
            onClick={() => setViewMode('12m')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === '12m'
                ? 'bg-emerald-50 text-[#007700] shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Cả năm (12 dịp)
          </button>
        </div>
      </div>

      {/* 2. Một câu tóm tắt nổi bật theo phong cách Hình 1 */}
      {chartMeta.nearest && (
        <p className="m-0 text-xs sm:text-[13px] font-normal text-stone-600 leading-relaxed">
          Trong {viewMode === '120d' ? '4 tháng tới' : 'cả năm'} có{' '}
          <strong className="font-semibold text-stone-900">{displayRows.length} dịp</strong>:{' '}
          gần nhất là{' '}
          <strong className="font-semibold text-stone-900">{chartMeta.nearest.name}</strong>{' '}
          (còn {chartMeta.nearest.nextDeadline.daysLeft} ngày
          {chartMeta.nearest.expectedOrders ? `, ${chartMeta.nearest.expectedOrders} đơn` : ''})
          {chartMeta.upcomingFocus && (
            <>
              , tiếp theo là{' '}
              <strong className="font-semibold text-stone-900">{chartMeta.upcomingFocus.name}</strong>{' '}
              (còn {chartMeta.upcomingFocus.nextDeadline.daysLeft} ngày
              {chartMeta.upcomingFocus.expectedOrders ? `, ${chartMeta.upcomingFocus.expectedOrders} đơn` : ''})
            </>
          )}
          {chartMeta.peak && chartMeta.peak.id !== chartMeta.nearest.id && chartMeta.peak.id !== chartMeta.upcomingFocus?.id && (
            <>
              {' '}và nhiều đơn nhất là{' '}
              <strong className="font-semibold text-[#007700]">
                {chartMeta.peak.name} ({chartMeta.peak.expectedOrders} đơn)
              </strong>
            </>
          )}
          .
        </p>
      )}

      {/* 3. Biểu đồ cột kết hợp đường */}
      <div className="space-y-2 pt-1">
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rechartsData}
              margin={{ top: 10, right: 8, left: -12, bottom: 4 }}
              onClick={state => {
                const clickedId = state?.activePayload?.[0]?.payload?.id as string | undefined;
                if (clickedId) {
                  onSelectCampaign(clickedId);
                  setActiveModalId(clickedId);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11, fill: '#57534e' }}
                axisLine={{ stroke: '#e7e5e4' }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                yAxisId="orders"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <YAxis
                yAxisId="days"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#d97706' }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0, 119, 0, 0.05)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const item = payload[0]?.payload as (typeof rechartsData)[number] | undefined;
                  if (!item) return null;
                  return (
                    <div className="w-64 rounded-xl border border-stone-200/95 bg-white p-3.5 shadow-xl text-stone-800">
                      <div className="text-xs font-bold text-stone-900">{item.name}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">{item.weekdayText}</div>
                      <div className="mt-2 pt-2 border-t border-stone-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Đơn dự kiến</span>
                          <span className={`font-bold ${item.hasForecastData ? 'text-[#007700]' : 'text-stone-500'}`}>
                            {item.expectedOrdersDisplay}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-stone-500 truncate">{item.deadlineTitle}</span>
                          <span className="font-bold text-amber-600 shrink-0">còn {item.daysLeft} ngày</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Tin cậy</span>
                          <span className="font-semibold text-stone-700">{item.confidenceText}</span>
                        </div>
                      </div>
                      {item.warningShort && (
                        <div
                          className={`mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold ${
                            item.warningLevel === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>{item.warningShort}</span>
                        </div>
                      )}
                      <div className="mt-2 pt-1.5 border-t border-stone-100 text-[11px] font-semibold text-[#007700]">
                        Bấm để chọn &amp; xem chi tiết mốc
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                yAxisId="orders"
                dataKey="expectedOrdersAvg"
                barSize={viewMode === '120d' ? 32 : 18}
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={barData => {
                  const id = barData?.id as string | undefined;
                  if (id) {
                    onSelectCampaign(id);
                    setActiveModalId(id);
                  }
                }}
              >
                {rechartsData.map(entry => {
                  const isSelected = activeCampId === entry.id || (!activeCampId && selectedRow?.id === entry.id);
                  const fill = !entry.hasForecastData
                    ? isSelected ? '#78716c' : '#e7e5e4'
                    : isSelected ? '#007700' : '#bbf7d0';
                  return <Cell key={entry.id} fill={fill} />;
                })}
              </Bar>
              <Line
                yAxisId="days"
                type="monotone"
                dataKey="daysLeft"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chú thích ngắn gọn đặt ngay dưới 2 trục dọc tương ứng */}
        <div className="flex items-center justify-between gap-4 pt-1 text-[11px] font-medium text-stone-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#007700]" />
            <span>Đơn dự kiến</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <span className="inline-flex items-center">
              <span className="h-0.5 w-3 bg-amber-500" />
              <span className="h-2 w-2 -ml-1.5 rounded-full border-2 border-amber-500 bg-white" />
            </span>
            <span>Ngày còn lại</span>
          </span>
        </div>
      </div>

      {/* 5. FORM CHI TIẾT khi bấm vào dịp: chỉ dữ liệu có nguồn */}
      {activeModalOccasion && modalDetails && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60"
          onClick={() => setActiveModalId(null)}
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
                onClick={() => setActiveModalId(null)}
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

              {(() => {
                const pw = getPrepWarning(activeModalOccasion);
                if (!pw) return null;
                return (
                  <div
                    className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
                      pw.level === 'warn'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="block mb-0.5">{pw.short}</strong>
                      {pw.text}
                    </div>
                  </div>
                );
              })()}

              {modalDetails.warning && !getPrepWarning(activeModalOccasion) && (
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
                onClick={() => setActiveModalId(null)}
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
