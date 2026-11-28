import { LayoutGrid, RotateCw } from 'lucide-react';
import type { FeaturedCategory } from '../../product/services/productsService';
import type { SectionStatus } from '../hooks/useLandingPage';

interface LandingCategoriesProps {
  categories: FeaturedCategory[];
  status: SectionStatus;
  onSelect: (category: FeaturedCategory) => void;
  onViewAll: () => void;
  onRetry: () => void;
}

const pill =
  'flex items-center justify-center gap-2 bg-white border border-stone-200/80 px-4 py-2.5 rounded-full text-sm font-semibold shadow-sm w-full';

export function LandingCategories({ categories, status, onSelect, onViewAll, onRetry }: LandingCategoriesProps) {
  // Không có danh mục nào đang bán thì ẩn hẳn khối, không lấp chỗ bằng danh mục giả.
  if (status === 'ready' && categories.length === 0) return null;

  return (
    <section id="kham-pha" className="border-y border-stone-100 py-6 px-6 bg-stone-50/50 scroll-mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 w-full">
        {status === 'loading' &&
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 rounded-full bg-stone-200/60 animate-pulse" aria-hidden />
          ))}

        {status === 'error' && (
          <div className="col-span-full flex items-center justify-center gap-3 text-sm text-stone-500">
            <span>Không tải được danh mục.</span>
            <button onClick={onRetry} className="inline-flex items-center gap-1 font-semibold text-[#007700] hover:underline">
              <RotateCw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => onSelect(cat)}
                title={`${cat.product_count} sản phẩm`}
                className={`${pill} text-stone-700 hover:bg-stone-50 hover:shadow transition-all group active:scale-95`}
              >
                <span className="truncate group-hover:text-[#330033]">{cat.name}</span>
                <span className="shrink-0 text-[11px] font-medium text-stone-400">{cat.product_count}</span>
              </button>
            ))}
            <button
              onClick={onViewAll}
              className={`${pill} text-[#007700] hover:bg-emerald-50 transition-all active:scale-95`}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span className="truncate">Tất cả</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
