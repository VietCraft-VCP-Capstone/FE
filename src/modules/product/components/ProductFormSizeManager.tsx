import { ApparelSizeManager } from './ApparelSizeManager';
import { ShoeSizeManager } from './ShoeSizeManager';
import { GeneralSizeManager } from './GeneralSizeManager';

export { ApparelSizeManager } from './ApparelSizeManager';
export { ShoeSizeManager } from './ShoeSizeManager';
export { GeneralSizeManager } from './GeneralSizeManager';

export type ProductFormCategoryType = 'apparel' | 'shoes' | 'general';

export interface ProductFormSizeManagerProps {
  sizes: string[];
  onChangeSizes: (sizes: string[]) => void;
  categoryType?: ProductFormCategoryType;
  categoryName?: string;
  isApparel?: boolean;
}

export function ProductFormSizeManager({
  sizes,
  onChangeSizes,
  categoryType,
  categoryName = '',
  isApparel = false,
}: ProductFormSizeManagerProps) {
  let effectiveType: ProductFormCategoryType = categoryType || 'general';

  if (!categoryType) {
    if (isApparel) {
      effectiveType = 'apparel';
    } else if (categoryName) {
      const lower = categoryName.toLowerCase();
      const shoeKeywords = ['giày', 'giay', 'dép', 'dep', 'guốc', 'guoc', 'sneaker', 'sandal', 'boot', 'boots', 'loafer', 'footwear'];
      if (shoeKeywords.some((k) => lower.includes(k))) {
        effectiveType = 'shoes';
      } else {
        const apparelKeywords = [
          'áo', 'ao', 'quần', 'quan', 'hoodie', 't-shirt', 'tshirt', 'polo', 'tank top', 'shirt',
          'váy', 'vay', 'đầm', 'dam', 'khoác', 'jacket', 'jean', 'quần áo', 'trang phục', 'apparel', 'fashion'
        ];
        if (apparelKeywords.some((k) => lower.includes(k))) {
          effectiveType = 'apparel';
        }
      }
    }
  }

  if (effectiveType === 'shoes') {
    return <ShoeSizeManager sizes={sizes} onChangeSizes={onChangeSizes} />;
  }

  if (effectiveType === 'apparel') {
    return <ApparelSizeManager sizes={sizes} onChangeSizes={onChangeSizes} />;
  }

  return (
    <GeneralSizeManager
      sizes={sizes}
      onChangeSizes={onChangeSizes}
      categoryName={categoryName}
    />
  );
}
