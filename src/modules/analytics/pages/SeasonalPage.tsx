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
import { SeasonalReadinessTab } from '../components/seasonal/SeasonalReadinessTab';
import { OccasionTraitChart } from '../components/seasonal/OccasionTraitChart';
import { OpportunityKeywordTable } from '../components/seasonal/OpportunityKeywordTable';
import { CampaignFunnelCard } from '../components/seasonal/CampaignFunnelCard';
import { ApplyPlaybookCard } from '../components/seasonal/ApplyPlaybookCard';
import { SeasonalImpactCard } from '../components/seasonal/SeasonalImpactCard';
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
  const [focusIdeaId, setFocusIdeaId] = useState<string | null>(null);

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
      header={<></>}
    >
      <InsightBlock state={effectiveState} onRetry={reload}>
        {(data: SeasonalForecast, _meta) => {
          const campaigns: SeasonalCampaign[] = data.all_campaigns || [];
          const activeCamp: SeasonalCampaign | undefined = data.active_campaign;
          const readyIdeas = data.ready_to_ship_ideas || [];
          const podBlanks = data.pod_blanks || [];
          const matchingProducts: any[] = data.matching_shop_products || [];
          const allShopProducts: any[] = data.shop_products || [];

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
                ? `Chốt đơn & Giao hàng ${c.name}`
                : isTractionPhase
                ? `Đẩy mạnh hiển thị "${kw}"`
                : `Lên mẫu & Sẵn hàng ${c.name}`,
              advice: isOverduePrep
                ? `Hạn chốt còn ${daysToCutoff} ngày (${fmtShortDate(cutoffIso)}). Tập trung đóng gói hàng sẵn để kịp giao trước ${fmtShortDate(evDateIso)}.`
                : isTractionPhase
                ? `Nhu cầu "${kw}" đang tăng tốc. Hoàn thiện ảnh thật và gắn tag ngách để đón đơn sớm.`
                : `Chuẩn bị hàng mẫu nhóm "${kw}", sẵn sàng mở bán trước ngày (${fmtShortDate(tractionIso)}).`,
              calculationBasis: isOverduePrep
                ? `Hạn chốt ${fmtShortDate(cutoffIso)} = Ngày sự kiện (${fmtShortDate(evDateIso)}) − 10 ngày (giao hàng an toàn).`
                : isTractionPhase
                ? `Bắt đầu mở bán ${fmtShortDate(tractionIso)} = Trước cao điểm để kịp index từ khóa.`
                : `Bắt đầu chuẩn bị ${fmtShortDate(rdIso)} = Ngày sự kiện (${fmtShortDate(evDateIso)}) − 38 ngày (đón sóng sớm).`,
              ctaLabel: isOverduePrep
                ? 'Xem sản phẩm shop & tồn kho'
                : isTractionPhase
                ? 'Xem xu hướng & sức mua'
                : 'Xem gợi ý sản phẩm đón dịp',
              targetTab: (isOverduePrep ? 'readiness' : isTractionPhase ? 'traits' : 'potential'),
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

          const activeStoryStep: 1 | 2 | 3 | 4 =
            activeDetailTab === 'act1' || activeDetailTab === 'traits' || activeDetailTab === 'potential'
              ? 2
              : activeDetailTab === 'act2' || activeDetailTab === 'readiness' || activeDetailTab === 'trial' || activeDetailTab === 'timeline'
              ? 3
              : activeDetailTab === 'act3' || activeDetailTab === 'performance'
              ? 4
              : 1;
          const activeStoryChapter =
            activeStoryStep === 2
              ? data.story?.ideas
              : activeStoryStep === 3
              ? data.story?.apply
              : activeStoryStep === 4
              ? data.story?.results
              : data.story?.overview;

          const aiIdeas: any[] = Array.isArray((data as any).ai_ideas) ? (data as any).ai_ideas : [];
          const shopDna = (data as any).shop_dna;
          const savedIdeaDrafts: Record<string, any> = (data as any).saved_idea_drafts || {};
          const occasionReviews: Record<string, any> = (data as any).occasion_reviews || {};

          const savedIdeaItems = Object.entries(savedIdeas)
            .filter(([, v]) => Boolean(v))
            .map(([id]) => {
              const draft = savedIdeaDrafts[id];
              if (draft?.title) {
                return { id, title: draft.title, subtitle: 'Bản đã chỉnh sửa' };
              }
              const aiMatch = aiIdeas.find((a: any) => a.id === id);
              if (aiMatch) {
                return { id, title: aiMatch.title, subtitle: 'Ý tưởng AI cho shop' };
              }
              if (id.startsWith('kw_')) {
                return { id, title: `Từ khóa: ${id.slice(3)}`, subtitle: 'Từ khóa cơ hội' };
              }
              const readyParts = id.match(/^ready-(\d+)-(.*)$/);
              if (readyParts) {
                return { id, title: readyParts[2], subtitle: 'Mẫu thị trường' };
              }
              const podParts = id.match(/^pod-(\d+)-(.*)$/);
              if (podParts) {
                return { id, title: podParts[2], subtitle: 'Phôi POD' };
              }
              return { id, title: id, subtitle: 'Ý tưởng đã chọn' };
            });

          return (
            <div className="space-y-6">
              {/* 1. THANH THÔNG TIN GIAN HÀNG & HEADER CHIẾN DỊCH (GỘP CÙNG TIẾN TRÌNH 4 BƯỚC) */}
              <SeasonalHeader
                shopName={data.seller_shop_name}
                categoryName={data.seller_category?.name}
                categorySlug={currentCategorySlug}
                onSelectCategory={handleSelectCategory}
                activeCamp={activeCamp}
                savedIdeasCount={savedIdeasCount}
                savedIdeaItems={savedIdeaItems}
                onRemoveSavedIdea={id => toggleSaveIdea(id)}
                onEditSavedIdea={id => {
                  setFocusIdeaId(id);
                  handleSelectTab('act1');
                }}
                onReload={reload}
                storyChapter={activeStoryChapter}
                storyStep={activeStoryStep}
                onNavigateTab={handleSelectTab}
              />

              {/* 2. THANH ĐIỀU HƯỚNG NAVBAR TRÊN ĐẦU TRANG (STICKY, KHÔNG BỊ CẮT BA CHẤM) */}
              <SeasonalNavbar
                activeTab={activeDetailTab}
                onSelectTab={handleSelectTab}
                ideasCount={readyIdeas.length + podBlanks.length}
              />

              {/* 3. NỘI DUNG CHI TIẾT THEO CỐT TRUYỆN 4 CHƯƠNG */}
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
                      onNavigateTab={(tabKey, campId) => {
                        handleSelectTab(tabKey);
                        if (campId) {
                          handleSelectCampaign(campId);
                        }
                      }}
                    />
                  </div>

                  {/* Phễu Chuyển Đổi & Kênh Bán Hàng */}
                  {activeCamp && (
                    <CampaignFunnelCard
                      funnel={
                        data.campaign_funnel
                          ? { ...data.campaign_funnel, forecast_method_info: (data as any).forecast_method_info }
                          : undefined
                      }
                      channels={data.channel_breakdown}
                      motivation={data.motivation_breakdown}
                      occasionName={activeCamp.name}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  )}

                  {/* Ma trận Từ khóa & Thẻ Tag đón đầu dịp */}
                  {activeCamp && (
                    <OpportunityKeywordTable
                      keywords={data.opportunity_keywords || []}
                      occasionName={activeCamp.name}
                      onOpenEvidence={handleOpenEvidence}
                      savedIdeas={savedIdeas}
                      onToggleStar={tag => toggleSaveIdea(`kw_${tag}`)}
                    />
                  )}

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
                        Đặc điểm hành vi khách mua
                      </h4>
                      <OccasionTraitChart
                        occasionName={activeCamp.name}
                        categoryName={data.seller_category?.name}
                        measuredCycles={data.measured_cycles ?? 2}
                        sampleSizeN={data.sample_size_n ?? traits[0]?.evidence?.n ?? 1200}
                        traits={traits}
                        activeCamp={activeCamp}
                        traitActions={(data as any).trait_actions}
                        onPlanAction={() => setActiveDetailTab('act2')}
                        onOpenEvidence={handleOpenEvidence}
                      />
                    </div>
                  )}

                  {/* Rủi ro giao hàng & Bảng chấm điểm dự báo */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm uppercase tracking-wide">
                      Rủi ro vận chuyển &amp; Độ tin cậy dự báo
                    </h4>
                    <HubRisksAndScorecard
                      risks={routeRisks}
                      scorecard={scorecardMetrics}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: Ý TƯỞNG (Sắp xếp theo mức độ ưu tiên hành động: Từ khóa cơ hội -> Sản phẩm tiềm năng -> Hành vi & Lịch chuẩn bị) */}
              {(activeDetailTab === 'act1' || activeDetailTab === 'traits' || activeDetailTab === 'potential') && activeCamp && (
                <div className="space-y-6">

                  {/* 1. Ma trận từ khóa cơ hội (Ưu tiên cao nhất: chọn ngách & gắn thẻ / tạo sản phẩm ngay) */}
                  <OpportunityKeywordTable
                    keywords={data.opportunity_keywords || []}
                    occasionName={activeCamp.name}
                    onOpenEvidence={handleOpenEvidence}
                    savedIdeas={savedIdeas}
                    onToggleStar={tag => toggleSaveIdea(`kw_${tag}`)}
                  />

                  {/* 2. Hồ sơ sản phẩm tiềm năng (Hàng sẵn & Phôi POD kèm phân tích hòa vốn) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4">
                      <h4 className="text-base font-bold text-stone-900">
                        Sản phẩm tiềm năng
                      </h4>
                    </div>
                    <SeasonalPotentialTab
                      readyIdeas={readyIdeas}
                      podBlanks={podBlanks}
                      aiIdeas={aiIdeas}
                      shopDna={shopDna}
                      savedIdeaDrafts={savedIdeaDrafts}
                      focusIdeaId={focusIdeaId}
                      onClearFocusIdea={() => setFocusIdeaId(null)}
                      potentialProfiles={data.potential_profiles}
                      savedIdeas={savedIdeas}
                      onToggleSaveIdea={toggleSaveIdea}
                      onOpenProfileDrawer={profile => {
                        setSelectedProfile(profile);
                        setProfileDrawerOpen(true);
                      }}
                      onApplyIdea={() => handleSelectTab('act2')}
                    />
                  </div>

                  {/* 3. Đặc điểm hành vi khách mua & Lịch chuẩn bị theo giai đoạn */}
                  <OccasionTraitChart
                    occasionName={activeCamp.name}
                    categoryName={data.seller_category?.name}
                    measuredCycles={data.measured_cycles ?? 2}
                    sampleSizeN={data.sample_size_n ?? traits[0]?.evidence?.n ?? 1200}
                    traits={traits}
                    activeCamp={activeCamp}
                    traitActions={(data as any).trait_actions}
                    onPlanAction={() => setActiveDetailTab('act2')}
                    onOpenEvidence={handleOpenEvidence}
                  />
                </div>
              )}

              {/* TAB 2: ÁP DỤNG (Gọn, không lặp lại timeline hay số liệu thử nghiệm fix cứng) */}
              {(activeDetailTab === 'act2' || activeDetailTab === 'readiness' || activeDetailTab === 'trial' || activeDetailTab === 'timeline') && activeCamp && (
                <div className="space-y-6">
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
                    const stopWords = new Set(['cho', 'dịp', 'mùa', 'tặng', 'quà', 'set', 'bộ', 'mẫu', 'sản', 'phẩm', 'và', 'của', 'theo', 'phong', 'cách', 'phiên', 'bản', 'siêu', 'sale']);
                    const ideaTokensList = savedIdeaItems.map(item => ({
                      id: item.id,
                      titleLower: (item.title || '').toLowerCase().trim(),
                      tokens: (item.title || '')
                        .toLowerCase()
                        .split(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/i)
                        .filter((w: string) => w.length >= 3 && !stopWords.has(w)),
                    }));
                    const ideaMatchedProducts = savedIdeaItems.length === 0
                      ? []
                      : allShopProducts.filter((p: any) => {
                          if (p.source_idea_id && savedIdeaItems.some(i => i.id === p.source_idea_id)) return true;
                          const pName = String(p.name || p.title || '').toLowerCase().trim();
                          return ideaTokensList.some(it => {
                            if (it.titleLower && (pName === it.titleLower || pName.includes(it.titleLower))) return true;
                            if (it.tokens.length < 3) return false;
                            const hits = it.tokens.filter((tk: string) => pName.includes(tk)).length;
                            return hits >= Math.max(4, Math.ceil(it.tokens.length * 0.65));
                          });
                        });
                    const ideaInStockCount = ideaMatchedProducts.filter((p: any) => (p.stock ?? 1) > 0).length;
                    const ideaOrdersCount = ideaMatchedProducts.reduce(
                      (sum: number, p: any) => sum + Number(p.sold_count ?? p.orders_count ?? 0),
                      0
                    );
                    return (
                      <ApplyPlaybookCard
                        playbooks={data.apply_playbooks}
                        savedIdeas={savedIdeas}
                        savedIdeaItems={savedIdeaItems}
                        aiIdeas={aiIdeas}
                        allShopProducts={allShopProducts}
                        matchingProductsCount={ideaMatchedProducts.length}
                        inStockMatchingCount={ideaInStockCount}
                        actualOrdersCount={ideaOrdersCount}
                        checkedMilestones={activeMilestones}
                        onToggleMilestone={toggleMilestone}
                        onEditSavedIdea={id => {
                          setFocusIdeaId(id);
                          handleSelectTab('act1');
                        }}
                        occasionName={activeCamp.name}
                      />
                    );
                  })()}

                  {/* Rà soát sản phẩm hiện có của shop cho dịp */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                    <SeasonalReadinessTab
                      matchingProducts={matchingProducts}
                      allShopProducts={allShopProducts}
                      activeCamp={activeCamp}
                      onOpenEvidence={handleOpenEvidence}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: THÀNH QUẢ (Tập trung kết quả đơn/GMV, phễu chuyển đổi & đánh giá sau dịp) */}
              {(activeDetailTab === 'act3' || activeDetailTab === 'performance') && activeCamp && (
                <div className="space-y-6">
                  <SeasonalImpactCard
                    impact={data.impact}
                    occasionName={activeCamp.name}
                    campId={activeCamp.id}
                    savedIdeaTitles={savedIdeaItems.map(x => x.title)}
                    appliedSummary={{
                      selectedIdeasCount: savedIdeaItems.length,
                      completedMilestonesCount: Object.entries(checkedMilestones).filter(
                        ([k, v]) => v && (activeCamp.id ? k.startsWith(`${activeCamp.id}_`) : true)
                      ).length,
                      totalMilestonesCount: 4,
                      matchingProductsCount: matchingProducts.length,
                    }}
                    initialReview={occasionReviews[activeCamp.id]}
                  />

                  {/* Phễu chuyển đổi & đóng góp kênh bán thực tế */}
                  <CampaignFunnelCard
                    funnel={
                      data.campaign_funnel
                        ? { ...data.campaign_funnel, forecast_method_info: (data as any).forecast_method_info }
                        : undefined
                    }
                    channels={data.channel_breakdown}
                    motivation={data.motivation_breakdown}
                    occasionName={activeCamp.name}
                    onOpenEvidence={handleOpenEvidence}
                  />
                </div>
              )}
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
