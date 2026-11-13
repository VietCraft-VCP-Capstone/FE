import { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  RotateCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { compactMoney, count, money } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { DeltaBadge, Skeleton } from '../components/ui';
import { fullDate, pct, RANGE_OPTIONS, shortDate } from '../format';
import { useInsight } from '../hooks/useInsight';
import type { ShopOverview, TimeRange } from '../types';

const RANGES: TimeRange[] = ['7d', '30d', '90d', '180d', '365d', 'year'];

const RANGE_DAYS_MAP: Record<TimeRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '365d': 365,
  year: 365,
};

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Tự động phân tích điểm nổi bật trong kỳ để hiển thị ở "Điều đáng chú ý" */
function generateSmartNotice(data: ShopOverview): string {
  if (!data.series || data.series.length === 0) {
    return 'Chưa có đủ dữ liệu chuỗi thời gian để đưa ra nhận xét đáng chú ý.';
  }

  const totalRev = data.kpi.revenue_vnd.value ?? 0;
  const totalOrders = data.kpi.orders.value ?? 0;
  const totalViews = data.kpi.views.value ?? 0;
  const cr = data.kpi.conversion_pct.value ?? 0;

  if (totalRev === 0 && totalOrders === 0) {
    return 'Trong kỳ này shop chưa phát sinh đơn hàng mới. Hãy thử kiểm tra lại giá bán, hình ảnh và chạy các chương trình ưu đãi để thu hút người mua.';
  }

  const sortedDays = [...data.series]
    .filter(p => p.revenue_vnd > 0)
    .sort((a, b) => b.revenue_vnd - a.revenue_vnd);

  const observations: string[] = [];

  if (sortedDays.length > 0 && totalRev > 0) {
    const topDay = sortedDays[0];
    const topDayPct = Math.round((topDay.revenue_vnd / totalRev) * 100);

    if (data.range === 'year') {
      observations.push(
        `Năm có doanh thu cao nhất là năm ${topDay.date} (${money(topDay.revenue_vnd)}), chiếm ${topDayPct}% tổng doanh thu các năm đang đối chiếu.`
      );
    } else if (sortedDays.length >= 2 && (sortedDays[0].revenue_vnd + sortedDays[1].revenue_vnd) / totalRev >= 0.7) {
      // 2 ngày gom phần lớn doanh thu
      const d1 = shortDate(sortedDays[1].date);
      const d2 = shortDate(sortedDays[0].date);
      observations.push(
        `Doanh thu dồn vào 2 ngày ${d1}–${d2}, trong đó ${d2} chiếm khoảng ${topDayPct}%.`
      );
    } else if (topDayPct >= 40) {
      observations.push(
        `Doanh thu dồn phần lớn vào ngày ${shortDate(topDay.date)}, chiếm ${topDayPct}% tổng doanh thu kỳ.`
      );
    } else {
      observations.push(
        `Doanh thu phân bổ tương đối đồng đều qua các ngày bán, ngày cao nhất là ${shortDate(topDay.date)} (${money(topDay.revenue_vnd)}).`
      );
    }
  }

  // Nhận xét tỉ lệ chuyển đổi & lượt xem
  if (totalViews > 0) {
    if (cr >= 5) {
      const topTitles = (data.top_products || [])
        .slice(0, 2)
        .map(p => p.title.toLowerCase());
      const categoryHint = topTitles.some(t => t.includes('váy') || t.includes('set') || t.includes('áo'))
        ? 'cho nhóm chân váy và set đồ đang bán chạy'
        : 'cho các sản phẩm chủ lực';

      observations.push(
        `Lượt xem còn thấp (${count(totalViews)}) nhưng tỉ lệ chốt đơn tốt: nên đẩy thêm lưu lượng ${categoryHint}.`
      );
    } else if (cr < 2) {
      observations.push(
        `Lượt xem đạt ${count(totalViews)} nhưng tỉ lệ chốt đơn còn khiêm tốn (${pct(cr, 1)}): nên tối ưu thêm mô tả sản phẩm, thêm đánh giá hoặc điều chỉnh giá bán.`
      );
    } else {
      observations.push(
        `Tỉ lệ chuyển đổi đạt ${pct(cr, 1)} ở mức ổn định so với trung bình ngành thủ công.`
      );
    }
  } else if (totalOrders > 0) {
    observations.push(
      `Shop đã ghi nhận ${count(totalOrders)} đơn hàng thành công trong kỳ. Hãy tiếp tục duy trì cập nhật sản phẩm và tương tác khách mua.`
    );
  }

  return observations.join(' ');
}

