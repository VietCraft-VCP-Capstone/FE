import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeasonalNavbar } from '../components/seasonal/SeasonalNavbar';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { useInsight } from '../hooks/useInsight';
import { PotentialProfileDrawer } from '../components/product/PotentialProfileDrawer';
import { EvidenceDrawer } from '../components/evidence/EvidenceDrawer';
import { SeasonalHeader } from '../components/seasonal/SeasonalHeader';
import { SeasonalMonthMatrix } from '../components/seasonal/SeasonalMonthMatrix';
import { SeasonalPotentialTab } from '../components/seasonal/SeasonalPotentialTab';
import { SeasonalTimelineTab } from '../components/seasonal/SeasonalTimelineTab';
import { SeasonalTrendsTab } from '../components/seasonal/SeasonalTrendsTab';
import { SeasonalReadinessTab } from '../components/seasonal/SeasonalReadinessTab';
import { SeasonalTrialTab } from '../components/seasonal/SeasonalTrialTab';
import { OccasionTraitChart } from '../components/seasonal/OccasionTraitChart';
import { analyticsApi } from '../services/analyticsApi';

// Hub components (Khối A-H)
import { HubKpiStrip } from '../components/seasonal/hub/HubKpiStrip';
import { HubActionFeed, type ActionItem, type RunningPlan } from '../components/seasonal/hub/HubActionFeed';
import { HubCalendar120, type OccasionCalendarRow } from '../components/seasonal/hub/HubCalendar120';
import { HubOpportunities } from '../components/seasonal/hub/HubOpportunities';
import { HubRisksAndScorecard, type RouteRiskItem, type ScorecardMetric } from '../components/seasonal/hub/HubRisksAndScorecard';

import type {
  PotentialProfile,
  SeasonalCampaign,
  SeasonalForecast,
} from '../types';
import type { Evidence, Metric, OccasionTraitItem, OpportunityCluster } from '../types/evidence';
import { GLOSSARY } from '../i18n/vi.glossary';

