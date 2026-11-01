import type { ReactNode } from 'react';
import {
  Flame,
  Gift,
  GraduationCap,
  Heart,
  Sparkles,
  Sun,
  Trees,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';

interface SeasonalMonthMatrixProps {
  campaigns: SeasonalCampaign[];
  activeCampId?: string;
  onSelectCampaign: (id: string) => void;
}

export function getCampaignLucideIcon(campId: string): ReactNode {
  switch (campId) {
    case 'halloween':
      return <Flame className="h-4 w-4 text-orange-600" />;
    case 'noel':
      return <Trees className="h-4 w-4 text-emerald-700" />;
    case 'tet':
      return <Sparkles className="h-4 w-4 text-rose-600" />;
    case 'valentine_8_3':
    case 'valentine':
    case '8/3':
      return <Heart className="h-4 w-4 text-pink-600" />;
    case 'he_dulich':
    case '30/4':
      return <Sun className="h-4 w-4 text-amber-500" />;
    case 'tuutuong_trungthu':
    case 'khai_giang':
    case 'trung_thu':
      return <GraduationCap className="h-4 w-4 text-teal-700" />;
    default:
      return <Gift className="h-4 w-4 text-[#007700]" />;
  }
}

export function SeasonalMonthMatrix({
  campaigns,
  activeCampId,
  onSelectCampaign,
}: SeasonalMonthMatrixProps) {
  const currentMonthNum = new Date().getMonth() + 1; // Tháng hiện tại (1 - 12)

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h3 className="m-0 text-base font-bold text-stone-900">Vòng quay mùa vụ 12 tháng</h3>
          <p className="mb-0 mt-1 text-xs text-stone-500">
            Bấm vào một mùa vụ để mở lộ trình chuẩn bị và ý tưởng ra hàng. Vạch đỏ đánh dấu vị trí hôm nay trong chu kỳ năm.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          {/* Header 12 tháng */}
          <div className="mb-3 flex items-center gap-3">
            <div className="w-40 shrink-0 text-xs font-bold text-stone-400">Dịp mùa vụ</div>
            <div className="grid flex-1 grid-cols-12 gap-1.5 text-center text-xs font-bold text-stone-600">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                const isCurrent = m === currentMonthNum;
                return (
                  <div
                    key={m}
                    className={`rounded-md py-1 transition-all ${
                      isCurrent
                        ? 'bg-rose-50 font-extrabold text-rose-600 ring-1 ring-rose-300'
                        : 'text-stone-500'
                    }`}
                  >
                    {isCurrent && (
                      <div className="text-[9.5px] font-black uppercase text-rose-600 leading-none mb-0.5">
                        Hôm nay
                      </div>
                    )}
                    <span>T{m}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danh sách các mùa vụ */}
          <div className="relative space-y-2">
            {/* Vạch đỏ mốc "Hôm nay" chạy dọc qua ma trận */}
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-10 border-l-2 border-rose-500/80"
              style={{
                left: `calc(160px + 12px + ((100% - 172px) / 12) * ${currentMonthNum - 0.5})`,
              }}
            />

            {campaigns.map(camp => {
              const isSelected = activeCampId === camp.id;
              const campMonths = camp.months?.length
                ? camp.months
                : [new Date(camp.launch_window?.peak_date || '').getMonth() + 1];

              return (
                <div
                  key={camp.id}
                  className={`group flex items-center gap-3 rounded-xl p-1.5 transition-all ${
                    isSelected ? 'bg-stone-50/80' : 'hover:bg-stone-50/50'
                  }`}
                >
                  {/* Nút tên chiến dịch */}
                  <button
                    type="button"
                    onClick={() => onSelectCampaign(camp.id)}
                    className={`flex w-40 shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'border border-[#16a34a] bg-[#f0fdf4] text-[#007700] shadow-sm ring-1 ring-[#16a34a]/30'
                        : 'text-stone-700 hover:text-stone-900 bg-white border border-stone-200/80'
                    }`}
                  >
                    <span className="shrink-0">{getCampaignLucideIcon(camp.id)}</span>
                    <span className="line-clamp-2 leading-tight">{camp.name}</span>
                  </button>

                  {/* 12 Capsules tháng */}
                  <div className="grid flex-1 grid-cols-12 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
                      const isPeak = campMonths.includes(m);
                      let capsuleBg = 'bg-stone-100/70';
                      if (isPeak) {
                        capsuleBg = isSelected
                          ? 'bg-[#007700] shadow-sm'
                          : 'bg-[#a7f3d0] hover:bg-[#86efac]';
                      }
                      return (
                        <div
                          key={m}
                          onClick={() => onSelectCampaign(camp.id)}
                          className={`h-7 cursor-pointer rounded-lg transition-all ${capsuleBg} ${
                            isSelected && isPeak ? 'hover:bg-[#005B00]' : 'hover:opacity-85'
                          }`}
                          title={`Tháng ${m}: ${isPeak ? 'Giai đoạn cao điểm' : 'Giai đoạn ngoài mùa'}`}
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
  );
}
