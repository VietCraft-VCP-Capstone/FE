import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { FormSection } from './form/formUi';
import { buildFormNav } from './form/formSections';
import { ProductFormNav } from './form/ProductFormNav';
import { ProductFormPricing } from './form/ProductFormPricing';
import { ProductFormPreview } from './form/ProductFormPreview';
import { ProductFormDetails } from './form/ProductFormDetails';
import { ModalOverlay } from '../../../shared/components/ModalOverlay';
import { ProductItem, ProductFormData } from '../types/product';
import { useProductFormState } from '../hooks/useProductFormState';
import type { ProductPrefillDraft } from '../hooks/useProductFormDeepLink';
import { useFocusFormField } from '../hooks/useFocusFormField';
import { ProductFormImageManager } from './ProductFormImageManager';
import { ProductFormBasicFields } from './ProductFormBasicFields';
import { ProductFormColorManager } from './ProductFormColorManager';
import { ProductFormSizeManager } from './ProductFormSizeManager';
import { ProductFormSkuTable } from './ProductFormSkuTable';
import { ProductFormDescriptionEditor } from './ProductFormDescriptionEditor';
import { ProposeCategoryModal } from './ProposeCategoryModal';
import { ImageRecognitionPanel } from './ImageRecognitionPanel';

import SmartProductAiModal from '../../seller/components/SmartProductAiModal';
import { netFromGross } from '../../../shared/utils/commission';

