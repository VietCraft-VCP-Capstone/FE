import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductPaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function ProductPagination({
  currentPage,
  pageSize,
  totalPages,
  totalResults,
  loading,
  onPageChange,
}: ProductPaginationProps) {
  if (totalResults <= 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
      <div className="text-xs text-stone-500 font-medium">
        Hiển thị{' '}
        <span className="font-bold text-stone-800">
          {(currentPage - 1) * pageSize + 1}
        </span>{' '}
        -{' '}
        <span className="font-bold text-stone-800">
          {Math.min(currentPage * pageSize, totalResults)}
        </span>{' '}
        trên <span className="font-bold text-stone-800">{totalResults}</span> sản phẩm
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer font-jakarta ${
              currentPage === pageNum
                ? 'bg-[#007700] text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
          className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
