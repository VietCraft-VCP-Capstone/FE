import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, Loader2, Check } from 'lucide-react';
import { productsService } from '../../product/services/productsService';
import api from '../../../infrastructure/api/interceptors';

const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400';

const absImg = (u: any): string => {
  if (!u || typeof u !== 'string') return '';
  const trimmed = u.trim();
  if (!trimmed || trimmed.startsWith('#')) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return ORIGIN + trimmed;
  return trimmed;
};

interface VariantItem {
  id?: string;
  _id?: string;
  name?: string;
  color?: string;
  size?: string;
  material?: string;
  sku?: string;
  price?: number;
  retail_price?: number;
  stock?: number;
  stock_quantity?: number;
  mockupImage?: string;
  mockup_image?: string;
  images?: string[];
}

interface SelectVariantModalProps {
  isOpen: boolean;
  productId: string | null;
  initialProduct?: any;
  onClose: () => void;
  onAddToCart: (payload: { productId: string; variantId?: string; quantity: number }) => Promise<void>;
}

export const SelectVariantModal: React.FC<SelectVariantModalProps> = ({
  isOpen,
  productId,
  initialProduct,
  onClose,
  onAddToCart,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!isOpen || !productId) {
      setProductData(null);
      setSelectedVariant(null);
      setQuantity(1);
      return;
    }

    let isMounted = true;

    const loadProduct = async () => {
      // If initial preview product is available, initialize it first so user sees UI quickly
      if (initialProduct) {
        initProduct(initialProduct);
      } else {
        setLoading(true);
      }

      // Always fetch full, accurate product details from API
      try {
        const fullProd = await productsService.getById(productId);
        if (isMounted && fullProd) {
          initProduct(fullProd);
        }
      } catch (err) {
        console.error('Failed to load product details for variant modal:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [isOpen, productId]);

  const initProduct = (prod: any) => {
    setProductData(prod);

    const rawVariants: VariantItem[] = Array.isArray(prod?.variants) ? prod.variants : [];
    
    // Normalize variants ensuring name and fields
    const variants = rawVariants.map((v, idx) => {
      const parts = [v.color, v.size, v.material].filter(Boolean);
      const name = parts.length > 0 ? parts.join(' - ') : (v.name && !v.name.includes('Phân loại') ? v.name : (v.sku ? `SKU: ${v.sku}` : `Tùy chọn ${idx + 1}`));
      return {
        ...v,
        name,
        price: Number(v.price ?? v.retail_price ?? prod?.price ?? prod?.retail_price ?? 0),
        stock: Number(v.stock ?? v.stock_quantity ?? prod?.stock ?? 99)
      };
    });

    if (variants.length > 0) {
      const v0 = variants[0];
      setSelectedVariant(v0);
      setSelectedColor(v0.color || '');
      setSelectedSize(v0.size || '');
      setSelectedMaterial(v0.material || '');
    } else {
      setSelectedVariant(null);
      setSelectedColor('');
      setSelectedSize('');
      setSelectedMaterial('');
    }
  };

  if (!isOpen) return null;

  const rawVariants: VariantItem[] = Array.isArray(productData?.variants) ? productData.variants : [];
  const variants = rawVariants.map((v, idx) => {
    const parts = [v.color, v.size, v.material].filter(Boolean);
    const name = parts.length > 0 ? parts.join(' - ') : (v.name && !v.name.includes('Phân loại') ? v.name : (v.sku ? `SKU: ${v.sku}` : `Tùy chọn ${idx + 1}`));
    return {
      ...v,
      name,
      price: Number(v.price ?? v.retail_price ?? productData?.price ?? productData?.retail_price ?? 0),
      stock: Number(v.stock ?? v.stock_quantity ?? productData?.stock ?? 99)
    };
  });
  
  // Extract unique attribute sets
  const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean))) as string[];
  const materials = Array.from(new Set(variants.map(v => v.material).filter(Boolean))) as string[];

  const hasAttributeGroups = colors.length > 0 || sizes.length > 0 || materials.length > 0;

  // Handle attribute selection and auto match variant
  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    const match = variants.find(v => 
      v.color === color &&
      (!selectedSize || v.size === selectedSize) &&
      (!selectedMaterial || v.material === selectedMaterial)
    ) || variants.find(v => v.color === color) || variants[0];

    if (match) {
      setSelectedVariant(match);
      if (match.size) setSelectedSize(match.size);
      if (match.material) setSelectedMaterial(match.material);
    }
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    const match = variants.find(v => 
      v.size === size &&
      (!selectedColor || v.color === selectedColor) &&
      (!selectedMaterial || v.material === selectedMaterial)
    ) || variants.find(v => v.size === size) || variants[0];

    if (match) {
      setSelectedVariant(match);
      if (match.color) setSelectedColor(match.color);
      if (match.material) setSelectedMaterial(match.material);
    }
  };

  const handleSelectMaterial = (mat: string) => {
    setSelectedMaterial(mat);
    const match = variants.find(v => 
      v.material === mat &&
      (!selectedColor || v.color === selectedColor) &&
      (!selectedSize || v.size === selectedSize)
    ) || variants.find(v => v.material === mat) || variants[0];

    if (match) {
      setSelectedVariant(match);
      if (match.color) setSelectedColor(match.color);
      if (match.size) setSelectedSize(match.size);
    }
  };

  const handleDirectSelectVariant = (v: VariantItem) => {
    setSelectedVariant(v);
    if (v.color) setSelectedColor(v.color);
    if (v.size) setSelectedSize(v.size);
    if (v.material) setSelectedMaterial(v.material);
  };

  // Determine current image & price & stock
  const currentImage = 
    absImg(selectedVariant?.mockupImage || selectedVariant?.mockup_image) ||
    absImg(productData?.thumbnail || productData?.image || productData?.images?.[0]) ||
    DEFAULT_IMG;

  const currentPrice = Number(
    selectedVariant?.price ?? 
    selectedVariant?.retail_price ?? 
    productData?.price ?? 
    productData?.retail_price ?? 
    0
  );

  const currentStock = selectedVariant?.stock ?? selectedVariant?.stock_quantity ?? productData?.stock ?? 99;
  const isOutOfStock = currentStock <= 0;

  const currentVariantTitle = [
    selectedColor,
    selectedSize,
    selectedMaterial
  ].filter(Boolean).join(' - ') || selectedVariant?.name || 'Tiêu chuẩn';

  const handleSubmit = async () => {
    if (!productId) return;
    if (isOutOfStock) return;

    const variantId = selectedVariant?._id || selectedVariant?.id;
    setSubmitting(true);
    try {
      await onAddToCart({
        productId,
        variantId: variantId ? String(variantId) : undefined,
        quantity,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-stone-800">
            <ShoppingBag className="w-5 h-5 text-[#15803d]" />
            <h3 className="font-bold text-base">Tùy chọn sản phẩm</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#15803d]" />
              <p className="text-xs font-medium">Đang tải thông tin phân loại...</p>
            </div>
          ) : (
            <>
              {/* Product Brief Preview */}
              <div className="flex gap-4 items-start bg-stone-50/70 p-3.5 rounded-2xl border border-stone-200/70">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-stone-200 shadow-xs">
                  <img
                    src={currentImage}
                    alt={productData?.title || 'Sản phẩm'}
                    className="w-full h-full object-cover transition-all duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMG;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                    {productData?.title || productData?.name || 'Sản phẩm sáng tạo'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {productData?.shopInfo?.name || productData?.shopName || 'VietCraft Selection'}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-[#15803d]">
                      {new Intl.NumberFormat('vi-VN').format(currentPrice)} đ
                    </span>
                    {currentStock > 0 && currentStock <= 10 && (
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                        Chỉ còn {currentStock} món
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-semibold">
                        Hết hàng
                      </span>
                    )}
                  </div>
                  {variants.length > 0 && (
                    <p className="text-[11px] text-gray-600 font-medium mt-1">
                      Đang chọn: <span className="text-[#15803d] font-bold">{currentVariantTitle}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Variant Attribute Selectors */}
              {variants.length > 0 && (
                <div className="space-y-4">
                  {/* Colors */}
                  {colors.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Màu sắc: <span className="text-[#15803d] font-semibold lowercase">{selectedColor}</span>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((c) => {
                          const active = selectedColor === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleSelectColor(c)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                active
                                  ? 'border-[#15803d] bg-emerald-50 text-[#15803d] ring-1 ring-[#15803d] shadow-2xs'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {active && <Check size={12} className="shrink-0" />}
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {sizes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Kích thước: <span className="text-[#15803d] font-semibold">{selectedSize}</span>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((s) => {
                          const active = selectedSize === s;
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => handleSelectSize(s)}
                              className={`min-w-[42px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                                active
                                  ? 'border-[#15803d] bg-emerald-50 text-[#15803d] ring-1 ring-[#15803d] shadow-2xs'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Materials */}
                  {materials.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Chất liệu: <span className="text-[#15803d] font-semibold">{selectedMaterial}</span>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {materials.map((m) => {
                          const active = selectedMaterial === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => handleSelectMaterial(m)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                active
                                  ? 'border-[#15803d] bg-emerald-50 text-[#15803d] ring-1 ring-[#15803d] shadow-2xs'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If variants do not have grouped attributes, show variant cards */}
                  {!hasAttributeGroups && (
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                        Chọn phân loại:
                      </label>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {variants.map((v, idx) => {
                          const vid = v._id || v.id || String(idx);
                          const active = (selectedVariant?._id || selectedVariant?.id) === vid;
                          const vPrice = Number(v.price || v.retail_price || currentPrice);
                          const vImg = absImg(v.mockupImage || v.mockup_image);
                          return (
                            <button
                              key={vid}
                              type="button"
                              onClick={() => handleDirectSelectVariant(v)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                                active
                                  ? 'border-[#15803d] bg-emerald-50/70 text-[#15803d] ring-1 ring-[#15803d] shadow-xs'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {vImg && (
                                  <img 
                                    src={vImg} 
                                    alt="" 
                                    className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" 
                                  />
                                )}
                                <span className="truncate">{v.name}</span>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <span className="font-bold text-[#15803d] block">
                                  {new Intl.NumberFormat('vi-VN').format(vPrice)} đ
                                </span>
                                {v.stock > 0 && v.stock <= 10 && (
                                  <span className="text-[10px] text-amber-600 block">
                                    Còn {v.stock}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800">Số lượng</span>
                  <p className="text-[11px] text-gray-400">Tùy chỉnh số lượng đặt mua</p>
                </div>
                <div className="flex items-center border border-gray-200 rounded-full bg-stone-50 p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-gray-900 select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => (currentStock ? Math.min(currentStock, prev + 1) : prev + 1))}
                    disabled={currentStock > 0 && quantity >= currentStock}
                    className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50/80 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Tạm tính:</span>
            <span className="text-base font-extrabold text-[#15803d]">
              {new Intl.NumberFormat('vi-VN').format(currentPrice * quantity)} đ
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-gray-300 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={loading || submitting || isOutOfStock}
              onClick={handleSubmit}
              className="flex-[2] py-2.5 rounded-full bg-[#15803d] hover:bg-[#166534] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang thêm...</span>
                </>
              ) : isOutOfStock ? (
                <span>Tạm hết hàng</span>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  <span>Thêm vào giỏ hàng</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectVariantModal;
