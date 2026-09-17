import api from '../../../infrastructure/api/interceptors';

export interface FavoritesResponse {
    _id?: string;
    user_id?: string;
    product_ids: any[];
}

export interface ToggleFavoriteResponse {
    success: boolean;
    isFavorite: boolean;
    message: string;
    wishlist?: FavoritesResponse;
}

export const favoritesService = {
    getFavorites: async (): Promise<FavoritesResponse> => {
        const res = await api.get('/favorites');
        return res.data?.data || res.data || { product_ids: [] };
    },

    getFavoriteIds: async (): Promise<string[]> => {
        try {
            const favs = await favoritesService.getFavorites();
            const list = favs?.product_ids || [];
            return list.map((item: any) => (item?._id || item?.id || item)?.toString()).filter(Boolean);
        } catch {
            return [];
        }
    },

    toggleFavorite: async (productId: string): Promise<ToggleFavoriteResponse> => {
        const res = await api.post('/favorites/toggle', { productId });
        return res.data;
    },

    addFavorite: async (productId: string): Promise<FavoritesResponse> => {
        const res = await api.post(`/favorites/${productId}`);
        return res.data?.data || res.data;
    },

    removeFavorite: async (productId: string): Promise<FavoritesResponse> => {
        const res = await api.delete(`/favorites/${productId}`);
        return res.data?.data || res.data;
    }
};

export default favoritesService;

