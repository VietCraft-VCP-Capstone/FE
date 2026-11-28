import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, Info, BarChart3, MessageSquare } from 'lucide-react';
import type { SeasonalForecastReview, SeasonalIdeaOutcomeReport, SeasonalImpact } from '../../types';
import { money } from '../../../../shared/utils/format';
import { analyticsApi, seasonalSaveError, type SeasonalPlanRef } from '../../services/analyticsApi';

export interface IdeaProgressItem {
  id: string;
  title: string;
  matchedProductsCount: number;
  ordersCount: number;
  revenue?: number;
  step1Done: boolean;
  completedStepsCount: number;
  totalStepsCount: number;
}

export interface AppliedSummary {
  selectedIdeasCount: number;
  implementedIdeasCount?: number;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  matchingProductsCount: number;
  ideaProductsCount?: number;
  ideasDetail?: IdeaProgressItem[];
  /** Tổng đơn/doanh thu của sản phẩm áp dụng ý tưởng trong kỳ dịp (BE đo từ đơn hợp lệ) */
  outcomeTotals?: SeasonalIdeaOutcomeReport['totals'];
}

interface Props {
  impact?: SeasonalImpact;
  occasionName: string;
  campId?: string;
  /** kỳ dịp (mã + năm) để lưu đánh giá đúng kỳ */
  planRef?: SeasonalPlanRef | null;
  savedIdeaTitles?: string[];
  appliedSummary?: AppliedSummary;
  initialReview?: OccasionReview;
  /** Đánh giá riêng từng ý tưởng đã lưu, theo ID ý tưởng */
  initialIdeaReviews?: Record<string, IdeaReviewValue>;
  /** Báo trang cha đánh giá vừa lưu, để chuyển tab quay lại vẫn thấy đúng lựa chọn */
  onReviewSaved?: (review: OccasionReview | null, ideaReviews: Record<string, IdeaReviewValue>) => void;
  /** false ở gian hàng mẫu: chỉ xem, không lưu được */
  canSave?: boolean;
  /** sau lễ: dự báo đã lưu so với thực tế */
  forecastReview?: SeasonalForecastReview | null;
}

type ReviewRating = 'good' | 'neutral' | 'poor';
export interface OccasionReview {
  rating?: ReviewRating;
  note?: string;
  updated_at?: string;
}
export interface IdeaReviewValue {
  rating: ReviewRating;
  note: string;
  updated_at?: string;
}

const RATING_OPTIONS: Array<{ id: ReviewRating; label: string; short: string; on: string }> = [
  { id: 'good', label: 'Áp dụng tốt · Đạt kỳ vọng', short: 'Tốt', on: 'border-[#007700] bg-emerald-50 text-[#007700]' },
  { id: 'neutral', label: 'Trung bình · Cần tối ưu thêm', short: 'Trung bình', on: 'border-amber-500 bg-amber-50 text-amber-800' },
  { id: 'poor', label: 'Chưa hiệu quả', short: 'Chưa hiệu quả', on: 'border-rose-400 bg-rose-50 text-rose-700' },
];

