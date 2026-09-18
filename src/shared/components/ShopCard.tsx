import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Star, ExternalLink, UserMinus, UserCheck, UserPlus, Package, Users, MapPin } from 'lucide-react';
import { ShopDetail } from '../../modules/product/services/shopService';

export interface ShopCardProps {
  shop: ShopDetail;
  mode?: 'buyer' | 'seller';
  onUnfollow?: (shopId: string, shopName: string) => void | Promise<void>;
  onToggleFollow?: (shopId: string) => void | Promise<void>;
  isUnfollowing?: boolean;
  className?: string;
}

export const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  mode = 'buyer',
  onUnfollow,
  onToggleFollow,
  isUnfollowing = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const shopId = shop.id || shop._id || '';
  const shopTarget = shop.slug || shopId;
  const ratingVal = shop.averageRating || shop.rating || 5.0;
  const listingVal = shop.listingCount || 0;
  const followersVal = shop.followersCount || 0;
  const shopDisplayName = shop.name || shop.shopName || 'Gian hàng';
  const locationText = shop.city || shop.province || shop.address;

  const handleVisit = () => {
    if (mode === 'seller') {
      window.open(`/shop/${shopTarget}`, '_blank');
    } else {
      navigate(`/shop/${shopTarget}`);
    }
  };

  return (
    <div className={`group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}>
      {/* Banner Header */}
      <div className="h-28 w-full relative bg-stone-100 overflow-hidden">
        {shop.banner ? (
          <img
            src={shop.banner}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#2d3a2e] via-[#3a4d39] to-[#4f6f52]" />
        )}
        <div className="absolute inset-0 bg-black/15" />
      </div>

      {/* Body */}
      <div className="p-5 pt-0 flex-1 flex flex-col justify-between relative">
        <div>
          {/* Logo Avatar */}
          <div className="w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm -mt-8 mb-3 shrink-0">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shopDisplayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-emerald-50 text-[#15803d] flex items-center justify-center font-bold text-lg">
                <Store size={22} />
              </div>
            )}
          </div>

          {/* Name & Link */}
          <h3
            onClick={handleVisit}
            className="text-lg font-bold text-gray-900 hover:text-[#15803d] transition-colors cursor-pointer truncate"
            title={shopDisplayName}
          >
            {shopDisplayName}
          </h3>

          {/* Slogan or Description */}
          {(shop.slogan || shop.description) && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3 italic">
              {shop.slogan || shop.description}
            </p>
          )}

          {/* Stats badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600 mt-2.5 mb-4 pb-3 border-b border-gray-100">
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              {ratingVal.toFixed(1)} {shop.ratingCount ? `(${shop.ratingCount})` : ''}
            </span>
            <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md text-stone-700">
              <Package className="w-3.5 h-3.5" />
              {listingVal} sản phẩm
            </span>
            {followersVal > 0 && (
              <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md text-stone-700">
                <Users className="w-3.5 h-3.5" />
                {followersVal} theo dõi
              </span>
            )}
            {locationText && (
              <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md text-stone-700">
                <MapPin className="w-3.5 h-3.5" />
                {locationText}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleVisit}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-emerald-50 hover:text-[#15803d] text-gray-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <ExternalLink size={14} />
            {mode === 'seller' ? 'Ghé thăm' : 'Xem Shop'}
          </button>

          {onUnfollow ? (
            <button
              disabled={isUnfollowing}
              onClick={() => onUnfollow(shopId, shopDisplayName)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-gray-500 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <UserMinus size={14} />
              {isUnfollowing ? 'Đang bỏ...' : 'Bỏ theo dõi'}
            </button>
          ) : onToggleFollow ? (
            <button
              onClick={() => onToggleFollow(shopId)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                shop.isFollowing
                  ? 'border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  : 'bg-[#15803d] hover:bg-[#166534] text-white'
              }`}
            >
              {shop.isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 mr-1.5 text-[#15803d]" />
                  <span>Đang theo dõi</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1.5 text-white" />
                  <span>Theo dõi</span>
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
