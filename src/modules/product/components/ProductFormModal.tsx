import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ModalOverlay } from '../../../shared/components/ModalOverlay';
import { ProductItem, ProductFormData } from '../types/product';
import { useProductFormState } from '../hooks/useProductFormState';
import { useFocusFormField } from '../hooks/useFocusFormField';
import { ProductFormImageManager } from './ProductFormImageManager';
import { ProductFormBasicFields } from './ProductFormBasicFields';
import { ProductFormColorManager } from './ProductFormColorManager';
import { ProductFormSizeManager } from './ProductFormSizeManager';
import { ProductFormDescriptionEditor } from './ProductFormDescriptionEditor';
import { ProposeCategoryModal } from './ProposeCategoryModal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ProductFormData) => void;
  product?: ProductItem | null;
  loading?: boolean;
  /** Khoá `field` của việc cần sửa F29 (vd. `stock_quantity`) — modal cuộn tới và nháy ô đó. */
  focusField?: string | null;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  loading = false,
  focusField,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);
  const formRef = useRef<HTMLFormElement>(null);
  const {
    formData,
    setFormData,
    errors,
    categories,
    tags,
    catalogLoading,
    catalogSettled,
    catalogError,
    commissionPercent,
    toggleTag,
    newTagNames,
    addTag,
    removeNewTag,
    categoryCreated,
    validate,
    buildSubmitData,
  } = useProductFormState(isOpen, product);
  const [showCatModal, setShowCatModal] = useState(false);

  useFocusFormField(formRef, isOpen, focusField, catalogSettled);

  if (!isOpen) return null;

  const patch = (changes: Partial<ProductFormData>) => setFormData({ ...formData, ...changes });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(buildSubmitData());
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
        <form ref={formRef} id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {catalogError && (
            <div className="px-4 py-3 rounded-xl text-xs font-medium bg-rose-50 border border-rose-200 text-[#BA1A1A]">
              {catalogError}
            </div>
          )}

          <div data-focus-target="images">
            <ProductFormImageManager
              images={formData.images}
              thumbnail={formData.thumbnail}
              onChangeImages={(images, thumbnail) => patch({ images, thumbnail })}
            />
          </div>

          <ProductFormBasicFields
            formData={formData}
            errors={errors}
            categories={categories}
            tags={tags}
            catalogLoading={catalogLoading}
            commissionPercent={commissionPercent}
            onPatch={patch}
            onToggleTag={toggleTag}
            newTagNames={newTagNames}
            onAddTag={addTag}
            onRemoveNewTag={removeNewTag}
            onProposeCategory={() => setShowCatModal(true)}
          />

          <ProductFormColorManager
            colors={formData.colors}
            onChangeColors={(colors) => patch({ colors })}
          />

          {/* Section 3.5: Thanh chuyển đổi Tab & Quản lý Quy cách / Kích thước sản phẩm */}
          <ProductFormSizeManager
            sizes={formData.sizes || []}
            onChangeSizes={(sizes) => patch({ sizes })}
            categoryName={formData.category}
            productTitle={formData.title}
          />

          <ProductFormDescriptionEditor
            value={formData.description}
            onChange={(description) => patch({ description })}
          />
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
      {showCatModal && (
        <ProposeCategoryModal categories={categories} onClose={() => setShowCatModal(false)} onCreated={categoryCreated} />
      )}
    </ModalOverlay>
  );
}
