import React, { useState, useEffect } from 'react';
import { ModalOverlay } from '../../../shared/components/ModalOverlay';
import { ProductItem, ProductFormData, CatalogOption } from '../types/product';
import { productsService } from '../services/productsService';
import { ProductFormImageManager } from './ProductFormImageManager';
import { ProductFormColorManager } from './ProductFormColorManager';
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
  Plus,
  Loader2,
  Check,
  Layers,
} from 'lucide-react';
import { catalogService } from '../../seller/services/catalogService';

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
    colors: [{ name: 'Gỗ sồi tự nhiên', hex: '#5C4033' }]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  /** % hoa hồng sàn. null = chưa tải được, khi đó không hiện giá niêm yết. */
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null);

  // Đề xuất thẻ mới
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagNames, setNewTagNames] = useState<string[]>([]);

  // Đề xuất danh mục mới
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [submittingCat, setSubmittingCat] = useState(false);
  const [catMsg, setCatMsg] = useState<{ text: string; ok: boolean } | null>(null);

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
        colors: product.colors && product.colors.length > 0 ? product.colors : []
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
        ]
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

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = newTagInput.trim();
    if (!val) return;
    // Kiểm tra xem có trùng thẻ đã duyệt trên sàn không
    const matched = tags.find(t => t.name.toLowerCase() === val.toLowerCase());
    if (matched) {
      if (!formData.tagIds.includes(matched._id)) {
        setFormData(prev => ({ ...prev, tagIds: [...prev.tagIds, matched._id] }));
      }
    } else {
      if (!newTagNames.some(t => t.toLowerCase() === val.toLowerCase())) {
        setNewTagNames(prev => [...prev, val]);
      }
    }
    setNewTagInput('');
  };

  const removeNewTag = (name: string) => {
    setNewTagNames(prev => prev.filter(t => t !== name));
  };

  const handleProposeCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSubmittingCat(true);
    setCatMsg(null);
    try {
      await catalogService.proposeCategory({
        name: catName.trim(),
        parent_id: catParentId || undefined,
        description: catDesc.trim() || undefined,
      });
      setCatMsg({ text: 'Đã tạo danh mục thành công và có thể dùng ngay!', ok: true });
      const c = await productsService.getCategories();
      if (Array.isArray(c)) {
        setCategories(c);
        const createdCat = c.find((it: any) => (it.name || '').toLowerCase() === catName.trim().toLowerCase());
        if (createdCat) {
          setFormData(prev => ({ ...prev, categoryId: createdCat._id || createdCat.id }));
        }
      }
      setTimeout(() => {
        setShowCatModal(false);
        setCatName('');
        setCatParentId('');
        setCatDesc('');
        setCatMsg(null);
      }, 1000);
    } catch (err: any) {
      setCatMsg({ text: err.response?.data?.error || err.message || 'Gửi đề xuất danh mục thất bại.', ok: false });
    } finally {
      setSubmittingCat(false);
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Vui lòng nhập tên sản phẩm';
    if (!formData.categoryId) errs.category = 'Vui lòng chọn danh mục';
    if (formData.tagIds.length === 0 && newTagNames.length === 0) errs.tags = 'Vui lòng chọn hoặc đề xuất ít nhất 1 thẻ';
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
      newTagNames,
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
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Tên sản phẩm <span className="text-rose-500">*</span>
              </label>
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                  Danh mục <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCatModal(true)}
                  className="text-xs font-semibold text-[#007700] hover:text-[#005B00] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} /> Đề xuất danh mục
                </button>
              </div>
              <select
                value={formData.categoryId}
                disabled={catalogLoading || categories.length === 0}
                onChange={(e) => {
                  const id = e.target.value;
                  // Giữ luôn tên để bảng/drawer hiển thị được ngay, không phải chờ tải lại.
                  const picked = categories.find((c) => c._id === id);
                  setFormData({ ...formData, categoryId: id, category: picked?.name || '' });
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

            {/* Thẻ sản phẩm — chọn thẻ sẵn có hoặc gõ đề xuất thẻ mới */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                  Thẻ sản phẩm <span className="text-rose-500">*</span>
                  <span className="ml-2 font-medium normal-case tracking-normal text-stone-400">
                    Đã chọn {formData.tagIds.length + newTagNames.length}
                  </span>
                </label>
              </div>

              {/* Input gõ thêm / đề xuất thẻ mới */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Gõ tên thẻ và nhấn Enter hoặc nút Thêm (ví dụ: GomBatTrang, Linen)..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-stone-50/80 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  disabled={!newTagInput.trim()}
                  className="px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 font-jakarta"
                >
                  <Plus size={13} /> Thêm thẻ
                </button>
              </div>

              {/* Danh sách thẻ đang chọn & đề xuất */}
              <div
                className={`flex flex-wrap gap-2 p-3 bg-stone-50/80 border rounded-xl min-h-[52px] ${
                  errors.tags ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
                }`}
              >
                {catalogLoading && <span className="text-xs text-stone-400">Đang tải thẻ...</span>}

                {/* Thẻ đề xuất mới của người bán */}
                {newTagNames.map((name) => (
                  <span
                    key={`new-${name}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 shadow-xs"
                  >
                    #{name} <span className="text-[10px] text-amber-700 font-normal">(Chờ duyệt)</span>
                    <button
                      type="button"
                      onClick={() => removeNewTag(name)}
                      className="ml-1 text-amber-600 hover:text-amber-900 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {/* Thẻ sẵn có của sàn */}
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
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta">
                Giá bán (VNĐ) <span className="text-rose-500">*</span>
              </label>
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

      {/* Modal đề xuất danh mục mới */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 relative">
            <button
              onClick={() => { setShowCatModal(false); setCatMsg(null); }}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2 text-[#007700]">
              <Layers size={20} />
              <h3 className="text-base font-bold text-stone-900 font-jakarta">Đề xuất danh mục mới</h3>
            </div>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              Yêu cầu sẽ được gửi tới Ban quản trị VietCraft. Sau khi được duyệt, danh mục sẽ hiển thị trên toàn hệ thống và trong bộ lọc sản phẩm.
            </p>

            {catMsg && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${catMsg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {catMsg.text}
              </div>
            )}

            <form onSubmit={handleProposeCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đồ gốm men lam, Nến thơm..."
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Danh mục cha (tuỳ chọn)
                </label>
                <select
                  value={catParentId}
                  onChange={e => setCatParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                >
                  <option value="">-- Thuộc cấp cao nhất (Không có cha) --</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mô tả / Lý do đề xuất (tuỳ chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Nêu đặc điểm hoặc lý do nên mở thêm danh mục này..."
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#007700] focus:border-[#007700]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCatModal(false); setCatMsg(null); }}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCat || !catName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all font-jakarta cursor-pointer"
                >
                  {submittingCat ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Gửi đề xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}
