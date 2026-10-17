/**
 * F38 "Mùa vụ và lịch ra hàng" — Trợ lý chiến lược mùa vụ & sản phẩm thông minh cho Seller.
 * Thiết kế hài hòa, tinh gọn, đúng chuẩn Design System của VietCraft:
 * - Không nhồi nhét quá tải thông tin, không khoảng trống thừa.
 * - Biểu đồ Radar so sánh tiềm năng mùa vụ cân đối, trực quan.
 * - Gợi ý sản phẩm thuyết phục, dễ đọc, dễ hành động.
 */

import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Filter,
  Package,
  Palette,
  Store,
  ShoppingBag,
  Flame,
  CheckCircle2,
  Clock,
  ChevronRight,
  Lightbulb,
  Snowflake,
  Ghost,
  Heart,
  Sun,
  Backpack,
  Gift,
  Calendar,
  Zap
} from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { SourceFooter } from '../components/SourceFooter';
import { InsightCard, Note } from '../components/ui';
import { RadarCompare } from '../components/charts/RadarCompare';
import { useInsight } from '../hooks/useInsight';
import { count } from '../../../shared/utils/format';
import type { SeasonalForecast, SeasonalCampaign, PodBlankSuggestion, ReadyToShipIdea } from '../types';

const CATEGORY_OPTIONS = [
  { value: 'thoi-trang', label: 'Thời trang & May mặc' },
  { value: 'gia-dung', label: 'Gia dụng & Đồ uống' },
  { value: 'phu-kien', label: 'Phụ kiện & Túi' },
  { value: 'trang-tri', label: 'Trang trí nhà cửa' },
];

function getCampaignIcon(iconName: string) {
  switch (iconName) {
    case 'ghost':
      return <Ghost className="h-4 w-4 text-purple-600" />;
    case 'snowflake':
      return <Snowflake className="h-4 w-4 text-blue-600" />;
    case 'sparkles':
      return <Sparkles className="h-4 w-4 text-amber-500" />;
    case 'heart':
      return <Heart className="h-4 w-4 text-rose-500" />;
    case 'sun':
      return <Sun className="h-4 w-4 text-orange-500" />;
    case 'backpack':
      return <Backpack className="h-4 w-4 text-emerald-600" />;
    default:
      return <Gift className="h-4 w-4 text-[#007700]" />;
  }
}

