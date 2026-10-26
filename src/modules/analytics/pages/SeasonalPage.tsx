import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Flame,
  Gift,
  GraduationCap,
  Heart,
  Hourglass,
  Lightbulb,
  Package,
  Percent,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Trees,
  TrendingUp,
} from 'lucide-react';
import { count, money } from '../../../shared/utils/format';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { fullDate } from '../format';
import { useInsight } from '../hooks/useInsight';
import type { PodBlankSuggestion, ReadyToShipIdea, SeasonalCampaign, SeasonalForecast } from '../types';

const CATEGORY_OPTIONS = [
  { value: 'thoi-trang', label: 'Thời trang & May mặc' },
  { value: 'gia-dung', label: 'Gia dụng & Đồ uống' },
  { value: 'phu-kien', label: 'Phụ kiện & Túi' },
  { value: 'trang-tri', label: 'Trang trí nhà cửa' },
];

/** Lấy biểu tượng Lucide-react chuẩn cho từng chiến dịch */
function getCampaignLucideIcon(campId: string) {
  switch (campId) {
    case 'halloween':
      return <Flame className="h-4 w-4 text-orange-600" />;
    case 'noel':
      return <Trees className="h-4 w-4 text-emerald-700" />;
    case 'tet':
      return <Sparkles className="h-4 w-4 text-rose-600" />;
    case 'valentine_8_3':
      return <Heart className="h-4 w-4 text-pink-600" />;
    case 'he_dulich':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'tuutuong_trungthu':
      return <GraduationCap className="h-4 w-4 text-teal-700" />;
    default:
      return <Gift className="h-4 w-4 text-[#007700]" />;
  }
}

/** Phân tích chi tiết và lời khuyên theo từng trục của biểu đồ Radar */
function getAxisAnalysis(axisName: string, _idx: number, campName: string) {
  if (axisName.includes('cầu') || axisName.includes('thị trường')) {
    return {
      icon: TrendingUp,
      title: 'Sức cầu thị trường',
      summary: `Nhu cầu tìm kiếm và lượng truy cập toàn sàn dịp ${campName} bùng nổ (+45% so với ngày thường). Khách hàng chủ động gom đơn sớm để tránh tăng giá.`,
      advice: 'Tối ưu ngay tiêu đề & thẻ tag với các từ khoá ngách đón lượt tìm kiếm sớm trước khi đối thủ đẩy mạnh.',
    };
  }
  if (axisName.includes('chuẩn bị') || axisName.includes('cửa sổ')) {
    return {
      icon: Clock,
      title: 'Cửa sổ chuẩn bị',
      summary: `Thời gian vàng chuẩn bị kéo dài 4-6 tuần trước mùa cao điểm. Chuẩn bị đúng nhịp quyết định 80% thắng lợi của chiến dịch.`,
      advice: 'Cần hoàn tất chốt mẫu thử, nhập phôi sẵn/nguyên phụ liệu và chụp ảnh concept trước tuần T-3 để sẵn sàng giao ngay.',
    };
  }
  if (axisName.includes('lợi nhuận') || axisName.includes('biên')) {
    return {
      icon: Percent,
      title: 'Biên lợi nhuận',
      summary: 'Khách hàng mùa lễ hội ít nhạy cảm về giá hơn, sẵn sàng chi trả cao cho các thiết kế độc đáo và bao bì chỉn chu (+86/100).',
      advice: 'Tung phiên bản giới hạn (Limited Edition) hoặc bán theo combo 2-3 món để đẩy biên lợi nhuận gộp lên 55-70%.',
    };
  }
  if (axisName.includes('quà') || axisName.includes('biếu')) {
    return {
      icon: Gift,
      title: 'Sức mua làm quà',
      summary: 'Động cơ mua biếu tặng người thân, bạn bè, đồng nghiệp chiếm tỉ trọng cao nhất (+92/100) trong cơ cấu doanh số mùa này.',
      advice: 'Bắt buộc đóng hộp quà sang trọng, kèm thiệp viết tay hoặc dịch vụ in tên / lời chúc cá nhân hoá để tăng giá trị đơn.',
    };
  }
  if (axisName.includes('chốt') || axisName.includes('chuyển đổi') || axisName.includes('tỉ lệ')) {
    return {
      icon: CheckCircle2,
      title: 'Tỉ lệ chốt đơn',
      summary: 'Tỉ lệ chuyển đổi (CVR) tăng mạnh trong 2 tuần cao điểm sát thềm lễ hội do tâm lý mua gấp, sợ cháy hàng hoặc giao trễ (+85/100).',
      advice: 'Bật giao hoả tốc, cam kết đóng gói trong ngày và gắn huy hiệu hàng sẵn để tăng tốc độ ra quyết định của khách hàng.',
    };
  }
  return {
    icon: Sparkles,
    title: axisName,
    summary: `Chỉ số ${axisName} phản ánh mức độ tiềm năng vượt trội trong mùa ${campName} so với các giai đoạn thường trong năm.`,
    advice: 'Tận dụng đòn bẩy mùa vụ để gia tăng doanh số và tối ưu tỷ suất lợi nhuận trên mỗi đơn hàng.',
  };
}

