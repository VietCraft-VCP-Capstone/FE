import { CSSProperties, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, Heart, MessageCircle, ShoppingCart, Store, Truck, X, Zap } from 'lucide-react';
import { ProductItem } from '../../types/product';

// Sao chép style từ BuyerProductDetailPage để bản xem trước khớp trang thật.
const btn: CSSProperties = { flex: 1, padding: '13px 0', borderRadius: 10, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'default' };
const S = {
  mainImg: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12, background: '#f0f0f0', display: 'block' } as CSSProperties,
  thumb: (active: boolean): CSSProperties => ({ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: active ? '2px solid #008000' : '2px solid transparent', flexShrink: 0 }),
  tag: (color: string, background: string): CSSProperties => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, color, background }),
  label: { fontSize: 13, fontWeight: 700, color: '#330033', marginBottom: 8, marginTop: 16 } as CSSProperties,
  option: (active: boolean): CSSProperties => ({ padding: '6px 16px', border: active ? '2px solid #008000' : '2px solid #ddd', borderRadius: 8, background: active ? '#e6f7e6' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: active ? '#005500' : '#333' }),
  dot: (c: string, active: boolean): CSSProperties => ({ width: 28, height: 28, borderRadius: '50%', background: c, border: active ? '3px solid #008000' : '3px solid transparent', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)', outline: active ? 'none' : '1px solid #d6d3d1', cursor: 'pointer', flexShrink: 0 }),
  chat: { ...btn, flex: 'none', padding: '13px 18px', border: '2px solid #008000', background: '#f0fdf4', color: '#008000', fontSize: 14, whiteSpace: 'nowrap' } as CSSProperties,
  outline: { ...btn, border: '2px solid #008000', background: '#fff', color: '#008000' } as CSSProperties,
  fill: { ...btn, border: 'none', background: '#008000', color: '#fff' } as CSSProperties,
};

const chosen = (v: string) => <span style={{ fontWeight: 600, color: v ? '#008000' : '#dc2626' }}>{v || '(Chưa chọn)'}</span>;

export function ProductPreviewModal({ product, onClose }: { product: ProductItem; onClose: () => void }) {
  const [image, setImage] = useState(0);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const sizes = product.sizes || [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/70 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label="Xem trước trang sản phẩm">
      <div className="mx-auto max-w-[1100px] overflow-hidden rounded-xl bg-[#fcfcfc] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-2.5">
          <p className="m-0 text-[13px] font-medium text-amber-900">Bản xem trước trang sản phẩm. Các nút mua hàng không hoạt động ở đây.</p>
          <button type="button" onClick={onClose} aria-label="Đóng xem trước" className="cursor-pointer rounded-lg p-1.5 text-amber-900 hover:bg-amber-100">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-9 px-5 py-6 md:grid-cols-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <div>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
              <img src={product.images[image] || product.thumbnail} alt={product.title} style={S.mainImg} className="cursor-zoom-in transition-transform duration-200 hover:scale-150 motion-reduce:transition-none" />
              <span style={{ position: 'absolute', top: 12, right: 12, background: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <Heart size={18} color="#555" />
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {product.images.slice(0, 4).map((img, i) => (
                <img key={i} src={img} alt={`Ảnh ${i + 1}`} style={S.thumb(image === i)} onClick={() => setImage(i)} />
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Store size={14} color="#008000" />
              <span style={{ fontSize: 13, color: '#008000', fontWeight: 700 }}>{product.shopInfo?.name}</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1f1f1f', margin: '0 0 12px', lineHeight: 1.3 }}>{product.title}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {product.category && <span style={S.tag('#fff', '#008000')}>{product.category}</span>}
              {(product.tags || []).slice(0, 3).map((t) => <span key={t} style={S.tag('#555', '#f0f0f0')}>{t}</span>)}
            </div>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#008000', lineHeight: 1 }}>{product.price.toLocaleString('vi-VN')}đ</span>
            <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Giá đã bao gồm VAT</p>

            {product.colors.length > 0 && (
              <>
                <p style={S.label}>Màu sắc: {chosen(color)}</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {product.colors.map((c) => (
                    <button key={c.name} type="button" title={c.name} aria-label={c.name} style={S.dot(c.hex, color === c.name)} onClick={() => setColor(c.name)} />
                  ))}
                </div>
              </>
            )}
            {sizes.length > 0 && (
              <>
                <p style={S.label}>Kích cỡ: {chosen(size)}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sizes.map((sz) => <button key={sz} type="button" style={S.option(size === sz)} onClick={() => setSize(sz)}>{sz}</button>)}
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#555' }}>Số lượng:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ width: 32, height: 34, background: '#f5f5f5', fontSize: 18, fontWeight: 700, textAlign: 'center', lineHeight: '34px' }}>−</span>
                <span style={{ width: 36, textAlign: 'center', fontWeight: 700 }}>1</span>
                <span style={{ width: 32, height: 34, background: '#f5f5f5', fontSize: 18, fontWeight: 700, textAlign: 'center', lineHeight: '34px' }}>+</span>
              </div>
              <span style={{ fontSize: 12, color: '#888' }}>Còn {product.stock} sản phẩm</span>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }} aria-hidden>
              <span style={S.chat}><MessageCircle size={18} /> Chat ngay</span>
              <span style={S.outline}><ShoppingCart size={18} /> Thêm vào giỏ</span>
              <span style={S.fill}><Zap size={18} /> Mua ngay</span>
            </div>

            <div style={{ border: '1px solid #eee', borderRadius: 10, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', fontWeight: 700, fontSize: 14, color: '#330033' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Truck size={15} color="#008000" /> Mô tả sản phẩm</span>
                <ChevronUp size={16} />
              </div>
              <div style={{ padding: '0 16px 14px', fontSize: 13.5, color: '#555', lineHeight: 1.7 }}>
                {product.description || 'Sản phẩm chất lượng cao, được làm thủ công từ nguyên liệu tự nhiên. Phù hợp làm quà tặng hoặc dùng cá nhân.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