export function SeasonalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCampaignId = searchParams.get('campaign') || '';
  const currentCategorySlug = searchParams.get('category') || 'thoi-trang';

  const [activeTab, setActiveTab] = useState<'ready' | 'pod'>('ready');

  // Gọi API lấy dữ liệu mùa vụ
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

          // Dữ liệu Radar so sánh cơ hội chiến lược
          const radarInfo = activeCamp?.radar || data.campaign_radar || {
            axes: ['Sức cầu thị trường', 'Cửa sổ chuẩn bị', 'Biên lợi nhuận', 'Sức mua làm quà', 'Tỉ lệ chốt đơn'],
            current_values: [94, 88, 90, 92, 90],
            benchmark_values: [60, 50, 65, 52, 60],
            overall_score: 91,
            takeaways: [
              `Nhu cầu mua sắm và sức chi tiêu cho ${activeCamp?.name || 'mùa này'} tăng vọt so với ngày thường.`,
              'Biên lợi nhuận ngách cao khi người bán đóng gói set quà tặng hoặc bán combo nhiều món.',
              'Cần hoàn thiện ảnh mẫu và đăng bán sớm để đón đầu thứ hạng tìm kiếm trên sàn.'
            ]
          };

          return (
            <div className="space-y-6">
              {/* 1. THANH ĐIỀU HƯỚNG SHOP & NGÀNH HÀNG: Nhẹ nhàng, đồng bộ giao diện VietCraft */}
              <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E2] text-[#007700]">
                    <Store className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-stone-900">
                        Gian hàng: {data.seller_shop_name || 'Của bạn'}
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Chính thức
                      </span>
                      <span className="text-xs text-stone-500">
                        Ngành: <strong>{data.seller_category?.name || 'Thời trang & May mặc'}</strong>
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-500">
                      Số liệu kết hợp xu hướng tìm kiếm người tiêu dùng Việt Nam và doanh số thực tế trên sàn.
                    </p>
                  </div>
                </div>

                {/* Bộ lọc ngành hàng */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Filter className="h-3.5 w-3.5 text-stone-400" />
                  <select
                    value={currentCategorySlug}
                    onChange={e => handleSelectCategory(e.target.value)}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 transition hover:border-[#007700] focus:border-[#007700] focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. CHỌN MÙA VỤ: 6 Thẻ Mùa Cao Điểm Trong Năm */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-700">
                    Chọn một mùa vụ bên dưới để xem phân tích chi tiết:
                  </div>
                  {data.ai_model && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                      <Sparkles className="h-3 w-3 text-amber-500" /> Phân tích bởi {data.ai_model}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  {campaigns.map(camp => {
                    const isSelected = activeCamp?.id === camp.id;
                    const isGoldTime = camp.timing?.status === 'active';
                    const isUpcoming = camp.timing?.status === 'upcoming';

                    return (
                      <button
                        key={camp.id}
                        type="button"
                        onClick={() => handleSelectCampaign(camp.id)}
                        className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-[#007700] bg-[#EAF0E2]/40 shadow-sm ring-2 ring-[#007700]/20'
                            : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100">
                              {getCampaignIcon(camp.icon)}
                            </div>
                            {isGoldTime ? (
                              <span className="flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-200">
                                <Flame className="h-2.5 w-2.5 fill-rose-600 text-rose-600" /> Vàng
                              </span>
                            ) : isUpcoming && camp.timing.days_diff <= 35 ? (
                              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                {camp.timing.days_diff}d
                              </span>
                            ) : null}
                          </div>

                          <h4 className={`mt-2 text-xs font-bold ${isSelected ? 'text-[#007700]' : 'text-stone-800'}`}>
                            {camp.name}
                          </h4>
                        </div>

                        <div className="mt-2 text-[10px] font-medium text-stone-400">
                          {camp.months.map(m => `T${m}`).join(', ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CHI TIẾT CHIẾN DỊCH & RADAR MA TRẬN: Bố cục cân xứng, không có khoảng trống */}
              {activeCamp && (
                <InsightCard
                  title={`Chiến dịch: ${activeCamp.name}`}
                  description={activeCamp.description}
                  action={
                    activeCamp.timing.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                        <Flame className="h-3.5 w-3.5 fill-rose-600 text-rose-600" /> Đang là thời điểm vàng chuẩn bị
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                        <Clock className="h-3.5 w-3.5 text-stone-500" /> {activeCamp.timing.label}
                      </span>
                    )
                  }
                >
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                    {/* Cột trái (7 Cột): Cửa sổ thời gian & Định hướng */}
                    <div className="space-y-4 lg:col-span-7">
                      {/* 3 Mốc thời gian ra hàng chuẩn */}
                      <div>
                        <div className="mb-2 text-xs font-bold text-stone-600">
                          Cửa sổ ra hàng và chuẩn bị:
                        </div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500">
                              <Calendar className="h-3 w-3" /> Bắt đầu chuẩn bị
                            </div>
                            <div className="mt-1 text-sm font-bold text-stone-800">
                              {activeCamp.launch_window.start}
                            </div>
                            <div className="text-[10px] text-stone-400">Lùi 42 ngày trước đỉnh</div>
                          </div>

                          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                              <Clock className="h-3 w-3" /> Hạn chót đăng bán
                            </div>
                            <div className="mt-1 text-sm font-bold text-amber-900">
                              {activeCamp.launch_window.end}
                            </div>
                            <div className="text-[10px] text-amber-700/80">Lùi 21 ngày sản xuất</div>
                          </div>

                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                              <Zap className="h-3 w-3 fill-emerald-600 text-emerald-600" /> Đỉnh điểm sức mua
                            </div>
                            <div className="mt-1 text-sm font-bold text-[#007700]">
                              {activeCamp.launch_window.peak_date}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-semibold">{activeCamp.launch_window.peak_week}</div>
                          </div>
                        </div>
                      </div>

                      {/* Lời khuyên định hướng ngành hàng */}
                      <div className="rounded-xl border border-stone-100 bg-stone-50 p-3.5 text-xs text-stone-700">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <div className="leading-relaxed">
                            <strong className="text-stone-900 font-semibold">
                              Định hướng cho ngành {data.seller_category?.name || 'Thời trang'}:
                            </strong>{' '}
                            {activeCamp.category_summary}
                          </div>
                        </div>
                      </div>

                      {/* 3 Bước hành động tinh gọn */}
                      <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-xs space-y-1.5">
                        <div className="font-bold text-stone-800 text-[11px] uppercase tracking-wide">
                          Khuyến nghị thực thi theo mốc:
                        </div>
                        <ul className="pl-4 list-disc space-y-1 text-stone-600 leading-relaxed">
                          <li><strong>Tuần T-6:</strong> Lấy mẫu thử, chụp ảnh concept theo chủ đề {activeCamp.name}.</li>
                          <li><strong>Tuần T-3:</strong> Đăng bán hoàn tất trên sàn, gắn từ khóa ngách đón tìm kiếm sớm.</li>
                          <li><strong>Tuần T-0:</strong> Đỉnh điểm mua sắm, tung ưu đãi combo quà tặng để x2 giá trị đơn hàng.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Cột phải (5 Cột): BIỂU ĐỒ RADAR MA TRẬN TIỀM NĂNG */}
                    <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-4 lg:col-span-5">
                      <div className="flex items-center justify-between border-b border-stone-200/70 pb-2">
                        <div>
                          <div className="text-xs font-bold text-stone-800">
                            Radar Tiềm Năng Mùa Vụ
                          </div>
                          <div className="text-[11px] text-stone-500">
                            So sánh với mặt bằng ngày thường
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          Điểm: {radarInfo.overall_score ?? 90}/100
                        </span>
                      </div>

                      {/* Biểu đồ Radar */}
                      <div className="mt-1">
                        <RadarCompare
                          axes={radarInfo.axes}
                          series={[
                            {
                              name: activeCamp.name,
                              values: radarInfo.current_values,
                              color: '#007700',
                              primary: true,
                            },
                            {
                              name: 'Ngày thường',
                              values: radarInfo.benchmark_values,
                              color: '#94a3b8',
                              primary: false,
                            },
                          ]}
                          height={230}
                        />
                      </div>

                      {/* Nhận định ngắn gọn từ Radar */}
                      <div className="mt-2 text-[11px] text-stone-600 space-y-1 border-t border-stone-200/70 pt-2 leading-relaxed">
                        {(radarInfo.takeaways || []).slice(0, 2).map((t: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-700 font-bold">•</span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </InsightCard>
              )}

              {/* 4. GỢI Ý SẢN PHẨM: 2 TABS TINH GỌN, DỄ ĐỌC */}
              <InsightCard
                title={`Gợi ý sản phẩm cho ${activeCamp?.name || 'mùa vụ này'}`}
                description="Chọn mô hình kinh doanh phù hợp với nguồn hàng của gian hàng:"
                action={
                  <div className="inline-flex rounded-xl border border-stone-200 bg-stone-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ready')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        activeTab === 'ready'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Package className="h-3.5 w-3.5 text-[#007700]" />
                      Hàng sẵn / Nhập sỉ ({readyIdeas.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pod')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        activeTab === 'pod'
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Palette className="h-3.5 w-3.5 text-purple-600" />
                      Phôi in POD ({podBlanks.length})
                    </button>
                  </div>
                }
              >
                {/* TAB 1: SẢN PHẨM CÓ SẴN / NHẬP SỈ */}
                {activeTab === 'ready' && (
                  <div className="space-y-4">
                    <Note>
                      <strong>Hàng có sẵn:</strong> Các sản phẩm hoàn chỉnh đang có nhu cầu tìm kiếm cao trên sàn. Nhập sỉ hoặc đặt xưởng may sẵn để bán trực tiếp mà không cần thiết kế in ấn.
                    </Note>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {readyIdeas.map((idea, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-[#007700]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                                {idea.category}
                              </span>
                              <h4 className="mt-1.5 text-sm font-bold text-stone-900 leading-snug">
                                {idea.title}
                              </h4>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                Lãi: {idea.expected_profit_margin || '45% - 55%'}
                              </span>
                              <div className="mt-0.5 text-xs font-bold text-stone-700">
                                {idea.market_price_range}
                              </div>
                            </div>
                          </div>

                          {/* Lý do bán chạy & mẹo bán kèm súc tích */}
                          <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-stone-600">
                            {idea.why_it_sells && (
                              <p className="m-0">
                                <strong className="text-stone-800">Động cơ mua:</strong> {idea.why_it_sells}
                              </p>
                            )}
                            {idea.upsell_bundle_tip && (
                              <p className="m-0 text-emerald-900">
                                <strong>Mẹo bán kèm:</strong> {idea.upsell_bundle_tip}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 border-t border-stone-100 pt-2 text-[11px] text-stone-500">
                            <span>Nguồn hàng: {idea.sourcing_tip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: PHÔI IN POD */}
                {activeTab === 'pod' && (
                  <div className="space-y-4">
                    <Note>
                      <strong>In theo yêu cầu (POD):</strong> Kết nối trực tiếp với xưởng in liên kết trên VietCraft. Bạn chỉ cần tải mẫu thiết kế lên phôi, xưởng sẽ tự in và giao hàng khi có đơn.
                    </Note>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {podBlanks.map((pod, idx) => {
                        const mb = pod.matched_blank;
                        const createUrl = mb?._id
                          ? `/seller/products/new?blankId=${encodeURIComponent(mb._id)}&title=${encodeURIComponent(pod.title)}`
                          : `/seller/products/new?title=${encodeURIComponent(pod.title)}`;

                        return (
                          <div
                            key={idx}
                            className="flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-purple-300"
                          >
                            <div className="flex items-center justify-between">
                              <span className="rounded bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                                Phôi: {pod.blank_type}
                              </span>
                              {pod.estimated_profit && (
                                <span className="text-xs font-bold text-emerald-800">
                                  Lãi: {pod.estimated_profit}
                                </span>
                              )}
                            </div>

                            <div className="mt-2.5 flex items-start gap-3">
                              {mb?.default_image ? (
                                <img
                                  src={mb.default_image}
                                  alt={pod.title}
                                  className="h-16 w-16 shrink-0 rounded-xl border border-stone-100 object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-400">
                                  <Palette className="h-6 w-6" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-stone-900 leading-snug">
                                  {pod.title}
                                </h4>
                                <p className="mt-0.5 text-xs text-stone-500">
                                  Xưởng: {mb?.printer_name || 'Xưởng in liên kết VietCraft'}
                                </p>
                                {pod.color_palette && (
                                  <p className="mt-0.5 text-[11px] text-stone-500">
                                    Màu mốt: {pod.color_palette}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-2.5 rounded-xl bg-purple-50/50 p-2.5 text-xs text-purple-950">
                              <strong>Ý tưởng in:</strong> {pod.suggested_theme}
                              {pod.design_hook && (
                                <div className="mt-1 text-[11px] text-purple-900 font-medium">
                                  💡 Gợi ý thiết kế: {pod.design_hook}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5">
                              <span className="text-xs text-stone-500">
                                Giá phôi: <strong className="text-stone-800">{mb?.base_cost ? `${count(mb.base_cost)} đ` : 'Xem chi tiết'}</strong>
                              </span>

                              <Link
                                to={createUrl}
                                className="inline-flex items-center gap-1 rounded-xl bg-[#007700] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                              >
                                <Palette className="h-3.5 w-3.5" />
                                Thiết kế trên phôi
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </InsightCard>

              {/* 5. SẢN PHẨM CỦA SHOP CÓ THỂ ĐẨY MẠNH */}
              <InsightCard
                title="Sản phẩm của gian hàng bạn phù hợp đẩy mạnh"
                description={`Các mặt hàng hiện có trong shop phù hợp với xu hướng mùa ${activeCamp?.name}:`}
                action={
                  <Link
                    to="/seller/products"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#007700] hover:underline"
                  >
                    Quản lý kho hàng <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                {matchingProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {matchingProducts.map((p: any, i: number) => (
                      <div
                        key={p._id || i}
                        className="flex flex-col justify-between rounded-xl border border-stone-200 bg-stone-50/40 p-3 transition hover:border-emerald-400 hover:bg-white"
                      >
                        <div>
                          {p.images?.[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              className="h-28 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-28 w-full items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                              <ShoppingBag className="h-6 w-6" />
                            </div>
                          )}

                          <h5 className="mt-2 line-clamp-2 text-xs font-bold text-stone-900 leading-snug">
                            {p.title}
                          </h5>
                        </div>

                        <div className="mt-2 border-t border-stone-200/60 pt-1.5 text-[11px] text-emerald-800 font-semibold">
                          Gợi ý: Chụp lại ảnh concept {activeCamp?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <ShoppingBag className="h-8 w-8 text-stone-300" />
                    <p className="mt-2 text-xs font-semibold text-stone-700">
                      Chưa có sản phẩm nào trong kho của bạn gắn thẻ mùa {activeCamp?.name}
                    </p>
                    <p className="mt-0.5 max-w-sm text-[11px] text-stone-400">
                      Đăng sản phẩm mới hoặc cập nhật từ khóa ngách cho các sản phẩm hiện có để đón đầu lượt tìm kiếm.
                    </p>
                    <Link
                      to="/seller/products/new"
                      className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-[#007700] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#005B00]"
                    >
                      Đăng sản phẩm đón mùa
                    </Link>
                  </div>
                )}
              </InsightCard>

              {/* Chân trang thông tin nguồn dữ liệu */}
              <SourceFooter meta={meta} limitation={data.limitation} method={data.method} />
            </div>
          );
        }}
      </InsightBlock>
    </InsightPage>
  );
}

export default SeasonalPage;
