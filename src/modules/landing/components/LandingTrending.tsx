import { Star } from 'lucide-react';

interface ProductItem {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  isBestseller: boolean;
  image: string;
}

interface LandingTrendingProps {
  products: ProductItem[];
  onAction: () => void;
}

export function LandingTrending({ products, onAction }: LandingTrendingProps) {
  return (
    <section id="xu-huong" className="py-20 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Section Header */}
        <div className="flex justify-between items-end">
          <h2 className="text-3xl font-extrabold text-[#330033] tracking-tight">
            Đang Thịnh Hành
          </h2>
          <span 
            onClick={onAction}
            className="text-[#007700] font-bold text-sm tracking-wide flex items-center gap-1 cursor-pointer hover:underline"
          >
            xem tất cả +
          </span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div 
              key={p.id} 
              onClick={onAction}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
            >
              {/* Product Image Wrapper */}
              <div className="relative aspect-[4/3] bg-stone-50 overflow-hidden">
                <img 
                  src={p.image} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {p.isBestseller && (
                  <span className="absolute top-3 left-3 bg-[#fdf2e9] text-[#b45309] text-[10px] font-bold px-2 py-0.5 rounded border border-[#fbd3b6] uppercase tracking-wider flex items-center gap-1">
                    <span className="text-[#b45309] text-[8px]">●</span> Bán chạy
                  </span>
                )}
              </div>

              {/* Content Panel */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-semibold text-stone-800 text-sm group-hover:text-[#007700] transition-colors line-clamp-1">
                    {p.title}
                  </h3>
                  
                  {/* Stars Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3.5 w-3.5 ${i < Math.floor(p.rating) ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400 font-medium">({p.reviews})</span>
                  </div>
                </div>

                <span className="text-[#007700] font-bold text-base block pt-1">
                  {p.price.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
