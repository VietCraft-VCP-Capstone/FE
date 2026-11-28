import { removeVietnameseTones } from '../../../../shared/components/AddressSelector';
import type { MoneyReport } from '../../moneyTypes';

type Product = MoneyReport['by_product'][number];

export function filterProducts(products: Product[], query: string, negativeOnly: boolean, refundOnly = false): Product[] {
  const q = removeVietnameseTones(query);
  return products.filter(p => (!negativeOnly || p.net_vnd < 0) && (!refundOnly || (p.refund_vnd ?? 0) > 0) && (!q || removeVietnameseTones(p.title).includes(q)));
}