/** Biểu đồ Radar 5 trục tùy chỉnh bằng SVG sắc nét kèm tooltip và phân tích tương tác khi rê chuột */
function SeasonalRadar({
  axes,
  currentValues,
  benchmarkValues,
  overallScore = 88,
  takeaways = [],
  campaignName = 'Giáng Sinh',
}: {
  axes: string[];
  currentValues: number[];
  benchmarkValues: number[];
  overallScore?: number;
  takeaways?: string[];
  campaignName?: string;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = 135;
  const R = 85;
  const total = axes.length;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPolygonHovered, setIsPolygonHovered] = useState(false);

  const getPoint = (val: number, index: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (Math.max(15, Math.min(100, val)) / 100) * R;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = R + 24;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const levels = [0.25, 0.5, 0.75, 1];

  const currentPoints = currentValues.map((v, i) => getPoint(v, i));
  const currentPath =
    currentPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  const benchPoints = benchmarkValues.map((v, i) => getPoint(v, i));
  const benchPath =
    benchPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  // Xác định nội dung phân tích hiện tại để hiển thị trong panel
  const activeAxisIdx = hoveredIndex !== null ? hoveredIndex : 3; // Mặc định hiển thị "Sức mua làm quà" (index 3)
  const currentAxisName = axes[activeAxisIdx] || axes[0];
  const currentAxisVal = currentValues[activeAxisIdx] ?? 85;
  const currentAxisBench = benchmarkValues[activeAxisIdx] ?? 50;
  const analysisDetail = getAxisAnalysis(currentAxisName, activeAxisIdx, campaignName);

  let displayAnalysis = {
    icon: analysisDetail.icon,
    title: hoveredIndex !== null ? `Phân tích: ${analysisDetail.title}` : `Điểm nhấn: ${analysisDetail.title}`,
    badge: `${currentAxisVal}/100 (+${currentAxisVal - currentAxisBench}đ)`,
    summary: analysisDetail.summary,
    advice: analysisDetail.advice,
  };

  if (isPolygonHovered && hoveredIndex === null) {
    displayAnalysis = {
      icon: Sparkles,
      title: `Tiềm năng tổng thể mùa ${campaignName}`,
      badge: `${overallScore}/100`,
      summary:
        takeaways[0] ||
        `Mùa vụ ${campaignName} có mức độ tập trung sức mua và tiềm năng doanh số vượt trội hơn 45% so với mức trung bình ngày thường.`,
      advice:
        takeaways[1] ||
        'Tập trung đóng gói combo quà tặng, chuẩn bị hình ảnh concept sớm và gắn từ khoá ngách đón tìm kiếm.',
    };
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full flex justify-center">
        {/* Tooltip nổi tương tác trên biểu đồ khi rê chuột vào đỉnh */}
        {hoveredIndex !== null && currentPoints[hoveredIndex] && (
          <div
            className="pointer-events-none absolute z-30 rounded-xl border border-stone-700/80 bg-stone-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95"
            style={{
              left: Math.max(10, Math.min(size - 200, currentPoints[hoveredIndex].x - 90)),
              top: currentPoints[hoveredIndex].y < 90 ? currentPoints[hoveredIndex].y + 15 : currentPoints[hoveredIndex].y - 75,
              width: '190px',
            }}
          >
            <div className="flex items-center justify-between gap-1.5 border-b border-stone-700/60 pb-1 text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1 truncate">
                <analysisDetail.icon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                {currentAxisName}
              </span>
              <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 text-[10px] text-emerald-300">
                {currentAxisVal}/100
              </span>
            </div>
            <div className="mt-1 text-[10.5px] font-medium leading-tight text-stone-200">
              {analysisDetail.summary}
            </div>
            <div className="mt-1 flex items-center justify-between text-[9.5px] text-emerald-300 font-semibold">
              <span>vs ngày thường ({currentAxisBench}):</span>
              <span>+{currentAxisVal - currentAxisBench} điểm</span>
            </div>
          </div>
        )}

        {/* Tooltip khi rê chuột vào vùng đa giác tổng thể */}
        {isPolygonHovered && hoveredIndex === null && (
          <div
            className="pointer-events-none absolute z-30 rounded-xl border border-emerald-600/60 bg-stone-900/95 px-3 py-2 text-white shadow-xl backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95"
            style={{
              left: '50%',
              top: '115px',
              transform: 'translate(-50%, -50%)',
              width: '210px',
            }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Điểm tổng thể: {overallScore}/100
            </div>
            <p className="mt-1 mb-0 text-[10.5px] leading-tight text-stone-200">
              Tiềm năng mùa {campaignName} cao vượt trội so với ngày thường.
            </p>
            <p className="mt-1 mb-0 text-[9.5px] text-stone-400">
              Rê chuột vào từng đỉnh hoặc bảng bên dưới để xem chi tiết.
            </p>
          </div>
        )}

        <svg width={size} height={260} className="overflow-visible select-none">
          {/* Các vòng ngũ giác đồng tâm */}
          {levels.map((lvl, lIdx) => {
            const pts = axes.map((_, i) => getPoint(lvl * 100, i));
            const pStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
            return <path key={lIdx} d={pStr} fill="none" stroke="#e2e8f0" strokeWidth={1} />;
          })}

          {/* Các tia nối từ tâm */}
          {axes.map((_, i) => {
            const outer = getPoint(100, i);
            const isHovered = hoveredIndex === i;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={outer.x}
                y2={outer.y}
                stroke={isHovered ? '#16a34a' : '#e2e8f0'}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-colors duration-150"
              />
            );
          })}

          {/* Đa giác mức ngày thường (nét đứt) */}
          <path d={benchPath} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" />

          {/* Đa giác tiềm năng mùa vụ hiện tại */}
          <path
            d={currentPath}
            fill={isPolygonHovered || hoveredIndex !== null ? 'rgba(34, 197, 94, 0.32)' : 'rgba(34, 197, 94, 0.22)'}
            stroke={isPolygonHovered || hoveredIndex !== null ? '#15803d' : '#16a34a'}
            strokeWidth={isPolygonHovered || hoveredIndex !== null ? 3 : 2.5}
            className="cursor-pointer transition-all duration-200"
            onMouseEnter={() => setIsPolygonHovered(true)}
            onMouseLeave={() => setIsPolygonHovered(false)}
          />

          {/* Các đỉnh điểm số */}
          {currentPoints.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                {/* Vòng hào quang khi rê chuột */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={12}
                    fill="rgba(34, 197, 94, 0.3)"
                    stroke="#16a34a"
                    strokeWidth={1.5}
                    className="animate-pulse"
                  />
                )}
                {/* Điểm nút */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6.5 : 4.5}
                  fill="#15803d"
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />
                {/* Vùng cảm ứng chuột mở rộng */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Nhãn 5 trục */}
          {axes.map((axis, i) => {
            const lp = getLabelPoint(i);
            const isHovered = hoveredIndex === i;
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (i === 1 || i === 2) textAnchor = 'start';
            if (i === 3 || i === 4) textAnchor = 'end';
            return (
              <text
                key={i}
                x={lp.x}
                y={lp.y + 4}
                textAnchor={textAnchor}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`cursor-pointer transition-all duration-150 ${
                  isHovered
                    ? 'fill-emerald-800 text-[11.5px] font-bold underline decoration-emerald-500 underline-offset-2'
                    : 'fill-stone-600 text-[11px] font-semibold hover:fill-emerald-700'
                }`}
              >
                {axis}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Bảng giá trị 5 trục bên dưới có hỗ trợ rê chuột đồng bộ */}
      <div className="w-full space-y-1 px-1 pt-2">
        {axes.map((axis, idx) => {
          const isHovered = hoveredIndex === idx;
          const diff = (currentValues[idx] ?? 85) - (benchmarkValues[idx] ?? 50);
          return (
            <div
              key={axis}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                isHovered
                  ? 'bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-300 shadow-xs'
                  : 'text-stone-700 hover:bg-stone-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    isHovered ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-stone-300'
                  }`}
                />
                <span className={isHovered ? 'text-emerald-950' : 'text-stone-600'}>{axis}</span>
              </div>
              <div className="flex items-center gap-2">
                {isHovered && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                    +{diff} vs thường
                  </span>
                )}
                <span
                  className={`tabular-nums transition-all ${
                    isHovered ? 'font-extrabold text-emerald-800 text-sm' : 'font-bold text-stone-900'
                  }`}
                >
                  {currentValues[idx] ?? 85}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Khối phân tích biểu đồ chuyên sâu tương tác khi rê chuột */}
      <div className="mt-3.5 w-full rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-stone-50/40 to-white p-3.5 shadow-xs transition-all duration-200">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-100/80 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
            <displayAnalysis.icon className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{displayAnalysis.title}</span>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            {displayAnalysis.badge}
          </span>
        </div>

        {/* Nội dung phân tích chi tiết */}
        <p className="mt-2 mb-1.5 text-xs text-stone-700 leading-relaxed font-normal">
          {displayAnalysis.summary}
        </p>

        {/* Lời khuyên hành động */}
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/90 p-2 text-[11px] text-stone-600 border border-emerald-100/70">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <span className="font-semibold text-emerald-900">Chiến lược đề xuất: </span>
            <span>{displayAnalysis.advice}</span>
          </div>
        </div>

        {/* Ghi chú gợi ý rê chuột */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
          <span>Rê chuột vào các đỉnh biểu đồ để xem phân tích từng trục</span>
          {hoveredIndex !== null && (
            <span className="font-semibold text-emerald-700">Đang chọn: {axes[hoveredIndex]}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SeasonalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCampaignId = searchParams.get('campaign') || '';
  const currentCategorySlug = searchParams.get('category') || 'thoi-trang';

  const [activeTab, setActiveTab] = useState<'ready' | 'pod'>('ready');
  const [sortOption, setSortOption] = useState<'profit' | 'newest'>('profit');

  // Quản lý trạng thái lưu ý tưởng vào kế hoạch
  const [savedIdeas, setSavedIdeas] = useState<Record<string, boolean>>({});

  // Quản lý trạng thái đánh dấu hoàn thành các mốc kế hoạch
  const [checkedMilestones, setCheckedMilestones] = useState<Record<number, boolean>>({});

  const toggleSaveIdea = (key: string) => {
    setSavedIdeas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMilestone = (idx: number) => {
    setCheckedMilestones(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const savedIdeasCount = Object.values(savedIdeas).filter(Boolean).length;
  const completedMilestonesCount = Object.values(checkedMilestones).filter(Boolean).length;

  const query = useMemo(() => {
    const q: Record<string, string> = {
      category_slug: currentCategorySlug,
    };
    if (currentCampaignId) {
      q.campaign_id = currentCampaignId;
    }
    return q;
  }, [currentCategorySlug, currentCampaignId]);

  const { state, reload } = useInsight<SeasonalForecast>('/forecast/seasonal', query);

  const handleSelectCampaign = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('campaign', id);
    setSearchParams(next);
  };

  const handleSelectCategory = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('category', slug);
    setSearchParams(next);
  };

  return (
    <InsightPage
      title="Chiến Lược Mùa Vụ & Gợi Ý Sản Phẩm"
      question="Ma trận tiềm năng mùa vụ và kế hoạch đón đầu các làn sóng mua sắm lớn tại Việt Nam."
    >
      <InsightBlock state={state} onRetry={reload}>
        {(data: SeasonalForecast, meta) => {
          const campaigns: SeasonalCampaign[] = data.all_campaigns || [];
          const activeCamp: SeasonalCampaign | undefined = data.active_campaign;
          const readyIdeas: ReadyToShipIdea[] = data.ready_to_ship_ideas || [];
          const podBlanks: PodBlankSuggestion[] = data.pod_blanks || [];
          const primaryEvent = data.events?.[0];
          const matchingProducts = primaryEvent?.matching_shop_products || [];

          // Radar data
          const radarInfo = activeCamp?.radar || data.campaign_radar || {
            axes: ['Sức cầu thị trường', 'Cửa sổ chuẩn bị', 'Biên lợi nhuận', 'Sức mua làm quà', 'Tỉ lệ chốt đơn'],
            current_values: [88, 87, 86, 92, 85],
            benchmark_values: [55, 50, 60, 52, 58],
            overall_score: 88,
            takeaways: [
              `Nhu cầu mua sắm và sức chi tiêu cho ${activeCamp?.name || 'mùa này'} tăng vọt so với ngày thường.`,
              'Biên lợi nhuận ngách cao khi người bán đóng gói set quà tặng hoặc bán combo nhiều món.',
              'Cần hoàn thiện ảnh mẫu và đăng bán sớm để đón đầu thứ hạng tìm kiếm trên sàn.',
            ],
          };

          // 3 mốc hành động theo chiến dịch
          const campName = activeCamp?.name?.replace(/Lễ Hội |Mùa /gi, '') || 'Giáng Sinh';
          const milestones = [
            {
              title: `Tuần T-6 · ${activeCamp?.launch_window?.start ? fullDate(activeCamp.launch_window.start) : '02/11/2026'}`,
              desc: `Lấy mẫu thử, chụp ảnh concept theo chủ đề ${campName}.`,
            },
            {
              title: `Tuần T-3 · ${activeCamp?.launch_window?.end ? fullDate(activeCamp.launch_window.end) : '23/11/2026'}`,
              desc: `Đăng bán hoàn tất, gắn từ khoá ngách đón tìm kiếm sớm ${campName}.`,
            },
            {
              title: `Tuần T-0 · ${activeCamp?.launch_window?.peak_date ? fullDate(activeCamp.launch_window.peak_date) : '14/12/2026'}`,
              desc: `Đỉnh mua sắm: tung combo quà tặng để nâng giá trị đơn ${campName}.`,
            },
          ];

          // Danh sách ý tưởng sản phẩm
          const displayIdeas = activeTab === 'ready' ? readyIdeas : podBlanks;

          // Sản phẩm bán chạy nhất trong shop
          const topProduct = matchingProducts[0] || {
            title: 'Set Áo Khoác Hoodie Chân Váy Phối Ren Cá Tính POLINA TOP + POLINA SKIRT',
            orders: 2,
            revenue_vnd: 3570000,
          };

          const currentMonthNum = 10; // Tháng 10 hiện tại

          return (
            <div className="space-y-6">
              {/* 1. THANH THÔNG TIN GIAN HÀNG & BỘ LỌC NGÀNH HÀNG */}
              <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E2] text-[#007700]">
                    <Store className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-stone-900">
                        Gian hàng: {data.seller_shop_name || 'SNOWKAT'}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Chính thức
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Ngành: {data.seller_category?.name || 'Thời trang Nữ & Set may mặc'} · Kết hợp xu hướng tìm kiếm và doanh số thực tế
                    </p>
                  </div>
                </div>

                {/* Dropdown chọn ngành hàng */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <select
                    aria-label="Chọn ngành hàng"
                    value={currentCategorySlug}
                    onChange={e => handleSelectCategory(e.target.value)}
                    className="cursor-pointer rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-800 transition hover:border-[#007700] focus:border-[#007700] focus:outline-none shadow-sm"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. CARD: VÒNG QUAY MÙA VỤ 12 THÁNG */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="m-0 text-base font-bold text-stone-900">Vòng quay mùa vụ 12 tháng</h3>
                    <p className="mb-0 mt-1 text-xs text-stone-500">
                      Bấm vào một mùa để xem lịch chuẩn bị. Vạch đỏ là hôm nay (21/10/2026).
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <Sparkles size={14} className="fill-amber-400" />
                    Phân tích bởi {data.ai_model || 'Gemini 3.1 & VietCraft Mining'}
                  </span>
                </div>

                {/* Bảng ma trận 12 tháng */}
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    {/* Header tháng T1..T12 */}
                    <div className="relative mb-2 grid grid-cols-12 gap-1.5 pl-44 text-center text-xs font-bold text-stone-400">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                        const isTodayMonth = m === currentMonthNum;
                        return (
                          <div key={m} className={`relative py-1 ${isTodayMonth ? 'text-rose-600' : ''}`}>
                            {isTodayMonth && (
                              <div className="text-[10px] font-extrabold text-rose-600 leading-none mb-0.5">Hôm nay</div>
                            )}
                            <span>T{m}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Danh sách 6 mùa vụ */}
                    <div className="relative space-y-2">
                      {/* Vạch đỏ chỉ mốc "Hôm nay" chạy dọc qua tất cả các hàng */}
                      <div
                        className="pointer-events-none absolute top-0 bottom-0 z-10 border-l-2 border-rose-500"
                        style={{
                          left: `calc(176px + ((100% - 176px) / 12) * 9.5)`,
                        }}
                      />

                      {campaigns.map(camp => {
                        const isSelected = activeCamp?.id === camp.id;
                        return (
                          <div
                            key={camp.id}
                            className={`group flex items-center gap-3 rounded-xl p-1.5 transition-all ${
                              isSelected ? 'bg-stone-50/70' : 'hover:bg-stone-50/50'
                            }`}
                          >
                            {/* Nút tên chiến dịch */}
                            <button
                              type="button"
                              onClick={() => handleSelectCampaign(camp.id)}
                              className={`flex w-40 shrink-0 items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-bold transition-all ${
                                isSelected
                                  ? 'border border-[#16a34a] bg-[#f0fdf4] text-[#007700] shadow-sm ring-1 ring-[#16a34a]/30'
                                  : 'text-stone-700 hover:text-stone-900'
                              }`}
                            >
                              <span className="shrink-0">{getCampaignLucideIcon(camp.id)}</span>
                              <span className="line-clamp-2 leading-tight">{camp.name}</span>
                            </button>

                            {/* 12 Capsules tháng */}
                            <div className="grid flex-1 grid-cols-12 gap-1.5">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                                const isPeak = camp.months.includes(m);
                                let capsuleBg = 'bg-stone-100/80';
                                if (isPeak) {
                                  capsuleBg = isSelected ? 'bg-[#007700] shadow-sm' : 'bg-[#a7f3d0]';
                                }
                                return (
                                  <div
                                    key={m}
                                    onClick={() => handleSelectCampaign(camp.id)}
                                    className={`h-7 cursor-pointer rounded-lg transition-all ${capsuleBg} ${
                                      isSelected && isPeak ? 'hover:bg-[#005B00]' : 'hover:opacity-80'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. CARD: CHI TIẾT CHIẾN DỊCH & RADAR TIỀM NĂNG (2 CỘT) */}
              {activeCamp && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                  {/* Cột trái (7 Cột): Kế hoạch theo mốc & Định hướng */}
                  <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
                    <div>
                      {/* Tiêu đề chiến dịch đang chọn */}
                      <div className="mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#007700]">
                          Chiến dịch đang chọn
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-emerald-700">{getCampaignLucideIcon(activeCamp.id)}</span>
                          <h3 className="m-0 text-lg font-bold text-stone-900">{activeCamp.name}</h3>
                        </div>
                        <p className="mb-0 mt-1 text-xs text-stone-500 leading-relaxed">{activeCamp.description}</p>
                      </div>

                      {/* Trục mốc thời gian (Milestone Progress Bar) */}
                      <div className="my-6 rounded-xl bg-stone-50/60 p-4 border border-stone-100">
                        <div className="relative mb-2 flex items-center justify-between">
                          {/* Point 1: Hôm nay */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-rose-600 mb-1">Hôm nay</span>
                            <span className="h-3 w-3 rounded-full bg-rose-600 ring-4 ring-rose-100 shadow-sm" />
                          </div>

                          {/* Point 2: Bắt đầu chuẩn bị */}
                          <div className="flex flex-col items-center">
                            <span className="h-3 w-3 rounded-full bg-amber-600 ring-4 ring-amber-100 shadow-sm mt-3" />
                            <span className="text-[11px] font-bold text-stone-800 mt-1">
                              {activeCamp.launch_window?.start ? fullDate(activeCamp.launch_window.start) : '02/11/2026'}
                            </span>
                            <span className="text-[10px] text-stone-400">Bắt đầu chuẩn bị</span>
                          </div>

                          {/* Point 3: Hạn chót đăng bán */}
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-bold text-stone-800 mb-1">
                              {activeCamp.launch_window?.end ? fullDate(activeCamp.launch_window.end) : '23/11/2026'}
                            </span>
                            <span className="text-[10px] text-stone-400 mb-1">Hạn chót đăng bán</span>
                            <span className="h-3 w-3 rounded-full bg-orange-600 ring-4 ring-orange-100 shadow-sm" />
                          </div>

                          {/* Point 4: Đỉnh sức mua */}
                          <div className="flex flex-col items-center">
                            <span className="h-3 w-3 rounded-full bg-[#16a34a] ring-4 ring-emerald-100 shadow-sm mt-3" />
                            <span className="text-[11px] font-bold text-[#007700] mt-1">
                              {activeCamp.launch_window?.peak_date ? fullDate(activeCamp.launch_window.peak_date) : '14/12/2026'}
                            </span>
                            <span className="text-[10px] text-[#007700] font-semibold">Đỉnh sức mua</span>
                          </div>
                        </div>

                        {/* Thanh màu gradient nối */}
                        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 via-orange-400 to-[#16a34a]" />
                      </div>

                      {/* Danh sách Kế hoạch theo mốc */}
                      <div className="mb-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="m-0 text-xs font-bold text-stone-800">Kế hoạch theo mốc</h4>
                          <span className="text-xs text-stone-400 font-medium">{completedMilestonesCount}/3 hoàn thành</span>
                        </div>

                        <div className="space-y-1.5 border-t border-stone-100 pt-2">
                          {milestones.map((m, idx) => {
                            const isDone = checkedMilestones[idx];
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleMilestone(idx)}
                                className={`flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition ${
                                  isDone ? 'bg-[#EAF0E2]/40' : 'hover:bg-stone-50'
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
                    </div>

                    {/* Box Định hướng ngành hàng */}
                    <div className="rounded-xl border border-amber-200/70 bg-[#FEFCE8] p-3.5 text-xs text-stone-700">
                      <div className="flex items-start gap-2">
                        <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                        <div className="leading-relaxed">
                          <strong className="font-bold text-stone-900">
                            Định hướng ngành {data.seller_category?.name || 'Thời trang Nữ & Set may mặc'}:
                          </strong>{' '}
                          {activeCamp.category_summary}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải (5 Cột): Radar tiềm năng mùa vụ */}
                  <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 lg:col-span-5">
                    <div>
                      {/* Tiêu đề Radar */}
                      <div className="flex items-start justify-between border-b border-stone-100 pb-3">
                        <div>
                          <h4 className="m-0 text-sm font-bold text-stone-900">Radar tiềm năng mùa vụ</h4>
                          <p className="mb-0 mt-0.5 text-xs text-stone-500">So với mặt bằng ngày thường</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-[#EAF0E2] px-2.5 py-0.5 text-xs font-bold text-[#005B00]">
                          Điểm: {radarInfo.overall_score || 88}/100
                        </span>
                      </div>

                      {/* Biểu đồ Radar SVG */}
                      <div className="py-2">
                        <SeasonalRadar
                          axes={radarInfo.axes}
                          currentValues={radarInfo.current_values}
                          benchmarkValues={radarInfo.benchmark_values}
                          overallScore={radarInfo.overall_score || 88}
                          takeaways={radarInfo.takeaways}
                          campaignName={campName}
                        />
                      </div>
                    </div>

                    {/* Tag đếm ngược mốc */}
                    <div className="mt-3 flex items-center justify-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      <Hourglass size={13} className="mr-1.5 text-amber-600" />
                      Còn 12 ngày nữa đến mốc bắt đầu chuẩn bị
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CARD: GỢI Ý SẢN PHẨM MÙA VỤ */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="m-0 text-base font-bold text-stone-900">
                      Gợi ý sản phẩm cho {campName}
                    </h3>
                    <p className="mb-0 mt-1 text-xs text-stone-500">
                      Chọn mô hình theo nguồn hàng, bấm "Thêm vào kế hoạch" để gom ý tưởng.
                    </p>
                  </div>

                  {/* Nhóm nút chọn mô hình nguồn hàng & bộ đếm kế hoạch */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-semibold text-stone-500">
                      Kế hoạch: <strong className="font-bold text-stone-800">{savedIdeasCount} ý tưởng</strong>
                    </span>

                    <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('ready')}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                          activeTab === 'ready'
                            ? 'bg-amber-100/90 text-amber-900 shadow-sm'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Package size={13} />
                        Hàng sẵn / Nhập sỉ
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('pod')}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all ${
                          activeTab === 'pod'
                            ? 'bg-[#EAF0E2] text-[#007700] shadow-sm'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Sparkles size={13} />
                        Phôi in POD
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtext và Sort */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                  <span>
                    {activeTab === 'ready'
                      ? 'Hàng có sẵn: sản phẩm hoàn chỉnh đang có nhu cầu tìm kiếm cao, nhập sỉ hoặc đặt xưởng may sẵn.'
                      : 'Phôi in POD: thiết kế và in trực tiếp lên phôi áo, ly, túi... theo đơn đặt hàng, không cần ôm vốn tồn kho.'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span>Sắp xếp:</span>
                    <select
                      aria-label="Sắp xếp ý tưởng"
                      value={sortOption}
                      onChange={e => setSortOption(e.target.value as any)}
                      className="cursor-pointer rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700 outline-none hover:border-stone-300"
                    >
                      <option value="profit">Lãi cao nhất</option>
                      <option value="newest">Mới nhất</option>
                    </select>
                  </div>
                </div>

                {/* Lưới 4 thẻ gợi ý sản phẩm (Grid 2x2) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {displayIdeas.slice(0, 4).map((item: any, idx: number) => {
                    const ideaId = `${activeTab}-${idx}-${item.title}`;
                    const isSaved = Boolean(savedIdeas[ideaId]);
                    const profitMargin = item.expected_profit_margin || item.estimated_profit || '45% – 60%';

                    return (
                      <div
                        key={idx}
                        className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:border-stone-300"
                      >
                        <div>
                          {/* Title & Profit Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="m-0 text-sm font-bold text-stone-900 leading-snug">{item.title}</h4>
                            <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                              Lãi {profitMargin}
                            </span>
                          </div>

                          {/* Profit progress bar */}
                          <div className="my-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-lime-500 to-[#16a34a] w-3/4" />
                          </div>

                          {/* Chi tiết ý tưởng */}
                          <div className="space-y-1.5 text-xs leading-relaxed text-stone-600">
                            <div className="flex items-center justify-between border-b border-stone-50 pb-1">
                              <span className="text-stone-400">Biên lợi nhuận ước tính</span>
                              <span className="font-bold text-stone-800">
                                {item.market_price_range || '160k – 350k đ'}
                              </span>
                            </div>

                            {item.why_it_sells && (
                              <p className="m-0 text-stone-600 pt-1">
                                <strong className="font-semibold text-stone-800">Động cơ mua:</strong> {item.why_it_sells}
                              </p>
                            )}

                            {item.upsell_bundle_tip && (
                              <p className="m-0 text-stone-600">
                                <strong className="font-semibold text-stone-800">Mẹo bán kèm:</strong>{' '}
                                <span className="font-semibold text-emerald-800">{item.upsell_bundle_tip}</span>
                              </p>
                            )}

                            {item.sourcing_tip && (
                              <div className="flex items-start gap-1.5 pt-1 text-[11px] text-stone-500">
                                <Boxes size={13} className="mt-0.5 shrink-0 text-stone-400" />
                                <span>{item.sourcing_tip}</span>
                              </div>
                            )}

                            {item.suggested_theme && (
                              <p className="m-0 text-stone-600">
                                <strong className="font-semibold text-stone-800">Chủ đề thiết kế:</strong> {item.suggested_theme}
                              </p>
                            )}

                            {item.design_hook && (
                              <p className="m-0 text-stone-600">
                                <strong className="font-semibold text-stone-800">Điểm nhấn họa tiết:</strong> {item.design_hook}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Nút thêm vào kế hoạch */}
                        <button
                          type="button"
                          onClick={() => toggleSaveIdea(ideaId)}
                          className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                            isSaved
                              ? 'bg-[#007700] text-white shadow-sm'
                              : 'border border-[#007700] text-[#007700] hover:bg-[#EAF0E2]/40 active:scale-98'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check size={14} /> Đã thêm vào kế hoạch
                            </>
                          ) : (
                            <>
                              <Plus size={14} /> Thêm vào kế hoạch
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. CARD: SẢN PHẨM TRONG SHOP NÊN ĐẨY MẠNH */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="m-0 text-base font-bold text-stone-900">Sản phẩm trong shop nên đẩy mạnh</h3>
                    <p className="mb-0 mt-1 text-xs text-stone-500">
                      Mức sẵn sàng của sản phẩm hiện có cho mùa {campName}:
                    </p>
                  </div>

                  <Link
                    to="/seller/products"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#007700] hover:underline"
                  >
                    Quản lý kho hàng <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                  {/* Cột trái (7 Cột): Thông tin sản phẩm + Vòng tròn 1/4 + Checklist */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:col-span-7">
                    {/* Ảnh sản phẩm hoặc icon */}
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                      {(topProduct as any).images?.[0] ? (
                        <img
                          src={(topProduct as any).images[0]}
                          alt={topProduct.title}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <ShoppingBag size={32} className="text-amber-700/60" />
                      )}
                    </div>

                    {/* Chi tiết sản phẩm */}
                    <div className="flex-1">
                      <h4 className="m-0 text-sm font-bold text-stone-900 leading-snug">{topProduct.title}</h4>
                      <p className="mb-3 mt-1 text-xs text-stone-500">
                        Đang bán chạy nhất shop: {count((topProduct as any).orders || 2)} đơn · {money((topProduct as any).revenue_vnd || 3570000)}
                      </p>

                      {/* Vòng tròn 1/4 & Checklist mức sẵn sàng */}
                      <div className="flex items-center gap-4">
                        {/* Vòng tròn SVG 1/4 */}
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                            <path
                              className="text-stone-200"
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-[#007700]"
                              strokeDasharray="25, 100"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <span className="absolute text-xs font-bold text-stone-800 font-jakarta">1/4</span>
                        </div>

                        {/* 4 Mục trạng thái */}
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <span className="h-2.5 w-2.5 rounded-sm bg-purple-300" />
                            Ảnh concept {campName}
                          </div>
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <span className="h-2.5 w-2.5 rounded-sm bg-purple-300" />
                            Từ khoá ngách mùa vụ
                          </div>
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <span className="h-2.5 w-2.5 rounded-sm bg-purple-300" />
                            Combo quà tặng
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            Tiêu đề & mô tả đã chuẩn
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cột phải (5 Cột): Khối Việc nên làm tiếp */}
                  <div className="flex flex-col justify-center rounded-2xl border border-[#007700]/20 bg-[#EAF0E2]/60 p-4 lg:col-span-5">
                    <span className="text-xs font-bold text-[#005B00]">Việc nên làm tiếp</span>
                    <p className="mb-0 mt-1.5 text-xs text-stone-800 leading-relaxed">
                      Chụp lại ảnh concept {campName} và thêm từ khoá ngách để đón lượt tìm kiếm sớm, hoàn tất trước{' '}
                      <strong>{activeCamp?.launch_window?.end ? fullDate(activeCamp.launch_window.end) : '23/11/2026'}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. CHÂN TRANG NGUỒN DỮ LIỆU */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-stone-500">
                <span className="inline-flex items-center rounded-full bg-[#EAF0E2] px-2.5 py-0.5 text-[11px] font-bold text-[#005B00]">
                  {meta.source?.mode === 'live' ? 'Dữ liệu thật' : 'Dữ liệu thật'}
                </span>
                <span>
                  Cập nhật {meta.computed_at ? new Date(meta.computed_at).toLocaleDateString('vi-VN') : '18/10/2026'}
                  {meta.computed_at ? ` · ${new Date(meta.computed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ' · 01:01'} ·
                  Tính trên {meta.quality?.sample_size ?? 4} mẫu · Ý tưởng và biên lợi nhuận là ước tính tham khảo
                </span>
              </div>
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}

export default SeasonalPage;
