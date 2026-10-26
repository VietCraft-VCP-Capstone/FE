import React from 'react';
import { Search } from 'lucide-react';

interface KeywordSuggestionsProps {
  keywords: string[];
  onSelect: (keyword: string) => void;
}

export const KeywordSuggestions: React.FC<KeywordSuggestionsProps> = ({ keywords, onSelect }) => {
  if (keywords.length === 0) {
    return <p className="my-2 text-[13px] italic text-[#a8a29e]">Không có gợi ý từ khoá. Nhấn Enter để tìm kiếm toàn bộ sàn.</p>;
  }

  return (
    <div className="mb-3.5 flex flex-col gap-0.5">
      {keywords.map((kw) => (
        <button
          key={kw}
          type="button"
          onClick={() => onSelect(kw)}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 text-left text-[13px] font-semibold text-[#1c1917] hover:bg-[#f5f5f4]"
        >
          <Search size={14} color="#a8a29e" className="shrink-0" />
          <span className="truncate">{kw}</span>
        </button>
      ))}
    </div>
  );
};
