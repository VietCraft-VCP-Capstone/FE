import { useState } from 'react';
import {
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Layers,
  RotateCw,
  Store,
} from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { getCampaignLucideIcon } from './SeasonalMonthMatrix';

export const CATEGORY_OPTIONS = [
  { value: 'thoi-trang', label: 'Thời trang & May mặc' },
  { value: 'gia-dung', label: 'Gia dụng & Đồ uống' },
  { value: 'phu-kien', label: 'Phụ kiện & Túi' },
  { value: 'trang-tri', label: 'Trang trí nhà cửa' },
];

interface SeasonalHeaderProps {
  shopName?: string;
  categoryName?: string;
  categorySlug: string;
  onSelectCategory: (slug: string) => void;
  activeCamp?: SeasonalCampaign;
  savedIdeasCount: number;
  onReload?: () => void;
}

export function SeasonalHeader({
  shopName,
  categoryName,
  categorySlug,
  onSelectCategory,
  activeCamp,
  savedIdeasCount,
  onReload,
}: SeasonalHeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleReload = () => {
    if (isSyncing || !onReload) return;
    setIsSyncing(true);
    onReload();
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* 1. THANH ĐỊNH VỊ GIAN HÀNG & PHẠM VI PHÂN TÍCH (CONTROL DECK) */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-gradient-to-r from-stone-50/90 via-white to-emerald-50/30 p-4 sm:p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Nhận diện Gian hàng & Ngành phân tích */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#007700] via-[#005B00] to-emerald-900 text-white shadow-md shadow-emerald-950/15 ring-4 ring-emerald-50/90">
              <Store className="h-6 w-6 text-emerald-100" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-2 ring-white">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="m-0 font-vietnam text-lg sm:text-2xl font-bold tracking-tight text-stone-900">
                  Kế hoạch Cao điểm
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#005B00] border border-emerald-200 shadow-2xs font-vietnam">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#007700]" />
                  <span>{shopName || 'SNOWKAT'} · Chính thức</span>
                </span>
              </div>

              <p className="mb-0 mt-1 font-vietnam text-xs sm:text-sm text-stone-500 font-normal leading-relaxed">
                Dự đoán số đơn và gợi ý sản phẩm cho từng dịp mua sắm.
              </p>
            </div>
          </div>

          {/* Công cụ điều khiển: Nút đồng bộ & Bộ chọn ngành hàng */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {onReload && (
              <button
                type="button"
                onClick={handleReload}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-xs font-medium font-vietnam text-stone-700 shadow-2xs transition-all hover:border-[#007700] hover:text-[#007700] hover:bg-emerald-50/40 active:scale-95 disabled:opacity-60 cursor-pointer"
                title="Đồng bộ ngay dữ liệu đơn hàng mới nhất từ database shop"
              >
                <RotateCw
                  className={`h-3.5 w-3.5 text-[#007700] transition-transform ${
                    isSyncing ? 'animate-spin' : ''
                  }`}
                />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ đơn mới'}</span>
              </button>
            )}

            {/* Custom Styled Category Selector */}
            <div className="relative inline-flex items-center font-vietnam" title={categoryName ? `Ngành hàng: ${categoryName}` : 'Chọn ngành hàng phân tích'}>
              <Layers className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-stone-400" />
              <select
                aria-label="Chọn ngành hàng phân tích"
                value={categorySlug}
                onChange={e => onSelectCategory(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-stone-200/90 bg-white pl-8.5 pr-8 py-2 text-xs font-medium text-stone-800 shadow-2xs transition-all hover:border-[#007700] focus:border-[#007700] focus:ring-2 focus:ring-[#007700]/20 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-stone-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TIÊU ĐIỂM DỊP CAO ĐIỂM ĐANG CHỌN (OCCASION SPOTLIGHT) */}
      {activeCamp && (
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-gradient-to-r from-[#FAFDF8] via-white to-stone-50/70 p-4 sm:p-5 shadow-2xs transition-all">
          {/* Dải chỉ màu xanh thủ công VietCraft bên trái */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#007700]" />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pl-1">
            {/* Cột trái: Biểu tượng dịp + Tên chiến dịch + Giai đoạn + Mô tả */}
            <div className="flex items-start gap-3.5">
              {/* Emblem Dịp cao điểm */}
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#007700] border border-emerald-200/70 shadow-2xs">
                {getCampaignLucideIcon(activeCamp.id)}
              </div>

              <div className="min-w-0">
                {/* Meta tags: Phân loại dịp & Hạn chốt đơn */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {activeCamp.badge && (
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider font-vietnam">
                      {activeCamp.badge}
                    </span>
                  )}
                  {activeCamp.badge && activeCamp.timing && (
                    <span className="text-stone-300">•</span>
                  )}
                  {activeCamp.timing && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/80 font-vietnam">
                      <Clock className="h-3 w-3 text-emerald-700" />
                      <span>{activeCamp.timing.label}</span>
                    </span>
                  )}
                </div>

                {/* Tên Dịp mua sắm */}
                <h2 className="m-0 font-vietnam text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                  {activeCamp.name}
                </h2>

                {/* Mô tả chiến dịch */}
                <p className="mb-0 mt-1 font-vietnam text-xs sm:text-sm text-stone-600 font-normal leading-relaxed max-w-2xl">
                  {activeCamp.description ||
                    'Lên kế hoạch sản xuất, đón đầu sức mua dịp cao điểm lớn.'}
                </p>
              </div>
            </div>

            {/* Cột phải: Sổ tay ý tưởng đã gom */}
            <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto border-t lg:border-t-0 lg:border-l border-stone-200/80 pt-3 lg:pt-0 lg:pl-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#007700] border border-emerald-200/60 shadow-2xs">
                  <BookmarkCheck className="h-5 w-5" />
                </div>
                <div className="font-vietnam">
                  <div className="text-xs font-normal text-stone-500">
                    Sổ tay kế hoạch
                  </div>
                  <div className="text-sm font-semibold text-stone-800 flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-bold text-[#007700] tabular-nums">
                      {savedIdeasCount}
                    </span>
                    <span>ý tưởng đã chọn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
