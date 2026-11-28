import React, { useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import { forgetRecentSearch, forgetRecentSearches, loadRecentSearches } from './recentSearchStorage';

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
  const remove = async (kw: string) => {
    setItems((list) => list.filter((s) => s !== kw));
    await forgetRecentSearch(kw);
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
          <span key={kw} className="inline-flex shrink-0 items-center rounded-[20px] border border-[#e7e5e4] bg-white text-[12px] font-semibold text-[#44403c]">
            <button type="button" onClick={() => onSelect(kw)} className="cursor-pointer whitespace-nowrap py-1.5 pl-3.5 pr-1.5">{kw}</button>
            <button type="button" onClick={() => remove(kw)} aria-label={`Xoá "${kw}"`} className="cursor-pointer rounded-full py-1.5 pl-0.5 pr-2.5 text-[#a8a29e] hover:text-[#44403c]">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
