import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { ProductFormData, ProductItem } from '../../types/product';
import { withCommission } from '../../../../shared/utils/commission';
import { SearchProductCard } from '../../../buyer/components/search/SearchProductCard';
import { ProductPreviewModal } from './ProductPreviewModal';

export const PREVIEW_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f5f5f4"/>' +
      '<text x="200" y="208" text-anchor="middle" font-family="Inter,sans-serif" font-size="20" fill="#a8a29e">Chưa có ảnh</text></svg>'
  );

interface ProductFormPreviewProps {
  formData: ProductFormData;
  commissionPercent: number | null;
  tagNames: string[];
  shopName?: string;
}

function toPreviewProduct(f: ProductFormData, percent: number | null, tagNames: string[], shopName?: string): ProductItem {
  const images = f.images.length ? f.images : [PREVIEW_PLACEHOLDER];
  const price = f.price > 0 && percent !== null ? withCommission(f.price, percent) : f.price || 0;
  return {
    id: 'preview',
    sku: f.sku,
    title: f.title.trim() || 'Tên sản phẩm của bạn',
    category: f.category,
    tags: tagNames,
    price,
    stock: f.stock,
    stockValue: 0,
    status: f.status,
    location: f.location,
    rank: f.rank,
    description: f.description,
    thumbnail: f.thumbnail || images[0],
    images,
    colors: f.colors,
    sizes: f.sizes,
    engagementTrend: [],
    inventoryTrends: [],
    shopInfo: { id: '', name: shopName || 'Gian hàng của bạn', rating: 0 },
    createdAt: '',
    updatedAt: '',
  };
}

export function ProductFormPreview({ formData, commissionPercent, tagNames, shopName }: ProductFormPreviewProps) {
  const [open, setOpen] = useState(false);
  const product = toPreviewProduct(formData, commissionPercent, tagNames, shopName);

  return (
    <div>
      <p className="m-0 mb-2 text-xs font-medium text-stone-600">Người mua sẽ thấy ở trang tìm kiếm</p>
      <SearchProductCard product={product} isFavorited={false} onToggleFavorite={(_id, _title, e) => e.stopPropagation()} onClick={() => setOpen(true)} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-stone-300 bg-white text-[13px] font-semibold text-stone-800 transition-colors hover:border-[#007700] hover:text-[#007700] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700]"
      >
        <Maximize2 size={14} aria-hidden /> Xem trước trang sản phẩm
      </button>
      {open && <ProductPreviewModal product={product} onClose={() => setOpen(false)} />}
    </div>
  );
}
