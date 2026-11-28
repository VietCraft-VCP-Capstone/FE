import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { PreviousSeasonLessonCard } from '../components/seasonal/PreviousSeasonLessonCard';
import { DEFAULT_TEST_ORDERS, PLAYBOOK_SLOTS, playbookStepKey } from '../components/seasonal/playbookSteps';
import { SeasonalImpactCard, type IdeaReviewValue, type OccasionReview } from '../components/seasonal/SeasonalImpactCard';
import { analyticsApi, occasionVoucherHref, planRefOf, seasonalSaveError, type SeasonalPlanRef } from '../services/analyticsApi';

// Hub components (Khối A-H)
import { HubActionFeed, type UnifiedOccasionAction } from '../components/seasonal/hub/HubActionFeed';
import { HubOpportunities } from '../components/seasonal/hub/HubOpportunities';
import { HubRisksAndScorecard, type RouteRiskItem, type ScorecardMetric } from '../components/seasonal/hub/HubRisksAndScorecard';

import type {
  InsightMeta,
  PotentialProfile,
  SeasonalCampaign,
  SeasonalForecast,
  SeasonalIdeaSnapshot,
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
  // Đánh giá vừa lưu trong phiên (dữ liệu trang không tải lại sau khi lưu)
  const [savedReviews, setSavedReviews] = useState<
    Record<string, { review: OccasionReview | null; ideas: Record<string, IdeaReviewValue> }>
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);

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
      setSavedSnapshots(state.data.saved_idea_snapshots || {});
    }
  }, [state]);

  // Kỳ dịp (mã + năm của ngày lễ) để lưu kế hoạch đúng kỳ; không có campId thì là dịp đang xem
  const planRefFor = (campId?: string): SeasonalPlanRef | null => {
    const d = lastReadyDataRef.current?.data;
    if (!d) return null;
    const camp = campId ? (d.all_campaigns || []).find(c => c.id === campId) : d.active_campaign;
    return planRefOf(camp);
  };

  const [savedSnapshots, setSavedSnapshots] = useState<Record<string, SeasonalIdeaSnapshot>>({});

  const toggleSaveIdea = async (key: string, snapshot?: SeasonalIdeaSnapshot) => {
    const plan = planRefFor();
    if (!plan) {
      setSaveError('Chưa xác định được dịp đang xem, vui lòng tải lại trang.');
      return;
    }
    const prevSnapshot = { ...savedIdeas };
    setSaveError(null);
    setSavedIdeas(prev => ({ ...prev, [key]: !prev[key] }));
    try {
      const res = await analyticsApi.saveSeasonalIdea(key, plan, savedIdeas[key] ? undefined : snapshot);
      if (res?.idea_snapshots) setSavedSnapshots(res.idea_snapshots);
      if (!res?.success) {
        setSavedIdeas(prevSnapshot);
        setSaveError('Không thể lưu ý tưởng vào CSDL gian hàng. Vui lòng thử lại.');
      }
    } catch (err) {
      setSavedIdeas(prevSnapshot);
      setSaveError(seasonalSaveError(err, 'Không thể lưu ý tưởng vào CSDL gian hàng. Vui lòng thử lại.'));
    }
  };

  // Áp dụng ý tưởng vào sản phẩm có sẵn rồi tải lại để thấy thành quả đo từ đơn thật
  const linkIdeaProduct = async (ideaId: string, productId: string, linked: boolean) => {
    const plan = planRefFor();
    if (!plan) throw new Error('missing_plan_ref');
    const res = await analyticsApi.linkSeasonalIdeaProduct({ ...plan, idea_id: ideaId, product_id: productId, linked });
    if (!res?.success) throw new Error('link_failed');
    reload();
  };

  const toggleMilestone = async (idx: number, nextVal?: boolean, ideaId?: string) => {
    const plan = planRefFor();
    if (!plan) {
      setSaveError('Chưa xác định được dịp đang xem, vui lòng tải lại trang.');
      return;
    }
    const campId = plan.camp_id;
    const keyParts = [];
    if (campId) keyParts.push(campId);
    if (ideaId) keyParts.push(ideaId);
    keyParts.push(idx);
    const key = keyParts.join('_');
    const val = nextVal !== undefined ? nextVal : !checkedMilestones[key];
    const prevSnapshot = { ...checkedMilestones };
    setSaveError(null);
    // Bước của ý tưởng chỉ ghi khóa `${idea}_${slot}`; không ghi `${idx}` trần vì đó là khóa mốc chiến dịch
    setCheckedMilestones(prev => ({
      ...prev,
      [key]: val,
      ...(ideaId ? { [`${ideaId}_${idx}`]: val } : { [String(idx)]: val }),
    }));
    try {
      const res = await analyticsApi.toggleSeasonalMilestone(idx, val, plan, ideaId);
      if (!res?.success) {
        setCheckedMilestones(prevSnapshot);
        setSaveError('Không thể cập nhật tiến độ mốc thời gian. Vui lòng thử lại.');
      }
    } catch (err) {
      setCheckedMilestones(prevSnapshot);
      setSaveError(seasonalSaveError(err, 'Không thể cập nhật tiến độ mốc thời gian. Vui lòng thử lại.'));
    }
  };

  const handleToggleCampMilestone = async (campId: string, stageIdx: number) => {
    const plan = planRefFor(campId);
    if (!plan) {
      setSaveError('Chưa xác định được kỳ của dịp này, vui lòng tải lại trang.');
      return;
    }
    const key = `${campId}_${stageIdx}`;
    const nextVal = !checkedMilestones[key];
    const prevSnapshot = { ...checkedMilestones };
    setSaveError(null);
    setCheckedMilestones(prev => ({ ...prev, [key]: nextVal }));
    try {
      const res = await analyticsApi.toggleSeasonalMilestone(stageIdx, nextVal, plan);
      if (!res?.success) {
        setCheckedMilestones(prevSnapshot);
        setSaveError('Không thể cập nhật tiến độ mốc chiến dịch. Vui lòng thử lại.');
      }
    } catch (err) {
      setCheckedMilestones(prevSnapshot);
      setSaveError(seasonalSaveError(err, 'Không thể cập nhật tiến độ mốc chiến dịch. Vui lòng thử lại.'));
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
                sources: [
                  'Lịch sự kiện Việt Nam (calendar_vn)',
                  ocWin?.lead_time_source === 'shop_measured'
                    ? 'Thời gian giao thực tế của shop (p90 đơn đã giao)'
                    : 'Thời gian sản xuất & giao hàng mặc định của dịp (shop chưa đủ đơn đã giao để đo)',
                ],
                howObtained: 'Tính lùi từ ngày lễ: hạn chốt = ngày lễ − thời gian sản xuất & giao hàng; các mốc khác theo khung thời gian của dịp.',
                period: [rdIso || tractionIso, ocWin?.peak_date || cutoffIso],
                n: milestones.length,
                formula: recommendation.calculationBasis,
                confidence: (c.confidence?.level || 'fair') as 'high' | 'fair' | 'preliminary',
                confidenceReason: 'Mốc ngày tính theo công thức từ ngày lễ và thời gian giao; không có số ước lượng.',
                mayBeWrongBecause: ['Thời tiết bất lợi hoặc đơn vị vận chuyển quá tải vào tuần cao điểm.'],
                updatedAt: new Date().toISOString().slice(0, 10),
              },
            };
          });

          // Dữ liệu Nhóm sản phẩm nên cân nhắc: Ưu tiên đọc trực tiếp từ opportunity_clusters thật của BE
          const opportunityClusters: OpportunityCluster[] = (() => {
            if (Array.isArray(data.opportunity_clusters) && data.opportunity_clusters.length > 0) {
              return data.opportunity_clusters as OpportunityCluster[];
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
          const occasionReviews: Record<string, OccasionReview> = (data as any).occasion_reviews || {};

          const savedIdeaItems = Object.entries(savedIdeas)
            .filter(([, v]) => Boolean(v))
            .map(([id]) => {
              const draft = savedIdeaDrafts[id];
              const snap = savedSnapshots[id];
              if (draft?.title) {
                return { id, title: draft.title, subtitle: 'Bản đã chỉnh sửa' };
              }
              if (snap?.title) {
                const kindLabel: Record<string, string> = { ai: 'Ý tưởng AI cho shop', ready: 'Mẫu thị trường', pod: 'Phôi POD', keyword: 'Từ khóa cơ hội' };
                return { id, title: snap.title, subtitle: kindLabel[snap.kind] || 'Ý tưởng đã chọn' };
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

          // Ý tưởng → sản phẩm áp dụng → đơn hợp lệ trong kỳ dịp: BE đo theo source_idea_id, không đoán theo tên
          const outcomeItems = data.idea_outcomes?.items || [];
          const outcomeById = new Map(outcomeItems.map(o => [o.idea_id, o]));
          const campPrefix = activeCamp?.id ? `${activeCamp.id}_` : '';
          const testTarget =
            data.apply_playbooks?.[0]?.steps.find(s => playbookStepKey(s) === 'test')?.target_orders ?? DEFAULT_TEST_ORDERS;
          const ideaProgressList = savedIdeaItems.map(idea => {
            const oc = outcomeById.get(idea.id);
            const ticked = (key: keyof typeof PLAYBOOK_SLOTS) =>
              Boolean(checkedMilestones[`${campPrefix}${idea.id}_${PLAYBOOK_SLOTS[key]}`]);
            // step1Done chỉ tính sản phẩm thật (dùng đếm "ý tưởng đã triển khai"); tick tay vẫn tính vào số bước xong
            const step1Done = Boolean(oc && oc.products.length > 0);
            const listingDone = step1Done || ticked('listing');
            const step2Done = Boolean(oc && oc.orders >= testTarget) || ticked('test');
            const step3Done = ticked('decide');
            const step4Done = Boolean(oc && oc.products.length > 0 && oc.orders > 0) || ticked('produce');
            const step5Done = ticked('cutoff');
            return {
              id: idea.id,
              title: idea.title,
              matchedProductsCount: oc ? oc.products.length : 0,
              ordersCount: oc ? oc.orders : 0,
              revenue: oc ? oc.revenue : 0,
              step1Done,
              completedStepsCount: [listingDone, step2Done, step3Done, step4Done, step5Done].filter(Boolean).length,
              totalStepsCount: 5,
            };
          });
          const implementedIdeasCount = ideaProgressList.filter(item => item.step1Done).length;
          const ideaProductsCount = outcomeItems.reduce((sum, o) => sum + o.products.length, 0);

          const isRefreshing = state.kind === 'loading' && Boolean(lastReadyDataRef.current);

          return (
            <div className={`space-y-6 transition-opacity ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
              {isRefreshing && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Đang cập nhật dữ liệu mới cho dịp đã chọn...
                </div>
              )}
              {(() => {
                const stale = Object.values(data.data_freshness || {}).filter(f => f.stale);
                if (stale.length === 0) return null;
                return (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <strong>Dữ liệu thị trường chưa được cập nhật:</strong>{' '}
                    {stale
                      .map(f => (f.as_of ? `${f.label} thu đến ${f.as_of.slice(8, 10)}/${f.as_of.slice(5, 7)} (${f.age_days} ngày trước)` : `${f.label} chưa có dữ liệu`))
                      .join('; ')}
                    . Các số liên quan có thể đã cũ.
                  </div>
                );
              })()}
              {data.can_save_plan === false && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                  Bạn đang xem gian hàng mẫu nên chỉ xem được, chưa lưu được ý tưởng hay tiến độ. Hãy mở gian hàng để lập kế hoạch của riêng bạn.
                </div>
              )}
              {saveError && (
                <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
                  <span>{saveError}</span>
                  <button
                    type="button"
                    onClick={() => setSaveError(null)}
                    className="ml-3 rounded px-2 py-0.5 text-xs font-semibold hover:bg-rose-100"
                  >
                    Đóng
                  </button>
                </div>
              )}
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
                ideasCount={aiIdeas.length + readyIdeas.length + podBlanks.length}
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

                  {/* Hành động nhanh cho dịp đang xem: dùng đúng chức năng sẵn có của sàn */}
                  {activeCamp && data.can_save_plan !== false && (() => {
                    const voucherHref = occasionVoucherHref(activeCamp);
                    return (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs">
                        <span className="font-semibold text-stone-700">Hành động nhanh · {activeCamp.name}:</span>
                        {voucherHref ? (
                          <Link to={voucherHref} className="rounded-lg border border-[#007700] px-2.5 py-1 font-semibold text-[#007700] hover:bg-[#EAF0E2]/50">
                            Tạo mã giảm giá cho dịp
                          </Link>
                        ) : (
                          <span className="text-stone-400">Đã qua hạn chốt đơn: không tạo mã cho dịp này</span>
                        )}
                        <button type="button" onClick={() => handleSelectTab('potential')} className="rounded-lg border border-stone-200 px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-50">
                          Chọn ý tưởng sản phẩm
                        </button>
                        <button type="button" onClick={() => handleSelectTab('readiness')} className="rounded-lg border border-stone-200 px-2.5 py-1 font-semibold text-stone-700 hover:bg-stone-50">
                          Kiểm tra hàng & số lượng
                        </button>
                      </div>
                    );
                  })()}

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
                      onToggleStar={tag => toggleSaveIdea(`kw_${tag}`, { title: tag, kind: 'keyword', keyword: tag })}
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
                  <PreviousSeasonLessonCard lesson={data.previous_season_lesson} occasionName={activeCamp.name} />

                  {/* 1. Ma trận từ khóa cơ hội (Ưu tiên cao nhất: chọn ngách & gắn thẻ / tạo sản phẩm ngay) */}
                  <OpportunityKeywordTable
                    keywords={data.opportunity_keywords || []}
                    occasionName={activeCamp.name}
                    onOpenEvidence={handleOpenEvidence}
                    savedIdeas={savedIdeas}
                    onToggleStar={tag => toggleSaveIdea(`kw_${tag}`, { title: tag, kind: 'keyword', keyword: tag })}
                  />

                  {/* 2. Hồ sơ sản phẩm tiềm năng (Hàng sẵn & Phôi POD kèm phân tích hòa vốn) */}
                  <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4">
                      <h4 className="text-base font-bold text-stone-900">
                        Sản phẩm tiềm năng
                      </h4>
                    </div>
                    <SeasonalPotentialTab
                      planRef={planRefOf(activeCamp)}
                      readyIdeas={readyIdeas}
                      podBlanks={podBlanks}
                      aiIdeas={aiIdeas}
                      aiIdeasStatus={data.ai_ideas_status}
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
                  <PreviousSeasonLessonCard lesson={data.previous_season_lesson} occasionName={activeCamp.name} />
                  <ApplyPlaybookCard
                    playbooks={data.apply_playbooks}
                    savedIdeas={savedIdeas}
                    savedIdeaItems={savedIdeaItems}
                    aiIdeas={aiIdeas}
                    allShopProducts={allShopProducts}
                    outcomes={outcomeItems}
                    onLinkProduct={data.can_save_plan === false ? null : linkIdeaProduct}
                    checkedMilestones={checkedMilestones}
                    onToggleMilestone={toggleMilestone}
                    onEditSavedIdea={id => {
                      setFocusIdeaId(id);
                      handleSelectTab('act1');
                    }}
                    occasionName={activeCamp.name}
                  />

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
                    planRef={planRefOf(activeCamp)}
                    forecastReview={data.forecast_review}
                    savedIdeaTitles={savedIdeaItems.map(x => x.title)}
                    appliedSummary={{
                      selectedIdeasCount: savedIdeaItems.length,
                      implementedIdeasCount,
                      completedMilestonesCount: ideaProgressList.reduce((acc, curr) => acc + curr.completedStepsCount, 0),
                      totalMilestonesCount: Math.max(1, savedIdeaItems.length) * 5,
                      matchingProductsCount: matchingProducts.length,
                      ideaProductsCount,
                      ideasDetail: ideaProgressList,
                      outcomeTotals: data.idea_outcomes?.totals,
                    }}
                    initialReview={
                      savedReviews[activeCamp.id] ? savedReviews[activeCamp.id].review ?? undefined : occasionReviews[activeCamp.id]
                    }
                    initialIdeaReviews={savedReviews[activeCamp.id]?.ideas ?? (data as any).idea_reviews ?? {}}
                    onReviewSaved={(review, ideas) => setSavedReviews(prev => ({ ...prev, [activeCamp.id]: { review, ideas } }))}
                    canSave={data.can_save_plan !== false}
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
