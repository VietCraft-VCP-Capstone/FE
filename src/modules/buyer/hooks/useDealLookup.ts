import { useEffect, useMemo, useRef, useState } from 'react';
import { productsService, type ProductDeal } from '../../product/services/productsService';
import { toDeal, type Deal } from '../components/deals/buildDeals';

/**
 * Tra giá tốt (BE) cho các sản phẩm đang hiển thị. Gộp kết quả theo id nên khi danh sách dài thêm
 * ("Xem thêm", sang trang) chỉ hỏi những id mới. Trả về dữ liệu thô kèm thông số mã.
 */
export function useProductDeals(productIds: string[]): Map<string, ProductDeal> {
  const [deals, setDeals] = useState<Map<string, ProductDeal>>(new Map());
  const asked = useRef<Set<string>>(new Set());
  const mounted = useRef(true);
  const key = productIds.join(',');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const fresh = [...new Set(productIds.filter((id) => id && !asked.current.has(id)))];
    if (fresh.length === 0) return;
    fresh.forEach((id) => asked.current.add(id));
    // Không huỷ khi danh sách đổi: id đã đánh dấu "đã hỏi" thì kết quả phải được ghi nhận.
    productsService.lookupDeals(fresh).then((found) => {
      if (!mounted.current) return;
      const entries = Object.values(found);
      if (entries.length === 0) return;
      setDeals((prev) => {
        const next = new Map(prev);
        entries.forEach((d) => next.set(d.productId, d));
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return deals;
}

/** Như useProductDeals nhưng ở dạng thẻ sản phẩm cần. */
export function useDealLookup(productIds: string[]): Map<string, Deal> {
  const raw = useProductDeals(productIds);
  return useMemo(() => new Map([...raw].map(([id, d]) => [id, toDeal(d)])), [raw]);
}
