export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _level?: number;
  children?: Category[];
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  color: string;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ModerateProduct {
  id: string;
  title: string;
  description: string;
  images: string[];
  shop_id: string;
  shop_name: string;
  seller_id: string;
  created_at: string;
  categories: Category[];
  tags: Tag[];
  status: 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT';
  unpublish_reason?: string;
}

export interface ModerationAction {
  id: string;
  product_id: string;
  reviewer_id: string;
  reviewer_name: string;
  action: 'approve' | 'reject' | 'unpublish' | 'republish';
  notes?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface ModerationStats {
  published: number;
  unpublished: number;
  draft: number;
  total: number;
}

export interface PendingProductsResponse {
  products: ModerateProduct[];
  total: number;
  page: number;
  limit: number;
}
