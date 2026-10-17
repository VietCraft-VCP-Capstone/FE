import React from 'react';
import { Search } from 'lucide-react';

interface KeywordSuggestionsProps {
  keywords: string[];
  onSelect: (keyword: string) => void;
}

export const KeywordSuggestions: React.FC<KeywordSuggestionsProps> = ({ keywords, onSelect }) => {
  if (keywords.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#a8a29e', margin: '8px 0', fontStyle: 'italic' }}>
        Không có gợi ý từ khoá. Nhấn Enter để tìm kiếm toàn bộ sàn.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
      {keywords.map((kw) => (
        <button
          key={kw}
          type="button"
          onClick={() => onSelect(kw)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px',
            border: 'none',
            borderRadius: 8,
            background: 'transparent',
            fontSize: 13,
            fontWeight: 600,
            color: '#1c1917',
            textAlign: 'left',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f4')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Search size={14} color="#a8a29e" style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kw}</span>
        </button>
      ))}
    </div>
  );
};