/** Gộp chất liệu AI gợi ý ("Lụa tơ tằm, Gỗ") vào ô chất liệu: bỏ trùng (không phân biệt hoa thường), tối đa 5 như MaterialInput. */
function mergeMaterials(current: string[] = [], suggested: string): string[] {
  const out = [...current];
  for (const raw of suggested.split(/[,;]/)) {
    const name = raw.trim().slice(0, 40);
    if (name && out.length < 5 && !out.some(x => x.toLowerCase() === name.toLowerCase())) out.push(name);
  }
  return out;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ProductFormData) => void;
  product?: ProductItem | null;
  prefill?: ProductPrefillDraft | null;
  loading?: boolean;
  /** Khoá `field` của việc cần sửa F29 (vd. `stock_quantity`) — modal cuộn tới và nháy ô đó. */
  focusField?: string | null;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  prefill,
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
  } = useProductFormState(isOpen, product, prefill);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [activeId, setActiveId] = useState('pf-images');

  useFocusFormField(formRef, isOpen, focusField, catalogSettled);

  if (!isOpen) return null;

  const patch = (changes: Partial<ProductFormData>) => setFormData({ ...formData, ...changes });
  const navItems = buildFormNav(formData, newTagNames.length, errors);
  const errorCount = navItems.filter((i) => i.state === 'error').length;
  const scrollTo = (selector: string, block: ScrollLogicalPosition) =>
    formRef.current?.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block });

  const handleScroll = (e: React.UIEvent<HTMLFormElement>) => {
    const line = e.currentTarget.scrollTop + 120;
    let current = 'pf-images';
    e.currentTarget.querySelectorAll<HTMLElement>('section[id]').forEach((s) => {
      if (s.offsetTop <= line) current = s.id;
    });
    if (current !== activeId) setActiveId(current);
  };
  // AI gợi ý giá KHÁCH TRẢ; ô "Giá bán" là giá seller nhận (BE cộng hoa hồng lúc lưu) → bóc hoa hồng trước khi điền
  const toNetPrice = (listPrice: number) =>
    commissionPercent === null ? listPrice : netFromGross(listPrice, commissionPercent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      requestAnimationFrame(() => scrollTo('[data-invalid]', 'center'));
      return;
    }
    onSubmit(buildSubmitData());
  };

  return (
    <ModalOverlay>
      <div className="my-auto flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="m-0 text-lg font-bold text-stone-900">
              {isEdit ? 'Chỉnh sửa thông tin sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="cursor-pointer rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <ProductFormNav items={navItems} activeId={activeId} onJump={(id) => scrollTo(`#${id}`, 'start')}>
            <ProductFormPreview
              formData={formData}
              commissionPercent={commissionPercent}
              tagNames={[...tags.filter((t) => formData.tagIds.includes(t._id)).map((t) => t.name), ...newTagNames]}
              shopName={product?.shopInfo?.name}
            />
          </ProductFormNav>

          <form
            ref={formRef}
            id="product-form"
            onSubmit={handleSubmit}
            onScroll={handleScroll}
            noValidate
            className="relative min-w-0 flex-1 space-y-4 overflow-y-auto bg-stone-100 p-4 sm:p-5"
          >
            {catalogError && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-[#BA1A1A]">
                {catalogError}
              </div>
            )}

            <FormSection id="pf-images" title="Hình ảnh" >
              <div data-focus-target="images">
                <ProductFormImageManager
                  images={formData.images}
                  thumbnail={formData.thumbnail}
                  onChangeImages={(images, thumbnail) => patch({ images, thumbnail })}
                />
              </div>
              {/* Seller tải ảnh mà chưa nhập tên → AI đọc ảnh và điền tên sản phẩm */}
              <ImageRecognitionPanel
                imageUrls={[...new Set([formData.thumbnail, ...formData.images].filter(Boolean))]}
                colors={formData.colors}
                title={formData.title}
                categoryId={formData.categoryId}
                categories={categories}
                materials={formData.materials || []}
                onApply={(p) => patch(p)}
              />
            </FormSection>

            <FormSection
              id="pf-basic"
              title="Thông tin cơ bản"
              action={
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[#BECAB6] bg-[#EAF0E2] px-3 text-[13px] font-semibold text-[#005B00] transition-colors hover:border-[#007700]"
                >
                  Gợi ý tên, giá và từ khóa
                </button>
              }
            >
              <ProductFormBasicFields
                formData={formData}
                errors={errors}
                categories={categories}
                tags={tags}
                catalogLoading={catalogLoading}
                onPatch={patch}
                onToggleTag={toggleTag}
                newTagNames={newTagNames}
                onAddTag={addTag}
                onRemoveNewTag={removeNewTag}
                onProposeCategory={() => setShowCatModal(true)}
              />
            </FormSection>

            <FormSection id="pf-pricing" title="Giá và kho">
              <ProductFormPricing formData={formData} errors={errors} commissionPercent={commissionPercent} onPatch={patch} />
            </FormSection>

            <FormSection id="pf-variants" title="Phân loại">
              <div className="space-y-5">
                {!formData.skus && (
                  <ProductFormColorManager colors={formData.colors} onChangeColors={(colors) => patch({ colors })} />
                )}
                <ProductFormSizeManager
                  sizes={formData.sizes || []}
                  onChangeSizes={(sizes) => patch({ sizes })}
                  categoryName={formData.category}
                  productTitle={formData.title}
                />
                <ProductFormSkuTable
                  skus={formData.skus}
                  sizes={formData.sizes || []}
                  defaultPrice={formData.price}
                  error={errors.skus}
                  onChange={(skus) => patch({ skus })}
                />
              </div>
            </FormSection>

            <FormSection id="pf-details" title="Chi tiết" description="Không bắt buộc.">
              <ProductFormDetails formData={formData} onPatch={patch} />
            </FormSection>

            <FormSection id="pf-description" title="Mô tả">
              <ProductFormDescriptionEditor value={formData.description} onChange={(description) => patch({ description })} />
            </FormSection>
          </form>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-6 py-3.5">
          <p role="status" className="m-0 min-w-0 truncate text-[13px] font-medium text-rose-600">
            {errorCount > 0 && `Còn ${errorCount} phần bắt buộc cần sửa`}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 cursor-pointer rounded-lg px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={loading}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-[#007700] px-5 text-sm font-bold text-white transition-colors hover:bg-[#005B00] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </button>
          </div>
        </div>
      </div>

      {showCatModal && (
        <ProposeCategoryModal categories={categories} onClose={() => setShowCatModal(false)} onCreated={categoryCreated} />
      )}

      {showAiModal && (
        <SmartProductAiModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          categories={categories}
          initialCategory={formData.categoryId}
          initialTitle={formData.title}
          initialMaterial={(formData.materials || []).join(', ')}
          blankCost={0}
          commissionPercent={commissionPercent}
          existingContent={{ title: formData.title, description: formData.description }}
          isPod={false}
          onApplyTitle={(t) => patch({ title: t })}
          onApplyPrice={(p) => patch({ price: toNetPrice(p) })}
          onApplyDescription={(d) => patch({ description: d })}
          onApplyMaterial={(m) => patch({ materials: mergeMaterials(formData.materials, m) })}
          onApplyTags={(tagList) => {
            tagList.forEach(t => addTag(t));
          }}
          onApplyAll={(aiData) => {
            const updates: Partial<ProductFormData> = {};
            if (aiData.title) updates.title = aiData.title;
            if (aiData.price > 0) updates.price = toNetPrice(aiData.price);
            if (aiData.description) updates.description = aiData.description;
            if (aiData.material) updates.materials = mergeMaterials(formData.materials, aiData.material);
            if (aiData.categoryId) {
              updates.categoryId = aiData.categoryId;
              const matched = categories.find(c => c._id === aiData.categoryId);
              if (matched) updates.category = matched.name;
            }
            patch(updates);
            if (aiData.tags && aiData.tags.length > 0) {
              aiData.tags.forEach(t => addTag(t));
            }
          }}
        />
      )}
    </ModalOverlay>
  );
}
