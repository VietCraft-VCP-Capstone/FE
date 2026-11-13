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

/** 1 dòng bảng phân loại: mẫu (set/lẻ/combo) × size, giá người bán nhận + kho riêng. */
export interface ProductSkuRow {
  option: string;
  image?: string;
  size?: string;
  price: number;
  stock: number;
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
  /** Tên các thẻ đang gắn — BE trả về từ product.tags. */
  tags?: string[];
  materials?: string[];
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
  sizes?: string[];
  variants?: {
    id: string;
    name: string;
    color?: string;
    size?: string;
    material?: string;
    price: number;
    stock: number;
    mockupImage?: string;
  }[];
  /** 'SKU' = seller khai bảng phân loại; không có = kiểu màu + chia đều kho. */
  variantMode?: 'SKU';
  engagementTrend: number[]; // 5-7 data points for sparkline
  inventoryTrends: InventoryTrendPoint[]; // Timeline points for detail line chart
  /** BE luôn trả kèm (xem BE product.dto.ts: ProductItemResponseDTO.shopInfo). */
  shopInfo?: {
    id: string;
    name: string;
    logo?: string;
    rating: number;
  };
  sellerId?: string;
  rating?: number;
  ratingCount?: number;
  productType?: string;
  soldCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** Danh mục / thẻ do admin quản lý, seller chỉ chọn chứ không tạo. */
export interface CatalogOption {
  _id: string;
  name: string;
  slug?: string;
  color?: string;
  /** Chỉ có ở thẻ: số sản phẩm cùng nhóm danh mục đang dùng thẻ này. */
  related_count?: number;
}

export interface ProductFormData {
  title: string;
  /** Tên danh mục — giữ để hiển thị; nguồn sự thật gửi lên BE là categoryId. */
  category: string;
  categoryId: string;
  tagIds: string[];
  newTagNames?: string[];
  materials?: string[];
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
  sizes?: string[];
  /** Có mảng này (kể cả rỗng) = đang dùng bảng phân loại thay cho màu. */
  skus?: ProductSkuRow[];
}

export type ProductSortOption = 
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'stock_desc'
  | 'stock_asc'
  | 'rank_asc';

export interface ProductFilterState {
  /** Lọc theo gian hàng (BE: GET /products?shopId=). Chỉ trang shop dùng tới. */
  shopId?: string;
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
  searchLogId?: string;
}

export interface SearchFilterState {
  q?: string;
  category?: string;
  productType?: string;
  rating?: number | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  sort?: string;
  page?: number;
  limit?: number;
  inStockOnly?: boolean;
}

export interface SuggestResult {
  keywords: string[];
  shops: Array<{
    id: string;
    name: string;
    slug: string;
    logo?: string;
    reputationScore: number;
    reputationTier: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

