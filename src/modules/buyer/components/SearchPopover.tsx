import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Tag as TagIcon, Store, ArrowRight } from 'lucide-react';
import { SuggestResult } from '../../product/types/product';
import { productsService } from '../../product/services/productsService';
import { RecentSearches } from './search/RecentSearches';
import { KeywordSuggestions } from './search/KeywordSuggestions';

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
  isOpen,
  search,
  setSearch,
  isSuggestLoading,
  suggestions,
  onExecuteSearch,
  onClose,
}) => {
  const navigate = useNavigate();
  const [trendingKeywords, setTrendingKeywords] = useState<string[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTrending = async () => {
      setIsTrendingLoading(true);
      try {
        const keywords = await productsService.getTrendingKeywords(8);
        if (isMounted && keywords && keywords.length > 0) {
          setTrendingKeywords(keywords);
        }
      } catch (err) {
        console.warn('Failed to load AI trending keywords:', err);
      } finally {
        if (isMounted) setIsTrendingLoading(false);
      }
    };

    fetchTrending();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isOpen) return null;

  const displayKeywords = trendingKeywords.length > 0
    ? trendingKeywords
    : [
        'Quà Tặng',
        'Áo Đồng Phục',
        'Áo Thun',
        'Quà Sinh Nhật',
        'Móc Khóa',
        'Áo Lớp',
        'Túi Tote',
        'Áo Anime'
      ];

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 'max(100%, 380px)',
        minWidth: 'min(380px, calc(100vw - 24px))',
        maxWidth: 'calc(100vw - 24px)',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e7e5e4',
        padding: '16px',
        zIndex: 9999,
        maxHeight: '440px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      {/* Trường hợp 1: Chưa gõ gì -> Hiện từ khoá thịnh hành theo dữ liệu AI Analyst */}
      {!search.trim() ? (
        <div>
          <RecentSearches
            onSelect={(kw) => {
              setSearch(kw);
              onExecuteSearch(kw);
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, whiteSpace: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#44403c', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              <Sparkles size={15} color="#eab308" style={{ flexShrink: 0 }} />
              <span>Tìm kiếm thịnh hành</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
              AI Trend
            </span>
          </div>

          {isTrendingLoading && trendingKeywords.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 12, padding: '8px 0' }}>
              <Loader2 size={13} className="animate-spin" />
              <span>Đang cập nhật xu hướng từ AI Analyst...</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {displayKeywords.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearch(item);
                    onExecuteSearch(item);
                  }}
                  style={{
                    backgroundColor: '#f5f5f4',
                    border: '1px solid #e7e5e4',
                    borderRadius: 20,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#292524',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ecfdf5';
                    e.currentTarget.style.borderColor = '#a7f3d0';
                    e.currentTarget.style.color = '#007700';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f4';
                    e.currentTarget.style.borderColor = '#e7e5e4';
                    e.currentTarget.style.color = '#292524';
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : isSuggestLoading ? (
        /* Đang tải gợi ý */
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8, color: '#78716c', fontSize: 13 }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Đang tìm kiếm gợi ý...</span>
        </div>
      ) : (
        /* Trường hợp 2: Đã có kết quả gợi ý */
        <div>
          <KeywordSuggestions
            keywords={suggestions.keywords ?? []}
            onSelect={(kw) => {
              setSearch(kw);
              onExecuteSearch(kw);
            }}
          />

          {/* Danh mục gợi ý nếu có */}
          {suggestions.categories && suggestions.categories.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#78716c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <TagIcon size={13} />
                <span>Danh mục gợi ý</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {suggestions.categories.map((c) => (
                  <span
                    key={c.id}
                    onClick={() => {
                      onClose();
                      navigate(`/search?category=${encodeURIComponent(c.name)}`);
                    }}
                    style={{
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: '1px solid #bbf7d0',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gian hàng gợi ý nếu có */}
          {suggestions.shops && suggestions.shops.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#78716c', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Store size={13} />
                <span>Gian hàng thủ công</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.shops.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onClose();
                      navigate(`/shop/${s.slug || s.id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={s.logo || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=100'}
                        alt={s.name}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e7e5e4' }}
                      />
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1c1917', display: 'block' }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: '#78716c' }}>Điểm uy tín: {s.reputationScore}/100</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#008000', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>
                      Xem Shop
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút xem toàn bộ kết quả */}
          <div
            onClick={() => onExecuteSearch()}
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px solid #f5f5f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: '#008000',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Xem tất cả kết quả cho "{search}"</span>
            <ArrowRight size={14} />
          </div>
        </div>
      )}
    </div>
  );
};
