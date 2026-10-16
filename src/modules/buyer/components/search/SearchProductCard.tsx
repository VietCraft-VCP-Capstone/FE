import React from 'react';
import { Heart, Store, Star } from 'lucide-react';
import { ProductItem } from '../../../product/types/product';

interface SearchProductCardProps {
  product: ProductItem;
  isFavorited: boolean;
  onToggleFavorite: (productId: string, title: string, e: React.MouseEvent) => void;
  onClick: () => void;
}

export const SearchProductCard: React.FC<SearchProductCardProps> = ({
  product,
  isFavorited,
  onToggleFavorite,
  onClick
}) => {
  const isPod = product.productType === 'POD_TEMPLATE';
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

        {/* Product Type Badge */}
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: isPod ? 'rgba(109, 40, 217, 0.9)' : 'rgba(0, 119, 0, 0.9)',
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 800,
          padding: '3px 7px',
          borderRadius: 6,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          backdropFilter: 'blur(4px)'
        }}>
          {isPod ? 'In theo yêu cầu' : 'Thủ công'}
        </div>

        {/* Wishlist Heart Overlay */}
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
        {/* Shop badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#78716c', fontWeight: 600 }}>
          <Store size={12} color="#007700" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shopName}
          </span>
        </div>

        {/* Product Title */}
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1c1917', lineHeight: '18px' }} title={product.title}>
          {product.title}
        </h3>

        {/* Rating row */}
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

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#007700' }}>
            {(product.price || 0).toLocaleString('vi-VN')}đ
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
            <span style={{ fontSize: 11, textDecoration: 'line-through', color: '#a8a29e' }}>
              {product.originalPrice.toLocaleString('vi-VN')}đ
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
