import type { ProductDeal } from '../../../product/services/productsService';

/**
 * Dữ liệu hiển thị "giá tốt với mã" trên thẻ sản phẩm. Giá tính ở BE (DealsService) bằng đúng công thức
 * thanh toán; FE chỉ đổi sang dạng thẻ cần, không tự tính lại.
 */
export interface Deal {
  id: string;
  /** Giá sau khi áp mã. */
  price: number;
  /** Giá thanh toán khi chưa áp mã. */
  oldPrice: number;
  /** Nhãn ngắn: "-30K", "-15%". */
  discount: string;
  badge: 'FLASH SALE' | 'ƯU ĐÃI';
  couponCode: string;
  couponTitle?: string;
}

export function toDeal(d: ProductDeal): Deal {
  return {
    id: d.productId,
    price: d.finalPrice,
    oldPrice: d.basePrice,
    discount: d.label,
    badge: d.badge === 'FLASH_SALE' ? 'FLASH SALE' : 'ƯU ĐÃI',
    couponCode: d.couponCode,
    couponTitle: d.couponTitle,
  };
}
