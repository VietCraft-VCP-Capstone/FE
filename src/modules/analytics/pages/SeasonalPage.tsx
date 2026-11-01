import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs } from 'antd';
import {
  BarChart3,
  Clock,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { useInsight } from '../hooks/useInsight';
import { PotentialProfileDrawer } from '../components/product/PotentialProfileDrawer';
import { SeasonalHeader } from '../components/seasonal/SeasonalHeader';
import { SeasonalMonthMatrix } from '../components/seasonal/SeasonalMonthMatrix';
import { SeasonalPotentialTab } from '../components/seasonal/SeasonalPotentialTab';
import { SeasonalTimelineTab } from '../components/seasonal/SeasonalTimelineTab';
import { SeasonalTrendsTab } from '../components/seasonal/SeasonalTrendsTab';
import { SeasonalReadinessTab } from '../components/seasonal/SeasonalReadinessTab';
import { SeasonalTrialTab } from '../components/seasonal/SeasonalTrialTab';
import type {
  CampaignRadar,
  PotentialProfile,
  SeasonalCampaign,
  SeasonalForecast,
} from '../types';

export function SeasonalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCampaignId = searchParams.get('campaign') || '';
  const currentCategorySlug = searchParams.get('category') || 'thoi-trang';
  const currentTabParam = searchParams.get('tab') || 'potential';

  const [activeDetailTab, setActiveDetailTab] = useState<string>(currentTabParam);

  // Quản lý trạng thái gom ý tưởng vào kế hoạch
  const [savedIdeas, setSavedIdeas] = useState<Record<string, boolean>>({});

  // Quản lý trạng thái đánh dấu hoàn thành các mốc kế hoạch
  const [checkedMilestones, setCheckedMilestones] = useState<Record<number, boolean>>({});

  // Quản lý mở Drawer hồ sơ tiềm năng 5 lớp & tính hòa vốn
  const [selectedProfile, setSelectedProfile] = useState<PotentialProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleSaveIdea = (key: string) => {
    setSavedIdeas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMilestone = (idx: number) => {
    setCheckedMilestones(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const savedIdeasCount = Object.values(savedIdeas).filter(Boolean).length;

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

  const handleSelectTab = (key: string) => {
    setActiveDetailTab(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
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
          const readyIdeas = data.ready_to_ship_ideas || [];
          const podBlanks = data.pod_blanks || [];
          const primaryEvent = data.events?.[0];
          const matchingProducts = primaryEvent?.matching_shop_products || [];

          // Radar data
          const radarInfo: CampaignRadar = activeCamp?.radar || data.campaign_radar || {
            axes: ['Sức cầu thị trường', 'Cửa sổ chuẩn bị', 'Biên lợi nhuận', 'Sức mua làm quà', 'Tỉ lệ cạnh tranh'],
            current_values: [85, 75, 88, 90, 68],
            benchmark_values: [52, 50, 60, 48, 65],
            overall_score: 81,
            takeaways: [
              `Nhu cầu mua sắm và sức chi tiêu cho ${activeCamp?.name || 'mùa này'} tăng vọt so với ngày thường.`,
              'Biên lợi nhuận ngách cao khi đóng gói set quà tặng hoặc bán combo nhiều món.',
              'Cần hoàn thiện ảnh mẫu và đăng bán sớm để đón đầu thứ hạng tìm kiếm trên sàn.',
            ],
          };

          // Sản phẩm bán chạy nhất trong shop
          const topProduct = matchingProducts[0] || {
            title: 'Set Áo Khoác Hoodie Chân Váy Phối Ren Cá Tính POLINA TOP + POLINA SKIRT',
            orders: 12,
            revenue_vnd: 3570000,
            images: [],
          };

          return (
            <div className="space-y-6">
              {/* 1. THANH THÔNG TIN GIAN HÀNG & HEADER CHIẾN DỊCH */}
              <SeasonalHeader
                shopName={data.seller_shop_name}
                categoryName={data.seller_category?.name}
                categorySlug={currentCategorySlug}
                onSelectCategory={handleSelectCategory}
                activeCamp={activeCamp}
                savedIdeasCount={savedIdeasCount}
              />

              {/* 2. MA TRẬN VÒNG QUAY MÙA VỤ 12 THÁNG */}
              <SeasonalMonthMatrix
                campaigns={campaigns}
                activeCampId={activeCamp?.id}
                onSelectCampaign={handleSelectCampaign}
              />

              {/* 3. 5 TABS CHI TIẾT CHUYÊN SÂU THEO KẾ HOẠCH */}
              {activeCamp && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                  <Tabs
                    activeKey={activeDetailTab}
                    onChange={handleSelectTab}
                    className="seasonal-detail-tabs"
                    items={[
                      {
                        key: 'potential',
                        label: (
                          <span className="flex items-center gap-1.5 font-bold text-xs py-1">
                            <Sparkles size={14} className="text-[#007700]" />
                            <span>1. Hồ sơ tiềm năng 5 lớp &amp; Ý tưởng ({readyIdeas.length + podBlanks.length})</span>
                          </span>
                        ),
                        children: (
                          <SeasonalPotentialTab
                            readyIdeas={readyIdeas}
                            podBlanks={podBlanks}
                            potentialProfiles={data.potential_profiles}
                            savedIdeas={savedIdeas}
                            onToggleSaveIdea={toggleSaveIdea}
                            onOpenProfileDrawer={profile => {
                              setSelectedProfile(profile);
                              setDrawerOpen(true);
                            }}
                          />
                        ),
                      },
                      {
                        key: 'timeline',
                        label: (
                          <span className="flex items-center gap-1.5 font-bold text-xs py-1">
                            <Clock size={14} className="text-amber-600" />
                            <span>2. Chu kỳ 4 pha &amp; Hạn chót nhận đơn</span>
                          </span>
                        ),
                        children: (
                          <SeasonalTimelineTab
                            activeCamp={activeCamp}
                            categoryName={data.seller_category?.name}
                            checkedMilestones={checkedMilestones}
                            onToggleMilestone={toggleMilestone}
                          />
                        ),
                      },
                      {
                        key: 'trends',
                        label: (
                          <span className="flex items-center gap-1.5 font-bold text-xs py-1">
                            <BarChart3 size={14} className="text-blue-600" />
                            <span>3. Phân rã sóng mùa vụ (STL) &amp; Radar</span>
                          </span>
                        ),
                        children: (
                          <SeasonalTrendsTab
                            decomposition={data.decomposition}
                            primaryKeyword={data.primary_keyword}
                            activeCamp={activeCamp}
                            radar={radarInfo}
                          />
                        ),
                      },
                      {
                        key: 'readiness',
                        label: (
                          <span className="flex items-center gap-1.5 font-bold text-xs py-1">
                            <ShoppingBag size={14} className="text-purple-600" />
                            <span>4. Sản phẩm shop &amp; Mức sẵn sàng</span>
                          </span>
                        ),
                        children: (
                          <SeasonalReadinessTab
                            topProduct={topProduct}
                            activeCamp={activeCamp}
                          />
                        ),
                      },
                      {
                        key: 'trial',
                        label: (
                          <span className="flex items-center gap-1.5 font-bold text-xs py-1">
                            <ShieldAlert size={14} className="text-emerald-700" />
                            <span>5. Kế hoạch thử nhỏ 3 nấc &amp; Dừng lỗ</span>
                          </span>
                        ),
                        children: (
                          <SeasonalTrialTab
                            potentialProfiles={data.potential_profiles}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {/* 4. CHÂN TRANG NGUỒN DỮ LIỆU & BẰNG CHỨNG */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-stone-500">
                <span className="inline-flex items-center rounded-full bg-[#EAF0E2] px-2.5 py-0.5 text-[11px] font-bold text-[#005B00]">
                  {meta.source?.mode === 'live' ? 'Dữ liệu sàn thật' : 'Dữ liệu kiểm chứng'}
                </span>
                <span>
                  Cập nhật {meta.computed_at ? new Date(meta.computed_at).toLocaleDateString('vi-VN') : 'Hôm nay'} ·
                  Thuật toán: Phân rã LOESS (STL) Google Trends VN + Lịch mua sắm quốc gia calendar_vn + Kiểm chứng 5 lớp độc lập
                </span>
              </div>
            </div>
          );
        }}
      </InsightBlock>

      {/* Drawer hồ sơ tiềm năng 5 lớp & máy tính hòa vốn động */}
      <PotentialProfileDrawer
        profile={selectedProfile}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </InsightPage>
  );
}

export default SeasonalPage;
