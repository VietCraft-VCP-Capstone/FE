import React, { useState, useEffect } from 'react';
import { ModalOverlay } from '../../../shared/components/ModalOverlay';
import { ProductItem, ProductFormData, CatalogOption } from '../types/product';
import { productsService } from '../services/productsService';
import { ProductFormImageManager } from './ProductFormImageManager';
import { ProductFormColorManager } from './ProductFormColorManager';
import { ProductFormSizeManager } from './ProductFormSizeManager';
import { commissionAmount, netFromGross, withCommission } from '../../../shared/utils/commission';
import { money } from '../../../shared/utils/format';
import {
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Minus,
  Sparkles
} from 'lucide-react';
import SmartProductAiModal from '../../seller/components/SmartProductAiModal';

export type CategoryVariantType = 'apparel' | 'shoes' | 'general';

export const getCategoryVariantType = (categoryName?: string, title?: string, location?: string): CategoryVariantType => {
  const text = `${categoryName || ''} ${title || ''} ${location || ''}`.toLowerCase();
  
  // 1. Giày dép & Thể thao
  const shoeKeywords = [
    'giày', 'giay', 'dép', 'dep', 'guốc', 'guoc', 'sneaker', 'sandal', 'sandals', 
    'boot', 'boots', 'loafer', 'footwear', 'đá bóng', 'da bong', 'đá banh', 'da banh'
  ];
  if (shoeKeywords.some(k => text.includes(k))) {
    return 'shoes';
  }

  // 2. May mặc / Thời trang
  const apparelKeywords = [
    'áo', 'ao', 'quần', 'quan', 'hoodie', 't-shirt', 'tshirt', 'polo', 'tank top', 'shirt', 
    'thời trang', 'váy', 'vay', 'đầm', 'dam', 'khoác', 'jacket', 'jean', 'quần áo', 'trang phục', 'apparel', 'fashion'
  ];
  if (apparelKeywords.some(k => text.includes(k))) {
    return 'apparel';
  }

  // 3. Đồ thủ công mỹ nghệ, decor, gốm sứ, đồ gỗ, phụ kiện...
  return 'general';
};

