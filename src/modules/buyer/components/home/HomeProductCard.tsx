import type { MouseEvent } from 'react';
import { Heart, Star, Zap } from 'lucide-react';
import type { Deal } from '../deals/buildDeals';

const FALLBACK_IMG = '/image-not-found.jpg';
const money = (n: number) => `${(Number(n) || 0).toLocaleString('vi-VN')}đ`;

interface HomeProductCardProps {
  product: any;
  /** Mã giảm giá áp được cho sản phẩm (flash sale / ưu đãi). Giá chính vẫn là giá thật khi thanh toán. */
  deal?: Deal;
  isFav: boolean;
  onToggleFav: (e: MouseEvent) => void;
  onOpen: () => void;
  /** Lý do gợi ý từ hệ thống đề xuất (nếu có). */
  reason?: string;
}

export function HomeProductCard({ product: p, deal, isFav, onToggleFav, onOpen, reason }: HomeProductCardProps) {
  const title = p.title || p.name || 'Sản phẩm';
  const price = Number(p.price) || 0;
  const original = Number(p.originalPrice) || 0;
  const rating = Number(p.rating) || 0;
  const ratingCount = Number(p.ratingCount) || 0;
  const sold = Number(p.soldCount) || 0;

  return (
    <article className="vc-card group relative flex flex-col overflow-hidden rounded-2xl border border-[#ece9e6] bg-white transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(51,0,51,0.25)]">
      <button type="button" onClick={onOpen} className="block text-left" aria-label={title}>
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          <img
            src={p.images?.[0] || p.thumbnail || FALLBACK_IMG}
            alt={title}
            loading="lazy"
            onError={(e) => { if (!e.currentTarget.src.endsWith(FALLBACK_IMG)) e.currentTarget.src = FALLBACK_IMG; }}
            className="vc-card-img h-full w-full object-cover"
          />
          {deal && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#e11d48] px-1.5 py-0.5 text-[11px] font-bold text-white">
              <Zap size={11} /> {deal.discount}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2.5">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[13.5px] font-semibold leading-5 text-stone-800 group-hover:text-[#007700]">
            {title}
          </h3>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold text-[#007700]">{money(price)}</span>
            {original > price && <span className="text-[11px] text-stone-400 line-through">{money(original)}</span>}
          </div>
          {deal && (
            <p className="m-0 text-[11.5px] leading-4 text-[#9a3412]">
              Còn <b className="text-[#e11d48]">{money(deal.price)}</b> với mã {deal.couponCode}
            </p>
          )}
          <div className="mt-auto flex items-center gap-2 pt-1 text-[11.5px] text-stone-500">
            {ratingCount > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
              </span>
            ) : null}
            {sold > 0 && <span>Đã bán {sold.toLocaleString('vi-VN')}</span>}
            {reason && <span className="truncate text-[#6b21a8]">{reason}</span>}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onToggleFav}
        aria-label={isFav ? `Bỏ yêu thích ${title}` : `Yêu thích ${title}`}
        aria-pressed={isFav}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm"
      >
        <Heart size={15} fill={isFav ? '#e11d48' : 'none'} color={isFav ? '#e11d48' : '#57534e'} />
      </button>
    </article>
  );
}

export function HomeProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ece9e6] bg-white" aria-hidden>
      <div className="aspect-square animate-pulse bg-stone-100" />
      <div className="space-y-2 p-3">
        <div className="h-3.5 w-4/5 animate-pulse rounded bg-stone-100" />
        <div className="h-3.5 w-2/5 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}
