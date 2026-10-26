import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Tag as TagIcon, Store, ArrowRight } from 'lucide-react';
import { SuggestResult } from '../../product/types/product';
import { productsService } from '../../product/services/productsService';
import { RecentSearches } from './search/RecentSearches';
import { KeywordSuggestions } from './search/KeywordSuggestions';

export const FALLBACK_KEYWORDS = ['Quà Tặng', 'Áo Đồng Phục', 'Áo Thun', 'Quà Sinh Nhật', 'Móc Khóa', 'Túi Tote', 'Áo Lớp', 'Áo Anime'];

const SHOP_PLACEHOLDER = 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=100';
const sectionTitle = 'mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#78716c]';

interface SearchPopoverProps {
  isOpen: boolean;
  search: string;
  setSearch: (s: string) => void;
  isSuggestLoading: boolean;
  suggestions: SuggestResult;
  onExecuteSearch: (targetKeyword?: string) => void;
  onClose: () => void;
}

export const SearchPopover: React.FC<SearchPopoverProps> = ({
  isOpen, search, setSearch, isSuggestLoading, suggestions, onExecuteSearch, onClose,
}) => {
  const navigate = useNavigate();
  const [trendingKeywords, setTrendingKeywords] = useState<string[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    productsService.getTrendingKeywords(8).then((kws) => { if (isMounted) setTrendingKeywords(kws); });
    return () => { isMounted = false; };
  }, []);

  if (!isOpen) return null;

  const displayKeywords = trendingKeywords?.length ? trendingKeywords : FALLBACK_KEYWORDS;
  const pick = (kw: string) => {
    setSearch(kw);
    onExecuteSearch(kw);
  };
  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] z-[9999] max-h-[440px] w-[max(100%,380px)] min-w-[min(380px,calc(100vw-24px))] max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-[#e7e5e4] bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.05)]">
      {!search.trim() ? (
        <div>
          <RecentSearches onSelect={pick} />
          <div className="mb-3 flex items-center justify-between whitespace-nowrap">
            <div className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-[#44403c]">
              <Sparkles size={15} color="#eab308" className="shrink-0" />
              <span>Tìm kiếm thịnh hành</span>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-semibold text-[#059669]">AI Trend</span>
          </div>

          {trendingKeywords === null ? (
            <div className="flex items-center gap-1.5 py-2 text-[12px] text-[#78716c]">
              <Loader2 size={13} className="animate-spin" />
              <span>Đang cập nhật xu hướng từ AI Analyst...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {displayKeywords.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => pick(item)}
                  className="shrink-0 cursor-pointer whitespace-nowrap rounded-[20px] border border-[#e7e5e4] bg-[#f5f5f4] px-3.5 py-1.5 text-[12px] font-semibold text-[#292524] transition-all duration-150 hover:border-[#a7f3d0] hover:bg-[#ecfdf5] hover:text-[#007700]"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : isSuggestLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-[13px] text-[#78716c]">
          <Loader2 size={16} className="animate-spin" />
          <span>Đang tìm kiếm gợi ý...</span>
        </div>
      ) : (
        <div>
          <KeywordSuggestions keywords={suggestions.keywords ?? []} onSelect={pick} />

          {suggestions.categories?.length > 0 && (
            <div className="mb-3.5">
              <div className={sectionTitle}><TagIcon size={13} /><span>Danh mục gợi ý</span></div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.categories.map((c) => (
                  <span
                    key={c.id}
                    onClick={() => go(`/search?category=${encodeURIComponent(c.name)}`)}
                    className="shrink-0 cursor-pointer whitespace-nowrap rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1 text-[12px] font-semibold text-[#166534]"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {suggestions.shops?.length > 0 && (
            <div className="mb-3.5">
              <div className={sectionTitle}><Store size={13} /><span>Gian hàng thủ công</span></div>
              <div className="flex flex-col gap-1.5">
                {suggestions.shops.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => go(`/shop/${s.slug || s.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-[#f5f5f4]"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={s.logo || SHOP_PLACEHOLDER} alt={s.name} className="h-8 w-8 rounded-full border border-[#e7e5e4] object-cover" />
                      <div>
                        <span className="block text-[13px] font-bold text-[#1c1917]">{s.name}</span>
                        <span className="text-[11px] text-[#78716c]">Điểm uy tín: {s.reputationScore}/100</span>
                      </div>
                    </div>
                    <span className="rounded-[10px] bg-[#dcfce7] px-2 py-0.5 text-[11px] font-bold text-[#008000]">Xem Shop</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            onClick={() => onExecuteSearch()}
            className="mt-3.5 flex cursor-pointer items-center justify-center gap-1.5 border-t border-[#f5f5f4] pt-2.5 text-[13px] font-bold text-[#008000]"
          >
            <span>Xem tất cả kết quả cho "{search}"</span>
            <ArrowRight size={14} />
          </div>
        </div>
      )}
    </div>
  );
};
