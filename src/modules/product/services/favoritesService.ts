import api from '../../../infrastructure/api/interceptors';

export interface FavoritesResponse {
    _id?: string;
    user_id?: string;
    product_ids: any[];
}

export const favoritesService = {
    getFavorites: async (): Promise<FavoritesResponse> => {
        const res = await api.get('/favorites');
        return res.data?.data || res.data;
    },

    toggleFavorite: async (productId: string): Promise<any> => {
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
