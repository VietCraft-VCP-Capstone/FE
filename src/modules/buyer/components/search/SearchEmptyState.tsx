import React from 'react';
import { PackageSearch, RotateCcw } from 'lucide-react';

interface SearchEmptyStateProps {
  query: string;
  hasActiveFilters: boolean;
  popularKeywords: string[];
  onSelectKeyword: (kw: string) => void;
  onResetFilters: () => void;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  query,
  hasActiveFilters,
  popularKeywords,
  onSelectKeyword,
  onResetFilters
}) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e7e5e4',
      borderRadius: 16,
      padding: '64px 32px',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        backgroundColor: '#f5f5f4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 18px',
        color: '#a8a29e'
      }}>
        <PackageSearch size={36} />
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1c1917', marginBottom: 8 }}>
        Không tìm thấy sản phẩm nào phù hợp
      </h2>
      <p style={{ fontSize: 14, color: '#78716c', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
        {query
          ? `Không có kết quả nào trùng khớp với từ khóa "${query}". Hãy thử kiểm tra lại chính tả, sử dụng từ không dấu hoặc nới lỏng các bộ lọc.`
          : 'Không có sản phẩm nào thỏa mãn các tiêu chí lọc hiện tại.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {popularKeywords.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => onSelectKeyword(kw)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#f5f5f4',
              border: '1px solid #e7e5e4',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: '#44403c',
              cursor: 'pointer'
            }}
          >
            {kw}
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          style={{
            padding: '9px 20px',
            backgroundColor: '#007700',
            color: '#ffffff',
            border: 'none',
            borderRadius: 24,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <RotateCcw size={14} /> Xóa toàn bộ bộ lọc
        </button>
      )}
    </div>
  );
};
