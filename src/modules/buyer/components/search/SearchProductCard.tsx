import React from 'react';
import { Heart, Store, Star } from 'lucide-react';
import { ProductItem } from '../../../product/types/product';
import { Deal } from '../deals/buildDeals';

interface SearchProductCardProps {
  product: ProductItem;
  deal?: Deal;
  isFavorited: boolean;
  onToggleFavorite: (productId: string, title: string, e: React.MouseEvent) => void;
  onClick: () => void;
}

export const SearchProductCard: React.FC<SearchProductCardProps> = ({
  product,
  deal,
  isFavorited,
  onToggleFavorite,
  onClick
}) => {
  const price = deal ? deal.price : product.price || 0;
  const oldPrice = deal ? deal.oldPrice : product.originalPrice;
  const shopName = product.shopInfo?.name || 'VietCraft Artisan';

  return (
    <div
      className="buyer-card"
      onClick={onClick}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <div className="card-media">
        <img
          src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400'}
          alt={product.title}
          loading="lazy"
        />

        {deal && (
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', zIndex: 3 }}>
            {deal.badge === 'FLASH SALE'
              ? <span className="flash-sale-badge">⚡ FLASH SALE</span>
              : <span className="discount-tag" style={{ position: 'static' }}>{deal.badge}</span>}
            {deal.discount && (
              <span style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', color: '#fef08a', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                {deal.discount}
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          className="fav-overlay"
          onClick={(e) => onToggleFavorite(product.id, product.title, e)}
          style={{ color: isFavorited ? '#e11d48' : '#888' }}
          title={isFavorited ? 'Bỏ yêu thích' : 'Yêu thích'}
        >
          <Heart size={14} fill={isFavorited ? '#e11d48' : 'none'} />
        </button>
      </div>

      <div className="card-info" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#78716c', fontWeight: 600 }}>
          <Store size={12} color="#007700" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shopName}
          </span>
        </div>

        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1c1917', lineHeight: '18px' }} title={product.title}>
          {product.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
          {(product.ratingCount ?? 0) > 0 ? (
            <>
              <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, s) => {
                  const r = product.rating ?? 0;
                  return (
                    <Star
                      key={s}
                      size={11}
                      style={{
                        fill: s < Math.round(r) ? '#f59e0b' : '#e7e5e4',
                        color: s < Math.round(r) ? '#f59e0b' : '#e7e5e4'
                      }}
                    />
                  );
                })}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#44403c' }}>
                {(product.rating ?? 0).toFixed(1)}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: '#a8a29e', fontStyle: 'italic' }}>
              Chưa có đánh giá
            </span>
          )}
          {product.soldCount !== undefined && product.soldCount > 0 && (
            <span style={{ fontSize: 11, color: '#a8a29e', marginLeft: 'auto' }}>
              Đã bán {product.soldCount}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#007700' }}>
            {price.toLocaleString('vi-VN')}đ
          </p>
          {oldPrice && oldPrice > price && (
            <span style={{ fontSize: 11, textDecoration: 'line-through', color: '#a8a29e' }}>
              {oldPrice.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
