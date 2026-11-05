import { Database, Search } from 'lucide-react';
import type { SeasonalCampaign, SeasonalForecast } from '../../types';
import type { Evidence, OccasionTraitItem } from '../../types/evidence';
import { StlDecompositionChart } from '../charts/StlDecompositionChart';
import { OccasionTraitChart } from './OccasionTraitChart';

interface SeasonalTrendsTabProps {
  decomposition: SeasonalForecast['decomposition'];
  primaryKeyword?: string;
  activeCamp: SeasonalCampaign;
  traits: OccasionTraitItem[];
  sampleSizeN?: number;
  measuredCycles?: number;
  onOpenEvidence: (evidence: Evidence) => void;
  categoryName?: string;
}

export function SeasonalTrendsTab({
  decomposition,
  primaryKeyword,
  activeCamp,
  traits,
  sampleSizeN = 1200,
  measuredCycles = 2,
  onOpenEvidence,
  categoryName = 'Thời trang & Thủ công',
}: SeasonalTrendsTabProps) {
  const campName = activeCamp.name || 'Dịp cao điểm';

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Biểu đồ 6 trục Đặc điểm mua sắm của dịp (thay thế hoàn toàn Radar cũ) */}
      <OccasionTraitChart
        occasionName={campName}
        categoryName={categoryName}
        measuredCycles={measuredCycles}
        sampleSizeN={sampleSizeN}
        traits={traits}
        onOpenEvidence={onOpenEvidence}
      />

      {/* 2. Phân rã sóng nhu cầu Google Trends STL */}
      {decomposition ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div>
              <h4 className="font-bold text-stone-900 text-sm">
                Phân rã sóng tìm kiếm Google Trends VN (Thuật toán LOESS)
              </h4>
              <p className="text-xs text-stone-500">
                Tách riêng sóng định kỳ (Seasonal) khỏi xu hướng tăng trưởng nền dài hạn (Trend) của từ khóa "{primaryKeyword || activeCamp.name}"
              </p>
            </div>
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
              52 tuần liên tục
            </span>
          </div>

          <StlDecompositionChart
            decomposition={decomposition}
            keyword={primaryKeyword || activeCamp.name || 'Nhu cầu'}
          />

          <div className="flex items-center gap-2 pt-2 text-[11px] text-stone-500 border-t border-stone-100">
            <Database size={13} className="text-[#007700] shrink-0" />
            <span>
              <strong>Căn cứ:</strong> Dữ liệu từ khóa Google Trends Việt Nam. Chỉ hiển thị như thông tin phụ trợ để seller quan sát thời điểm nhu cầu bắt đầu nhen nhóm.
            </span>
          </div>
        </div>
      ) : null}

      {/* 3. Từ khóa tìm kiếm liên quan */}
      {activeCamp.search_keywords && activeCamp.search_keywords.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
            <Search size={14} className="text-[#007700]" />
            <span>Các từ khóa tìm kiếm tăng nhanh nhất của dịp này:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {activeCamp.search_keywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-lg bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-800 border border-stone-200 hover:bg-stone-100 transition-colors"
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
