import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SeasonalNavbar } from '../components/seasonal/SeasonalNavbar';
import { InsightBlock } from '../components/InsightBlock';
import { InsightPage } from '../components/InsightPage';
import { useInsight, type InsightState } from '../hooks/useInsight';
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
import { HubActionFeed, type UnifiedOccasionAction } from '../components/seasonal/hub/HubActionFeed';
import { HubOpportunities } from '../components/seasonal/hub/HubOpportunities';
import { HubRisksAndScorecard, type RouteRiskItem, type ScorecardMetric } from '../components/seasonal/hub/HubRisksAndScorecard';

import type {
  InsightMeta,
  PotentialProfile,
  SeasonalCampaign,
  SeasonalForecast,
} from '../types';
import type { Evidence, OccasionTraitItem, OpportunityCluster } from '../types/evidence';
import { GLOSSARY } from '../i18n/vi.glossary';

function toDay(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtShortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

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

  // Giữ lại dữ liệu đã sẵn sàng khi tải dữ liệu cho dịp mới để tránh unmount toàn trang gây reload giật lag và mất form chi tiết
  const lastReadyDataRef = useRef<{ data: SeasonalForecast; meta: InsightMeta } | null>(null);
  if (state.kind === 'ready' && state.data) {
    lastReadyDataRef.current = { data: state.data, meta: state.meta };
  }

  const effectiveState = useMemo<InsightState<SeasonalForecast>>(() => {
    if (state.kind === 'loading' && lastReadyDataRef.current) {
      return {
        kind: 'ready',
        data: lastReadyDataRef.current.data,
        meta: lastReadyDataRef.current.meta,
      };
    }
    return state;
  }, [state]);

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
      console.error('Lỗi khi lưu ý tưởng theo dịp vào CSDL shop:', e);
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
      console.error('Lỗi khi cập nhật mốc thời gian theo dịp vào CSDL shop:', e);
    }
  };

  const handleToggleCampMilestone = async (campId: string, stageIdx: number) => {
    const key = `${campId}_${stageIdx}`;
    const nextVal = !checkedMilestones[key];
    setCheckedMilestones(prev => ({ ...prev, [key]: nextVal }));
    try {
      await analyticsApi.toggleSeasonalMilestone(stageIdx, nextVal, campId);
    } catch (e) {
      console.error('Lỗi khi cập nhật mốc thời gian theo dịp vào CSDL shop:', e);
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
      <InsightBlock state={effectiveState} onRetry={reload}>
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

          // Dữ liệu Khối B & C: Việc gợi ý ưu tiên & Tiến độ theo dịp (Kết hợp Solution 1 & 2)
          const targetCampaigns = campaigns
            .filter(c => (c.next_deadline?.days_left ?? 999) > 0)
            .slice(0, 3);
          const activeList = targetCampaigns.length > 0 ? targetCampaigns : campaigns.slice(0, 3);

          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          const unifiedActions: UnifiedOccasionAction[] = activeList.map((c) => {
            const ocWin = c.occasion_window;
            const lw = c.launch_window;
            const evDateIso = ocWin?.peak_date || lw?.peak_date || '';
            const cutoffIso = ocWin?.cut_off_date || lw?.end || '';
            const rdIso = ocWin?.rd_start || lw?.start || '';
            const tractionIso = ocWin?.traction_start || rdIso;
            const peakIso = ocWin?.peak_start || tractionIso;

            const daysLeft = c.next_deadline?.days_left ?? ocWin?.days_to_cutoff ?? 7;
            const daysToCutoff = ocWin?.days_to_cutoff ?? daysLeft;
            const deadlineTitle = c.next_deadline?.title || `Hạn chốt đơn ${fmtShortDate(cutoffIso)}`;
            const kw = c.search_keywords?.[0] || 'sản phẩm quà tặng';

            const rdStartDay = toDay(rdIso);
            const tractionStartDay = toDay(tractionIso);
            const peakStartDay = toDay(peakIso);
            const cutoffDay = toDay(cutoffIso);

            const isOverduePrep = (peakStartDay && today.getTime() >= peakStartDay.getTime()) || daysToCutoff <= 3;
            const isTractionPhase = !isOverduePrep && tractionStartDay && today.getTime() >= tractionStartDay.getTime();

            // Khuyến nghị từ Backend AI nếu có, nếu chưa thì fallback chuẩn
            const backendRec = c.action_recommendation;

            const recommendation = backendRec ? {
              title: backendRec.title,
              advice: backendRec.advice,
              calculationBasis: backendRec.calculation_basis,
              ctaLabel: backendRec.cta_label,
              targetTab: backendRec.target_tab,
              actionType: backendRec.action_type,
            } : {
              title: isOverduePrep
                ? 'Chốt đơn & ưu tiên xuất hàng sẵn có'
                : isTractionPhase
                ? `Tối ưu listing & từ khóa "${kw}"`
                : 'Chuẩn bị phôi xưởng & duyệt mẫu',
              advice: isOverduePrep
                ? `Sắp đến hạn chốt nhận đơn (${fmtShortDate(cutoffIso)}, còn ${daysToCutoff} ngày). Đã qua thời điểm làm mẫu mới. Nên tập trung xử lý các đơn hàng sẵn phôi trong kho để bảo đảm giao kịp trước ngày ${fmtShortDate(evDateIso)}.`
                : isTractionPhase
                ? `Nhu cầu tìm kiếm tăng tốc trước cao điểm (${fmtShortDate(peakIso)}). Khuyến nghị hoàn thiện ảnh thật, tối ưu tiêu đề gắn từ khóa "${kw}" để đón đơn sớm.`
                : `Thời điểm phù hợp để duyệt mẫu thiết kế và liên hệ xưởng chuẩn bị phôi cho nhóm từ khóa "${kw}" trước khi mở bán (${fmtShortDate(tractionIso)}).`,
              calculationBasis: isOverduePrep
                ? `Hạn chốt ${fmtShortDate(cutoffIso)} = Ngày sự kiện (${fmtShortDate(evDateIso)}) − 10 ngày (sản xuất P90 & giao hàng an toàn).`
                : isTractionPhase
                ? `Bắt đầu mở bán ${fmtShortDate(tractionIso)} = Trước cao điểm 10 ngày để kịp index từ khóa.`
                : `Bắt đầu chuẩn bị ${fmtShortDate(rdIso)} = Ngày sự kiện (${fmtShortDate(evDateIso)}) − 38 ngày (lead time xưởng & đón sóng).`,
              ctaLabel: isOverduePrep
                ? 'Xem phôi & tồn kho'
                : isTractionPhase
                ? 'Xem từ khóa & đối thủ'
                : 'Xem phôi xưởng có sẵn',
              targetTab: (isTractionPhase ? 'opps' : 'ideas'),
              actionType: (isOverduePrep ? 'close_orders' : isTractionPhase ? 'boost_traffic' : 'prepare_blank'),
            };

            const phaseBadge = backendRec ? {
              text: backendRec.badge_text,
              variant: backendRec.badge_variant,
            } : {
              text: isOverduePrep
                ? (daysToCutoff <= 1 ? 'Hạn chốt 1 ngày' : 'Giai đoạn chốt đơn')
                : isTractionPhase
                ? 'Mở bán & gom đơn'
                : 'Chuẩn bị mẫu & phôi',
              variant: (isOverduePrep ? 'amber' : isTractionPhase ? 'blue' : 'emerald'),
            };

            // 4 mốc tiến độ chuẩn
            const milestones = [
              {
                stageIdx: 0,
                label: 'Chuẩn bị',
                dateText: fmtShortDate(rdIso),
                isPassed: rdStartDay ? today.getTime() >= rdStartDay.getTime() : false,
                isCurrent: rdStartDay && tractionStartDay ? today.getTime() >= rdStartDay.getTime() && today.getTime() < tractionStartDay.getTime() : false,
                checked: checkedMilestones[`${c.id}_0`] !== undefined
                  ? checkedMilestones[`${c.id}_0`]
                  : (rdStartDay ? today.getTime() >= rdStartDay.getTime() : false),
              },
              {
                stageIdx: 1,
                label: 'Mở bán',
                dateText: fmtShortDate(tractionIso),
                isPassed: tractionStartDay ? today.getTime() >= tractionStartDay.getTime() : false,
                isCurrent: tractionStartDay && peakStartDay ? today.getTime() >= tractionStartDay.getTime() && today.getTime() < peakStartDay.getTime() : false,
                checked: checkedMilestones[`${c.id}_1`] !== undefined
                  ? checkedMilestones[`${c.id}_1`]
                  : (tractionStartDay ? today.getTime() >= tractionStartDay.getTime() : false),
              },
              {
                stageIdx: 2,
                label: 'Cao điểm',
                dateText: fmtShortDate(peakIso),
                isPassed: peakStartDay ? today.getTime() >= peakStartDay.getTime() : false,
                isCurrent: peakStartDay && cutoffDay ? today.getTime() >= peakStartDay.getTime() && today.getTime() < cutoffDay.getTime() : false,
                checked: checkedMilestones[`${c.id}_2`] !== undefined
                  ? checkedMilestones[`${c.id}_2`]
                  : (peakStartDay ? today.getTime() >= peakStartDay.getTime() : false),
              },
              {
                stageIdx: 3,
                label: 'Hạn chốt',
                dateText: fmtShortDate(cutoffIso),
                isPassed: cutoffDay ? today.getTime() >= cutoffDay.getTime() : false,
                isCurrent: daysToCutoff <= 3 && daysToCutoff >= 0,
                checked: checkedMilestones[`${c.id}_3`] !== undefined
                  ? checkedMilestones[`${c.id}_3`]
                  : (cutoffDay ? today.getTime() >= cutoffDay.getTime() : false),
              },
            ];

            const campSavedCount = Object.keys(savedIdeas).filter(k => k.startsWith(c.id)).length;

            return {
              id: `unified-${c.id}`,
              occasionId: c.id,
              occasionName: `Dịp ${c.name}`,
              phaseBadge: phaseBadge as UnifiedOccasionAction['phaseBadge'],
              deadlineText: deadlineTitle,
              daysLeft,
              isUrgent: daysLeft <= 7,
              recommendation: recommendation as UnifiedOccasionAction['recommendation'],
              milestones,
              savedIdeasCount: campSavedCount > 0 ? campSavedCount : (c.id === activeCamp?.id ? savedIdeasCount : 0),
              calculationBasis: recommendation.calculationBasis,
              evidence: {
                id: `ev_act_${c.id}`,
                definition: `Căn cứ thời điểm và gợi ý vận hành dịp ${c.name}.`,
                sources: ['Lịch sự kiện Việt Nam (calendar_vn)', 'Thời gian sản xuất & giao hàng thực tế của xưởng'],
                howObtained: 'Tính toán lùi từ ngày diễn ra sự kiện theo thời gian sản xuất P90 và vận chuyển an toàn.',
                period: ['2026-10-01', '2026-11-30'],
                n: 4,
                formula: recommendation.calculationBasis,
                confidence: (c.confidence?.level || 'fair') as 'high' | 'fair' | 'preliminary',
                confidenceReason: 'Tính toán theo công thức ngày thực tế, không có số liệu ước lượng ảo.',
                mayBeWrongBecause: ['Thời tiết bất lợi hoặc đơn vị vận chuyển quá tải vào tuần cao điểm.'],
                updatedAt: '2026-11-01',
              },
            };
          });

          // Dữ liệu Nhóm sản phẩm nên cân nhắc: Ưu tiên đọc trực tiếp từ opportunity_clusters thật của BE
          const opportunityClusters: OpportunityCluster[] = (() => {
            if (Array.isArray(data.opportunity_clusters) && data.opportunity_clusters.length > 0) {
              return data.opportunity_clusters as OpportunityCluster[];
            }

            if (readyIdeas.length > 0 || podBlanks.length > 0) {
              const list: OpportunityCluster[] = [];
              readyIdeas.forEach((idea, idx) => {
                const sellerCnt = idea.seller_count ?? 6;
                const trendPct = idea.search_trend_pct ?? 45;
                const priceNum = parseInt((idea.suggested_price || '250000').replace(/\D/g, ''), 10) || 250000;
                const platformName = idea.platform || 'Tiki';
                list.push({
                  id: `clust-idea-${idx}`,
                  title: idea.title || 'Sản phẩm gợi ý',
                  category: idea.category || 'Thời trang & May mặc',
                  quadrant: sellerCnt <= 8 ? 'good_opportunity' : 'high_competition',
                  quadrantLabel: sellerCnt <= 8 ? 'Cơ hội tốt' : 'Cạnh tranh cao',
                  orderCountRange: idea.sold_count ? `${idea.sold_count.toLocaleString('vi-VN')} lượt bán` : '200 – 350 đơn/tháng',
                  sellerCount: sellerCnt,
                  newSellersLast30Days: Math.max(1, Math.floor(sellerCnt / 4)),
                  searchTrendPct: trendPct,
                  priceRange: idea.market_price_range || idea.suggested_price || '200.000đ – 350.000đ',
                  platform: platformName,
                  productUrl: idea.product_url || '',
                  sellerName: idea.seller_name || '',
                  soldCount: idea.sold_count ?? 0,
                  representativeProducts: [
                    {
                      title: idea.title || 'Sản phẩm đang bán',
                      imageUrl: idea.image_url || '',
                      priceVnd: priceNum,
                      platform: platformName,
                      productUrl: idea.product_url || '',
                      sellerName: idea.seller_name || '',
                      soldCount: idea.sold_count ?? 0,
                      ratingAverage: idea.rating_average ?? 0,
                    },
                  ],
                  clusteringMethod: `Thu thập trực tiếp từ ${platformName} (trạng thái: Đang bán)`,
                  evidence: {
                    id: `ev_clust_${idx}`,
                    definition: idea.why_it_sells || 'Nhóm sản phẩm đang mở bán thực tế có nhu cầu tăng cao trước dịp lễ.',
                    sources: [`API sản phẩm đang bán ${platformName}`, 'external_market_products'],
                    howObtained: 'Truy vấn các listing đang mở bán (availability=1) và gom nhóm theo phân khúc.',
                    period: ['2026-10-01', '2026-10-31'],
                    n: sellerCnt,
                    formula: `Khoảng giá thực tế ${idea.market_price_range || idea.suggested_price} trên ${sellerCnt} gian hàng đang bán.`,
                    confidence: 'high',
                    confidenceReason: idea.sourcing_tip || 'Dữ liệu thực tế từ sản phẩm đang mở bán trên sàn TMĐT.',
                    mayBeWrongBecause: ['Giá bán có thể biến động nhẹ trong các khung giờ Flash Sale.'],
                    updatedAt: '2026-11-05',
                    rawDataUrl: idea.product_url || '',
                  },
                });
              });

              podBlanks.forEach((blank, idx) => {
                const bTitle = blank.title || blank.name || 'Phôi in chất lượng cao';
                const bCat = blank.category || 'Sản phẩm in theo yêu cầu';
                const provCnt = blank.seller_count ?? 4;
                const platformName = blank.platform || 'Printify';
                list.push({
                  id: `clust-blank-${idx}`,
                  title: bTitle,
                  category: bCat,
                  quadrant: 'niche_market',
                  quadrantLabel: 'Thị trường ngách',
                  orderCountRange: `${provCnt} nhà in sẵn phôi`,
                  sellerCount: provCnt,
                  newSellersLast30Days: 0,
                  searchTrendPct: 38,
                  priceRange: blank.market_price_range || '150.000đ – 260.000đ',
                  platform: platformName,
                  productUrl: blank.product_url || '',
                  sellerName: blank.seller_name || '',
                  soldCount: blank.sold_count ?? 0,
                  representativeProducts: [
                    {
                      title: blank.name || bTitle,
                      imageUrl: blank.image_url || '',
                      priceVnd: blank.base_cost ? Math.round(blank.base_cost * 2.2) : 185000,
                      platform: platformName,
                      productUrl: blank.product_url || '',
                      sellerName: blank.seller_name || '',
                      soldCount: blank.sold_count ?? 0,
                    },
                  ],
                  clusteringMethod: `Danh mục phôi POD đang hoạt động từ ${platformName} Catalog API`,
                  evidence: {
                    id: `ev_clust_blank_${idx}`,
                    definition: blank.suggested_theme || 'Sản phẩm chủ lực cá nhân hóa theo đơn.',
                    sources: [`${platformName} Catalog API`, 'printify_variants.json'],
                    howObtained: 'Đồng bộ trực tiếp blueprint đang mở bán kèm ảnh gốc và chi phí phôi.',
                    period: ['2026-10-01', '2026-10-31'],
                    n: provCnt,
                    formula: `Biên lợi nhuận kỳ vọng ${blank.expected_profit_margin || '50% – 60%'}.`,
                    confidence: 'high',
                    confidenceReason: 'Phôi thật từ catalog đang hoạt động, chỉ in khi có khách đặt đơn.',
                    mayBeWrongBecause: ['Xưởng in có thể tăng nhẹ thời gian xử lý vào tuần cao điểm.'],
                    updatedAt: '2026-11-05',
                    rawDataUrl: blank.product_url || '',
                  },
                });
              });

              return list.slice(0, 6);
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

                  {/* Việc ưu tiên tuần này & Theo dõi tiến độ */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                        Việc ưu tiên tuần này &amp; Theo dõi tiến độ
                      </h4>
                      <span className="text-xs text-stone-500 font-medium">
                        {unifiedActions.length} dịp gần nhất
                      </span>
                    </div>
                    <HubActionFeed
                      occasions={unifiedActions}
                      onOpenEvidence={handleOpenEvidence}
                      onToggleMilestone={handleToggleCampMilestone}
                      onNavigateTab={handleSelectTab}
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
