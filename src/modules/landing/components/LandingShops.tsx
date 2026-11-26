import { Star, RotateCw } from 'lucide-react';
import type { LandingShop, SectionStatus } from '../hooks/useLandingPage';

interface LandingShopsProps {
  shops: LandingShop[];
  status: SectionStatus;
  /** Mở trang gian hàng /shop/:id. */
  onSelectShop: (shop: LandingShop) => void;
  onRetry: () => void;
}

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';

export function LandingShops({ shops, status, onSelectShop, onRetry }: LandingShopsProps) {
  if (status === 'ready' && shops.length === 0) return null;

  return (
    <section id="shop-noi-bat" className="py-20 px-6 scroll-mt-24">
      <div className="max-w-7xl mx-auto space-y-10">
        <h2 className="font-heading text-2xl sm:text-[26px] font-semibold leading-[1.2] text-[#330033] text-left tracking-tight">
          Shop nổi bật
        </h2>

        {status === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-64 rounded-3xl border border-stone-100 bg-stone-50 animate-pulse" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center gap-3 py-8 text-sm text-stone-500">
            <span>Không tải được danh sách shop.</span>
            <button onClick={onRetry} className="inline-flex items-center gap-1 font-semibold text-[#007700] hover:underline">
              <RotateCw className="h-3.5 w-3.5" /> Thử lại
            </button>
          </div>
        )}

        {status === 'ready' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-3xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                <div className="h-24 overflow-hidden relative bg-gradient-to-br from-[#330033]/15 via-stone-100 to-[#007700]/15">
                  {shop.banner && (
                    <img
                      src={shop.banner}
                      alt=""
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                      className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                </div>

                <div className="px-5 pb-5 flex-1 flex flex-col justify-between items-center -mt-9 text-center gap-4">
                  <div className="flex flex-col items-center min-w-0 w-full">
                    {shop.avatar ? (
                      <img
                        src={shop.avatar}
                        alt={shop.name}
                        loading="lazy"
                        className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover relative z-10 mb-2 bg-white"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-4 border-white shadow-md relative z-10 mb-2 bg-[#330033] text-white font-semibold flex items-center justify-center">
                        {initials(shop.name)}
                      </div>
                    )}
                    <h3 className="font-bold text-stone-800 text-base truncate w-full">{shop.name}</h3>
                    <p className="text-stone-400 text-xs mt-1 line-clamp-2 min-h-[2rem]">
                      {shop.description || `${shop.listingCount} sản phẩm`}
                    </p>

                    <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-amber-500 bg-amber-50/50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {shop.reviews > 0 ? (
                        <>
                          <span>{shop.rating.toFixed(1)}</span>
                          <span className="text-stone-400">({shop.reviews} đánh giá)</span>
                        </>
                      ) : (
                        <span className="text-stone-400">Chưa có đánh giá</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectShop(shop)}
                    className="w-full bg-white hover:bg-stone-50 text-stone-700 font-bold py-2.5 rounded-xl border border-stone-200 transition-colors text-sm hover:border-[#007700] hover:text-[#007700]"
                  >
                    Xem Shop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
