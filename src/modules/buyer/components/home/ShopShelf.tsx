import { Star, UserPlus } from 'lucide-react';

export interface ShelfShop {
  id: string;
  name: string;
  logo: string;
  productCount: number;
  rating: number;
  ratingCount: number;
  products: Array<{ id: string; title: string; image: string; price: number }>;
}

interface ShopShelfProps {
  shops: ShelfShop[];
  mode: 'following' | 'suggested';
  followingId: string | null;
  onOpenShop: (id: string) => void;
  onOpenProduct: (id: string) => void;
  onFollow: (id: string, name: string) => void;
}

/** Mỗi gian hàng là một "kệ": thông tin shop bên trái, hàng thật của shop xếp bên phải. */
export function ShopShelf({ shops, mode, followingId, onOpenShop, onOpenProduct, onFollow }: ShopShelfProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {shops.map((s) => (
        <div key={s.id} className="flex flex-col gap-4 rounded-2xl border border-[#ece9e6] bg-white p-4 sm:flex-row sm:items-stretch">
          <div className="flex shrink-0 items-center gap-3 sm:w-[150px] sm:flex-col sm:items-start sm:justify-between">
            <button type="button" onClick={() => onOpenShop(s.id)} className="flex min-w-0 items-center gap-3 text-left sm:flex-col sm:items-start sm:gap-2">
              <img src={s.logo || '/placeholder-shop.svg'} alt="" className="h-12 w-12 shrink-0 rounded-full border border-[#ebd0eb] object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-bold text-[#330033]">{s.name}</span>
                <span className="mt-0.5 block text-[12px] text-stone-500">
                  {s.productCount > 0 ? `${s.productCount.toLocaleString('vi-VN')} sản phẩm` : 'Chưa có sản phẩm'}
                </span>
                {s.ratingCount > 0 && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-stone-600">
                    <Star size={11} className="fill-amber-400 text-amber-400" /> {s.rating.toFixed(1)} ({s.ratingCount})
                  </span>
                )}
              </span>
            </button>
            {mode === 'suggested' ? (
              <button
                type="button"
                disabled={followingId === s.id}
                onClick={() => onFollow(s.id, s.name)}
                className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#330033] px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-[#471042] disabled:opacity-60 sm:ml-0"
              >
                <UserPlus size={13} /> {followingId === s.id ? 'Đang theo dõi...' : 'Theo dõi'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenShop(s.id)}
                className="ml-auto whitespace-nowrap rounded-full border border-[#d6d3d1] px-3.5 py-2 text-[12.5px] font-semibold text-stone-700 hover:border-[#007700] hover:text-[#007700] sm:ml-0"
              >
                Vào gian hàng
              </button>
            )}
          </div>

          {s.products.length > 0 ? (
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2.5">
              {s.products.slice(0, 3).map((p) => (
                <button key={p.id} type="button" onClick={() => onOpenProduct(p.id)} className="group min-w-0 text-left" title={p.title}>
                  <div className="aspect-square overflow-hidden rounded-xl bg-stone-100">
                    <img src={p.image} alt={p.title} loading="lazy" className="vc-card-img h-full w-full object-cover group-hover:scale-105" />
                  </div>
                  <span className="mt-1.5 block truncate text-[12px] font-bold text-[#007700]">{p.price.toLocaleString('vi-VN')}đ</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-xl bg-stone-50 text-[12.5px] text-stone-500">
              Gian hàng chưa đăng sản phẩm.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
