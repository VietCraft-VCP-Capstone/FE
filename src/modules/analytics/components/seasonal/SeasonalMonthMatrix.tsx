import { useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Flame,
  Gift,
  GraduationCap,
  Heart,
  ShoppingBag,
  Sparkles,
  Sun,
  Trees,
  Zap,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { fullDate, shortDate } from '../../format';

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

/** Chuyển đổi ngày tháng dạng 'YYYY-MM-DD' sang tọa độ phần trăm 0% - 100% trên trục 12 tháng */
function getTimelinePercent(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length < 3) return 0;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return 0;

  const monthIdx = Math.max(0, Math.min(11, month - 1));
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIdx] || 30;
  const clampedDay = Math.max(1, Math.min(daysInMonth, day));
  const monthStartPct = (monthIdx / 12) * 100;
  const dayFraction = clampedDay / daysInMonth;
  return Math.min(100, Math.max(0, monthStartPct + dayFraction * (100 / 12)));
}

export function SeasonalMonthMatrix({
  campaigns,
  activeCampId,
  onSelectCampaign,
}: SeasonalMonthMatrixProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'active_upcoming'>('all');
  const [hoveredCampId, setHoveredCampId] = useState<string | null>(null);

  // Vị trí ngày hôm nay trên trục 12 tháng (Hôm nay: ngày 01/11/2026)
  const todayPct = useMemo(() => getTimelinePercent('2026-11-01'), []);

  // Lọc danh sách chiến dịch theo bộ lọc
  const filteredCampaigns = useMemo(() => {
    if (filterMode === 'active_upcoming') {
      return campaigns.filter(c => c.timing?.status === 'active' || c.timing?.status === 'upcoming');
    }
    return campaigns;
  }, [campaigns, filterMode]);

  // Chiến dịch đang được chọn để hiển thị thông tin chi tiết
  const activeCamp = useMemo(() => {
    return (
      campaigns.find(c => c.id === (hoveredCampId || activeCampId)) ||
      campaigns.find(c => c.id === activeCampId) ||
      campaigns[0]
    );
  }, [campaigns, hoveredCampId, activeCampId]);

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-5">
      {/* 1. Header & Bộ lọc chế độ xem */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#007700]">
              <Calendar size={18} />
            </span>
            <h3 className="m-0 text-base font-bold text-stone-900">
              Lộ trình các dịp cao điểm trong năm (Lịch Gantt liên tục)
            </h3>
          </div>
          <p className="mb-0 mt-1 text-xs text-stone-500">
            Dải băng thể hiện rõ ngày bắt đầu chuẩn bị mẫu $\rightarrow$ đỉnh sức mua $\rightarrow$ hạn chốt nhận đơn. Vạch đỏ đánh dấu vị trí ngày hôm nay.
          </p>
        </div>

        {/* Nút lọc hiển thị */}
        <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-xl text-xs shrink-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Tất cả 12 dịp
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('active_upcoming')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filterMode === 'active_upcoming'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Đang mở &amp; Sắp tới
          </button>
        </div>
      </div>

      {/* 2. Bảng biểu đồ Gantt tiến độ liên tục */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[820px] select-none">
          {/* Header 12 Tháng & Vạch phân chia */}
          <div className="flex items-center pb-2 border-b border-stone-200">
            <div className="w-52 shrink-0 text-xs font-bold uppercase tracking-wider text-stone-400 pl-2">
              Dịp mua sắm &amp; Mốc ngày
            </div>
            <div className="relative flex-1 grid grid-cols-12 text-center text-xs font-bold text-stone-600">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                const isCurrentMonth = m === 11; // Tháng 11
                return (
                  <div
                    key={m}
                    className={`py-1 rounded-md transition-colors ${
                      isCurrentMonth
                        ? 'bg-rose-50 text-rose-600 font-extrabold ring-1 ring-rose-300/80'
                        : 'text-stone-500'
                    }`}
                  >
                    <span>Tháng {m}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Khung vẽ các dải tiến độ Gantt */}
          <div className="relative pt-3 pb-2 space-y-2.5">
            {/* Lưới nền 12 cột tháng (đường kẻ mờ dọc) */}
            <div className="pointer-events-none absolute top-0 bottom-0 left-52 right-0 grid grid-cols-12">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                <div
                  key={m}
                  className={`h-full border-r border-dashed ${
                    m === 11 ? 'border-rose-200/60 bg-rose-50/20' : 'border-stone-100'
                  }`}
                />
              ))}
            </div>

            {/* Vạch đỏ chỉ vị trí HÔM NAY (chạy dọc từ trên xuống dưới) */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-20 border-l-2 border-rose-500"
              style={{
                left: `calc(208px + (100% - 208px) * ${todayPct / 100})`,
              }}
            >
              <div className="-translate-x-1/2 -translate-y-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs whitespace-nowrap">
                Hôm nay: 01/11
              </div>
            </div>

            {/* Danh sách từng dịp với dải băng liên tục từ ngày bắt đầu đến ngày kết thúc */}
            {filteredCampaigns.map(camp => {
              const isSelected = activeCampId === camp.id;
              const isHovered = hoveredCampId === camp.id;

              // Ngày bắt đầu chuẩn bị mẫu
              const startDate =
                camp.launch_window?.start ||
                camp.occasion_window?.rd_start ||
                `2026-${String(camp.months?.[0] || 1).padStart(2, '0')}-01`;

              // Ngày đỉnh sự kiện
              const peakDate =
                camp.launch_window?.peak_date ||
                camp.occasion_window?.peak_date ||
                camp.launch_window?.end ||
                startDate;

              // Ngày kết thúc / hạn chốt đơn
              const endDate =
                camp.launch_window?.end ||
                camp.occasion_window?.cut_off_date ||
                peakDate;

              const startPct = getTimelinePercent(startDate);
              const peakPct = getTimelinePercent(peakDate);
              const endPct = getTimelinePercent(endDate);

              // Xử lý dải băng kéo dài (nếu dịp bắt đầu từ tháng 10 kết thúc tháng 11)
              let barLeft = startPct;
              let barWidth = Math.max(3.5, endPct - startPct);

              // Trường hợp dịp vắt qua năm (ví dụ Tết chuẩn bị từ tháng 12 đến tháng 2)
              const isCrossYear = endPct < startPct;
              if (isCrossYear) {
                // Hiển thị dải băng từ startPct tới 100%
                barLeft = startPct;
                barWidth = Math.max(5, 100 - startPct + endPct);
              }

              // Vị trí mốc đỉnh điểm trên dải băng (%)
              const peakMarkerOffset = isCrossYear
                ? 60
                : Math.max(10, Math.min(90, ((peakPct - startPct) / Math.max(1, endPct - startPct)) * 100));

              // Trạng thái dịp
              const status = camp.timing?.status || 'upcoming';
              const statusText =
                status === 'active'
                  ? 'Đang mở bán'
                  : status === 'upcoming'
                  ? 'Sắp tới'
                  : 'Đã kết thúc';

              return (
                <div
                  key={camp.id}
                  onMouseEnter={() => setHoveredCampId(camp.id)}
                  onMouseLeave={() => setHoveredCampId(null)}
                  onClick={() => onSelectCampaign(camp.id)}
                  className={`group relative flex items-center rounded-xl p-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 ring-1 ring-emerald-300'
                      : isHovered
                      ? 'bg-stone-50'
                      : 'hover:bg-stone-50/60'
                  }`}
                >
                  {/* Cột Tên dịp bên trái */}
                  <div className="w-52 shrink-0 flex items-center justify-between pr-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 rounded-lg bg-white border border-stone-200/90 shadow-2xs shrink-0">
                        {getCampaignLucideIcon(camp.id)}
                      </span>
                      <div className="min-w-0">
                        <div
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-[#007700]' : 'text-stone-800'
                          }`}
                        >
                          {camp.name}
                        </div>
                        <div className="text-[10.5px] text-stone-500 flex items-center gap-1">
                          <span className="font-semibold text-stone-700">Đỉnh: {shortDate(peakDate)}</span>
                          <span className="text-stone-300">·</span>
                          <span
                            className={`font-semibold ${
                              status === 'active'
                                ? 'text-emerald-700'
                                : status === 'upcoming'
                                ? 'text-amber-700'
                                : 'text-stone-400'
                            }`}
                          >
                            {statusText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột Dải băng Gantt liên tục bên phải */}
                  <div className="relative flex-1 h-9 flex items-center">
                    {/* Dải băng tiến độ từ ngày bắt đầu đến ngày kết thúc */}
                    <div
                      style={{
                        left: `${barLeft}%`,
                        width: `${Math.min(100 - barLeft, barWidth)}%`,
                      }}
                      className={`relative h-7 rounded-lg transition-all duration-200 flex items-center justify-between px-2.5 shadow-xs ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-600 via-[#007700] to-emerald-800 text-white ring-2 ring-emerald-400 ring-offset-1'
                          : status === 'active'
                          ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-[#16a34a] text-white hover:brightness-105'
                          : status === 'upcoming'
                          ? 'bg-gradient-to-r from-amber-200 via-emerald-200 to-emerald-300 text-stone-800 border border-emerald-300/80'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {/* Nhãn ngày bắt đầu */}
                      <span className="text-[10px] font-bold shrink-0 opacity-95">
                        {shortDate(startDate)}
                      </span>

                      {/* Điểm kim cương đánh dấu ngày đỉnh sức mua */}
                      <div
                        style={{ left: `${peakMarkerOffset}%` }}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                        title={`Đỉnh sức mua: ${shortDate(peakDate)}`}
                      >
                        <span className="h-3 w-3 rotate-45 rounded-xs bg-amber-300 border-2 border-stone-900/30 shadow-xs ring-1 ring-white" />
                      </div>

                      {/* Nhãn ngày kết thúc / hạn chốt đơn */}
                      <span className="text-[10px] font-bold shrink-0 opacity-95">
                        {shortDate(endDate)}
                      </span>
                    </div>

                    {/* Nhãn thông tin ngày cụ thể cạnh dải băng khi cần xem nhanh */}
                    {isHovered && (
                      <div
                        style={{
                          left: `calc(${barLeft}% + ${Math.min(100 - barLeft, barWidth)}% + 8px)`,
                        }}
                        className="absolute z-30 hidden sm:flex items-center gap-1.5 rounded-lg bg-stone-900 px-2 py-1 text-[11px] font-medium text-white shadow-md whitespace-nowrap pointer-events-none"
                      >
                        <span>Từ <strong>{shortDate(startDate)}</strong></span>
                        <ChevronRight size={11} className="text-stone-400" />
                        <span>Đỉnh <strong>{shortDate(peakDate)}</strong></span>
                        <ChevronRight size={11} className="text-stone-400" />
                        <span>Chốt <strong>{shortDate(endDate)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Chú thích màu sắc (Legend) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs text-stone-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded bg-gradient-to-r from-emerald-500 to-[#007700]" />
            <span>Thời gian chiến dịch (Từ ngày bắt đầu $\rightarrow$ Hạn chốt đơn)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rotate-45 rounded-xs bg-amber-300 border border-stone-500" />
            <span>Mốc ngày đỉnh sức mua cao nhất</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-rose-500" />
            <span className="font-semibold text-rose-600">Vạch hôm nay (01/11)</span>
          </div>
        </div>
        <span className="text-[11px] text-stone-400">
          Bấm vào hàng bất kỳ để đồng bộ lộ trình chi tiết
        </span>
      </div>

      {/* 4. Khối chi tiết mốc ngày của dịp đang chọn */}
      {activeCamp && (
        <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#007700] text-white">
                {getCampaignLucideIcon(activeCamp.id)}
              </span>
              <div>
                <h4 className="text-xs font-bold text-stone-900 m-0">
                  Lộ trình thời gian chi tiết: {activeCamp.name}
                </h4>
                <p className="text-[11px] text-stone-500 m-0 mt-0.5">
                  {activeCamp.badge || 'Kế hoạch hành động chuẩn bị sản phẩm và đón đỉnh sức mua'}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-[#007700] self-start sm:self-center">
              {activeCamp.timing?.status === 'active'
                ? 'Đang trong thời gian mở bán'
                : activeCamp.timing?.status === 'upcoming'
                ? 'Sắp bước vào chu kỳ'
                : 'Đã hoàn tất chu kỳ'}
            </span>
          </div>

          {/* 4 Mốc ngày thực tế rõ ràng */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-2xs">
              <span className="text-[10.5px] font-semibold text-stone-400 uppercase tracking-wider block">
                1. Bắt đầu chuẩn bị mẫu
              </span>
              <strong className="text-stone-900 text-sm mt-0.5 block">
                {fullDate(activeCamp.launch_window?.start || activeCamp.occasion_window?.rd_start)}
              </strong>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Lấy mẫu thử, chụp ảnh và tạo listing sớm
              </span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-2xs">
              <span className="text-[10.5px] font-semibold text-stone-400 uppercase tracking-wider block">
                2. Hạn chót đăng bán
              </span>
              <strong className="text-amber-800 text-sm mt-0.5 block">
                {fullDate(activeCamp.occasion_window?.traction_start || activeCamp.launch_window?.start)}
              </strong>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Đăng bán xong để kịp tích lũy đánh giá đầu
              </span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-2xs">
              <span className="text-[10.5px] font-semibold text-[#007700] uppercase tracking-wider block">
                3. Đỉnh sức mua cao nhất
              </span>
              <strong className="text-[#007700] text-sm mt-0.5 block">
                {fullDate(activeCamp.launch_window?.peak_date || activeCamp.occasion_window?.peak_date)}
              </strong>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Sức mua tăng vọt, tung combo khuyến mãi
              </span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-emerald-100/80 shadow-2xs">
              <span className="text-[10.5px] font-semibold text-rose-600 uppercase tracking-wider block">
                4. Hạn chốt nhận đơn
              </span>
              <strong className="text-rose-700 text-sm mt-0.5 block">
                {fullDate(activeCamp.launch_window?.end || activeCamp.occasion_window?.cut_off_date)}
              </strong>
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Ngừng nhận đơn làm riêng để đóng hàng giao kịp
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
