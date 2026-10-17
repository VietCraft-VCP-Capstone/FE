import React, { useState } from 'react';
import { History } from 'lucide-react';
import { clearRecentSearches, getRecentSearches } from './recentSearchStorage';

interface RecentSearchesProps {
  onSelect: (keyword: string) => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({ onSelect }) => {
  const [items, setItems] = useState<string[]>(getRecentSearches);

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#44403c', fontSize: 13, fontWeight: 700 }}>
          <History size={15} color="#78716c" />
          <span>Tìm kiếm gần đây</span>
        </div>
        <button
          type="button"
          onClick={() => {
            clearRecentSearches();
            setItems([]);
          }}
          style={{ background: 'none', border: 'none', color: '#78716c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          Xoá
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => onSelect(kw)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e7e5e4',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: '#44403c',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
};