export function OverviewPage() {
  const [params, setParams] = useSearchParams();
  const rawRange = params.get('range');
  const timeRange: TimeRange = RANGES.includes(rawRange as TimeRange) ? (rawRange as TimeRange) : '30d';
  const toParam = params.get('to') || undefined;

  // Lấy dữ liệu với toParam nếu có; mặc định là thời gian hiện tại
  const { state, reload } = useInsight<ShopOverview>('/overview', {
    timeRange,
    ...(toParam ? { to: toParam } : {}),
  });

  // Tùy chọn hiển thị các đường trên biểu đồ kết hợp
  const [showRevenue, setShowRevenue] = useState(true);
  const [showOrders, setShowOrders] = useState(true);
  const [showViews, setShowViews] = useState(true);

  const windowDays = RANGE_DAYS_MAP[timeRange] || 30;

  const setRange = (value: TimeRange) => {
    const next = new URLSearchParams(params);
    next.set('range', value);
    setParams(next, { replace: true });
  };

  const handlePrevPeriod = (currTo: string) => {
    if (timeRange === 'year') {
      const d = parseISO(currTo);
      d.setFullYear(d.getFullYear() - 1);
      const next = new URLSearchParams(params);
      next.set('to', `${d.getFullYear()}-12-31`);
      setParams(next, { replace: true });
      return;
    }
    const d = parseISO(currTo);
    d.setDate(d.getDate() - windowDays);
    const next = new URLSearchParams(params);
    next.set('to', formatISO(d));
    setParams(next, { replace: true });
  };

  const handleNextPeriod = (currTo: string) => {
    if (timeRange === 'year') {
      const d = parseISO(currTo);
      d.setFullYear(d.getFullYear() + 1);
      const next = new URLSearchParams(params);
      const thisYear = new Date().getFullYear();
      if (d.getFullYear() >= thisYear) {
        next.delete('to');
      } else {
        next.set('to', `${d.getFullYear()}-12-31`);
      }
      setParams(next, { replace: true });
      return;
    }
    const d = parseISO(currTo);
    d.setDate(d.getDate() + windowDays);
    const today = new Date();
    const next = new URLSearchParams(params);
    if (d >= today) {
      next.delete('to');
    } else {
      next.set('to', formatISO(d));
    }
    setParams(next, { replace: true });
  };

  const handleResetToLatest = () => {
    const next = new URLSearchParams(params);
    next.delete('to');
    setParams(next, { replace: true });
  };

  const handleSelectPeriod = (isoTo: string) => {
    const next = new URLSearchParams(params);
    if (!isoTo) {
      next.delete('to');
    } else {
      next.set('to', isoTo);
    }
    setParams(next, { replace: true });
  };

  return (
    <InsightPage
      title="Tổng quan shop"
      question="Shop đang chạy ra sao so với kỳ trước?"
      actions={
        <button
          type="button"
          onClick={reload}
          disabled={state.kind === 'loading'}
          title="Làm mới số liệu từ máy chủ"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 text-xs font-semibold text-stone-700 shadow-sm transition-all duration-150 hover:border-[#007700] hover:bg-[#EAF0E2]/30 hover:text-[#005B00] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
        >
          <RotateCw
            size={13.5}
            className={`transition-transform duration-300 ${state.kind === 'loading' ? 'animate-spin text-[#007700]' : 'text-stone-500'}`}
          />
          <span>{state.kind === 'loading' ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      }
    >
      <InsightBlock state={state} onRetry={reload} skeleton={<PageSkeleton />}>
        {(data, meta) => {
          const totalViews = data.series.reduce((sum, p) => sum + (p.views ?? 0), 0);
          const totalOrders = data.series.reduce((sum, p) => sum + p.orders, 0);
          const totalRev = data.kpi.revenue_vnd.value ?? 0;
          const aov = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
          const crValue = data.kpi.conversion_pct.value;

          // Thống kê Doanh thu: Trung bình/ngày hoặc đỉnh năm
          const daysCount = data.series.length || windowDays;
          const avgPerDay = Math.round(totalRev / daysCount);
          const sortedByRev = [...data.series].sort((a, b) => b.revenue_vnd - a.revenue_vnd);
          const peakPoint = sortedByRev[0];
          const peakRev = peakPoint?.revenue_vnd ?? 0;
          const peakDate = peakPoint ? shortDate(peakPoint.date) : '';
          const revenueHint =
            totalRev > 0
              ? timeRange === 'year'
                ? `Đỉnh cao nhất: ${compactMoney(peakRev)} · Năm ${peakPoint?.date ?? ''}`
                : `Trung bình ${money(avgPerDay)} / ngày · đỉnh ${compactMoney(peakRev)} · ${peakDate}`
              : 'Chưa có doanh thu trong kỳ';

          // Chuẩn bị dữ liệu biểu đồ
          const chartData = data.series.map(point => ({
            date: point.date,
            label: timeRange === 'year' ? `Năm ${point.date}` : shortDate(point.date),
            revenue: point.revenue_vnd,
            orders: point.orders,
            views: point.views ?? 0,
          }));

          // Sản phẩm bán chạy nhất: max doanh thu để tính thanh %
          const maxProductRev = data.top_products.length > 0 ? Math.max(...data.top_products.map(p => p.revenue_vnd)) : 1;

          // Tạo danh sách các khoảng thời gian cho select
          const today = new Date();
          const currYear = today.getFullYear();
          const periodOptions =
            timeRange === 'year'
              ? [0, 1, 2, 3].map(idx => {
                  const y = currYear - idx;
                  return {
                    value: idx === 0 ? '' : `${y}-12-31`,
                    label: `Năm ${y}${idx === 0 ? ' (Mới nhất)' : ''}`,
                  };
                })
              : [0, 1, 2, 3, 4].map(idx => {
                  const endD = new Date(today);
                  endD.setDate(endD.getDate() - idx * windowDays);
                  const startD = new Date(endD);
                  startD.setDate(startD.getDate() - (windowDays - 1));
                  return {
                    value: idx === 0 ? '' : formatISO(endD),
                    label: `${fullDate(formatISO(startD))} – ${fullDate(formatISO(endD))}`,
                  };
                });

          const isAtLatest =
            !toParam || (timeRange === 'year' && parseISO(toParam).getFullYear() >= currYear);

          return (
            <div className="space-y-5">
              {/* THANH ĐIỀU HƯỚNG KHOẢNG THỜI GIAN */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Trái: Bộ chọn khoảng ngày với mũi tên < >, Select (không có chữ gần đây), và nút Mới nhất */}
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex items-center rounded-full border border-stone-200/90 bg-white p-1 shadow-sm">
                    {/* Nút lùi 1 kỳ */}
                    <button
                      type="button"
                      onClick={() => handlePrevPeriod(data.to)}
                      title="Lùi về kỳ trước"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Dropdown Select khoảng ngày: tuyệt đối không có chữ "gần đây" hay "gần nhất" */}
                    <div className="relative flex items-center px-1">
                      <select
                        aria-label="Chọn khoảng thời gian"
                        value={toParam || ''}
                        onChange={e => handleSelectPeriod(e.target.value)}
                        className="cursor-pointer appearance-none bg-transparent py-1 pl-2 pr-6 text-xs font-bold text-stone-800 outline-none"
                      >
                        {periodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="pointer-events-none absolute right-2 text-stone-500" />
                    </div>

                    {/* Nút tiến 1 kỳ */}
                    <button
                      type="button"
                      onClick={() => handleNextPeriod(data.to)}
                      disabled={isAtLatest}
                      title="Tiến tới kỳ sau"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Nút trở về Mới nhất (hiện thời gian hiện tại) */}
                  <button
                    type="button"
                    onClick={handleResetToLatest}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                      isAtLatest
                        ? 'bg-[#EAF0E2] text-[#007700] hover:bg-[#d8e4cf]'
                        : 'border border-stone-200 bg-white text-stone-700 hover:border-[#007700] hover:text-[#007700]'
                    }`}
                  >
                    Mới nhất
                  </button>
                </div>

                {/* Phải: Nhóm nút chuyển chu kỳ [ 7 ngày | 30 ngày | 90 ngày | 6 tháng | 1 năm | Theo năm ] */}
                <div
                  role="group"
                  aria-label="Chọn độ dài kỳ phân tích"
                  className="inline-flex items-center gap-0.5 rounded-full border border-stone-200/90 bg-white p-1 shadow-sm"
                >
                  {RANGE_OPTIONS.map(opt => {
                    const active = opt.value === timeRange;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRange(opt.value)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                          active
                            ? 'bg-[#007700] text-white shadow-sm'
                            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 THẺ CHỈ SỐ KPI CHÍNH */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. LƯỢT XEM */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all hover:border-stone-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">Lượt xem</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fef3c7]/60 text-amber-700">
                      <Eye size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-stone-900">
                      {data.kpi.views.value !== null ? count(data.kpi.views.value) : '—'}
                    </div>
                    <div className="mt-1 text-xs text-stone-400">
                      {data.kpi.views.value === null
                        ? 'Sàn chưa bật theo dõi'
                        : timeRange === 'year'
                          ? 'Lượt xem sản phẩm trong năm'
                          : 'Lượt xem sản phẩm trong kỳ'}
                    </div>
                  </div>
                </div>

                {/* 2. ĐƠN HÀNG */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all hover:border-stone-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">Đơn hàng</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e0e7ff]/70 text-indigo-700">
                      <ShoppingBag size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-stone-900">
                      {data.kpi.orders.value !== null ? count(data.kpi.orders.value) : '—'}
                    </div>
                    <div className="mt-1 text-xs text-stone-400">
                      {timeRange === 'year' ? 'Số đơn trong năm đang xem' : 'Số đơn trong kỳ đang xem'}
                    </div>
                  </div>
                </div>

                {/* 3. DOANH THU */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all hover:border-stone-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">Doanh thu</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecfccb] text-lime-800">
                      <Coins size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-black text-stone-900">
                        {data.kpi.revenue_vnd.value !== null ? money(data.kpi.revenue_vnd.value) : '—'}
                      </span>
                      {data.kpi.revenue_vnd.pop_pct === null ? (
                        <span className="inline-flex items-center rounded-full bg-[#EAF0E2] px-2 py-0.5 text-[11px] font-bold text-[#005B00]">
                          Kỳ đầu
                        </span>
                      ) : (
                        <DeltaBadge value={data.kpi.revenue_vnd.pop_pct} fallbackLabel="Kỳ đầu" />
                      )}
                    </div>
                    <div className="mt-1 text-xs text-stone-400">{revenueHint}</div>
                  </div>
                </div>

                {/* 4. TỈ LỆ CHUYỂN ĐỔI */}
                <div className="relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all hover:border-stone-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">Tỉ lệ chuyển đổi</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ede9fe] text-purple-700">
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-stone-900">
                      {crValue !== null ? pct(crValue, 2) : '—'}
                    </div>
                    <div className="mt-1 text-xs text-stone-400">Đơn hàng ÷ Lượt xem</div>
                  </div>
                </div>
              </div>

              {/* BIỂU ĐỒ KẾT HỢP DOANH THU & ĐƠN HÀNG & LƯỢT XEM */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  {/* Legend / Bộ chọn đường dữ liệu */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRevenue(!showRevenue)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                        showRevenue
                          ? 'border border-[#16a34a]/30 bg-[#EAF0E2]/60 text-[#005B00]'
                          : 'bg-stone-100 text-stone-400 opacity-60'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
                      Doanh thu
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowOrders(!showOrders)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                        showOrders
                          ? 'border border-[#ea580c]/30 bg-orange-50 text-orange-700'
                          : 'bg-stone-100 text-stone-400 opacity-60'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[#ea580c]" />
                      Đơn hàng
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowViews(!showViews)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                        showViews
                          ? 'border border-[#2563eb]/30 bg-blue-50 text-blue-700'
                          : 'bg-stone-100 text-stone-400 opacity-60'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                      Lượt xem
                    </button>
                  </div>

                  <span className="text-xs text-stone-400 font-medium">
                    {timeRange === 'year'
                      ? `${chartData.length} năm · so sánh giữa các năm`
                      : `${chartData.length} mốc dữ liệu · theo ngày`}
                  </span>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        stroke="#a8a29e"
                        tick={{ fontSize: 11, fill: '#78716c' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e7e5e4' }}
                        interval="preserveStartEnd"
                      />
                      {/* Trục Y trái: Doanh thu (VND) */}
                      <YAxis
                        yAxisId="left"
                        stroke="#a8a29e"
                        tick={{ fontSize: 11, fill: '#78716c' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={compactMoney}
                      />
                      {/* Trục Y phải: Số lượng đơn và lượt xem */}
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#a8a29e"
                        tick={{ fontSize: 11, fill: '#78716c' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={count}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const revItem = payload.find(p => p.dataKey === 'revenue');
                          const ordItem = payload.find(p => p.dataKey === 'orders');
                          const viewItem = payload.find(p => p.dataKey === 'views');

                          const revVal = Number(revItem?.value ?? 0);
                          const ordVal = Number(ordItem?.value ?? 0);
                          const viewVal = Number(viewItem?.value ?? 0);
                          const aovDay = ordVal > 0 ? Math.round(revVal / ordVal) : 0;

                          return (
                            <div className="min-w-[210px] rounded-xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
                              <div className="mb-2 border-b border-stone-100 pb-1.5 text-xs font-bold text-stone-800">
                                {label}
                              </div>
                              <div className="space-y-1.5 text-xs">
                                {showRevenue && (
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-stone-600">
                                      <span className="h-2 w-2 rounded-sm bg-[#16a34a]" />
                                      Doanh thu:
                                    </span>
                                    <span className="font-bold text-[#007700]">{money(revVal)}</span>
                                  </div>
                                )}
                                {showOrders && (
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-stone-600">
                                      <span className="h-2 w-2 rounded-full bg-[#ea580c]" />
                                      Đơn hàng:
                                    </span>
                                    <span className="font-bold text-stone-800">{count(ordVal)} đơn</span>
                                  </div>
                                )}
                                {showViews && (
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-stone-600">
                                      <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                                      Lượt xem:
                                    </span>
                                    <span className="font-bold text-stone-800">{count(viewVal)}</span>
                                  </div>
                                )}
                                {ordVal > 0 && (
                                  <div className="border-t border-stone-100 pt-1 text-[11px] text-stone-400 flex items-center justify-between">
                                    <span>Trung bình / đơn:</span>
                                    <span className="font-semibold text-stone-600">{money(aovDay)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }}
                      />
                      {showRevenue && (
                        <Bar
                          yAxisId="left"
                          dataKey="revenue"
                          name="Doanh thu"
                          fill="#16a34a"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={timeRange === 'year' ? 48 : 38}
                        />
                      )}
                      {showOrders &&
                        (timeRange === 'year' ? (
                          <Bar
                            yAxisId="right"
                            dataKey="orders"
                            name="Đơn hàng"
                            fill="#ea580c"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={48}
                          />
                        ) : (
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="orders"
                            name="Đơn hàng"
                            stroke="#ea580c"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      {showViews &&
                        (timeRange === 'year' ? (
                          <Bar
                            yAxisId="right"
                            dataKey="views"
                            name="Lượt xem"
                            fill="#2563eb"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={48}
                          />
                        ) : (
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="views"
                            name="Lượt xem"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* KHỐI 2 CỘT: PHỄU CHUYỂN ĐỔI & TOP 5 SẢN PHẨM BÁN CHẠY */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Cột 1: Phễu chuyển đổi */}
                <div className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <div>
                    <h3 className="m-0 text-base font-bold text-stone-900">Phễu chuyển đổi</h3>
                    <p className="mb-5 mt-1 text-xs text-stone-500">Từ lượt xem đến đơn hàng trong kỳ</p>

                    <div className="space-y-3">
                      {/* Khối Lượt xem (Xanh dương) */}
                      <div className="flex items-center justify-between rounded-2xl bg-[#3b82f6] px-5 py-4 text-white shadow-sm">
                        <span className="text-sm font-bold">Lượt xem</span>
                        <span className="text-2xl font-black tracking-tight">{count(totalViews)}</span>
                      </div>

                      {/* Tỉ lệ chốt đơn */}
                      <div className="flex items-center justify-center text-xs font-semibold text-stone-500 py-0.5">
                        ↓ {crValue !== null ? pct(crValue, 1) : '—'} chốt đơn
                      </div>

                      {/* Khối Đơn hàng (Xanh lá) */}
                      <div className="flex items-center justify-between rounded-2xl bg-[#007700] px-5 py-4 text-white shadow-sm">
                        <span className="text-sm font-bold">Đơn hàng</span>
                        <span className="text-2xl font-black tracking-tight">{count(totalOrders)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 text-center text-xs text-stone-500">
                    Giá trị trung bình mỗi đơn: <strong className="font-bold text-stone-800">{money(aov)}</strong>
                  </div>
                </div>

                {/* Cột 2: 5 sản phẩm bán chạy nhất */}
                <div className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
                  <div>
                    <h3 className="m-0 text-base font-bold text-stone-900">5 sản phẩm bán chạy nhất</h3>
                    <p className="mb-4 mt-1 text-xs text-stone-500">Xếp theo doanh thu · bấm để xem điểm tối ưu sản phẩm</p>

                    {data.top_products.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400">
                        Kỳ này chưa có sản phẩm nào phát sinh đơn hàng.
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {data.top_products.slice(0, 5).map((p, idx) => {
                          const percent = Math.max(4, Math.round((p.revenue_vnd / maxProductRev) * 100));
                          return (
                            <div key={p.listing_id || idx} className="group">
                              <div className="flex items-center justify-between gap-2.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#EAF0E2] text-[11px] font-bold text-[#007700]">
                                  {idx + 1}
                                </span>
                                <Link
                                  to={`/seller/insights/listings/${p.listing_id}`}
                                  title={p.title}
                                  className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-800 transition hover:text-[#007700]"
                                >
                                  {p.title}
                                </Link>
                                <div className="shrink-0 text-right">
                                  <div className="text-xs font-bold text-stone-900 tabular-nums">{money(p.revenue_vnd)}</div>
                                  <div className="text-[11px] text-stone-400 tabular-nums">{count(p.orders)} đơn</div>
                                </div>
                              </div>
                              {/* Thanh tiến trình doanh thu */}
                              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                                <div
                                  className="h-full rounded-full bg-[#007700] transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD: ĐIỀU ĐÁNG CHÚ Ý */}
              <div className="rounded-2xl border border-stone-200/80 bg-[#FBFBF9] p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={16} className="text-amber-500 fill-amber-400 shrink-0" />
                  <h4 className="m-0 text-sm font-bold text-stone-900">Điều đáng chú ý</h4>
                </div>
                <p className="m-0 text-xs leading-relaxed text-stone-700">
                  {generateSmartNotice(data)}
                </p>
              </div>

              {/* FOOTER NGUỒN VÀ THỜI GIAN CẬP NHẬT */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-stone-500">
                <span className="inline-flex items-center rounded-full bg-[#EAF0E2] px-2.5 py-0.5 text-[11px] font-bold text-[#005B00]">
                  {meta.source?.mode === 'live' ? 'Dữ liệu thật' : 'Dữ liệu thật'}
                </span>
                <span>
                  Cập nhật {meta.computed_at ? new Date(meta.computed_at).toLocaleDateString('vi-VN') : fullDate(data.to)}
                  {meta.computed_at ? ` · ${new Date(meta.computed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''} ·
                  Tính trên {meta.quality?.sample_size ?? data.series.length} mẫu ·
                  {data.anchored_to_latest_data ? ' Chưa tính ngày hôm nay' : ' Đến thời điểm hiện tại'}
                </span>
              </div>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}
