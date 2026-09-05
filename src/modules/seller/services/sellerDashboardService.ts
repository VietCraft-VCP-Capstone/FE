import { productsService } from '../../product/services/productsService';
import { sellerSettingsService } from './sellerSettingsService';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';
import type { ProductItem } from '../../product/types/product';
import type { SellerSettingsState } from '../types/settings';

const PAGE_SIZE = 200;
const MAX_PAGES = 2;

export const LOW_STOCK_THRESHOLD = 5;

export interface SellerOverviewData {
  products: ProductItem[];
  productsLoaded: number;
  productsTotal: number;
  settings: SellerSettingsState | null;
  failures: string[];
}

export const sellerDashboardService = {
  async loadOverview(): Promise<SellerOverviewData> {
    const [productsRes, settingsRes] = await Promise.allSettled([
      loadAllMyProducts(),
      sellerSettingsService.getSettings(),
    ]);

    const failures: string[] = [];
    if (productsRes.status === 'rejected') {
      failures.push(`Sản phẩm: ${getApiErrorMessage(productsRes.reason, 'Không tải được danh sách sản phẩm.')}`);
    }
    if (settingsRes.status === 'rejected') {
      failures.push(`Thông tin gian hàng: ${getApiErrorMessage(settingsRes.reason, 'Không tải được cài đặt.')}`);
    }

    const products = productsRes.status === 'fulfilled' ? productsRes.value.items : [];

    return {
      products,
      productsLoaded: products.length,
      productsTotal: productsRes.status === 'fulfilled' ? productsRes.value.total : 0,
      settings: settingsRes.status === 'fulfilled' ? settingsRes.value : null,
      failures,
    };
  },
};

async function loadAllMyProducts(): Promise<{ items: ProductItem[]; total: number }> {
  const items: ProductItem[] = [];
  let total = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await productsService.getMine({ page, pageSize: PAGE_SIZE, sort: 'newest' });
    total = Number(res.total) || total;
    items.push(...res.items);
    if (res.items.length < PAGE_SIZE || items.length >= total) break;
  }

  return { items, total };
}

export interface CategoryValue {
  category: string;
  count: number;
  value: number;
}

export interface SellerMetrics {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
  inventoryValue: number;
  lowStock: ProductItem[];
  outOfStockItems: ProductItem[];
  missingImages: ProductItem[];
  byCategory: CategoryValue[];
}

export function deriveSellerMetrics(products: ProductItem[]): SellerMetrics {
  const active = products.filter(p => p.status === 'ACTIVE');
  const inactive = products.filter(p => p.status === 'INACTIVE');
  const outOfStockItems = products.filter(p => p.status === 'OUT_OF_STOCK');

  const inventoryValue = products.reduce((sum, p) => sum + (Number(p.stockValue) || 0), 0);

  const lowStock = active
    .filter(p => Number(p.stock) > 0 && Number(p.stock) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => Number(a.stock) - Number(b.stock));

  const missingImages = products.filter(p => {
    const first = p.thumbnail || p.images?.[0] || '';
    return !first || first.includes('images.unsplash.com');
  });

  const catMap = new Map<string, CategoryValue>();
  for (const p of products) {
    const category = p.category?.trim() || 'Chưa phân loại';
    const entry = catMap.get(category) || { category, count: 0, value: 0 };
    entry.count++;
    entry.value += Number(p.stockValue) || 0;
    catMap.set(category, entry);
  }

  return {
    total: products.length,
    active: active.length,
    inactive: inactive.length,
    outOfStock: outOfStockItems.length,
    inventoryValue,
    lowStock,
    outOfStockItems,
    missingImages,
    byCategory: [...catMap.values()].sort((a, b) => b.value - a.value),
  };
}

export interface PriceBucket {
  from: number;
  to: number;
  count: number;
}

export interface PriceStats {
  priced: number;
  min: number;
  median: number;
  max: number;
  step: number;
  buckets: PriceBucket[];
}

function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

const TARGET_BUCKETS = 6;
const MAX_BUCKETS = 8;

export function derivePriceStats(products: ProductItem[]): PriceStats | null {
  const prices = products
    .map(p => Number(p.price) || 0)
    .filter(v => v > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const min = prices[0];
  const max = prices[prices.length - 1];
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 === 0 ? Math.round((prices[mid - 1] + prices[mid]) / 2) : prices[mid];

  if (max === min) {
    return { priced: prices.length, min, median, max, step: 0, buckets: [{ from: min, to: min, count: prices.length }] };
  }

  const step = niceStep((max - min) / TARGET_BUCKETS);
  const start = Math.floor(min / step) * step;
  const bucketCount = Math.min(MAX_BUCKETS, Math.max(1, Math.ceil((max - start) / step) + (max % step === 0 ? 1 : 0)));

  const buckets: PriceBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    from: start + i * step,
    to: start + (i + 1) * step,
    count: 0,
  }));

  for (const price of prices) {
    const index = Math.min(bucketCount - 1, Math.floor((price - start) / step));
    buckets[index].count++;
  }

  return { priced: prices.length, min, median, max, step, buckets };
}

export interface SetupTask {
  key: string;
  label: string;
  done: boolean;
  to: string;
}

export function deriveSetupTasks(settings: SellerSettingsState | null): SetupTask[] {
  const brand = settings?.brand;
  const shipping = settings?.shipping;
  const payment = settings?.payment;
  const filled = (v?: string) => Boolean(v && v.trim());

  return [
    { key: 'name', label: 'Đặt tên gian hàng', done: filled(brand?.storeName), to: '/seller/settings' },
    { key: 'desc', label: 'Viết giới thiệu gian hàng', done: filled(brand?.description), to: '/seller/settings' },
    { key: 'logo', label: 'Tải logo thương hiệu', done: filled(brand?.logoUrl), to: '/seller/settings' },
    { key: 'contact', label: 'Bổ sung hotline liên hệ', done: filled(brand?.hotline), to: '/seller/settings' },
    {
      key: 'pickup',
      label: 'Khai báo địa chỉ lấy hàng',
      done: filled(shipping?.senderPhone) && filled(shipping?.province),
      to: '/seller/settings',
    },
    {
      key: 'bank',
      label: 'Thêm tài khoản nhận tiền',
      done: (payment?.bankAccounts?.length || 0) > 0,
      to: '/seller/settings',
    },
  ];
}
