export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export const CATEGORIES_LIST = [
  'Áo thun (T-Shirt)',
  'Áo Hoodie & Nỉ',
  'Áo Polo',
  'Áo sơ mi & Tank top',
  'Túi Tote & Canvas',
  'Mũ & Nón thêu',
  'Phụ kiện & Quà tặng'
] as const;

export interface ProductColorVariant {
  name: string;
  hex: string;
}

export interface InventoryTrendPoint {
  date: string;
  stock: number;
}

export interface ProductItem {
  id: string;
  sku: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  stockValue: number;
  status: ProductStatus;
  location: string;
  rank: number;
  description: string;
  thumbnail: string;
  images: string[];
  colors: ProductColorVariant[];
  engagementTrend: number[]; // 5-7 data points for sparkline
  inventoryTrends: InventoryTrendPoint[]; // Timeline points for detail line chart
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  title: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  location: string;
  rank: number;
  status: ProductStatus;
  description: string;
  thumbnail: string;
  images: string[];
  colors: ProductColorVariant[];
}

export type ProductSortOption = 
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'stock_desc'
  | 'stock_asc'
  | 'rank_asc';

export interface ProductFilterState {
  search: string;
  status: ProductStatus | 'ALL';
  category: string;
  sort: ProductSortOption;
  page: number;
  pageSize: number;
}

export interface PaginatedProductsResult {
  items: ProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
