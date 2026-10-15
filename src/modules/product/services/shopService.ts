import api from '../../../infrastructure/api/interceptors';

export interface ShopDetail {
  id: string;
  _id?: string;
  name: string;
  shopName: string;
  slug: string;
  logo: string;
  banner: string;
  description: string;
  slogan?: string;
  address?: string;
  city?: string;
  province?: string;
  rating: number;
  averageRating: number;
  ratingCount: number;
  listingCount: number;
  followersCount: number;
  isFollowing: boolean;
  createdAt?: string | Date;
}

export const shopService = {
  getById: async (shopIdOrSlug: string): Promise<ShopDetail> => {
    const res = await api.get(`/shops/${shopIdOrSlug}`);
    return res.data;
  },

  follow: async (shopId: string) => {
    const res = await api.post(`/shops/${shopId}/follow`);
    return res.data;
  },

  unfollow: async (shopId: string) => {
    const res = await api.delete(`/shops/${shopId}/follow`);
    return res.data;
  },

  getFollowedShops: async (): Promise<ShopDetail[]> => {
    const res = await api.get('/shops/following/me');
    return res.data;
  }
};

export default shopService;
