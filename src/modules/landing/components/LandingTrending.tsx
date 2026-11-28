import { Star, RotateCw, PackageOpen, ImageOff } from 'lucide-react';
import type { LandingProduct, SectionStatus } from '../hooks/useLandingPage';

interface LandingTrendingProps {
  products: LandingProduct[];
  status: SectionStatus;
  /** Bấm vào một sản phẩm -> mở trang chi tiết công khai /product/<id> */
  onSelectProduct: (id: string) => void;
  /** Bấm "xem tất cả" -> trang tìm kiếm sắp xếp theo bán chạy */
  onViewAll: () => void;
  onRetry: () => void;
}

export function LandingTrending({ products, status, onSelectProduct, onViewAll, onRetry }: LandingTrendingProps) {
  return (
    <section id="xu-huong" className="py-20 px-6 scroll-mt-24">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex justify-between items-end">
          <h2 className="font-heading text-2xl sm:text-[26px] font-semibold leading-[1.2] text-[#330033] tracking-tight">
            Đang thịnh hành
          </h2>
          <button
            onClick={onViewAll}
            className="text-[#007700] font-bold text-sm tracking-wide flex items-center gap-1 hover:underline"
          >
            Xem tất cả +
          </button>
        </div>

        {status === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-stone-100 overflow-hidden">
                <div className="aspect-[4/3] bg-stone-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-stone-100 animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-stone-100 animate-pulse" />
                  <div className="h-4 w-1/4 rounded bg-stone-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-12 text-sm text-stone-500">
            <p>Không tải được sản phẩm. Vui lòng kiểm tra kết nối và thử lại.</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 font-semibold text-stone-700 hover:border-[#007700] hover:text-[#007700]"
            >
              <RotateCw className="h-4 w-4" /> Thử lại
            </button>
          </div>
        )}

        {status === 'ready' && products.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-sm text-stone-500">
            <PackageOpen className="h-8 w-8 text-stone-300" />
            <p>Chưa có sản phẩm nào đang bán. Hãy quay lại sau nhé.</p>
          </div>
        )}

        {status === 'ready' && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProduct(p.id)}
                className="group text-left bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative aspect-[4/3] w-full bg-stone-50 overflow-hidden">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = '/image-not-found.jpg'; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-300">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  {p.isBestseller && (
                    <span className="absolute top-3 left-3 bg-[#fdf2e9] text-[#b45309] text-[10px] font-bold px-2 py-0.5 rounded border border-[#fbd3b6] uppercase tracking-wider">
                      Bán chạy
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 w-full flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-semibold text-stone-800 text-sm group-hover:text-[#007700] transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    {p.reviews > 0 ? (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="flex text-amber-500" aria-label={`${p.rating.toFixed(1)} trên 5 sao`}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < Math.round(p.rating) ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-stone-400 font-medium">({p.reviews})</span>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs italic text-stone-400">Chưa có đánh giá</p>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <span className="font-heading text-[#007700] font-semibold text-sm">
                      {p.price.toLocaleString('vi-VN')}đ
                    </span>
                    {p.soldCount > 0 && (
                      <span className="text-[11px] text-stone-400">Đã bán {p.soldCount.toLocaleString('vi-VN')}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
