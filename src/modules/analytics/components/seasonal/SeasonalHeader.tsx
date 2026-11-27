import { useState } from 'react';
import {
  BookmarkCheck,
  ChevronDown,
  Layers,
  Pencil,
  RotateCw,
  Store,
  X,
} from 'lucide-react';
import type { SeasonalCampaign, SeasonalStoryChapter } from '../../types';
import { getCampaignLucideIcon } from './SeasonalMonthMatrix';

export const CATEGORY_OPTIONS = [
  { value: 'thoi-trang', label: 'Thời trang & May mặc' },
  { value: 'phu-kien', label: 'Phụ kiện & Túi ví' },
  { value: 'nha-cua', label: 'Nhà cửa & Đời sống' },
  { value: 'thu-cong-qua-tang', label: 'Thủ công & Quà tặng' },
];

export interface SavedIdeaSummaryItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface SeasonalHeaderProps {
  shopName?: string;
  categoryName?: string;
  categorySlug: string;
  onSelectCategory?: (slug: string) => void;
  activeCamp?: SeasonalCampaign;
  savedIdeasCount: number;
  savedIdeaItems?: SavedIdeaSummaryItem[];
  onRemoveSavedIdea?: (ideaId: string) => void;
  onEditSavedIdea?: (ideaId: string) => void;
  onReload?: () => void;
  storyChapter?: SeasonalStoryChapter;
  storyStep?: 1 | 2 | 3 | 4;
  onNavigateTab?: (tab: SeasonalStoryChapter['cta_tab']) => void;
}

export function SeasonalHeader({
  shopName,
  categoryName,
  categorySlug,
  activeCamp,
  savedIdeasCount,
  savedIdeaItems = [],
  onRemoveSavedIdea,
  onEditSavedIdea,
  onReload,
}: SeasonalHeaderProps) {
  const [showSavedMenu, setShowSavedMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleReload = () => {
    if (isSyncing || !onReload) return;
    setIsSyncing(true);
    onReload();
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const resolvedCategoryLabel =
    categoryName ||
    CATEGORY_OPTIONS.find(c => c.value === categorySlug)?.label ||
    'Toàn ngành hàng TMĐT';

  return (
    <div className="relative overflow-visible rounded-2xl border border-stone-200/90 bg-white px-4 py-3 sm:px-5 shadow-2xs">
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Trái: Tên tính năng + Shop + Ngành hàng tự nhận diện + Dịp đang chọn (1 hàng gọn) */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007700] text-white">
            <Store className="h-4 w-4" />
          </div>
          <h1 className="m-0 font-vietnam text-base sm:text-lg font-bold tracking-tight text-stone-950 whitespace-nowrap">
            Kế hoạch Cao điểm
          </h1>
          {shopName && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#005B00] border border-emerald-200/80 font-vietnam whitespace-nowrap">
              {shopName}
            </span>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-2.5 py-0.5 text-[11px] font-medium text-stone-600 border border-stone-200/80 font-vietnam whitespace-nowrap"
            title="Ngành hàng tự động nhận diện từ sản phẩm của shop"
          >
            <Layers className="h-3 w-3 text-stone-400" />
            <span>{resolvedCategoryLabel}</span>
          </span>

          {activeCamp && (
            <>
              <span className="hidden sm:inline-block h-4 w-px bg-stone-200 mx-0.5" />
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-200/80 px-2.5 py-1 text-xs whitespace-nowrap">
                <span className="text-[#007700] shrink-0">{getCampaignLucideIcon(activeCamp.id)}</span>
                <strong className="font-semibold text-stone-900">{activeCamp.name}</strong>
                {typeof activeCamp.timing?.days_diff === 'number' && (
                  <span className="text-stone-500">· còn {Math.max(0, activeCamp.timing.days_diff)} ngày</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Phải: Sổ tay đã chọn + Đồng bộ */}
        <div className="relative flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSavedMenu(prev => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/90 bg-stone-50/70 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-emerald-50/60 hover:border-emerald-200 transition-colors cursor-pointer whitespace-nowrap"
            title="Xem danh sách ý tưởng đã chọn"
          >
            <BookmarkCheck className="h-3.5 w-3.5 text-[#007700]" />
            <span>
              <strong className="text-[#007700] tabular-nums">{savedIdeasCount}</strong> ý tưởng đã chọn
            </span>
            <ChevronDown className={`h-3 w-3 text-stone-400 transition-transform ${showSavedMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSavedMenu && (
            <div className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-900">
                  Ý tưởng đã chọn ({savedIdeaItems.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowSavedMenu(false)}
                  className="rounded p-0.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  aria-label="Đóng"
                >
                  <X size={14} />
                </button>
              </div>
              {savedIdeaItems.length === 0 ? (
                <p className="text-xs text-stone-500 py-2">
                  Chưa có ý tưởng nào được chọn. Hãy chọn ý tưởng ở tab Ý tưởng hoặc Từ khóa cơ hội.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                  {savedIdeaItems.map(item => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-stone-100 bg-stone-50/70 p-2.5 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-stone-900 truncate" title={item.title}>
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-stone-500 mt-0.5 truncate">{item.subtitle}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onEditSavedIdea && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowSavedMenu(false);
                              onEditSavedIdea(item.id);
                            }}
                            title="Chỉnh sửa & Tạo sản phẩm"
                            className="rounded-md bg-white border border-stone-200 p-1 text-[#007700] hover:bg-emerald-50"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        {onRemoveSavedIdea && (
                          <button
                            type="button"
                            onClick={() => onRemoveSavedIdea(item.id)}
                            title="Bỏ chọn"
                            className="rounded-md bg-white border border-stone-200 p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {onReload && (
            <button
              type="button"
              onClick={handleReload}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium font-vietnam text-stone-700 transition-colors hover:border-[#007700] hover:text-[#007700] disabled:opacity-60 cursor-pointer whitespace-nowrap"
              title="Đồng bộ dữ liệu đơn hàng mới nhất"
            >
              <RotateCw className={`h-3.5 w-3.5 text-[#007700] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
