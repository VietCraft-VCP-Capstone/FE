export interface SearchFilters {
  category: string;
  productType: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
  inStockOnly: boolean;
}

export type UpdateQuery = (updates: Record<string, string | number | boolean | undefined | null>) => void;

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  READY_TO_SHIP: 'Thủ công có sẵn',
  POD_TEMPLATE: 'In theo yêu cầu (POD)',
};
