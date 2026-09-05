import React, { useState } from 'react';
import { Heart, Star, ShoppingCart, Sparkles } from 'lucide-react';

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  salesCount?: number;
  imageUrl: string;
  shopName?: string;
  productType?: 'READY_TO_SHIP' | 'POD_TEMPLATE' | 'CUSTOM_DESIGN_REQUEST';
  isFavorite?: boolean;
  onAddToCart?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  price,
  originalPrice,
  rating = 4.8,
  salesCount = 120,
  imageUrl,
  shopName = 'VietCraft Artisan',
  productType = 'READY_TO_SHIP',
  isFavorite = false,
  onAddToCart,
  onToggleFavorite,
  onClick,
}) => {
  const [favorite, setFavorite] = useState(isFavorite);

  React.useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  const discountPercent = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !favorite;
    setFavorite(nextState);
    if (onToggleFavorite) onToggleFavorite(id);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) onAddToCart(id);
  };

  return (
    <div
      onClick={() => onClick && onClick(id)}
      className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer transform hover:-translate-y-1 p-3"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-2xl">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Product Type Tag */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {productType === 'POD_TEMPLATE' && (
            <span className="inline-flex items-center gap-1 bg-emerald-700/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
              <Sparkles size={10} /> In theo yêu cầu
            </span>
          )}
          {productType === 'CUSTOM_DESIGN_REQUEST' && (
            <span className="inline-flex items-center gap-1 bg-purple-700/90 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
              Thiết kế riêng
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-block bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleHeartClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:scale-110 text-gray-400 hover:text-emerald-700 transition-all duration-200 z-10"
          aria-label="Thêm vào yêu thích"
        >
          <Heart
            size={16}
            className={favorite ? 'fill-emerald-700 text-emerald-700' : 'text-gray-400'}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="pt-3 px-1 flex flex-col flex-grow justify-between">
        <div>
          <span className="text-[11px] text-gray-400 font-medium tracking-wide line-clamp-1">
            {shopName}
          </span>
          <h3 className="mt-0.5 text-xs font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
            {title}
          </h3>
        </div>

        <div className="mt-2 pt-2 border-t border-gray-50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-extrabold text-emerald-700">
                {price.toLocaleString('vi-VN')}₫
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-[10px] text-gray-400 line-through">
                  {originalPrice.toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 text-[11px] text-amber-500 font-medium">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>{rating}</span>
              <span className="text-gray-400 font-normal">({salesCount})</span>
            </div>
          </div>

          {/* Full Width Pill Action Button */}
          <button
            onClick={handleCartClick}
            className="w-full rounded-full border border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white font-semibold py-1.5 px-3 text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <ShoppingCart size={13} />
            <span>Thêm vào giỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
