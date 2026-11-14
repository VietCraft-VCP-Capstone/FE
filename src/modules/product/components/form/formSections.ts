import { ProductFormData } from '../../types/product';

export type NavState = 'done' | 'todo' | 'error';

export interface FormNavItem {
  id: string;
  label: string;
  meta: string;
  state: NavState;
}

const state = (hasError: boolean, done: boolean): NavState => (done ? 'done' : hasError ? 'error' : 'todo');

export function buildFormNav(f: ProductFormData, newTagCount: number, errors: Record<string, string>): FormNavItem[] {
  const tagCount = f.tagIds.length + newTagCount;
  const variantCount = f.colors.length + (f.sizes?.length || 0);
  return [
    {
      id: 'pf-images',
      label: 'Hình ảnh',
      meta: f.images.length ? `${f.images.length} ảnh` : 'Chưa có ảnh',
      state: state(false, f.images.length > 0),
    },
    {
      id: 'pf-basic',
      label: 'Thông tin cơ bản',
      meta: 'Tên, danh mục, thẻ',
      state: state(Boolean(errors.title || errors.category || errors.tags), Boolean(f.title.trim() && f.categoryId && tagCount > 0)),
    },
    {
      id: 'pf-pricing',
      label: 'Giá và kho',
      meta: 'Giá bán, tồn kho, trạng thái',
      state: state(Boolean(errors.price || errors.stock), f.price > 0 && f.stock >= 0),
    },
    {
      id: 'pf-variants',
      label: 'Phân loại',
      meta: variantCount ? `${variantCount} lựa chọn` : 'Không bắt buộc',
      state: state(false, variantCount > 0),
    },
    {
      id: 'pf-details',
      label: 'Chi tiết',
      meta: 'Chất liệu, xuất xứ, SKU',
      state: state(false, Boolean((f.materials?.length || 0) > 0 || f.material?.trim() || f.location.trim())),
    },
    {
      id: 'pf-description',
      label: 'Mô tả',
      meta: f.description.trim() ? `${f.description.trim().length} ký tự` : 'Chưa viết',
      state: state(false, Boolean(f.description.trim())),
    },
  ];
}
