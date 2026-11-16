import { ProductFormData, CatalogOption } from '../types/product';
import { commissionAmount, withCommission } from '../../../shared/utils/commission';
import { money } from '../../../shared/utils/format';
import { Plus, Sparkles } from 'lucide-react';
import { ProductFormTagField } from './ProductFormTagField';
import { MaterialInput } from './MaterialInput';

interface ProductFormBasicFieldsProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  categories: CatalogOption[];
  tags: CatalogOption[];
  catalogLoading: boolean;
  commissionPercent: number | null;
  onPatch: (patch: Partial<ProductFormData>) => void;
  onToggleTag: (id: string) => void;
  newTagNames: string[];
  onAddTag: (name: string) => void;
  onRemoveNewTag: (name: string) => void;
  onProposeCategory: () => void;
  onOpenAiModal?: () => void;
}

const LABEL_CLASS = 'block text-xs font-bold text-stone-700 uppercase tracking-wider font-jakarta';

export function ProductFormBasicFields({
  formData,
  errors,
  categories,
  tags,
  catalogLoading,
  commissionPercent,
  onPatch,
  onToggleTag,
  newTagNames,
  onAddTag,
  onRemoveNewTag,
  onProposeCategory,
  onOpenAiModal,
}: ProductFormBasicFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Header bar with AI Suggestion Button */}
      {onOpenAiModal && (
        <div className="md:col-span-2 flex items-center justify-between pb-1 border-b border-stone-100">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-jakarta">Thông tin chung</span>
          <button
            type="button"
            onClick={onOpenAiModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span>✨ AI Gợi ý tên, giá & từ khóa hot</span>
          </button>
        </div>
      )}

      {/* Title */}
      <div className="md:col-span-2 space-y-1.5" data-focus-target="title">
        <label className={LABEL_CLASS}>
          Tên sản phẩm <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          placeholder="VD: Bình gốm Bát Tràng men rạn cổ..."
          value={formData.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className={`w-full px-3.5 py-2.5 bg-stone-50/80 border rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] ${
            errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
          }`}
        />
        {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLASS}>
            Danh mục <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={onProposeCategory}
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
            onPatch({ categoryId: id, category: picked?.name || '' });
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

      <ProductFormTagField
        tags={tags}
        tagIds={formData.tagIds}
        newTagNames={newTagNames}
        catalogLoading={catalogLoading}
        error={errors.tags}
        labelClass={LABEL_CLASS}
        onToggleTag={onToggleTag}
        onAddTag={onAddTag}
        onRemoveNewTag={onRemoveNewTag}
      />

      <div className="md:col-span-2" data-focus-target="materials">
        <MaterialInput value={formData.materials || []} onChange={(materials) => onPatch({ materials })} />
      </div>

      {/* Price */}
      <div className="space-y-1.5" data-focus-target="price">
        <label className={LABEL_CLASS}>
          Giá bán (VNĐ) <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          min="0"
          step="any"
          placeholder="VD: 150000"
          value={formData.price || ''}
          onChange={(e) => onPatch({ price: Number(e.target.value) })}
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
      <div className="space-y-1.5" data-focus-target="stock">
        <label className={LABEL_CLASS}>
          Số lượng tồn kho <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          min="0"
          placeholder="VD: 50"
          value={formData.stock !== undefined ? formData.stock : ''}
          onChange={(e) => onPatch({ stock: Number(e.target.value) })}
          className={`w-full px-3.5 py-2.5 bg-stone-50/80 border rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] ${
            errors.stock ? 'border-rose-400 bg-rose-50/30' : 'border-stone-200'
          }`}
        />
        {errors.stock && <p className="text-xs text-rose-500">{errors.stock}</p>}
      </div>

      {/* Material */}
      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>
          Chất liệu sản phẩm
        </label>
        <input
          type="text"
          placeholder="VD: Gốm Bát Tràng men rạn, Lụa tơ tằm, Gỗ hương..."
          value={formData.material || ''}
          onChange={(e) => onPatch({ material: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
        />
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>
          Xuất xứ / Xưởng sản xuất
        </label>
        <input
          type="text"
          placeholder="VD: Xưởng may TP.HCM, Làng gốm Bát Tràng..."
          value={formData.location}
          onChange={(e) => onPatch({ location: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700]"
        />
      </div>

      {/* SKU */}
      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>
          Mã SKU (Tự động nếu trống)
        </label>
        <input
          type="text"
          placeholder="VD: BLANK-TSHIRT-BLK-M"
          value={formData.sku}
          onChange={(e) => onPatch({ sku: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] font-mono"
        />
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label className={LABEL_CLASS}>
          Trạng thái
        </label>
        <select
          value={formData.status}
          onChange={(e) => onPatch({ status: e.target.value as ProductFormData['status'] })}
          className="w-full px-3.5 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#007700]/20 focus:border-[#007700] cursor-pointer font-medium"
        >
          <option value="ACTIVE">Đang bán (Active)</option>
          <option value="INACTIVE">Tạm dừng (Inactive)</option>
          <option value="OUT_OF_STOCK">Hết hàng (Out of stock)</option>
        </select>
      </div>
    </div>
  );
}