/** Bộ chọn mức đánh giá; bấm lại mức đang chọn để bỏ chọn */
function RatingPicker({ value, onChange, compact = false, label }: {
  value: ReviewRating | null;
  onChange: (v: ReviewRating | null) => void;
  compact?: boolean;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {RATING_OPTIONS.map(opt => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(value === opt.id ? null : opt.id)}
          className={`rounded-lg border font-semibold transition-colors ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1.5 text-xs'} ${
            value === opt.id ? opt.on : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          {compact ? opt.short : opt.label}
        </button>
      ))}
    </div>
  );
}

type IdeaDraft = { rating: ReviewRating | null; note: string };
const toDrafts = (m?: Record<string, IdeaReviewValue>): Record<string, IdeaDraft> =>
  Object.fromEntries(Object.entries(m || {}).map(([id, v]) => [id, { rating: v.rating, note: v.note || '' }]));

const VERDICT_LABEL = { below: 'thấp hơn khoảng', within: 'nằm trong khoảng', above: 'cao hơn khoảng' } as const;

function ForecastReviewBlock({ review }: { review: SeasonalForecastReview }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs text-stone-700 space-y-1.5">
      <div className="font-semibold text-stone-900">
        Độ chính xác của dự báo: {review.hits}/{review.n} lần khoảng dự báo chứa số đơn thực tế ({review.coverage_pct}%)
      </div>
      <ul className="m-0 list-none p-0 space-y-0.5 tabular-nums">
        {review.items.map(it => (
          <li key={it.days_to_event}>
            Trước lễ {it.days_to_event} ngày: dự báo {it.expected.p10}–{it.expected.p90} đơn (nếu bán như ngày thường) · thực tế {review.actual} đơn, {VERDICT_LABEL[it.verdict]}
          </li>
        ))}
      </ul>
      <div className="text-[11px] text-stone-500">Dự báo chỉ tính nhịp bán ngày thường; thực tế cao hơn khoảng nghĩa là dịp này kéo thêm đơn so với ngày thường.</div>
    </div>
  );
}

export function SeasonalImpactCard({
  impact,
  occasionName,
  campId,
  planRef,
  savedIdeaTitles = [],
  appliedSummary,
  initialReview,
  initialIdeaReviews,
  onReviewSaved,
  canSave = true,
  forecastReview,
}: Props) {
  // Chưa lưu đánh giá thì không chọn sẵn mức nào, tránh trông như đã đánh giá "Áp dụng tốt"
  const [rating, setRating] = useState<ReviewRating | null>(initialReview?.rating ?? null);
  const [note, setNote] = useState<string>(initialReview?.note || '');
  const [ideaDrafts, setIdeaDrafts] = useState<Record<string, IdeaDraft>>(() => toDrafts(initialIdeaReviews));
  const [saving, setSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    setRating(initialReview?.rating ?? null);
    setNote(initialReview?.note || '');
  }, [initialReview?.rating, initialReview?.note, campId]);

  const initialIdeaKey = JSON.stringify(initialIdeaReviews || {});
  useEffect(() => {
    setIdeaDrafts(toDrafts(initialIdeaReviews));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIdeaKey, campId]);

  const appliedIdeaIds = new Set((appliedSummary?.ideasDetail || []).filter(i => i.step1Done).map(i => i.id));
  const ratedIdeas = Object.entries(ideaDrafts).filter(([id, d]) => d.rating && appliedIdeaIds.has(id));
  const hasAnyRating = Boolean(rating) || ratedIdeas.length > 0;

  const setIdeaDraft = (id: string, patch: Partial<IdeaDraft>) =>
    setIdeaDrafts(prev => ({ ...prev, [id]: { ...(prev[id] ?? { rating: null, note: '' }), ...patch } }));

  const handleSaveReview = async () => {
    if (!campId || !planRef || !hasAnyRating) return;
    setSaving(true);
    try {
      const ideaPayload = Object.fromEntries(
        ratedIdeas.map(([id, d]) => [id, { rating: d.rating as ReviewRating, note: d.note.trim() }]),
      );
      const res = await analyticsApi.saveSeasonalReview({ ...planRef, rating, note, idea_reviews: ideaPayload });
      if (!res?.success) throw new Error('save_failed');
      const now = new Date().toISOString();
      onReviewSaved?.(
        res.occasion_reviews?.[campId] ?? (rating ? { rating, note, updated_at: now } : null),
        res.idea_reviews ?? Object.fromEntries(Object.entries(ideaPayload).map(([id, v]) => [id, { ...v, updated_at: now }])),
      );
      setReviewMsg('Đã lưu đánh giá thành quả cho dịp này.');
      setTimeout(() => setReviewMsg(null), 3000);
    } catch (err) {
      setReviewMsg(seasonalSaveError(err, 'Không thể lưu đánh giá lúc này.'));
      setTimeout(() => setReviewMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };
  if (!impact) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-xs text-stone-600">
        Chưa có dữ liệu đối soát thành quả cho dịp {occasionName}.
      </div>
    );
  }

  const appliedIdeas = (appliedSummary?.ideasDetail || []).filter(item => item.step1Done);
  const lastSavedAt = [initialReview?.updated_at, ...Object.values(initialIdeaReviews || {}).map(r => r.updated_at)]
    .filter((s): s is string => Boolean(s))
    .sort()
    .pop();

  const phaseLabel = {
    upcoming: 'Trước mùa (Mức nếu bán như ngày thường)',
    running: 'Đang diễn ra (Thực tế so với mức ngày thường)',
    ended: 'Sau mùa (Tổng kết so với ngày thường)',
  }[impact.phase];

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      {forecastReview && <ForecastReviewBlock review={forecastReview} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#007700]" />
            <h4 className="m-0 text-sm sm:text-base font-bold text-stone-900">
              Thành quả so với bán như ngày thường ({occasionName})
            </h4>
          </div>
          <p className="mt-0.5 mb-0 text-xs text-stone-500">
            Cửa sổ đo lường: {impact.window[0]} → {impact.window[1]} · {phaseLabel}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
          {impact.status === 'measured'
            ? 'Đo trực tiếp từ đơn hợp lệ (không gồm hủy, hoàn tiền)'
            : impact.status === 'projected'
            ? 'Dự phóng từ nền 8 tuần × Mô hình'
            : 'Chưa đủ dữ liệu nền'}
        </span>
      </div>

      {appliedSummary && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs">
            <div>
              <span className="text-[11px] text-stone-500 block">Ý tưởng đã chọn (Bước Ý tưởng)</span>
              <strong className="text-sm text-stone-900">{appliedSummary.selectedIdeasCount} ý tưởng</strong>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block">Tiến độ đưa vào thực tế</span>
              <strong className="text-sm text-[#007700]">
                {appliedSummary.selectedIdeasCount > 0
                  ? `${appliedSummary.implementedIdeasCount ?? (appliedSummary.completedMilestonesCount > 0 ? 1 : 0)}/${appliedSummary.selectedIdeasCount} ý tưởng đã ra SP`
                  : 'Chưa chọn ý tưởng'}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block">Sản phẩm sẵn sàng cho dịp</span>
              <strong className="text-sm text-stone-900">
                {appliedSummary.matchingProductsCount} sản phẩm
                {(appliedSummary.ideaProductsCount ?? 0) > 0 && (
                  <span className="ml-1 text-[11px] font-semibold text-[#007700]">
                    ({appliedSummary.ideaProductsCount} từ ý tưởng)
                  </span>
                )}
              </strong>
            </div>
          </div>

          {appliedSummary.outcomeTotals && appliedSummary.outcomeTotals.ideas_listed > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs">
              <div>
                <span className="text-[11px] text-stone-500 block">Đơn từ sản phẩm của ý tưởng (kỳ dịp)</span>
                <strong className="text-sm text-stone-900">{appliedSummary.outcomeTotals.orders} đơn</strong>
                {appliedSummary.outcomeTotals.share_of_shop_orders_pct != null && (
                  <span className="ml-1 text-[11px] text-stone-500">
                    ({appliedSummary.outcomeTotals.share_of_shop_orders_pct}% đơn của shop trong kỳ)
                  </span>
                )}
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Sản phẩm bán ra</span>
                <strong className="text-sm text-stone-900">{appliedSummary.outcomeTotals.units}</strong>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Doanh thu hàng (chưa trừ phí)</span>
                <strong className="text-sm text-[#007700]">{money(appliedSummary.outcomeTotals.revenue)}</strong>
              </div>
            </div>
          )}

          {/* Chi tiết tiến độ thực thi từng ý tưởng độc lập */}
          {appliedSummary.ideasDetail && appliedSummary.ideasDetail.length > 0 && (
            <div className="rounded-xl border border-stone-200/90 bg-stone-50/40 p-3 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                <span className="font-bold text-stone-800">
                  Chi tiết tiến độ thực thi theo từng ý tưởng riêng biệt:
                </span>
                <span className="text-[11px] text-stone-500">
                  (Mỗi ý tưởng theo dõi độc lập 5 mốc: Đăng listing → Thử nhỏ → Quyết định → Nhập hàng → Hạn chốt)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {appliedSummary.ideasDetail.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-stone-900 truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {item.step1Done ? (
                          <span className="text-[#007700] font-medium">
                            Đã tạo {item.matchedProductsCount} SP · Đạt {item.completedStepsCount}/{item.totalStepsCount} mốc
                            {item.ordersCount > 0 ? ` · ${item.ordersCount} đơn · ${money(item.revenue ?? 0)}` : ' · chưa có đơn trong kỳ'}
                          </span>
                        ) : (
                          <span className="text-amber-700">Chưa có sản phẩm áp dụng ý tưởng · {item.completedStepsCount}/{item.totalStepsCount} mốc</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.step1Done
                          ? 'bg-emerald-100 text-[#007700]'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {item.step1Done ? 'Đã lên SP' : 'Chưa lên SP'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {impact.status === 'insufficient' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950 flex items-start gap-2.5">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <strong>Chưa đủ đơn nền 8 tuần trước dịp để tính mức bán như ngày thường.</strong>
            <p className="mt-1 mb-0 text-amber-900/90">
              Hệ thống cần đơn hợp lệ trong 8 tuần trước cửa sổ sự kiện để ước lượng mức đơn nếu bán như ngày thường. Khi shop phát sinh đơn, bảng đối chứng sẽ tự động cập nhật.
            </p>
          </div>
        </div>
      )}

      {impact.status === 'projected' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="text-[11px] text-stone-500">Kỳ vọng đơn trong cửa sổ dịp (P50)</div>
            <div className="mt-1 text-xl font-black text-emerald-900">
              {impact.expected_orders_p50 ?? '—'} đơn
            </div>
            <div className="mt-0.5 text-[11px] text-stone-600">
              Khoảng tin cậy 80%: {impact.expected_orders_p10 ?? '—'} – {impact.expected_orders_p90 ?? '—'} đơn
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
            <div className="text-[11px] text-stone-500">Doanh thu kỳ vọng (GMV P50)</div>
            <div className="mt-1 text-xl font-black text-stone-900">
              {impact.expected_gmv_p50 ? money(impact.expected_gmv_p50) : '—'}
            </div>
            <div className="mt-0.5 text-[11px] text-stone-600">
              Nhịp nền hiện tại: {impact.baseline_orders_per_day ?? 0} đơn/ngày ({impact.baseline_n} đơn nền)
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
            <div className="text-[11px] text-stone-500">Từ khóa ý tưởng đang theo dõi</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {impact.adopted_keywords.length > 0 ? (
                impact.adopted_keywords.map(k => (
                  <span key={k} className="rounded-md bg-white border border-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                    {k}
                  </span>
                ))
              ) : (
                <span className="text-xs text-stone-400">Chưa có từ khóa theo dõi</span>
              )}
            </div>
          </div>
        </div>
      )}

      {impact.status === 'measured' && impact.counterfactual_orders && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
              <div className="text-[11px] text-stone-500">Đơn thực tế trong dịp</div>
              <div className="mt-1 text-xl font-black text-emerald-900">{impact.actual_orders ?? 0} đơn</div>
              <div className="mt-0.5 text-[11px] text-stone-600">
                GMV: {impact.gmv ? money(impact.gmv) : '0đ'}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="text-[11px] text-stone-500">Nếu bán như ngày thường (P50)</div>
              <div className="mt-1 text-xl font-black text-stone-900">
                {impact.counterfactual_orders.p50.toFixed(0)} đơn
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500">
                80%: {impact.counterfactual_orders.p10.toFixed(0)} – {impact.counterfactual_orders.p90.toFixed(0)} đơn
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="text-[11px] text-stone-500">Chênh lệch so với ngày thường</div>
              <div className={`mt-1 text-xl font-black ${(impact.lift_vs_counterfactual_pct ?? 0) >= 0 ? 'text-[#007700]' : 'text-amber-700'}`}>
                {impact.lift_vs_counterfactual_pct != null ? `${impact.lift_vs_counterfactual_pct > 0 ? '+' : ''}${impact.lift_vs_counterfactual_pct}%` : '—'}
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500 flex items-center gap-1">
                {impact.beats_p90 ? (
                  <>
                    <CheckCircle2 size={11} className="text-emerald-600" /> Vượt ngưỡng P90 mô hình
                  </>
                ) : (
                  <>
                    <TrendingUp size={11} className="text-stone-400" /> Trong dải dự báo 80%
                  </>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="text-[11px] text-stone-500">Đóng góp từ ý tưởng</div>
              <div className="mt-1 text-xl font-black text-stone-900">
                {impact.adopted_orders ?? 0} đơn ({impact.adopted_share_pct ?? 0}%)
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500">
                {impact.adopted_gmv ? money(impact.adopted_gmv) : '0đ'}
                {impact.adopted_basis === 'source_idea_id' ? ' · từ sản phẩm gắn ý tưởng' : ' · khớp tên với từ khóa gợi ý'}
              </div>
            </div>
          </div>

          {impact.previous_season && (
            <div className="rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-stone-700 flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong>So cùng kỳ mùa trước:</strong> {impact.previous_season.orders_same_period} đơn trong cùng số ngày đã qua (tổng cả mùa trước: {impact.previous_season.orders_total} đơn).
              </span>
              {impact.previous_season.yoy_pct != null && (
                <span className="font-bold text-[#007700]">
                  YoY: {impact.previous_season.yoy_pct > 0 ? '+' : ''}{impact.previous_season.yoy_pct}%
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Đánh giá & Rút kinh nghiệm sau khi áp dụng ý tưởng */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
            <MessageSquare size={15} className="text-[#007700]" />
            <span>Đánh giá hiệu quả áp dụng ý tưởng ({occasionName})</span>
          </div>
          {savedIdeaTitles.length > 0 && (
            <span className="text-[11px] text-stone-500">
              {appliedIdeas.length}/{savedIdeaTitles.length} ý tưởng đã chọn đã áp dụng
            </span>
          )}
        </div>

        <p className="m-0 text-[11px] text-stone-500">
          Đánh giá và ghi chú sẽ được nhắc lại ở {occasionName} năm sau, và AI dùng chúng (cùng số đơn thật của từng ý tưởng) để gợi ý ý tưởng mới.
        </p>

        {/* Đánh giá riêng từng ý tưởng đã áp dụng (đã có sản phẩm), kèm kết quả thật của ý tưởng đó */}
        {appliedIdeas.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-stone-600">Đánh giá từng ý tưởng đã áp dụng</div>
            {appliedIdeas.map(item => {
              const d = ideaDrafts[item.id] || { rating: null, note: '' };
              return (
                <div key={item.id} className="space-y-1.5 rounded-lg border border-stone-200 bg-white p-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
                    <span className="min-w-0 truncate font-semibold text-stone-900" title={item.title}>{item.title}</span>
                    <span className={`shrink-0 text-[11px] font-semibold ${item.ordersCount > 0 ? 'text-[#007700]' : 'text-amber-700'}`}>
                      {item.matchedProductsCount} SP · {item.ordersCount > 0 ? `${item.ordersCount} đơn · ${money(item.revenue ?? 0)}` : '0 đơn trong kỳ'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                    <RatingPicker
                      compact
                      label={`Đánh giá ý tưởng ${item.title}`}
                      value={d.rating}
                      onChange={v => setIdeaDraft(item.id, { rating: v })}
                    />
                    <input
                      type="text"
                      maxLength={300}
                      value={d.note}
                      disabled={!d.rating}
                      onChange={e => setIdeaDraft(item.id, { note: e.target.value })}
                      placeholder={d.rating ? 'Vì sao? (vd: size lệch, khách hỏi màu khác, giá cao...)' : 'Chọn mức để ghi chú'}
                      aria-label={`Ghi chú cho ý tưởng ${item.title}`}
                      className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[11px] text-stone-900 outline-none focus:border-[#007700] disabled:bg-stone-50"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          savedIdeaTitles.length > 0 && (
            <div className="text-[11px] text-amber-700">
              Chưa ý tưởng nào được áp dụng (chưa có sản phẩm tạo hoặc gắn từ ý tưởng). Hãy áp dụng ở tab Áp dụng để đánh giá từng ý tưởng.
            </div>
          )
        )}

        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-stone-600">Đánh giá chung cả dịp (không bắt buộc)</div>
          <RatingPicker label="Đánh giá chung cả dịp" value={rating} onChange={setRating} />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ghi chú chung (ví dụ: combo 2 món bán chạy hơn bán lẻ, cần mở bán sớm hơn 1 tuần)..."
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#007700]"
          />
          <button
            type="button"
            disabled={saving || !hasAnyRating || !canSave || !campId || !planRef}
            onClick={handleSaveReview}
            title={!hasAnyRating ? 'Chọn mức cho ít nhất một ý tưởng hoặc cho cả dịp' : undefined}
            className="shrink-0 rounded-lg bg-[#007700] px-4 py-2 text-xs font-bold text-white hover:bg-[#005B00] transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#007700]"
          >
            {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
          </button>
        </div>

        {reviewMsg ? (
          <div className="text-[11px] font-semibold text-[#007700]">{reviewMsg}</div>
        ) : !canSave ? (
          <div className="text-[11px] text-stone-500">Gian hàng mẫu chỉ xem được, chưa lưu được đánh giá.</div>
        ) : lastSavedAt ? (
          <div className="text-[11px] text-stone-500">
            Đã lưu ngày {new Date(lastSavedAt).toLocaleDateString('vi-VN')}
          </div>
        ) : (
          <div className="text-[11px] text-stone-500">Chưa đánh giá dịp này. Chọn mức cho từng ý tưởng (hoặc cả dịp) rồi bấm Lưu.</div>
        )}
      </div>
    </div>
  );
}

