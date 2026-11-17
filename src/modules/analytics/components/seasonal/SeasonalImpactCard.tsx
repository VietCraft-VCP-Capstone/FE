import { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle2, Info, BarChart3, MessageSquare } from 'lucide-react';
import type { SeasonalImpact } from '../../types';
import { money } from '../../../../shared/utils/format';
import { analyticsApi } from '../../services/analyticsApi';

interface Props {
  impact?: SeasonalImpact;
  occasionName: string;
  campId?: string;
  savedIdeaTitles?: string[];
  appliedSummary?: {
    selectedIdeasCount: number;
    completedMilestonesCount: number;
    totalMilestonesCount: number;
    matchingProductsCount: number;
  };
  initialReview?: { rating?: 'good' | 'neutral' | 'poor'; note?: string; updated_at?: string };
}

export function SeasonalImpactCard({
  impact,
  occasionName,
  campId,
  savedIdeaTitles = [],
  appliedSummary,
  initialReview,
}: Props) {
  const [rating, setRating] = useState<'good' | 'neutral' | 'poor'>(initialReview?.rating || 'good');
  const [note, setNote] = useState<string>(initialReview?.note || '');
  const [saving, setSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    setRating(initialReview?.rating || 'good');
    setNote(initialReview?.note || '');
  }, [initialReview?.rating, initialReview?.note, campId]);

  const handleSaveReview = async () => {
    if (!campId) return;
    setSaving(true);
    try {
      await analyticsApi.saveSeasonalReview({ camp_id: campId, rating, note });
      setReviewMsg('Đã lưu đánh giá thành quả cho dịp này.');
      setTimeout(() => setReviewMsg(null), 3000);
    } catch {
      setReviewMsg('Không thể lưu đánh giá lúc này.');
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

  const phaseLabel = {
    upcoming: 'Trước mùa (Dự phóng kỳ vọng)',
    running: 'Đang diễn ra (Theo dõi thực tế vs Kịch bản nền)',
    ended: 'Sau mùa (Tổng kết đối chứng)',
  }[impact.phase];

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#007700]" />
            <h4 className="m-0 text-sm sm:text-base font-bold text-stone-900">
              Thành quả áp dụng vs Kịch bản không áp dụng ({occasionName})
            </h4>
          </div>
          <p className="mt-0.5 mb-0 text-xs text-stone-500">
            Cửa sổ đo lường: {impact.window[0]} → {impact.window[1]} · {phaseLabel}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
          {impact.status === 'measured'
            ? 'Đo trực tiếp từ đơn hoàn tất'
            : impact.status === 'projected'
            ? 'Dự phóng từ nền 8 tuần × Mô hình'
            : 'Chưa đủ dữ liệu nền'}
        </span>
      </div>

      {appliedSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs">
          <div>
            <span className="text-[11px] text-stone-500 block">Ý tưởng đã chọn (Bước Ý tưởng)</span>
            <strong className="text-sm text-stone-900">{appliedSummary.selectedIdeasCount} ý tưởng</strong>
          </div>
          <div>
            <span className="text-[11px] text-stone-500 block">Tiến độ thực thi (Bước Áp dụng)</span>
            <strong className="text-sm text-[#007700]">
              {appliedSummary.completedMilestonesCount}/{appliedSummary.totalMilestonesCount} mốc hoàn thành
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-stone-500 block">Sản phẩm sẵn sàng cho dịp</span>
            <strong className="text-sm text-stone-900">{appliedSummary.matchingProductsCount} sản phẩm</strong>
          </div>
        </div>
      )}

      {impact.status === 'insufficient' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950 flex items-start gap-2.5">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <strong>Chưa đủ đơn nền 8 tuần trước dịp để dựng kịch bản phản thực (counterfactual).</strong>
            <p className="mt-1 mb-0 text-amber-900/90">
              Hệ thống cần đơn hàng hoàn tất trong 8 tuần trước cửa sổ sự kiện để ước lượng mức đơn nếu không áp dụng ý tưởng. Khi shop phát sinh đơn, bảng đối chứng sẽ tự động cập nhật.
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
              <div className="text-[11px] text-stone-500">Nếu không áp dụng (Phản thực P50)</div>
              <div className="mt-1 text-xl font-black text-stone-900">
                {impact.counterfactual_orders.p50.toFixed(0)} đơn
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500">
                80%: {impact.counterfactual_orders.p10.toFixed(0)} – {impact.counterfactual_orders.p90.toFixed(0)} đơn
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
              <div className="text-[11px] text-stone-500">Chênh lệch vs Phản thực</div>
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
              <div className="text-[11px] text-stone-500">Đóng góp từ ý tưởng gợi ý</div>
              <div className="mt-1 text-xl font-black text-stone-900">
                {impact.adopted_orders ?? 0} đơn ({impact.adopted_share_pct ?? 0}%)
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500">
                {impact.adopted_gmv ? money(impact.adopted_gmv) : '0đ'}
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
              Đang theo dõi {savedIdeaTitles.length} ý tưởng đã chọn
            </span>
          )}
        </div>

        {savedIdeaTitles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {savedIdeaTitles.map(t => (
              <span key={t} className="rounded-md bg-white border border-stone-200 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'good', label: 'Áp dụng tốt · Đạt kỳ vọng' },
            { id: 'neutral', label: 'Trung bình · Cần tối ưu thêm' },
            { id: 'poor', label: 'Chưa hiệu quả' },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRating(opt.id as any)}
              className={`rounded-lg border px-3 py-1.5 font-semibold transition-colors ${
                rating === opt.id
                  ? 'border-[#007700] bg-emerald-50 text-[#007700]'
                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ghi chú bài học rút ra (ví dụ: combo 2 món bán chạy hơn bán lẻ, cần mở bán sớm hơn 1 tuần)..."
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-[#007700]"
          />
          <button
            type="button"
            disabled={saving || !campId}
            onClick={handleSaveReview}
            className="shrink-0 rounded-lg bg-[#007700] px-4 py-2 text-xs font-bold text-white hover:bg-[#005B00] transition-colors"
          >
            {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
          </button>
        </div>

        {reviewMsg && <div className="text-[11px] font-semibold text-[#007700]">{reviewMsg}</div>}
      </div>
    </div>
  );
}

