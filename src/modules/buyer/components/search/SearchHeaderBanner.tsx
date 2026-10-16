import React from 'react';
import { Sparkles } from 'lucide-react';

interface SearchHeaderBannerProps {
  query: string;
  category: string;
  total: number;
  popularKeywords: string[];
  onSelectKeyword: (kw: string) => void;
}

export const SearchHeaderBanner: React.FC<SearchHeaderBannerProps> = ({
  query,
  category,
  total,
  popularKeywords,
  onSelectKeyword
}) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e7e5e4',
      borderRadius: 16,
      padding: '24px 28px',
      marginBottom: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1c1917', margin: 0 }}>
            {query ? (
              <>
                Kết quả tìm kiếm cho <span style={{ color: '#007700' }}>"{query}"</span>
              </>
            ) : category ? (
              <>
                Danh mục: <span style={{ color: '#007700' }}>{category}</span>
              </>
            ) : (
              'Tất cả sản phẩm thủ công mỹ nghệ'
            )}
          </h1>
          <span style={{
            backgroundColor: '#f5f5f4',
            color: '#57534e',
            fontSize: 13,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20
          }}>
            {total} sản phẩm
          </span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#78716c' }}>
          Khám phá các tuyệt tác thủ công tinh hoa và quà tặng sáng tạo từ các nghệ nhân khắp Việt Nam
        </p>
      </div>

      {/* Quick popular tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#a8a29e', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={13} color="#eab308" /> Gợi ý:
        </span>
        {popularKeywords.slice(0, 4).map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => onSelectKeyword(kw)}
            style={{
              backgroundColor: query === kw ? '#ecfdf5' : '#f5f5f4',
              borderColor: query === kw ? '#a7f3d0' : '#e7e5e4',
              color: query === kw ? '#007700' : '#44403c',
              borderWidth: 1,
              borderStyle: 'solid',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
};
