import React, { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { forgetRecentSearches, loadRecentSearches } from './recentSearchStorage';

interface RecentSearchesProps {
  onSelect: (keyword: string) => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({ onSelect }) => {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    loadRecentSearches().then((list) => { if (alive) setItems(list); });
    return () => { alive = false; };
  }, []);

  if (items.length === 0) return null;

  const clear = async () => {
    await forgetRecentSearches();
    setItems([]);
  };

  return (
    <div className="mb-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#44403c]">
          <History size={15} color="#78716c" />
          <span>Tìm kiếm gần đây</span>
        </div>
        <button type="button" onClick={clear} className="cursor-pointer text-[12px] font-semibold text-[#78716c]">Xoá</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => onSelect(kw)}
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-[20px] border border-[#e7e5e4] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#44403c]"
          >
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
};