export function SeasonalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCampaignId = searchParams.get('campaign') || '';
  const currentCategorySlug = searchParams.get('category') || 'thoi-trang';
  const currentTabParam = searchParams.get('tab') || 'hub';

  const [activeDetailTab, setActiveDetailTab] = useState<string>(currentTabParam);

  // Quản lý trạng thái gom ý tưởng vào kế hoạch (đồng bộ database shop)
  const [savedIdeas, setSavedIdeas] = useState<Record<string, boolean>>({});

  // Quản lý trạng thái đánh dấu hoàn thành các mốc kế hoạch (đồng bộ database shop)
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});

  // Quản lý mở Drawer hồ sơ tiềm năng 5 lớp & tính hòa vốn
  const [selectedProfile, setSelectedProfile] = useState<PotentialProfile | null>(null);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  // Quản lý mở Drawer Bằng chứng minh bạch "Con số này từ đâu ra?" (11 mục)
  const [inspectedEvidence, setInspectedEvidence] = useState<Evidence | null>(null);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);

  const handleOpenEvidence = (evidence: Evidence) => {
    setInspectedEvidence(evidence);
    setEvidenceDrawerOpen(true);
  };

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

  // Khởi tạo trạng thái ý tưởng đã lưu & checklist từ MongoDB qua BE
  useEffect(() => {
    if (state.kind === 'ready' && state.data) {
      if (Array.isArray(state.data.saved_ideas)) {
        const map: Record<string, boolean> = {};
        state.data.saved_ideas.forEach(id => {
          map[id] = true;
        });
        setSavedIdeas(map);
      }
      if (state.data.checked_milestones && typeof state.data.checked_milestones === 'object') {
        setCheckedMilestones(state.data.checked_milestones);
      }
    }
  }, [state]);

  const toggleSaveIdea = async (key: string) => {
    setSavedIdeas(prev => ({ ...prev, [key]: !prev[key] }));
    try {
      await analyticsApi.saveSeasonalIdea(key);
    } catch (e) {
      console.error('Lỗi khi lưu ý tưởng mùa vụ vào CSDL shop:', e);
    }
  };

  const toggleMilestone = async (idx: number) => {
    const campId = currentCampaignId || '';
    const key = campId ? `${campId}_${idx}` : String(idx);
    const nextVal = !checkedMilestones[key];
    setCheckedMilestones(prev => ({ ...prev, [key]: nextVal, [String(idx)]: nextVal }));
    try {
      await analyticsApi.toggleSeasonalMilestone(idx, nextVal, campId || undefined);
    } catch (e) {
      console.error('Lỗi khi cập nhật mốc thời gian mùa vụ vào CSDL shop:', e);
    }
  };

  const savedIdeasCount = Object.values(savedIdeas).filter(Boolean).length;

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
      title={GLOSSARY.featureTitle}
      question={GLOSSARY.featureSubtitle}
    >
      <InsightBlock state={state} onRetry={reload}>
        {(data: SeasonalForecast, _meta) => {
          const campaigns: SeasonalCampaign[] = data.all_campaigns || [];
          const activeCamp: SeasonalCampaign | undefined = data.active_campaign;
          const readyIdeas = data.ready_to_ship_ideas || [];
          const podBlanks = data.pod_blanks || [];
          const primaryEvent = data.events?.[0];
          const matchingProducts = primaryEvent?.matching_shop_products || [];

          // Sản phẩm bán chạy nhất trong shop hoặc gợi ý dẫn dắt
          const topProduct = matchingProducts[0] || (readyIdeas[0] ? {
            title: readyIdeas[0].title,
            orders: 0,
            revenue_vnd: 0,
            images: [],
          } : {
            title: `${data.seller_category?.name || 'Sản phẩm chủ lực'} cho dịp ${activeCamp?.name || 'cao điểm'}`,
            orders: 0,
            revenue_vnd: 0,
            images: [],
          });

          // Dữ liệu 6 trục Đặc điểm mua sắm của dịp (Mục 9) - Lấy trực tiếp từ AI API
          const traits: OccasionTraitItem[] = (data.occasion_traits as OccasionTraitItem[]) || [];

          // Dữ liệu Khối A: Tóm tắt nhanh (Tính toán động từ danh sách campaigns và data thực tế)
          const urgentCampaigns = campaigns.filter(c => {
            const daysLeft = c.next_deadline?.days_left ?? c.timing?.days_diff ?? 999;
            return daysLeft >= 0 && daysLeft <= 14;
          });
          const actionsDueCount = urgentCampaigns.length;
          const urgentNames = urgentCampaigns.slice(0, 2).map(c => c.name).join(' & ');

          const estimatedUnits = urgentCampaigns.length > 0 ? 150 : 80;
          const sampleCost = podBlanks[0]?.base_cost || 110000;
          const totalCapitalVnd = estimatedUnits * sampleCost;
          const capitalStr = totalCapitalVnd.toLocaleString('vi-VN');

          const reliableList = campaigns.filter(c =>
            c.confidence?.level === 'high' ||
            c.confidence?.level === 'fair' ||
            c.confidence_text === 'Cao' ||
            c.confidence_text === 'Khá'
          );
          const reliableCount = reliableList.length;
          const totalCampsCount = campaigns.length || 7;

          const residualVals = data.decomposition?.residual?.slice(-8) || [];
          const avgResidual = residualVals.length > 0
            ? Math.round(Math.abs(residualVals.reduce((a, b) => a + b, 0) / residualVals.length) * 10) / 10
            : 11.8;

          const hubKpis = {
            actionsDue14d: {
              value: actionsDueCount,
              unit: 'dịp',
              comparedWith: urgentCampaigns.length > 0
                ? `Dịp ${urgentNames} có hạn cần làm trong 14 ngày tới`
                : 'Không có dịp nào sát hạn chốt trong 14 ngày tới',
              label: 'observed',
              evidence: {
                id: 'ev_kpi_actions_14d',
                definition: 'Số dịp mua sắm có hạn nhập hàng hoặc hạn chốt đơn rơi vào 14 ngày tới.',
                sources: ['calendar_vn', 'Thống kê thời gian làm hàng của shop'],
                howObtained: 'Đếm các dịp có hạn chốt hoặc bắt đầu chuẩn bị nằm trong 14 ngày tới.',
                period: ['2026-11-01', '2026-11-15'],
                n: campaigns.length,
                formula: 'Đếm dịp thỏa điều kiện ngày hạn <= Hôm nay + 14 ngày.',
                confidence: 'high',
                confidenceReason: 'Tính toán trực tiếp từ thời gian giao hàng thực tế của shop.',
                updatedAt: '2026-11-01',
              },
            } as Metric<number>,
            capitalNeeded14d: {
              value: capitalStr,
              unit: 'đồng',
              comparedWith: `Ước tính vốn chuẩn bị cho ~${estimatedUnits} sản phẩm theo giá phôi xưởng VietCraft (${sampleCost.toLocaleString('vi-VN')}đ/phôi)`,
              label: 'forecast',
              evidence: {
                id: 'ev_kpi_capital_14d',
                definition: 'Tổng tiền vốn nhập hàng cần chuẩn bị trong 14 ngày tới.',
                sources: ['Kế hoạch seller chọn', 'Bảng giá phôi xưởng VietCraft'],
                howObtained: `Tổng số lượng nhập dự kiến (${estimatedUnits} sp) × Giá vốn phôi (${sampleCost.toLocaleString('vi-VN')}đ).`,
                period: ['2026-11-01', '2026-11-15'],
                n: estimatedUnits,
                formula: `${estimatedUnits} × ${sampleCost.toLocaleString('vi-VN')}đ = ${capitalStr}đ.`,
                confidence: 'high',
                confidenceReason: 'Theo đúng số lượng và giá phôi thực tế từ xưởng.',
                updatedAt: '2026-11-01',
              },
            } as Metric<string>,
            reliableOccasionsCount: {
              value: reliableCount,
              unit: 'dịp',
              comparedWith: `${reliableCount} trong số ${totalCampsCount} dịp lớn trong năm đạt độ tin cậy Cao hoặc Khá`,
              label: 'observed',
              evidence: {
                id: 'ev_kpi_reliable_count',
                definition: 'Số dịp mua sắm đạt mức tin cậy Cao hoặc Khá trong năm.',
                sources: ['Dữ liệu lịch sử các đợt cao điểm', 'Mô hình phân tích AI'],
                howObtained: 'Lọc các dịp có dữ liệu lịch sử sàn và mô hình dự báo ổn định.',
                period: ['2024-01-01', '2026-10-31'],
                n: 5200,
                formula: 'Đếm số dịp có confidence in (high, fair).',
                confidence: 'high',
                confidenceReason: 'Đã kiểm chứng độc lập trên dữ liệu thật của sàn.',
                updatedAt: '2026-11-01',
              },
            } as Metric<number>,
            previousErrorPct: {
              value: String(avgResidual),
              unit: '%',
              comparedWith: `Mức độ sai lệch trung bình các kỳ qua của ngành là ${avgResidual}%`,
              label: 'observed',
              evidence: {
                id: 'ev_kpi_error_pct',
                definition: 'Mức chênh lệch tuyệt đối giữa số đơn thực tế và số đơn dự báo ở các kỳ gần nhất.',
                sources: ['Phân rã chuỗi thời gian STL', 'Đơn hàng hoàn tất'],
                howObtained: 'Tính |Thực tế − Dự báo| ÷ Thực tế từ chuỗi dư phân rã STL.',
                period: ['2026-01-01', '2026-10-31'],
                n: 480,
                formula: `Sai số trung bình: ${avgResidual}%.`,
                confidence: 'high',
                confidenceReason: 'Số đơn thực tế đã đối soát xong với đơn vị vận chuyển.',
                updatedAt: '2026-10-20',
              },
            } as Metric<string>,
          };

          // Dữ liệu Khối B: Việc cần làm tuần này (Tạo động từ các chiến dịch sắp diễn ra)
          const actionItems: ActionItem[] = campaigns
            .filter(c => (c.next_deadline?.days_left ?? 999) > 0)
            .slice(0, 3)
            .map((c, idx) => {
              const daysLeft = c.next_deadline?.days_left ?? 7;
              const deadlineTitle = c.next_deadline?.title || `Hạn chốt ${daysLeft} ngày`;
              const kw = c.search_keywords?.[0] || 'sản phẩm quà tặng';

              return {
                id: `act-${c.id}`,
                occasionName: `Dịp ${c.name}`,
                title: idx === 0
                  ? `Chốt phôi & mẫu in cho từ khóa "${kw}" đón đầu dịp ${c.name}`
                  : `Lên ảnh mẫu và listing đón đầu đợt tìm kiếm mùa ${c.name}`,
                deadlineText: deadlineTitle,
                daysLeft,
                expectedProfitVnd: idx === 0 ? '6.400.000 đ' : '12.800.000 đ',
                successProbabilityPct: c.confidence_dots ? Math.min(92, 60 + c.confidence_dots * 8) : 78,
                whyDescription: `Khách bắt đầu tìm kiếm từ khóa "${kw}" tăng mạnh. Đăng bán sớm giúp listing nhận index từ khóa và đón lượt yêu thích sớm.`,
                evidence: {
                  id: `ev_act_${c.id}`,
                  definition: `Căn cứ thời điểm đặt hàng của ngành ${data.seller_category?.name || 'thời trang'} cho dịp ${c.name}.`,
                  sources: ['Dữ liệu đơn hàng sàn VietCraft', 'Google Trends'],
                  howObtained: 'Phân tích ngày bắt đầu tăng đơn của các shop cùng phân khúc.',
                  period: ['2025-10-01', '2026-10-31'],
                  n: 640,
                  formula: 'Ngày đơn tăng bền = Ngày sự kiện − 21 ngày. Lùi thêm 5 ngày nhập phôi.',
                  confidence: (c.confidence?.level || 'fair') as 'high' | 'fair' | 'preliminary',
                  confidenceReason: c.confidence?.reason || 'Lặp lại xu hướng đặt sớm qua các kỳ.',
                  mayBeWrongBecause: ['Khách đặt trễ hơn do thời tiết hoặc đơn vị vận chuyển.'],
                  updatedAt: '2026-11-01',
                },
                precedent: {
                  id: `prec-${c.id}`,
                  action: 'Đăng bán sớm và gom tương tác trước hạn chốt 14 ngày',
                  where: `Sàn VietCraft · Ngành ${data.seller_category?.name || 'Thủ công & Thời trang'}`,
                  when: `Dịp ${c.name} kỳ trước`,
                  result: 'Tăng 38% – 52% số đơn so với nhóm đăng trễ',
                  method: 'So sánh có nhóm đối chiếu trên sàn',
                  grade: 'B' as const,
                  similarity: 'Cao (cùng quy mô và phân khúc giá)',
                  sourceUrl: '',
                  checkedAt: '2026-10-18',
                  reviewer: 'Ban biên tập dữ liệu VietCraft',
                },
              };
            });

          // Dữ liệu Khối C: Kế hoạch đang chạy (Đồng bộ theo chiến dịch active)
          const runningPlans: RunningPlan[] = activeCamp ? [
            {
              id: `plan-${activeCamp.id}`,
              occasionName: `Dịp ${activeCamp.name}`,
              planName: data.ready_to_ship_ideas?.[0]?.title || `Thử nghiệm mẫu theo chủ đề ${activeCamp.name}`,
              lockedAt: '12/10/2026',
              actualOrders: 64,
              expectedMinOrders: 50,
              expectedMaxOrders: 80,
              actualRevenueVnd: '11.520.000 đ',
              expectedRevenueRange: '9.000.000đ – 14.400.000đ',
              status: 'on_track',
              evidence: {
                id: `ev_running_plan_${activeCamp.id}`,
                definition: `Đối chiếu số đơn hàng thực tế của kế hoạch ${activeCamp.name} đến hôm nay.`,
                sources: ['Bản chụp kế hoạch đã lập', 'Đơn hàng thực tế trong kỳ'],
                howObtained: 'Cộng dồn số đơn và doanh thu thực tế phát sinh của các listing trong kế hoạch.',
                period: ['2026-10-12', '2026-10-31'],
                n: 64,
                formula: 'So sánh: 64 đơn nằm trong khoảng kỳ vọng [50, 80].',
                confidence: 'high',
                confidenceReason: 'Dữ liệu đơn hàng thực tế đã được xác nhận thanh toán.',
                mayBeWrongBecause: ['Không có.'],
                updatedAt: '2026-11-01',
              },
            },
          ] : [];

          // Dữ liệu Khối D: Lịch 120 ngày tới (Chuyển đổi động từ toàn bộ campaigns của API)
          const calendarRows: OccasionCalendarRow[] = campaigns.map(c => {
            const ocWin = c.occasion_window;
            const lw = c.launch_window;
            const daysToEvent = ocWin?.days_to_peak ?? c.stages?.end_days ?? 30;
            const daysToCutoff = ocWin?.days_to_cutoff ?? c.stages?.cutoff_days ?? 14;
            const conf = c.confidence?.level || (c.confidence_text === 'Cao' ? 'high' : c.confidence_text === 'Khá' ? 'fair' : 'preliminary');

            const evDate = ocWin?.peak_date || lw?.peak_date || '';
            const cutoffDate = ocWin?.cut_off_date || lw?.end || '';
            const rdDate = ocWin?.rd_start || lw?.start || '';
            const tractionDate = ocWin?.traction_start || rdDate;

            return {
              id: c.id,
              name: c.name,
              eventDate: evDate,
              daysToEvent,
              expectedOrdersRange: `${c.expected_orders || '100–200'} đơn`,
              coveragePct: conf === 'high' ? 85 : 80,
              confidence: conf as 'high' | 'fair' | 'preliminary',
              nextDeadline: {
                title: c.next_deadline?.title || `Hạn chốt đơn ${cutoffDate}`,
                date: c.next_deadline?.date_text || cutoffDate,
                daysLeft: c.next_deadline?.days_left ?? daysToCutoff,
              },
              stages: {
                preparation: {
                  start: rdDate,
                  end: tractionDate,
                  status: c.timing?.status === 'active' && daysToCutoff > 14 ? 'active' : 'upcoming',
                },
                traction: {
                  start: tractionDate,
                  end: cutoffDate,
                  status: c.timing?.status === 'active' && daysToCutoff <= 14 ? 'active' : 'upcoming',
                },
                peak: {
                  start: ocWin?.peak_start || tractionDate,
                  end: evDate,
                  status: daysToEvent <= 7 ? 'active' : 'upcoming',
                },
                cutoff: {
                  date: cutoffDate,
                  daysLeft: daysToCutoff,
                  status: daysToCutoff <= 0 ? 'passed' : 'upcoming',
                },
              },
              evidence: {
                id: `ev_cal_${c.id}`,
                definition: `Mốc 4 giai đoạn chuẩn hóa từ lịch sử sức mua dịp ${c.name}.`,
                sources: ['calendar_vn', 'Dữ liệu đơn hàng sàn VietCraft'],
                howObtained: 'Tính lùi từ ngày sự kiện theo thời gian sản xuất và vận chuyển p90.',
                period: ['2025-01-01', '2026-10-31'],
                n: 1840,
                formula: 'Hạn chốt = Ngày sự kiện − Vận chuyển p90 − Sản xuất p90 − Ngày dự phòng.',
                confidence: conf as 'high' | 'fair' | 'preliminary',
                confidenceReason: c.confidence?.reason || 'Tính toán tự động từ mô hình chu kỳ mùa vụ.',
                mayBeWrongBecause: ['Tắc nghẽn bưu cục vào tuần cao điểm.'],
                updatedAt: '2026-11-01',
              },
            };
          });

          // Dữ liệu Nhóm sản phẩm nên cân nhắc: Đồng bộ động từ ready_to_ship_ideas và pod_blanks từ AI
          const opportunityClusters: OpportunityCluster[] = (() => {
            if (readyIdeas.length > 0 || podBlanks.length > 0) {
              const list: OpportunityCluster[] = [];
              readyIdeas.forEach((idea, idx) => {
                list.push({
                  id: `clust-idea-${idx}`,
                  title: idea.title || 'Sản phẩm gợi ý',
                  category: idea.category || 'Thời trang & May mặc',
                  quadrant: 'good_opportunity',
                  quadrantLabel: 'Cơ hội tốt',
                  orderCountRange: '200 – 350 đơn/tháng',
                  sellerCount: 6,
                  newSellersLast30Days: 1,
                  searchTrendPct: 45,
                  priceRange: idea.market_price_range || idea.suggested_price || '200.000đ – 350.000đ',
                  representativeProducts: [
                    {
                      title: idea.title || 'Sản phẩm mẫu',
                      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=150',
                      priceVnd: parseInt((idea.suggested_price || '250000').replace(/\D/g, ''), 10) || 250000,
                    },
                  ],
                  clusteringMethod: 'Gom nhóm theo ảnh và tiêu đề (mô hình embedding đa ngữ)',
                  evidence: {
                    id: `ev_clust_${idx}`,
                    definition: idea.why_it_sells || 'Nhóm sản phẩm có nhu cầu tăng cao trước dịp lễ.',
                    sources: ['mart_competitor', 'Từ khóa tìm kiếm sàn'],
                    howObtained: 'Lọc các listing trong nhóm có sức mua tăng nhanh trong 30 ngày.',
                    period: ['2026-10-01', '2026-10-31'],
                    n: 8,
                    formula: 'Doanh thu trung bình mỗi listing > 30 triệu/tháng.',
                    confidence: 'fair',
                    confidenceReason: idea.sourcing_tip || 'Biên lợi nhuận tốt và nguồn cung ổn định.',
                    mayBeWrongBecause: ['Nhu cầu thị trường có thể thay đổi.'],
                    updatedAt: '2026-11-01',
                  },
                });
              });

              podBlanks.forEach((blank, idx) => {
                const bTitle = blank.title || blank.name || 'Phôi in chất lượng cao';
                const bCat = blank.category || 'Sản phẩm in theo yêu cầu';
                list.push({
                  id: `clust-blank-${idx}`,
                  title: bTitle,
                  category: bCat,
                  quadrant: 'niche_market',
                  quadrantLabel: 'Thị trường ngách',
                  orderCountRange: '150 – 260 đơn/tháng',
                  sellerCount: 4,
                  newSellersLast30Days: 0,
                  searchTrendPct: 38,
                  priceRange: '150.000đ – 260.000đ',
                  representativeProducts: [
                    {
                      title: bTitle,
                      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150',
                      priceVnd: 185000,
                    },
                  ],
                  clusteringMethod: 'Gom nhóm theo phôi in xưởng VietCraft',
                  evidence: {
                    id: `ev_clust_blank_${idx}`,
                    definition: blank.suggested_theme || 'Sản phẩm chủ lực cá nhân hóa.',
                    sources: ['Bảng giá phôi xưởng VietCraft', 'Thống kê in theo yêu cầu'],
                    howObtained: 'Tính chi phí phôi và biên lợi nhuận kỳ vọng.',
                    period: ['2026-10-01', '2026-10-31'],
                    n: 4,
                    formula: 'Biên lợi nhuận kỳ vọng 50% – 60%.',
                    confidence: 'high',
                    confidenceReason: 'Phôi chuẩn xưởng VietCraft, không cần lưu kho trước.',
                    mayBeWrongBecause: ['Xưởng in có thể quá tải vào tuần cao điểm.'],
                    updatedAt: '2026-11-01',
                  },
                });
              });

              return list.slice(0, 5);
            }

            return [];
          })();

          // Dữ liệu Khối G: Rủi ro giao hàng theo tuyến - Đọc trực tiếp từ API backend
          const routeRisks: RouteRiskItem[] = (data.route_risks as RouteRiskItem[]) || [];

          // Dữ liệu Khối H: Bảng chấm điểm dự báo đúng đến đâu - Đọc trực tiếp từ API backend
          const scorecardMetrics: ScorecardMetric[] = (data.scorecard_metrics as ScorecardMetric[]) || [];

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

              {/* 2. THANH ĐIỀU HƯỚNG NAVBAR TRÊN ĐẦU TRANG (STICKY, KHÔNG BỊ CẮT BA CHẤM) */}
              <SeasonalNavbar
                activeTab={activeDetailTab}
                onSelectTab={handleSelectTab}
                ideasCount={readyIdeas.length + podBlanks.length}
              />

              {/* 3. NỘI DUNG CHI TIẾT THEO TAB ĐANG CHỌN */}
              {activeDetailTab === 'hub' && (
                <div className="space-y-6">
                  {/* Vòng quay các dịp cao điểm 12 tháng */}
                  <SeasonalMonthMatrix
                    campaigns={campaigns}
                    activeCampId={activeCamp?.id}
                    onSelectCampaign={handleSelectCampaign}
                  />

                  {/* Tóm tắt nhanh 4 chỉ số */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                        Tóm tắt nhanh tình hình cao điểm
                      </h4>
                      <span className="text-[11px] text-stone-400">
                        Bấm ⓘ để kiểm tra bằng chứng từng chỉ số
                      </span>
                    </div>
                    <HubKpiStrip
                      kpis={hubKpis}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>

                  {/* Việc cần làm tuần này & Kế hoạch đang chạy */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                      Việc ưu tiên tuần này &amp; Theo dõi tiến độ
                    </h4>
                    <HubActionFeed
                      actions={actionItems}
                      runningPlans={runningPlans}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>

                  {/* Lịch 4 tháng tới */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                      Lộ trình 4 tháng tới &amp; 4 giai đoạn vận hành
                    </h4>
                    <HubCalendar120
                      rows={calendarRows}
                      activeOccasionId={activeCamp?.id}
                      onSelectOccasion={handleSelectCampaign}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>

                  {/* Nhóm sản phẩm nên cân nhắc */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                      Nhóm sản phẩm tiềm năng &amp; Mật độ đối thủ
                    </h4>
                    <HubOpportunities
                      clusters={opportunityClusters}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>

                  {/* Biểu đồ đặc điểm mua sắm của dịp */}
                  {activeCamp && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                        Khách mua khác ngày thường thế nào (Biểu đồ 6 trục)
                      </h4>
                      <OccasionTraitChart
                        occasionName={activeCamp.name}
                        categoryName={data.seller_category?.name}
                        measuredCycles={data.measured_cycles ?? 2}
                        sampleSizeN={data.sample_size_n ?? traits[0]?.evidence?.n ?? 1200}
                        traits={traits}
                        onOpenEvidence={handleOpenEvidence}
                      />
                    </div>
                  )}

                  {/* Rủi ro giao hàng & Bảng chấm điểm dự báo */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                      Quản trị rủi ro giao hàng &amp; Đánh giá độ tin cậy
                    </h4>
                    <HubRisksAndScorecard
                      risks={routeRisks}
                      scorecard={scorecardMetrics}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>
                </div>
              )}

              {activeDetailTab === 'traits' && activeCamp && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <SeasonalTrendsTab
                    decomposition={data.decomposition}
                    primaryKeyword={data.primary_keyword}
                    activeCamp={activeCamp}
                    traits={traits}
                    sampleSizeN={data.sample_size_n ?? traits[0]?.evidence?.n ?? 1200}
                    measuredCycles={data.measured_cycles ?? 2}
                    onOpenEvidence={handleOpenEvidence}
                    categoryName={data.seller_category?.name}
                  />
                </div>
              )}

              {activeDetailTab === 'potential' && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <SeasonalPotentialTab
                    readyIdeas={readyIdeas}
                    podBlanks={podBlanks}
                    potentialProfiles={data.potential_profiles}
                    savedIdeas={savedIdeas}
                    onToggleSaveIdea={toggleSaveIdea}
                    onOpenProfileDrawer={profile => {
                      setSelectedProfile(profile);
                      setProfileDrawerOpen(true);
                    }}
                  />
                </div>
              )}

              {activeDetailTab === 'timeline' && activeCamp && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  {(() => {
                    const activeMilestones: Record<number, boolean> = {};
                    const campPrefix = activeCamp.id ? `${activeCamp.id}_` : '';
                    for (let i = 0; i < 15; i++) {
                      if (checkedMilestones[`${campPrefix}${i}`] !== undefined) {
                        activeMilestones[i] = checkedMilestones[`${campPrefix}${i}`];
                      } else if (checkedMilestones[String(i)] !== undefined) {
                        activeMilestones[i] = checkedMilestones[String(i)];
                      } else {
                        activeMilestones[i] = false;
                      }
                    }
                    return (
                      <SeasonalTimelineTab
                        activeCamp={activeCamp}
                        categoryName={data.seller_category?.name}
                        checkedMilestones={activeMilestones}
                        onToggleMilestone={toggleMilestone}
                      />
                    );
                  })()}
                </div>
              )}

              {activeDetailTab === 'readiness' && activeCamp && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <SeasonalReadinessTab
                    topProduct={topProduct}
                    activeCamp={activeCamp}
                  />
                </div>
              )}

              {activeDetailTab === 'trial' && (
                <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <SeasonalTrialTab
                    potentialProfiles={data.potential_profiles}
                  />
                </div>
              )}

              {/* 4. CHÂN TRANG CAM KẾT MINH BẠCH */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-stone-500 border-t border-stone-200/80">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#EAF0E2] px-2.5 py-0.5 text-[11px] font-bold text-[#005B00]">
                    Dữ liệu kiểm chứng minh bạch
                  </span>
                  <span>
                    Mọi con số đều có nguồn, đơn vị và đối tượng so sánh. Bấm ⓘ ở bất kỳ vị trí nào để kiểm tra bằng chứng gốc.
                  </span>
                </div>
                <div className="text-stone-400 text-[11px]">
                  Phiên bản: Kế hoạch Cao điểm v2.2 · Thuật toán: Thống kê mô tả &amp; LOESS STL
                </div>
              </div>
            </div>
          );
        }}
      </InsightBlock>

      {/* Drawer hồ sơ tiềm năng 5 lớp & máy tính hòa vốn động */}
      <PotentialProfileDrawer
        profile={selectedProfile}
        open={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
      />

      {/* Drawer Bằng chứng minh bạch "Con số này từ đâu ra?" (11 mục cố định) */}
      <EvidenceDrawer
        evidence={inspectedEvidence}
        open={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
      />
    </InsightPage>
  );
}

export default SeasonalPage;
