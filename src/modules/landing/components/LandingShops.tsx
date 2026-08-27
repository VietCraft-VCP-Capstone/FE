import { Star } from 'lucide-react';

interface ShopItem {
  id?: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  avatar: string;
  banner: string;
}

interface LandingShopsProps {
  shops: ShopItem[];
  /** Mở trang gian hàng /shop/:id. */
  onSelectShop?: (shop: ShopItem) => void;
}

export function LandingShops({ shops, onSelectShop }: LandingShopsProps) {
  return (
    <section id="shop-noi-bat" className="py-20 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <h2 className="text-3xl font-extrabold text-[#330033] text-left tracking-tight">
          Shop Nổi Bật
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {shops.map((shop, i) => (
            <div 
              key={i} 
              className="bg-white rounded-3xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              {/* Shop Banner backdrop */}
              <div className="h-28 bg-stone-100 overflow-hidden relative">
                <img 
                  src={shop.banner} 
                  alt={shop.name} 
                  className="w-full h-full object-cover filter brightness-90 group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent"></div>
              </div>

              {/* Shop Profile & Details */}
              <div className="px-6 pb-6 flex-1 flex flex-col justify-between items-center -mt-9 text-center space-y-4">
                <div className="flex flex-col items-center">
                  <img 
                    src={shop.avatar} 
                    alt={shop.name} 
                    className="w-18 h-18 rounded-full border-4 border-white shadow-md object-cover relative z-10 mb-2"
                  />
                  <h3 className="font-bold text-stone-800 text-base">{shop.name}</h3>
                  <p className="text-stone-400 text-xs mt-1">{shop.location}</p>
                  
                  <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-amber-500 bg-amber-50/50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{shop.rating.toFixed(1)}</span>
                    <span className="text-stone-400">({shop.reviews} reviews)</span>
                  </div>
                </div>

                <button 
                  onClick={() => onSelectShop?.(shop)}
                  className="w-full bg-white hover:bg-stone-50 text-stone-700 font-bold py-2.5 rounded-xl border border-stone-200 transition-colors text-sm hover:border-[#007700] hover:text-[#007700]"
                >
                  Xem Shop
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