export const isApparelCategory = (categoryName?: string): boolean => {
  return getCategoryVariantType(categoryName) === 'apparel';
};

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ProductFormData) => void;
  product?: ProductItem | null;
  loading?: boolean;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  loading = false,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);

  // Danh mục + thẻ do admin quản lý; nạp một lần khi mở modal.
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [tags, setTags] = useState<CatalogOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    category: '',
    categoryId: '',
    tagIds: [],
    price: 0,
    stock: 10,
    sku: '',
    location: '',
    rank: 0,
    status: 'ACTIVE',
    description: '',
    thumbnail: '',
    images: [],
    colors: [{ name: 'Gỗ sồi tự nhiên', hex: '#5C4033' }],
    sizes: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  /** % hoa hồng sàn. null = chưa tải được, khi đó không hiện giá niêm yết. */
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    setCatalogLoading(true);
    setCatalogError('');
    Promise.all([productsService.getCategories(), productsService.getTags()])
      .then(([c, t]) => {
        if (!alive) return;
        setCategories(Array.isArray(c) ? c : []);
        setTags(Array.isArray(t) ? t : []);
      })
      .catch(() => {
        if (alive) setCatalogError('Không tải được danh mục và thẻ. Đóng modal rồi thử lại.');
      })
      .finally(() => { if (alive) setCatalogLoading(false); });
    return () => { alive = false; };
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      const rawImages = product.images && product.images.length > 0
        ? [...product.images]
        : (product.thumbnail ? [product.thumbnail] : []);
      const activeThumb = product.thumbnail || rawImages[0] || '';
      let orderedImages = [...rawImages];
      if (activeThumb && orderedImages.includes(activeThumb)) {
        orderedImages = [activeThumb, ...orderedImages.filter(img => img !== activeThumb)];
      }

      setFormData({
        title: product.title || '',
        category: product.category || '',
        // id được dò ngược từ tên ở effect bên dưới, sau khi catalog tải xong.
        categoryId: '',
        tagIds: [],
        price: product.price || 0,
        stock: product.stock !== undefined ? product.stock : 10,
        sku: product.sku || '',
        location: product.location || '',
        rank: product.rank || 0,
        status: product.status || 'ACTIVE',
        description: product.description || '',
        thumbnail: activeThumb,
        images: orderedImages,
        colors: product.colors && product.colors.length > 0 ? product.colors : [],
        sizes: product.sizes && product.sizes.length > 0 
          ? product.sizes 
          : Array.from(new Set((product.variants || []).map(v => v.size).filter(Boolean))) as string[]
      });
    } else {
      setFormData({
        title: '',
        category: '',
        categoryId: '',
        tagIds: [],
        price: 0,
        stock: 50,
        sku: '',
        location: '',
        rank: 1,
        status: 'ACTIVE',
        description: '',
        thumbnail: '',
        images: [],
        colors: [
          { name: 'Đen', hex: '#1C1C1C' },
          { name: 'Trắng', hex: '#FFFFFF' }
        ],
        sizes: []
      });
    }
    setErrors({});
  }, [product, isOpen]);

  // ProductItem chỉ mang TÊN danh mục/thẻ (BE trả `categories[0]` và `tags[]`),
  // nên khi sửa phải dò ngược sang id — và chỉ làm được sau khi catalog tải xong.
  useEffect(() => {
    if (!product || categories.length === 0) return;
    const key = (x?: string) => (x || '').trim().toLowerCase();
    const matchedCategory = categories.find(c => key(c.name) === key(product.category));
    const matchedTagIds = (product.tags || [])
      .map(name => tags.find(t => key(t.name) === key(name))?._id)
      .filter((id): id is string => Boolean(id));
    setFormData(prev => ({
      ...prev,
      categoryId: matchedCategory?._id || '',
      tagIds: matchedTagIds,
    }));
  }, [product, categories, tags]);

  // Mức hoa hồng phụ thuộc danh mục: đổi danh mục là mức có thể đổi theo, nên phải hỏi lại.
  // Hàng ở form này luôn là READY_TO_SHIP.
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    productsService
      .getCommissionPercent(formData.categoryId, 'READY_TO_SHIP')
      .then(p => alive && setCommissionPercent(p))
      .catch(() => alive && setCommissionPercent(null));
    return () => { alive = false; };
  }, [isOpen, formData.categoryId]);

  // API trả về giá NIÊM YẾT (đã gồm hoa hồng), còn ô "Giá bán" là giá người bán NHẬN.
  // Không bóc lại thì mỗi lần lưu là hoa hồng cộng chồng thêm một lớp.
  useEffect(() => {
    if (!product || commissionPercent === null) return;
    setFormData(prev => ({ ...prev, price: netFromGross(product.price || 0, commissionPercent) }));
  }, [product, commissionPercent]);

  const toggleTag = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter(t => t !== id)
        : [...prev.tagIds, id],
    }));
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Vui lòng nhập tên sản phẩm';
    if (!formData.categoryId) errs.category = 'Vui lòng chọn danh mục';
    if (formData.tagIds.length === 0) errs.tags = 'Vui lòng chọn ít nhất 1 thẻ';
    if (formData.price <= 0) errs.price = 'Giá bán phải lớn hơn 0';
    if (formData.stock < 0) errs.stock = 'Tồn kho không được âm';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    let finalImages = [...formData.images];
    const targetCover = formData.thumbnail || finalImages[0] || '';
    if (targetCover && finalImages.includes(targetCover)) {
      finalImages = [targetCover, ...finalImages.filter(img => img !== targetCover)];
    }
    onSubmit({
      ...formData,
      images: finalImages,
      thumbnail: targetCover,
    });
  };

  const handleInsertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('product-description-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || 'nội dung';
    const replacement = `${prefix}${selectedText}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setFormData({ ...formData, description: newText });
  };

  return (
    <ModalOverlay>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-200 bg-stone-50/90">
          <div>
            <h3 className="text-lg font-extrabold text-stone-900 font-jakarta">
              {isEdit ? 'Chỉnh sửa thông tin sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {isEdit ? `Mã SKU: ${product?.sku}` : 'Điền đầy đủ thông tin mẫu áo, hình in và bảng size'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Image Gallery & Upload */}
          {catalogError && (
            <div className="px-4 py-3 rounded-xl text-xs font-medium bg-rose-50 border border-rose-200 text-[#BA1A1A]">
              {catalogError}
            </div>
          )}

          <ProductFormImageManager
            images={formData.images}
            thumbnail={formData.thumbnail}
            onChangeImages={(images, thumbnail) => setFormData({ ...formData, images, thumbnail })}
          />

          {/* Section 2: Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                  Tên sản phẩm <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer ${
                    isAiModalOpen
                      ? 'bg-emerald-800 text-white ring-2 ring-emerald-500'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white'
                  }`}
                >
                  <Sparkles size={13} className="text-amber-300 animate-pulse" />
                  <span>{isAiModalOpen ? '✕ Thu gọn trợ lý AI' : '✨ AI Gợi ý tên, giá & tag hot'}</span>
                </button>
              </div>

              {/* Trợ lý AI hiển thị trực tiếp (Inline Assistant) - Không mở modal đè lên modal */}
              {isAiModalOpen && (
                <div className="pt-1 pb-1">
                  <SmartProductAiModal
                    mode="inline"
                    isOpen={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    categories={categories}
                    initialCategory={formData.categoryId}
                    initialTitle={formData.title}
                    isPod={false}
                    onApplyTitle={(newTitle) => setFormData(prev => ({ ...prev, title: newTitle }))}
                    onApplyPrice={(newPrice) => setFormData(prev => ({ ...prev, price: newPrice }))}
                    onApplyDescription={(newDesc) => setFormData(prev => ({ ...prev, description: newDesc }))}
                    onApplyTags={(tagNames) => {
                      const matchedIds = tags
                        .filter(t => tagNames.some(tn => tn.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(tn.toLowerCase())))
                        .map(t => t._id);
                      if (matchedIds.length > 0) {
                        setFormData(prev => ({
                          ...prev,
                          tagIds: Array.from(new Set([...prev.tagIds, ...matchedIds]))
                        }));
                      }
                    }}
                    onApplyAll={(aiData) => {
                      setFormData(prev => {
                        const matchedIds = tags
                          .filter(t => (aiData.tags || []).some(tn => tn.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(tn.toLowerCase())))
                          .map(t => t._id);
                        return {
                          ...prev,
                          title: aiData.title || prev.title,
                          price: aiData.price > 0 ? aiData.price : prev.price,
                          description: aiData.description || prev.description,
                          categoryId: aiData.categoryId || prev.categoryId,
                          tagIds: matchedIds.length > 0 ? Array.from(new Set([...prev.tagIds, ...matchedIds])) : prev.tagIds,
                        };
                      });
                      setIsAiModalOpen(false);
                    }}
                  />
                </div>
              )}
              <input
                type="text"
                placeholder="VD: Bình gốm Bát Tràng men rạn cổ..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-stone-50/80 border rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] ${
                  errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
                }`}
              />
              {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Danh mục <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                disabled={catalogLoading || categories.length === 0}
                onChange={(e) => {
                  const id = e.target.value;
                  // Giữ luôn tên để bảng/drawer hiển thị được ngay, không phải chờ tải lại.
                  const picked = categories.find((c) => c._id === id);
                  const catName = picked?.name || '';
                  setFormData((prev) => {
                    const nextCatType = getCategoryVariantType(catName, prev.title, prev.location);
                    let nextSizes = prev.sizes || [];

                    if (nextSizes.length === 0) {
                      if (nextCatType === 'apparel') nextSizes = ['S', 'M', 'L', 'XL'];
                      else if (nextCatType === 'shoes') nextSizes = ['39', '40', '41', '42'];
                    } else if (nextCatType === 'shoes' && nextSizes.some(s => ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Freesize'].includes(s))) {
                      // Chuyển sang Giày dép: tự động đổi sang size số
                      nextSizes = ['39', '40', '41', '42'];
                    } else if (nextCatType === 'apparel' && nextSizes.every(s => /^\d{2}$/.test(s))) {
                      // Chuyển sang May mặc: tự động đổi sang size chữ
                      nextSizes = ['S', 'M', 'L', 'XL'];
                    }

                    return {
                      ...prev,
                      categoryId: id,
                      category: catName,
                      sizes: nextSizes
                    };
                  });
                }}
                className={`w-full px-3.5 py-2.5 bg-stone-50/80 border rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] cursor-pointer font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                  errors.category ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
                }`}
              >
                <option value="">
                  {catalogLoading ? 'Đang tải danh mục...' : '— Chọn danh mục —'}
                </option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-rose-500">{errors.category}</p>}
            </div>

            {/* Thẻ sản phẩm — bắt buộc ít nhất 1, chọn từ thẻ sàn đã duyệt */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Thẻ sản phẩm <span className="text-rose-500">*</span>
                <span className="ml-2 font-medium normal-case tracking-normal text-stone-400">
                  Đã chọn {formData.tagIds.length}
                </span>
              </label>
              <div
                className={`flex flex-wrap gap-2 p-3 bg-stone-50/80 border rounded-xl min-h-[52px] ${
                  errors.tags ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
                }`}
              >
                {catalogLoading && <span className="text-xs text-stone-400">Đang tải thẻ...</span>}
                {!catalogLoading && tags.length === 0 && (
                  <span className="text-xs text-stone-400">Sàn chưa duyệt thẻ nào.</span>
                )}
                {tags.map((tag) => {
                  const picked = formData.tagIds.includes(tag._id);
                  return (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => toggleTag(tag._id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                        picked
                          ? 'font-bold text-white border-transparent shadow-xs'
                          : 'font-medium text-stone-600 bg-white border-stone-200 hover:border-stone-400'
                      }`}
                      style={picked ? { backgroundColor: tag.color || '#007700' } : undefined}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              {errors.tags && <p className="text-xs text-rose-500">{errors.tags}</p>}
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                  Giá bán (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles size={11} className="text-amber-500" />
                  <span>Khảo sát giá AI</span>
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="VD: 150000"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className={`w-full px-3.5 py-2.5 bg-stone-50/80 border rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] font-jakarta font-bold ${
                  errors.price ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
                }`}
              />
              {errors.price && <p className="text-xs text-rose-500">{errors.price}</p>}
              <p className="text-xs text-stone-500">
                Đây là số tiền bạn nhận.{' '}
                {commissionPercent === null ? (
                  'Chưa tải được % hoa hồng sàn nên chưa tính được giá niêm yết.'
                ) : formData.price > 0 ? (
                  <>
                    Cộng {commissionPercent}% hoa hồng sàn (+{money(commissionAmount(formData.price, commissionPercent))}),
                    giá niêm yết người mua trả là{' '}
                    <b className="text-[#007700]">{money(withCommission(formData.price, commissionPercent))}</b>.
                  </>
                ) : (
                  `Giá niêm yết sẽ là số này cộng ${commissionPercent}% hoa hồng sàn.`
                )}
              </p>
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Số lượng tồn kho <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="VD: 50"
                value={formData.stock !== undefined ? formData.stock : ''}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className={`w-full px-3.5 py-2.5 bg-stone-50/80 border rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] ${
                  errors.stock ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
                }`}
              />
              {errors.stock && <p className="text-xs text-rose-500">{errors.stock}</p>}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Xuất xứ / Xưởng sản xuất
              </label>
              <input
                type="text"
                placeholder="VD: Xưởng may TP.HCM, Xưởng in Hà Nội..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Mã SKU (Tự động nếu trống)
              </label>
              <input
                type="text"
                placeholder="VD: BLANK-TSHIRT-BLK-M"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] font-mono"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] cursor-pointer font-medium"
              >
                <option value="ACTIVE">Đang bán (Active)</option>
                <option value="INACTIVE">Tạm dừng (Inactive)</option>
                <option value="OUT_OF_STOCK">Hết hàng (Out of stock)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Color Variants */}
          <ProductFormColorManager
            colors={formData.colors}
            onChangeColors={(colors) => setFormData({ ...formData, colors })}
          />

          {/* Section 3.5: Thanh chuyển đổi Tab & Quản lý Quy cách / Kích thước sản phẩm */}
          <ProductFormSizeManager
            sizes={formData.sizes || []}
            onChangeSizes={(sizes) => setFormData({ ...formData, sizes })}
            categoryName={formData.category}
            productTitle={formData.title}
          />

          {/* Section 4: Description */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
              Mô tả chi tiết sản phẩm
            </label>

            <div className="flex items-center gap-1 p-1.5 bg-stone-100 border border-stone-200 rounded-t-xl">
              <button
                type="button"
                onClick={() => handleInsertFormatting('**', '**')}
                className="p-1.5 text-stone-600 hover:bg-white rounded cursor-pointer"
                title="In đậm"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('*', '*')}
                className="p-1.5 text-stone-600 hover:bg-white rounded cursor-pointer"
                title="In nghiêng"
              >
                <Italic size={14} />
              </button>
              <span className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => handleInsertFormatting('\n- ')}
                className="p-1.5 text-stone-600 hover:bg-white rounded cursor-pointer"
                title="Danh sách gạch đầu dòng"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('\n1. ')}
                className="p-1.5 text-stone-600 hover:bg-white rounded cursor-pointer"
                title="Danh sách đánh số"
              >
                <ListOrdered size={14} />
              </button>
              <span className="w-px h-4 bg-stone-300 mx-1" />
              <button
                type="button"
                onClick={() => handleInsertFormatting('[', '](https://...)')}
                className="p-1.5 text-stone-600 hover:bg-white rounded cursor-pointer"
                title="Chèn link"
              >
                <LinkIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('\n---\n')}
                className="p-1.5 text-stone-600 hover:bg-white rounded cursor-pointer"
                title="Đường kẻ"
              >
                <Minus size={14} />
              </button>
            </div>

            <textarea
              id="product-description-editor"
              rows={4}
              placeholder="Nhập mô tả chi tiết sản phẩm, chất liệu vải, công nghệ in ấn, bảng size..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3.5 bg-stone-50/80 border border-stone-200 border-t-0 rounded-b-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] resize-y"
            />
          </div>
        </form>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50/90">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#007700] text-white text-sm font-extrabold rounded-xl hover:bg-[#005B00] shadow-sm shadow-[#007700]/30 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 font-jakarta"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </button>
        </div>

      </div>
    </ModalOverlay>
  );
}
