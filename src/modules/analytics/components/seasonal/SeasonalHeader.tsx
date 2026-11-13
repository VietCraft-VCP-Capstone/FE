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

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-stone-600 block sm:hidden">
                  Gian hàng
                </span>
                <h2 className="font-jakarta text-base sm:text-lg font-black tracking-tight text-stone-900 flex items-center gap-2">
                  <span>Gian hàng: {shopName || 'SNOWKAT Official'}</span>
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-[#005B00] border border-emerald-300/80 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#007700]" />
                  <span>Chính thức</span>
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                <span className="font-medium text-stone-600">Ngành hàng trọng tâm:</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200/90 bg-white/90 px-2.5 py-0.5 font-semibold text-stone-800 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {categoryName || 'Thời trang & May mặc'}
                </span>
              </div>
            </div>
          </div>

          {/* Công cụ điều khiển: Nút đồng bộ & Bộ chọn ngành hàng */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {onReload && (
              <button
                type="button"
                onClick={handleReload}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200/90 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-2xs transition-all hover:border-[#007700] hover:text-[#007700] hover:bg-emerald-50/40 active:scale-95 disabled:opacity-60 cursor-pointer"
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
            <div className="relative inline-flex items-center">
              <Layers className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-stone-400" />
              <select
                aria-label="Chọn ngành hàng phân tích"
                value={categorySlug}
                onChange={e => onSelectCategory(e.target.value)}
                className="cursor-pointer appearance-none rounded-xl border border-stone-200/90 bg-white pl-8.5 pr-8 py-2 text-xs font-bold text-stone-800 shadow-2xs transition-all hover:border-[#007700] focus:border-[#007700] focus:ring-2 focus:ring-[#007700]/20 focus:outline-none"
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

      {/* 2. FLAGSHIP CARD: ĐIỂM NHẤN DỊP CAO ĐIỂM ĐANG CHỌN (EXECUTIVE OCCASION BRIEFING) */}
      {activeCamp && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#071d12] via-[#05170e] to-[#020b06] p-5 sm:p-6 text-white shadow-xl border border-emerald-800/40 backdrop-blur-md">
          {/* Ambient Lighting & Luxury Grid Pattern */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-600/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Cột trái: Huy hiệu Dịp lễ, Tên chiến dịch, Giai đoạn & Mô tả */}
            <div className="flex items-start gap-4">
              {/* Emblem Dịp cao điểm */}
              <div className="relative flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/[0.15] shadow-inner text-emerald-300 ring-1 ring-emerald-400/20 [&>svg]:h-6 [&>svg]:w-6 [&>svg]:text-emerald-300 [&>svg]:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                {getCampaignLucideIcon(activeCamp.id)}
              </div>

              <div className="min-w-0">
                {/* Overline nhãn thị trường */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-[0.18em] text-emerald-400/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    TIÊU ĐIỂM DỊP MUA SẮM
                  </span>
                </div>

                {/* Tên Dịp & Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="m-0 font-jakarta text-lg sm:text-2xl font-black tracking-tight text-white">
                    {activeCamp.name}
                  </h3>

                  {activeCamp.badge && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-100 border border-white/15 backdrop-blur-xs">
                      {activeCamp.badge}
                    </span>
                  )}

                  {activeCamp.timing && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-400/30 backdrop-blur-xs shadow-2xs">
                      <Clock className="h-3.5 w-3.5 text-emerald-300" />
                      <span>{activeCamp.timing.label}</span>
                    </span>
                  )}
                </div>

                {/* Mô tả chiến dịch */}
                <p className="mb-0 mt-1.5 text-xs sm:text-sm text-stone-300/95 max-w-2xl leading-relaxed font-normal">
                  {activeCamp.description ||
                    'Lên kế hoạch sản xuất, đón đầu sức mua dịp cao điểm lớn.'}
                </p>
              </div>
            </div>

            {/* Cột phải: Khối thống kê ý tưởng đã gom vào kế hoạch */}
            <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto pt-2 lg:pt-0">
              <div className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md px-4 py-3 shadow-lg transition-all hover:border-emerald-400/40 hover:bg-white/[0.12]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-xs">
                  <BookmarkCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-200/80">
                    Kế hoạch đã gom
                  </div>
                  <div className="text-sm font-bold text-white font-jakarta flex items-baseline gap-1">
                    <span className="text-lg font-black text-emerald-300 tabular-nums">
                      {savedIdeasCount}
                    </span>
                    <span>ý tưởng mục tiêu</span>
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
