import api from '../../../infrastructure/api/interceptors';

export interface ReviewItem {
  id: string;
  name: string;
  date: string;
  rating: number;
  avatar: string;
  text: string;
  images: string[];
  comment?: string;
  createdAt?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  reviewCount: number;
  breakdown: Record<string, number>;
  percentages: Record<string, string>;
  percentageNumbers?: Record<string, number>;
}

export interface ProductReviewsResponse {
  summary: ReviewSummary;
  items: ReviewItem[];
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const reviewService = {
  getProductReviews: async (productId: string): Promise<ProductReviewsResponse> => {
    try {
      const res = await api.get(`/products/${productId}/reviews`);
      return res.data;
    } catch {
      const res = await api.get(`/reviews/product/${productId}`);
      return res.data;
    }
  },

  createReview: async (data: { orderId: string; productId: string; rating: number; comment: string; images?: string[] }) => {
    const res = await api.post('/reviews', data);
    return res.data;
  },

  getOrderProductReview: async (orderId: string, productId: string) => {
    const res = await api.get(`/reviews/order/${orderId}/product/${productId}`);
    return res.data;
  },

  uploadReviewImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/reviews/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  }
};

export default reviewService;
