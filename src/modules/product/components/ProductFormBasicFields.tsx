import { Plus } from 'lucide-react';
import { ProductFormData, CatalogOption } from '../types/product';
import { ProductFormTagField } from './ProductFormTagField';
import { Field, inputClass } from './form/formUi';

interface ProductFormBasicFieldsProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  categories: CatalogOption[];
  tags: CatalogOption[];
  catalogLoading: boolean;
  onPatch: (patch: Partial<ProductFormData>) => void;
  onToggleTag: (id: string) => void;
  newTagNames: string[];
  onAddTag: (name: string) => void;
  onRemoveNewTag: (name: string) => void;
  onProposeCategory: () => void;
}

export function ProductFormBasicFields({
  formData,
  errors,
  categories,
  tags,
  catalogLoading,
  onPatch,
  onToggleTag,
  newTagNames,
  onAddTag,
  onRemoveNewTag,
  onProposeCategory,
}: ProductFormBasicFieldsProps) {
  return (
    <div className="space-y-5">
      <Field
        label="Tên sản phẩm"
        required
        error={errors.title}
        hint="Nêu rõ sản phẩm là gì, chất liệu và điểm nổi bật để người mua dễ tìm thấy."
        focusTarget="title"
      >
        <input
          type="text"
          placeholder="VD: Bình gốm Bát Tràng men rạn cổ..."
          value={formData.title}
          onChange={(e) => onPatch({ title: e.target.value })}
          className={inputClass(errors.title)}
        />
      </Field>

      <Field
        label="Danh mục"
        required
        error={errors.category}
        className="md:max-w-md"
        action={
          <button
            type="button"
            onClick={onProposeCategory}
            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#007700] hover:text-[#005B00] hover:underline"
          >
            <Plus size={13} /> Đề xuất danh mục
          </button>
        }
      >
        <select
          value={formData.categoryId}
          disabled={catalogLoading || categories.length === 0}
          onChange={(e) => {
            const id = e.target.value;
            const picked = categories.find((c) => c._id === id);
            onPatch({ categoryId: id, category: picked?.name || '' });
          }}
          className={inputClass(errors.category, 'cursor-pointer')}
        >
          <option value="">{catalogLoading ? 'Đang tải danh mục...' : '— Chọn danh mục —'}</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </Field>

      <ProductFormTagField
        tags={tags}
        tagIds={formData.tagIds}
        newTagNames={newTagNames}
        catalogLoading={catalogLoading}
        error={errors.tags}
        onToggleTag={onToggleTag}
        onAddTag={onAddTag}
        onRemoveNewTag={onRemoveNewTag}
      />
    </div>
  );
}
