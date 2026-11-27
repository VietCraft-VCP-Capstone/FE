import { Sparkles, ArrowRight, ImageOff } from 'lucide-react';
import type { FeaturedCategory } from '../../product/services/productsService';
import type { SectionStatus } from '../hooks/useLandingPage';

interface LandingCollectionsProps {
  /** Danh mục nổi bật thật; 2 danh mục lớn nhất làm thẻ bộ sưu tập. */
  categories: FeaturedCategory[];
  status: SectionStatus;
  onSelect: (category: FeaturedCategory) => void;
  /** Khối "Không gian sáng tạo": công cụ AI dành cho người bán. */
  onStartCreating: () => void;
}

function CollectionCard({
  category,
  large,
  onSelect,
}: {
  category: FeaturedCategory;
  large?: boolean;
  onSelect: (c: FeaturedCategory) => void;
}) {
  return (
    <button
      onClick={() => onSelect(category)}
      className={`relative block w-full text-left rounded-3xl overflow-hidden bg-stone-200 shadow-md hover:shadow-lg transition-shadow group ${
        large ? 'aspect-[16/9] lg:aspect-auto lg:h-[480px]' : 'h-[228px]'
      }`}
    >
      {category.cover_image ? (
        <img
          src={category.cover_image}
          alt={category.name}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-stone-400">
          <ImageOff className="h-10 w-10" />
        </div>
      )}
      <div
        className={`absolute inset-0 flex flex-col justify-end text-left ${
          large
            ? 'bg-gradient-to-t from-black/80 via-black/30 to-black/10 p-8 sm:p-12'
            : 'bg-gradient-to-t from-[#330033]/90 via-[#330033]/25 to-black/10 p-6'
        }`}
      >
        <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">Bộ sưu tập</span>
        <h3 className={`font-heading text-white font-semibold leading-[1.2] mb-1 ${large ? 'text-xl sm:text-2xl' : 'text-base'}`}>
          {category.name}
        </h3>
        <p className="font-body text-white/80 text-xs sm:text-sm font-light flex items-center gap-1">
          {category.product_count.toLocaleString('vi-VN')} sản phẩm
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </p>
      </div>
    </button>
  );
}

export function LandingCollections({ categories, status, onSelect, onStartCreating }: LandingCollectionsProps) {
  const [main, second] = categories;
  // Chưa có danh mục nào có hàng (hoặc tải lỗi — khối danh mục phía trên đã báo lỗi) thì không dựng thẻ giả.
  if (status === 'error' || (status === 'ready' && !main)) return null;

  return (
    <section className="py-20 px-6 bg-stone-50/40 border-t border-stone-100">
      <div className="max-w-7xl mx-auto space-y-10">
        <h2 className="font-heading text-2xl sm:text-[26px] font-semibold leading-[1.2] text-[#330033] text-left tracking-tight">
          Bộ sưu tập tuyển chọn
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            {status === 'loading' ? (
              <div className="aspect-[16/9] lg:aspect-auto lg:h-[480px] rounded-3xl bg-stone-100 animate-pulse" />
            ) : (
              <CollectionCard category={main} large onSelect={onSelect} />
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            {status === 'loading' ? (
              <div className="h-[228px] rounded-3xl bg-stone-100 animate-pulse" />
            ) : (
              second && <CollectionCard category={second} onSelect={onSelect} />
            )}

            <div className="bg-[#330033] rounded-3xl h-[228px] p-8 flex flex-col justify-between text-left relative overflow-hidden group shadow-md">
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,119,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,119,0,0.15)_1px,transparent_1px)] bg-[size:16px_16px]" />
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-[#007700]/10 border border-[#007700]/20 flex items-center justify-center text-[#007700] mb-4">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="font-heading text-white text-base font-semibold leading-[1.2] mb-1">Không gian sáng tạo</h4>
                <p className="font-body text-white/60 text-xs font-light max-w-[240px] leading-relaxed">
                  Mở shop, thiết kế sản phẩm in theo yêu cầu và phân tích thị trường bằng AI.
                </p>
              </div>
              <button
                onClick={onStartCreating}
                className="relative font-heading bg-white hover:bg-stone-100 text-[#330033] text-xs font-medium py-2.5 px-5 rounded-full self-start transition-all flex items-center gap-1 active:scale-95"
              >
                <span>Bắt đầu bán hàng</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
