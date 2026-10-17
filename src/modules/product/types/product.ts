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
  /** Tên các thẻ đang gắn — BE trả về từ product.tags. */
  tags?: string[];
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
  createdAt: string;
  updatedAt: string;
}

/** Danh mục / thẻ do admin quản lý, seller chỉ chọn chứ không tạo. */
export interface CatalogOption {
  _id: string;
  name: string;
  slug?: string;
  color?: string;
}

export interface ProductFormData {
  title: string;
  /** Tên danh mục — giữ để hiển thị; nguồn sự thật gửi lên BE là categoryId. */
  category: string;
  categoryId: string;
  tagIds: string[];
  newTagNames?: string[];
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
}
